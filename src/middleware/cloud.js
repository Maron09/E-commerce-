import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary"
import cloudinary from "../config/cloudinary.js";


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "profile_pictures",
        allowed_formats: ["jpg", "png", "jpeg"],
        transformation: [{
            width: 500,
            height: 500,
            crop: "limit"
        }]
    }
})

const upload = multer({ storage }).single("profilePicture")

export default upload;