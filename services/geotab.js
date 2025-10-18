// services/geotabService.js
import axios from "axios";
import HOSLog from "../models/driver/hosManagement.js";
import { Vehicle } from "../models/driver/vehicleModel.js";
import { Trailer } from "../models/driver/trailerModel.js";

const DATABASE = process.env.GEO_TAB_DB;
const USERNAME = process.env.GEO_TAB_USER_NAME;
const PASSWORD = process.env.GEO_TAB_PASSWORD;

let cachedSession = null;

export async function authenticate() {

  if (cachedSession && cachedSession.expiry > Date.now()) {

    return cachedSession;

  }

  const authRes = await axios.post("https://my.geotab.com/apiv1", {
    method: "Authenticate",
    params: { database: DATABASE, userName: USERNAME, password: PASSWORD },
  });

  const credentials = authRes?.data?.result;

  if (!credentials) throw new Error("Authentication failed");

  const { sessionId, userName, database } = credentials.credentials;

  const server = credentials.path === "ThisServer" ? "my.geotab.com" : credentials.path;

  cachedSession = { sessionId, userName, database, server, expiry: Date.now() + 15 * 60 * 1000 };

  return cachedSession;
}

// Fetch single vehicle status from Geotab and update MongoDB
export async function updateVehicleById(internalId) {
  const session = await authenticate();

  const res = await axios.post(
    `https://${session.server}/apiv1`,
    {
      method: "Get",
      params: { typeName: "Device", search: { id: internalId } },
    },
    { headers: { "Geotab-SessionId": session.sessionId } }
  );

  const gv = res.data?.result?.[0];
  if (!gv) return null;

  const updatedVehicle = await Vehicle.findOneAndUpdate(
    { internalId },
    {
      status: gv.status || "stopped",
      speed: gv.speed || 0,
      engineOn: gv.engineOn || false,
      fuelLevel: gv.fuelLevel || 0,
      odometer: gv.odometer || 0,
      driverBehaviour: gv.driverBehaviour || {},
      engineHealth: gv.engineHealth || {},
      currentLocation: {
        latitude: gv.latitude || 0,
        longitude: gv.longitude || 0,
        address: gv.address || "",
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).populate("driver",'name'); // ✅ populate all driver details
console.log(updatedVehicle)
  return updatedVehicle;
}

// Fetch single trailer status from Geotab and update MongoDB
export async function updateTrailerById(internalId) {
  const session = await authenticate();

  const res = await axios.post(
    `https://${session.server}/apiv1`,
    {
      method: "Get",
      params: { typeName: "Device", search: { id: internalId } },
    },
    { headers: { "Geotab-SessionId": session.sessionId } }
  );

  const gt = res.data?.result?.[0];
  if (!gt) return null;

  const updatedTrailer = await Trailer.findOneAndUpdate(
    { internalId },
    {
      status: gt.status || "stopped",
      speed: gt.speed || 0,
      currentLocation: {
        latitude: gt.latitude || 0,
        longitude: gt.longitude || 0,
        address: gt.address || "",
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).populate("attachedVehicle", 'plateNumber make model driver')
   .populate("attachedVehicle.driver", 'name');

  console.log('Trailer updated from Geotab:', updatedTrailer);
  return updatedTrailer;
}

// Fetch vehicles from Geotab
export async function fetchGeotabVehicles() {
  const session = await authenticate();

  const res = await axios.post(`https://${session.server}/apiv1`, {
    method: "Get",
    params: { typeName: "Device" },
  }, {
    headers: { "Geotab-SessionId": session.sessionId }
  });

  return res.data?.result || [];
}

// Update vehicles in MongoDB
export async function updateVehiclesInDB() {
  const geotabVehicles = await fetchGeotabVehicles();
  const vehicleData = [];

  for (const gv of geotabVehicles) {
    const updatedVehicle = await Vehicle.findOneAndUpdate(
      { internalId: gv.id },
      {
        status: gv.status || "stopped",
        speed: gv.speed || 0,
        engineOn: gv.engineOn || false,
        currentLocation: {
          latitude: gv.latitude || 0,
          longitude: gv.longitude || 0,
          address: gv.address || "",
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    vehicleData.push(updatedVehicle);
  }

  return vehicleData;
}

/** Fetch latest status bundle for a vehicle */
export async function fetchVehicleData(vehicleId) {
  const { sessionId, userName, database, server } = await authenticate();

  // Latest log (location + speed)
  const locationRes = await axios.post(`https://${server}/apiv1`, {
    method: "Get",
    params: {
      typeName: "LogRecord",
      search: { deviceSearch: { id: vehicleId } },
      resultsLimit: 1,
      credentials: { database, sessionId, userName },
    },
  });

  const latestLog = locationRes?.data?.result?.[0] || {};

  // StatusData (fuel, idling, harsh braking, etc.)
  const statusRes = await axios.post(`https://${server}/apiv1`, {
    method: "Get",
    params: {
      typeName: "StatusData",
      search: { deviceSearch: { id: vehicleId }, fromDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
      resultsLimit: 50,
      credentials: { database, sessionId, userName },
    },
  });

  const statusData = statusRes?.data?.result || [];

  // Fault data (engine health)
  const faultRes = await axios.post(`https://${server}/apiv1`, {
    method: "Get",
    params: {
      typeName: "FaultData",
      search: { deviceSearch: { id: vehicleId } },
      resultsLimit: 10,
      credentials: { database, sessionId, userName },
    },
  });

  const faults = faultRes?.data?.result || [];

  // Trip history (last 1 trip)
  const tripRes = await axios.post(`https://${server}/apiv1`, {
    method: "Get",
    params: {
      typeName: "Trip",
      search: { deviceSearch: { id: vehicleId }, fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      resultsLimit: 1,
      credentials: { database, sessionId, userName },
    },
  });

  const trips = tripRes?.data?.result || [];

  // Extract metrics
  const driverBehaviour = {

    harshBraking: statusData.filter((s) => s.diagnostic?.name?.includes("Braking")).length,
    speedingEvents: statusData.filter((s) => s.diagnostic?.name?.includes("Speed")).length,
    idlingDuration: statusData
      .filter((s) => s.diagnostic?.name?.includes("Idling"))
      .reduce((sum, s) => sum + (s.data || 0), 0),
  };

  const engineHealth = {
    faultCodes: faults.map((f) => ({ code: f.code, description: f.diagnostic?.name })),
    batteryVoltage: statusData.find((s) => s.diagnostic?.name?.includes("Battery"))?.data || 12,
    engineHours: statusData.find((s) => s.diagnostic?.name?.includes("Engine Hours"))?.data || 0,
  };

  return {
    currentLocation: {
      latitude: latestLog.latitude || null,
      longitude: latestLog.longitude || null,
      address: "", // optionally use Google Maps API reverse geocode
      updatedAt: latestLog.dateTime || new Date(),
    },
    speed: latestLog.speed || 0,
    fuelLevel: statusData.find((s) => s.diagnostic?.name?.includes("Fuel"))?.data || 0,
    odometer: statusData.find((s) => s.diagnostic?.name?.includes("Odometer"))?.data || 0,
    engineOn: !!statusData.find((s) => s.diagnostic?.name?.includes("Engine On")),

    driverBehaviour,
    engineHealth,
    trips: trips.map((t) => ({
      startTime: t.start,
      endTime: t.stop,
      route: t.waypoints?.map((wp) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
        timestamp: wp.dateTime,
      })),
    })),
  };
}


/** Fetch HOS / Duty Status of a driver */
export async function fetchDriverHOS(driverId) {
  const { sessionId, userName, database, server } = await authenticate();

  // Get duty logs
  const res = await axios.post(`https://${server}/apiv1`, {
    method: "Get",
    params: {
      typeName: "DutyStatusLog",
      search: { user: driverId },
      resultsLimit: 50, // last 50 logs
      credentials: { database, sessionId, userName },
    },
  });

  const logs = res?.data?.result || [];

  // Calculate total hours
  let totalDrivingHours = 0,
    totalOnDutyHours = 0,
    totalOffDutyHours = 0;

  logs.forEach((log) => {
    const duration = (new Date(log.endTime) - new Date(log.startTime)) / (1000 * 60 * 60);
    if (log.status === "Driving") totalDrivingHours += duration;
    else if (log.status === "OnDuty") totalOnDutyHours += duration;
    else if (log.status === "OffDuty") totalOffDutyHours += duration;
  });

  const violation = totalDrivingHours > 13; // Canada HOS rule

  return {
    driverId,
    totalDrivingHours,
    totalOnDutyHours,
    totalOffDutyHours,
    violation,
    logs: logs.map((l) => ({
      status: l.status,
      startTime: l.startTime,
      endTime: l.endTime,
    })),
  };
}

export async function fetchAndSaveDriverHOS(driverId, vehicleId = null) {
  const hos = await fetchDriverHOS(driverId); // your existing Geotab fetch function

  // Prepare log for today
  const today = new Date();
  
  today.setHours(0, 0, 0, 0);

  // Upsert (update if exists, insert if not)
  const savedLog = await HOSLog.findOneAndUpdate(
    { driverId, date: today },
    {
      driverId,
      vehicleId,
      date: today,
      totalDrivingHours: hos.totalDrivingHours,
      totalOnDutyHours: hos.totalOnDutyHours,
      totalOffDutyHours: hos.totalOffDutyHours,
      violations: hos.violation,
      logs: hos.logs,
    },
    { upsert: true, new: true }
  );

  return savedLog;
}