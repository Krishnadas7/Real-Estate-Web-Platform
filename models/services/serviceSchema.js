import mongoose from 'mongoose'

// Variable Pricing Tier Schema
const VariablePricingSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  { _id: false }
)

// Onsite Duration Schema
const OnsiteDurationSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true }, // in minutes
    max: { type: Number, required: true }  // in minutes
  },
  { _id: false }
)

// Main Service Schema
const ServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    priceType: {
      type: String,
      enum: ['fixed', 'variable'],
      required: true
    },
    price: {
      type: Number // Used when priceType is 'fixed'
    },
    variablePricing: {
      type: [VariablePricingSchema], // Used when priceType is 'variable'
      default: []
    },
    duration: {
      type: String, // Example: "30 mins", "1 hour"
      required: true
    },
    thumpNail: {
      type: String // URL to preview image/icon
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.model('Service', ServiceSchema)
