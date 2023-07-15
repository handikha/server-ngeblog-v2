import db from "../database/index.js";
import { Blog } from "./blog.js";
import { User } from "./user.js";

export const Save = db.sequelize.define("saves", {
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
Save.belongsTo(User, { foreignKey: "userId" });
Save.belongsTo(Blog, { foreignKey: "postId" });
