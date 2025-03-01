import userProfile from "../models/UserProfile.js";
import mongoose from "mongoose";


class UserControllers {

    static async UploadProfilePicture(req, res) {
        try {
            if (!req.cloudinaryUrl) {
                return res.status(400).json({
                    success: false,
                    message: "File upload failed"
                })
            }
            const {userId} =  req.params

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID"
                })
            }

            if (req.userInfo.userID !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You can only update your own profile.",
                });
            }

            const profile = await userProfile.findOneAndUpdate(
                {user: userId},
                {profilePicture: req.cloudinaryUrl},
                {new: true}
            )
            return res.status(200).json({
                success: true,
                message: "Profile picture uploaded successfully",
                imageUrl: req.cloudinaryUrl
            })
        } catch(error) {
            console.log(error)
            res.status(500).json({
                success: false,
                error: "Server error",
                details: error.message
            })
        }
    }
}



export default UserControllers;