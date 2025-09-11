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
import paymentRoute from "./routes/payment.route.js";

import cartRoute from "./routes/cart.route.js";
import couponRouter from "./routes/cupon.route.js";
import reviewRouter from "./routes/review.route.js";

// rag import
import ragHandler from "./rag/rag.js";
import { addDocument } from "./rag/vectorStore.js";
import getEmbedding from "./rag/embed.js";
import Product from "./models/productModel.js";
import User from "./models/userModel.js";
import Cart from "./models/cartModel.js";
import Order from "./models/orderModel.js";
import Payment from "./models/paymentModel.js";
import Coupon from "./models/cuponModel.js";
import Store from "./models/storeModel.js";
import Category from "./models/categoryModel.js";
import Review from "./models/reviewModel.js";
import paymentService from "./services/payment.service.js";
import bodyParser from "body-parser";
import Stripe from "stripe";
import sendReminderEmail from "./utils/email.notifications.js";

//*------------------------------------app setup------------------------------------*//
const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);
//*------------------------------------middlewares------------------------------------*//
app.use(helmet());
// Allow requests if origin is in the list or if request has no origin (like Postman)
const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:3001",
  "http://localhost:3000",
  process.env.CLIENT_URL, // from .env -> production frontend URL
  process.env.ADMIN_URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // allow cookies
  })
);
// app.post(
//   "/api/webhook",
//   bodyParser.raw({ type: "application/json" }), // raw body is required for Stripe
//   async (req, res) => {
//     const sig = req.headers["stripe-signature"];
//     let event;

//     try {
//       // Verify that the event is actually from Stripe
//       event = Stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//     } catch (err) {
//       console.error("Webhook signature verification failed:", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     try {
//       // Handle the Stripe event
//       await paymentService.handleStripeWebhook(event);
//       res.json({ received: true });
//     } catch (err) {
//       console.error("Webhook handling failed:", err);
//       res.status(500).send("Webhook handler error");
//     }
//   }
// );
// Webhook endpoint
app.post(
  "/api/webhook",
  bodyParser.raw({ type: "application/json" }), // Stripe requires raw body
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Verify Stripe signature
      event = Stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle the Stripe event
      await paymentService.handleStripeWebhook(event);

      // Example: Send email on successful payment
      if (event.type === "payment_intent.succeeded" || event.type === "checkout.session.completed") {
        const paymentData = event.data.object;
        // Call Resend email function
        // Extract user email from payment data
        const userEmail = paymentData.receipt_email || paymentData.customer_email;
        if (userEmail) {
          console.log("user email", userEmail)
          await sendReminderEmail({
            order: paymentData.id,
            amount: (paymentData.amount / 100).toFixed(2),
            paymentMethod: paymentData.payment_method_types?.[0] || "Card",
            status: paymentData.status,
            updatedAt: paymentData.created * 1000, // Stripe timestamps are in seconds
          }, userEmail);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handling failed:", err);
      res.status(500).send("Webhook handler error");
    }
  }
);

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

