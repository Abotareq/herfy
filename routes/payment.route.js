import express from "express";
import paymentController from "../controllers/payment.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";
import { createPaymentSchema, updatePaymentStatusSchema } from "../validations/payment.validation.js";
import userRole from "../utils/user.role.js";

const router = express.Router();

/**
 * ================================
 *  Require authentication for all routes
 * ================================
 */
// for dev
router.use(requireAuth);

/**
 * ================================
 *  USER ROUTES
 * ================================
 */

/**
 * @route POST /payments
 * @desc Create payment (User)
 * @access Private (User)
 */
router
  .route("/")
  .post(
    checkRole([userRole.CUSTOMER]),
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
  checkRole([userRole.CUSTOMER]),
  paymentController.getPaymentsByUser
);

/**
 * ================================
 * SELLER ROUTES
 * ================================
 */

/**
 * @route GET /payments/seller
 * @desc Get payments by seller
 * @access Private (Seller)
 */
router.get(
  "/seller",
  checkRole([userRole.VENDOR]),
  paymentController.getPaymentsBySeller
);

/**
 * ================================
 * ADMIN ROUTES
 * ================================
 */

/**
 * @route GET /payments
 * @desc Get all payments (Admin)
 * @access Private (Admin)
 */
router.get(
  "/",
  checkRole([userRole.ADMIN]),
  paymentController.getAllPayments
);

/**
 * @route PATCH /payments/:id/status
 * @desc Update payment status (Admin)
 * @access Private (Admin)
 */
router.patch(
  "/:id/status",
  checkRole([userRole.ADMIN]),
  validate(updatePaymentStatusSchema),
  paymentController.updatePaymentStatus
);

/**
 * ================================
 * COMMON ROUTES (Admin, Seller, User)
 * ================================
 */

/**
 * @route GET /payments/:id
 * @desc Get payment by ID (Admin, Seller, User)
 * @access Private (Admin, Seller, User)
 */
router.get(
  "/:id",
  paymentController.getPaymentById
);

export default router;
