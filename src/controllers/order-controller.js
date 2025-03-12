import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import mongoose from "mongoose";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

class OrderController {
    static async placeOrder(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            const userId = req.userInfo.userID;
    
            
            const cartItems = await Cart.find({ customer: userId })
                .populate("product")
                .session(session);
    
            if (!cartItems.length) {
                throw new Error("Cart is empty. Add items before placing an order");
            }
    
            let totalPrice = 0;
            const orderItems = [];
    
    
            const order = await Order.create(
                [
                    {
                        customer: userId,
                        totalPrice: 0,
                    },
                ],
                { session }
            );
    
            for (const cartItem of cartItems) {
                const product = cartItem.product;
    
                if (!product || cartItem.quantity > product.stock) {
                    throw new Error(`Not enough stock for ${product.name}`);
                }
    
                // ✅ Create order items
                const orderItem = await OrderItem.create(
                    [
                        {
                            order: order[0]._id,
                            product: product._id,
                            quantity: cartItem.quantity,
                            price: product.price,
                        },
                    ],
                    { session }
                );
    
                orderItems.push(orderItem[0]._id);
    
                // 🏷️ Deduct stock
                product.stock -= cartItem.quantity;
                await product.save({ session });
    
                totalPrice += cartItem.quantity * product.price;
            }
    
            if (orderItems.length === 0) {
                throw new Error("No valid order items found.");
            }
    
            // ✅ Properly update `items` and `totalPrice`
            await Order.updateOne(
                { _id: order[0]._id },
                { $set: { items: orderItems, totalPrice: totalPrice } },
                { session }
            );
    
            // 🔥 Fetch the updated order with populated `items`
            const updatedOrder = await Order.findById(order[0]._id).populate("items").session(session);

            const pamentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalPrice *100),
                currency: "ngn",
                metadata: {orderId: order[0]._id.toString()},
                payment_method_types: ["card"]
            })
    
            await session.commitTransaction();
            session.endSession();
    
            return res.status(201).json({
                success: true,
                message: "Order placed successfully",
                order: updatedOrder,
                clientSecret: pamentIntent.client_secret
            });
        } catch (error) {
            await session.abortTransaction()
            session.endSession();
            return res.status(400).json({ success: false, message: error.message });
        }
    }

}


export default OrderController