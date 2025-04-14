import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  place: { type: String, required: true },
  pincode: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
});

const photographerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },

    // Profile Info
    profileImage: { type: String ,default:null}, // store image URL
    bio: { type: String },
    address: { type: addressSchema, required: true },

    // Photographer specific
    experience: { type: Number }, // years of experience
    specialization: [{ type: String }], // e.g., ['Wedding', 'Wildlife', 'Fashion']
    portfolioLinks: [{ type: String }], // optional array of external portfolio URLs
    pricing: {
      halfDay: { type: Number },  // optional
      fullDay: { type: Number },  // optional
    },

    // Availability and status
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Photographer = mongoose.model('Photographer', photographerSchema);

export default Photographer;
