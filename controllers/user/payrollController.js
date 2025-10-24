// controllers/payrollController.js
import { Payroll } from "../../models/hr/payrollSchemaModel.js";

export const createPayroll = async (req, res) => {
  try {
    const { userId, baseSalary, bonus = 0, deductions = 0, payDate, startDate, endDate } = req.body;

    // validation
    if (!userId || baseSalary == null) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and base salary are required",
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

    // create payroll
    const payroll = new Payroll({
      userId,
      baseSalary: base,
      bonus: extra,
      deductions: deduct,
      totalSalary,
      payDate: payDate,
      startDate: startDate,
      endDate: endDate
    });

    await payroll.save();

    res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      data:payroll,
    });
  } catch (err) {
    console.error("Error creating payroll:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find().populate("userId", "name role");
    res.json({ success: true, data:payrolls });
  } catch (err) {
    res.status(500).json({success:false, error: err.message });
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