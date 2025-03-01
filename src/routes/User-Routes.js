import express from "express"
import UserControllers from "../controllers/user-controllers.js"
import upload from "../middleware/cloud.js"

const UserRoutes = express.Router()


UserRoutes.put("/profile/upload/:userId", upload, UserControllers.UploadProfilePicture)


export default UserRoutes;