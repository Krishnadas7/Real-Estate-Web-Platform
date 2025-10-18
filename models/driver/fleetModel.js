import mongoose from "mongoose";

const fleetSchema = new mongoose.Schema({
    name:{type:String},
    serviceArea:{type:String},
    parentFleet:{type:String},
    vendor:{type:String},
    zone:{type:String},
    manPower:{type:String},
    activeManPower:{type:String},
    task:{type:String},
    status:{type:String,enum:['active','inactive'],default:'active'}
}, { timestamps: true });



const Fleet = mongoose.model("Fleet", fleetSchema);
export default Fleet;
