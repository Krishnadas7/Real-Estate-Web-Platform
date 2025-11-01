import { VehicleService } from "../../models/driver/vehicleService.js";
import { Vehicle } from "../../models/driver/vehicleModel.js";

// Service intervals in KM (when to schedule next service)
const SERVICE_INTERVALS = {
  "oil-change": 10000,
  "tire-rotation": 15000,
  "brake-inspection": 20000,
  "general-maintenance": 25000,
  "other": 30000,
  "inspection": 365 // days
};

// Mapping from vehicle model's lastService field names (camelCase) to serviceType (hyphen-case)
const SERVICE_KEY_TO_TYPE = {
  "oilChange": "oil-change",
  "tireRotation": "tire-rotation",
  "brakeInspection": "brake-inspection",
  "generalMaintenance": "general-maintenance",
  "other": "other",
  "inspection": "inspection"
};

// {
//   "vehicleId": "67100d48f2e54b1e8b7e55d2",
//   "serviceType": "oil-change",
//   "priority": "high",
//   "dueDate": "2025-10-25",
//   "dueMileage": 15000,
//   "assignedMechanic": "67100d55f2e54b1e8b7e55f1",
//   "description": "Engine oil due for replacement"
// }

// ✅ Calculate upcoming services based on lastService and odometer
const calculateUpcomingServices = (vehicle) => {
  const upcomingServices = [];
  const currentOdometer = vehicle.odometer || 0;
  
  Object.keys(vehicle.lastService || {}).forEach(serviceKey => {
    const serviceType = SERVICE_KEY_TO_TYPE[serviceKey];
    const lastServiceData = vehicle.lastService[serviceKey];
    
    if (serviceType && lastServiceData && lastServiceData.mileage) {
      const lastMileage = lastServiceData.mileage || 0;
      const interval = SERVICE_INTERVALS[serviceType];
      
      if (interval && interval !== 365) { // Skip inspection (days, not km)
        const nextMileage = lastMileage + interval;
        const remainingKm = nextMileage - currentOdometer;
        const dueDate = new Date(lastServiceData.date || Date.now());
        dueDate.setDate(dueDate.getDate() + 90); // 90 days default
        
        upcomingServices.push({
          serviceType: serviceType,
          status: remainingKm < 0 ? "overdue" : "upcoming",
          dueDate: dueDate,
          dueMileage: nextMileage
        });
      }
    }
  });
  
  return upcomingServices;
};

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
    console.log("✅ Vehicle found:", vehicle.internalId);

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
    console.log("📝 Additional Data:", req.body);
    
    const { id } = req.params;
    const { status, performedBy, notes } = req.body;

    if (!["pending", "in-progress", "completed"].includes(status)) {
      console.log("❌ Invalid status value:", status);
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const updatedService = await VehicleService.findById(id).populate("vehicleId");
    if (!updatedService) {
      console.log("❌ Service not found:", id);
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Update service status
    updatedService.status = status;
    await updatedService.save();

    // ✅ If service is completed, update vehicle's lastService and serviceHistory
    if (status === "completed") {
      const vehicle = updatedService.vehicleId;
      const serviceType = updatedService.serviceType;
      const currentOdometer = vehicle.odometer || 0;
      
      // Convert hyphen-case serviceType to camelCase serviceKey
      const serviceKey = Object.keys(SERVICE_KEY_TO_TYPE).find(
        key => SERVICE_KEY_TO_TYPE[key] === serviceType
      );
      
      console.log(`🔧 Updating vehicle ${vehicle.internalId} with completed ${serviceType} service`);

      // Ensure lastService exists
      if (!vehicle.lastService) {
        vehicle.lastService = {};
      }

      // Update lastService (create if doesn't exist)
      if (serviceKey) {
        if (!vehicle.lastService[serviceKey]) {
          vehicle.lastService[serviceKey] = {};
        }
        vehicle.lastService[serviceKey].mileage = currentOdometer;
        vehicle.lastService[serviceKey].date = new Date();
      }

      // Add to serviceHistory
      const historyEntry = {
        serviceType: serviceType,
        status: "completed",
        performedBy: performedBy || req.user?._id,
        performedAt: new Date(),
        mileageAtService: currentOdometer,
        notes: notes || ""
      };
      
      if (!vehicle.serviceHistory) {
        vehicle.serviceHistory = [];
      }
      vehicle.serviceHistory.push(historyEntry);

      // Recalculate upcoming services
      vehicle.upcomingServices = calculateUpcomingServices(vehicle);
      
      await vehicle.save();
      console.log("✅ Vehicle service history and upcoming services updated");
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
      .populate("vehicleId", "internalId plateNumber model")
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


