// middleware/auth.ts
import jwt from "jsonwebtoken";
import { User } from "../models/driver/userModel.js";
console.log(process.env.JWT_SECRET);


export const authMiddleware =async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({success:false, message: "No token provided" });
  
   
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET );
    
    
    const user = await User.findOne({_id:decoded.id})
    req.user = user;
    next();
  } catch (err) {
    // console.log(err);
    
    return res.status(403).json({success:false, message: "Invalid token" });
  }
};
