import mongoose from "mongoose";

const trailerSchema = new mongoose.Schema(
  {
    trailer: { type: String, required: true },
    plateNumber: { type: String, required: true, unique: true },
    type: { 
      type: String, 
      enum: ['dry_van', 'refrigerated', 'flatbed', 'tanker', 'container'],
      required: true 
    },
    ownerShip: { type: String },
    lastDispatch: { type: String },
    lastDropLocation: { type: String },
    note: { type: String },
    operationStatus: { 
      type: String, 
      enum: ['in_transit', 'loading', 'idle', 'maintenance', 'available'],
      default: 'available' 
    },
    loadStatus: { type: String },
    compilance: { type: String },
    
    // GPS Tracking Fields
    internalId: { type: String, unique: true, sparse: true }, // For Geotab integration
    currentLocation: {
      address: { type: String },
      longitude: { type: String },
      latitude: { type: String },
      updatedAt: { type: Date, default: Date.now }
    },
    speed: { type: Number, default: 0 }, // km/h
    status: {
      type: String,
      enum: ["moving", "idle", "stopped", "maintenance"],
      default: "stopped",
    },
    
    // Trailer-specific fields
    capacity: { type: String, required: true },
    isAttached: { type: Boolean, default: false },
    attachedVehicle: { 
      type: mongoose.Types.ObjectId, 
      ref: "Vehicle" 
    },
    
    // Cargo Information
    cargoDetails: {
      cargoType: { type: String },
      weight: { type: Number, default: 0 },
      capacity: { type: Number },
      description: { type: String },
      temperature: { type: Number }, // For refrigerated trailers
      isRefrigerated: { type: Boolean, default: false }
    },
    
    // Sensor Data
    sensors: {
      doorStatus: { 
        type: String, 
        enum: ['locked', 'unlocked', 'open'],
        default: 'locked' 
      },
      temperature: { type: Number },
      humidity: { type: Number },
      shockDetection: { type: Boolean, default: false },
      tilting: { type: Boolean, default: false }
    },
    
    // Maintenance Information
    maintenance: {
      lastService: { type: Date },
      nextService: { type: Date },
      tyreCondition: { 
        type: String, 
        enum: ['good', 'fair', 'poor'],
        default: 'good' 
      },
      brakeCondition: { 
        type: String, 
        enum: ['good', 'fair', 'poor'],
        default: 'good' 
      },
      issues: [{ type: String }]
    },
    
    // Route History
    route: [{
      latitude: { type: String },
      longitude: { type: String },
      timestamp: { type: Date }
    }],
    
    destination: {
      address: { type: String },
      latitude: { type: String },
      longitude: { type: String },
      updatedAt: { type: Date }
    },
    
    company: { type: mongoose.Types.ObjectId, ref: "CompanySettings" }
  },
    
  { timestamps: true }
);

export const Trailer = mongoose.model("Trailer", trailerSchema);
