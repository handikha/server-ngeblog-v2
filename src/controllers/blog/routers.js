import { Router } from "express";
import {
  createUploader,
  createCloudinaryStorage,
} from "../../helpers/uploader.js";
import { verifyUser } from "../../middlewares/index.js";
import * as BlogController from "./index.js";

const router = Router();

// @setup uploader
const storage = createCloudinaryStorage("blogs");
const uploader = createUploader(storage);

router.get("/", BlogController.getBlogs);
router.post(
  "/",
  verifyUser,
  uploader.single("data"),
  BlogController.createBlog
);
router.post("/like/:blogId", verifyUser, BlogController.toggleLikeBlog);

export default router;

// TODO CREATE LIKE BLOG FEATURE
