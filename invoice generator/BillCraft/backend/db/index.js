import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectToDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("Connected to db");
    } catch (error) {
        console.error("Error connecting to database: ", error);
        process.exit(1);
    }
};

export default connectToDB;
