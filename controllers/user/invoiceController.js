// controllers/invoiceController.js
import { Invoice } from "../../models/hr/invoiceModel.js";


export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedInvoice = await Invoice.findByIdAndUpdate(id, updateData, {
      new: true, // return the updated document
      runValidators: true, // validate according to schema
    });

    if (!updatedInvoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({
      success: true,
      data: updatedInvoice,
      message: "Invoice updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete Invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedInvoice = await Invoice.findByIdAndDelete(id);
    if (!deletedInvoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBillingReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Optional date filter
    const match = {};
    if (startDate && endDate) {
      match.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 1️⃣ Totals by status (Paid, Pending)
    const statusSummary = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // 2️⃣ Monthly Revenue (Paid + Pending)
    const monthlyRevenue = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$invoiceDate" } },
          totalAmount: { $sum: "$amount" },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // 3️⃣ Revenue by Client (Paid + Pending)
    const clientRevenue = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$clientName",
          totalAmount: { $sum: "$amount" },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    res.json({
        success:true,
      data:{statusSummary:statusSummary,
      monthlyRevenue:monthlyRevenue,
      clientRevenue:clientRevenue}
    });
  } catch (err) {
    console.error("Billing report error:", err);
    res.status(500).json({success:false, message: err.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    // unique invoice URL (frontend route or direct API)
    const invoiceUrl = `${process.env.CLIENT_URL}/invoice/${invoice._id}`;
    invoice.invoiceUrl = invoiceUrl
    
    await invoice.save();
    res.json({ success: true, data:invoice, message:"invoice created" });
  } catch (err) {
    res.status(500).json({success:false, message: err.message });
  }
};

export const listInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({ success: true, data:invoices });
  } catch (err) {
    res.status(500).json({success:false, data: err.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({success:false, message: "Invoice not found" });

    res.json({ success: true, data:invoice });
  } catch (err) {
    res.status(500).json({success:false, message: err.message });
  }
};
