import userProfile from "../models/UserProfile.js";
import mongoose from "mongoose";


class UserControllers {
    static async UploadProfilePicture (req, res) {
        try {
            const { userId } = req.params

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID"
                });
            }

            if (req.userInfo.userID !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You can only update your own profile.",
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No file Uploaded"
                })
            }

            const profile = await userProfile.findOneAndUpdate(
                {user: userId},
                {profilePicture: req.file.path},
                {new: true}
            )

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: "Profile not found"
                })
            }
            return res.status(200).json({
                success: true,
                message: "Profile Picture uploaded Successfully",
                profile
            })
        } catch(error) {
            console.error(error)
            res.status(500).json({
                success: false,
                message: "Error uploading profile picture",
                error: error.message
            })
        }
    }
}



export default UserControllers;