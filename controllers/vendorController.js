import Vendor from "../models/vendorModel.js";

// Create vendor
export const createVendor = async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    const savedVendor = await vendor.save();
    res.status(201).json({success:true,message:"vendor created",data:savedVendor});
  } catch (err) {
    res.status(400).json({ success:false,message:"server error",error: err.message });
  }
};

// Update vendor
export const updateVendor = async (req, res) => {
  try {
    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedVendor) {
      return res.status(404).json({success:false,message:"vendor not found", error: "Vendor not found" });
    }
    res.json({success:true,message:"updated",data:updatedVendor});
  } catch (err) {
    res.status(400).json({success:false,message:"server error", error: err.message });
  }
};

// Delete vendor
export const deleteVendor = async (req, res) => {
  try {
    const deletedVendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!deletedVendor) {
      return res.status(404).json({success:false,message:"vendor not found", error: "Vendor not found" });
    }
    res.json({success:true, message: "Vendor deleted successfully" });
  } catch (err) {
    res.status(400).json({success:false,message:"server error", error: err.message });
  }
};

// List all vendors
export const listVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json({success:true,message:"list vendors",data:vendors});
  } catch (err) {
    res.status(500).json({success:false,message:"server error", error: err.message });
  }
};

// Change vendor status
export const changeVendorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({success:false, message: "Invalid status value" });
    }
    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedVendor) {
      return res.status(404).json({success:false,message:"vendor not found" });
    }
    res.json({success:true,message:"vendor updated",data:updatedVendor});
  } catch (err) {
    res.status(400).json({ success:false,message:"server error",error: err.message });
  }
};

export const selectedVendor = async (req,res) =>{
  try {
    const vendorId = req.query.vendorId 
    const vendor = await Vendor.findOne({_id:vendorId})
    return res.json({success:true,message:"selected vendor details",data:vendor})
  } catch (error) {
    res.status(400).json({ success:false,message:"server error",error: err.message });
  }
}
