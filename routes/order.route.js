import express from "express";
import orderController from "../controllers/order.controller.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import upload from "../middlewares/uploade.middleware.js";
import { createOrderSchema, updateOrderStatusSchema } from "../validations/order.validation.js";

const router = express.Router();

// ====================
// Global authentication for all order routes
// ====================
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
  checkRole("admin"),
  orderController.getAllOrders
);

/**
 * @route GET /orders/admin/orders/:orderId
 * @desc Get order by ID (Admin)
 * @access Private (Admin)
 */
router.get(
  "/admin/orders/:orderId",
  checkRole("admin"),
  orderController.getOrderById
);

/**
 * @route PATCH /orders/admin/orders/:orderId/status
 * @desc Update order status (Admin)
 * @access Private (Admin)
 */
router.patch(
  "/admin/orders/:orderId/status",
  checkRole("admin"),
  validate(updateOrderStatusSchema),
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
  checkRole("seller"),
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
router.post(
  "/",
  checkRole("user"),
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
  checkRole("user"),
  orderController.getUserOrders
);

/**
 * @route GET /orders/:orderId
 * @desc Get specific order by ID for current user
 * @access Private (User)
 */
router.get(
  "/:orderId",
  checkRole("user"),
  orderController.getMyOrderById
);

/**
 * @route DELETE /orders/:orderId
 * @desc Delete order by ID (consider restrict to Admin or Owner)
 * @access Private (User)
 */
router.delete(
  "/:orderId",
  checkRole("user"),
  orderController.deleteOrder
);

/**
 * @route PATCH /orders/:orderId/cancel
 * @desc Cancel order by ID
 * @access Private (User)
 */
router.patch(
  "/:orderId/cancel",
  checkRole("user"),
  orderController.cancelOrder
);

/**
 * @route PATCH /orders/:orderId/items/:itemId
 * @desc Update order item details
 * @access Private (User)
 */
router.patch(
  "/:orderId/items/:itemId",
  checkRole("user"),
  upload.single("image"),
  orderController.updateOrderItems
);

export default router;
