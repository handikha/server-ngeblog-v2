import db from "../database/index.js";
import { Blog } from "./blog.js";
import { User } from "./user.js";

export const Like = db.sequelize.define(
  "likes",
  {
    id: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    blogId: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
    },
    userId: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

// Define associations
Like.belongsTo(User, { foreignKey: "userId" });
Like.belongsTo(Blog, { foreignKey: "blogId" });
User.hasMany(Like, { foreignKey: "userId" });
Blog.hasMany(Like, { foreignKey: "blogId" });
