import Service from "../../models/services/serviceSchema.js";

export const createService = async (req, res) => {
  try {
    const {
      name,
      priceType,
      price,
      variablePricing,
      duration,
    } = req.body;

    // Validate required fields
    if (!name || !priceType || !duration) {
      return res.status(400).json({ message: "Name, priceType, and duration are required." });
    }

    // Parse variablePricing if sent as a string (from form-data)
    let parsedVariablePricing = [];
    if (priceType === 'variable') {
      try {
        parsedVariablePricing = typeof variablePricing === 'string'
          ? JSON.parse(variablePricing)
          : variablePricing;

        if (!Array.isArray(parsedVariablePricing) || parsedVariablePricing.length === 0) {
          return res.status(400).json({ message: "Variable pricing must be a non-empty array." });
        }

        for (const tier of parsedVariablePricing) {
          if (
            typeof tier.min !== 'number' ||
            typeof tier.max !== 'number' ||
            typeof tier.price !== 'number'
          ) {
            return res.status(400).json({ message: "Each variable pricing tier must include min, max, and price as numbers." });
          }
        }
      } catch (err) {
        return res.status(400).json({ message: "Invalid variablePricing format. Must be a valid JSON array." });
      }
    }

    // Parse onsiteDurations if sent as a string (from form-data)

    // Build thumbnail URL if file is uploaded
    let thumpNail = "";
    if (req.file) {
      const host = req.protocol + "://" + req.get("host");
      thumpNail = `${host}/uploads/images/${req.file.filename}`;
    }

    // Create and save the service
    const newService = new Service({
      name,
      priceType,
      price: priceType === 'fixed' ? price : undefined,
      variablePricing: priceType === 'variable' ? parsedVariablePricing : [],
      duration,
      thumpNail
    });

    await newService.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: newService
    });

  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating service"
    });
  }
};

export const updateService = async (req, res) => {
    try {
      const { serviceId, ...updateData } = req.body;
  
      if (!serviceId) {
        return res.status(400).json({ success: false, message: "Service ID is required" });
      }
  
      // Validate and parse variablePricing if present
      if (updateData.priceType === 'variable') {
        if (!updateData.variablePricing) {
          return res.status(400).json({ success: false, message: "Variable pricing data is required" });
        }
  
        let parsedPricing;
        try {
          parsedPricing = typeof updateData.variablePricing === 'string'
            ? JSON.parse(updateData.variablePricing)
            : updateData.variablePricing;
  
          if (!Array.isArray(parsedPricing) || parsedPricing.length === 0) {
            return res.status(400).json({ success: false, message: "Variable pricing must be a non-empty array" });
          }
  
          for (const tier of parsedPricing) {
            if (
              typeof tier.min !== 'number' ||
              typeof tier.max !== 'number' ||
              typeof tier.price !== 'number'
            ) {
              return res.status(400).json({ success: false, message: "Each tier must include min, max, and price as numbers" });
            }
          }
  
          updateData.variablePricing = parsedPricing;
          updateData.price = undefined; // remove fixed price if variable pricing is used
  
        } catch (err) {
          return res.status(400).json({ success: false, message: "Invalid variablePricing format. Must be a valid JSON array." });
        }
      }
  
      // Update the service
      const service = await Service.findOneAndUpdate(
        { _id: serviceId },
        { $set: updateData },
        { new: true }
      );
  
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }
  
      res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: service
      });
  
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ success: false, message: "Server error while updating service" });
    }
  };

  export const deleteService = async (req, res) => {
    try {
      const { serviceId } = req.body;
  
      if (!serviceId) {
        return res.status(400).json({ success: false, message: "Service ID is required" });
      }
  
      const deletedService = await Service.findByIdAndDelete(serviceId);
  
      if (!deletedService) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }
  
      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
        data: deletedService,
      });
  
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ success: false, message: "Server error while deleting service" });
    }
  }; 
 
  export const getAllServices = async (req, res) => {
    try {
      const services = await Service.find().sort({ createdAt: -1 }); // latest first
  
      res.status(200).json({
        success: true,
        message: "Services fetched successfully",
        data: services,
      });
  
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching services",
      });
    }
  };  
