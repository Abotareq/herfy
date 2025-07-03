import asyncWrapper from "../middlewares/async.wrapper.js";
import cartService from "../services/cart.service.js";
import StatusCodes from "../utils/status.codes.js";
import JSEND_STATUS from "../utils/http.status.message.js";

// import couponService from "../services/coupon.service.js"; // Assuming you have a service to validate coupons

// ...

/**
 * Apply a coupon to the authenticated user's cart.
 *
 * @route POST /cart/apply-coupon
 * @access Private (User)
 * @param {Object} req.user
 * @param {string} req.user.id
 * @param {Object} req.body
 * @param {string} req.body.couponCode - The coupon code to apply
 * @returns {Object} 200 - Updated cart with applied coupon
 */
const applyCoupon = asyncWrapper(async (req, res) => {
  // const userId = req.user.id;
  // const { couponCode } = req.body;

  // // Fetch the cart along with its items
  // const cart = await cartService.getCartByUserId(userId);
  // if (!cart) return res.status(StatusCodes.NOT_FOUND).json({ status: JSEND_STATUS.FAIL, message: "Cart not found" });

  // // Validate the coupon against the cart items
  // const coupon = await couponService.validateCouponForCart(couponCode, cart.items);

  // // If coupon is valid, update the cart with the coupon
  // cart.coupon = coupon._id;
  // await cart.save();

  // res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

// ...

// ==========================
// User Controllers
// ==========================

/**
 * Create or update the cart of the authenticated user.
 *
 * @route POST /cart
 * @access Private (User)
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.id - ID of the authenticated user
 * @param {Object} req.body - Cart data
 * @returns {Object} 201 - The created or updated cart
 */
const createOrUpdateCart = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const cart = await cartService.createOrUpdateCart(userId, req.body);
  res.status(StatusCodes.CREATED).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * Get the cart of the authenticated user.
 *
 * @route GET /cart
 * @access Private (User)
 * @param {Object} req.user
 * @param {string} req.user.id
 * @returns {Object} 200 - User's cart
 */
const getMyCart = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const cart = await cartService.getCartByUserId(userId);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * Update the cart of the authenticated user.
 *
 * @route PATCH /cart
 * @access Private (User)
 * @param {Object} req.user
 * @param {string} req.user.id
 * @param {Object} req.body - Cart update data
 * @returns {Object} 200 - Updated cart
 */
const updateMyCart = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const cart = await cartService.updateCart(userId, req.body);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * Delete the cart of the authenticated user.
 *
 * @route DELETE /cart
 * @access Private (User)
 * @param {Object} req.user
 * @param {string} req.user.id
 * @returns {void} 204 - No content
 */
const deleteMyCart = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  await cartService.deleteCart(userId);
  res.status(StatusCodes.NO_CONTENT).send();
});

/**
 * Add an item to the authenticated user's cart.
 *
 * @route POST /cart/items
 * @access Private (User)
 * @param {Object} req.user
 * @param {string} req.user.id
 * @param {Object} req.body - Item data (productId, quantity)
 * @returns {Object} 200 - Updated cart with the added item
 */
const addItemToMyCart = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const cart = await cartService.addItemToCart(userId, req.body);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * Remove an item from the authenticated user's cart.
 *
 * @route DELETE /cart/items/:productId
 * @access Private (User)
 * @param {Object} req.user
 * @param {string} req.user.id
 * @param {string} req.params.productId - ID of the product to remove
 * @returns {Object} 200 - Updated cart after removal
 */
const removeItemFromMyCart = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const cart = await cartService.removeItemFromCart(userId, req.params.productId);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * View the shopping cart of the authenticated user.
 *
 * @route GET /cart/shopping-cart
 * @access Private (User)
 * @param {Object} req.user
 * @param {string} req.user.id
 * @returns {Object} 200 - User's shopping cart
 */
const viewCart = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const cart = await cartService.getCartByUserId(userId);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

// ==========================
//  Admin Controllers
// ==========================

/**
 * Admin: Get cart by user ID.
 *
 * @route GET /cart/:userId
 * @access Private (Admin)
 * @param {string} req.params.userId - ID of the user
 * @returns {Object} 200 - User's cart
 */
const getCartByUserId = asyncWrapper(async (req, res) => {
  const cart = await cartService.getCartByUserId(req.params.userId);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * Admin: Update cart by user ID.
 *
 * @route PATCH /cart/:userId
 * @access Private (Admin)
 * @param {string} req.params.userId - ID of the user
 * @param {Object} req.body - Cart update data
 * @returns {Object} 200 - Updated cart
 */
const updateCartByUserId = asyncWrapper(async (req, res) => {
  const cart = await cartService.updateCart(req.params.userId, req.body);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * Admin: Delete cart by user ID.
 *
 * @route DELETE /cart/:userId
 * @access Private (Admin)
 * @param {string} req.params.userId - ID of the user
 * @returns {void} 204 - No content
 */
const deleteCartByUserId = asyncWrapper(async (req, res) => {
  await cartService.deleteCart(req.params.userId);
  res.status(StatusCodes.NO_CONTENT).send();
});

/**
 * Admin: Add item to a user's cart.
 *
 * @route POST /cart/:userId/items
 * @access Private (Admin)
 * @param {string} req.params.userId - ID of the user
 * @param {Object} req.body - Item data (productId, quantity)
 * @returns {Object} 200 - Updated cart with added item
 */
const addItemToCartByUserId = asyncWrapper(async (req, res) => {
  const cart = await cartService.addItemToCart(req.params.userId, req.body);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * Admin: Remove item from a user's cart.
 *
 * @route DELETE /cart/:userId/items/:productId
 * @access Private (Admin)
 * @param {string} req.params.userId - ID of the user
 * @param {string} req.params.productId - ID of the product to remove
 * @returns {Object} 200 - Updated cart after removal
 */
const removeItemFromCartByUserId = asyncWrapper(async (req, res) => {
  const cart = await cartService.removeItemFromCart(req.params.userId, req.params.productId);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

export default {
  // user
  createOrUpdateCart,
  getMyCart,
  updateMyCart,
  deleteMyCart,
  addItemToMyCart,
  removeItemFromMyCart,
  viewCart,
  applyCoupon,
  // admin
  getCartByUserId,
  updateCartByUserId,
  deleteCartByUserId,
  addItemToCartByUserId,
  removeItemFromCartByUserId,
};
