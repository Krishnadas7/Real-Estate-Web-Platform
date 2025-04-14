import express from 'express'
import { emailVerification, forgotPassword, forgotPasswordEmail, loginPhotographer, sendOtp } from '../../controllers/photographer/photographerController.js'

const photographerRoute = express.Router()

photographerRoute.post('/sendOtp',sendOtp)
photographerRoute.post('/verifyEmail',emailVerification)
photographerRoute.post('/login',loginPhotographer)
photographerRoute.post('/forgotPasswordEmail',forgotPasswordEmail)
photographerRoute.post('/forgotPassword',forgotPassword)
export {photographerRoute}