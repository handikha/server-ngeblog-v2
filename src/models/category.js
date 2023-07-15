import db from "../database/index.js";

export const Category = db.sequelize.define(
  "categories",
  {
    id: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    category: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);
