import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "./auth.utils.js";
export const signUp = async (req, res) => {
  try {
    const { userName, firstName, lastName, email, phone, password } = req.body;

    // Validate required fields
    if (!userName || !email || !password || !phone || !firstName || !lastName) {
      return res
        .status(400)
        .json({
          error:
            "user name, full name ,email, phone, and password are required",
        });
    }

    const existingUser = await User.findOne({
      $or: [{ userName },{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "A user with this user name, email or phone number already exists.",
      });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...req.body,
      password: hashedPassword,
    });

    const token = generateToken(user);
    const { password: _, ...safeUser } = user.toObject();

    // Return token in cookie and user object
    return res
      .cookie("access_token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .status(201)
      .json({ user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Wrong credentials" });

    const token = generateToken(user);
    const { password: _, ...safeUser } = user.toObject();

    return res
      .cookie("access_token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .status(200)
      .json({ user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const signOut = async (req, res) => {
  return res.clearCookie("access_token").status(200).json({
    message: "Logged out successfully",
  });
};
