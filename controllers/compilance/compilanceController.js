// controllers/complianceController.js
import VehicleDocuments from "../../models/driver/vehicleDocumentsModel.js";
import { DriverDocument } from "../../models/driver/driverDocumentModel.js";
import { CvsaInspection } from "../../models/cvsaInspectionModel.js";
import { Ticket } from "../../models/ticketModel.js";
import { Vehicle } from "../../models/driver/vehicleModel.js";
import { User } from "../../models/driver/userModel.js";

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

// ✅ CVSA Inspection - Get All Inspections
export const getCvsaInspections = async (req, res) => {
  try {
    const { country, status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // Filter by country
    if (country && ['canada', 'usa'].includes(country)) {
      query.country = country;
    }

    // Filter by status
    if (status && ['pass', 'fail', 'warning', 'out-of-service'].includes(status)) {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { inspectionId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { inspectorName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const inspections = await CvsaInspection.find(query)
      .populate('vehicle', 'internalId plateNumber make model year')
      .populate('driver', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CvsaInspection.countDocuments(query);

    res.json({
      success: true,
      message: "CVSA inspections fetched successfully",
      data: inspections,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CVSA Inspection - Get Inspection by ID
export const getCvsaInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const inspection = await CvsaInspection.findById(id)
      .populate('vehicle', 'internalId plateNumber make model year vinNumber')
      .populate('driver', 'name email phone');

    if (!inspection) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }

    res.json({
      success: true,
      message: "CVSA inspection fetched successfully",
      data: inspection
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CVSA Inspection - Create Inspection
export const createCvsaInspection = async (req, res) => {
  try {
    const {
      country,
      date,
      location,
      status,
      vehicle,
      driver,
      inspectorName,
      violations,
      notes,
      inspectionType,
      outOfServiceDate
    } = req.body;

    // Validate required fields
    if (!country || !date || !location || !status || !vehicle || !driver || !inspectorName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: country, date, location, status, vehicle, driver, inspectorName"
      });
    }

    // Validate country
    if (!['canada', 'usa'].includes(country)) {
      return res.status(400).json({
        success: false,
        message: "Invalid country. Must be 'canada' or 'usa'"
      });
    }

    // Validate status
    if (!['pass', 'fail', 'warning', 'out-of-service'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'pass', 'fail', 'warning', or 'out-of-service'"
      });
    }

    // Verify vehicle exists
    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    // Verify driver exists
    const driverExists = await User.findById(driver);
    if (!driverExists) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Create inspection
    const inspection = new CvsaInspection({
      country,
      date,
      location,
      status,
      vehicle,
      driver,
      inspectorName,
      violations: violations || [],
      notes,
      inspectionType,
      outOfServiceDate
    });

    await inspection.save();

    // Populate before sending response
    const populatedInspection = await CvsaInspection.findById(inspection._id)
      .populate('vehicle', 'internalId plateNumber make model year')
      .populate('driver', 'name email');

    res.status(201).json({
      success: true,
      message: "CVSA inspection created successfully",
      data: populatedInspection
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Inspection ID already exists"
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CVSA Inspection - Update Inspection
export const updateCvsaInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate country if provided
    if (updateData.country && !['canada', 'usa'].includes(updateData.country)) {
      return res.status(400).json({
        success: false,
        message: "Invalid country. Must be 'canada' or 'usa'"
      });
    }

    // Validate status if provided
    if (updateData.status && !['pass', 'fail', 'warning', 'out-of-service'].includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'pass', 'fail', 'warning', or 'out-of-service'"
      });
    }

    // Verify vehicle exists if provided
    if (updateData.vehicle) {
      const vehicleExists = await Vehicle.findById(updateData.vehicle);
      if (!vehicleExists) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }
    }

    // Verify driver exists if provided
    if (updateData.driver) {
      const driverExists = await User.findById(updateData.driver);
      if (!driverExists) {
        return res.status(404).json({ success: false, message: "Driver not found" });
      }
    }

    const inspection = await CvsaInspection.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('vehicle', 'internalId plateNumber make model year')
      .populate('driver', 'name email');

    if (!inspection) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }

    res.json({
      success: true,
      message: "CVSA inspection updated successfully",
      data: inspection
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CVSA Inspection - Delete Inspection
export const deleteCvsaInspection = async (req, res) => {
  try {
    const { id } = req.params;

    const inspection = await CvsaInspection.findByIdAndDelete(id);

    if (!inspection) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }

    res.json({
      success: true,
      message: "CVSA inspection deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CVSA Inspection - Get Statistics
export const getCvsaInspectionStats = async (req, res) => {
  try {
    const { country } = req.query;
    const query = country && ['canada', 'usa'].includes(country) ? { country } : {};

    const [
      total,
      pass,
      fail,
      warning,
      outOfService
    ] = await Promise.all([
      CvsaInspection.countDocuments(query),
      CvsaInspection.countDocuments({ ...query, status: 'pass' }),
      CvsaInspection.countDocuments({ ...query, status: 'fail' }),
      CvsaInspection.countDocuments({ ...query, status: 'warning' }),
      CvsaInspection.countDocuments({ ...query, status: 'out-of-service' })
    ]);

    res.json({
      success: true,
      message: "CVSA inspection statistics fetched successfully",
      data: {
        total,
        pass,
        fail,
        warning,
        outOfService
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CVSA Inspection - Monthly Report
export const getCvsaMonthlyReport = async (req, res) => {
  try {
    const { year, country } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Build query
    const query = {};
    if (country && ['canada', 'usa'].includes(country)) {
      query.country = country;
    }

    // Get all inspections for the year
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    query.date = { $gte: startDate, $lte: endDate };

    // Aggregate monthly data
    const monthlyData = await CvsaInspection.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalInspections: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pass'] }, 1, 0] }
          },
          failCount: {
            $sum: { $cond: [{ $eq: ['$status', 'fail'] }, 1, 0] }
          },
          warningCount: {
            $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] }
          },
          outOfServiceCount: {
            $sum: { $cond: [{ $eq: ['$status', 'out-of-service'] }, 1, 0] }
          },
          canadaInspections: {
            $sum: { $cond: [{ $eq: ['$country', 'canada'] }, 1, 0] }
          },
          usaInspections: {
            $sum: { $cond: [{ $eq: ['$country', 'usa'] }, 1, 0] }
          },
          uniqueVehicles: { $addToSet: '$vehicle' },
          uniqueDrivers: { $addToSet: '$driver' }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          totalInspections: 1,
          passCount: 1,
          failCount: 1,
          warningCount: 1,
          outOfServiceCount: 1,
          canadaInspections: 1,
          usaInspections: 1,
          vehiclesInspected: { $size: '$uniqueVehicles' },
          driversInspected: { $size: '$uniqueDrivers' }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    // Get month names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Format data with month names and fill missing months with zeros
    const formattedData = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyData.find(m => m.month === month);
      if (monthData) {
        formattedData.push({
          month: monthNames[month - 1],
          year: monthData.year,
          totalInspections: monthData.totalInspections,
          passCount: monthData.passCount,
          failCount: monthData.failCount,
          warningCount: monthData.warningCount,
          outOfServiceCount: monthData.outOfServiceCount,
          canadaInspections: monthData.canadaInspections,
          usaInspections: monthData.usaInspections,
          vehiclesInspected: monthData.vehiclesInspected,
          driversInspected: monthData.driversInspected
        });
      } else {
        formattedData.push({
          month: monthNames[month - 1],
          year: targetYear,
          totalInspections: 0,
          passCount: 0,
          failCount: 0,
          warningCount: 0,
          outOfServiceCount: 0,
          canadaInspections: 0,
          usaInspections: 0,
          vehiclesInspected: 0,
          driversInspected: 0
        });
      }
    }

    // Calculate summary statistics
    const summary = {
      totalInspections: formattedData.reduce((sum, m) => sum + m.totalInspections, 0),
      totalPass: formattedData.reduce((sum, m) => sum + m.passCount, 0),
      totalFail: formattedData.reduce((sum, m) => sum + m.failCount, 0),
      totalWarning: formattedData.reduce((sum, m) => sum + m.warningCount, 0),
      totalOutOfService: formattedData.reduce((sum, m) => sum + m.outOfServiceCount, 0),
      totalCanada: formattedData.reduce((sum, m) => sum + m.canadaInspections, 0),
      totalUSA: formattedData.reduce((sum, m) => sum + m.usaInspections, 0),
      averagePassRate: formattedData.length > 0
        ? Math.round(
            (formattedData.reduce((sum, m) => sum + m.passCount, 0) /
              formattedData.reduce((sum, m) => sum + m.totalInspections, 0)) *
              100
          )
        : 0
    };

    res.json({
      success: true,
      message: "Monthly CVSA inspection report fetched successfully",
      data: {
        monthlyData: formattedData,
        summary,
        year: targetYear
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Ticket - Get All Tickets
export const getTickets = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // Filter by status
    if (status && ['paid', 'unpaid', 'fight'].includes(status)) {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { violationType: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { officerName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tickets = await Ticket.find(query)
      .populate('vehicle', 'internalId plateNumber make model year')
      .populate('driver', 'name email')
      .sort({ dateIssued: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(query);

    res.json({
      success: true,
      message: "Tickets fetched successfully",
      data: tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Ticket - Get Ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await Ticket.findById(id)
      .populate('vehicle', 'internalId plateNumber make model year vinNumber')
      .populate('driver', 'name email phone');

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({
      success: true,
      message: "Ticket fetched successfully",
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Ticket - Create Ticket
export const createTicket = async (req, res) => {
  try {
    const {
      violationType,
      violationDescription,
      dateIssued,
      location,
      amount,
      status,
      driver,
      vehicle,
      officerName,
      dueDate,
      lawyerDetails,
      notes,
      paidDate,
      paymentMethod,
      paymentReference
    } = req.body;

    // Validate required fields
    if (!violationType || !violationDescription || !dateIssued || !location || 
        !amount || !status || !driver || !vehicle || !officerName || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate status
    if (!['paid', 'unpaid', 'fight'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'paid', 'unpaid', or 'fight'"
      });
    }

    // Validate lawyer details if status is 'fight'
    if (status === 'fight' && lawyerDetails) {
      if (!lawyerDetails.name || !lawyerDetails.firm || !lawyerDetails.phone || 
          !lawyerDetails.email || !lawyerDetails.address) {
        return res.status(400).json({
          success: false,
          message: "All lawyer details fields are required when status is 'fight'"
        });
      }
    }

    // Verify vehicle exists
    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    // Verify driver exists
    const driverExists = await User.findById(driver);
    if (!driverExists) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Create ticket
    const ticket = new Ticket({
      violationType,
      violationDescription,
      dateIssued,
      location,
      amount,
      status,
      driver,
      vehicle,
      officerName,
      dueDate,
      lawyerDetails: status === 'fight' && lawyerDetails ? lawyerDetails : undefined,
      notes,
      paidDate,
      paymentMethod,
      paymentReference
    });

    await ticket.save();

    // Populate before sending response
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('vehicle', 'internalId plateNumber make model year')
      .populate('driver', 'name email');

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: populatedTicket
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ticket number already exists"
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Ticket - Update Ticket
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate status if provided
    if (updateData.status && !['paid', 'unpaid', 'fight'].includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'paid', 'unpaid', or 'fight'"
      });
    }

    // Validate lawyer details if status is 'fight'
    if (updateData.status === 'fight' && updateData.lawyerDetails) {
      if (!updateData.lawyerDetails.name || !updateData.lawyerDetails.firm || 
          !updateData.lawyerDetails.phone || !updateData.lawyerDetails.email || 
          !updateData.lawyerDetails.address) {
        return res.status(400).json({
          success: false,
          message: "All lawyer details fields are required when status is 'fight'"
        });
      }
    }

    // If status is not 'fight', remove lawyer details
    if (updateData.status && updateData.status !== 'fight') {
      updateData.lawyerDetails = undefined;
    }

    // Verify vehicle exists if provided
    if (updateData.vehicle) {
      const vehicleExists = await Vehicle.findById(updateData.vehicle);
      if (!vehicleExists) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }
    }

    // Verify driver exists if provided
    if (updateData.driver) {
      const driverExists = await User.findById(updateData.driver);
      if (!driverExists) {
        return res.status(404).json({ success: false, message: "Driver not found" });
      }
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('vehicle', 'internalId plateNumber make model year')
      .populate('driver', 'name email');

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Ticket - Delete Ticket
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findByIdAndDelete(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({
      success: true,
      message: "Ticket deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Ticket - Get Statistics
export const getTicketStats = async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          paid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          unpaid: {
            $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] }
          },
          fight: {
            $sum: { $cond: [{ $eq: ['$status', 'fight'] }, 1, 0] }
          },
          totalAmount: { $sum: '$amount' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
          },
          unpaidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, '$amount', 0] }
          },
          fightAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'fight'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      paid: 0,
      unpaid: 0,
      fight: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      fightAmount: 0
    };

    res.json({
      success: true,
      message: "Ticket statistics fetched successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
