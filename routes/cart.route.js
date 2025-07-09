import express from "express";
import cartController from "../controllers/cart.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";
import {
  addItemSchema,
  createOrUpdateCartSchema,
  updateCartSchema,
  applyCouponSchema
} from "../validations/cart.validation.js";

const router = express.Router();

// Apply global authentication
router.use(requireAuth);

/**
 * ====================
 *   User & Admin routes
 * ====================
 */

// /cart/
router
  .route("/")
  .post(
    checkRole(["user"]),
    validate(createOrUpdateCartSchema),
    cartController.createOrUpdateCart
  )
  .patch(
    checkRole(["user"]),
    validate(updateCartSchema),
    cartController.updateCart
  )
  .get(
    checkRole(["user", "admin"]),
    cartController.getCartByUserId
  )
  .delete(
    checkRole(["user", "admin"]),
    cartController.deleteCart
  );

/**
 * /cart/items
 * Add item to cart
 */
router
  .route("/items")
  .post(
    checkRole(["user"]),
    validate(addItemSchema),
    cartController.addItemToCart
  );

/**
 * /cart/items/:productId
 * Remove item from cart
 */
router
  .route("/items/:productId")
  .delete(
    checkRole(["user"]),
    cartController.removeItemFromCart
  );

/**
 * /cart/apply-coupon
 * Apply coupon to cart
 */
router
  .route("/apply-coupon")
  .post(
    checkRole(["user"]),
    validate(applyCouponSchema),
    cartController.applyCoupon
  );

/**
 * ====================
 *   Admin routes
 * ====================
 */

// /cart/all-carts
router
  .route("/all-carts")
  .get(
    checkRole(["admin"]),
    cartController.getAllCarts
  );

export default router;
