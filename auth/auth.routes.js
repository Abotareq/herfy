import express from "express";
import passport from "passport";
import {
  signIn,
  signUp,
  signOut,
  googleCallback,
  verifyToken,
} from "./auth.controller.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);

router.get("/status", verifyToken, (req, res) => {
  res.status(200).json({
    loggedIn: true,
    user: req.user, // Optional: return user info
  });
});
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/signin",
  }),
  googleCallback
);

export default router;
