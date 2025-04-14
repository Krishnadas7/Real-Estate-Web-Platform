import express from 'express'
import { 
    clientLogin,
     emailVerification,
      forgotPassword,
       forgotPasswordEmail,
        sendOtp ,
         listService
            } from '../../controllers/client/clientController.js'
import { clientAuth } from '../../middleware/clientAuth.js'
const clientRoute = express.Router()

clientRoute.post('/sentOtp',sendOtp)
clientRoute.post('/emailVerification',emailVerification)
clientRoute.post('/clientLogin',clientLogin)
clientRoute.post('/forgotPasswordEmail',forgotPasswordEmail)
clientRoute.post('/forgotPassword',forgotPassword)
clientRoute.get('/services',clientAuth,listService)
export {clientRoute}