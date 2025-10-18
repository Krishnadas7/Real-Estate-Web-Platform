import Place from "../models/driver/placeModel.js";
import { getCoordinatesFromAddress } from "../services/googlemap.js";

// Create Place
export const createPlace = async (req, res) => {
  try {
    const {
      name,
      street1,
      street2,
      neighbourHood,
      building,
      securityAccessCodepostalCode,
      city,
      state,
      country,
      phone,
    } = req.body;

    // Construct full address
    const address = `${street1 || ""} ${street2 || ""} ${neighbourHood || ""} ${
      building || ""
    } ${city || ""} ${state || ""} ${country || ""} ${
      securityAccessCodepostalCode || ""
    }`.trim();

    // Get coordinates from Google Maps
    const { latitude, longitude } = await getCoordinatesFromAddress(address);

    const place = new Place({
      name,
      street1,
      street2,
      neighbourHood,
      building,
      securityAccessCodepostalCode,
      city,
      state,
      country,
      status:'active',
      phone,
      currentLocation: {
        address,
        latitude,
        longitude,
      },
    });

    await place.save();

    return res
      .status(201)
      .json({ success: true, message: "Place created successfully", data: place });
  } catch (error) {
    console.error("Error creating place:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Place (only fields provided in body will be updated)
export const updatePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const place = await Place.findByIdAndUpdate(id, req.body, { new: true });

    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }

    return res.status(200).json({ success: true, data: place });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Place
export const deletePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const place = await Place.findByIdAndDelete(id);

    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }

    return res.status(200).json({ success: true, message: "Place deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Change Status (active <-> inactive)
export const togglePlaceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const place = await Place.findById(id);

    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }

    place.status = place.status === "active" ? "inactive" : "active";
    await place.save();

    return res.status(200).json({ success: true, data: place });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Places
export const getPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    return res.status(200).json({ success: true, data: places });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Search place by name
export const searchPlaceByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name query is required" });
    }

    const places = await Place.find({
      name: { $regex: name, $options: "i" }, // case-insensitive
    });

    return res.status(200).json({ success: true, count: places.length, data: places });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
