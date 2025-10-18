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
      methods: ["GET", "POST"]
    }
  });

  io.on("connection",async (socket) => {
    console.log("Client connected:", socket.id);
    let intervalId = null;
    let selectedVehicleId = null;
    let selectedTrailerId = null;

    // Join vehicle and start updates every 3 seconds
   socket.on("joinVehicle", async (vehicleId) => {
  selectedVehicleId = vehicleId;
  selectedTrailerId = null; // Clear trailer selection
  console.log('vehicle iddd========', vehicleId);

  // Clear old interval if any
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  intervalId = setInterval(async () => {
    if (!selectedVehicleId) return;

    try {
      const vehicle = await updateVehicleById(selectedVehicleId);

      if (!vehicle) {
        // Vehicle not found, stop updates
        clearInterval(intervalId);
        intervalId = null;
        console.log(`Vehicle ${selectedVehicleId} not found, stopping updates.`);
        return;
      }

      socket.emit("vehicleLocation", vehicle);

    } catch (err) {
      // On error, send last known vehicle if exists
      const vehicle = await Vehicle.findOne({ _id: selectedVehicleId }).populate("driver");
      if (vehicle) socket.emit("vehicleLocation", vehicle);

      // Stop interval to prevent continuous errors
      clearInterval(intervalId);
      intervalId = null;
      console.error(`Error updating vehicle ${selectedVehicleId}:`, err.message);
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
      console.log("Client disconnected:", socket.id);
      console.log("Client disconnected:", socket.id);
      if (intervalId) clearInterval(intervalId);
    });
  });

  return io;
};
