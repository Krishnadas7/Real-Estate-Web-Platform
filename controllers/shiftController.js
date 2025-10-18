import { Shift } from "../models/driver/shiftModel.js";





// ✅ Get all shifts (filter by driver or date if needed)
export const getShifts = async (req, res) => {
  try {
    const { driverId, startDate, endDate } = req.query;

    let query = {};
    if (driverId) query.driver = driverId;
    if (startDate && endDate) {
      query.shiftDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const shifts = await Shift.find(query)
      .populate("driver", "name email phone")
      .populate("vehicle", "plateNumber make model")
      .populate("load", "details.internalId status route");

    res.json({succes:true,message:"all shifts",data:shifts});
  } catch (error) {
    res.status(500).json({succes:false, message: error.message });
  }
};

// ✅ Update shift
export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findByIdAndUpdate(id, req.body, { new: true });
    if (!shift) return res.status(404).json({ message: "Shift not found" });
    res.json({succes:true,message:"updated",data: shift});
  } catch (error) {
    res.status(500).json({succes:false,  message: error.message });
  }
};

// ✅ Delete shift
export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findByIdAndDelete(id);
    if (!shift) return res.status(404).json({succes:false,  message: "Shift not found" });
    res.json({succes:true, message: "Shift deleted successfully" });
  } catch (error) {
    res.status(500).json({succes:false,  message: error.message });
  }
};