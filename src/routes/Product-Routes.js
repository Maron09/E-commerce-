import express from "express"
import ProductControllers from "../controllers/product-controllers.js"
import uploadBothFiles from "../helpers/product-upload.js"
import AuthMiddleware from "../middleware/auth-middleware.js"



const ProductRoute = express.Router()



ProductRoute.put("/product/images/:productId", AuthMiddleware.VerifyToken, AuthMiddleware.IsVendor, uploadBothFiles, ProductControllers.UploadProductImage)


export default ProductRoute