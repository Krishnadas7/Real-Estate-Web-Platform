import FuelReport from "../models/driver/fuelReportsModel.js";
import { getCoordinatesFromAddress } from "../services/googlemap.js";

// Create Fuel Report
export const createFuelReport = async (req, res) => {
  try {
    const {reporter,driver,vehicle,status,odometer,cost,volume,address,type } = req.body
    const { longitude,latitude} = await getCoordinatesFromAddress()
    const report = new FuelReport({
      reporter:reporter || null,
      driver,
      vehicle,
      status,
      odometer,
      cost,
      volume,
      type,
      location:{address,longitude,latitude}
    });
    await report.save();
    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Fuel Report (partial update – only fields passed will update)
export const updateFuelReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await FuelReport.findByIdAndUpdate(id, req.body, { new: true });

    if (!report) {
      return res.status(404).json({ success: false, message: "Fuel report not found" });
    }

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Fuel Report
export const deleteFuelReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await FuelReport.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({ success: false, message: "Fuel report not found" });
    }

    return res.status(200).json({ success: true, message: "Fuel report deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Fuel Reports
export const getFuelReports = async (req, res) => {
  try {
    const reports = await FuelReport.find()
      .populate("reporter")
      .populate("driver")
      .populate("vehicle");

    return res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Change Status (approved / pending / rejected)
export const changeFuelReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "pending", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const report = await FuelReport.findByIdAndUpdate(id, { status }, { new: true });

    if (!report) {
      return res.status(404).json({ success: false, message: "Fuel report not found" });
    }

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
