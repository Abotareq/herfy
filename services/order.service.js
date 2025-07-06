// import mongoose from "mongoose";
import StatusCodes from "../utils/status.codes.js";
import JSEND_STATUS from "../utils/http.status.message.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import appErrors from "../utils/app.errors.js";
import Store from "../models/storeModel.js";

const httpMessages = {
  ORDER_CREATED: "Order created successfully.",
  ORDER_FETCHED: "Order fetched successfully.",
  ORDERS_FETCHED: "Orders fetched successfully.",
  ALL_ORDERS_FETCHED: "All orders fetched successfully.",
  SELLER_ORDERS_FETCHED: "Seller orders fetched successfully.",
  ORDER_UPDATED: "Order updated successfully.",
  ORDER_CANCELLED: "Order cancelled successfully.",
  ORDER_DELETED: "Order deleted successfully.",
  ORDER_NOT_FOUND: "Order not found.",
  ORDER_ALREADY_CANCELLED: "Order is already cancelled.",
  PRODUCT_NOT_FOUND: "Product not found.",
  INSUFFICIENT_STOCK: "Insufficient stock for product",
  UNAUTHORIZED: "You are not authorized to perform this action."
};

/**
 * Creates a new order for a user and updates product stock accordingly.
 * @param {string} userId - The ID of the user placing the order.
 * @param {object} orderData - Order details including items, address, payment, etc.
 * @returns {Promise<object>} JSEND formatted response with created order data.
 * @throws {Error} If product is not found or insufficient stock.
 */
const createOrder = async (userId, orderData) => {
  try {
    const {
      orderItems,
      shippingAddress,
      payment,
      subtotal,
      shippingFee,
      tax,
      totalAmount,
      status,
      paidAt
    } = orderData;

    const enrichedItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product)
          throw appErrors.notFound(httpMessages.PRODUCT_NOT_FOUND, StatusCodes.NOT_FOUND);

        if (product.stock < item.quantity)
          throw appErrors.badRequest(
            `${httpMessages.INSUFFICIENT_STOCK} ${product.name}`,
            StatusCodes.BAD_REQUEST
          );

        product.stock -= item.quantity;
        await product.save();

        return {
          product: item.product,
          store: product.store,
          name: product.name,
          price: product.basePrice,
          image: product.images[0],
          quantity: item.quantity
        };
      })
    );

    const order = await Order.create({
      user: userId,
      orderItems: enrichedItems,
      shippingAddress,
      payment,
      subtotal,
      shippingFee,
      tax,
      totalAmount,
      status,
      paidAt
    });

    return {
      status: JSEND_STATUS.SUCCESS,
      statusCode: StatusCodes.CREATED,
      message: httpMessages.ORDER_CREATED,
      data: order
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves orders for a specific user with pagination.
 * @param {string} userId - User ID.
 * @param {number} page - Page number.
 * @param {number} limit - Number of results per page.
 * @returns {Promise<object>} JSEND formatted response with user's orders.
 */
const getUserOrders = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .populate("orderItems.product")
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: userId })
  ]);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ORDERS_FETCHED,
    data: {
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    }
  };
};

/**
 * Retrieves all orders (admin) with pagination.
 * @param {number} page - Page number.
 * @param {number} limit - Number of results per page.
 * @returns {Promise<object>} JSEND formatted response with all orders.
 */
const getAllOrders = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find()
      .populate("orderItems.product")
      .skip(skip)
      .limit(limit),
    Order.countDocuments()
  ]);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ALL_ORDERS_FETCHED,
    data: {
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    }
  };
};

/**
 * Retrieves a specific order by ID (admin).
 * @param {string} orderId - Order ID.
 * @returns {Promise<object>} JSEND formatted response with order data.
 * @throws {Error} If order is not found.
 */
const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId).populate("orderItems.product");

  if (!order)
    throw appErrors.notFound(httpMessages.ORDER_NOT_FOUND, StatusCodes.NOT_FOUND);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ORDER_FETCHED,
    data: order
  };
};

