import {Router} from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { sendEmail } from "../controllers/email.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").post(authenticate, upload.single("invoice"), sendEmail)

export default router;

