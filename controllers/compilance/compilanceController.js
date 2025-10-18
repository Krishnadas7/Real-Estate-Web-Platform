// controllers/complianceController.js
import VehicleDocuments from "../../models/driver/vehicleDocumentsModel.js";
import { DriverDocument } from "../../models/driver/driverDocumentModel.js";

// ✅ Compliance Summary (Vehicles + Drivers)
export const getComplianceSummary = async (req, res) => {
  try {
    // --- VEHICLE DOCUMENTS ---
    const totalVehiclesDocs = await VehicleDocuments.countDocuments();
    const validVehicleDocs = await VehicleDocuments.countDocuments({ status: "completed" });
    const expiredVehicleDocs = await VehicleDocuments.countDocuments({ status: "expired" });
    const expiringSoonVehicleDocs = await VehicleDocuments.countDocuments({ status: "expiring-soon" });

    const vehicleCompliance = {
      total: totalVehiclesDocs,
      valid: validVehicleDocs,
      expired: expiredVehicleDocs,
      expiringSoon: expiringSoonVehicleDocs,
      complianceRate: totalVehiclesDocs > 0 ? Math.round((validVehicleDocs / totalVehiclesDocs) * 100) : 0,
    };

    // --- DRIVER DOCUMENTS ---
    const totalDriverDocs = await DriverDocument.countDocuments();
    const validDriverDocs = await DriverDocument.countDocuments({ status: "completed" });
    const expiredDriverDocs = await DriverDocument.countDocuments({ status: "expired" });
    const expiringSoonDriverDocs = await DriverDocument.countDocuments({ status: "expiring-soon" });

    const driverCompliance = {
      total: totalDriverDocs,
      valid: validDriverDocs,
      expired: expiredDriverDocs,
      expiringSoon: expiringSoonDriverDocs,
      complianceRate: totalDriverDocs > 0 ? Math.round((validDriverDocs / totalDriverDocs) * 100) : 0,
    };

    res.json({
      success: true,
      message: "Compliance summary fetched",
      data: {
        vehicles: vehicleCompliance,
        drivers: driverCompliance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
