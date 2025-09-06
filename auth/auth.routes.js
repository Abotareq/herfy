import express from "express";
import passport from "passport";
import {
  signIn,
  signUp,
  signOut,
  googleCallback,
  verifyToken,
  AdminsignIn
} from "./auth.controller.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/admin/signin", AdminsignIn);
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
  (req, res, next) => {
    console.log("Callback request received:", req.query);
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/signin`,
    })(req, res, next);
  },
  googleCallback
);
export default router;
