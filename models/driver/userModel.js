import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
      name:{type:String},
      email:{type:String},
      phone:{type:String},
      country:{type:String},
      password:{type:String},
      role:{type:String,enum:['admin',
        'superadmin','employee','driver','dispatcher','hr','contact','customer','reporter',
        'fleetmanager','safetyofficer','operationsstaff','maintenancecrew','administrative'
      ]},
      policies:{type:String},
      country:{type:String},
      state:{type:String},
      city:{type:String},
      joinDate:{type:Date,required:true},
      profileImageUrl:{type:String,default:null},
      avatar:{type:String},
      status:{type:String,enum:['active','inactive']},
      company: { type: mongoose.Types.ObjectId, ref: "CompanySettings"},
      internalId:{type:String},
      location:{
        address:{type:String},
        longitude:{type:String},latitude:{type:String}},


      details:{
        //driver details
        
        licenceNumber:{type:String},
        vendor:{type:String},
        vehicle:{type:mongoose.Types.ObjectId,ref:"Vehicle"},


        
 
        // customer
        

      },
},{
    timestamps:true
})

export const User = mongoose.model('User',userSchema)