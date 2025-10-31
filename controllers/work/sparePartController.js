import { SparePart } from "../../models/driver/sparePartModel.js";

// Get all spare parts with usage history (and work order details)
export const getSpareParts = async (req, res) => {
  try {
    const parts = await SparePart.find()
      .populate('supplier')
      .populate({
        path: "usageHistory.workOrderId",
        populate: { path: "vehicleId" } // also populate vehicle info inside work order
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Spare parts with usage history",
      data: parts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get spare part by ID
export const getSparePartById = async (req, res) => {
  try {
    const { id } = req.params;
    const part = await SparePart.findById(id)
      .populate('supplier')
      .populate({
        path: "usageHistory.workOrderId",
        populate: { path: "vehicleId" }
      });

    if (!part) {
      return res.status(404).json({ success: false, message: "Spare part not found" });
    }

    res.json({
      success: true,
      message: "Spare part fetched successfully",
      data: part
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Add spare part
export const createSparePart = async (req, res) => {
  try {
    // Calculate warranty expiry if purchase date and warranty period are provided
    let warrantyExpiry = null;
    if (req.body.purchaseDate && req.body.warrantyPeriod) {
      const purchaseDate = new Date(req.body.purchaseDate);
      warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setMonth(warrantyExpiry.getMonth() + req.body.warrantyPeriod);
    }

    const partData = {
      ...req.body,
      warrantyExpiry
    };

    const part = await SparePart.create(partData);
    const populatedPart = await SparePart.findById(part._id).populate('supplier');

    res.status(201).json({
      success: true,
      message: "Spare part created successfully",
      data: populatedPart
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, error: err.message });
  }
};

// Update spare part
export const updateSparePart = async (req, res) => {
  try {
    const { id } = req.params;

    // Calculate warranty expiry if purchase date and warranty period are provided
    let warrantyExpiry = null;
    if (req.body.purchaseDate && req.body.warrantyPeriod) {
      const purchaseDate = new Date(req.body.purchaseDate);
      warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setMonth(warrantyExpiry.getMonth() + req.body.warrantyPeriod);
    } else if (req.body.purchaseDate || req.body.warrantyPeriod) {
      // If only one is provided, fetch existing part to calculate
      const existingPart = await SparePart.findById(id);
      if (existingPart) {
        const purchaseDate = new Date(req.body.purchaseDate || existingPart.purchaseDate);
        const warrantyPeriod = req.body.warrantyPeriod || existingPart.warrantyPeriod;
        if (purchaseDate && warrantyPeriod) {
          warrantyExpiry = new Date(purchaseDate);
          warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyPeriod);
        }
      }
    }

    const updateData = {
      ...req.body,
      ...(warrantyExpiry && { warrantyExpiry })
    };

    const part = await SparePart.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplier');

    if (!part) {
      return res.status(404).json({ success: false, message: "Spare part not found" });
    }

    res.json({
      success: true,
      message: "Spare part updated successfully",
      data: part
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, error: err.message });
  }
};

// Delete spare part
export const deleteSparePart = async (req, res) => {
  try {
    const { id } = req.params;
    const part = await SparePart.findByIdAndDelete(id);

    if (!part) {
      return res.status(404).json({ success: false, message: "Spare part not found" });
    }

    res.json({
      success: true,
      message: "Spare part deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Update stock (use part in work order)
export const useSparePart = async (req, res) => {
  try {
    const { id } = req.params;
    const { workOrderId, qtyUsed } = req.body;

    const part = await SparePart.findById(id);
    if (!part) return res.status(404).json({ success: false, message: "Part not found" });

    if (part.stockQty < qtyUsed) {
      return res.status(400).json({ success: false, message: "Not enough stock" });
    }

    part.stockQty -= qtyUsed;
    part.usageHistory.push({ workOrderId, qtyUsed });

    await part.save();
    const populatedPart = await SparePart.findById(part._id)
      .populate('supplier')
      .populate({
        path: "usageHistory.workOrderId",
        populate: { path: "vehicleId" }
      });

    res.json({
      success: true,
      message: "Part used successfully",
      data: populatedPart
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
