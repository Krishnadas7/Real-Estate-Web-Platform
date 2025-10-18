import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  clientCompany: { type: String },
  loadId: { type: mongoose.Schema.Types.ObjectId, ref: "Load" }, // Link to your load/job
  amount: { type: String, required: true },
  currency: { type: String, default: "USD" },
  status: { type: String, enum: ["paid", "pending"], default: "pending" },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  paymentDate: { type: Date ,default:null},
  invoiceUrl:{type:String},
  notes: { type: String },
}, { timestamps: true });

export const Invoice = mongoose.model("Invoice", invoiceSchema);
