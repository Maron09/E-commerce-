import mongoose from "mongoose";




const { Schema, model } = mongoose

const UserProfileSchema = new Schema ({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    phoneNumber: {
        type: String,
        validate: {
            validator: function (v) {
            return /^\d{10,14}$/.test(v);
        },
            message: (props) => `${props.value} is not a valid phone number!`,
        },
    },
    profilePicture: {
        type: String
    },
    address: {
        street: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        zipcode: {
            type: Number,
            trim: true
        },
        country: {
            type: String,
            trim: true
        },
    }
}, {timestamps: true})


const userProfile = model("UserProfile", UserProfileSchema)


export default userProfile;