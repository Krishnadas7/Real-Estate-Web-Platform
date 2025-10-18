import express from 'express'
import {
  loginSuperAdmin,
  registerSuperAdmin
} from '../controllers/superAdminAuthController.js'
import {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
  updateAdmin
} from '../controllers/adminManageController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { authorizeRoles } from '../middleware/authRoles.js'
export const superAdminRoute = express.Router()

superAdminRoute.post('/login', loginSuperAdmin)
superAdminRoute.post('/create', registerSuperAdmin)

//admin management
superAdminRoute.post(
  '/admin',
  authMiddleware,
  authorizeRoles('superadmin', 'hr'),
  createAdmin
)
superAdminRoute.get(
  '/admin',
  authMiddleware,
  authorizeRoles('superadmin', 'hr'),
  getAllAdmins
)
superAdminRoute.put(
  '/admin/:id',
  authMiddleware,
  authorizeRoles('superadmin', 'hr'),
  updateAdmin
)

superAdminRoute.delete(
  '/admin/:id',
  authMiddleware,
  authorizeRoles('superadmin', 'hr'),
  deleteAdmin
)