/**
 * Retrieves seller's orders with pagination.
 * @param {string} sellerId - Seller ID.
 * @param {number} page - Page number.
 * @param {number} limit - Number of results per page.
 * @returns {Promise<object>} JSEND formatted response with seller's orders.
 */
const getSellerOrders = async (sellerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const stores = await Store.find({ owner: sellerId }).select("_id");
  const storeIds = stores.map((s) => s._id);

  const [orders, total] = await Promise.all([
    Order.find({ "orderItems.store": { $in: storeIds } })
      .populate("orderItems.product")
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ "orderItems.store": { $in: storeIds } })
  ]);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.SELLER_ORDERS_FETCHED,
    data: {
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    }
  };
};

/**
 * Updates the status of an order (admin).
 * @param {string} orderId - Order ID.
 * @param {string} status - New status.
 * @returns {Promise<object>} JSEND formatted response with updated order.
 * @throws {Error} If order is not found.
 */
const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
  if (!order)
    throw appErrors.notFound(httpMessages.ORDER_NOT_FOUND, StatusCodes.NOT_FOUND);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ORDER_UPDATED,
    data: order
  };
};

/**
 * Retrieves a user's specific order by ID.
 * @param {string} orderId - Order ID.
 * @param {string} userId - User ID.
 * @returns {Promise<object>} JSEND formatted response with order data.
 * @throws {Error} If order is not found or unauthorized.
 */
const getMyOrderById = async (orderId, userId) => {
  const order = await Order.findById(orderId).populate("orderItems.product");

  if (!order)
    throw appErrors.notFound(httpMessages.ORDER_NOT_FOUND, StatusCodes.NOT_FOUND);

  if (order.user.toString() !== userId)
    throw appErrors.forbidden(httpMessages.UNAUTHORIZED, StatusCodes.FORBIDDEN);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ORDER_FETCHED,
    data: order
  };
};

/**
 * Cancels an order and rolls back product stock.
 * @param {string} orderId - Order ID.
 * @returns {Promise<object>} JSEND formatted response with cancelled order data.
 * @throws {Error} If order is not found or already cancelled.
 */
const cancelOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order)
    throw appErrors.notFound(httpMessages.ORDER_NOT_FOUND, StatusCodes.NOT_FOUND);

  if (order.status === "cancelled")
    throw appErrors.badRequest(httpMessages.ORDER_ALREADY_CANCELLED, StatusCodes.BAD_REQUEST);

  for (let item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  order.status = "cancelled";
  await order.save();

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ORDER_CANCELLED,
    data: order
  };
};

/**
 * Updates fields of a specific order item.
 * @param {string} orderId - Order ID.
 * @param {string} itemId - Order item ID.
 * @param {object} fields - Fields to update.
 * @param {object} file - File object for image update.
 * @returns {Promise<object>} Updated order item.
 * @throws {Error} If order or item is not found.
 */
const updateOrderItem = async (orderId, itemId, fields, file) => {
  const order = await Order.findById(orderId);
  if (!order) throw appErrors.notFound(httpMessages.ORDER_NOT_FOUND, StatusCodes.NOT_FOUND);

  const item = order.orderItems.id(itemId);
  if (!item) throw appErrors.notFound('Order item not found', StatusCodes.NOT_FOUND);

  if (fields.name) item.name = fields.name;
  if (fields.quantity) item.quantity = fields.quantity;
  if (fields.price) item.price = fields.price;
  if (file) item.image = file.path;

  await order.save();
  return item;
};

/**
 * Deletes an order and rolls back product stock.
 * @param {string} orderId - Order ID.
 * @returns {Promise<object>} JSEND formatted response with deleted order data.
 * @throws {Error} If order is not found.
 */
const deleteOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order)
    throw appErrors.notFound(httpMessages.ORDER_NOT_FOUND, StatusCodes.NOT_FOUND);

  for (let item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  await order.deleteOne();

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ORDER_DELETED,
    data: order
  };
};

export default {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
  getMyOrderById,
  cancelOrder,
  updateOrderItem,
  deleteOrder
};
