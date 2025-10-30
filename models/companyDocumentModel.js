import mongoose from "mongoose";

const companyDocumentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CompanySettings", required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ["hr", "offer", "safety", "hiring", "legal", "other"], default: "other" },
    description: { type: String },
    type: { type: String },
    size: { type: Number },
    url: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

companyDocumentSchema.index({ company: 1, category: 1, createdAt: -1 });

export const CompanyDocument = mongoose.model("CompanyDocument", companyDocumentSchema);


