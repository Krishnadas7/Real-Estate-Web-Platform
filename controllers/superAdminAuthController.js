import jwt from "jsonwebtoken";
import { User } from "../models/driver/userModel.js";
import { hashPassword, comparePassword } from "../services/bcrypt.js"
import { getCoordinatesFromAddress } from "../services/googlemap.js";
import 'dotenv/config'
const JWT_SECRET = process.env.JWT_SECRET 
console.log(JWT_SECRET);

// ✅ Register Super Admin
export const registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, password,address,country,city,state,policies } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Super Admin already exists" });
    }

    const hashedPassword = await hashPassword(password);
   const { latitude, longitude } = await getCoordinatesFromAddress(address);
    const superAdmin = new User({
      name,
      email,
      password: hashedPassword,
      country,
      city,
      state,
      location:{address,longitude,latitude},
      role:'superadmin',
      status:'active',
      policies:policies,
      joinDate: new Date()
    });

    await superAdmin.save();

    res
      .status(201)
      .json({ success: true, message: "Super Admin created successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ Login Super Admin
export const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const superAdmin = await User.findOne({ email });
    if (!superAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await comparePassword(password, superAdmin.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: superAdmin._id, role: superAdmin.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        token,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
