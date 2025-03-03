import express from "express"
import ProductControllers from "../controllers/product-controllers.js"
import uploadBothFiles from "../helpers/product-upload.js"


const ProductRoute = express.Router()



ProductRoute.put("/product/images/:productId", uploadBothFiles, ProductControllers.UploadProductImage)


export default ProductRoute