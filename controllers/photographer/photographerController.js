import Photographer from "../../models/photographer/photographerSchema.js";
import { sendEmail } from "../../srevices/nodemailer.js";
import bcrypt from "bcryptjs";
import { otpSchema } from "../../validations/clientSchma.js";
import { verifyEmail } from "../../srevices/nodemailer.js";
import jwt from 'jsonwebtoken'
import { sendEmailForgotPassword } from "../../srevices/nodemailer.js";

export const sendOtp = async (req,res)=>{
    try {
        const {
          email,
          firstName,
          lastName,
          mobile,
          address,
          password,
          bio,
          experience,
          specialization,
          portfolioLinks,
          pricing
        } = req.body;
     
        // const { error } = clientBasicSchmema.validate(req.body, { allowUnknown: false });
        //     if (error) {
        //       return res.status(400).json({success:false, error: error.details[0].message });
        //     }
        // Check if the client already exists
        const existingPhotographer = await Photographer.findOne({ email: email, isVerified: true });

        console.log('====',existingPhotographer);
        
        if (existingPhotographer) {
          return res.status(400).json({ message: "Email already registered." });
        }
    
        // Send verification email
        const result = await sendEmail(
          email,
          firstName,
          "Email Verification - Real Estate"
        );
    
        if (result) {
          // Hash the password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
    
          // Create a new client
          const newPhotographer = new Photographer({
            firstName,
            lastName,
            email,
            mobile,
            address,
            password: hashedPassword,
            isVerified: false,
            bio,
            experience,
            specialization,
            portfolioLinks,
            pricing
          });
    
          await newPhotographer.save();
    
          return res.status(200).json({
            message: "OTP sent and account registered. Please verify your email.",
          });
        } else {
          return res.status(500).json({
            message: "Failed to send OTP email. Please try again later.",
          });
        }
      } catch (error) {
        console.error("Error in sendOtp:", error);
        return res.status(500).json({
          message: "Something went wrong. Please try again.",
          error: error.message || error,
        });
      }
}

export const emailVerification = async (req, res) => {
  try {
    const { enteredOTP, email } = req.body;

    const { error } = otpSchema.validate(req.body, { allowUnknown: false });
    if (error) {
      return res.status(400).json({success:false, error: error.details[0].message });
    }
    const result = await verifyEmail(enteredOTP, email);

    if (result) {
      // OTP is correct, update client to set isVerified true
      const photographer = await Photographer.findOneAndUpdate(
        { email },
        { $set: { isVerified: true } },
        { new: true }
      );

      if (!photographer) {
        return res.status(404).json({ message: "Photographer not found." });
      }

      return res.status(200).json({
        success:true,
        message: "Email verified successfully.",
        data:photographer
      });
    } else {
      return res.status(400).json({success:false, message: "Invalid OTP." });
    }
  } catch (error) {
    return res.status(500).json({
      success:false,
      message: "Something went wrong. Please try again.",
      error: error.message || error,
    });
  }
};
export const loginPhotographer = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if photographer exists
      const photographer = await Photographer.findOne({ email });
      if (!photographer) {
        return res.status(400).json({success:false, message: 'Invalid email or password.' });
      }
  
      // Check if verified
      if (!photographer.isVerified) {
        return res.status(403).json({success:false, message: 'Please verify your email before logging in.' });
      }
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, photographer.password);
      if (!isMatch) {
        return res.status(400).json({success:false, message: 'Invalid email or password.' });
      }
  
      // Generate JWT
      const token = jwt.sign(
        {
          id: photographer._id,
          email: photographer.email,
          role: photographer.role,
        },
        process.env.JWT_ACCESS_TOKEN,
        { expiresIn: '7d' }
      );
  
      return res.status(200).json({
        success:true,
        message: 'Login successful',
        data:{
            token,
            id: photographer._id,
            firstName: photographer.firstName,
            lastName: photographer.lastName,
            email: photographer.email,
            role:photographer.role
        }
      });
  
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  };

 export const forgotPasswordEmail = async (req,res) =>{
   try {
     const {email} = req.body
     console.log(email);
     
     const photographer = await Photographer.findOne({email})
     
     if(!photographer){
       return res.status(401).json({
         success:false,
         message: "User not exist",
       });
     }
     
     const sendOtp = await sendEmailForgotPassword(email)
     console.log(sendOtp);
     
     if(sendOtp){
        return res.status(200).json({
         success:true,
         message:"Please check the provided email"
        })
     }else{
       return res.status(402).json({
         success:false,
         message:"User not exist"
        })
     }
   } catch (error) {
     console.log(error);
     
     return res.status(500).json({
       message: "Something went wrong. Please try again later.",
       error: error.message || error,
     });
   }
 }
 
 export const forgotPassword = async (req,res) =>{
   try {
     const {email,password} = req.body
     const salt = await bcrypt.genSalt(10);
       const hashedPassword = await bcrypt.hash(password, salt);
       const photographer = await Photographer.findOne({email})
       if(photographer){
        photographer.password=hashedPassword
         await photographer.save()
       }
       return res.status(200).json({
         success:true,
         message:"Password Changed Successfully"
       })
   } catch (error) {
     return res.status(200).json({
       success:false,
       message:"Can't Change Password,Try again later"
     })
   }
 } 