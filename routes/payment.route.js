import express from "express";
import paymentController from "../controllers/payment.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createPaymentSchema,
  updatePaymentStatusSchema,
} from "../validations/payment.validation.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";

const router = express.Router();

// ================================
// 🔐 Require authentication for all routes
// ================================

router.use(requireAuth);

/**
 * ================================
 * 🔹 ADMIN ROUTES
 * ================================
 */

/**
 * @route GET /payments
 * @desc Get all payments (Admin)
 * @access Private (Admin)
 */
router.get(
  "/",
  checkRole(["admin"]),
  paymentController.getAllPayments
);

/**
 * @route PATCH /payments/:id/status
 * @desc Update payment status (Admin)
 * @access Private (Admin)
 */
router.patch(
  "/:id/status",
  checkRole(["admin"]),
  validate(updatePaymentStatusSchema),
  paymentController.updatePaymentStatus
);

/**
 * @route GET /payments/:id
 * @desc Get payment by ID (Admin, Seller, User)
 * @access Private (Admin, Seller, User)
 */
router.get(
  "/:id",
  checkRole(["admin", "seller", "user"]),
  paymentController.getPaymentById
);


// ================================
// 🔹 SELLER ROUTES
// ================================

/**
 * @route GET /payments/seller
 * @desc Get payments by seller
 * @access Private (Seller)
 */
router.get(
  "/seller",
  checkRole(["seller"]),
  paymentController.getPaymentsBySeller
);


// ================================
// 🔹 USER ROUTES
// ================================

/**
 * @route POST /payments
 * @desc Create payment (User)
 * @access Private (User)
 */
router.post(
  "/",
  checkRole(["user"]),
  validate(createPaymentSchema),
  paymentController.createPayment
);

/**
 * @route GET /payments/user
 * @desc Get payments by user
 * @access Private (User)
 */
router.get(
  "/user",
  checkRole(["user"]),
  paymentController.getPaymentsByUser
);

export default router;
