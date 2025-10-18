// controllers/expenseController.js
import { Expense } from "../../models/hr/expenseModel.js";

// ✅ Update Expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Handle file update if a new file is uploaded
    if (req.file) {
      if (process.env.NODE_ENV === "production") {
        updateData.receiptUrl = req.file.location;
      } else {
        updateData.receiptUrl = `${req.protocol}://${req.get("host")}/${req.file.path}`;
      }
    }

    const updatedExpense = await Expense.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedExpense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete Expense
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedExpense = await Expense.findByIdAndDelete(id);
    if (!deletedExpense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createExpense = async (req, res) => {
  try {

    let fileUrl = null;
    if (req.file) {
      if (process.env.NODE_ENV === "production") {
        // If using AWS S3 (multer-s3)
        fileUrl = req.file.location;
      } else {
        // Local storage
        fileUrl = `${req.protocol}://${req.get("host")}/${req.file.path}`;
      }
    }
    req.body.receiptUrl = fileUrl
    const expense = new Expense(req.body);
    await expense.save();
    res.json({ success: true,message:"created expenses", data:expense });
  } catch (err) {
    res.status(500).json({success:false,message:err.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate("userId", "name role");
    res.json({ success: true,message:'All expenses', data:expenses });
  } catch (err) {
    res.status(500).json({success:false,message:err.message });
  }
};