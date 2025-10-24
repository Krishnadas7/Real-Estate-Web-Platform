import { Vehicle } from "../../models/driver/vehicleModel.js";
import { User } from "../../models/driver/userModel.js";
import Load from "../../models/loadModel.js";
import { WorkOrder } from "../../models/driver/workOrderModel.js";
import { Invoice } from "../../models/hr/invoiceModel.js";
import moment from "moment";
import HosLog from "../../models/driver/hosManagement.js";
import VehicleDocuments from "../../models/driver/vehicleDocumentsModel.js";
import { DriverDocument } from "../../models/driver/driverDocumentModel.js";
import { Trailer } from "../../models/driver/trailerModel.js";


export async function getPendingMaintenanceCount(req, res) {
  try {
    const vehicles = await Vehicle.find({}, { upcomingServices: 1 });

    let overdueCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    vehicles.forEach(vehicle => {
      vehicle.upcomingServices.forEach(service => {
        if (service.status === "overdue") overdueCount++;
        if (service.status === "upcoming") upcomingCount++;
        if (service.status === 'completed') completedCount++
      });
    });

    return res.json({
      success: true,
      message: "Pending maintenance counts",
      data: {
        overdue: overdueCount,
        upcoming: upcomingCount,
        completed:completedCount,
        totalPending: overdueCount + upcomingCount
      }
    });
  } catch (err) {
    console.error("Error fetching pending maintenance counts:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getVehicleServicesDashboard(req,res) {
  try {
    const vehicles = await Vehicle.find({}, {
      plateNumber: 1,
      model: 1,
      upcomingServices: 1
    });

    // Optional: Flatten the services for easier dashboard consumption
    const dashboardData = vehicles.map(vehicle => {
      return vehicle.upcomingServices.map(service => ({
        plateNumber: vehicle.plateNumber,
        model: vehicle.model,
        serviceType: service.serviceType,
        status: service.status,
        dueDate: service.dueDate,
        dueMileage: service.dueMileage
      }));
    }).flat();

    return res.json({success:true,message:"upcoming and due services",data:dashboardData})

  } catch (err) {
    console.error("Error fetching vehicle services:", err);
    return res.json({success:false,message:err.message})
  }
}

export const getDashboardStats = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const driversOnDuty = await HosLog.countDocuments({ status: "OnDuty" }); // or use your HOS table
    const activeLoads = await Load.countDocuments({ status: "active" });
    const pendingWorkOrders = await WorkOrder.countDocuments({ status: "inprogress" });
    const pendingInvoices = await Invoice.countDocuments({ status: "pending" });

    res.json({
      success: true,
      data: {
        totalVehicles:totalVehicles,
        driversOnDuty:driversOnDuty,
        activeLoads:activeLoads,
        pendingWorkOrders:pendingWorkOrders,
        pendingInvoices:pendingInvoices,
      },
    });
  } catch (err) {
    res.status(500).json({success:false, error: err.message });
  }
};



// Get Loads Per Month (with all months, 0 if none)
export const getLoadsPerMonth = async (req, res) => {
  try {
    // Aggregate loads by month
    const loadsData = await Load.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: 1 },
        },
      },
    ]);

    // Map month numbers to names
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Initialize all months with 0
    const loadsPerMonth = monthNames.map((month, index) => {
      const monthData = loadsData.find(l => l._id === index + 1);
      return {
        month,
        total: monthData ? monthData.total : 0
      };
    });

    res.json({ success: true, data: loadsPerMonth });
  } catch (err) {
    console.error("Error fetching loads per month:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get Revenue Trend Per Month (with all months and names)
export const getRevenueTrend = async (req, res) => {
  try {
    // Aggregate Paid invoices by month
    const revenueData = await Invoice.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalRevenue: { $sum: { $toDouble: "$amount" } }, // ensure number
        },
      },
    ]);

    // Month names mapping
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Fill all months with 0 if no revenue
    const revenuePerMonth = monthNames.map((month, index) => {
      const monthData = revenueData.find(r => r._id === index + 1);
      return {
        month,
        totalRevenue: monthData ? monthData.totalRevenue : 0
      };
    });

    res.json({ success: true, data: revenuePerMonth });
  } catch (err) {
    console.error("Revenue trend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFuelEfficiency = async (req, res) => {
  try {
    const vehicles = await Vehicle.aggregate([
      {
        $group: {
          _id: null,
          avgMileage: { $avg: "$odometer" }, // Assuming you store MPG or KM/L
          totalFuel: { $sum: "$fuelLevel" },
        },
      },
    ]);

    res.json({ success: true, data: vehicles[0] });
  } catch (err) {
    res.status(500).json({success:false, message: err.message });
  }
};



export const getRecentAlerts = async (req, res) => {
   try {
    const today = new Date();
    const thirtyDaysFromNow = moment().add(30, "days").toDate();

    // 1️⃣ Driver documents expiring in next 30 days
    const driverDocs = await DriverDocument.find({
      expiryDate: { $lte: thirtyDaysFromNow },
      status: { $in: ["expiring-soon", "pending"] }
    })
      .populate("driver", "name email") // include driver details
      .select("documentType documentNumber expiryDate status driver");

    // 2️⃣ Vehicle documents expiring in next 30 days
    const vehicleDocs = await VehicleDocuments.find({
      expiryDate: { $lte: thirtyDaysFromNow },
      status: { $in: ["expiring-soon", "pending"] }
    })
      .populate("vehicleId", "plateNumber internalId") // include vehicle details
      .select("documentType documentNumber expiryDate status vehicleId");

    res.json({
      success: true,
      alerts: {
        driverDocs,
        vehicleDocs,
      },
    });
  } catch (err) {
    console.error("Error fetching document alerts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getVehicleAndWorkOrderStats = async (req, res) => {
  try {
    const companyFilter = req.user.company ? { company: req.user.company } : {};

    // Count total vehicles
    const totalVehicles = await Vehicle.countDocuments(companyFilter);

    // Count active (in-progress) work orders
    const activeWorkOrders = await WorkOrder.countDocuments({ status: "inprogress" });

    // Count total trailers
    const totalTrailers = await Trailer.countDocuments(companyFilter);

    // Count trailers by status
    const trailersInTransit = await Trailer.countDocuments({ ...companyFilter, operationStatus: 'in_transit' });
    const trailersAvailable = await Trailer.countDocuments({ ...companyFilter, operationStatus: 'available' });
    const trailersMaintenance = await Trailer.countDocuments({ ...companyFilter, operationStatus: 'maintenance' });
    const trailersAttached = await Trailer.countDocuments({ ...companyFilter, isAttached: true });

    // Return combined data
    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data: {
        totalVehicles,
        activeWorkOrders,
        totalTrailers,
        trailersInTransit,
        trailersAvailable,
        trailersMaintenance,
        trailersAttached,
        trailersUnattached: totalTrailers - trailersAttached
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
