import Client from "../../models/clients/clientSchema.js";
import path from "path";

export const createClient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      company,
      mobile,
      agentTask,
    } = req.body;

    // Check if client already exists by email
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: "Client with this email already exists",
      });
    }

    // Construct profileUrl if file uploaded
    let profileUrl = "";
if (req.file) {
  const host = req.protocol + "://" + req.get("host"); // e.g., http://localhost:5000
  profileUrl = `${host}/uploads/images/${req.file.filename}`;
}


    // Create and save the new client
    const newClient = new Client({
      firstName,
      lastName,
      email,
      company,
      mobile,
      agentTask,
      profileUrl,
    });

    await newClient.save();

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: newClient,
    });

  } catch (error) {
    console.error("Error in createClient:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating client",
    });
  }
};

export const getAllClients = async (req, res) => {
    try {
      const clients = await Client.find().sort({ createdAt: -1 }); // latest first
      res.status(200).json({ success: true, data: clients,message:"All client lists" });
    } catch (error) {
      console.error("Error fetching clients:", error.message);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };

  export const getClientProfile = async (req, res) => {
    try {
      const { clientId } = req.params;
  
      const client = await Client.findById(clientId);
  
      if (!client) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
  
      res.status(200).json({ success: true, data: client,message:"Client Profile data" });
    } catch (error) {
      console.error("Error fetching client profile:", error.message);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }; 
 
  export const deleteClient = async (req, res) => {
    try {
      const { clientId } = req.params;
  
      const deletedClient = await Client.findByIdAndDelete(clientId);
  
      if (!deletedClient) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
  
      res.status(200).json({ success: true, message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error.message);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }; 

export const updateClientProfile = async (req,res) =>{
    try {
        const { clientId, ...updateData } = req.body;

        if (!clientId) {
            return res.status(400).json({ success: false, message: "Client Id is required" });
        }
        if (updateData.email) {
            const existingClient = await Customer.findOne({
                email: updateData.email});
            
            if (existingClient) {
                return res.status(400).json({ success: false, message: "Email already exists" });
            }
        }   
            // Find customer and update
      const client = await Client.findOneAndUpdate(
        { _id: clientId }, 
        { $set: updateData }, 
        { new: true }
    );

    if (!client) {
        return res.status(404).json({ success: false, message: "Client not found" });
    }

    res.status(200).json({ success: true, message: "Client updated successfully", data:client });
    } catch (error) {
        
    }
}  