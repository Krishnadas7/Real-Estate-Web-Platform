// utils/driverActivityLogger.ts
import DriverActivity from "../../models/driver/driverActivityModel.js";

export const getDriverActivities = async (req,res) => {
  try {
    const limit = 10
    const activities = await DriverActivity.find().lean()
      .sort({ timestamp: -1 }) // latest first
      .limit(limit)
      .populate({
        path: "driver",
        select: "name email internalId"
      })
      .populate({
        path: "load",
        select: "details.internalId"
      });

    return res.json({success:true,message:"driver activity",data:activities}) 
  } catch (error) {
    return res.json({success:false,message:error.message,})
  }
};

export const logDriverActivity = async ({ driverId, activityType, location = {}, loadId = null }) => {
  try {
    const activity = await DriverActivity.create({
      driver: driverId,
      activityType,
      location,
      load: loadId
    });
    return activity;
  } catch (error) {
    console.error("Error logging driver activity:", error.message);
    throw error;
  }
};
