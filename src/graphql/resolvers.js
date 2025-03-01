import paginationResults from "../helpers/pagination.js"
import User from "../models/User.js"
import mongoose from "mongoose"




const resolvers = {
    Query: {
        paginatedUsers: async (_, {page=1, limit=5}, {req}) => {
            try {
                console.log("Request User Info:", req.userInfo);
                if (!req.userInfo || req.userInfo?.role !== "ADMIN") {
                    throw new Error("Access Denied. Admin only.")
                }
                const totalItems = await User.countDocuments()
                const { skip, ...pagination } = paginationResults(page, limit, totalItems)

                const users = await User.find().skip(skip).limit(limit)

                return {
                    users,
                    pagination
                }
            } catch(error) {
                console.error("Error in paginatedUsers:", error.message)
                throw new Error(error.message)
            }
        },
        user: async (_, {id}, {req}) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return {
                        success: false,
                        message: "User not found",
                        user: null
                    }
                }
                if (req.userInfo.userID !== id) {
                    return{
                        success: false,
                        message: "Not permitted to view"
                    }
                }
                const user = await User.findById(id)

                if (!user) {
                    return {
                        success: false,
                        message: "User not Found",
                        user: null
                    }
                }

                return {
                    success: true,
                    message: "User Retrieved Successfully",
                    user
                }
            } catch(error) {
                return {
                    success: false,
                    message: error.message,
                    product: null
                };
            }
        }
    }
}


export default resolvers