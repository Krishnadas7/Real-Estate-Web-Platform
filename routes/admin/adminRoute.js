import express from 'express'
import { createAdmin } from '../../controllers/admin/adminController.js'

const adminRoute = express.Router()


adminRoute.post('/adminCreation',createAdmin)


export  {
    adminRoute
}