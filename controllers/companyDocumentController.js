import { CompanyDocument } from "../models/companyDocumentModel.js";
import { validationResult } from "express-validator";

export const listCompanyDocuments = async (req, res) => {
  try {
    const { category = "", search = "" } = req.query;
    const filter = { company: req.user.company };
    if (category && category !== "all") filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const docs = await CompanyDocument.find(filter)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email")
      .lean();

    const normalized = docs.map((d) => ({
      _id: d._id,
      name: d.name,
      category: d.category,
      type: d.type || "file",
      size: d.size || 0,
      uploadedBy: d.uploadedBy?.name || "",
      uploadDate: d.createdAt,
      url: d.url,
      description: d.description || "",
    }));

    res.json({ success: true, data: normalized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadCompanyDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, category = "other", description = "" } = req.body;

    let fileUrl = null;
    let fileType = undefined;
    let fileSize = undefined;
    if (req.file) {
      const localUrl = `${process.env.BASE_URL || `http://localhost:3000`}/${req.file.path.replace(/\\/g, "/")}`;
      fileUrl = req.file.location || localUrl;
      fileType = (req.file.originalname.split(".").pop() || "file").toLowerCase();
      fileSize = req.file.size;
    }

    const doc = await CompanyDocument.create({
      company: req.user.company,
      name,
      category,
      description,
      type: fileType,
      size: fileSize,
      url: fileUrl,
      uploadedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCompanyDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await CompanyDocument.findOneAndDelete({ _id: id, company: req.user.company });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


