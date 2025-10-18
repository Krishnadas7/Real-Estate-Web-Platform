import mongoose from 'mongoose'

// Expense Schema
const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String },
  amount: { type: Number, required: true },
  description: { type: String },
  receiptUrl: { type: String }, // upload receipt
  date: { type: Date }
}, { timestamps: true });

export const Expense = mongoose.model("Expense", expenseSchema);