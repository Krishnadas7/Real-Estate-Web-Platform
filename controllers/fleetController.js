import Fleet from "../models/driver/fleetModel.js";


// Search fleet by name
export const searchFleetByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name query is required" });
    }

    const fleets = await Fleet.find({
      name: { $regex: name, $options: "i" }, // case-insensitive search
    });

    return res.status(200).json({ success: true, count: fleets.length, data: fleets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// Create Fleet
export const createFleet = async (req, res) => {
  try {
    const fleet = new Fleet(req.body);
    await fleet.save();
    return res.status(201).json({message:"Feet created", success: true, data: fleet });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Fleet (only fields provided in body will be updated)
export const updateFleet = async (req, res) => {
  try {
    const { id } = req.params;
    const fleet = await Fleet.findByIdAndUpdate(id, req.body, { new: true });

    if (!fleet) {
      return res.status(404).json({ success: false, message: "Fleet not found" });
    }

    return res.status(200).json({ success: true, data: fleet });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Fleet
export const deleteFleet = async (req, res) => {
  try {
    const { id } = req.params;
    const fleet = await Fleet.findByIdAndDelete(id);

    if (!fleet) {
      return res.status(404).json({ success: false, message: "Fleet not found" });
    }

    return res.status(200).json({ success: true, message: "Fleet deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Change Status (active <-> inactive)
export const toggleFleetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const fleet = await Fleet.findById(id);

    if (!fleet) {
      return res.status(404).json({ success: false, message: "Fleet not found" });
    }

    fleet.status = fleet.status === "active" ? "inactive" : "active";
    await fleet.save();

    return res.status(200).json({ success: true, data: fleet });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// (Optional) Get all fleets
export const getFleets = async (req, res) => {
  try {
    const fleets = await Fleet.find();
    return res.status(200).json({ success: true, data: fleets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
