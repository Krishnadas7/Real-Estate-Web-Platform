import ServiceRate from "../models/serviceRate.js";

// Create Service Rate
export const createServiceRate = async (req, res) => {
  try {
    const serviceRate = new ServiceRate(req.body);
    await serviceRate.save();
    res.status(201).json({success:true, message: "Service Rate created successfully", data: serviceRate });
  } catch (error) {
    res.status(400).json({success:false, message: "Error creating service rate", error: error.message });
  }
};

// Get All Service Rates
export const getServiceRates = async (req, res) => {
  try {
    const serviceRates = await ServiceRate.find();
    res.status(200).json({success:true,data:serviceRates});
  } catch (error) {
    res.status(500).json({success:false, message: "Error fetching service rates", error: error.message });
  }
};

// Update Service Rate
export const updateServiceRate = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceRate = await ServiceRate.findByIdAndUpdate(id, req.body, { new: true });
    if (!serviceRate) {
      return res.status(404).json({success:false, message: "Service Rate not found" });
    }
    res.status(200).json({success:true, message: "Service Rate updated successfully", data: serviceRate });
  } catch (error) {
    res.status(400).json({ success:false, message: "Error updating service rate", error: error.message });
  }
};

// Delete Service Rate
export const deleteServiceRate = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceRate = await ServiceRate.findByIdAndDelete(id);
    if (!serviceRate) {
      return res.status(404).json({success:false, message: "Service Rate not found" });
    }
    res.status(200).json({success:true, message: "Service Rate deleted successfully" });
  } catch (error) {
    res.status(500).json({success:false, message: "Error deleting service rate", error: error.message });
  }
};
