import express from "express";
import orderController from "../controllers/order.controller.js";
import {requireAuth ,checkRole} from "../auth/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createOrderSchema,
  updateOrderStatusSchema
} from "../validations/order.validation.js";

const router = express.Router();

router.use(requireAuth);

/**
 * User routes
 */
router.post(
  "/",
  checkRole("user"),
  validate(createOrderSchema),
  orderController.createOrder
);

router.get("/",
  checkRole("user"),
  orderController.getUserOrders);
router.get("/:id", checkRole("user"), orderController.getMyOrderById);
router.put("/:id/items", checkRole("user"), orderController.updateOrderItems);
router.patch("/:id/cancel", checkRole("user"), orderController.cancelOrder);
router.delete("/:id", checkRole("user"), orderController.deleteOrder);

/**
 * Seller routes
 */
router.get("/seller/orders", checkRole("seller"), orderController.getSellerOrders);

/**
 * Admin routes
 */
router.get("/admin/orders", checkRole("admin"), orderController.getAllOrders);
router.get("/admin/orders/:id", checkRole("admin"), orderController.getOrderById);
router.patch(
  "/admin/orders/:id/status",
  checkRole("admin"),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

export default router;
