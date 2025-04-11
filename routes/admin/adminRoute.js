import express from 'express'
import { createAdmin, loginAdmin } from '../../controllers/admin/adminController.js'
import { adminTokenChecking } from '../../middleware/authMiddleware.js'
import {
     createClient,
     deleteClient,
     getAllClients, 
     getClientProfile, 
     updateClientProfile 
    } from '../../controllers/client/clientController.js'
import { FileUpload } from '../../middleware/upload.js'
import { createService, deleteService, getAllServices, updateService } from '../../controllers/service/serviceController.js'

const adminRoute = express.Router()


adminRoute.post('/adminCreation',createAdmin)
adminRoute.post('/adminLogin',loginAdmin)
adminRoute.post('/clientCreation',adminTokenChecking,FileUpload.single('file'),createClient)
adminRoute.get('/clients',adminTokenChecking,getAllClients)
adminRoute.get('/client/:clientId',adminTokenChecking,getClientProfile)
adminRoute.delete('/client/:clientId',adminTokenChecking,deleteClient)
adminRoute.post('/updateClient',adminTokenChecking,updateClientProfile)
adminRoute.post('/createService',adminTokenChecking,FileUpload.single('thumbnail'),createService)
adminRoute.post('/updateService',adminTokenChecking,updateService)
adminRoute.delete('/deleteService',adminTokenChecking,deleteService)
adminRoute.get('/getAllServices',adminTokenChecking,getAllServices)

export  {
    adminRoute
}