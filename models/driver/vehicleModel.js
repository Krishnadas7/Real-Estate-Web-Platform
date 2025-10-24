import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    internalId: { type: String, required: true, unique: true },
    plateNumber: { type: String, required: true, unique: true },
    vinNumber: { type: String, required: true, unique: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() },
    driver: { type: mongoose.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["moving", "idle", "stopped", "maintenance"], // typo fixed
      default: "stopped",
    },
    vehicleImage: [{ imageUrl: { type: String } }],
    avatar: { type: String },
    trailer:{type:mongoose.Types.ObjectId,ref:'Trailer'},
    serialNumber:{type:String},
    capacity:{type:String},
    
    currentLocation: {
      address:{type:String},
      longitude: { type: String, required: true },
      latitude: { type: String, required: true },
      updatedAt: { type: Date, default: Date.now }
    },
    speed: { type: Number, default: 0 }, // km/h
    fuelLevel: { type: Number, default: 0 }, // %
    odometer: { type: Number, default: 0 }, // km
    engineOn: { type: Boolean, default: false },

    // Behaviour Metrics
    driverBehaviour: {
      harshBraking: { type: Number, default: 0 },
      speedingEvents: { type: Number, default: 0 },
      idlingDuration: { type: Number, default: 0 } // minutes
    },

    // Engine Health
    engineHealth: {
      faultCodes: [{ code: String, description: String }],
      batteryVoltage: { type: Number, default: 12 },
      engineHours: { type: Number, default: 0 }
    },

    trips: [
      {
        startTime: { type: Date },
        endTime: { type: Date },
        route: [
          { latitude: String, longitude: String, timestamp: Date }
        ]
      }
    ],
    lastService: {
      oilChange: {
        mileage: { type: Number, default: 0 },
        date: { type: Date }
      },
      tireRotation: {
        mileage: { type: Number, default: 0 },
        date: { type: Date }
      },
      brakeInspection: {
        mileage: { type: Number, default: 0 },
        date: { type: Date }
      },
      generalMaintenance: {
        mileage: { type: Number, default: 0 },
        date: { type: Date }
      },
      other: {
        mileage: { type: Number, default: 0 },
        date: { type: Date }
      },
      inspection: {
        date: { type: Date }
      }
    },
   upcomingServices: [
      {
        serviceType: { 
          type: String, 
          enum: ["oil-change","tire-rotation","brake-inspection","general-maintenance","other","inspection"] 
        },
        status: { type: String, enum: ["Overdue", "Upcoming"] },
        dueDate: { type: Date },
        dueMileage: { type: Number }
      }
    ],
    serviceHistory: [
      {
        serviceType: { 
          type: String, 
          enum: ["oil-change","tire-rotation","brake-inspection","general-maintenance","other","inspection"] 
        },
        status: { type: String, enum: ["completed","vverdue","upcoming"] },
        performedBy: { type: mongoose.Types.ObjectId, ref: "User" },
        performedAt: { type: Date },
        mileageAtService: { type: Number },
        notes: { type: String }
      }
    ]
  },
  { 
    timestamps: true,
  }
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
