import { FleetInvoice } from "../../models/driver/fleetInvoiceModel.js";

// Get all invoices
export const getFleetInvoices = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await FleetInvoice.find(query)
      .populate('items.partId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Fleet invoices fetched successfully",
      data: invoices
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get invoice by ID
export const getFleetInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await FleetInvoice.findById(id)
      .populate('items.partId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({
      success: true,
      message: "Invoice fetched successfully",
      data: invoice
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Create invoice
export const createFleetInvoice = async (req, res) => {
  try {
    // If invoiceNumber not provided, generate it
    let invoiceNumber = req.body.invoiceNumber;
    if (!invoiceNumber) {
      const year = new Date().getFullYear();
      const count = await FleetInvoice.countDocuments({ 
        createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
      });
      invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const invoiceData = {
      ...req.body,
      invoiceNumber
    };

    const invoice = await FleetInvoice.create(invoiceData);
    const populatedInvoice = await FleetInvoice.findById(invoice._id)
      .populate('items.partId');

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: populatedInvoice
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, error: err.message });
  }
};

// Update invoice
export const updateFleetInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Recalculate totals if items are updated
    if (req.body.items) {
      const subtotal = req.body.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxRate = req.body.taxRate || 13;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      
      req.body.subtotal = subtotal;
      req.body.taxAmount = taxAmount;
      req.body.total = total;
    }

    const invoice = await FleetInvoice.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('items.partId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, error: err.message });
  }
};

// Delete invoice
export const deleteFleetInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await FleetInvoice.findByIdAndDelete(id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({
      success: true,
      message: "Invoice deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Update invoice status
export const updateFleetInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'sent', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const invoice = await FleetInvoice.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('items.partId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({
      success: true,
      message: "Invoice status updated successfully",
      data: invoice
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, error: err.message });
  }
};

