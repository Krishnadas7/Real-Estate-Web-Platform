import { User } from "../../models/driver/userModel.js";
import { hashPassword, comparePassword } from "../../services/bcrypt.js";
import { getCoordinatesFromAddress } from "../../services/googlemap.js";

// ✅ Get Current User Profile (for all roles)
export const getCurrentUserProfile = async (req, res) => {
  try {
    // req.user is already populated by authMiddleware
    const user = await User.findById(req.user._id)
      .select("-password") // Exclude password
      .populate("company", "companyName companyCode address contactEmail contactPhone logoUrl") // Populate company if exists
      .populate("details.vehicle", "internalId plateNumber make model"); // Populate vehicle if driver

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User profile fetched successfully",
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Current User Profile
export const updateCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Don't allow role/company changes from profile update
    delete updates.role;
    delete updates.company;

    // Don't allow password change here (use change password endpoint)
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Change Current User Password (for all roles)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "New password is required" 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Use updateOne to avoid triggering full document validation
    await User.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ 
      success: true, 
      message: "Password changed successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error changing password", 
      error: error.message 
    });
  }
};

 export const   getAllFaciliators = async (req,res) =>{
   try {
     const faci = await User.find({role:'faciliator'})

    res.json({ success: true, data:faci });
  } catch (err) {
    res.status(500).json({success:false,message:err.message });
  }
 }
export const getEmployees = async (req, res) => {
  try {
    const { role } = req.query;

    let query = {};
    if (role) {
      query.role = role; // apply filter if role is provided
    }

    const employees = await User.find(query).select(
      "name role phone status email details.mileRate internalId"
    );

    res.json({ success: true, data:employees });
  } catch (err) {
    res.status(500).json({success:false,message:err.message });
  }
};
// Create User
export const createUser = async (req, res) => {
  try {
    const { name, email,company,status, phone, password, role, details ,country,state,city,policies,address} = req.body;
    const { latitude, longitude } = await getCoordinatesFromAddress(address);
    const exist = await User.findOne({email:email})
    if(exist){
        return res.json({success:false,message:"user with email already exists"})
    }
    const hp = await hashPassword(password)
    const user = new User({
      name,
      email,
      phone,
      password:hp, // 👉 you should hash before saving in production
      role,
      joinDate: new Date(),
      status,
      country,
      state,
      city,
      company:'68d1418aa24e3ad6923b83e9',
      policies,
      location:{address,longitude,latitude},
    });

    await user.save();
    res.status(201).json({success:true, message: "User created successfully", data:user });
  } catch (error) {
    res.status(500).json({success:false, message: "Error creating user", error: error.message });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({success:false, message: "User not found" });

    // role-specific update checks
    if (user.role === "driver" && updates.details?.licenceNumber) {
      user.details.licenceNumber = updates.details.licenceNumber;
    }
    if (user.role === "admin" && updates.details?.companyName) {
      user.details.companyName = updates.details.companyName;
    }
    if (user.role === "dispatcher" && updates.details?.internalId) {
      user.details.internalId = updates.details.internalId;
    }

    // generic updates
    Object.assign(user, updates);
    await user.save();

    res.json({success:true, message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({success:false, message: "Error updating user", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  console.log(req.params.id);
  try {
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findOneAndDelete({ _id: id }); // Ensure correct query format
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error); // Use console.error for better visibility
    res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
  }
};

// Change User Status
export const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "active" or "inactive"

    const user = await User.findById(id);
    if (!user) return res.status(404).json({success:false, message: "User not found" });

    user.status = status;
    await user.save();

    res.json({success:true, message: "User status updated", user });
  } catch (error) {
    res.status(500).json({success:false, message: "Error updating status", error: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    // Build filter object dynamically
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.status = status;

    if (search && typeof search === 'string') {
      // Case-insensitive search by name, email, or phone
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: users, message: 'Listing users' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};
