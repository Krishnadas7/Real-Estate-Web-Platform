import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import { comparePassword } from "../services/bcrypt.js"; // adjust path
import { User } from "../models/driver/userModel.js";
import Load from "../models/loadModel.js";
import DriverActivity from "../models/driver/driverActivityModel.js";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if admin exists
    const admin = await User.findOne({ email });
    if (!admin) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // 2. Compare password
    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // 3. Create JWT
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 4. Send response
    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token:token
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Driver Dashboard Statistics
export const getDriverStats = async (req, res) => {
  try {
    // Get total drivers
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    
    // Get active drivers (drivers with status 'active')
    const activeDrivers = await User.countDocuments({ role: 'driver', status: 'active' });
    
    // Get drivers from last month for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const totalDriversLastMonth = await User.countDocuments({ 
      role: 'driver', 
      createdAt: { $lt: lastMonth } 
    });
    
    const activeDriversLastMonth = await User.countDocuments({ 
      role: 'driver', 
      status: 'active',
      updatedAt: { $lt: lastMonth }
    });
    
    // Calculate percentage changes
    const totalDriversChange = totalDriversLastMonth > 0 
      ? ((totalDrivers - totalDriversLastMonth) / totalDriversLastMonth * 100).toFixed(1)
      : 0;
      
    const activeDriversChange = activeDriversLastMonth > 0
      ? ((activeDrivers - activeDriversLastMonth) / activeDriversLastMonth * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalDrivers,
        activeDrivers,
        totalDriversChange: parseFloat(totalDriversChange),
        activeDriversChange: parseFloat(activeDriversChange)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching driver stats", error: error.message });
  }
};

// Load Statistics
export const getLoadStats = async (req, res) => {
  try {
    // Get total loads
    const totalLoads = await Load.countDocuments();
    
    // Get loads from last month for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const totalLoadsLastMonth = await Load.countDocuments({ 
      createdAt: { $lt: lastMonth } 
    });
    
    // Calculate percentage change
    const totalLoadsChange = totalLoadsLastMonth > 0 
      ? ((totalLoads - totalLoadsLastMonth) / totalLoadsLastMonth * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalLoads,
        totalLoadsChange: parseFloat(totalLoadsChange)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching load stats", error: error.message });
  }
};

// Safety Score Statistics
export const getSafetyStats = async (req, res) => {
  try {
    // Calculate average safety score (mock data for now)
    // In a real app, this would come from driver performance metrics
    const avgSafetyScore = 91.2;
    const lastMonthScore = 89.1;
    const safetyScoreChange = ((avgSafetyScore - lastMonthScore) / lastMonthScore * 100).toFixed(1);

    res.json({
      success: true,
      data: {
        avgSafetyScore,
        safetyScoreChange: parseFloat(safetyScoreChange)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching safety stats", error: error.message });
  }
};

// Recent Driver Activities
export const getRecentDriverActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const activities = await DriverActivity.find()
      .populate('driver', 'name email internalId')
      .populate('load', 'details.internalId')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching recent activities", error: error.message });
  }
};
