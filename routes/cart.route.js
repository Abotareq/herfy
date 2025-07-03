import express from "express";
import cartController from "../controllers/cart.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { createOrUpdateCartSchema, updateCartSchema, addItemSchema } from "../validations/cart.validation.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";

const router = express.Router();

// ================================
// User routes (require auth)
// ================================
router.use(requireAuth); // Protect all routes below

/**
 * @route POST /cart/apply-coupon
 * @desc Apply a coupon code to the authenticated user's cart.
 * @access Private (Registered Users)
 */
router.post("/apply-coupon", cartController.applyCoupon);
/**
 * @route POST /cart
 * @desc Create or update the cart of the currently authenticated user.
 * @access Private (Registered Users)
 */
router.post("/", validate(createOrUpdateCartSchema), cartController.createOrUpdateCart);

/**
 * @route GET /cart
 * @desc Get the cart of the currently authenticated user.
 * @access Private (Registered Users)
 */
router.get("/", cartController.getMyCart);

/**
 * @route PATCH /cart
 * @desc Update the cart of the currently authenticated user.
 * @access Private (Registered Users)
 */
router.patch("/", validate(updateCartSchema), cartController.updateMyCart);

/**
 * @route DELETE /cart
 * @desc Delete the cart of the currently authenticated user.
 * @access Private (Registered Users)
 */
router.delete("/", cartController.deleteMyCart);

/**
 * @route POST /cart/items
 * @desc Add an item to the cart of the currently authenticated user.
 * @access Private (Registered Users)
 */
router.post("/items", validate(addItemSchema), cartController.addItemToMyCart);

/**
 * @route DELETE /cart/items/:productId
 * @desc Remove a specific item from the cart of the currently authenticated user.
 * @access Private (Registered Users)
 * @params :productId (ID of the product to remove)
 */
router.delete("/items/:productId", cartController.removeItemFromMyCart);

/**
 * @route GET /cart/shopping-cart
 * @desc View the cart of the currently authenticated user.
 * @access Private (Registered Users)
 */
router.get("/items", cartController.viewCart);

// ================================
// 🔹 Admin routes (require admin role)
// ================================
router.use(checkRole(["admin"])); // All routes below require admin

/**
 * @route GET /cart/:userId
 * @desc Admin: Get cart by user ID.
 * @access Private (Admin only)
 */
router.get("/:userId", cartController.getCartByUserId);

/**
 * @route PATCH /cart/:userId
 * @desc Admin: Update cart by user ID.
 * @access Private (Admin only)
 */
router.patch("/:userId", validate(updateCartSchema), cartController.updateCartByUserId);

/**
 * @route DELETE /cart/:userId
 * @desc Admin: Delete cart by user ID.
 * @access Private (Admin only)
 */
router.delete("/:userId", cartController.deleteCartByUserId);

/**
 * @route POST /cart/:userId/items
 * @desc Admin: Add item to a user's cart by user ID.
 * @access Private (Admin only)
 */
router.post("/:userId/items", validate(addItemSchema), cartController.addItemToCartByUserId);

/**
 * @route DELETE /cart/:userId/items/:productId
 * @desc Admin: Remove item from a user's cart by user ID.
 * @access Private (Admin only)
 */
router.delete("/:userId/items/:productId", cartController.removeItemFromCartByUserId);

export default router;
