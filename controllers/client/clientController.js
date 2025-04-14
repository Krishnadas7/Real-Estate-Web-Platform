import bcrypt from "bcryptjs";
import Client from "../../models/clients/clientSchema.js";
import { sendEmail, verifyEmail ,sendEmailForgotPassword} from "../../srevices/nodemailer.js";
import { clientBasicSchmema ,otpSchema,clinetLoginSchema} from "../../validations/clientSchma.js";
import Service from '../../models/services/serviceSchema.js'

export const sendOtp = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      company,
      mobile,
      address,
      password,
    } = req.body;
 
    const { error } = clientBasicSchmema.validate(req.body, { allowUnknown: false });
        if (error) {
          return res.status(400).json({success:false, error: error.details[0].message });
        }
    // Check if the client already exists
    const existingClient = await Client.findOne({ email:email,isVerified:true });
    if (existingClient) {
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
      const newClient = new Client({
        firstName,
        lastName,
        email,
        company,
        mobile,
        address,
        password: hashedPassword,
        isVerified: false,
      });

      await newClient.save();

      return res.status(200).json({
        message: "OTP sent and client registered. Please verify your email.",
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
};

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
      const client = await Client.findOneAndUpdate(
        { email },
        { $set: { isVerified: true } },
        { new: true }
      );

      if (!client) {
        return res.status(404).json({ message: "Client not found." });
      }

      return res.status(200).json({
        success:true,
        message: "Email verified successfully.",
        data:client
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

export const clientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { error } = clinetLoginSchema.validate(req.body, { allowUnknown: false });
    if (error) {
      return res.status(400).json({success:false, error: error.details[0].message });
    }
    if (!email || !password) {
      return res.status(400).json({success:false, message: "Email and password are required." });
    }

    const client = await Client.findOne({ email:email,isVerified:true });
    if (!client) {
      return res.status(404).json({success:false, message: "Client with this email does not exist." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(401).json({success:false, message: "Incorrect password." });
    }


    // Successful login
    return res.status(200).json({
      message: "Login successful.",
      data: {
        id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        company: client.company,
        profileUrl: client.profileUrl
      },
    });

  } catch (error) {
    console.error("Login error:", error.message || error);
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
      error: error.message || error,
    });
  }
};
// in the client side take the forgottoken from the url 
// with help of the urlSearchParams and call a api for
//  validation the token and make a state true shwo the ui
//  based on that state token validation time is 5 min
export const forgotPasswordEmail = async (req,res) =>{
  try {
    const {email} = req.body
    console.log(email);
    
    const client = await Client.findOne({email})
    console.log(client);
    
    if(!client){
      return res.status(401).json({
        success:false,
        message: "User not exist",
      });
    }
    console.log('dd');
    
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
      const client = await Client.findOne({email})
      if(client){
        client.password=hashedPassword
        await client.save()
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

export const listService = async (req, res) => {
  try {
    const services = await Service.find();

    return res.status(200).json({
      success: true,
      message: 'Services fetched successfully',
      data: services,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching services',
    });
  }
};