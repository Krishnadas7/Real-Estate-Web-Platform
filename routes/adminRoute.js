import express from 'express'
import { createAdmin } from '../controllers/adminManageController.js'
import { loginAdmin } from '../controllers/adminController.js'
import { authAdmin } from '../middleware/authAdmin.js'
import { FileUpload } from '../middleware/upload.js'
import {
  createContact,
  deleteContact,
  listContacts,
  searchContact,
  updateContact
} from '../controllers/contactControlle.js'
import {
  createIssue,
  deleteIssue,
  listIssues,
  searchIssues,
  updateIssue
} from '../controllers/issueController.js'
import {
  createVehicleAssessment,
  deleteVehicleAssessment,
  getVehicleAssessmentById,
  getVehicleAssessments,
  searchVehicleAssessments,
  updateVehicleAssessment
} from '../controllers/vechileAssesmentController.js'
import {
  deleteFeedback,
  listFeedback
} from '../controllers/feedbackController.js'
import {
  deleteShift,
  getShifts,
  updateShift
} from '../controllers/shiftController.js'
import {
  getCompanySettings,
  upsertCompanySettings
} from '../controllers/company/companySettingsController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { authorizeRoles } from '../middleware/authRoles.js'
import {
  getLiveVehicles,
  getVehicleDetails,
  getVehicleList
} from '../controllers/gpstrackingvehicletelematics/livelocationController.js'
import {
  createWorkOrder,
  deleteWorkOrder,
  getCurrentMonthWorkOrderCost,
  getMaintenanceSchedule,
  getRecentWorkOrders,
  getWorkOrderById,
  getWorkOrders,
  maintenanceCostReport,
  updateWorkOrder
} from '../controllers/work/wororderController.js'
import {
  createSparePart,
  getSpareParts,
  useSparePart
} from '../controllers/work/sparePartController.js'
import { getComplianceSummary } from '../controllers/compilance/compilanceController.js'
import {
  getDashboardStats,
  getFuelEfficiency,
  getLoadsPerMonth,
  getPendingMaintenanceCount,
  getRecentAlerts,
  getRevenueTrend,
  getVehicleAndWorkOrderStats,
  getVehicleServicesDashboard
} from '../controllers/dashboard/dashboardController.js'
import { changeUserStatus, createUser, deleteUser, listUsers, updateUser } from '../controllers/user/userController.js'
import { createVehicleService, deleteVehicleService, listVehicleServices, updateServiceStatus, updateVehicleService } from '../controllers/vehicleService/vehicleServiceController.js'

export const adminRoute = express.Router()

adminRoute.post('/create', createAdmin)
adminRoute.post('/login', loginAdmin)



// user

adminRoute.post(
  '/user',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  createUser
) // Create user
adminRoute.put(
  '/user/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  updateUser
) // Update user
adminRoute.delete(
  '/user/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  deleteUser
) // Delete user
adminRoute.patch(
  '/user/:id/status',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  changeUserStatus
) // Change user status
adminRoute.get(
  '/user',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  listUsers
)


// contact

adminRoute.post('/contact', authMiddleware,
  authorizeRoles('admin', 'superadmin'), createContact)
adminRoute.put('/contact/:id', authMiddleware,
  authorizeRoles('admin', 'superadmin'), updateContact)
adminRoute.delete('/contact/:id', authMiddleware,
  authorizeRoles('admin', 'superadmin'), deleteContact)
adminRoute.get('/contact', authMiddleware,
  authorizeRoles('admin', 'superadmin'), listContacts)

adminRoute.get('/contact/search', authMiddleware,
  authorizeRoles('admin', 'superadmin'), searchContact)



// Issue

adminRoute.post('/issue', authMiddleware,
  authorizeRoles('admin', 'superadmin'), createIssue)
adminRoute.put('/issue/:id', authMiddleware,
  authorizeRoles('admin', 'superadmin'), updateIssue)
adminRoute.delete('/issue/:id', authMiddleware,
  authorizeRoles('admin', 'superadmin'), deleteIssue)
adminRoute.get('/issue', authMiddleware,
  authorizeRoles('admin', 'superadmin'), listIssues)
adminRoute.get('/issue/search', authMiddleware,
  authorizeRoles('admin', 'superadmin'), searchIssues)








// Vehicle Assessment

adminRoute.post('/vehicle-assessment', authMiddleware,
  authorizeRoles('admin', 'superadmin'), createVehicleAssessment)

adminRoute.get('/vehicle-assessment', authMiddleware,
  authorizeRoles('admin', 'superadmin'), getVehicleAssessments)
