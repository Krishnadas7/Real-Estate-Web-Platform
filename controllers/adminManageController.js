import { User } from "../models/driver/userModel.js";
import { hashPassword } from "../services/bcrypt.js";


export const createAdmin = async (req, res) => {
  try {
    const { name, email, password ,companyName,companyCode} = req.body;

    // Check if admin already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new admin
    const admin = new User({ name, email,role:'admin', password: hashedPassword ,companyCode,companyName,joinDate:new Date()});
    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ Get All Admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find().select("-password");
    res.json({success:true,message:"admin list",data:admins});
  } catch (err) {
    res.status(500).json({success:false, message: "Server error", error: err.message });
  }
};

// ✅ Update Admin
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const admin = await User.findByIdAndUpdate(
      id,
      { name, email },
      { new: true }
    ).select("-password");

    if (!admin) return res.status(404).json({success:false, message: "Admin not found" });

    res.json({success:true, message: "Admin updated successfully", data:admin });
  } catch (err) {
    res.status(500).json({success:false, message: "Server error", error: err.message });
  }
};

// ✅ Delete Admin
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({success:false, message: "Admin not found" });

    res.json({success:true, message: "Admin deleted successfully" });
  } catch (err) {
    res.status(500).json({success:false, message: "Server error", error: err.message });
  }
};
