import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
    reportedBy:{type:String},
    assignedTo:{type:String},
    driver:{type:mongoose.Types.ObjectId,ref:"Driver"},
    vehicle:{type:mongoose.Types.ObjectId,ref:"Vehicle"},
    issueType:{type:String,enum:['maintanance','operational','accident','compilance']},
    issueCategory:{type:String,enum:['engine','fuel','paper-work','minor-damage']},
    issueReport:{type:String},
    issueTags:[{type:String}],
    priority:{type:String,enum:['low','medium','high']},
    status:{type:String,enum:['open','in-progress','closed']},
    cordinates:{longitude:{type:String},latitude:{type:String}}
}, { timestamps: true });



const Issue = mongoose.model("Issue", issueSchema);
export default Issue;
