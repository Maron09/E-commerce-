import paginationResults from "../helpers/pagination.js"
import User from "../models/User.js"
import Category from "../models/Category.js"
import Product from "../models/Product.js"
import mongoose from "mongoose"
import userProfile from "../models/UserProfile.js"
import WishList from "../models/Wishlist.js"
import Cart from "../models/Cart.js"
import Order from "../models/Order.js"
import OrderItem from "../models/OrderItem.js"







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
            const session = await mongoose.startSession()

            session.startTransaction()
            try {
                if (!req.userInfo || req.userInfo?.role !== "ADMIN") {
                    throw new Error("Access Denied. Admin only.")
                }

                const newCategory = await Category.create(
                    [{name}],
                    {session}
                )

                await session.commitTransaction()
                session.endSession()

                return {
                    success: true,
                    message: "Category created Successfully",
                    category: newCategory
                }
            } catch(error) {
                await session.abortTransaction()
                session.endSession()
                console.error("Transaction failed:", error);
                return {
                    success: false,
                    message: "Failed to create category",
                    category: null
                }
            }
        },
        DeleteCategory: async (_, {id}, {req}) => {
            const session = await mongoose.startSession()
            session.startTransaction()
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

                const deleteCategory = await Category.findById(id).session(session)
                if (!deleteCategory) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "Category not found",
                        product: null
                    };
                }

                await Category.deleteOne(
                    {_id:id},
                    {session}
                )
                await session.commitTransaction()
                session.endSession()

                return {
                    success: true,
                    message: "Category deleted Successfully"
                }
            } catch(error) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    message: "Error deleting category",
                }
            }
        },
        UpdateCategory: async(_, {id, name}, {req}) => {
            const session = await mongoose.startSession()
            session.startTransaction()
            try {
                if (!req.userInfo || req.userInfo?.role !== "ADMIN") {
                    throw new Error("Access Denied. Admin only.")
                }
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "User not found",
                        user: null
                    }
                }
                const category = await Category.findById(id).session(session)
                if (!category) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "Category not Found",
                        category: null
                    }
                }
                category.name = name
                await category.save({session})

                await session.commitTransaction()
                session.endSession()
                return {
                    success: true,
                    message: "Category Updated Successfully",
                    category: updatedCategory
                }
            } catch(error) {
                await session.abortTransaction();
                session.endSession();

                console.error("Transaction failed:", error);

                return {
                    success: false,
                    message: "Error updating category",
                    category: null
                };
            }
        },
        UpdateUserProfile: async (_, { input }, { req }) => {
            const session = await mongoose.startSession()
            session.startTransaction()
            try {
        
                const { userId, phoneNumber, address, firstName, lastName, email } = input;
        
                if (!req.userInfo) {
                    throw new Error("Access Denied: Invalid user session.");
                }
        
                if (!req.userInfo.userID) {
                    throw new Error("Access Denied: No user ID found in session.");
                }
        
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
                    { new: true, runValidators: true, session }
                ).populate({
                    path: "user",
                    select: "firstName lastName email role businessName isVerified isActive"
                });
        
                if (!updatedProfile) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "Profile not found",
                        userProfile: null
                    };
                }
        
                if (!updatedProfile.user) {
                    await session.abortTransaction()
                    session.endSession()
                    console.error("❌ Error: updatedProfile.user is null.");
                    throw new Error("User not found in profile.");
                }
        
                let updateUser = updatedProfile.user;
                if (Object.keys(updateUserData).length > 0) {
                    updateUser = await User.findByIdAndUpdate(
                        userId,
                        updateUserData,
                        { new: true, runValidators: true, session }
                    );
                }
        
                if (!updateUser) {
                    await session.abortTransaction()
                    session.endSession()
                    throw new Error("User update failed.");
                }

                await session.commitTransaction()
                session.endSession()
        
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
                await session.abortTransaction()
                session.endSession()
                console.error("🔥 Error in updateUserProfile:", error);
                return {
                    success: false,
                    message: error.message,
                    userProfile: null
                };
            }
        },
        CreateProduct: async (_, { name, description, price, stock, category }, { req }) => {
            const session = await mongoose.startSession()
            session.startTransaction()
            try {
                if (!req.userInfo || req.userInfo.role !== "VENDOR") {
                    throw new Error ("Access Denied. Only Vendors Can Create Products")
                }
                
                const newProduct = await Product.create([{
                    name,
                    description,
                    price,
                    stock,
                    category,
                    vendor: req.userInfo.userID
                }], {session});

                const populatedProduct = await Product.findById(newProduct[0]._id).populate(
                    "vendor", "firstName lastName", "businessName"
                ).session(session)

                if (!populatedProduct) {
                    await session.abortTransaction();
                    session.endSession();
                    return {
                        success: false,
                        message: "Failed to create product",
                        product: null
                    };
                }

                await session.commitTransaction()
                session.endSession()

                return {
                    success: true,
                    message: "Product created successfully",
                    product: populatedProduct
                }
            } catch(error) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    message: error.message,
                    product: null
                };
            }
        },
        UpdateProduct: async (_, { id, name, description, price, stock, category }, { req }) => {
            const session = await mongoose.startSession()
            session.startTransaction()
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

                const existingProduct = await Product.findById(id).populate("vendor").session(session)

                if (!existingProduct) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "Product Not Found",
                        product: null
                    }
                }

                if (!existingProduct.vendor || req.userInfo.userID !== existingProduct.vendor._id.toString()) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "Access Denied. You can only edit your own Product"
                    }
                }

                const updatedProduct = await Product.findByIdAndUpdate(
                    id,
                    { name, description, price, stock, category },
                    { new: true, runValidators: true, session }
                ).populate("vendor")

                await session.commitTransaction()
                session.endSession()

                
                return {
                    success: true,
                    message: "Product Updated Successfully",
                    product: updatedProduct
                }
            } catch(error) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    message: error.message,
                    product: null
                };
            }
        },
        DeleteProduct: async (_, {id}, {req}) => {
            const session = await mongoose.startSession();
            session.startTransaction();
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
                const product = await Product.findById(id).populate("vendor").session(session)

                if (!product) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "Product Not Found",
                    }
                }

                if (!product.vendor || req.userInfo.userID !== product.vendor._id.toString()) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "Access Denied. You can only delete your own Product"
                    }
                }

                await Product.findByIdAndDelete(id, {session})

                await session.commitTransaction()
                session.endSession()

                return {
                    success: true,
                    message: "Product deleted Successfully",
                }
            } catch(error) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    message: "Error deleting Product",
                }
            }
        },
        addToWishList: async (_, { productId }, { req }) => {
            const session = await mongoose.startSession()
            session.startTransaction()
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
                }).session(session)
        
                if (existingItem) {
                    if (existingItem.isDeleted) {
                        existingItem.isDeleted = false;
                        await existingItem.save({session});
                    } else {
                        await session.abortTransaction()
                        session.endSession()
                        return {
                            success: false,
                            message: "Item already in wishlist",
                            item: null,
                        };
                    }
                } else {
                    // ✅ Create new wishlist item
                    const newWishlistItem = await WishList.create([{
                        product: productId,
                        customer: customerId,
                    }], { session });
        
                    await newWishlistItem.populate({
                        path: "product",
                        populate: { path: "vendor" },
                    });
                }
                
                await session.commitTransaction()
                session.endSession()

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
                await session.abortTransaction();
                session.endSession();
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                    item: null,
                };
            }
        },
        removeFromWishList: async (_, { productId }, { req }) => {
            const session = await mongoose.startSession()
            session.startTransaction()
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
                    populate: { path: "vendor" } 
                }).populate("customer").session(session)
            
                if (!wishlistItem) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                    success: false,
                    message: "Item not found in wishlist",
                    item: null
                    };
                }
            
                wishlistItem.isDeleted = true;
                await wishlistItem.save();

                await session.commitTransaction()
                session.endSession()
            
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
                    await session.abortTransaction()
                    session.endSession()
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                    item: null
                };
            }
        },
        addToCart: async(_, { productId, quantity }, {req}) => {
            const session = await mongoose.startSession()
            session.startTransaction()
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }
                const customerId = req.userInfo.userID

                if (!mongoose.Types.ObjectId.isValid(productId)) {
                    throw new Error("Invalid Product ID")
                }

                const product = await Product.findById(productId).session(session)
                if (!product) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "Product not Available",
                        item: null
                    }
                }

                let cartItem = await Cart.findOne({customer: customerId, product:productId}).session(session)
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
                    await cartItem.save({session})
                    
                } else {
                    if (quantity > product.stock) {
                        return {
                            success: false,
                            message: `Only ${product.stock} items are left in stock.`,
                            item: null
                        }
                    }
                    cartItem = await Cart.create([{
                        customer: customerId,
                        product:productId,
                        quantity
                    }], {session})
                }

                await cartItem.populate({
                    path: "product",
                    populate: {path: "vendor"}
                })
                await cartItem.populate("customer");

                await session.commitTransaction()
                session.endSession()

                return {
                    success: true,
                    message: "Item added to cart",
                    item: cartItem
                }
            }catch(error) {
                await session.abortTransaction()
                session.endSession()
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                    item: null
                };
            }
        },
        removeFromCart: async(_, { productId, quantity }, { req }) => {
            const session = await mongoose.startSession()
            session.startTransaction()
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }

                const customerId = req.userInfo.userID

                if (!mongoose.Types.ObjectId.isValid(productId)) {
                    throw new Error("Invalid Product ID")
                }

                const cartItem = await Cart.findOne({customer: customerId, product:productId}).session(session)

                if (!cartItem) {
                    await session.abortTransaction()
                    session.endSession()
                    return {
                        success: false,
                        message: "Item not found",
                        item: null
                    }
                }

                if (!quantity || cartItem.quantity <= quantity) {
                    await cartItem.deleteOne({session})
                    return {
                        success: true,
                        message: "Item removed from cart",
                        item: null
                    }
                }

                cartItem.quantity -= quantity
                await cartItem.save({session})

                await cartItem.populate({
                    path: "product",
                    populate: {path: "vendor"}
                })
                await cartItem.populate("customer")

                await session.commitTransaction()
                session.endSession()

                return {
                    success: true,
                    message: "Item quantity updated",
                    item: cartItem
                }
            }catch(error) {
                await session.abortTransaction()
                session.endSession()
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                    item: null
                };
            }
        },
        clearCart: async(_, __, {req}) => {
            const session = await mongoose.startSession()
            session.startTransaction()
            try{
                if (!req.userInfo || req.userInfo.role !== "CUSTOMER") {
                    throw new Error("Access Denied. Only Customers can Add to cart")
                }

                const customerId = req.userInfo.userID

                await Cart.deleteMany({customer: customerId}).populate({
                    path: "product",
                    populate: {path: "vendor"}
                }).populate("customer").session(session)

                await session.commitTransaction()
                session.endSession()

                return {
                    success: true,
                    message: "Cart Cleared Successfully",
                    item: null
                }
            }catch(error){
                await session.abortTransaction()
                session.endSession()
                console.error(error);
                return {
                    success: false,
                    message: error.message,
                };
            }
        },
    }
}


export default resolvers;