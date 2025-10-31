import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  partId: { type: mongoose.Schema.Types.ObjectId, ref: "SparePart", required: true },
  partNumber: { type: String, required: true },
  partName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 }
}, { _id: true });

const fleetInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, sparse: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String },
    customerAddress: { type: String },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 13, min: 0, max: 100 },
    taxAmount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },
    dueDate: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const FleetInvoice = mongoose.model("FleetInvoice", fleetInvoiceSchema);

