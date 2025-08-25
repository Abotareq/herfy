import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("GoogleStrategy profile:", profile);
      try {
        // Normalize email to avoid case-sensitivity issues
        const email = profile.emails[0].value.toLowerCase();

        // Check for existing user by googleId or email
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user) {
          // If user exists but googleId is missing, link Google account
          if (!user.googleId) {
            console.log("Linking Google account to existing email:", email);
            user.googleId = profile.id;
            user.userName = user.userName || profile.displayName;
            user.firstName = user.firstName || profile.name.givenName;
            user.lastName = user.lastName || profile.name.familyName;
            await user.save();
          }
          console.log("Found user:", user);
          return done(null, user);
        }

        // Create new user
        console.log("Creating new user for Google ID:", profile.id);
        user = await User.create({
          googleId: profile.id,
          userName: profile.displayName,
          email,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
        });
        console.log("Created user:", user);
        done(null, user);
      } catch (error) {
        console.error("GoogleStrategy error:", error.message);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log("Deserialized user:", user);
    done(null, user);
  } catch (error) {
    console.error("Deserialize error:", error.message);
    done(error, null);
  }
});
