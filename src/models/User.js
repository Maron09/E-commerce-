import mongoose from "mongoose";




const { Schema, model } = mongoose

const UserSchema = new Schema ({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required:true
    },
    role: {
        type: String,
        enum: ["ADMIN", "CUSTOMER", "VENDOR"],
        required: true
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    verificationCode: { type: String },
    resetPasswordToken: { type: String }, 
    resetPasswordExpires: { type: Date },

    // for vendor
    businessName: { type: String, trim: true },
}, {timestamps: true})


const User = model("User", UserSchema)


export default User;