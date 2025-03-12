import Order from "../models/Order.js"
import mongoose from "mongoose";


class StripeController {
    static async handleWebhook(req, res) {
        try {
            const event = req.body;

            if (event.type === "payment_intent.succeeded") {
                const paymentIntent = event.data.object;
                const orderId = paymentIntent.metadata.orderId;

                if (orderId) {
                    const objectId = new mongoose.Types.ObjectId(orderId);  // Convert orderId to ObjectId

                    const updateResult = await Order.updateOne(
                        { _id: objectId },  // Use ObjectId for query
                        { $set: { status: "Completed" } }
                    );

                    if (updateResult.modifiedCount > 0) {
                        console.log(`✅ Order ${orderId} is now Completed`);
                    } else {
                        console.log(`❌ Order ${orderId} not found or already updated`);
                    }
                }
            }

            return res.status(200).json({ received: true });
        } catch (error) {
            console.error("🚨 Webhook Error:", error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default StripeController