import mongoose from "mongoose";

const workOrderSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    issue: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "inprogress", "completed"],
      default: "open",
    },
    description: {
      type: String,
      trim: true,
    },
    assignedMechanic: {
      type: String,
      trim: true,
    },
    estimatedCost: {
      type: Number,
      min: 0,
    },
    estimatedTime: {
      type: String, // e.g., "3 hours", "2 days"
      trim: true,
    },
    repairUpdates: [
      {
        time: { type: Date, default: Date.now },
        note: { type: String, trim: true },
      },
    ],
  },
  { timestamps: true }
);

// Export properly
export const WorkOrder = mongoose.model("WorkOrder", workOrderSchema);
