import { Router } from "express";
import Razorpay from "razorpay";
import User from "../models/user.model.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order", authenticate, async (req, res) => {
    const { id } = req.user;
    try {
        const { amount, currency } = req.body;
        const options = {
            amount: amount * 100, // Convert to paise
            currency,
            payment_capture: 1, // Auto-capture payment
        };
        const order = await razorpay.orders.create(options);
        console.log("order created!!");
        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(401).json({
                    error: "User doesn't exist!",
                });
            }
            user.isAdmin = true;
            await user.save();
        } catch (error) {
            res.status(500).json({
                error: `Internal Server error: ${error.message}`,
            });
        }
        res.json(order);
    } catch (error) {
        console.log("order  not   created!!");
        res.status(500).json({ error: error.message });
    }
});

export default router;
