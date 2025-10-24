import mongoose from "mongoose";

// Payroll Schema
const payrollSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  baseSalary: { type: Number, required: true },
  // workedHours: { type: Number, default: 0 },
  // milesDriven: { type: Number, default: 0 },
  // loadsCompleted: { type: Number, default: 0 },
  // overtime: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  totalSalary: { type: Number, required: true },
  bonus:{type:Number},
  payDate: { type: Date, default: Date.now },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: Date.now },
}, { timestamps: true });

export const Payroll = mongoose.model("Payroll", payrollSchema);