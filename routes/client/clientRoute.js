import express from 'express'
import { clientLogin, emailVerification, forgotPassword, forgotPasswordEmail, sendOtp } from '../../controllers/client/clientController.js'

const clientRoute = express.Router()

clientRoute.post('/sentOtp',sendOtp)
clientRoute.post('/emailVerification',emailVerification)
clientRoute.post('/clientLogin',clientLogin)
clientRoute.post('/forgotPasswordEmail',forgotPasswordEmail)
clientRoute.post('/forgotPassword',forgotPassword)

export {clientRoute}