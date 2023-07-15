import { Profile, User } from "../../models/user.profile.js";
import * as error from "../../middlewares/error.handler.js";

// @upload image
export const uploadImage = async (req, res, next) => {
  try {
    const user = await User?.findOne({ where: { id: req.user.id } });

    if (user.status === 0)
      throw { status: 400, message: error.USER_NOT_VERIFIED };

    // @check if image is uploaded
    if (!req.file) {
      throw new { status: 400, message: "Please upload an image." }();
    }

    // console.log(req.file);

    // @TODO: delete the old image

    // @update the user profile
    await Profile?.update(
      { profileImg: req?.file?.path },
      { where: { id: req.user.id } }
    );

    // @send response
    res.status(200).json({
      message: "Image uploaded successfully.",
      imageUrl: req.file?.path,
    });
  } catch (error) {
    next(error);
  }
};

// @get user profile
export const getProfile = async (req, res, next) => {
  try {
    // @get the user profile
    const profile = await Profile.findOne({ where: { id: req.user.id } });

    // @send response
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};

// @update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User?.findOne({ where: { id: req.user.id } });

    if (user.status === 0)
      throw { status: 400, message: error.USER_NOT_VERIFIED };

    // @update user profile
    await Profile.update(
      { fullName: req?.body?.fullName, bio: req?.body?.bio },
      { where: { id: req.user?.id } }
    );

    // @send response
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    next(error);
  }
};
