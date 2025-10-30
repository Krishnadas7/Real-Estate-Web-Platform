// controllers/companySettingsController.ts
import { CompanySettings } from "../../models/driver/companysettingsModel.js";
import { User } from "../../models/driver/userModel.js";
// Create or Update Company Settings
export const upsertCompanySettings = async (req, res) => {
  try {
    const { companyCode, ...data } = req.body;
    const adminId = req.user._id
    // ✅ Parse JSON fields if they come as strings
    if (data.notificationPreferences && typeof data.notificationPreferences === "string") {
      try {
        data.notificationPreferences = JSON.parse(data.notificationPreferences);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid JSON for notificationPreferences" });
      }
    }

    // ✅ Handle profile image upload
    let logoUrl = null;
    if (req.file) {
      if (process.env.NODE_ENV === "production") {
        // From AWS S3 (multer-s3 gives location property)
        logoUrl = req.file.location;
      } else {
        // From local storage
        logoUrl = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, '/')}`;
      }
    }

    if (logoUrl) data.logoUrl = logoUrl;

    // ✅ Upsert company settings
    const settings = await CompanySettings.findOneAndUpdate(
      { companyCode },
      { $set: data },
      { new: true, upsert: true }
    );
    const admin = await User.findOne({_id:adminId})
    admin.company = settings._id
    await admin.save()
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get Company Settings
export const getCompanySettings = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get the user
    const user = await User.findById(userId).populate("company"); // populate company

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.company) {
      return res.status(404).json({ success: false, message: "Company not linked. Please create one." });
    }

    // 2. Return company settings
    res.json({ success: true, data: user.company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
