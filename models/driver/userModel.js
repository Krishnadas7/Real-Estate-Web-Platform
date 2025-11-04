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
      state:{type:String},
      city:{type:String},
      joinDate:{type:Date,required:true},
      profileImageUrl:{type:String,default:null},
      avatar:{type:String},
      status:{type:String,enum:['active','inactive']},
      company: { type: mongoose.Types.ObjectId, ref: "CompanySettings"},
      internalId:{type:String, required: true, unique: true},
      stripeCustomerId:{type:String, default: null},
      location:{
        address:{type:String},
        longitude:{type:String},latitude:{type:String}},


      details:{
        //driver details
        licenceNumber:{type:String},
        vendor:{type:String},
        vehicle:{type:mongoose.Types.ObjectId,ref:"Vehicle"},
        
        // Driver Basic Information
        incorporation: {type: String},
        employeeCode: {type: String},
        postalCode: {type: String},
        
        // Employment & Contact
        fleet: {type: String},
        citizenship: {type: String},
        paymentMethod: {type: String},
        account: {type: String},
        wsib: {type: Boolean, default: false},
        wsibAccountNo: {type: String},
        expiryDate: {type: Date},
        remark: {type: String},
        gstNo: {type: String},
        profileImage: {type: String},
        companyFlag: {type: Boolean, default: false},
        cell1: {type: String},
        cell2: {type: String},
        extension: {type: String},
        fax: {type: String},
        gender: {type: String},
        dateOfBirth: {type: Date},
        hireDate: {type: Date},
        termDate: {type: Date},
        csa: {type: Boolean, default: false},
        fastCardNo: {type: String},
        fastCardExpiry: {type: Date},
        medicalRequired: {type: Boolean, default: false},
        
        // Payment Profile - Default Charges
        defaultChargeName: {type: String},
        defaultCurrency: {type: String},
        chargesAppliedOn: {type: String},
        defaultMode: {type: String},
        defaultAmount: {type: Number, default: 0},
        defaultRemarks: {type: String},
        
        // Payment Profile - Payment Profile
        defaultPayrollType: {type: String},
        paymentCurrency: {type: String},
        mileRate: {type: Number, default: 0},
        mileRateTeam: {type: Number, default: 0},
        emptyMileRate: {type: Number, default: 0},
        emptyMileRateTeam: {type: Number, default: 0},
        hourlyRate: {type: Number, default: 0},
        weightRate: {type: Number, default: 0},
        percentageRate: {type: Number, default: 0},
        localTaxNo: {type: String},
        federalTaxNo: {type: String},
        sinNo: {type: String},
        craAccountNo: {type: String},
        fedTaxExempt: {type: Boolean, default: false},
        provTaxExempt: {type: Boolean, default: false},
        cppQppExempt: {type: Boolean, default: false},
        eiExempt: {type: Boolean, default: false},
        qpipExempt: {type: Boolean, default: false},
        payPeriod: {type: String},
        vacationPay: {type: String},
        ltl: {type: Boolean, default: false},
        onSettlements: {type: Boolean, default: false},
        settlementCurrencyByOrder: {type: Boolean, default: false},
        isDefault: {type: Boolean, default: false},
        
        // customer

      },
},{
    timestamps:true
})

export const User = mongoose.model('User',userSchema)