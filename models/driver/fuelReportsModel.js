import mongoose from "mongoose";

const fuelReportSchema = new mongoose.Schema({
    reporter:{type:mongoose.Types.ObjectId,ref:"User"},
    driver:{type:mongoose.Types.ObjectId,ref:"User"},
    vehicle:{type:mongoose.Types.ObjectId,ref:"Vehicle"},
    odometer:{type:String},
    cost:{type:String},
    volume:{type:String},
    type:{type:String},
    location:{address:{type:String},longitude:{type:String},latitude:{type:String}},
    status:{type:String,enum:['approved','pending'],default:'rejected'}
}, { timestamps: true });



const FuelReport = mongoose.model("FuelReport", fuelReportSchema);
export default FuelReport;
