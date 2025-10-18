import mongoose from "mongoose";

const companySettingsSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyCode: { type: String, required: true, unique: true },
  logoUrl: { type: String },
  address: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    appAlerts: { type: Boolean, default: true }
  },
}, { timestamps: true });

export const CompanySettings = mongoose.model("CompanySettings", companySettingsSchema);
