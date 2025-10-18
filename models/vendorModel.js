import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    internalId:{type:String},
    phone: { type: String },
    website: { type: String },
    type: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    address: { type: String },
    country: { type: String },
  },
  { timestamps: true }
);

const Vendor = mongoose.model("Vendor", vendorSchema);
export default Vendor;
