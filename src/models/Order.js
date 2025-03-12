import mongoose from "mongoose";



const { Schema, model } = mongoose



const OrderSchema = new Schema({
    customer : {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: {
        type: Schema.Types.ObjectId,
        ref: "OrderItem"
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Completed", "Cancelled"],
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true})


const Order = model("Order", OrderSchema)


export default Order