app.use("/api/store", storeRoute);
// user Route
app.use("/api/users", userRouter);
app.use("/api/category", categoryRouter);
app.use("/api/order", orderRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/cart", cartRoute);
app.use("/api/coupon", couponRouter);
app.use("/api/review", reviewRouter);
app.use(
  "/api/uploads",
  express.static(path.join(__dirname, "uploads/Category"))
);
// means that uploads/Category is a static folder
app.use("/api/product", productRoute);
// user Route

// rag middleware
app.post("/api/rag", ragHandler);

//*------------------------------------error handler (last)------------------------------------*//
app.use(errorHandler);

//*------------------------------------db + server start------------------------------------*//
connecToDb();

//*----------------------------------- Ai Rag sys init training if you have any db ---------------------------*//
// (async () => {
//   try {
//     const [
//       products,
//       users,
//       carts,
//       orders,
//       payments,
//       coupons,
//       stores,
//       categories,
//       reviews
//     ] = await Promise.all([
//       Product.find({}),
//       User.find({}),
//       Cart.find({}),
//       Order.find({}),
//       Payment.find({}),
//       Coupon.find({}),
//       Store.find({}),
//       Category.find({}),
//       Review.find({})
//     ]);

//     const processBatch = async (items, getMetaFn, prefix) => {
//       const BATCH_SIZE = 10;
//       for (let i = 0; i < items.length; i += BATCH_SIZE) {
//         const batch = items.slice(i, i + BATCH_SIZE);
//         await Promise.all(batch.map(async (item) => {
//           const { text, meta } = getMetaFn(item);
//           if (!text) return;
//           await addDocument(`${prefix}-${item._id}`, text, meta);
//         }));
//       }
//     };

//     console.log("Seeding embeddings...");

//     // Products
//     await processBatch(products, p => ({
//       text: `Name: ${p.name || ""}, Description: ${p.description || ""}, Price: ${p.price || ""}, Stock: ${p.stock || ""}, Brand: ${p.brand || ""}, Category: ${p.category || ""}`,
//       meta: { type: "product", relations: { } }
//     }), "product");

//     // Users
//     await processBatch(users, u => ({
//       text: `Username: ${u.userName || ""}, Email: ${u.email || ""}, First Name: ${u.firstName || ""}, Last Name: ${u.lastName || ""}, Address: ${u.address || ""}, Phone: ${u.phone || ""}`,
//       meta: { type: "user", relations: { } }
//     }), "user");

//     // Carts
//     await processBatch(carts, c => ({
//       text: [
//         `User: ${c.user}`,
//         c.items.map(i => `Product: ${i.product}, Qty: ${i.quantity}, Price: ${i.price}, Variants: ${JSON.stringify(i.variant || {})}`).join("\n"),
//         c.coupon ? `Coupon: ${c.coupon}` : "",
//         `Total: ${c.total}, Discount: ${c.discount}, Total After Discount: ${c.totalAfterDiscount}`,
//         c.status ? `Status: ${c.status}` : ""
//       ].join("\n"),
//       meta: { type: "cart", relations: { userId: c.user, couponId: c.coupon } }
//     }), "cart");

//     // Orders
//     await processBatch(orders, o => ({
//       text: [
//         `User: ${o.user}`,
//         o.orderItems.map(i => `Product: ${i.product}, Qty: ${i.quantity}, Price: ${i.price}`).join("\n"),
//         o.status ? `Status: ${o.status}` : "",
//         o.shippingAddress ? `Shipping Address: ${JSON.stringify(o.shippingAddress)}` : "",
//         o.paymentId ? `Payment ID: ${o.paymentId}` : "",
//         o.totalAmount ? `Total Amount: ${o.totalAmount}` : ""
//       ].join("\n"),
//       meta: { type: "order", relations: { userId: o.user, paymentId: o.paymentId } }
//     }), "order");

//     // Payments
//     await processBatch(payments, p => ({
//       text: `User: ${p.user}, Method: ${p.paymentMethod}, Amount: ${p.amount}, Transaction ID: ${p.transactionId || ""}, Status: ${p.status || ""}, Date: ${p.date || ""}`,
//       meta: { type: "payment", relations: { userId: p.user } }
//     }), "payment");

//     // Coupons
//     await processBatch(coupons, c => ({
//       text: `Code: ${c.code}, Value: ${c.value}, Used Count: ${c.usedCount}, Expiration Date: ${c.expirationDate || ""}, Min Order Amount: ${c.minOrderAmount || ""}`,
//       meta: { type: "coupon" }
//     }), "coupon");

//     // Stores
//     await processBatch(stores, s => ({
//       text: `Store: ${s.name}, Owner: ${s.owner || ""}, Description: ${s.description || ""}, Address: ${s.address || ""}, Phone: ${s.phone || ""}, Products Count: ${s.productsCount || 0}, Rating: ${s.rating || 0}`,
//       meta: { type: "store" }
//     }), "store");

//     // Categories
//     await processBatch(categories, c => ({
//       text: [
//         `Category: ${c.name} (Slug: ${c.slug || ""})`,
//         c.parent ? `Parent: ${c.parent}` : "",
//         `Products: ${c.productCount || 0}, Stores: ${c.storesCount || 0}`,
//         c.image ? `Image: ${c.image}` : "",
//         c.description ? `Description: ${c.description}` : ""
//       ].join("\n"),
//       meta: { type: "category" }
//     }), "category");

//     // Reviews
//     await processBatch(reviews, r => ({
//       text: `Rating: ${r.rating}, Comment: ${r.comment || ""}, User: ${r.user}, Entity: ${r.entityId}, Date: ${r.date || ""}, Title: ${r.title || ""}`,
//       meta: { type: "review", relations: { userId: r.user, productId: r.entityId } }
//     }), "review");

//     console.log("All models seeded into MongoDB Atlas.");
//   } catch (err) {
//     console.error("Error during initial training:", err);
//   }
// })();

//*------------------------------------host server ------------------------------------*//   osama saad
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
//*------------------------------------graceful shutdown------------------------------------*/
process.on("SIGINT", async () => {
  await closeDbConnection();
  console.log("🔌 Server shutdown gracefully");
  process.exit(0);
});

// test refaat
//test osama and refaat
