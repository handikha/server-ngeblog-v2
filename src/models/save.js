import db from "../database/index.js";
import { Blog } from "./blog.js";
import { User } from "./user.js";

export const Save = db.sequelize.define(
  "saves",
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
Save.belongsTo(User, { foreignKey: "userId" });
Save.belongsTo(Blog, { foreignKey: "blogId" });
User.hasMany(Save, { foreignKey: "userId" });
Blog.hasMany(Save, { foreignKey: "blogId" });
