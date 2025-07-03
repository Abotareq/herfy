import orderService from "../services/order.service.js";
import AsyncWrapper from "../middlewares/async.wrapper.js";
import StatusCodes from "../utils/status.codes.js";
import JSEND_STATUS from "../utils/http.status.message.js";

/**
 * Create order controller.
 */
const createOrder = AsyncWrapper(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  res.status(StatusCodes.CREATED).json({
    status: JSEND_STATUS.SUCCESS,
    data: order
  });
});

/**
 * Get current user's orders.
 */
const getUserOrders = AsyncWrapper(async (req, res) => {
  const orders = await orderService.getUserOrders(req.user._id);
  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: orders
  });
});

/**
 * Get all orders (admin).
 */
const getAllOrders = AsyncWrapper(async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: orders
  });
});

/**
 * Get order by ID (admin).
 */
const getOrderById = AsyncWrapper(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order
  });
});

/**
 * Get orders for a seller.
 */
const getSellerOrders = AsyncWrapper(async (req, res) => {
  const orders = await orderService.getSellerOrders(req.user._id);
  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: orders
  });
});

/**
 * Update order status (admin).
 */
const updateOrderStatus = AsyncWrapper(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status
  );
  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order
  });
});

/**
 * Get specific order for current user.
 */
const getMyOrderById = AsyncWrapper(async (req, res) => {
  const order = await orderService.getMyOrderById(req.params.id, req.user._id);
  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order
  });
});

/**
 * Cancel order.
 */
const cancelOrder = AsyncWrapper(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id);
  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order
  });
});

/**
 * Delete order.
 */
const deleteOrder = AsyncWrapper(async (req, res) => {
  const order = await orderService.deleteOrder(req.params.id);
  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: order
  });
});

/**
 * Update order items (e.g. by admin).
 */
const updateOrderItems = AsyncWrapper(async (req, res, next) => {
  const { orderId, itemId } = req.params;
  const { name, quantity, price } = req.body;
  const file = req.file;

  try {
    const updatedItem = await orderService.updateOrderItem(orderId, itemId, { name, quantity, price }, file);
    res.status(200).json({
      status: 'success',
      message: 'Order item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    next(error);
  }
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
  updateOrderItems
};
