import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import { comparePassword } from "../services/bcrypt.js"; // adjust path
import { User } from "../models/driver/userModel.js";
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
