import { User } from "../models/driver/userModel.js";
import { DriverDocument } from "../models/driver/driverDocumentModel.js";
import fs from "fs";

// ✅ Upload document
export const uploadDriverDocument = async (req, res) => {
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

    const doc = await DriverDocument.create({
      driver: req.params.driverId,
      documentType: req.body.documentType,
      documentNumber: req.body.documentNumber,
      issueDate: req.body.issueDate,
      expiryDate: req.body.expiryDate,
      fileUrl,
      status: req.body.status || "pending",
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ List all documents with driver details (aggregation)
export const getAllDocumentsWithDriver = async (req, res) => {
  try {
    const docs = await DriverDocument.aggregate([
      {
        $lookup: {
          from: "user",
          localField: "driver",
          foreignField: "_id",
          as: "driverDetails",
        },
      },
      { $unwind: "$driverDetails" },
      {
        $project: {
          documentType: 1,
          documentNumber: 1,
          issueDate: 1,
          expiryDate: 1,
          status: 1,
          fileUrl: 1,
          "driverDetails.name": 1,
          "driverDetails.email": 1,
          "driverDetails.phone": 1,
          "driverDetails.details.licenceNumber": 1,
        },
      },
    ]);

    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get all documents for one driver
export const getDriverDocuments = async (req, res) => {
  try {
    const driver = await User.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const docs = await DriverDocument.find({ driver: driver._id });
    res.json({ success: true, driver, documents: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Update document
export const updateDriverDocument = async (req, res) => {
  try {
    const doc = await DriverDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({success:false, error: "Document not found" });

    let fileUrl = doc.fileUrl;
    if (req.file) {
      // Replace file
      if (process.env.NODE_ENV !== "production" && fileUrl) {
        const oldPath = fileUrl.replace(`${req.protocol}://${req.get("host")}/`, "");
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      fileUrl = process.env.NODE_ENV === "production" ? req.file.location : `${req.protocol}://${req.get("host")}/${req.file.path}`;
    }

    doc.documentType = req.body.documentType || doc.documentType;
    doc.documentNumber = req.body.documentNumber || doc.documentNumber;
    doc.issueDate = req.body.issueDate || doc.issueDate;
    doc.expiryDate = req.body.expiryDate || doc.expiryDate;
    doc.status = req.body.status || doc.status;
    doc.fileUrl = fileUrl;

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ Delete document
export const deleteDriverDocument = async (req, res) => {
  try {
    const doc = await DriverDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({success:false, error: "Document not found" });

    // Delete local file if not using S3
    if (process.env.NODE_ENV !== "production" && doc.fileUrl) {
      const oldPath = doc.fileUrl.replace(`${req.protocol}://${req.get("host")}/`, "");
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await doc.deleteOne();
    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
