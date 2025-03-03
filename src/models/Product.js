import mongoose from "mongoose";


const { Schema, model } = mongoose


const ProductSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String, 
        maxLength: [300, "Description cannot be more than 300 characters"],
        trim: true,
        default: ""
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    images: {
        type: [String],
        validate: {
            validator: function(val) {
                return val.length <= 5
            },
            message: "You can upload a maximum of 5 images"
        }
    },
    vendor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, {timestamps: true})


const Product = model("Product", ProductSchema)

export default Product