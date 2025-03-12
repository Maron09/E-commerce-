import mongoose from "mongoose";



const { Schema, model } = mongoose


const OrderItemSchema = new Schema({
    order: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
}, {timestamps: true})


const OrderItem = model("OrderItem", OrderItemSchema)


export default OrderItem