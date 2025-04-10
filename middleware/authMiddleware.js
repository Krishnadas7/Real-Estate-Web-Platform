import Admin from "../models/admin/adminModel.js";
import jwt from 'jsonwebtoken'

export const adminTokenChecking = async (req, res, next) => {
    try {
      let token;
      if (req?.headers?.authorization?.startsWith("Bearer")) {
        token = req?.headers?.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);
        console.log(decoded);
        
        let admin = await Admin.findOne({
          _id: decoded.id
        });
        if (admin) {
          req.id = admin._id;
          req.role = admin.role;
        } else {
          req.id = null;
          req.role = null;
        }
        next();
      } else {
        res.json(401).json({success:false,message:"Unauthorized request token error"})
      }
    } catch (error) {
        res.json(401).json({success:false,message:"Unauthorized token failed"})
    }
  };