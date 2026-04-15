import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credientials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.route.js";
import profileRouter from "./routes/profile.route.js";
import userAvatarRouter from "./routes/userAvatar.route.js"
import emailRouter from "./routes/email.route.js"
import paymentRouter from "./routes/payment.route.js"
app.use("/api/v1/user", userRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/userAvatar", userAvatarRouter)
app.use("/api/v1/send-email", emailRouter)
app.use('/api/v1/payment', paymentRouter)
export default app;
