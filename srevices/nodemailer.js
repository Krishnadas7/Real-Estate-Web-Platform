import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'


const generateOtp = async () => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};
const map = new Map()

export const sendEmail = async (email, firstName, subject) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMPT_USERNAME,
        pass: process.env.SMPT_PASSWORD, 
      },
    });
    if (map) {
        map.clear();
      }
    const otp = await generateOtp();
      if(otp){
        map.set(email, otp);
      }
    const htmlContent = `
    
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${firstName},</h2>
        <p>Thank you for registering on our platform!</p>
        <p>To verify your email address and complete your registration, please use the OTP provided below:</p>
        <h3 style="color: #2e86de;">Your Verification OTP: ${otp}</h3>
        <p>This OTP is valid for the next 10 minutes. Please do not share it with anyone.</p>
        <br/>
        <p>If you did not initiate this request, please ignore this message.</p>
        <p>Best regards,<br/>The Team</p>
    </div>

    `;

    const mailOptions = {
      from: '"Real Estate" <skrishnadas38@gmail.com>',
      to: email,
      subject: subject,
      html: htmlContent,
    };
    console.log(map);
    
    await transporter.sendMail(mailOptions);
    return true
  } catch (error) {
    console.error("Failed to send email:", error.message || error);
  }
};

export const verifyEmail = async (enteredOTP,email) =>{
    try {
        const expectedOTP = map.get(email);
        if (expectedOTP === enteredOTP) {
            console.log('truee');
            
            map.delete(email);
            return true;
          } else {
            return false;
          }
    } catch (error) {
        console.error("Failed to send email:", error.message || error);
    }
}

export const sendEmailForgotPassword = async (email) =>{
    try {
        let forgotToken = jwt.sign(
            {email:email},
            process.env.FORGOT_TOKEN_KEY,
            {expiresIn:'5m'}  
          )
          console.log(forgotToken);
          
          const transporter = nodemailer.createTransport({
            host: process.env.SMPT_HOST,
            port: 587,
            secure: false,
            auth: {
              user: process.env.SMPT_USERNAME,
              pass: process.env.SMPT_PASSWORD, 
            },
          });

          const mailOption ={
            from:process.env.SMPT_USERNAME,
            to:email,
            subject:'LINK FOR FORGOT PASSWORD',
            html:`<div> <a href='/new-password?forgotToken=${forgotToken}'>reset your passowrd please click here<a/><div/>`
          }
          await transporter.sendMail(mailOption)
          return true
    } catch (error) {
        return false
        
    }
}