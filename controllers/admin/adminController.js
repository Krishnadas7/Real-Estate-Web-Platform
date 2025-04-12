import Admin from "../../models/admin/adminModel.js";
import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs";
import Client from "../../models/clients/clientSchema.js";

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
 export const createClient = async (req, res) => {
   try {
     const {
       firstName,
       lastName,
       email,
       company,
       mobile,
       agentTask,
     } = req.body;
 
     // Check if client already exists by email
     const existingClient = await Client.findOne({ email });
     if (existingClient) {
       return res.status(400).json({
         success: false,
         message: "Client with this email already exists",
       });
     }
 
     // Construct profileUrl if file uploaded
     let profileUrl = "";
 if (req.file) {
   const host = req.protocol + "://" + req.get("host"); // e.g., http://localhost:5000
   profileUrl = `${host}/uploads/images/${req.file.filename}`;
 }
 
 
     // Create and save the new client
     const newClient = new Client({
       firstName,
       lastName,
       email,
       company,
       mobile,
       agentTask,
       profileUrl,
     });
 
     await newClient.save();
 
     res.status(201).json({
       success: true,
       message: "Client created successfully",
       data: newClient,
     });
 
   } catch (error) {
     console.error("Error in createClient:", error);
     res.status(500).json({
       success: false,
       message: "Server error while creating client",
     });
   }
 };
 
 export const getAllClients = async (req, res) => {
     try {
       const clients = await Client.find().sort({ createdAt: -1 }); // latest first
       res.status(200).json({ success: true, data: clients,message:"All client lists" });
     } catch (error) {
       console.error("Error fetching clients:", error.message);
       res.status(500).json({ success: false, message: "Server Error" });
     }
   };
 
   export const getClientProfile = async (req, res) => {
     try {
       const { clientId } = req.params;
   
       const client = await Client.findById(clientId);
   
       if (!client) {
         return res.status(404).json({ success: false, message: "Client not found" });
       }
   
       res.status(200).json({ success: true, data: client,message:"Client Profile data" });
     } catch (error) {
       console.error("Error fetching client profile:", error.message);
       res.status(500).json({ success: false, message: "Server Error" });
     }
   }; 
  
   export const deleteClient = async (req, res) => {
     try {
       const { clientId } = req.params;
   
       const deletedClient = await Client.findByIdAndDelete(clientId);
   
       if (!deletedClient) {
         return res.status(404).json({ success: false, message: "Client not found" });
       }
   
       res.status(200).json({ success: true, message: "Client deleted successfully" });
     } catch (error) {
       console.error("Error deleting client:", error.message);
       res.status(500).json({ success: false, message: "Server Error" });
     }
   }; 
 
 export const updateClientProfile = async (req,res) =>{
     try {
         const { clientId, ...updateData } = req.body;
 
         if (!clientId) {
             return res.status(400).json({ success: false, message: "Client Id is required" });
         }
         if (updateData.email) {
             const existingClient = await Customer.findOne({
                 email: updateData.email});
             
             if (existingClient) {
                 return res.status(400).json({ success: false, message: "Email already exists" });
             }
         }   
             // Find customer and update
       const client = await Client.findOneAndUpdate(
         { _id: clientId }, 
         { $set: updateData }, 
         { new: true }
     );
 
     if (!client) {
         return res.status(404).json({ success: false, message: "Client not found" });
     }
 
     res.status(200).json({ success: true, message: "Client updated successfully", data:client });
     } catch (error) {
         
     }
 }   