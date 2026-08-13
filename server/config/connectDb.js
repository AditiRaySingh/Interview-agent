import mongoose from "mongoose";
const connectedDb=async()=>{
    try{

        await mongoose.connect(process.env.MONGO_URL);
        console.log("database is connected");

    }
    catch(error)
    {
console.log(`database error ${error}`);
    }
}

export default connectedDb;