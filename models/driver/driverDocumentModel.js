import mongoose from "mongoose";

const driverDocumentSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  documentType: {
    type: String,
    enum: [
      "Driver License",
      "Medical Certificate",
      "Work Authorization",
      "Driver Abstract",
      "Background Check",
      "Drug & Alcohol Test",
      "Training Certificate",
      "Insurance Policy",
      "Company Policy"
    ],
    required: true
  },
  documentNumber: { type: String },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  fileUrl: { type: String }, // S3 / local storage
  status: { type: String, enum: ["expiring-soon",'completed', "expired", "pending"], default: "valid" }
}, { timestamps: true });

export const DriverDocument = mongoose.model("DriverDocument", driverDocumentSchema);
