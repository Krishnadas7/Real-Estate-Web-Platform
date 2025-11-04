import express from 'express'
import {   changeDriverPassword, driverProfile, loginDriver, registerDriver } from '../controllers/driverController.js'
import { FileUpload } from '../middleware/upload.js'
import { driverAuth } from '../middleware/authDriver.js'
import { activeLoads, deliveredLoads, pendingLoads, startedLoads, updateLoadStatus } from '../controllers/loadController.js'
import { getVehicles, getVehiclesData, selectedVehicle } from '../controllers/vehicleController.js'
import { getNotificationsByDriver } from '../controllers/activitylogController.js'
import { listVendors, selectedVendor } from '../controllers/vendorController.js'
import { getAllTrailers, selectedTrailor } from '../controllers/trailerController.js'
import { createFeedback } from '../controllers/feedbackController.js'
import { getDriverDocuments, getDriverDocumentById, uploadDriverDocument, updateDriverDocument, deleteDriverDocument } from '../controllers/driver/driverDocumentController.js'
export const driverRoute = express.Router()

driverRoute.post('/create',FileUpload.single('file'),registerDriver)
driverRoute.post('/login',loginDriver)


// notification

driverRoute.get("/notifications", driverAuth, getNotificationsByDriver);



// load
driverRoute.get("/loads/active", driverAuth, activeLoads)
driverRoute.get("/loads/pending", driverAuth, pendingLoads)
driverRoute.get("/loads/completed", driverAuth, deliveredLoads)
driverRoute.put("/loads/status", driverAuth,updateLoadStatus);

driverRoute.get("/loads/started", driverAuth, startedLoads)

//vehicles
driverRoute.get("/vehicle", driverAuth, getVehiclesData)
driverRoute.get('/selected-vehicle',driverAuth,selectedVehicle)

driverRoute.get('/vendor',driverAuth,listVendors)
driverRoute.get('/selected-vendor',driverAuth,selectedVendor)

driverRoute.get('/trailer',driverAuth,getAllTrailers)
driverRoute.get('/selected-trailer',driverAuth,selectedTrailor)

driverRoute.get('/profile',driverAuth,driverProfile)

driverRoute.put("/change-password", driverAuth, changeDriverPassword);

driverRoute.post("/feedback", driverAuth, createFeedback);

// Documents
driverRoute.get("/documents", driverAuth, getDriverDocuments);
driverRoute.get("/documents/:id", driverAuth, getDriverDocumentById);
driverRoute.post("/documents", driverAuth, FileUpload.single('documentFile'), uploadDriverDocument);
driverRoute.put("/documents/:id", driverAuth, FileUpload.single('documentFile'), updateDriverDocument);
driverRoute.delete("/documents/:id", driverAuth, deleteDriverDocument);




