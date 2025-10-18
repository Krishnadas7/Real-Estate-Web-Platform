import ActivityLog from "../models/activitylogModel.js";

export const getNotificationsByDriver = async (req, res) => {
  try {
    const driverId  = req.user._id;
    const { page = 1 } = req.query; // default page = 1
    const limit = 10;
    const skip = (page - 1) * limit;

    if (!driverId) {
      return res.status(400).json({ success: false, message: "Driver ID is required" });
    }

    const notifications = await ActivityLog.find({ driver: driverId })
      .populate("performedBy", "name email")
      .populate("user", "name email")
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments({ driver: driverId });

    return res.status(200).json({
      success: true,
      data:{
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        count: notifications.length,
        notifications:notifications
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
