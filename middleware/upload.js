import multer from "multer";
import fs from 'fs'
import path from 'path'

const isProduction = process.env.NODE_ENV === "production";


const s3Storage = null

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, TIFF, and JPG files are allowed.'), false);
    }
  };

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = file.mimetype.startsWith("image/") ? "uploads/images" : "uploads/videos";
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const storage = isProduction ? s3Storage : localStorage;

// Multer upload configuration
const FileUpload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // Max 20MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") && file.size > 5 * 1024 * 1024) {
            return cb(new Error("Image size must be less than 5MB"), false);
        } else if (file.mimetype.startsWith("video/") && file.size > 20 * 1024 * 1024) {
            return cb(new Error("Video size must be less than 20MB"), false);
        }
        fileFilter(req, file, cb);
    }
});

export {FileUpload}