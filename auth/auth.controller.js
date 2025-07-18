import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "./auth.utils.js";
import StatusCodes from "../utils/status.codes.js";
import ErrorResponse from "../utils/error-model.js";
export const signUp = async (req, res, next) => {
  try {
    const { userName, firstName, lastName, email, phone, password } = req.body;

    if (!userName || !email || !password || !phone || !firstName || !lastName) {
      return next(
        new ErrorResponse(
          "User name, full name, email, phone, and password are required",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    const existingUser = await User.findOne({
      $or: [{ userName }, { email }, { phone }],
    });

    if (existingUser) {
      return next(
        new ErrorResponse(
          "A user with this user name, email or phone number already exists.",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    
    const user = await User.create(req.body);

    const token = generateToken(user);
    const { password: _, ...safeUser } = user.toObject();

    return res
      .cookie("access_token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .status(StatusCodes.CREATED)
      .json({ user: safeUser });
  } catch (err) {
    return next(new ErrorResponse(err.message, StatusCodes.INTERNAL_SERVER));
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse("User not found", StatusCodes.NOT_FOUND));
    }

    if (!user.password) {
      return next(
        new ErrorResponse(
          "This account uses Google sign-in",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(
        new ErrorResponse("Wrong credentials", StatusCodes.UNAUTHORIZED)
      );
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user.toObject();

    return res
      .cookie("access_token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .status(StatusCodes.OK)
      .json({ user: safeUser });
  } catch (err) {
    return next(new ErrorResponse(err.message, StatusCodes.INTERNAL_SERVER));
  }
};

export const signOut = async (req, res, next) => {
  try {
    res.clearCookie("access_token").status(StatusCodes.OK).json({
      message: "Logged out successfully",
    });
  } catch (err) {
    return next(new ErrorResponse("Sign out failed", StatusCodes.SERVER_ERROR));
  }
};

export const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    const token = generateToken(user);
    const { password: _, ...safeUser } = user.toObject();

    res
      .cookie("access_token", token, {
        httpOnly: true,
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .status(StatusCodes.OK)
      .json({ user: safeUser });
  } catch (err) {
    return next(
      new ErrorResponse("Google login failed", StatusCodes.INTERNAL_SERVER)
    );
  }
};
