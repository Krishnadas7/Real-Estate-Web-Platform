import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authRoles.js";
import { FileUpload } from "../middleware/upload.js";
import { listCompanyDocuments, uploadCompanyDocument, deleteCompanyDocument } from "../controllers/companyDocumentController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin", "superadmin", "hr"),
  listCompanyDocuments
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin", "superadmin", "hr"),
  FileUpload.single("file"),
  uploadCompanyDocument
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "superadmin", "hr"),
  deleteCompanyDocument
);

export default router;


