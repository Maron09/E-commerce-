import mongoose from "mongoose";


const { Schema, model } = mongoose



const CartSchema = new Schema({
    customer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, {timestamps: true})


CartSchema.index({customer: 1, product: 1}, {unique: true})

const Cart = model("Cart", CartSchema)


export default Cart;