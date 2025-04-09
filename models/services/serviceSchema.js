import mongoose from 'mongoose'

const ServiceSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
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
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin' // or whoever is creating this service
      }
    },
    {
      timestamps: true // adds createdAt and updatedAt
    }
  );

export default mongoose.model('Service',ServiceSchema) 