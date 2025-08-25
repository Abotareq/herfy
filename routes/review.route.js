// import express from "express";
// import {
//   addNewReview,
//   getAllReviews,
//   updateReviews,
//   deleteReview,
//   deleteReviewByAdmin,
//   getReviewsByUserId,
// } from "../controllers/review.controller.js";
// import { checkRole, requireAuth } from "../auth/auth.middleware.js";
// import userRole from "../utils/user.role.js";
// import {
//   filterReviewByProducts,
//   filterReviewByShops,

// } from "../controllers/filter.controller.js";

// // import { getReviewSummary_DBOnly } from '../controllers/review.controller.js';

// import { getReviewSummaryRoute } from "../controllers/review.controller.js"; // osama saad

// const reviewRouter = express.Router();
// reviewRouter.get(
//   "/filter",
//   requireAuth,
//   checkRole([userRole.ADMIN]),
//   filterReviewByProducts
// );
// reviewRouter.get(
//   "/filter",
//   requireAuth,
//   checkRole([userRole.ADMIN]),
//   filterReviewByShops
// );
// reviewRouter.post(
//   "/",
//   requireAuth,
//   checkRole([userRole.CUSTOMER]),
//   addNewReview
// );
// reviewRouter.get("/", requireAuth, checkRole([userRole.ADMIN]), getAllReviews);
// reviewRouter.patch(
//   "/",
//   requireAuth,
//   checkRole([userRole.CUSTOMER]),
//   updateReviews
// );
// reviewRouter.delete(
//   "/",
//   requireAuth,
//   checkRole([userRole.VENDOR, userRole.CUSTOMER]),
//   deleteReview
// );
// reviewRouter.delete(
//   "/:id",
//   requireAuth,
//   checkRole([userRole.ADMIN]),
//   deleteReviewByAdmin
// );

// // osama saad
// reviewRouter.get("/summary/:entityId/:entityType",requireAuth,
//   checkRole([userRole.ADMIN]), getReviewSummaryRoute);

// // reviewRouter.get('/filter/reviews/user/:userId',filterReviewByUser);
// reviewRouter.get('/user/:userId', getReviewsByUserId)

// export default reviewRouter;

///*!

import express from "express";
import {
  addNewReview,
  getAllReviews,
  updateReviews,
  deleteReview,
  deleteReviewByAdmin,
  getUserReviews,
  getReviewsByUserId,
  getReviewSummaryRoute, // Consolidated import
} from "../controllers/review.controller.js";
import { checkRole, requireAuth } from "../auth/auth.middleware.js";
import userRole from "../utils/user.role.js";
import {
  filterReviewByProducts,
  filterReviewByShops,
  filterReviews,
} from "../controllers/filter.controller.js";

const reviewRouter = express.Router();
reviewRouter.get(
  "/filter/products",

  filterReviewByProducts
);
reviewRouter.get("/filter/shops", filterReviewByShops);
reviewRouter.post(
  "/",
  requireAuth,
  checkRole([userRole.CUSTOMER]),
  addNewReview
);
reviewRouter.get("/", requireAuth, checkRole([userRole.ADMIN]), getAllReviews);
reviewRouter.patch(
  "/",
  requireAuth,
  checkRole([userRole.CUSTOMER]),
  updateReviews
);
reviewRouter.delete(
  "/",
  requireAuth,
  checkRole([userRole.VENDOR, userRole.CUSTOMER]),
  deleteReview
);
reviewRouter.delete(
  "/:id",
  requireAuth,
  checkRole([userRole.ADMIN]),
  deleteReviewByAdmin
);
reviewRouter.get(
  "/user", // Changed from "/user/:userId" to "/user"
  requireAuth,
  checkRole([userRole.CUSTOMER]),
  getUserReviews
);
// osama saad
reviewRouter.get(
  "/summary/:entityId/:entityType",
  requireAuth,
  checkRole([userRole.ADMIN, userRole.VENDOR, userRole.CUSTOMER]),
  getReviewSummaryRoute
);

// reviewRouter.delete('/:id', requireAuth, checkRole([userRole.ADMIN]),deletUserByUser)
//REVIEW FOR CERTAIN PRODUCT OR CERTAIN STORE

// create delete review by user only and one by admin
// filter review for products and shops

// 15 Task (store and product)

// --- CRUD Operations ---
reviewRouter.post(
  "/",
  requireAuth,
  checkRole([userRole.CUSTOMER]),
  addNewReview
);
reviewRouter.get("/", requireAuth, checkRole([userRole.ADMIN]), getAllReviews);
reviewRouter.patch(
  "/",
  requireAuth,
  checkRole([userRole.CUSTOMER]),
  updateReviews
);
reviewRouter.delete(
  "/",
  requireAuth,
  checkRole([userRole.VENDOR, userRole.CUSTOMER]),
  deleteReview
);
reviewRouter.delete(
  "/:id",
  requireAuth,
  checkRole([userRole.ADMIN]),
  deleteReviewByAdmin
);

// --- Specific Queries & Filters ---

// FIXED: Changed routes to have unique paths
reviewRouter.get("/filter/products", filterReviewByProducts);
reviewRouter.get("/filter/shops", filterReviewByShops);

// Route for fetching reviews for a specific user
reviewRouter.get("/user/:userId", getReviewsByUserId);

// Route for review summary
reviewRouter.get("/summary/:entityId/:entityType", getReviewSummaryRoute);

reviewRouter.get("/filter", filterReviews);

export default reviewRouter;
