import { Vehicle } from "../../models/driver/vehicleModel.js";

// GET /api/vehicles/live
export const getLiveVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}, "plateNumber status currentLocation speed fuelLevel");
    res.json({ success: true, data: vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/vehicles/list
export const getVehicleList = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}, "internalId plateNumber currentLocation speed fuelLevel status");
    res.json({ success: true, data: vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/vehicles/:id
export const getVehicleDetails = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("driver", "name email phone");
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });
    res.json({ success: true, data: vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


