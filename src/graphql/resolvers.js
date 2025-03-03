import paginationResults from "../helpers/pagination.js"
import User from "../models/User.js"
import Category from "../models/Category.js"
import Product from "../models/Product.js"
import mongoose from "mongoose"
import userProfile from "../models/UserProfile.js"





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
        },
        categories: async (_, __, {req}) => {
            try{
                if (!req || !req.userInfo) {
                    throw new Error("Please Login to continue");
                }    
                const categories = await Category.find({})
                return categories
            }catch(error){
                console.log(error)
                throw new Error(error.message)
            }
        },
        category: async (_, {id}, {req}) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return {
                        success: false,
                        message: "User not found",
                        user: null
                    }
                }
                if (!req || !req.userInfo) {
                    throw new Error("Please Login to continue");
                }
                const category = await Category.findById(id)
    
                if (!category) {
                    return {
                        success: false,
                        message: "category not found",
                        category: null
                    }
                }
                return {
                    success: true,
                    message: "category retrieved successfully",
                    category
                }
            } catch(error){
                return {
                    success: false,
                    message: "Error retrieving category",
                    product: null
                };
            }
        },
        paginatedUserProfiles: async (_, {page=1, limit=5}, {req}) => {
            try {
                if (!req.userInfo || req.userInfo?.role !== "ADMIN") {
                    throw new Error("Access Denied. Admin only.")
                }
                const totalItems = await userProfile.countDocuments()
                const { skip, ...pagination } = paginationResults(page, limit, totalItems)
                const userProfiles = await userProfile.find().skip(skip).limit(limit).populate({
                    path: "user",
                    select: "firstName lastName email role businessName isVerified isActive"
                })

                const formattedProfile = userProfiles.map(profile => ({
                    ...profile.toObject(),
                    id: profile._id.toString(),
                    user: {
                        ...profile.user.toObject(),
                        id: profile.user._id.toString()
                    }
                }))

                return {
                    userProfiles: formattedProfile,
                    pagination
                }
            } catch(error) {
                console.error("Error in paginatedUserProfiles:", error.message)
                throw new Error(error.message)
            }
        },
        userProfile: async (_, {id}, {req}) => {
            try {
                if (!req.userInfo) {
                    throw new Error("Authentication required")
                }

                if (req.userInfo.userID.toString() !== id.toString()) {
                    throw new Error("Access Denied: You can only view your own profile")
                }

                const  profileData = await userProfile.findOne({user: id}).populate({
                    path: "user",
                    select: "firstName lastName email role businessName isVerified isActive"
                })

                if (!profileData) {
                    return {
                        success: false,
                        message: "User profile not found",
                        userProfile: null
                    }
                }

                const userObj = profileData.user.toObject()
                userObj.isVerified = userObj.isVerified ?? false
                if (userObj.role !== "VENDOR") {
                    delete userObj.businessName
                }

                return {
                    success: true,
                    message: "User profile retrieved successfully",
                    userProfile: {
                        ...profileData.toObject(),
                        id: profileData._id.toString(),
                        user: {
                            ...userObj,
                            id: userObj._id.toString()
                        }
                    }
                }
            } catch(error) {
                console.error("Error in userProfile:", error);
                return {
                    success: false,
                    message: error.message,
                    userProfile: null
                };
            }
        },
        paginatedProducts: async (_, {page=1, limit=10}) => {
            try {
                const totalItems = await Product.countDocuments()
                const { skip, ...pagination } = paginationResults(page, limit, totalItems)

                const products = await Product.find().skip(skip).limit(limit).populate("vendor")

                return {
                    products,
                    pagination
                }
            } catch(error) {
                throw new Error("Error Fetching Products")
            }
        },
        product: async (_, {id}) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return {
                        success: false,
                        message: "Invalid product ID",
                        product: null
                    }
                }

                const product = await Product.findById(id).populate("vendor")

                if (!product) {
                    return {
                        success: false,
                        message: "Product not found",
                        product: null
                    }
                }

                return {
                    success: true,
                    message: "Product retrieved successfully",
                    product
                }
            } catch(error) {
                return {
                    success: false,
                    message: "Error retrieving product",
                    product: null
                };
            }
        }
    },
    Mutation: {
        CreateCategory: async (_, {name}, {req}) => {
            try {
                if (!req.userInfo || req.userInfo?.role !== "ADMIN") {
                    throw new Error("Access Denied. Admin only.")
                }

                const newCategory = await Category.create({
                    name
                })

                return {
                    success: true,
                    message: "Category created Successfully",
                    category: newCategory
                }
            } catch(error) {
                return {
                    success: false,
                    message: "Failed to create category",
                    category: null
                }
            }
        },
        DeleteCategory: async (_, {id}, {req}) => {
            try {
                if (!req.userInfo || req.userInfo?.role !== "ADMIN") {
                    throw new Error("Access Denied. Admin only.")
                }

                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return {
                        success: false,
                        message: "Invalid category ID",
                        user: null
                    }
                }

                const deleteCategory = await Category.findByIdAndDelete(id)
                if (!deleteCategory) {
                    return {
                        success: false,
                        message: "Category not found",
                        product: null
                    };
                }

                return {
                    success: true,
                    message: "Category deleted Successfully"
                }
            } catch(error) {
                return {
                    success: false,
                    message: "Error deleting category",
                }
            }
        },
        UpdateCategory: async(_, {id, name}, {req}) => {
            try {
                if (!req.userInfo || req.userInfo?.role !== "ADMIN") {
                    throw new Error("Access Denied. Admin only.")
                }
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return {
                        success: false,
                        message: "User not found",
                        user: null
                    }
                }
                const updatedCategory = await Category.findByIdAndUpdate(
                    id,
                    {name},
                    {new:true, runValidators: true}
                )
                if (!updatedCategory) {
                    return {
                        success: false,
                        message: "Category not Found",
                        category: null
                    }
                }
                return {
                    success: true,
                    message: "Category Updated Successfully",
                    category: updatedCategory
                }
            } catch(error) {

            }
        },
        UpdateUserProfile: async (_, { input }, { req }) => {
            try {
                // console.log("🔍 Received Input:", input);
                // console.log("🔍 req.userInfo:", req.userInfo);
        
                const { userId, phoneNumber, address, firstName, lastName, email } = input;
        
                if (!req.userInfo) {
                    throw new Error("Access Denied: Invalid user session.");
                }
        
                if (!req.userInfo.userID) {
                    throw new Error("Access Denied: No user ID found in session.");
                }
        
                // console.log("🔍 userId received:", userId);
                // console.log("🔍 req.userInfo.userID:", req.userInfo.userID);
        
                if (!userId) {
                    throw new Error("Invalid request: userId is missing in input.");
                }
        
                if (req.userInfo.userID.toString() !== userId.toString()) {
                    throw new Error("Access Denied: You can only update your own profile.");
                }
        
                const updateData = {};
                if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
                if (address !== undefined) updateData.address = address;
        
                const updateUserData = {};
                if (firstName !== undefined) updateUserData.firstName = firstName;
                if (lastName !== undefined) updateUserData.lastName = lastName;
                if (email !== undefined) updateUserData.email = email;
        
                // Update user profile
                const updatedProfile = await userProfile.findOneAndUpdate(
                    { user: userId },
                    updateData,
                    { new: true, runValidators: true }
                ).populate({
                    path: "user",
                    select: "firstName lastName email role businessName isVerified isActive"
                });
        
                // console.log("✅ Updated Profile:", updatedProfile);
        
                if (!updatedProfile) {
                    return {
                        success: false,
                        message: "Profile not found",
                        userProfile: null
                    };
                }
        
                if (!updatedProfile.user) {
                    console.error("❌ Error: updatedProfile.user is null.");
                    throw new Error("User not found in profile.");
                }
        
                let updateUser = updatedProfile.user;
                if (Object.keys(updateUserData).length > 0) {
                    updateUser = await User.findByIdAndUpdate(
                        userId,
                        updateUserData,
                        { new: true, runValidators: true }
                    );
                }
        
                if (!updateUser) {
                    throw new Error("User update failed.");
                }
        
                // Convert `_id` to string & remove `businessName` if not a vendor
                const userObj = updateUser.toObject();
                userObj.isVerified = userObj.isVerified ?? false;
                if (userObj.role !== "VENDOR") {
                    delete userObj.businessName;
                }
        
                return {
                    success: true,
                    message: "Profile Updated Successfully",
                    userProfile: {
                        ...updatedProfile.toObject(),
                        id: updatedProfile._id.toString(),
                        user: {
                            ...userObj,
                            id: userObj._id.toString()
                        }
                    }
                };
            } catch (error) {
                console.error("🔥 Error in updateUserProfile:", error);
                return {
                    success: false,
                    message: error.message,
                    userProfile: null
                };
            }
        },
        CreateProduct: async (_, { name, description, price, stock, category }, { req }) => {
            try {
                if (!req.userInfo || req.userInfo.role !== "VENDOR") {
                    throw new Error ("Access Denied. Only Vendors Can Create Products")
                }
                
                const newProduct = await Product.create({
                    name,
                    description,
                    price,
                    stock,
                    category,
                    vendor: req.userInfo.userID
                });

                const populatedProduct = await Product.findById(newProduct._id).populate(
                    "vendor", "firstName lastName", "businessName"
                );

                return {
                    success: true,
                    message: "Product created successfully",
                    product: populatedProduct
                }
            } catch(error) {
                return {
                    success: false,
                    message: error.message,
                    product: null
                };
            }
        },
        UpdateProduct: async (_, { id, name, description, price, stock, category }, { req }) => {
            try {
                if (!req.userInfo || req.userInfo.role !== "VENDOR") {
                    throw new Error ("Access Denied. Only Vendors Can Create Products")
                }

                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return {
                        success: false,
                        message: "Invalid product ID",
                        product: null
                    };
                }

                const updatedProduct = await Product.findByIdAndUpdate(
                    id,
                    {name, description, price, stock, category},
                    {new: true, runValidators: true}
                ).populate("vendor")

                if (!updatedProduct.vendor || req.userInfo.userID !== updatedProduct.vendor._id.toString()) {
                    return {
                        success: false,
                        message: "Access Denied. You can only edit your own Product"
                    }
                }

                if (!updatedProduct) {
                    return {
                        success: false,
                        message: "Product Not Found",
                        product: null
                    }
                }
                return {
                    success: true,
                    message: "Product Updated Successfully",
                    product: updatedProduct
                }
            } catch(error) {
                return {
                    success: false,
                    message: error.message,
                    product: null
                };
            }
        },
        DeleteProduct: async (_, {id}, {req}) => {
            try {
                if (!req.userInfo || req.userInfo.role !== "VENDOR") {
                    throw new Error ("Access Denied. Vendors Only")
                }

                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return {
                        success: false,
                        message: "Invalid product ID",
                        product: null
                    };
                }

                const deleteProduct = await Product.findByIdAndDelete(id)

                if (!deleteProduct.vendor || req.userInfo.userID !== deleteProduct.vendor._id.toString()) {
                    return {
                        success: false,
                        message: "Access Denied. You can only delete your own Product"
                    }
                }
                if (!deleteProduct) {
                    return {
                        success: false,
                        message: "Product Not Found",
                        product: null
                    }
                }

                return {
                    success: true,
                    message: "Product deleted Successfully",
                }
            } catch(error) {
                return {
                    success: false,
                    message: "Error deleting Product",
                }
            }
        }
    }
}


export default resolvers