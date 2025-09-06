import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "./auth.utils.js";
import StatusCodes from "../utils/status.codes.js";
import ErrorResponse from "../utils/error-model.js";
import jwt from "jsonwebtoken";

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
export const AdminsignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse("User not found", StatusCodes.NOT_FOUND));
    }
    if (user.role !== "ADMIN") {
      return next(
        new ErrorResponse("Not authorized as an admin", StatusCodes.FORBIDDEN)
      );
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
export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      return next(
        new ErrorResponse(
          "Authentication token missing",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // Attach decoded user info
    next();
  } catch (err) {
    return next(
      new ErrorResponse("Invalid or expired token", StatusCodes.UNAUTHORIZED)
    );
  }
};

export const signOut = async (req, res, next) => {
  try {
    req.user = null;
    res.clearCookie("access_token").status(StatusCodes.OK).json({
      message: "Logged out successfully",
    });
  } catch (err) {
    return next(new ErrorResponse("Sign out failed", StatusCodes.SERVER_ERROR));
  }
};

export const googleCallback = async (req, res, next) => {
  console.log("googleCallback triggered, req.user:", req.user);
  try {
    if (!req.user) {
      console.error("No user provided by Passport");
      return res.redirect(`${process.env.CLIENT_URL}/signin?error=no_user`);
    }

    const user = req.user;
    const token = generateToken(user);
    const { password: _, ...safeUser } = user.toObject();

    console.log("Setting cookie and redirecting for user:", safeUser);
    res
      .cookie("access_token", token, {
        httpOnly: true,
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .redirect(`${process.env.CLIENT_URL}`);
  } catch (err) {
    console.error("Google callback error:", err.message);
    res.redirect(
      `${process.env.CLIENT_URL}/signin?error=${encodeURIComponent(
        err.message
      )}`
    );
  }
};
