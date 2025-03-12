import express from "express";
import StripeController from "../controllers/payment-controller.js";



const PaymentRoutes = express.Router()

PaymentRoutes.post(
    "/webhook",
    express.raw({type: "application/json"}),
    StripeController.handleWebhook
)

export default PaymentRoutes;