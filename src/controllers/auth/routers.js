import { Router } from "express";
import { verifyUser } from "../../middlewares/index.js";

// @import the controller
import * as AuthControllers from "./index.js";

// @define routes
const router = Router();
router.post("/register", AuthControllers.register);
router.post("/login", AuthControllers.login);
router.post("/verify", AuthControllers.verify.verifyAccount);
router.post("/request-otp", verifyUser, AuthControllers.requestOtp);
router.get("/keep-login", verifyUser, AuthControllers.keepLogin);
router.patch("/change-username", verifyUser, AuthControllers.changeUsername);
router.patch("/change-email", verifyUser, AuthControllers.changeEmail);
router.patch("/change-password", verifyUser, AuthControllers.changePassword);
router.patch("/change-phone", verifyUser, AuthControllers.changePhone);
router.post("/forgot-password", AuthControllers.forgotPassword);
router.post("/reset-password", AuthControllers.verify.resetPassword);
router.delete("/account", verifyUser, AuthControllers.deleteAccount);

export default router;
