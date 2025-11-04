import { User } from "../models/driver/userModel.js";
import { validationResult } from "express-validator";
import { comparePassword, hashPassword } from "../services/bcrypt.js";
import jwt from "jsonwebtoken";


// Change Password
export const changeDriverPassword = async (req, res) => {
  try {
    // Use req.driver if available (from driverAuth middleware), otherwise fallback to req.user
    const userId = req.driver?._id || req.user?._id;
    
    if (!userId) {
      console.error('❌ No user ID found in request');
      return res.status(401).json({success:false, message: "User not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;

    console.log('🔐 Change password request:', { userId: userId.toString(), hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({success:false, message: "Both current and new password are required" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({success:false, message: "User not found" });
    }

    // Compare current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', userId.toString());
      return res.status(400).json({success:false, message: "Current password does not match" });
    }

    // Hash new password
    user.password = await hashPassword(newPassword);

    await user.save();

    console.log('✅ Password changed successfully for user:', userId.toString());
    res.status(200).json({success:true, message: "Password changed successfully" });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({success:false, message: "Error changing password", error: error.message });
  }
};

export const driverProfile = async (req,res) =>{
  try {
    const driverId = req.driver._id
    const driver = await User.findOne({_id:driverId})
    res.json({
      success:true,
      message:"driver profile",
      data:driver
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
export const activeLoads = async (req,res) =>{
  try {
    const driverId = req.driver._id
     
  } catch (error) {
    
  }
}

// ✅ Driver self-register
export const registerDriver = async (req, res) => {
  try {
    console.log(req.file);
    
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let { name, email, phone, country, password, location } = req.body;
     const driverExist = await User.findOne({email:email})
     if(driverExist){
      return res.json({success:false,message:"driver already exist with email"})
     }
    // Hash password
    password = await hashPassword(password);

    // ✅ Handle profile image upload
    let profileImageUrl = null;
    if (req.file) {
      if (process.env.NODE_ENV === "production") {
        // From AWS S3 (multer-s3 gives location property)
        profileImageUrl = req.file.location;
      } else {
        // From local storage
        profileImageUrl = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, '/')}`;
      }
    }

    const driver = new User({
      name,
      email,
      phone,
      country,
      password,
      status:'active',
      profileImageUrl,
      location: location || {}, // expect { longitude, latitude }
    });

    await driver.save();

    res.status(201).json({
      success: true,
      message: "Driver registered successfully",
      driver,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const loginDriver = async (req, res) => {
  try {
    // validate inputs (if using express-validator)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // check if driver exists
    const driver = await User.findOne({ email });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // compare password
    const isMatch = await comparePassword(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // ✅ create JWT token
    const token = jwt.sign(
      { id: driver._id, role: "driver" }, // payload
      process.env.JWT_SECRET, // secret key
      { expiresIn: "7d" } // expiry time
    );

    // ✅ if login success
    res.status(200).json({
      success: true,
      message: "Login successful",
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        token:token
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDriver = async (req,res) =>{
  try {
    const { id } = req.params
    const driver = await User.findOne({_id:id})
    if(!driver){
      res.status(200).json({ success: false, message: "Driver doest not exist" });
    }
    await User.findOneAndDelete({_id:id})
    res.status(200).json({
      success: true,
      message: "Driver deleted",
     
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ✅ Get Driver Profile + Documents
export const getDriverById = async (req, res) => {
  try {
    const driverId = new mongoose.Types.ObjectId(req.params.id);

    const driverProfile = await User.aggregate([
      {
        $match: { _id: driverId }
      },
      {
        $lookup: {
          from: "vehicles", // 👈 your Vehicle collection name
          localField: "details.vehicle",
          foreignField: "_id",
          as: "vehicleDetails"
        }
      },
      { $unwind: { path: "$vehicleDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "driverdocuments",
          localField: "_id",
          foreignField: "driver",
          as: "documents"
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          country: 1,
          role: 1,
          policies: 1,
          profileImageUrl: 1,
          status: 1,
          location: 1,
          avatar: 1,
          createdAt: 1,
          updatedAt: 1,
          "details.internalId": 1,
          "details.licenceNumber": 1,
          "details.vendor": 1,
          "details.city": 1,
          "details.country": 1,
          vehicleDetails: 1,
          documents: 1
        }
      }
    ]);

    if (!driverProfile || driverProfile.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });
    }

    res.json({
      success: true,
      message: "Driver profile with documents",
      data: driverProfile[0] // 👈 single object (driver + docs)
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching driver", error: err.message });
  }
};

// ✅ Create driver
export const createDriver = async (req, res) => {
  try {
    const { name,phone,email,country,password,role,policies,internalId} = req.body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
     const driverExist = await User.findOne({email:email})
     if(driverExist){
      return res.json({success:false,message:"driver already exist with email"})
     }

     // Check if internalId is provided, if not generate one
     let finalInternalId = internalId;
     if (!finalInternalId) {
       // Generate internalId based on role and timestamp
       const timestamp = Date.now().toString().slice(-6);
       const rolePrefix = role === 'driver' ? 'DRV' : 'EMP';
       finalInternalId = `${rolePrefix}-${timestamp}`;
     }

     // Check if internalId already exists
     const existingInternalId = await User.findOne({internalId: finalInternalId});
     if (existingInternalId) {
       return res.json({success:false,message:"Internal ID already exists"});
     }

    // hash password before saving
    const hashedPassword = await hashPassword(password);
     
    // ✅ Handle profile image upload
    let profileImageUrl = null;
    if (req.file) {
      if (process.env.NODE_ENV === "production") {
        // From AWS S3 (multer-s3 gives location property)
        profileImageUrl = req.file.location;
      } else {
        // From local storage
        profileImageUrl = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, '/')}`;
      }
    }
    const driver = new User({
      name:name,
      email:email,
      phone:phone,
      password: hashedPassword, // store hashed password
      country:country,
      role:role,
      policies:policies,
      profileImageUrl:profileImageUrl,
      internalId: finalInternalId,
      joinDate: new Date(),
      status: 'active'
    });

    await driver.save();

    res
      .status(201)
      .json({ success: true, message: "Driver created successfully", data: driver });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update driver
export const updateDriver = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // ✅ Handle profile image upload
    let profileImageUrl = null;
    if (req.file) {
      if (process.env.NODE_ENV === "production") {
        // From AWS S3 (multer-s3 gives location property)
        profileImageUrl = req.file.location;
      } else {
        // From local storage
        profileImageUrl = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, '/')}`;
      }
    }
    req.body.profileImageUrl = profileImageUrl
    const driver = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    res.json({ success: true, message: "Driver updated successfully", driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update driver status (Active/Inactive)
export const updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body; // expected: "active" or "inactive"

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Use 'active' or 'inactive'." });
    }

    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    res.json({ success: true, message: `Driver status updated to ${status}`, driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all drivers
export const getAllDrivers = async (req, res) => {
  try {
    console.log('🔄 Fetching all drivers');
    
    const drivers = await User.find({role:"driver"})
      .select('name email phone country role status internalId joinDate profileImageUrl policies')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${drivers.length} drivers`);

    res.json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    console.error('❌ Error fetching drivers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const totalDriversCount = async (req, res) => {
  try {
    // Count all drivers
    const totalDrivers = await User.countDocuments({ role: "driver" });

    // Count only active drivers
    const activeDrivers = await User.countDocuments({ role: "driver", status: "active" });

    res.json({
      success: true,
      data:{
       totalDrivers:totalDrivers,
      activeDrivers:activeDrivers  
      }
      
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

