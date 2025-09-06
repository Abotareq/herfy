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
 */
const createOrder = asyncWrapper(async (req, res) => {
  // for dev
  const userId = req.user._id;
  // for test
  // add valid user mongodb id value
  // const userId = "649c1f1f1f1f1f1f1f1f1f1f"; // Assuming user ID is available in req.user.id
  console.log("hi from order")
  const order = await orderService.createOrder(req.body, userId);
  res.status(StatusCodes.CREATED).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Get all orders of the current user with pagination.
 * @route GET /orders
 * @access Private (User)
 */
const getUserOrders = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  // const userId = "649c1f1f1f1f1f1f1f1f1f1f";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status || ""; // Filter by status ('completed', 'pending', etc.)

  const orders = await orderService.getUserOrders(userId, page, limit,status);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: orders,
  });
});

/**
 * Get a specific order for the current user.
 * @route GET /orders/:orderId
 * @access Private (User)
 */
const getMyOrderById = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  // const userId = "649c1f1f1f1f1f1f1f1f1f1f";
  const { orderId } = req.params;

  const order = await orderService.getMyOrderById(orderId, userId);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Get all orders (admin) with pagination.
 * @route GET /orders/admin/orders
 * @access Private (Admin)
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
 */
const getSellerOrders = asyncWrapper(async (req, res) => {
  const sellerId = req.user._id;
  const orders = await orderService.getSellerOrders(sellerId, req.query);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: orders,
  });
});

/**
 * Update status of an order (admin).
 * @route PATCH /orders/admin/orders/:orderId/status
 * @access Private (Admin)
 */
const updateOrderStatus = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  console.log("hi")
  const order = await orderService.updateOrderStatus(orderId, status);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Cancel an order.
 * @route PATCH /orders/:orderId/cancel
 * @access Private (User)
 */
const cancelOrder = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const  userId  = req.user._id;

  const order = await orderService.cancelOrder(orderId,userId);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order,
  });
});

/**
 * Delete an order.
 * @route DELETE /orders/:orderId
 * @access Private (User)
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
 */
const updateOrderItems = asyncWrapper(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { name, quantity } = req.body;
  const file = req.file;

  const updatedItem = await orderService.updateOrderItem(
    orderId,
    itemId,
    { name, quantity },
    file
  );

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: updatedItem,
  });
});

const getStoreOrders = asyncWrapper(async (req, res) => {
  const { storeId } = req.params;
  const { page, limit, status } = req.query;

  console.log("store id", storeId);
  const orders = await orderService.getStoreOrders(storeId, {
    page,
    limit,
    status
  });

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: orders,
  });
});

export default {
  createOrder,
  getUserOrders,
  getMyOrderById,
  getAllOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  updateOrderItems,
  getStoreOrders
};
