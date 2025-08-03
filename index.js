//*------------------------------------env config first------------------------------------*//
import dotenv from "dotenv";
dotenv.config();
//2na 3amel el 7agat de bla4 7naka w 7d y2ol ai comments w kda
//*------------------------------------importing modules------------------------------------*//
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./auth/google.passport.js";

// multer
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./auth/auth.routes.js";
import { connecToDb, closeDbConnection } from "./utils/dbConnecion.js";
import errorHandler from "./middlewares/error-handler.js";

import productRoute from "./routes/product.route.js";
import storeRoute from "./routes/store.route.js";

import categoryRouter from "./routes/category.route.js";
import userRouter from "./routes/user.route.js";
import orderRoute from "./routes/order.route.js";
import paymentRoute from "./routes/payment.route.js"

import cartRoute from "./routes/cart.route.js"
import couponRouter from "./routes/cupon.route.js";
import reviewRouter from "./routes/review.route.js";

//*------------------------------------app setup------------------------------------*//
const app = express();
const PORT = process.env.PORT || 3000;

//*------------------------------------middlewares------------------------------------*//
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, //
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  })
);
app.use(passport.initialize());
// For ES modules: define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploades", express.static(path.join(__dirname, "uploades")));
//*------------------------------------routes------------------------------------*/
app.use("/api/auth", authRoutes);
// Example:
// import routes from "./routes/index.js";
// app.use("/api", routes);

// product Route 

app.use("/api/store",storeRoute);
// user Route
app.use('/api/users', userRouter)
app.use('/api/category', categoryRouter)
app.use("/api/order",orderRoute);
app.use("/api/payment",paymentRoute);
app.use("/api/cart",cartRoute);
app.use("/api/coupon", couponRouter);
app.use('/api/review', reviewRouter)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads/Category')))
// means that uploads/Category is a static folder
app.use("/api/product",productRoute)

// user Route


//*------------------------------------error handler (last)------------------------------------*//
app.use(errorHandler);

//*------------------------------------db + server start------------------------------------*//
connecToDb();

// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on http://localhost:${PORT}`);
// });

//*------------------------------------host server ------------------------------------*//   osama saad
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});

//*------------------------------------graceful shutdown------------------------------------*/
process.on("SIGINT", async () => {
  await closeDbConnection();
  console.log("🔌 Server shutdown gracefully");
  process.exit(0);
});


// test refaat
//test osama and refaat 