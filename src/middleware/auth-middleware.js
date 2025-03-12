import jwt from "jsonwebtoken"
import "../helpers/env.js"


class AuthMiddleware {
    static VerifyToken (req, res, next) {
        console.log("VerifyToken: Checking Authorization Header...");
        const authHeader = req.headers["authorization"]
        console.log("Auth Header:", authHeader);

        const token = authHeader && authHeader.split(" ")[1]

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Valid Token is required"
            })
        }

        try {
            const decodedToken = jwt.verify(
                token,
                process.env.JWT_SECRET_KEY
            )
            console.log("Decoded Token:", decodedToken);

            req.userInfo = decodedToken

            next()
        } catch(error){
            res.status(401).json({
                success: false,
                message: "Valid Token is required, Login to continue"
            })
        }
    }

    static IsAdmin (req, res, next) {
        if (req.userInfo?.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Access Denied, Admins only"
            })
        }
        next()
    }

    static IsVendor (req, res, next) {
        if (req.userInfo?.role !== "VENDOR") {
            return res.status(403).json({
                success: false,
                message: "Access Denied, Vendors only"
            })
        }
        next()
    }

    static IsCustomer (req, res, next) {
        console.log("Inside IsCustomer Middleware. User role:", req.userInfo.role)
        if (req.userInfo?.role !== "CUSTOMER") {
            console.log("Access Denied: Expected CUSTOMER, got", req.userInfo.role)
            return res.status(403).json({
                success: false,
                message: "Access Denied, Customers only"
            })
        }
        console.log("User is CUSTOMER. Proceeding...")
        next();
    }
}

export default AuthMiddleware;