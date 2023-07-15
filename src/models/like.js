import db from "../database/index.js";
import { Blog } from "./blog.js";
import { User } from "./user.js";

export const Like = db.sequelize.define("likes", {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  postId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
  },
  userId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
  },
});

// Define associations
Like.belongsTo(User, { foreignKey: "userId" });
Like.belongsTo(Blog, { foreignKey: "postId" });
Blog.hasMany(Like, { foreignKey: "blogId" });
