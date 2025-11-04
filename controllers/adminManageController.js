import { User } from "../models/driver/userModel.js";
import { hashPassword } from "../services/bcrypt.js";


export const createAdmin = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password,
      phone,
      country,
      state,
      city,
      address,
      internalId,
      company,
      status = 'active',
      policies
    } = req.body;

    // Check if admin already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Admin with this email already exists" });
    }

    // Check if internalId already exists
    if (internalId) {
      const existingId = await User.findOne({ internalId });
      if (existingId) {
        return res.status(400).json({ success: false, message: "Internal ID already exists" });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Get coordinates from address if provided
    let coordinates = { latitude: null, longitude: null };
    if (address) {
      const { getCoordinatesFromAddress } = await import("../services/googlemap.js");
      coordinates = await getCoordinatesFromAddress(address);
    }

    // Create new admin
    const adminData = {
      name,
      email,
      phone,
      country,
      state,
      city,
      role: 'admin',
      password: hashedPassword,
      status,
      policies,
      joinDate: new Date(),
      internalId: internalId || `ADMIN-${Date.now()}`,
      location: {
        address,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude
      }
    };

    // Add company reference if provided
    if (company) {
      adminData.company = company;
    }

    const admin = new User(adminData);
    await admin.save();

    // Populate company data for response
    await admin.populate('company', 'companyName companyCode address contactEmail contactPhone logoUrl');

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        internalId: admin.internalId,
        company: admin.company,
        joinDate: admin.joinDate
      },
    });
  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
};

// ✅ Get All Admins
export const getAllAdmins = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    
    // Build filter - only get users with role 'admin'
    const filter = { role: 'admin' };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { internalId: { $regex: search, $options: 'i' } },
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get admins with populated company data
    const admins = await User.find(filter)
      .populate('company', 'companyName companyCode address contactEmail contactPhone logoUrl')
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      message: "Admin list retrieved successfully",
      data: admins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAdmins: total,
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (err) {
    res.status(500).json({success:false, message: "Server error", error: err.message });
  }
};

// ✅ Update Admin
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      phone,
      country,
      state,
      city,
      address,
      status,
      policies,
      company,
      password
    } = req.body;

    const admin = await User.findById(id);
    if (!admin) {
      return res.status(404).json({success:false, message: "Admin not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== admin.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ 
          success: false, 
          message: "Email already exists for another user" 
        });
      }
    }

    // Get coordinates from address if provided and changed
    let coordinates = { latitude: null, longitude: null };
    if (address && address !== admin.location?.address) {
      const { getCoordinatesFromAddress } = await import("../services/googlemap.js");
      coordinates = await getCoordinatesFromAddress(address);
    } else if (admin.location) {
      coordinates = {
        latitude: admin.location.latitude,
        longitude: admin.location.longitude
      };
    }

    // Hash password if provided
    let hashedPassword = admin.password;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      phone,
      country,
      state,
      city,
      status,
      policies,
      password: hashedPassword,
      location: {
        address: address || admin.location?.address,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude
      }
    };

    // Add company if provided
    if (company) {
      updateData.company = company;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Use updateOne to avoid full document validation issues
    await User.updateOne(
      { _id: id },
      { $set: updateData }
    );

    // Fetch updated admin with populated company
    const updatedAdmin = await User.findById(id)
      .populate('company', 'companyName companyCode address contactEmail contactPhone logoUrl')
      .select("-password");

    res.json({
      success: true, 
      message: "Admin updated successfully", 
      data: updatedAdmin 
    });
  } catch (err) {
    console.error('Error updating admin:', err);
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
