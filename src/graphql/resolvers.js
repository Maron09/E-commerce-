import paginationResults from "../helpers/pagination.js"
import User from "../models/User.js"
import Category from "../models/Category.js"
import Product from "../models/Product.js"
import mongoose from "mongoose"
import userProfile from "../models/UserProfile.js"
import WishList from "../models/Wishlist.js"
import Cart from "../models/Cart.js"





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
        },
        wishlists: async(_, __, {req}) => {
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }

                const customerId = req.userInfo.userID

                const wishlists = await WishList.find({customer: customerId}).populate({
                    path: "product",
                    populate: {path: "vendor"}
                }).populate("customer")

                return wishlists.map(wishlist => ({
                    ...wishlist.toObject(),
                    id: wishlist._id.toString(),
                    product: {
                        ...wishlist.product.toObject(),
                        id: wishlist.product._id.toString(),
                        vendor: {
                            ...wishlist.product.vendor.toObject(),
                            id: wishlist.product.vendor._id.toString()
                        }
                    },
                    customer: {
                        ...wishlist.customer.toObject(),
                        id: wishlist.customer._id.toString()
                    }
                }))
            }catch(error) {
                console.error(error);
                throw new Error(error.message)
            }
        },
        wishlist: async(_, {id}, {req}) => {
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw new Error("Invalid Wishlist ID")
                }
                const customerId = req.userInfo.userID

                const wishlist = await WishList.findOne({
                    _id: id,
                    customer: customerId
                }).populate({
                    path: "product",
                    populate: {path: "vendor"}
                }).populate("customer")

                if (!wishlist) {
                    return {
                        success: false,
                        message: "wishlist item not found",
                        item: null
                    }
                }

                return {
                    success: true,
                    message: "Wishlist item retrieve successfully",
                    item: wishlist
                }
            }catch(error) {
                return {
                    success: false,
                    message: "Error retrieving wishlist",
                    product: null
                };
            }
        },
        cartItems: async (_, __, {req}) => {
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }
                const customerId = req.userInfo.userID

                const cartItems = await Cart.find({customer: customerId}).populate({
                    path: "product",
                    populate: {path: "vendor"}
                }).populate("customer")

                return cartItems.map(cartItem => ({
                    ...cartItem.toObject(),
                    id: cartItem._id.toString(),
                    product: {
                        ...cartItem.product.toObject(),
                        id: cartItem.product._id.toString(),
                        vendor: {
                            ...cartItem.product.vendor.toObject(),
                            id: cartItem.product.vendor._id.toString()
                        }
                    },
                    customer: {
                        ...cartItem.customer.toObject(),
                        id: cartItem.customer._id.toString()
                    }
                }))
            }catch(error) {
                console.error(error);
                throw new Error(error.message);
            }
        },
        cartItem: async (_, {id}, {req}) => {
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw new Error("Invalid Wishlist ID")
                }
                const customerId = req.userInfo.userID

                const cartItem = await Cart.findOne({
                    _id: id,
                    customer: customerId
                }).populate({
                    path: "product",
                    populate: {path: "vendor"}
                }).populate("customer")

                if (!cartItem) {
                    return {
                        success: false,
                        message: "Cart Item not found",
                        item: null
                    }
                }

                return {
                    success: true,
                    message: "Cart Item retrieved successfully",
                    item: cartItem
                }
            }catch(error) {
                return {
                    success: false,
                    message: "Error retrieving wishlist",
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
        },
        addToWishList: async (_, { productId }, { req }) => {
            try {
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only customers can save products");
                }
                const customerId = req.userInfo.userID;
        
                if (!mongoose.Types.ObjectId.isValid(productId)) {
                    throw new Error("Invalid product ID");
                }
        
                // ✅ Check if the item already exists in the wishlist
                const existingItem = await WishList.findOne({
                    product: productId,
                    customer: customerId,
                }).populate({
                    path: "product",
                    populate: { path: "vendor" },
                });
        
                if (existingItem) {
                    if (existingItem.isDeleted) {
                        existingItem.isDeleted = false;
                        await existingItem.save();
                    } else {
                        return {
                            success: false,
                            message: "Item already in wishlist",
                            item: null,
                        };
                    }
                } else {
                    // ✅ Create new wishlist item
                    const newWishlistItem = await WishList.create({
                        product: productId,
                        customer: customerId,
                    });
        
                    await newWishlistItem.populate({
                        path: "product",
                        populate: { path: "vendor" },
                    });
                }
        
                // ✅ Convert Mongoose Document to Object
                const wishlistItem = await WishList.findOne({
                    product: productId,
                    customer: customerId,
                })
                    .populate({
                        path: "product",
                        populate: { path: "vendor" },
                    })
                    .populate("customer") // ✅ Ensure customer is populated
                    .lean(); // Convert Mongoose document to plain JS object
        
                // ✅ Ensure IDs are properly converted to strings
                return {
                    success: true,
                    message: "Item added to wishlist",
                    item: {
                        ...wishlistItem,
                        id: wishlistItem._id.toString(),
                        product: {
                            ...wishlistItem.product,
                            id: wishlistItem.product._id.toString(),
                            vendor: {
                                ...wishlistItem.product.vendor,
                                id: wishlistItem.product.vendor._id.toString(),
                            },
                        },
                        customer: {
                            ...wishlistItem.customer,
                            id: wishlistItem.customer._id.toString(),
                            firstName: wishlistItem.customer.firstName || "", // ✅ Prevent null values
                            lastName: wishlistItem.customer.lastName || "",
                            email: wishlistItem.customer.email || "",
                        },
                    },
                };
            } catch (error) {
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                    item: null,
                };
            }
        },
        removeFromWishList: async (_, { productId }, { req }) => {
            try {
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only customers can remove products");
                }
            
                const customerId = req.userInfo.userID;
            
                if (!mongoose.Types.ObjectId.isValid(productId)) {
                    throw new Error("Invalid product ID");
                }
            
                const wishlistItem = await WishList.findOne({
                    product: productId,
                    customer: customerId
                }).populate({
                    path: "product",
                    populate: { path: "vendor" } // ✅ Ensure vendor is populated
                }).populate("customer"); // ✅ Ensure customer is populated
            
                if (!wishlistItem) {
                    return {
                    success: false,
                    message: "Item not found in wishlist",
                    item: null
                    };
                }
            
                wishlistItem.isDeleted = true;
                await wishlistItem.save();
            
                return {
                    success: true,
                    message: "Item removed from wishlist",
                    item: {
                    ...wishlistItem.toObject(),
                    id: wishlistItem._id.toString(), // ✅ Convert _id to string
                    product: {
                        ...wishlistItem.product.toObject(),
                        id: wishlistItem.product._id.toString(), // ✅ Convert product _id to string
                        vendor: {
                        ...wishlistItem.product.vendor.toObject(),
                        id: wishlistItem.product.vendor._id.toString() // ✅ Convert vendor _id to string
                        }
                    },
                    customer: {
                        ...wishlistItem.customer.toObject(),
                        id: wishlistItem.customer._id.toString() // ✅ Convert customer _id to string
                    }
                    }
                };
                } catch (error) {
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                    item: null
                };
            }
        },
        addToCart: async(_, { productId, quantity }, {req}) => {
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }
                const customerId = req.userInfo.userID

                if (!mongoose.Types.ObjectId.isValid(productId)) {
                    throw new Error("Invalid Product ID")
                }

                const product = await Product.findById(productId)
                if (!product) {
                    return {
                        success: false,
                        message: "Product not Available",
                        item: null
                    }
                }

                let cartItem = await Cart.findOne({customer: customerId, product:productId})
                if (cartItem) {
                    const newQuantity = cartItem.quantity + quantity

                    if (newQuantity > product.stock) {
                        return {
                            success: false,
                            message: `Only ${product.stock} items are left in stock`,
                            item: null
                        }
                    }
                    cartItem.quantity = newQuantity
                    await cartItem.save()
                    
                } else {
                    if (quantity > product.stock) {
                        return {
                            success: false,
                            message: `Only ${product.stock} items are left in stock.`,
                            item: null
                        }
                    }
                    cartItem = await Cart.create({
                        customer: customerId,
                        product:productId,
                        quantity
                    })
                }

                await cartItem.populate({
                    path: "product",
                    populate: {path: "vendor"}
                })
                await cartItem.populate("customer");

                return {
                    success: true,
                    message: "Item added to cart",
                    item: cartItem
                }
            }catch(error) {
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                    item: null
                };
            }
        },
        removeFromCart: async(_, { productId, quantity }, { req }) => {
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }

                const customerId = req.userInfo.userID

                if (!mongoose.Types.ObjectId.isValid(productId)) {
                    throw new Error("Invalid Product ID")
                }

                const cartItem = await Cart.findOne({customer: customerId, product:productId})

                if (!cartItem) {
                    return {
                        success: false,
                        message: "Item not found",
                        item: null
                    }
                }

                if (!quantity || cartItem.quantity <= quantity) {
                    await cartItem.deleteOne()
                    return {
                        success: true,
                        message: "Item removed from cart",
                        item: null
                    }
                }

                cartItem.quantity -= quantity
                await cartItem.save()

                await cartItem.populate({
                    path: "product",
                    populate: {path: "vendor"}
                })
                await cartItem.populate("customer")

                return {
                    success: true,
                    message: "Item quantity updated",
                    item: cartItem
                }
            }catch(error) {
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                    item: null
                };
            }
        },
        clearCart: async(_, __, {req}) => {
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }

                const customerId = req.userInfo.userID

                await Cart.deleteMany({customer: customerId}).populate({
                    path: "product",
                    populate: {path: "vendor"}
                }).populate("customer")

                return {
                    success: true,
                    message: "Cart Cleared Successfully",
                    item: null
                }
            }catch(error){
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                };
            }
        }
    }
}


export default resolvers;