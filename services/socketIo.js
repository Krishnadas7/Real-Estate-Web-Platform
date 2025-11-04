// socket.js
import { Server } from "socket.io";
import Load from "../models/loadModel.js";
import { haversineDistance } from "../utils/distance.js";
import { updateVehiclesInDB,updateVehicleById,updateTrailerById } from "./geotab.js";
import { Vehicle } from "../models/driver/vehicleModel.js";
import { Trailer } from "../models/driver/trailerModel.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["*"],
    },
    transports: ['polling', 'websocket'], // Polling first for better compatibility, then upgrade to websocket
    allowEIO3: true, // Allow Engine.IO v3 clients
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    upgradeTimeout: 10000, // 10 seconds
    maxHttpBufferSize: 1e8, // 100 MB
    // Add path for socket.io
    path: '/socket.io/',
  });

  console.log('🔌 Socket.IO server initialized and listening for connections');
  console.log('🔌 Socket.IO transports:', ['polling', 'websocket']);
  console.log('🔌 Socket.IO path: /socket.io/');
  console.log('🔌 CORS enabled for all origins');
  
  // Log when server is ready
  io.engine.on("connection_error", (err) => {
    console.error("❌ Socket.IO connection error:", err);
    console.error("   Error details:", {
      type: err.type,
      description: err.description,
      context: err.context
    });
    console.error("   Common causes:");
    console.error("   - Client and server on different networks");
    console.error("   - Firewall blocking port 3000");
    console.error("   - Incorrect socket URL in mobile app");
  });

  // Log transport upgrade
  io.engine.on("upgrade", (socket) => {
    console.log(`✅ Socket ${socket.id} upgraded transport`);
  });

  // Track connected clients
  let connectedClients = 0;

  io.on("connection", async (socket) => {
    connectedClients++;
    console.log(`✅ Client connected: ${socket.id}`);
    console.log(`📊 Total connected clients: ${connectedClients}`);
    console.log(`📡 Client transport: ${socket.conn.transport.name}`);
    console.log(`🌐 Client address: ${socket.handshake.address}`);
    
    let intervalId = null;
    let selectedVehicleId = null;
    let selectedTrailerId = null;

    // Join vehicle and start updates every 3 seconds
    socket.on("joinVehicle", async (vehicleId) => {
      selectedVehicleId = vehicleId;
      selectedTrailerId = null; // Clear trailer selection
      console.log(`🚗 Client ${socket.id} joined vehicle room: ${vehicleId}`);

      // Clear old interval if any
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      // Send initial vehicle location immediately
      try {
        const initialVehicle = await updateVehicleById(selectedVehicleId);
        if (initialVehicle) {
          socket.emit("vehicleLocation", initialVehicle);
        }
      } catch (err) {
        console.error(`❌ Error fetching initial vehicle location:`, err.message);
        // Try to get from DB using internalId
        try {
          const vehicle = await Vehicle.findOne({ internalId: selectedVehicleId }).populate("driver");
          if (vehicle) {
            socket.emit("vehicleLocation", vehicle);
          } else {
            console.warn(`⚠️ Vehicle not found in DB with internalId: ${selectedVehicleId}`);
          }
        } catch (dbErr) {
          console.error(`❌ Error fetching vehicle from DB:`, dbErr.message);
        }
      }

      // Start interval for regular updates every 3 seconds
      intervalId = setInterval(async () => {
        if (!selectedVehicleId) return;

        try {
          const vehicle = await updateVehicleById(selectedVehicleId);

          if (!vehicle) {
            // Vehicle not found, stop updates
            clearInterval(intervalId);
            intervalId = null;
            console.log(`⚠️ Vehicle ${selectedVehicleId} not found, stopping updates.`);
            return;
          }

          socket.emit("vehicleLocation", vehicle);

        } catch (err) {
          // On error, send last known vehicle if exists
          try {
            const vehicle = await Vehicle.findOne({ internalId: selectedVehicleId }).populate("driver");
            if (vehicle) {
              socket.emit("vehicleLocation", vehicle);
            }
          } catch (dbErr) {
            console.error(`❌ Error fetching vehicle from DB:`, dbErr.message);
          }

          // Stop interval to prevent continuous errors
          clearInterval(intervalId);
          intervalId = null;
          console.error(`❌ Error updating vehicle ${selectedVehicleId}:`, err.message);
        }
      }, 3000);
    });

    // Join trailer and start updates every 3 seconds
    socket.on("joinTrailer", async (trailerId) => {
      selectedTrailerId = trailerId;
      selectedVehicleId = null; // Clear vehicle selection
      console.log('trailer iddd========', trailerId);

      // Clear old interval if any
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      intervalId = setInterval(async () => {
        if (!selectedTrailerId) return;

        try {
          const trailer = await updateTrailerById(selectedTrailerId);

          if (!trailer) {
            // Trailer not found, stop updates
            clearInterval(intervalId);
            intervalId = null;
            console.log(`Trailer ${selectedTrailerId} not found, stopping updates.`);
            return;
          }

          socket.emit("trailerLocation", trailer);

        } catch (err) {
          // On error, send last known trailer if exists
          const trailer = await Trailer.findOne({ internalId: selectedTrailerId })
            .populate("attachedVehicle", 'plateNumber make model driver')
            .populate("attachedVehicle.driver", 'name');
          if (trailer) socket.emit("trailerLocation", trailer);

          // Stop interval to prevent continuous errors
          clearInterval(intervalId);
          intervalId = null;
          console.error(`Error updating trailer ${selectedTrailerId}:`, err.message);
        }
      }, 3000);
    });

    // Leave updates
    socket.on("leaveVehicle", () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      selectedVehicleId = null;
    });

    socket.on("leaveTrailer", () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      selectedTrailerId = null;
    });
    
  
    // join a specific load room
    socket.on("joinLoad", ({ loadId }) => {
      if (!loadId) return;
      socket.join(loadId);
      console.log(`${socket.id} joined room ${loadId}`);
    });

    // driver sends live location
    socket.on("driverLocation", async ({ loadId, latitude, longitude }) => {
      try {
        if (!loadId) return;

        const latStr = String(latitude);
        const lonStr = String(longitude);

        const load = await Load.findById(loadId);
        if (!load) return;

        // Append to history
        load.locationHistory.push({
          latitude: latStr,
          longitude: lonStr,
          timestamp: new Date()
        });

        // Update live location
        load.liveLocation = {
          latitude: latStr,
          longitude: lonStr,
          updatedAt: new Date()
        };

        // Compute traveled distance (sum of segments in history)
        let traveled = 0;
        const history = load.locationHistory;
        for (let i = 1; i < history.length; i++) {
          const prev = history[i - 1];
          const curr = history[i];
          const aLat = parseFloat(prev.latitude);
          const aLon = parseFloat(prev.longitude);
          const bLat = parseFloat(curr.latitude);
          const bLon = parseFloat(curr.longitude);
          if (![aLat, aLon, bLat, bLon].some(Number.isNaN)) {
            traveled += haversineDistance(aLat, aLon, bLat, bLon);
          }
        }

        // Compute total (pickup -> dropoff)
        let totalDistance = 0;
        if (
          load.route &&
          load.route.selectPickup &&
          load.route.selectDropOff &&
          load.route.selectPickup.latitude &&
          load.route.selectPickup.longitude &&
          load.route.selectDropOff.latitude &&
          load.route.selectDropOff.longitude
        ) {
          totalDistance = haversineDistance(
            parseFloat(load.route.selectPickup.latitude),
            parseFloat(load.route.selectPickup.longitude),
            parseFloat(load.route.selectDropOff.latitude),
            parseFloat(load.route.selectDropOff.longitude)
          );
        }

        const remaining = Math.max(totalDistance - traveled, 0);

        await load.save();

        // Emit to all clients in this load room
        io.to(loadId).emit("locationUpdate", {
          loadId,
          latitude: parseFloat(latStr),
          longitude: parseFloat(lonStr),
          traveled: Number(traveled.toFixed(3)),      // km
          totalDistance: Number(totalDistance.toFixed(3)), // km
          remaining: Number(remaining.toFixed(3)),    // km
          history: load.locationHistory
        });
      } catch (err) {
        console.error("driverLocation error:", err);
      }
    });

    socket.on("disconnect", () => {
      connectedClients--;
      console.log(`❌ Client disconnected: ${socket.id}`);
      console.log(`📊 Total connected clients: ${connectedClients}`);
      if (intervalId) clearInterval(intervalId);
    });
  });

  return io;
};
