import cartService from "../services/cart.service.js";
import StatusCodes from "../utils/status.codes.js";
import asyncWrapper from "../middlewares/async.wrapper.js";
import JSEND_STATUS from "../utils/http.status.message.js";

/**
 * @description Apply a coupon code to the user's cart
 * @route POST /cart/applyCoupon
 * @param {Object} req - Express request object (expects req.user.id and req.body.code)
 * @param {Object} res - Express response object
 * @returns {Object} Updated cart with coupon attached
 */
const applyCoupon = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;

  // Use cartService to handle coupon application with validations
  const updatedCart = await cartService.updateCart(userId, { coupon: code });

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: updatedCart,
  });
});

/**
 * @description Create a new cart or update the existing cart for the user
 * @route POST /cart
 * @param {Object} req - Express request object (expects req.user.id and req.body with cart data)
 * @param {Object} res - Express response object
 * @returns {Object} Created or updated cart
 */
export const createOrUpdateCart = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  // const userId = "649c1f1f1f1f1f1f1f1f1f1f";
  const cart = await cartService.createOrUpdateCart(userId, req.body);
  res.status(StatusCodes.CREATED).json({ status: JSEND_STATUS.SUCCESS, data: cart });
}); 

/**
 * @description Update the user's existing cart
 * @route PATCH /cart
 * @param {Object} req - Express request object (expects req.user.id and req.body with updated cart data)
 * @param {Object} res - Express response object
 * @returns {Object} Updated cart
 */
const updateCart = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  // const userId = "649c1f1f1f1f1f1f1f1f1f1f";
  const cart = await cartService.updateCart(userId, req.body);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * @description Get the user's cart by user ID
 * @route GET /cart
 * @param {Object} req - Express request object (expects req.user.id)
 * @param {Object} res - Express response object
 * @returns {Object} User's cart
 */
export const getCartByUserId = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  // const userId = "649c1f1f1f1f1f1f1f1f1f1f";
  const cart = await cartService.getCartByUserId(userId);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * @description Delete the user's cart
 * @route DELETE /cart
 * @param {Object} req - Express request object (expects req.user.id)
 * @param {Object} res - Express response object
 * @returns {void} No content
 */
export const deleteCart = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  // const userId = "649c1f1f1f1f1f1f1f1f1f1f";
  await cartService.deleteCart(userId);
  res.status(StatusCodes.NO_CONTENT).send();
});

/**
 * @description Add an item to the user's cart
 * @route POST /cart/addItem
 * @param {Object} req - Express request object (expects req.user.id and req.body with product details)
 * @param {Object} res - Express response object
 * @returns {Object} Updated cart with the new item added
 */
export const addItemToCart = asyncWrapper(async (req, res) => {
    const userId = req.user._id;
  // const userId = "649c1f1f1f1f1f1f1f1f1f1f";
  const cart = await cartService.addItemToCart(userId, req.body);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * @description Remove an item from the user's cart
 * @route DELETE /cart/removeItem/:productId
 * @param {Object} req - Express request object (expects req.user.id and req.params.productId)
 * @param {Object} res - Express response object
 * @returns {Object} Updated cart with the item removed
 */
export const removeItemFromCart = asyncWrapper(async (req, res) => {
   const userId = req.user._id;
  // const userId = "649c1f1f1f1f1f1f1f1f1f1f";
  const { productId } = req.params;
  const cart = await cartService.removeItemFromCart(userId, { productId, variant: req.body.variant });
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: cart });
});

/**
 * @description Get all carts (admin only)
 * @route GET /cart/all-carts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} All carts in the system
 */
export const getAllCarts = asyncWrapper(async (req, res) => {
  // Only admin can access this route
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const carts = await cartService.getAllCarts(page, limit );
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: carts });
});

export default {
  createOrUpdateCart,
  updateCart,
  getCartByUserId,
  deleteCart,
  addItemToCart,
  removeItemFromCart,
  applyCoupon,
  getAllCarts,
};
