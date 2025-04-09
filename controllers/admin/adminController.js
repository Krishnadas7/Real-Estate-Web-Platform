import Admin from "../../models/admin/adminModel.js";
import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs";

export const createAdmin = async (req, res) => {
    try {
  
      const { firstName, lastName, email, password } = req.body;
  
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ success:false,message: "Admin with this email already exists" });
      }
  
      // Set default password if not provided
      const plainPassword = password || "123456789";
  
      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
  
      // Create new admin
      const admin = new Admin({ 
        firstName,
        lastName, 
        email, 
        password: hashedPassword, 
      });
  
      await admin.save();
      res.status(201).json({success:true, message: "Admin created successfully", data:admin });
    } catch (error) {
      res.status(500).json({ success:false,error: error.message });
    }
  };

export const loginAdmin = async (req, res) => {
    try {
      // Basic input validation
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({success:false, message: "Email and password are required" });
      }
  
      // Sanitize email
      const sanitizedEmail = email.trim().toLowerCase();
  
      // Check if admin exists
      const admin = await Admin.findOne({ email: sanitizedEmail, isDeleted: false });
      if (!admin) {
        return res.status(400).json({success:false, message: "Invalid email or password" });
      }
  
      // Check if password is correct
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(400).json({success:false, message: "Invalid email or password" });
      }
  
  
      // Update lastLogin field
      admin.lastLogin = new Date();
      await admin.save();
      
      // Generate JWT Token
      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_ACCESS_TOKEN, // Use environment variable for secret key
        { expiresIn: "7d" }
      );
  
      // Omit sensitive information from the response
      const adminResponse = {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      };
  
      res.status(200).json({success:true, message: "Login successful", token, data: adminResponse });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };  