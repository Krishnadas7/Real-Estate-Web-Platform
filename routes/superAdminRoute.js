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
import {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan
} from '../controllers/planController.js'
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

// Plan management
superAdminRoute.post(
  '/plan',
  authMiddleware,
  authorizeRoles('superadmin'),
  createPlan
)
superAdminRoute.get(
  '/plan',
  authMiddleware,
  authorizeRoles('superadmin'),
  getAllPlans
)
superAdminRoute.get(
  '/plan/:id',
  authMiddleware,
  authorizeRoles('superadmin'),
  getPlanById
)
superAdminRoute.put(
  '/plan/:id',
  authMiddleware,
  authorizeRoles('superadmin'),
  updatePlan
)
superAdminRoute.delete(
  '/plan/:id',
  authMiddleware,
  authorizeRoles('superadmin'),
  deletePlan
)
