import { VehicleService } from "../../models/driver/vehicleService.js";
import { Vehicle } from "../../models/driver/vehicleModel.js";


// {
//   "vehicleId": "67100d48f2e54b1e8b7e55d2",
//   "serviceType": "oil-change",
//   "priority": "high",
//   "dueDate": "2025-10-25",
//   "dueMileage": 15000,
//   "assignedMechanic": "67100d55f2e54b1e8b7e55f1",
//   "description": "Engine oil due for replacement"
// }

// ✅ CREATE SERVICE
export const createVehicleService = async (req, res) => {
  try {
    console.log("🚀 CREATE VEHICLE SERVICE API CALLED");
    console.log("📝 Request Body:", req.body);
    
    const {
      vehicleId,
      serviceType,
      priority,
      dueDate,
      dueMileage,
      assignedMechanic,
      description,
    } = req.body;

    console.log("🔍 Validating vehicle ID:", vehicleId);
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      console.log("❌ Vehicle not found:", vehicleId);
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }
    console.log("✅ Vehicle found:", vehicle.vehicleNumber);

    const newService = new VehicleService({
      vehicleId,
      serviceType,
      priority,
      dueDate,
      dueMileage,
      assignedMechanic, // Now accepts string names
      description,
    });

    console.log("💾 Saving new service:", newService);
    await newService.save();
    console.log("✅ Service created successfully:", newService._id);
    
    res
      .status(201)
      .json({ success: true, message: "Service created successfully", data: newService });
  } catch (error) {
    console.log("❌ CREATE SERVICE ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ UPDATE SERVICE (full update)
export const updateVehicleService = async (req, res) => {
  try {
    console.log("🚀 UPDATE VEHICLE SERVICE API CALLED");
    console.log("📝 Service ID:", req.params.id);
    console.log("📝 Update Data:", req.body);
    
    const { id } = req.params;
    const updateData = req.body;

    const updatedService = await VehicleService.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedService) {
      console.log("❌ Service not found:", id);
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    console.log("✅ Service updated successfully:", id);
    res.json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    console.log("❌ UPDATE SERVICE ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

//  UPDATE SERVICE STATUS
export const updateServiceStatus = async (req, res) => {
  try {
    console.log("🚀 UPDATE SERVICE STATUS API CALLED");
    console.log("📝 Service ID:", req.params.id);
    console.log("📝 New Status:", req.body.status);
    
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "in-progress", "completed"].includes(status)) {
      console.log("❌ Invalid status value:", status);
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const updatedService = await VehicleService.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedService) {
      console.log("❌ Service not found:", id);
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    console.log("✅ Service status updated successfully:", id);
    res.json({
      success: true,
      message: "Service status updated successfully",
      data: updatedService,
    });
  } catch (error) {
    console.log("❌ UPDATE STATUS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ DELETE SERVICE
export const deleteVehicleService = async (req, res) => {
  try {
    console.log("🚀 DELETE VEHICLE SERVICE API CALLED");
    console.log("📝 Service ID:", req.params.id);
    
    const { id } = req.params;

    const deleted = await VehicleService.findByIdAndDelete(id);
    if (!deleted) {
      console.log("❌ Service not found:", id);
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    console.log("✅ Service deleted successfully:", id);
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    console.log("❌ DELETE SERVICE ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ LIST SERVICES (with filters)
export const listVehicleServices = async (req, res) => {
  try {
    console.log("🚀 LIST VEHICLE SERVICES API CALLED");
    console.log("📝 Query Parameters:", req.query);
    
    const { priority, status, serviceType, mechanic, vehicleId } = req.query;

    const filter = {};
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;
    if (mechanic) filter.assignedMechanic = mechanic;
    if (vehicleId) filter.vehicleId = vehicleId;

    console.log("🔍 Applied Filters:", filter);

    const services = await VehicleService.find(filter)
      .populate("vehicleId", "vehicleNumber model")
      .sort({ createdAt: -1 });

    console.log("✅ Found services:", services.length);
    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.log("❌ LIST SERVICES ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


