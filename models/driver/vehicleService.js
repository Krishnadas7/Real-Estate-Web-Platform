import mongoose from "mongoose";

const ServiceType = ["oil-change", "tire-rotation", "bike-inspection", "general-maintenance", "other"];
const Priority = ["low", "medium", "high", "urgent"];

const vehicleServiceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    serviceType: {
      type: String,
      enum: ServiceType,
      required: true,
    },
    priority: {
      type: String,
      enum: Priority,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    dueMileage: {
      type: Number,
      required: true,
    },
    assignedMechanic: {
      type: String, // Temporarily accepting string names, can be changed to ObjectId later
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const VehicleService = mongoose.model("VehicleService", vehicleServiceSchema);
