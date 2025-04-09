import express from 'express'
import { createAdmin, loginAdmin } from '../../controllers/admin/adminController.js'

const adminRoute = express.Router()


adminRoute.post('/adminCreation',createAdmin)
adminRoute.post('/adminLogin',loginAdmin)


export  {
    adminRoute
}