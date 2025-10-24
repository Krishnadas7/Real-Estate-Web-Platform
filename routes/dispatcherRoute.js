import express from 'express'
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  getVehicles,
  updateVehicle
} from '../controllers/vehicleController.js'
import { FileUpload } from '../middleware/upload.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { authorizeRoles } from '../middleware/authRoles.js'
import {
  createLoad,
  deleteLoad,
  getAllLoads,
  getLoadById,
  updateLoad
} from '../controllers/loadController.js'
import { loadValidation } from '../validations/load/load.validation.js'
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  searchCustomers,
  updateCustomer
} from '../controllers/customerController.js'
import { getAllDrivers } from '../controllers/driverController.js'
import { getAllFaciliators } from '../controllers/user/userController.js'
import {
  createIssue,
  updateIssue,
  deleteIssue,
  listIssues,
  searchIssues,
  getIssueById
} from '../controllers/issueController.js'
import {
  createServiceRate,
  deleteServiceRate,
  getServiceRates,
  updateServiceRate
} from '../controllers/serviceRateController.js'
import {
  createTrailer,
  deleteTrailer,
  getAllTrailers,
  updateTrailer,
  getTrailerById,
  searchTrailers,
  getTrailerStats,
  updateTrailerStatus,
  selectedTrailor
} from '../controllers/trailerController.js'
import {
  createFleet,
  deleteFleet,
  getFleets,
  searchFleetByName,
  toggleFleetStatus,
  updateFleet
} from '../controllers/fleetController.js'
import {
  changeVendorStatus,
  createVendor,
  deleteVendor,
  listVendors,
  updateVendor
} from '../controllers/vendorController.js'
import {
  createContact,
  deleteContact,
  listContacts,
  searchContact,
  updateContact
} from '../controllers/contactControlle.js'
import {
  createPlace,
  deletePlace,
  getPlaces,
  searchPlaceByName,
  togglePlaceStatus,
  updatePlace
} from '../controllers/placeController.js'
import {
  changeFuelReportStatus,
  createFuelReport,
  deleteFuelReport,
  getFuelReports,
  updateFuelReport
} from '../controllers/fuelReportsController.js'
export const dispatcherRoute = express.Router()

// fuel
dispatcherRoute.post(
  '/fuel-report',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  createFuelReport
)
dispatcherRoute.get(
  '/fuel-report/',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getFuelReports
)

dispatcherRoute.put(
  '/fuel-report/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  updateFuelReport
)

dispatcherRoute.delete(
  '/fuel-report/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  deleteFuelReport
)
dispatcherRoute.patch(
  '/fuel-report/:id/status',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  changeFuelReportStatus
)

// Places
dispatcherRoute.post(
  '/place',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  createPlace
)
dispatcherRoute.get(
  '/place',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getPlaces
)
dispatcherRoute.get(
  '/place/search',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  searchPlaceByName
)
dispatcherRoute.put(
  '/place/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  updatePlace
)
dispatcherRoute.delete(
  '/place/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  deletePlace
)
dispatcherRoute.patch(
  '/place/:id/status',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  togglePlaceStatus
)

// customer

dispatcherRoute.post(
  '/customer',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  createCustomer
)
dispatcherRoute.put(
  '/customer/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  updateCustomer
)
dispatcherRoute.delete(
  '/customer/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  deleteCustomer
)
dispatcherRoute.get(
  '/customer',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  listCustomers
)

dispatcherRoute.get(
  '/customer/search',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  searchCustomers
)

// contact

dispatcherRoute.post(
  '/contact',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  createContact
)
dispatcherRoute.put(
  '/contact/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  updateContact
)
dispatcherRoute.delete(
  '/contact/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  deleteContact
)
dispatcherRoute.get(
  '/contact',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  listContacts
)

dispatcherRoute.get(
  '/contact/search',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  searchContact
)

// Vendors
dispatcherRoute.post(
  '/vendor',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  createVendor
)
dispatcherRoute.put(
  '/vendor/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  updateVendor
)
dispatcherRoute.delete(
  '/vendor/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  deleteVendor
)
dispatcherRoute.get(
  '/vendor',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  listVendors
)

dispatcherRoute.patch(
  '/vendor/:id/status',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  changeVendorStatus
)

// fleet management

dispatcherRoute.post(
  '/fleet',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  createFleet
)
dispatcherRoute.get(
  '/fleet',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getFleets
)
dispatcherRoute.put(
  '/fleet/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  updateFleet
)
dispatcherRoute.delete(
  '/fleet/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  deleteFleet
)
dispatcherRoute.patch(
  '/fleet/:id/status',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  toggleFleetStatus
)
dispatcherRoute.get(
  '/fleet/search',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  searchFleetByName
)

// Trailer Management

dispatcherRoute.post(
  '/trailer',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  createTrailer
)

dispatcherRoute.get(
  '/trailer',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getAllTrailers
)

dispatcherRoute.get(
  '/trailer/search',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  searchTrailers
)

dispatcherRoute.get(
  '/trailer/stats',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getTrailerStats
)

dispatcherRoute.get(
  '/trailer/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getTrailerById
)

dispatcherRoute.put(
  '/trailer/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  updateTrailer
)

dispatcherRoute.patch(
  '/trailer/:id/status',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  updateTrailerStatus
)

dispatcherRoute.delete(
  '/trailer/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  deleteTrailer
)

// Legacy trailer selection endpoint
dispatcherRoute.get(
  '/trailer/selected',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  selectedTrailor
)

// Service Rate

dispatcherRoute.post(
  '/service-rate',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  createServiceRate
)

dispatcherRoute.get(
  '/service-rate',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getServiceRates
)

dispatcherRoute.put(
  '/service-rate/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  updateServiceRate
)

dispatcherRoute.delete(
  '/service-rate/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  deleteServiceRate
)

//Vehicle management
dispatcherRoute.get(
  '/faciliator',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getAllFaciliators
)

//Vehicle management
dispatcherRoute.get(
  '/driver',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getAllDrivers
)
dispatcherRoute.get(
  '/customer',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  listCustomers
)
dispatcherRoute.post(
  '/vehicle',
  FileUpload.fields([{ name: 'vehicleImages' }]),
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  createVehicle
)
dispatcherRoute.get(
  '/vehicle',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  getVehicles
)
dispatcherRoute.get(
  '/vehicle/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  getVehicleById
)
dispatcherRoute.put(
  '/vehicle/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  FileUpload.fields([{ name: 'vehicleImages' }, { name: 'documents' }]),
  updateVehicle
)
dispatcherRoute.delete(
  '/vehicle/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  deleteVehicle
)

// Load management

dispatcherRoute.post(
  '/load',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  FileUpload.fields([{ name: 'documents' }]),
  createLoad
)
dispatcherRoute.get(
  '/load',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  getAllLoads
)
dispatcherRoute.get(
  '/load/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  getLoadById
)
dispatcherRoute.put(
  '/load/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  loadValidation,
  updateLoad
)
dispatcherRoute.delete(
  '/load/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  deleteLoad
)

// Issue management
dispatcherRoute.post(
  '/issue',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  createIssue
)
dispatcherRoute.get(
  '/issue',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  listIssues
)
dispatcherRoute.get(
  '/issue/search',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  searchIssues
)
dispatcherRoute.get(
  '/issue/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  getIssueById
)
dispatcherRoute.put(
  '/issue/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  updateIssue
)
dispatcherRoute.delete(
  '/issue/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher'),
  deleteIssue
)
