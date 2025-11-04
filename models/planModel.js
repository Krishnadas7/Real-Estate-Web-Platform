import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
    trim: true
  },
  planType: {
    type: String,
    enum: ['lifetime', 'monthly'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Lifetime pricing options
  lifetime: {
    oneTime: {
      price: { type: Number, default: 0 },
      currency: { type: String, default: 'CAD' }
    },
    installments: {
      threeMonths: {
        price: { type: Number, default: 0 },
        currency: { type: String, default: 'CAD' },
        enabled: { type: Boolean, default: false }
      },
      sixMonths: {
        price: { type: Number, default: 0 },
        currency: { type: String, default: 'CAD' },
        enabled: { type: Boolean, default: false }
      }
    }
  },
  
  // Monthly pricing options
  monthly: {
    fullApp: {
      price: { type: Number, default: 0 },
      currency: { type: String, default: 'CAD' },
      enabled: { type: Boolean, default: false }
    },
    withoutHR: {
      price: { type: Number, default: 0 },
      currency: { type: String, default: 'CAD' },
      enabled: { type: Boolean, default: false }
    }
  },
  
  features: [{
    name: String,
    included: { type: Boolean, default: true }
  }],
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const Plan = mongoose.model("Plan", planSchema);

