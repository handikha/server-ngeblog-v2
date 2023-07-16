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
router.get("/popular-blogs", BlogController.getPopularBlogs);
router.get("/categories", BlogController.getCategories);
router.get("/liked-blogs", verifyUser, BlogController.getLikedBlogs);
router.post("/like/:blogId", verifyUser, BlogController.toggleLikeBlog);
router.get("/saved-blogs", verifyUser, BlogController.getSavedBlogs);
router.post("/save/:blogId", verifyUser, BlogController.toggleSaveBlog);
router.patch("/archive/:id", verifyUser, BlogController.archiveBlog);
router.patch("/publish/:id", verifyUser, BlogController.publishBlog);
router.patch("/delete/:id", verifyUser, BlogController.deleteBlog);
router.get("/view-blog-image/:id", BlogController.getBlogImg);

export default router;

