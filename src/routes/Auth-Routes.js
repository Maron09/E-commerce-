import express from "express"
import Rate from "../middleware/rateLimiter.js"
import AuthControllers from "../controllers/auth-controllers.js"


const AuthRoutes = express.Router()


AuthRoutes.post("/register-admin", AuthControllers.RegisterAdmin)
AuthRoutes.post("/register-vendor", AuthControllers.RegisterVendor)
AuthRoutes.post("/register-user", AuthControllers.RegisterCustomer)
AuthRoutes.post("/verify-email", AuthControllers.VerifyEmail)
AuthRoutes.post("/login", AuthControllers.Login)


export default AuthRoutes;