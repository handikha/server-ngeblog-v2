import { Blog } from "../../models/blog.js";
import { Like } from "../../models/like.js";
import { Save } from "../../models/save.js";
import { ValidationError } from "yup";
import { BlogValidationSchema } from "./validation.js";
import { BAD_REQUEST } from "../../middlewares/error.handler.js";
import db from "../../database/index.js";

export const getBlogs = async (req, res, next) => {
  try {
    const { page, limit, categoryId } = req.query;
    console.log(categoryId);

    const options = {
      offset: page > 1 ? (page - 1) * limit : 0,
      limit: limit ? parseInt(limit) : 10,
    };

    // @get total tickets
    const total = categoryId
      ? await Blog?.count({ where: { categoryId } })
      : await Blog.count();

    // @get total pages
    const pages = Math.ceil(total / options.limit);

    const queryOptions = {
      attributes: {
        include: [
          [
            db.Sequelize.literal(`(
              SELECT COUNT(*)
              FROM likes
              WHERE likes.postId = blogs.id
            )`),
            "totalLikes",
          ],
        ],
      },
    };

    if (categoryId) {
      queryOptions.where = { categoryId };
    }

    const blogs = await Blog.findAll({ ...queryOptions, ...options });

    res.status(200).json({
      type: "success",
      message: "Blogs fetched",
      total_elements: total,
      blog_per_page: +limit,
      current_page: +page,
      next_page: page < pages ? parseInt(page) + 1 : null,
      total_pages: pages,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// @create blog
export const createBlog = async (req, res, next) => {
  try {
    const { data } = req.body;
    const body = JSON.parse(data);
    const { title, content, categoryId } = body;

    // @validate request body
    await BlogValidationSchema.validate(body);

    // @archive blog's data
    const blog = await Blog?.create({
      userId: req.user?.id,
      title,
      content,
      categoryId,
      blogImg: req?.file?.path,
    });

    // @send response
    res
      .status(201)
      .json({ type: "success", message: "Blog created", data: blog });
  } catch (error) {
    // @check if error from validation
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

// @like/unlike blog
export const toggleLikeBlog = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const userId = req.user?.id;

    // Check if the blog exists
    const blog = await Blog.findOne({ where: { id: blogId } });
    if (!blog) {
      throw { status: BAD_REQUEST, message: "Blog not found" };
    }

    // Check if the like record exists
    const isLiked = await Like.findOne({
      where: { blogId, userId },
    });

    if (isLiked) {
      // unlike blog
      await isLiked.destroy();
      res.status(200).json({ type: "success", message: "Blog unliked" });
    } else {
      // like blog
      const like = await Like.create({
        blogId,
        userId,
      });
      res.status(200).json({ type: "success", message: "Blog liked", like });
    }
  } catch (error) {
    next(error);
  }
};


// @save blog
export const saveBlog = async (req, res, next) => {
  try {
    const { blogId } = req.params;

    // Check if the blog exists
    const blog = await Blog.findOne({ where: { id: blogId } });
    if (!blog) {
      throw { status: BAD_REQUEST, message: "Blog not found" };
    }

    // Check if the save record already exists
    const existingSave = await Save.findOne({
      where: { blogId, userId: req.user?.id },
    });

    if (existingSave) {
      throw { status: BAD_REQUEST, message: "You already saved this blog" };
    }

    // Create the save record
    const save = await Save.create({
      blogId,
      userId: req.user?.id,
    });

    res.status(200).json({ type: "success", message: "Blog saved", save });
  } catch (error) {
    next(error);
  }
};

// @unsave blog
export const unsaveBlog = async (req, res, next) => {
  try {
    const { blogId } = req.params;

    // Check if the blog exists
    const blog = await Blog.findOne({ where: { id: blogId } });
    if (!blog) {
      throw { status: BAD_REQUEST, message: "Blog not found" };
    }

    // Check if the save record exists
    const save = await Save.findOne({
      where: { blogId, userId: req.user?.id },
    });

    if (!save) {
      throw { status: BAD_REQUEST, message: "You have not saved this blog" };
    }

    // Delete the save record
    await save.destroy();

    res.status(200).json({ type: "success", message: "Blog unsaved" });
  } catch (error) {
    next(error);
  }
};
