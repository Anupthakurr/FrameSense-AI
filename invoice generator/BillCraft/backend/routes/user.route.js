import { Router } from "express";
import {
    loginUser,
    loginWithGoogle,
    logoutUser,
    registerUser,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/google").post(loginWithGoogle);

export default router;
