import express from 'express'
import {
  getEmployees
} from '../controllers/user/userController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { authorizeRoles } from '../middleware/authRoles.js'
import { getCompletedLoadsByDriver, totalLoadsCount } from '../controllers/loadController.js'
import {
  createDriver,
  deleteDriver,
  getAllDrivers,
  getDriverById,
  totalDriversCount,
  updateDriver,
  updateDriverStatus
} from '../controllers/driverController.js'
import {
  createDriverValidator,
  updateDriverValidator
} from '../validations/driver/driver.validation.js'
import { FileUpload } from '../middleware/upload.js'
import {
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument
} from '../controllers/vehicleDocumentController.js'
import {
  deleteDriverDocument,
  getAllDocumentsWithDriver,
  getDriverDocuments,
  updateDriverDocument,
  uploadDriverDocument
} from '../controllers/driverDocumentController.js'
import {
  createPayroll,
  deletePayroll,
  getPayrolls,
  updatePayroll
} from '../controllers/user/payrollController.js'
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense
} from '../controllers/user/expenseController.js'
import {
  createInvoice,
  deleteInvoice,
  getBillingReport,
  getInvoiceById,
  listInvoices,
  updateInvoice
} from '../controllers/user/invoiceController.js'
import { getReports } from '../controllers/user/reportsController.js'
import { getDriverActivities } from '../controllers/driver/driverAcivityController.js'
export const hrRoute = express.Router()


//Deriver management

hrRoute.post(
  '/driver',
  FileUpload.single('file'),
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  createDriverValidator,
  createDriver
)
hrRoute.put(
  '/driver/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  FileUpload.single('file'),
  updateDriverValidator,
  updateDriver
)
hrRoute.patch(
  '/driver/:id/status',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  updateDriverStatus
)
hrRoute.get(
  '/driver',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getAllDrivers
)
hrRoute.delete(
  '/driver/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  deleteDriver
)
hrRoute.get(
  '/driver/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getDriverById
)
hrRoute.get(
  '/completed-loads/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getCompletedLoadsByDriver
)

// Vehicle document

hrRoute.post(
  '/vehicle-document',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  FileUpload.single('document'),
  createDocument
)
hrRoute.put(
  '/vehicle-document/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  FileUpload.single('document'),
  updateDocument
)
hrRoute.delete(
  '/vehicle-document/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  deleteDocument
)
hrRoute.get(
  '/vehicle-document',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  listDocuments
)

// Driver documents
hrRoute.post(
  '/driver-document/:driverId',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  FileUpload.single('document'),
  uploadDriverDocument
)
hrRoute.get(
  '/driver-document',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getAllDocumentsWithDriver
) // All drivers + documents
hrRoute.get(
  '/driver-document/:driverId',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getDriverDocuments
) // One driver + docs
hrRoute.put(
  '/driver-document/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  FileUpload.single('document'),
  updateDriverDocument
)
hrRoute.delete(
  '/driver-document/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  deleteDriverDocument
)

// hr and payroll
// GET /api/employees?role=manager
hrRoute.get(
  '/get-employees',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getEmployees
)

hrRoute.post(
  '/create-payroll',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  createPayroll
)
hrRoute.get(
  '/list-payroll',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getPayrolls
)
hrRoute.put("/update-payroll/:id",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'), updatePayroll);
hrRoute.delete("/delete-payroll/:id",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'), deletePayroll);

hrRoute.post(
  '/create-expense',
  authMiddleware,
  FileUpload.single('file'),
  authorizeRoles('admin', 'superadmin', 'hr'),
  createExpense
)

hrRoute.get(
  '/list-expense',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getExpenses
)
hrRoute.put("/update-expense/:id", FileUpload.single('file'),authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'), updateExpense);
hrRoute.delete("/delete-expense/:id",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'), deleteExpense);

hrRoute.post(
  '/create-invoice',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  createInvoice
)
hrRoute.get(
  '/list-invoice',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  listInvoices
)
hrRoute.get(
  '/list-invoice/:id',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getInvoiceById
)
hrRoute.put("/update-invoice/:id",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'), updateInvoice);
hrRoute.delete("/delete-invoice/:id",authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'), deleteInvoice);
hrRoute.get(
  '/get-reports',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getReports
)
// /billing-reports?startDate=date&endDate=date 
hrRoute.get(
  '/billing-reports',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getBillingReport
)
hrRoute.get(
  '/total-drivers',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  totalDriversCount
)
hrRoute.get(
  '/total-loads',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  totalLoadsCount
)

hrRoute.get(
  '/driver-activity',
  authMiddleware,
  authorizeRoles('admin', 'superadmin', 'hr'),
  getDriverActivities
)

