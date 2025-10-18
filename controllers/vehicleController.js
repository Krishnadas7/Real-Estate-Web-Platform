
import { Vehicle } from "../models/driver/vehicleModel.js"; 
import { User } from "../models/driver/userModel.js";
import { getCoordinatesFromAddress } from "../services/googlemap.js";

// Utility: Haversine formula to calculate distance
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const selectedVehicle = async (req,res) =>{
  try {
    const vehicleId = req.query.vehicleId
    console.log(vehicleId);
    
    const vehicle = await Vehicle.findOne({_id:vehicleId})
    return res.json({success:true,message:"vehicle details",data:vehicle})
  } catch (error) {
    res.status(500).json({success:false, message: "Server error" });
  }
}
export const getVehiclesData = async (req, res) => {
  try {
    const { driverId, filter } = req.query;

    // find driver with location
    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    let vehicles = await Vehicle.find().populate("driver");

    // Case 1: Nearby vehicles
    if (filter === "nearby" && driver.location?.latitude && driver.location?.longitude) {
      const driverLat = parseFloat(driver.location.latitude);
      const driverLon = parseFloat(driver.location.longitude);

      vehicles = vehicles
        .map((vehicle) => {
          const distance = getDistance(
            driverLat,
            driverLon,
            vehicle.coordinates.latitude,
            vehicle.coordinates.longitude
          );
          return { ...vehicle.toObject(), distance };
        })
        .sort((a, b) => a.distance - b.distance);
    }

    // Case 2: Vehicles with Trailer
    else if (filter === "withTrailer") {
      vehicles = vehicles.filter((v) => v.status === "ready-to-load");
      // ⚡ adjust condition depending on how "trailer" is represented in schema
    }

    // Case 3: Default → all vehicles

    return res.json({success:true,message:"vehicles",data:vehicles});
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({success:false, message: "Server error" });
  }
};

// ✅ Create Vehicle
export const createVehicle = async (req, res) => {
  try {
    const {
      internalId,
      plateNumber,
      vinNumber,
      make,
      model,
      year,
      driverId,
      status,
      address,
      trailer
    } = req.body;

    if (!internalId || !plateNumber || !vinNumber || !make || !model || !year) {
      return res
        .status(400)
        .json({ success: false, message: "All required fields must be provided" });
    }

    // Check duplicate plateNumber
    const existing = await Vehicle.findOne({ plateNumber });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Vehicle with this plate number already exists" });
    }

    

    // Handle multiple uploads
    let vehicleImageUrls = [];

    if (req.files) {
      if (req.files.vehicleImages) {
        vehicleImageUrls = req.files.vehicleImages.map((file) =>
          process.env.NODE_ENV === "production"
            ? file.location
            : `${req.protocol}://${req.get("host")}/${file.path}`
        );
      }
    }
     const { longitude,latitude} = await getCoordinatesFromAddress(address)
    // Save to DB
    const vehicle = await Vehicle.create({
      internalId,
      plateNumber,
      vinNumber,
      make,
      model,
      year,
      driver: driverId,
      status,
      currentLocation: {address,longitude,latitude},
      trailer:trailer || null,
      vehicleImage: vehicleImageUrls.map((url) => ({ imageUrl: url })),
    });

    return res.status(201).json({ success: true,message:"Vehicle created", data: vehicle });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



export const getVehicles = async (req, res) => {
  try {
    const { search } = req.query; // ?search=value
    let query = {};

    if (search) {
      query = {
        $or: [
          { internalId: { $regex: search, $options: "i" } },
          { plateNumber: { $regex: search, $options: "i" } },
          { make: { $regex: search, $options: "i" } }, // brand/name
          { model: { $regex: search, $options: "i" } }, // optional: search by model too
        ],
      };
    }

    const vehicles = await Vehicle.find(query).populate("driver");

    return res.status(200).json({
      success: true,
      data:{
        count: vehicles.length,
        vehicles:vehicles
      }
      
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get Vehicle by ID
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("user");
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }
    return res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Vehicle
export const updateVehicle = async (req, res) => {
  try {
    const { plateNumber } = req.body;

    // If updating plateNumber, check for duplicates
    if (plateNumber) {
      const existing = await Vehicle.findOne({ plateNumber, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: "Vehicle with this plate number already exists" });
      }
    }
    // Handle multiple uploads
    let vehicleImageUrls = [];
    let documentUrls = [];

    if (req.files) {
      if (req.files.vehicleImages) {
        vehicleImageUrls = req.files.vehicleImages.map((file) =>
          process.env.NODE_ENV === "production"
            ? file.location
            : `${req.protocol}://${req.get("host")}/${file.path}`
        );
      }

      if (req.files.documents) {
        documentUrls = req.files.documents.map((file) =>
          process.env.NODE_ENV === "production"
            ? file.location
            : `${req.protocol}://${req.get("host")}/${file.path}`
        );
      }
    }

    const updated = await Vehicle.findByIdAndUpdate(req.params.id,req.body,vehicleImageUrls,documentUrls, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }
    return res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
