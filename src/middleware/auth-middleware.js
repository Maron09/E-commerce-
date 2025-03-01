import jwt from "jsonwebtoken"
import "../helpers/env.js"


class AuthMiddleware {
    static VerifyToken (req, res, next) {
        const authHeader = req.headers["authorization"]

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
        if (req.userInfo?.role !== "CUSTOMER") {
            return res.status(403).json({
                success: false,
                message: "Access Denied, Customers only"
            })
        }
        next()
    }
}

export default AuthMiddleware;