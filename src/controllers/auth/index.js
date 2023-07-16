import { ValidationError } from "yup";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import moment from "moment";

import * as config from "../../config/index.js";
import * as helpers from "../../helpers/index.js";
import * as error from "../../middlewares/error.handler.js";
import { User, Profile } from "../../models/user.profile.js";
import * as validation from "./validation.js";
import db from "../../database/index.js";

export const register = async (req, res, next) => {
  try {
    // @validation
    const { username, email, phone, password } = req.body;
    await validation.RegisterValidationSchema.validate(req.body);

    // @check if user already exists
    const userExists = await User.findOne({ where: { username } });
    if (userExists) throw { status: 400, message: error.USER_ALREADY_EXISTS };

    // @check if email already exists
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) throw { status: 400, message: error.EMAIL_ALREADY_EXISTS };

    // @encrypt password
    const hashedPassword = helpers.hashPassword(password);

    // @generate otp
    const otpToken = helpers.generateOtp();
    const expiredOtp = moment.utc().add(1, "days").format();

    // @archive user data
    const saveUser = await User?.create({
      username,
      email,
      phone,
      password: hashedPassword,
      otp: otpToken,
      expiredOtp,
    });

    // @create profile
    await Profile.create({ userId: saveUser?.dataValues?.id });

    // @generate access token
    const accessToken = helpers.createToken({
      id: saveUser?.dataValues?.id,
      uuid: saveUser?.dataValues?.uuid,
      role: saveUser?.dataValues?.role,
    });

    // @join User and Profile to get the user with profile data
    const user = await User.findOne({
      where: { id: saveUser?.dataValues?.id },
      include: Profile,
    });

    // @delete unused data from response
    delete user?.dataValues?.password;
    delete user?.dataValues?.otp;
    delete user?.dataValues?.expiredOtp;

    // @send response
    res.header("Authorization", `Bearer ${accessToken}`).status(200).json({
      message: "User created successfully",
      user,
    });

    // @generate email message
    const template = fs.readFileSync(
      path.join(process.cwd(), "templates", "index.html"),
      "utf8"
    );
    const message = handlebars.compile(template)({
      action: "registration",
      expiredOtp: moment.utc(expiredOtp).local().format("YYYY-MM-DD HH:mm:ss"),
      otpToken,
      link:
        config.REDIRECT_URL + `/auth/verify/verify-${user?.dataValues?.uuid}`,
    });

    //@send verification email
    const mailOptions = {
      from: config.GMAIL,
      to: email,
      subject: "[Ngeblog] Please verify your account",
      html: message,
    };
    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log("Email sent: " + info.response);
    });
  } catch (error) {
    // @check if error from validation
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

// @login process
export const login = async (req, res, next) => {
  try {
    // @validation, we assume that username will hold either username or email
    const { username, password } = req.body;
    await validation.LoginValidationSchema.validate(req.body);

    // @check if username is email
    const isAnEmail = await validation.IsEmail(username);
    const query = isAnEmail ? { email: username } : { username };

    // @check if user exists include profile
    const userExists = await User?.findOne({ where: query, include: Profile });
    if (!userExists) throw { status: 400, message: error.USER_DOES_NOT_EXISTS };

    // @check if user status is un-verified (1), verified (2), deleted (3)
    if (userExists?.dataValues?.status === 3)
      throw { status: 400, message: error.USER_DOES_NOT_EXISTS };

    // @check if password is correct
    const isPasswordCorrect = helpers.comparePassword(
      password,
      userExists?.dataValues?.password
    );
    // console.log(isPasswordCorrect);
    if (!isPasswordCorrect)
      throw { status: 400, message: error.INVALID_CREDENTIALS };

    // @generate access token
    const accessToken = helpers.createToken({
      id: userExists?.dataValues?.id,
      uuid: userExists?.dataValues?.uuid,
      role: userExists?.dataValues?.role,
    });

    // @delete password from response
    delete userExists?.dataValues?.password;
    delete userExists?.dataValues?.otp;
    delete userExists?.dataValues?.expiredOtp;

    // @return response
    res
      .header("Authorization", `Bearer ${accessToken}`)
      .status(200)
      .json({ user: userExists });
  } catch (error) {
    // @check if error from validation
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

// @keeplogin
export const keepLogin = async (req, res, next) => {
  try {
    // @get user id from token
    const { uuid } = req.user;
    console.log(uuid);
    // @get user data
    const user = await User?.findOne({ where: { uuid }, include: Profile });

    // @delete password from response
    delete user?.dataValues?.password;
    delete user?.dataValues?.otp;
    delete user?.dataValues?.expiredOtp;

    // @return response
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (uuid, token) => {
  const user = await User?.findOne({ where: { uuid: uuid } });
  if (!user) throw { status: 400, message: error.USER_DOES_NOT_EXISTS };

  if (token !== user?.dataValues?.otp)
    throw { status: 400, message: error.INVALID_CREDENTIALS };

  const isExpired = moment().isAfter(user?.dataValues?.expiredOtp);
  if (isExpired) throw { status: 400, message: "Token Expired" };

  return user;
};

export const verify = {
  verifyAccount: async (req, res, next) => {
    try {
      const { uuid, token } = req.body;
      const userId = uuid.split("-").slice(1).join("-");
      const context = uuid.split("-")[0];

      const user = await verifyOTP(userId, token);

      // @verify
      if (user && context === "verify") {
        // @update user status
        await User?.update(
          { status: 1, otp: null, expiredOtp: null },
          { where: { uuid: userId } }
        );

        // @return response
        res
          .status(200)
          .json({ message: "Account verified successfully", data: uuid });
      }
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { uuid, token } = req.body;
      const userId = uuid.split("-").slice(1).join("-");
      const context = uuid.split("-")[0];
      const user = await verifyOTP(userId, token);

      // @verify: reset password
      if (user && context === "resetPassword") {
        const { newPassword } = req.body;
        await validation.ResetPasswordValidationSchema.validate(req.body);

        // @encrypt password
        const hashedPassword = helpers.hashPassword(newPassword);

        // @update user status
        await User?.update(
          { password: hashedPassword, otp: null, expiredOtp: null },
          { where: { uuid: userId } }
        );

        // @return response
        res
          .status(200)
          .json({ message: "Password changed successfully", data: uuid });
      }
    } catch (error) {
      next(error);
    }
  },
};

// @request otp token
export const requestOtp = async (req, res, next) => {
  try {
    // @get user email, context from body (reg or reset)
    const { email } = req.body;

    // @check if user exists
    const user = await User?.findOne({ where: { email } });
    if (user.status === 1)
      throw { status: 400, message: "Your account has been verified" };
    if (!user) throw { status: 400, message: error.USER_DOES_NOT_EXISTS };

    // @generate otp
    const otpToken = helpers.generateOtp();
    const expiredOtp = moment.utc().add(1, "days").format();

    // @update user otp token
    await User?.update(
      {
        otp: otpToken,
        expiredOtp,
      },
      { where: { email } }
    );

    // @generate email message
    const template = fs.readFileSync(
      path.join(process.cwd(), "templates", "index.html"),
      "utf8"
    );

    const message = handlebars.compile(template)({
      action: "registration",
      expiredOtp: moment.utc(expiredOtp).local().format("YYYY-MM-DD HH:mm:ss"),
      otpToken,
      link:
        config.REDIRECT_URL + `/auth/verify/verify-${user?.dataValues?.uuid}`,
    });

    //@send verification email
    const mailOptions = {
      from: config.GMAIL,
      to: email,
      subject: "[Ngeblog] Please verify your account",
      html: message,
    };

    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log("Email sent: " + mailOptions.subject + info.response);
    });

    // @return response
    res.status(200).json({ message: "Otp token requested successfully" });
  } catch (error) {
    next(error);
  }
};

// @change username
export const changeUsername = async (req, res, next) => {
  try {
    const user = await User?.findOne({ where: { id: req.user.id } });

    if (user.status === 0)
      throw { status: 400, message: error.USER_NOT_VERIFIED };

    const { username, password } = req.body;
    await validation.ChangeUsernameValidationSchema.validate(req.body);

    // @check if password is correct
    const isPasswordCorrect = helpers.comparePassword(
      password,
      user?.dataValues?.password
    );
    // console.log(isPasswordCorrect);
    if (!isPasswordCorrect)
      throw { status: 400, message: error.INVALID_CREDENTIALS };

    // Check if the new username is different from the current username
    if (user.username !== username) {
      // Check if the new username is already taken
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        throw { status: 400, message: "Username is already taken" };
      }
      // Update the username
      await User.update({ username }, { where: { id: req.user.id } });
    } else {
      throw { status: 400, message: "Please insert new username" };
    }

    // @return response
    res.status(200).json({ message: "Username changed successfully" });
  } catch (error) {
    next(error);
  }
};

export const changeEmail = async (req, res, next) => {
  try {
    const user = await User?.findOne({ where: { id: req.user.id } });

    if (user.status === 0)
      throw { status: 400, message: error.USER_NOT_VERIFIED };

    const { email } = req.body;
    await validation.EmailValidationSchema.validate(req.body);

    // Check if the new username is different from the current username
    if (user.email !== email) {
      // Check if the new username is already taken
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw { status: 400, message: "Email is already taken" };
      }
      // @generate otp
      const otpToken = helpers.generateOtp();
      const expiredOtp = moment.utc().add(1, "days").format();

      // Update the username
      await User.update(
        { email, status: 0, otp: otpToken, expiredOtp },
        { where: { id: req.user.id } }
      );

      // @generate email message
      const template = fs.readFileSync(
        path.join(process.cwd(), "templates", "index.html"),
        "utf8"
      );
      const message = handlebars.compile(template)({
        action: "registration",
        expiredOtp: moment
          .utc(expiredOtp)
          .local()
          .format("YYYY-MM-DD HH:mm:ss"),
        otpToken,
        link:
          config.REDIRECT_URL + `/auth/verify/verify-${user?.dataValues?.uuid}`,
      });

      //@send verification email
      const mailOptions = {
        from: config.GMAIL,
        to: email,
        subject: "[Ngeblog] Please verify your account",
        html: message,
      };
      helpers.transporter.sendMail(mailOptions, (error, info) => {
        if (error) throw error;
        console.log("Email sent: " + info.response);
      });
    } else {
      throw { status: 400, message: "Please input new email" };
    }

    // @return response
    res.status(200).json({ message: "Email changed successfully" });
  } catch (error) {
    next(error);
  }
};

// @change phone
export const changePhone = async (req, res, next) => {
  try {
    const user = await User?.findOne({ where: { uuid: req.user.uuid } });
    console.log(user);

    if (user.status === 0)
      throw { status: 400, message: error.USER_NOT_VERIFIED };

    const { phone } = req.body;
    await validation.ChangePhoneValidationSchema.validate(req.body);

    await User.update({ phone }, { where: { uuid: req.user.uuid } });

    // @return response
    res.status(200).json({ message: "Phone changed successfully" });
  } catch (error) {
    next(error);
  }
};

// @change password
export const changePassword = async (req, res, next) => {
  try {
    const user = await User?.findOne({ where: { uuid: req.user.uuid } });

    if (user.status === 0)
      throw { status: 400, message: error.USER_NOT_VERIFIED };

    const { currentPassword, newPassword, confirmPassword } = req.body;
    await validation.ChangePasswordValidationSchema.validate(req.body);

    // @check if password is correct
    const isPasswordCorrect = helpers.comparePassword(
      currentPassword,
      user?.dataValues?.password
    );
    if (!isPasswordCorrect) throw { status: 400, message: "Invalid Password" };

    await User?.update(
      { password: helpers.hashPassword(newPassword) },
      { where: { uuid: req.user.uuid } }
    );

    // @return response
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

// @forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await validation.EmailValidationSchema.validate(req.body);

    const user = await User?.findOne({ where: { email } });
    console.log(user);

    if (!user) throw { status: 400, message: error.EMAIL_DOES_NOT_EXISTS };

    // @generate otp
    const otpToken = helpers.generateOtp();
    const expiredOtp = moment.utc().add(1, "days").format();

    await User.update({ otp: otpToken, expiredOtp }, { where: { email } });

    // @generate email message
    const template = fs.readFileSync(
      path.join(process.cwd(), "templates", "index.html"),
      "utf8"
    );

    const message = handlebars.compile(template)({
      action: "reset password",
      expiredOtp: moment.utc(expiredOtp).local().format("YYYY-MM-DD HH:mm:ss"),
      otpToken,
      link:
        config.REDIRECT_URL +
        `/auth/verify/resetPassword-${user?.dataValues?.uuid}`,
    });

    //@send verification email
    const mailOptions = {
      from: config.GMAIL,
      to: email,
      subject: "[Ngeblog] Please verify your account",
      html: message,
    };

    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log("Email sent: " + info.response);
    });

    // @return response
    res.status(200).json({
      message:
        "Reset password successfully! Please check your email to reset your password",
    });
  } catch (error) {
    next(error);
  }
};

// @delete account : soft delete
export const deleteAccount = async (req, res, next) => {
  try {
    // @get user id from token
    const { uuid } = req.user;
    const user = await User.findOne({ where: { uuid } });

    // @delete user
    await user?.update({ status: 2 }, { where: { uuid } });

    // @return response
    res
      .status(200)
      .json({ message: "Account deleted successfully", data: user });
  } catch (error) {
    next(error);
  }
};
