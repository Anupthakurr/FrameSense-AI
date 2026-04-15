import dotenv from "dotenv";
import app from "./app.js";
import connectToDB from "./db/index.js";
dotenv.config({
    path: "./.env",
});

connectToDB().then(() => {
    app.on("error", (err) => {
        console.error("Express error: ", err);
        throw err;
    });
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server started on: ${process.env.PORT}`);
    });
});