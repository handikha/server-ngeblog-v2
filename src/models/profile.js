import db from "../database/index.js";

// @profile
export const Profile = db.sequelize.define(
  "profiles",
  {
    id: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
    },
    fullName: {
      type: db.Sequelize.STRING,
    },
    bio: {
      type: db.Sequelize.STRING,
    },
    profileImg: {
      type: db.Sequelize.STRING,
    },
  },
  {
    timestamps: false,
  }
);
