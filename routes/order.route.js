import express from "express";
import orderController from "../controllers/order.controller.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";
import validate, { validateParams } from "../middlewares/validate.middleware.js";
import upload from "../middlewares/uploade.middleware.js";
import { createOrderSchema, updateOrderStatusSchema, validateOrderIdParam } from "../validations/order.validation.js";
import userRole from "../utils/user.role.js";
import { uploadCloudinary } from "../middlewares/cloudinary.middleware.js";

const router = express.Router();

// ====================
// Global authentication for all order routes
// ====================
// for dev
router.use(requireAuth);

/**
 * ====================
 *   Admin routes
 * ====================
 */

/**
 * @route GET /orders/admin/orders
 * @desc Get all orders (Admin)
 * @access Private (Admin)
 */
router.get(
  "/admin/orders",
  checkRole(userRole.ADMIN),
  orderController.getAllOrders
);

/**
 * @route GET /orders/admin/orders/:orderId
 * @desc Get order by ID (Admin)
 * @access Private (Admin)
 */
router.get(
  "/admin/orders/:orderId",
  checkRole(userRole.ADMIN),
  orderController.getOrderById
);

router.get(
  "/vendor/orders/:orderId",
  checkRole(userRole.VENDOR),
  orderController.getOrderById
);
/**
 * @route PATCH /orders/admin/orders/:orderId/status
 * @desc Update order status (Admin)
 * @access Private (Admin)
 */
router.patch(
  "/admin/orders/:orderId/status",
  checkRole(userRole.ADMIN),
  validate(updateOrderStatusSchema),
  validateParams(validateOrderIdParam),
  orderController.updateOrderStatus
);

router.patch(
  "/vendor/orders/:orderId/status",
  checkRole(userRole.VENDOR),
  validate(updateOrderStatusSchema),
  validateParams(validateOrderIdParam),
  orderController.updateOrderStatus
);

/**
 * ====================
 *   Seller routes
 * ====================
 */

/**
 * @route GET /orders/seller/orders
 * @desc Get all orders for seller
 * @access Private (Seller)
 */
router.get(
  "/seller/orders",
  checkRole(userRole.VENDOR),
  orderController.getSellerOrders
);

/**
 * ====================
 *   User routes
 * ====================
 */

/**
 * @route POST /orders
 * @desc Create new order
 * @access Private (User)
 */
router.use(checkRole([userRole.VENDOR, userRole.ADMIN,userRole.CUSTOMER]));
router.post(
  "/",
  validate(createOrderSchema),
  orderController.createOrder
);

/**
 * @route GET /orders
 * @desc Get current user's orders
 * @access Private (User)
 */
router.get(
  "/",
  orderController.getUserOrders
);

/**
 * @route GET /orders/:orderId
 * @desc Get specific order by ID for current user
 * @access Private (User)
 */
router.get(
  "/:orderId",
  orderController.getMyOrderById
);

/**
 * @route DELETE /orders/:orderId
 * @desc Delete order by ID (consider restrict to Admin or Owner)
 * @access Private (User)
 */
router.delete(
  "/:orderId",
  orderController.deleteOrder
);

/**
 * @route PATCH /orders/:orderId/cancel
 * @desc Cancel order by ID
 * @access Private (User)
 */
router.patch(
  "/:orderId/cancel",
  orderController.cancelOrder
);

/**
 * @route PATCH /orders/:orderId/items/:itemId
 * @desc Update order item details
 * @access Private (User)
 */
router.patch(
  "/:orderId/items/:itemId",
  // upload.single("image"),
  uploadCloudinary.single("image"),
  orderController.updateOrderItems
);


router.get(
  "/store/:storeId",
  checkRole([userRole.VENDOR, userRole.ADMIN]),
  orderController.getStoreOrders
)

export default router;
