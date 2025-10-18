import multer from "multer";

// Global error handler
export const fileUploadErrorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Multer-specific errors (file size, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message || "Media upload failed, please try after some time",
    });
  }

  // Custom file type validation errors
  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Custom image/video size errors from fileFilter
  if (
    err.message &&
    (err.message.includes("Image size must be less than") ||
      err.message.includes("Video size must be less than"))
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // General fallback
  return res.status(500).json({
    success: false,
    message: "Media upload failed, please try after some time",
  });
};
