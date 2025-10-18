import VehicleDocuments from "../models/driver/vehicleDocumentsModel.js";
import { Vehicle } from "../models/driver/vehicleModel.js"; // assuming you already have vehicle model
import { validationResult } from "express-validator";

// ✅ Create Document
export const createDocument = async (req, res) => {
  try {
    const { vehicleId, documentNumber, documentType, expiryDate, issuedAt } = req.body;

    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ success: false, errors: errors.array() });
    // }

    // ✅ Handle document file upload
    let documentLocation = null;
    if (req.file) {
      if (process.env.NODE_ENV === "production") {
        documentLocation = req.file.location; // From AWS S3
      } else {
        documentLocation = `${req.protocol}://${req.get("host")}/${req.file.path}`; // Local
      }
    }

    const document = new VehicleDocuments({
      vehicleId,
      documentNumber,
      documentType,
      documentLocation,
      status:'completed',
      expiryDate,
      issuedAt
    });

    await document.save();

    res.status(201).json({ success: true, message: "Document created successfully", document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Document
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // ✅ Handle updated document file upload
    if (req.file) {
      if (process.env.NODE_ENV === "production") {
        updateData.documentLocation = req.file.location;
      } else {
        updateData.documentLocation = `${req.protocol}://${req.get("host")}/${req.file.path}`;
      }
    }

    const updatedDoc = await VehicleDocuments.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedDoc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.json({ success: true, message: "Document updated successfully", updatedDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDoc = await VehicleDocuments.findByIdAndDelete(id);

    if (!deletedDoc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ List All Documents (grouped by vehicle with details)
export const listDocuments = async (req, res) => {
  try {
    const docs = await VehicleDocuments.aggregate([
      {
        $lookup: {
          from: "vehicles", // collection name for Vehicle model
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicleDetails"
        }
      },
      { $unwind: "$vehicleDetails" },
      {
        $group: {
          _id: "$vehicleId",
          vehicle: { $first: "$vehicleDetails" },
          documents: {
            $push: {
              _id: "$_id",
              documentNumber: "$documentNumber",
              documentType: "$documentType",
              documentLocation: "$documentLocation",
              status: "$status",
              expiryDate: "$expiryDate",
              issuedAt: "$issuedAt",
              createdAt: "$createdAt"
            }
          }
        }
      }
    ]);

    res.json({ success: true, documentsByVehicle: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
