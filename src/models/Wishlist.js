import mongoose from "mongoose";


const { Schema, model } = mongoose


const WishlistSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

WishlistSchema.index({product: 1, customer: 1}, {unique: true})

const WishList = model("Wishlist", WishlistSchema)


export default WishList