import express from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'
import { User } from "./models/driver/userModel.js";
import { syncVehiclesFromGeotab } from "./jobs/vehicleSync.js";
// import xss from "xss-clean";
// import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import { superAdminRoute } from "./routes/superAdminRoute.js";
import { adminRoute } from "./routes/adminRoute.js";
import { driverRoute } from "./routes/driverRoute.js";
import { hrRoute } from "./routes/hrRoute.js";
import { dispatcherRoute } from "./routes/dispatcherRoute.js";
import employeeRoute from "./routes/employeeRoute.js";
import employeeDocumentRoute from "./routes/employeeDocumentRoute.js";
import { trailerTrackingRoute } from "./routes/trailerTrackingRoute.js";
import { swaggerUi, specs } from "./swagger/swagger.js";
import { fileUploadErrorHandler } from "./middleware/fileUploadErrorHandler.js";
import { createPaymentSession } from "./controllers/user/paymentController.js";
import { handleStripeWebhook } from "./controllers/user/paymentWebhook.js";

// (async () => {
//   await syncVehiclesFromGeotab();
// })();

export const app = express();

// ✅ Body parsers
app.use(
  express.json({
    limit: "100mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// ✅ Security middleware
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: process.env.NODE_ENV === "production",
    crossOriginOpenerPolicy: process.env.NODE_ENV === "production",
  })
);
app.use("/uploads", express.static("uploads"));

app.use(cors());
app.use(hpp()); // Prevent HTTP Parameter Pollution
// app.use(xss()); // ❌ Deprecated, do not use
// app.use(mongoSanitize()); // Prevent NoSQL injection

app.get("/api/v1/health", (req, res) => {
  res.send("health is fine!");
});

app.post("/api/v1/login", async (req, res) => {
  try {
    const { email, password } = req.body;

  // Search user in all collections OR in one "users" collection with role field
  const user = await User.findOne({ email }); // Assuming all users in one collection
  if (!user) return res.status(404).json({success:false, message: "User not found" });

  const isMatch = bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({success:false, message: "Incorrect password" });

  // Generate JWT
  const token = jwt.sign(
    { id: user._id, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: "12d" }
  );

  res.json({
    success:true,
    message:"login success",
    token:token,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
  } catch (error) {
    res.json({success:false,message:error.message})
  }
  
});

// ✅ Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "BlackRiver Fleet Management API"
}));

// ✅ Routes
app.use("/api/v1/superadmin", superAdminRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/driver", driverRoute);
app.use('/api/v1/dispatcher',dispatcherRoute)
app.use('/api/v1/hr',hrRoute)
app.use('/api/v1/employee', employeeRoute)
app.use('/api/v1/employee-documents', employeeDocumentRoute)
app.use('/api/v1/trailer-tracking', trailerTrackingRoute)

// ✅ Logging
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: (req, res) => res.statusCode === 304 || req.path === "/health",
  })
);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ✅ Global file upload error handler
app.use(fileUploadErrorHandler);

// ✅ Generic fallback error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong, please try again later",
  });
});
app.post("/api/v1/pay", createPaymentSession);
app.post("/api/v1/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
// every 30s is safer than 5s (to avoid Geotab API rate limits)
// setInterval(syncVehiclesFromGeotab, 30_000);


