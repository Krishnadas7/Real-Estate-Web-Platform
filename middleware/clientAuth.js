import Client from "../models/clients/clientSchema.js";
import jwt from 'jsonwebtoken'

export const clientAuth = async (req, res, next) => {
    try {
      let token;
      if (req?.headers?.authorization?.startsWith("Bearer")) {
        token = req?.headers?.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);
        console.log(decoded);
        
        let client = await Client.findOne({
          _id: decoded.id
        });
        if (client) {
          req.id = client._id;
          req.role = client.role;
        } else {
          req.id = null;
          req.role = null;
        }
        next();
      } else {
       return res.json(401).json({success:false,message:"Unauthorized request token error"})
      }
    } catch (error) {
        return res.json(401).json({success:false,message:"Unauthorized token failed"})
    }
  };