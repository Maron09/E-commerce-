import express from "express"
import Rate from "../middleware/rateLimiter.js"
import AuthControllers from "../controllers/auth-controllers.js"


const AuthRoutes = express.Router()


AuthRoutes.post("/register-admin", AuthControllers.RegisterAdmin)
AuthRoutes.post("/register-vendor", AuthControllers.RegisterVendor)
AuthRoutes.post("/register-user", AuthControllers.RegisterCustomer)
AuthRoutes.post("/verify-email", AuthControllers.VerifyEmail)
AuthRoutes.post("/login", Rate.loginLimiter, AuthControllers.Login)
AuthRoutes.post("/forgot-password", Rate.forgotPasswordLimiter, AuthControllers.ForgotPassword)
AuthRoutes.post("/reset-password", AuthControllers.ResetPassword)
AuthRoutes.post("/change-password", AuthControllers.ChangePassword)

export default AuthRoutes;