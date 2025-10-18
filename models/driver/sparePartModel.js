import mongoose from "mongoose";

const sparePartSchema = new mongoose.Schema(
  {
    partName: { type: String, required: true },
    stockQty: { type: Number, default: 0 },
    usageHistory: [
      {
        workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder" },
        usedOn: { type: Date, default: Date.now },
        qtyUsed: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

export const SparePart =  mongoose.model("SparePart", sparePartSchema);
