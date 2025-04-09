import mongoose from 'mongoose'


const AdminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  number: {
    type: Number,
    // unique: true
  },
  profilePic: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["super_admin", "admin"],
    default: "admin"
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"], // Add other statuses as needed
    default: "active"
  },
}, { timestamps: true });

export default mongoose.model('Admin', AdminSchema);