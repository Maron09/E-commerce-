import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import path from "path";
import fs from "fs";

// Ensure 'uploads' directory exists
const uploadDir = "products/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Local storage setup
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "products/");
    },
    filename: (req, file, cb) => {
        const uniqueName = file.fieldname + "-" + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// File filter (allow only images)
const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("image")) {
        return cb(new Error("Not an Image! Please upload only Images"));
    }
    cb(null, true);
};

// Multer configuration (handles multiple images)
const localUpload = multer({
    storage: localStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Max file size: 5MB
}).array("images", 5); // Accept up to 5 images with field name "images"

// Middleware for uploading both locally and to Cloudinary
const uploadBothFiles = (req, res, next) => {
    localUpload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        try {
            // Upload each image to Cloudinary and get URLs
            const uploadPromises = req.files.map(file =>
                cloudinary.uploader.upload(file.path, {
                    folder: "product_images",
                    transformation: [{ width: 500, height: 500, crop: "limit" }]
                })
            );

            const results = await Promise.all(uploadPromises);
            req.cloudinaryUrls = results.map(result => result.secure_url); // Store URLs in request

            next();
        } catch (uploadError) {
            return res.status(500).json({
                error: "Cloudinary upload failed",
                details: uploadError.message
            });
        }
    });
};

export default uploadBothFiles;
