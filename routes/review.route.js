import express from "express";
import {
  addNewReview,
  getAllReviews,
  updateReviews,
  deleteReview,
  deleteReviewByAdmin,
} from "../controllers/review.controller.js";
import { checkRole, requireAuth } from "../auth/auth.middleware.js";
import userRole from "../utils/user.role.js";
import {
  filterReviewByProducts,
  filterReviewByShops,
} from "../controllers/filter.controller.js";

// import { getReviewSummary_DBOnly } from '../controllers/review.controller.js';

import { getReviewSummaryRoute } from "../controllers/review.controller.js"; // osama saad

const reviewRouter = express.Router();
reviewRouter.get(
  "/filter",
  requireAuth,
  checkRole([userRole.ADMIN]),
  filterReviewByProducts
);
reviewRouter.get(
  "/filter",
  requireAuth,
  checkRole([userRole.ADMIN]),
  filterReviewByShops
);
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

// osama saad
reviewRouter.get("/summary/:entityId/:entityType",requireAuth,
  checkRole([userRole.ADMIN]), getReviewSummaryRoute);

// reviewRouter.delete('/:id', requireAuth, checkRole([userRole.ADMIN]),deletUserByUser)
//REVIEW FOR CERTAIN PRODUCT OR CERTAIN STORE
export default reviewRouter;
// create delete review by user only and one by admin
// filter review for products and shops

// 15 Task (store and product)
