import multer from "multer";
import multerS3 from "multer-s3-v3";
import { s3 } from "../config/awsConfig.js";
import fs from "fs";
import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";
console.log("NODE_ENV:", process.env.NODE_ENV);

// ✅ Allowed file types
const allowedMimeTypes = {
  images: ["image/jpeg", "image/png", "image/jpg","image/docx"],
  videos: ["video/mp4", "video/mov", "video/avi"],
  documents: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] // .pdf & .docx

};

// ✅ File type check
const checkMimeType = (req, file, cb) => {
  if ([...allowedMimeTypes.images, ...allowedMimeTypes.videos,...allowedMimeTypes.documents].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: JPG, PNG, MP4, MOV, AVI"), false);
  }
};

// ✅ Local storage (for dev)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";

    if (file.mimetype.startsWith("image/")) {
      folder = "uploads/images";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "uploads/videos";
    } else if (
      allowedMimeTypes.documents.includes(file.mimetype)
    ) {
      folder = "uploads/documents";
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// ✅ S3 storage (for prod)
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    let folder = "others";

    if (file.mimetype.startsWith("image/")) {
      folder = "images";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "videos";
    } else if (
      allowedMimeTypes.documents.includes(file.mimetype)
    ) {
      folder = "documents";
    }

    cb(null, `${folder}/${Date.now()}-${file.originalname}`);
  },
});

// ✅ Choose storage by environment
const storage = isProduction ? s3Storage : localStorage;

// ✅ Final multer setup
export const FileUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024,fieldSize: 10 * 1024 * 1024, // 10 MB max for field values (e.g., payloads)
    files: 20, }, // 20 MB max
  fileFilter: checkMimeType,
});
