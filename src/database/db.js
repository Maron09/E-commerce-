import mongoose from "mongoose";


const ConnectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000, 
            socketTimeoutMS: 45000,
        })
        console.log("MongoDB Connected Successfully");
        
    } catch(error) {
        console.error("Failed to connect to DB", error)
        process.exit(1)
    }
}


export default ConnectToDB;