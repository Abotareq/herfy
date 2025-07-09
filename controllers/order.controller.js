import asyncWrapper from "../middlewares/async.wrapper.js";
import orderService from "../services/order.service.js";
import JSEND_STATUS from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";

/**
 * @module OrderController
 * @description Controller for order routes and business logic
 */

/**
 * Create a new order for the current user.
 * @route POST /orders
 * @access Private (User)
 * @param {Object} req - Express request object with user and body
 * @param {Object} res - Express response object
 * @returns {Object} Newly created order
 */
const createOrder = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const order = await orderService.createOrder(userId, req.body);
  res.status(StatusCodes.CREATED).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Get all orders of the current user with pagination.
 * @route GET /orders
 * @access Private (User)
 * @param {Object} req - Express request with user, query.page, query.limit
 * @param {Object} res - Express response
 * @returns {Object[]} List of user orders
 */
const getUserOrders = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const orders = await orderService.getUserOrders(userId, page, limit);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: orders,
  });
});

/**
 * Get all orders (admin) with pagination.
 * @route GET /orders/admin/orders
 * @access Private (Admin)
 * @param {Object} req - Express request with query.page, query.limit
 * @param {Object} res - Express response
 * @returns {Object[]} List of all orders
 */
const getAllOrders = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const orders = await orderService.getAllOrders(page, limit);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: orders,
  });
});

/**
 * Get an order by ID (admin).
 * @route GET /orders/admin/orders/:orderId
 * @access Private (Admin)
 * @param {Object} req - Express request with params.orderId
 * @param {Object} res - Express response
 * @returns {Object} Order details
 */
const getOrderById = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const order = await orderService.getOrderById(orderId);
  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Get all orders for the current seller with pagination.
 * @route GET /orders/seller/orders
 * @access Private (Seller)
 * @param {Object} req - Express request with user, query.page, query.limit
 * @param {Object} res - Express response
 * @returns {Object[]} List of seller orders
 */
const getSellerOrders = asyncWrapper(async (req, res) => {
  const sellerId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const orders = await orderService.getSellerOrders(sellerId, page, limit);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: orders,
  });
});

/**
 * Update status of an order (admin).
 * @route PATCH /orders/admin/orders/:orderId/status
 * @access Private (Admin)
 * @param {Object} req - Express request with params.orderId, body.status
 * @param {Object} res - Express response
 * @returns {Object} Updated order
 */
const updateOrderStatus = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await orderService.updateOrderStatus(orderId, status);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Get a specific order for the current user.
 * @route GET /orders/:orderId
 * @access Private (User)
 * @param {Object} req - Express request with params.orderId, user
 * @param {Object} res - Express response
 * @returns {Object} Order details
 */
const getMyOrderById = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const { orderId } = req.params;

  const order = await orderService.getMyOrderById(orderId, userId);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Cancel an order.
 * @route PATCH /orders/:orderId/cancel
 * @access Private (User)
 * @param {Object} req - Express request with params.orderId
 * @param {Object} res - Express response
 * @returns {Object} Cancelled order
 */
const cancelOrder = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;

  const order = await orderService.cancelOrder(orderId);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Delete an order.
 * @route DELETE /orders/:orderId
 * @access Private (User)
 * @param {Object} req - Express request with params.orderId
 * @param {Object} res - Express response
 * @returns {Object} Deleted order
 */
const deleteOrder = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;

  const order = await orderService.deleteOrder(orderId);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Update an item within an order (name, quantity, price, image).
 * @route PATCH /orders/:orderId/items/:itemId
 * @access Private (User)
 * @param {Object} req - Express request with params.orderId, params.itemId, body (name, quantity, price), file
 * @param {Object} res - Express response
 * @returns {Object} Updated order item
 */
const updateOrderItems = asyncWrapper(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { name, quantity, price } = req.body;
  const file = req.file;

  const updatedItem = await orderService.updateOrderItem(
    orderId,
    itemId,
    { name, quantity, price },
    file
  );

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: updatedItem,
  });
});

export default {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
  getMyOrderById,
  cancelOrder,
  deleteOrder,
  updateOrderItems,
};
