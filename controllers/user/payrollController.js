// controllers/payrollController.js
import { Payroll } from "../../models/hr/payrollSchemaModel.js";
import mongoose from "mongoose";

export const createPayroll = async (req, res) => {
  try {
    const { userId, baseSalary, bonus = 0, deductions = 0, payDate, startDate, endDate, loadIds, totalMiles, ratePerMile } = req.body;

    console.log('📝 Creating payroll:', { userId, baseSalary, loadIds: loadIds?.length || 0, totalMiles, ratePerMile });

    // validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    if (baseSalary == null || baseSalary === '' || (typeof baseSalary === 'string' && baseSalary.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: "Base salary is required",
      });
    }

    // ensure numeric values
    const base = Number(baseSalary);
    const extra = Number(bonus);
    const deduct = Number(deductions);

    if (isNaN(base) || isNaN(extra) || isNaN(deduct)) {
      return res.status(400).json({
        success: false,
        message: "Salary, bonus, and deductions must be numbers",
      });
    }

    // calculate total
    const totalSalary = base + extra - deduct;

    // Convert loadIds to ObjectIds if provided
    let loadsArray = [];
    if (loadIds && Array.isArray(loadIds) && loadIds.length > 0) {
      loadsArray = loadIds.map(id => {
        if (mongoose.Types.ObjectId.isValid(id)) {
          return new mongoose.Types.ObjectId(id);
        }
        return null;
      }).filter(id => id !== null);
      console.log(`✅ Converted ${loadsArray.length} load IDs to ObjectIds`);
    }

    // create payroll
    const payroll = new Payroll({
      userId,
      baseSalary: base,
      bonus: extra,
      deductions: deduct,
      totalSalary,
      payDate: payDate || new Date(),
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      loads: loadsArray,
      totalMiles: totalMiles ? Number(totalMiles) : 0,
      ratePerMile: ratePerMile ? Number(ratePerMile) : 0
    });

    await payroll.save();

    console.log('✅ Payroll created successfully:', payroll._id);

    res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      data: payroll,
    });
  } catch (err) {
    console.error("❌ Error creating payroll:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};


export const getPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find()
      .populate("userId", "name role")
      .populate("loads", "details.internalId route.selectPickup route.selectDropOff route.multipleDropOffs route.wayPoints completedAt assignedAt startedAt");
    
    res.json({ success: true, data: payrolls });
  } catch (err) {
    console.error("❌ Error fetching payrolls:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Update Payroll
export const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { baseSalary, bonus, deductions, payDate, startDate, endDate } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll not found" });
    }

    // Update fields if provided
    if (baseSalary !== undefined) payroll.baseSalary = Number(baseSalary);
    if (bonus !== undefined) payroll.bonus = Number(bonus);
    if (deductions !== undefined) payroll.deductions = Number(deductions);
    if (payDate) payroll.payDate = payDate;
    if (startDate) payroll.startDate = startDate;
    if (endDate) payroll.endDate = endDate;

    // Recalculate total salary
    payroll.totalSalary = payroll.baseSalary + payroll.bonus - payroll.deductions;

    await payroll.save();

    res.json({
      success: true,
      message: "Payroll updated successfully",
      data: payroll,
    });
  } catch (err) {
    console.error("Error updating payroll:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ✅ Delete Payroll
export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findByIdAndDelete(id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll not found" });
    }

    res.json({
      success: true,
      message: "Payroll deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting payroll:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};