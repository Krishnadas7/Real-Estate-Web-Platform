import { SparePart } from "../../models/driver/sparePartModel.js";


// Get all spare parts with usage history (and work order details)
export const getSpareParts = async (req, res) => {
  try {
    const parts = await SparePart.find()
      .populate({
        path: "usageHistory.workOrderId",
        populate: { path: "vehicleId" } // also populate vehicle info inside work order
      });

    res.json({
      success: true,
      message: "Spare parts with usage history",
      data: parts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Add spare part
export const createSparePart = async (req, res) => {
  try {
    const part = await SparePart.create(req.body);
    res.status(201).json({success:true,message:"Spare part created",data:part});
  } catch (err) {
    res.status(400).json({success:false,message:err.message, error: err.message });
  }
};

// Update stock (use part in work order)
export const useSparePart = async (req, res) => {
  try {
    const { id } = req.params;
    const { workOrderId, qtyUsed } = req.body;

    const part = await SparePart.findById(id);
    if (!part) return res.status(404).json({success:false, message: "Part not found" });

    if (part.stockQty < qtyUsed) return res.status(400).json({success:false, message: "Not enough stock" });

    part.stockQty -= qtyUsed;
    part.usageHistory.push({ workOrderId, qtyUsed });

    await part.save();
    res.json({success:true,message:"updated spare part",data:part});
  } catch (err) {
    res.status(400).json({success:false,message: err.message });
  }
};
