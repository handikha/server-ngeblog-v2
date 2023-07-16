import { Blog } from "../../models/blog.js";
import { Like } from "../../models/like.js";
import { Save } from "../../models/save.js";
import { Profile, User } from "../../models/user.profile.js";
import { ValidationError } from "yup";
import { BlogValidationSchema } from "./validation.js";
import { BAD_REQUEST_STATUS } from "../../middlewares/error.handler.js";
import db from "../../database/index.js";
import { Category } from "../../models/category.js";
import cloudinary from "cloudinary";
import { getCloudinaryImageName } from "../../utils/index.js";

export const getBlogs = async (req, res, next) => {
  try {
    const { page, limit, category_id } = req.query;

    const options = {
      offset: page > 1 ? (page - 1) * limit : 0,
      limit: limit ? parseInt(limit) : 10,
    };

    // @get total tickets
    const total = category_id
      ? await Blog?.count({ where: { categoryId: category_id } })
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
              WHERE likes.blogId = blogs.id
            )`),
            "totalLikes",
          ],
        ],
      },
      include: [
        {
          model: User,
          attributes: ["username"],
          include: {
            model: Profile,
            attributes: ["profileImg"],
          },
        },
      ],
      where: category_id ? { categoryId: category_id } : {},
    };

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

export const getPopularBlogs = async (req, res, next) => {
  try {
    const { category_id } = req.query;

    const queryOptions = {
      attributes: {
        include: [
          [
            db.Sequelize.fn("COUNT", db.Sequelize.col("likes.id")),
            "totalLikes",
          ],
        ],
      },
      include: [
        {
          model: Like,
          as: "likes",
          attributes: [],
        },
      ],
      group: ["blogs.id"],
      order: [["totalLikes", "DESC"]],
      where: category_id ? { categoryId: category_id } : {},
    };

    const blogs = await Blog.findAll(queryOptions);

    res.status(200).json({
      type: "success",
      message: "Popular blogs fetched",
      blogs,
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
      throw { status: BAD_REQUEST_STATUS, message: "Blog not found" };
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

// @get liked blogs
export const getLikedBlogs = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const likedBlogs = await Blog.findAll({
      attributes: ["id"],
      include: [
        {
          model: Like,
          where: { userId },
          attributes: [],
        },
      ],
    });

    res.status(200).json({ type: "success", likedBlogs });

    // const blogsId = likedBlogs.map((blog) => blog.id);
    // res.status(200).json({ type: "success", likedBlogs: blogsId });
  } catch (error) {
    next(error);
  }
};

// @save/unsave blog
export const toggleSaveBlog = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const userId = req.user?.id;

    // Check if the blog exists
    const blog = await Blog.findOne({ where: { id: blogId } });
    if (!blog) {
      throw { status: BAD_REQUEST_STATUS, message: "Blog not found" };
    }

    // Check if the like record exists
    const isSaved = await Save.findOne({
      where: { blogId, userId },
    });

    if (isSaved) {
      // unlike blog
      await isSaved.destroy();
      res.status(200).json({ type: "success", message: "Blog unsaved" });
    } else {
      // like blog
      const save = await Save.create({
        blogId,
        userId,
      });
      res.status(200).json({ type: "success", message: "Blog saved", save });
    }
  } catch (error) {
    next(error);
  }
};

// @get saved blogs
export const getSavedBlogs = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const savedBlogs = await Blog.findAll({
      attributes: ["id"],
      include: [
        {
          model: Save,
          where: { userId },
          attributes: [],
        },
      ],
    });

    res.status(200).json({ type: "success", savedBlogs });

    // const blogsId = likedBlogs.map((blog) => blog.id);
    // res.status(200).json({ type: "success", likedBlogs: blogsId });
  } catch (error) {
    next(error);
  }
};

// @get categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json({ type: "success", categories });
  } catch (error) {
    next(error);
  }
};

// @archive blog
export const archiveBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const blog = await Blog.findOne({ where: { id, userId } });
    if (!blog) {
      throw { status: BAD_REQUEST_STATUS, message: "Blog not found" };
    }

    await blog.update({ status: 0 });

    res.status(200).json({ type: "success", message: "Blog archived", blog });
  } catch (error) {
    next(error);
  }
};

// @publish blog
export const publishBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const blog = await Blog.findOne({ where: { id, userId } });
    if (!blog) {
      throw { status: BAD_REQUEST_STATUS, message: "Blog not found" };
    }

    await blog.update({ status: 1 });

    res.status(200).json({ type: "success", message: "Blog published", blog });
  } catch (error) {
    next(error);
  }
};

// @delete blog
export const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const blog = await Blog.findOne({ where: { id, userId } });

    if (!blog) {
      throw { status: BAD_REQUEST_STATUS, message: "Blog not found" };
    }

    const blogImg = getCloudinaryImageName(blog.blogImg);

    await blog.update({ status: 2, blogImg: "" });

    await cloudinary.v2.api.delete_resources([`${blogImg}`], {
      type: "upload",
      resource_type: "image",
    });

    res.status(200).json({ type: "success", message: "Blog deleted", blog });
  } catch (error) {
    next(error);
  }
};

// @get profile image
export const getBlogImg = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findOne({ where: { id } });

    if (!blog) {
      throw { status: 400, message: "Blog Not Found" };
    }

    res.status(200).json(blog.blogImg);
  } catch (error) {
    next(error);
  }
};
