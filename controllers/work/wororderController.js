import { WorkOrder } from "../../models/driver/workOrderModel.js";
import { Vehicle } from "../../models/driver/vehicleModel.js";

export async function getCurrentMonthWorkOrderCost(req, res) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Sum estimatedCost for all work orders created this month
    const result = await WorkOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalMonthlyCost: { $sum: "$estimatedCost" },
        },
      },
    ]);

    const totalMonthlyCost = result.length > 0 ? result[0].totalMonthlyCost : 0;

    return res.json({
      success: true,
      message: "Total estimated cost for this month",
      data:{totalMonthlyCost},
    });
  } catch (err) {
    console.error("Error calculating monthly cost:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while calculating monthly cost",
      error: err.message,
    });
  }
}

export async function getRecentWorkOrders(req, res) {
  try {
    const recentOrders = await WorkOrder.find()
      .populate("vehicleId", "plateNumber model make") // populate vehicle info
      .sort({ createdAt: -1 }) // latest first
      .limit(10); // only 10 records

    return res.json({
      success: true,
      message: "Recent work orders fetched successfully",
      data: recentOrders,
    });
  } catch (err) {
    console.error("Error fetching recent work orders:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function maintenanceCostReport(req, res) {
  try {
    const { vehicleId, year } = req.query;
    const report = await getMaintenanceCostReport({ vehicleId, year });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMaintenanceCostReport({ vehicleId, year }) {
  const match = {};
  if (vehicleId) match.vehicleId = vehicleId;
  if (year) {
    match.createdAt = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  return await WorkOrder.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          vehicleId: "$vehicleId",
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalCost: { $sum: "$estimatedCost" },
        workOrders: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "_id.vehicleId",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },
    {
      $project: {
        _id: 0,
        vehicleId: "$_id.vehicleId",
        plateNumber: "$vehicle.plateNumber",
        year: "$_id.year",
        month: "$_id.month",
        totalCost: 1,
        workOrders: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);
}

export const getMaintenanceSchedule = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}, "plateNumber upcomingServices odometer");
    res.json({success:true,data:vehicles,message:"maintanance details"});
  } catch (err) {
    res.status(500).json({success:false,message:err.message, error: err.message });
  }
};
// Create Work Order
export const createWorkOrder = async (req, res) => {
  try {
    const { vehicleId, issue, description, assignedMechanic, estimatedCost, estimatedTime } = req.body;

    const workOrder = await WorkOrder.create({
      vehicleId,
      issue,
      description,
      assignedMechanic,
      estimatedCost,
      estimatedTime,
      status: "open",      // always start as open
      repairUpdates: []    // start empty
    });

    res.status(201).json({
      success: true,
      message: "Work order created",
      data: workOrder
    });
  } catch (err) {
    res.status(400).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get All Work Orders
export const getWorkOrders = async (req, res) => {
  try {
    const workOrders = await WorkOrder.find().populate("vehicleId");
    res.json({success:true,data:workOrders,message:"orders"});
  } catch (err) {
    res.status(500).json({success:false,message:"server error", error: err.message });
  }
};

// Get Work Order by ID
export const getWorkOrderById = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id).populate("vehicleId");
    if (!workOrder) return res.status(404).json({success:false, message: "Work Order not found" });
    res.json({success:true,message:"order by id",data:workOrder});
  } catch (err) {
    res.status(500).json({success:false,message:"server error", error: err.message });
  }
};

// Update Work Order
export const updateWorkOrder = async (req, res) => {
  try {
    const { status, description, assignedMechanic, estimatedCost, estimatedTime, repairUpdate } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (description) updateFields.description = description;
    if (assignedMechanic) updateFields.assignedMechanic = assignedMechanic;
    if (estimatedCost) updateFields.estimatedCost = estimatedCost;
    if (estimatedTime) updateFields.estimatedTime = estimatedTime;

    let workOrder = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    // If repairUpdate is passed, push it instead of replacing the array
    if (repairUpdate) {
      workOrder.repairUpdates.push({
        time: new Date(),
        note: repairUpdate
      });
      await workOrder.save();
    }

    if (!workOrder) {
      return res.status(404).json({ success: false, message: "Work Order not found" });
    }

    res.json({ success: true, message: "Updated work order", data: workOrder });
  } catch (err) {
    res.status(400).json({ success: false, message: "Server error", error: err.message });
  }
};


// Delete Work Order
export const deleteWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByIdAndDelete(req.params.id);
    if (!workOrder) return res.status(404).json({success:false, message: "Work Order not found" });
    res.json({success:true,message: "Work Order deleted" });
  } catch (err) {
    res.status(500).json({success:false,message:"server error", error: err.message });
  }
};