adminRoute.get(
  '/vehicle-assessment/search',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  searchVehicleAssessments
)
adminRoute.get('/vehicle-assessment/:id', authMiddleware,
  authorizeRoles('admin', 'superadmin'), getVehicleAssessmentById)
adminRoute.put('/vehicle-assessment/:id', authMiddleware,
  authorizeRoles('admin', 'superadmin'), updateVehicleAssessment)

adminRoute.delete('/vehicle-assessment/:id', authMiddleware,
  authorizeRoles('admin', 'superadmin'), deleteVehicleAssessment)

// feedback

adminRoute.get('/feedback', authMiddleware,
  authorizeRoles('admin', 'superadmin'), listFeedback)
adminRoute.delete('/feedback/:id', authMiddleware,
  authorizeRoles('admin', 'superadmin'), deleteFeedback)

// Shift

adminRoute.get('/shift',authMiddleware,
  authorizeRoles('admin', 'superadmin'), getShifts)

adminRoute.put('/shift/:id',authMiddleware,
  authorizeRoles('admin', 'superadmin'), updateShift)
adminRoute.delete('/shift/:id',authMiddleware,
  authorizeRoles('admin', 'superadmin'),authMiddleware,
  authorizeRoles('admin', 'superadmin'), deleteShift)

//company settings
adminRoute.post(
  '/company',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  FileUpload.single('file'),
  upsertCompanySettings
)
adminRoute.get(
  '/company',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  getCompanySettings
)

// GPS Tracking & Vehicle Telematics (Geotab Data)
adminRoute.get(
  '/vehicles/live',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  getLiveVehicles
)

adminRoute.get(
  '/vehicles/list',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  getVehicleList
)


adminRoute.get(
  '/vehicle-details/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  
  getVehicleDetails
)

// Work Orders

adminRoute.post(
  '/workorders',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  createWorkOrder
)
adminRoute.get(
  '/workorders',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  getWorkOrders
)
adminRoute.get(
  '/workorders/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  getWorkOrderById
)
adminRoute.put(
  '/workorders/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  updateWorkOrder
)
adminRoute.delete(
  '/workorders/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  deleteWorkOrder
)

// Spare Parts

adminRoute.post(
  '/spareparts',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  createSparePart
)
adminRoute.put(
  '/spareparts/:id/use',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  useSparePart
)

adminRoute.get(
  '/spareparts',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  getSpareParts
)

adminRoute.get(
  '/maintanance-details',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  getMaintenanceSchedule
)

// GET /api/reports/maintenance-cost?year=2025&vehicleId=123
adminRoute.get(
  '/maintenance-cost',
  authMiddleware,
  authorizeRoles('admin', 'superadmin'),
  maintenanceCostReport
)

// get Compilance summary

adminRoute.get(
  '/compilance-summary',
  authMiddleware,
  authorizeRoles('admin', 'superadmin','dispatcher','hr'),
  getComplianceSummary
)

adminRoute.get(
  '/stats',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getDashboardStats
)

adminRoute.get(
  '/loads-per-month',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getLoadsPerMonth
)
adminRoute.get(
  '/revenue-trend',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getRevenueTrend
)
adminRoute.get(
  '/fuel-efficiency',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getFuelEfficiency
)
adminRoute.get(
  '/recent-alerts',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),
  getRecentAlerts
)

adminRoute.get("/fleet-management/dashboard-stats",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'), getVehicleAndWorkOrderStats);



// fleet management operations
adminRoute.get('/fleet-management/upcoming-overdue',authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),getVehicleServicesDashboard)

 adminRoute.get("/fleet-management/pending-maintenance-count",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'), getPendingMaintenanceCount);

adminRoute.get('/fleet-management/recent-work-orders',authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'),getRecentWorkOrders)

adminRoute.get("/fleet-management/monthly-cost",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'), getCurrentMonthWorkOrderCost);

// Vehicle Service

// CREATE
adminRoute.post("/vehicle-service",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'), createVehicleService);

//   {
//   "priority": "urgent",
//   "dueMileage": 16000,
//   "description": "Urgent oil leak fix required"
// }

// UPDATE FULL SERVICE
adminRoute.put("/vehicle-service/:id",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'), updateVehicleService);


  // { "status": "completed" }

// UPDATE STATUS ONLY
adminRoute.patch("/vehicle-service/:id/status",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'), updateServiceStatus);

// DELETE SERVICE
adminRoute.delete("/vehicle-service/:id",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'), deleteVehicleService);

  // GET /api/vehicle-services?priority=high&status=pending
// LIST SERVICES WITH FILTERS
adminRoute.get("/vehicle-service",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'dispatcher', 'hr'), listVehicleServices);
