import express from "express"
import OrderController from "../controllers/order-controller.js"
import AuthMiddleware from "../middleware/auth-middleware.js"


const OrderRoutes = express.Router()


OrderRoutes.post("/place_order", AuthMiddleware.VerifyToken, AuthMiddleware.IsCustomer,  OrderController.placeOrder)


export default OrderRoutes