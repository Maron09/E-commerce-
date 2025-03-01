import express from "express"
import UserControllers from "../controllers/user-controllers.js"
import uploadBoth from "../middleware/cloud.js"


const UserRoutes = express.Router()


UserRoutes.put("/profile/upload/:userId", uploadBoth, UserControllers.UploadProfilePicture)


export default UserRoutes;