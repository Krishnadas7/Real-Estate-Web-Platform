import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: true
  },
  planType: {
    type: String,
    enum: ['lifetime', 'monthly'],
    required: true
  },
  subscriptionType: {
    type: String,
    enum: ['one-time', '3-months', '6-months', 'full-app', 'without-hr'],
    required: true
  },
  
  // Pricing details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'CAD'
  },
  
  // Stripe integration
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  stripeSessionId: {
    type: String,
    default: null
  },
  
  // Subscription status
  status: {
    type: String,
    enum: ['pending', 'active', 'cancelled', 'expired', 'past_due'],
    default: 'pending'
  },
  
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  nextBillingDate: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  
  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  lastPaymentDate: {
    type: Date,
    default: null
  },
  
  // Installment tracking (for lifetime plans with installments)
  installments: {
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for efficient queries
subscriptionSchema.index({ admin: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);

