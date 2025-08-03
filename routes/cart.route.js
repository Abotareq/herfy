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
import userRole from "../utils/user.role.js";

const router = express.Router();

// Apply global authentication
// for dev
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
    checkRole([userRole.CUSTOMER]),
    validate(createOrUpdateCartSchema),
    cartController.createOrUpdateCart
  )
  .patch(
    checkRole([userRole.CUSTOMER]),
    validate(updateCartSchema),
    cartController.updateCart
  )
  .get(
    checkRole([userRole.CUSTOMER, userRole.ADMIN]),
    cartController.getCartByUserId
  )
  .delete(
    checkRole([userRole.CUSTOMER, userRole.ADMIN]),
    cartController.deleteCart
  );

/**
 * /cart/items
 * Add item to cart
 */
router
  .route("/items")
  .post(
    checkRole([userRole.CUSTOMER]),
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
    checkRole([userRole.CUSTOMER]),
    cartController.removeItemFromCart
  );

/**
 * /cart/apply-coupon
 * Apply coupon to cart
 */
router
  .route("/apply-coupon")
  .post(
    checkRole([userRole.CUSTOMER]),
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
    checkRole([userRole.ADMIN]),
    cartController.getAllCarts
  );

export default router;
