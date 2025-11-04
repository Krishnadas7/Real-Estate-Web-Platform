import express from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'
import path from "path";
import { User } from "./models/driver/userModel.js";
import { updateDocumentStatuses } from "./controllers/employee/employeeDocumentController.js";
import { syncVehiclesFromGeotab } from "./jobs/vehicleSync.js";
import { runDocumentStatusUpdateJob } from "./jobs/documentStatusUpdate.js";
import { runVehicleServiceUpdateJob } from "./jobs/vehicleServiceUpdate.js";
// import xss from "xss-clean";
// import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import { superAdminRoute } from "./routes/superAdminRoute.js";
import { adminRoute } from "./routes/adminRoute.js";
import { driverRoute } from "./routes/driverRoute.js";
import { getPublicConfig } from "./controllers/configController.js";
import { hrRoute } from "./routes/hrRoute.js";
import { dispatcherRoute } from "./routes/dispatcherRoute.js";
import employeeRoute from "./routes/employeeRoute.js";
import employeeDocumentRoute from "./routes/employeeDocumentRoute.js";
import { trailerTrackingRoute } from "./routes/trailerTrackingRoute.js";
import companyDocumentRoute from "./routes/companyDocumentRoute.js";
import { swaggerUi, specs } from "./swagger/swagger.js";
import { fileUploadErrorHandler } from "./middleware/fileUploadErrorHandler.js";
import { createPaymentSession } from "./controllers/user/paymentController.js";
import { handleStripeWebhook } from "./controllers/user/paymentWebhook.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { getCurrentUserProfile, updateCurrentUserProfile, changePassword } from "./controllers/user/userController.js";

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
    crossOriginEmbedderPolicy: false, // Disable for development
    crossOriginOpenerPolicy: false, // Disable for development
    crossOriginResourcePolicy: false, // Disable for development
  })
);
// Configure CORS with proper headers for static files and socket.io
app.use(cors({
  origin: "*", // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', '*'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Serve static files with comprehensive CORS headers
app.use("/uploads", (req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Set Cross-Origin Resource Policy headers
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Allow embedding uploads in iframes during development (for doc viewers)
  if (process.env.NODE_ENV !== 'production') {
    res.header('X-Frame-Options', 'ALLOWALL');
    // Modern replacement for X-Frame-Options; allow any ancestor in dev
    res.header('Content-Security-Policy', "frame-ancestors *");
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}, express.static("uploads"));
app.use(hpp()); // Prevent HTTP Parameter Pollution
// app.use(xss()); // ❌ Deprecated, do not use
// app.use(mongoSanitize()); // Prevent NoSQL injection

app.get("/api/v1/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "health is fine!",
    timestamp: new Date().toISOString(),
    server: "BlackRiver Backend"
  });
});

// Public config endpoint (no auth required)
app.get("/api/v1/config", getPublicConfig);

// Test route for image access
app.get("/api/v1/test-image/:filename", (req, res) => {
  const filename = req.params.filename;
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile(path.join(process.cwd(), 'uploads', 'images', filename));
});

app.post("/api/v1/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Search user in all collections OR in one "users" collection with role field
    const user = await User.findOne({ email }); // Assuming all users in one collection
    if (!user) return res.status(404).json({success:false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({success:false, message: "Incorrect password" });

    // Update document statuses for admin/hr/superadmin users
    if (['admin', 'hr', 'superadmin'].includes(user.role)) {
        try {
            console.log('🔄 Updating employee document statuses on login...');
            await updateDocumentStatuses();
        } catch (error) {
            console.error('❌ Error updating employee document statuses on login:', error);
            // Don't fail login if document update fails
        }
        
    }

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

// ✅ Current User Profile Routes (for all authenticated users)
app.get("/api/v1/auth/me", authMiddleware, getCurrentUserProfile);
app.put("/api/v1/auth/me", authMiddleware, updateCurrentUserProfile);
app.put("/api/v1/auth/change-password", authMiddleware, changePassword);

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
app.use('/api/v1/company-documents', companyDocumentRoute)

// ✅ Public routes for customers (no authentication required)
app.get('/api/public/invoice/:id', async (req, res) => {
  try {
    console.log('🔍 Public invoice route called with ID:', req.params.id);
    const { Invoice } = await import('./models/hr/invoiceModel.js');
    
    console.log('📡 Searching for invoice in database...');
    const invoice = await Invoice.findById(req.params.id);
    console.log('📡 Database query result:', invoice ? 'Found' : 'Not found');
    
    if (!invoice) {
      console.log('❌ Invoice not found in database');
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    
    console.log('✅ Invoice found, returning data');
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('❌ Error in public invoice route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test endpoint to verify backend is working
app.get('/api/public/test', (req, res) => {
  res.json({ success: true, message: "Backend is working!" });
});

// Test webhook endpoint
app.post('/api/v1/webhook-test', (req, res) => {
  console.log('🔍 Webhook test endpoint called');
  console.log('📡 Request body:', req.body);
  console.log('📡 Request headers:', req.headers);
  res.json({ success: true, message: "Webhook test successful!" });
});

// ✅ Webhook routes (must be before 404 handler)
app.post("/api/v1/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

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
// every 30s is safer than 5s (to avoid Geotab API rate limits)
// setInterval(syncVehiclesFromGeotab, 30_000);

// ✅ Schedule document status update jobs
runDocumentStatusUpdateJob();

// ✅ Schedule vehicle upcoming services update job
runVehicleServiceUpdateJob();


