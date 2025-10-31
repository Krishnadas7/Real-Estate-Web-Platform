import mongoose from "mongoose";

const lawyerDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  firm: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  caseNumber: { type: String },
  courtDate: { type: Date },
  status: {
    type: String,
    enum: ['active', 'closed', 'pending'],
    default: 'active'
  }
}, { _id: false });

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      default: function() {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000);
        return `TK-${year}-${random.toString().padStart(4, '0')}`;
      }
    },
    violationType: {
      type: String,
      required: true
    },
    violationDescription: {
      type: String,
      required: true
    },
    dateIssued: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'fight'],
      required: true,
      default: 'unpaid'
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true
    },
    officerName: {
      type: String,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    lawyerDetails: {
      type: lawyerDetailsSchema
    },
    notes: {
      type: String
    },
    // Additional tracking fields
    paidDate: {
      type: Date
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'check', 'credit_card', 'online', 'other']
    },
    paymentReference: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
ticketSchema.index({ status: 1 });
ticketSchema.index({ dateIssued: -1 });
ticketSchema.index({ driver: 1 });
ticketSchema.index({ vehicle: 1 });
ticketSchema.index({ ticketNumber: 1 });

export const Ticket = mongoose.model("Ticket", ticketSchema);

