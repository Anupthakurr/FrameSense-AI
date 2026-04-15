import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { addUserAvatar, getUserAvatar } from "../controllers/userAvatar.controller.js";

const router = Router();

router
    .route("/addAvatar")
    .post(authenticate, upload.single("userAvatar"), addUserAvatar);

router.route("/getAvatar").get(authenticate, getUserAvatar)

export default router;
