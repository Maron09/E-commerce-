import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary"
import cloudinary from "../config/cloudinary.js";
import path from "path"
import fs from "fs"


const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // Create uploads directory if it doesn't exist
}

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/")
    },
    filename: (req, file, cb) => {
        const uniqueName = file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        cb(null, uniqueName)
    }
})

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("image")) {
        return cb(new Error("Not an Image! Please upload only Images"))
    }
    cb(null, true)
}

const localUpload = multer({
    storage: localStorage,
    fileFilter: fileFilter,
    limits: { fieldSize: 5 *1024 * 1024 }
}).single("profilePicture")



const uploadBoth = (req, res, next) => {
    localUpload(req, res, async(err) => {
        if (err) {
            return res.status(400).json({
                error: err.message
            })
        }
        if (!req.file) {
            return res.status(400).json({
                error: "No file Uploaded"
            })
        }

        try {   
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "profile_picture",
                transformation: [{
                    width: 500,
                    height: 500,
                    crop: "limit"
                }]
            })
            req.cloudinaryUrl = result.secure_url

            next()
        } catch(uploadError) {
            return res.status(500).json({
                error: "Cloudinary upload failed",
                details: uploadError
            })
        }
    })
}


export default uploadBoth