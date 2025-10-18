import mongoose from "mongoose";

const hosLogSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },

  date: { type: Date, required: true }, // one log per day
  totalDrivingHours: { type: Number, default: 0 }, // e.g. 8 hrs
  totalOnDutyHours: { type: Number, default: 0 }, // loading, inspections
  totalOffDutyHours: { type: Number, default: 0 }, // rest
  violations: { type: Boolean, default: false }, // exceeded rule or not

  logs: [
    {
      status: { type: String, enum: ["Driving", "OnDuty", "OffDuty"], required: true },
      startTime: { type: Date, required: true },
      endTime: { type: Date, required: true }
    }
  ]
});

export default mongoose.model("HOSLog", hosLogSchema);
