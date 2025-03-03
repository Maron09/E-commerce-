import Product from "../models/Product.js";
import mongoose from "mongoose";


class ProductControllers {
    static async UploadProductImage(req, res) {
        try {
            if (!req.cloudinaryUrls || req.cloudinaryUrls.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "File uploads"
                })
            }

            const {productId} = req.params

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Product ID"
                })
            }
            const userId = req.userInfo.userID

            // Check if product exists
            const existingProduct = await Product.findById(productId);
            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            // Ensure user is the owner
            if (existingProduct.vendor._id.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: You can only upload images for your own products"
                });
            }

            const updatedProduct = await Product.findOneAndUpdate(
                {_id: productId},
                {$push: {images: {$each: req.cloudinaryUrls}}},
                {new: true, runValidators: true}
            )

            return res.status(200).json({
                success: true,
                message: "Product images uploaded successfully",
                images: updatedProduct.images
            })
        } catch(error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message
            });
        }
    }
}


export default ProductControllers;