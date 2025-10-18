import mongoose from 'mongoose'

const vehicleDocumentSchema = new mongoose.Schema(
  {
      vehicleId: { type: mongoose.Types.ObjectId, ref: 'Vehicle' },
      documentNumber:{type:String},
      documentType:{type:String,enum:['insurance','permit','fitness','pollution']},
      documentLocation: { type: String },
      status: { type: String,enum:['pending','expired','completed','expiring-soon'] },
      expiryDate: { type: String },
      issuedAt: { type: String }
    
  },
  { timestamps: true }
)

const VehicleDocuments = mongoose.model(
  'VehicleDocuments',
  vehicleDocumentSchema
)
export default VehicleDocuments
