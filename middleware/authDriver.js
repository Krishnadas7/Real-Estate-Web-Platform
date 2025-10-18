import jwt from "jsonwebtoken";
import { User } from "../models/driver/userModel.js";

export const driverAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ find driver
    const driver = await User.findById(decoded.id).select("-password");
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    req.user = driver; // attach driver to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
