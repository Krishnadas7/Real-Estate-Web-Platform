import mongoose from 'mongoose'

const loadSchema = new mongoose.Schema(
  {
    details: {
      orderType: { type: String, default: '' },
      internalId: { type: String, default: '' },
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      facilator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Facilator',
        default: null
      },
      driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        default: null
      },
      adHoc: { type: Number, default: null },
      addMisc: { type: Boolean, default: null },
      dispatchImmediately: { type: Boolean, default: null },
      requiredProof: {
        type: String,
        enums: ['scan', 'signature', 'photo'],
        default: null
      }
    },
    route: {
      multipleDropOffs: { type: Boolean, default: null },
      selectPickup: { place:{type:String},longitude:{type:String},latitude:{type:String} },
      selectDropOff: { place:{type:String},longitude:{type:String},latitude:{type:String} },
      selectReturn: { type: String, default: null },
      wayPoints: [
        {
           address:{place:{type:String},longitude:{type:String},latitude:{type:String}  },
          customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
          },
          dropOff: { type: Boolean, default: false },
          pickup: { type: Boolean, default: false }
        }
      ]
    },
    payloads: [
      {
        itemName: { type: String },
        sku: { type: String },
        itemImageUrl: { type: String },
        internalId: { type: String },
        description: { type: String },
        priceAndValues: {
          price: { type: Number },
          salePrice: { type: Number },
          cost: { type: Number },
          discountValue: { type: Number }
        },
        measurementAndWeight: {
          length: { type: Number },
          width: { type: Number },
          height: { type: Number },
          weight: { type: Number }
        }
      }
    ],
    services: {
      applyServiceRate: { type: Boolean }
    },
    notes: {
      type: String
    },
    documents: [
      {
        documentUrl: {
          type: String
        }
      }
    ],
    status:{
      type:String,
      enum: ["pending", "active", "completed"],
      default:'pending'
    },
    assignedAt: { type: Date, default: null },
  startedAt: { type: Date},
  completedAt: { type: Date},
  liveLocation: {
  latitude: { type: String, default: null },
  longitude: { type: String, default: null },
  updatedAt: { type: Date }
     },
  locationHistory: [
        {
          latitude: String,
          longitude: String,
          timestamp: { type: Date, default: Date.now }
        }
    ]
  },
  { timestamps: true }
)

const Load = mongoose.model('Load', loadSchema)
export default Load
