import db from "../database/index.js";
import { Category } from "./category.js";
import { User } from "./user.js";

export const Blog = db.sequelize.define("blogs", {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  userId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
  },
  title: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  content: {
    type: db.Sequelize.TEXT,
    allowNull: false,
  },
  categoryId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
  },
  status: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  blogImg: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
  },
});

// Define associations
Blog.belongsTo(User, { foreignKey: "userId" });
Blog.belongsTo(Category, { foreignKey: "categoryId" });
