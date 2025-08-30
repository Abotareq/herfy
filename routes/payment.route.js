import express from "express";
import paymentController from "../controllers/payment.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";
import { createPaymentSchema, updatePaymentStatusSchema } from "../validations/payment.validation.js";
import userRole from "../utils/user.role.js";
import paymentService from "../services/payment.service.js";
import bodyParser from "body-parser";

const router = express.Router();


// router.post("/webhook",  bodyParser.raw({ type: "application/json" }), paymentService.handleStripeWebhook);
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


router.patch(
  "/order/:id/status",
  checkRole([userRole.ADMIN, userRole.VENDOR]),
  validate(updatePaymentStatusSchema),
  paymentController.updatePaymentStatusByOrderId
);
/**
 * @route PATCH /payments/:id/status
 * @desc Update payment status (Admin)
 * @access Private (Admin)
 */
router.patch(
  "/:id/status",
  checkRole([userRole.ADMIN, userRole.VENDOR]),
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
 * @desc Get payment by ID (Admin)
 * @access Private (Admin)
 */
router.get(
  "/:id",
  checkRole([userRole.ADMIN]),
  paymentController.getPaymentById
);

router.get(
  "/session/:id",
  checkRole([userRole.CUSTOMER, userRole.ADMIN, userRole.VENDOR]),
  paymentController.getPaymentBySessionId
);

export default router;
