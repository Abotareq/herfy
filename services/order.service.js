import mongoose from "mongoose";
import StatusCodes from "../utils/status.codes.js";
import JSEND_STATUS from "../utils/http.status.message.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Payment from "../models/paymentModel.js";
import appErrors from "../utils/app.errors.js";

/**
 * Create a new order for user with transaction.
 */
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
  PAYMENT_NOT_FOUND: "Payment not found.",
  PRODUCT_NOT_FOUND: "Product not found.",
  INSUFFICIENT_STOCK: "Insufficient stock for product",
  UNAUTHORIZED: "You are not authorized to perform this action."
};
const createOrder = async (userId, orderData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
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

    // Verify payment exists if provided
    if (payment) {
      const paymentDoc = await Payment.findById(payment).session(session);
      if (!paymentDoc)
        throw appErrors.notFound(httpMessages.PAYMENT_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    // Build enriched order items with stock validation
    const enrichedItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await Product.findById(item.product).session(session);
        if (!product)
          throw appErrors.notFound(httpMessages.PRODUCT_NOT_FOUND, StatusCodes.NOT_FOUND);

        if (product.stock < item.quantity)
          throw appErrors.badRequest(
            `${httpMessages.INSUFFICIENT_STOCK} ${product.name}`,
            StatusCodes.BAD_REQUEST
          );

        product.stock -= item.quantity;
        await product.save({ session });

        return {
          product: item.product,
          store: item.store,
          name: product.name,
          price: product.price,
          image: product.images,
          quantity: item.quantity
        };
      })
    );

    const [order] = await Order.create(
      [
        {
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
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return {
      status: JSEND_STATUS.SUCCESS,
      statusCode: StatusCodes.CREATED,
      message: httpMessages.ORDER_CREATED,
      data: order
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Get orders for a specific user with populated data.
 */
/**
 * Get orders for a specific user with pagination.
 */
const getUserOrders = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const ordersPromise = Order.find({ user: userId })
    .populate("orderItems.product")
    .populate("orderItems.store")
    .populate("payment")
    .skip(skip)
    .limit(limit);

  const countPromise = Order.countDocuments({ user: userId });

  const [orders, total] = await Promise.all([ordersPromise, countPromise]);

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
 * Get all orders (admin).
 */
/**
 * Get all orders (admin) with pagination.
 */
const getAllOrders = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const ordersPromise = Order.find()
    .populate("orderItems.product")
    .populate("orderItems.store")
    .populate("payment")
    .skip(skip)
    .limit(limit);

  const countPromise = Order.countDocuments();

  const [orders, total] = await Promise.all([ordersPromise, countPromise]);

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
 * Get order by ID (admin).
 */
const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("orderItems.product")
    .populate("orderItems.store")
    .populate("payment");

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
 * Get seller's orders.
 */
/**
 * Get seller's orders with pagination.
 */
const getSellerOrders = async (sellerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const ordersPromise = Order.find({ "orderItems.store": sellerId })
    .populate("orderItems.product")
    .populate("orderItems.store")
    .populate("payment")
    .skip(skip)
    .limit(limit);

  const countPromise = Order.countDocuments({ "orderItems.store": sellerId });

  const [orders, total] = await Promise.all([ordersPromise, countPromise]);

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
 * Update order status (admin).
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
 * Retrieves an order by ID belonging to the user.
 */
const getMyOrderById = async (orderId, userId) => {
  const order = await Order.findById(orderId)
    .populate("orderItems.product")
    .populate("orderItems.store")
    .populate("payment");

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
 * Cancel an order and rollback stock quantities.
 */
const cancelOrder = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(orderId).session(session);
    if (!order)
      throw appErrors.notFound(httpMessages.ORDER_NOT_FOUND, StatusCodes.NOT_FOUND);

    if (order.status === "cancelled") {
      throw appErrors.badRequest(httpMessages.ORDER_ALREADY_CANCELLED, StatusCodes.BAD_REQUEST);
    }

    for (let item of order.orderItems) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    order.status = "cancelled";
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      status: JSEND_STATUS.SUCCESS,
      statusCode: StatusCodes.OK,
      message: httpMessages.ORDER_CANCELLED,
      data: order
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Delete an order and rollback stock quantities.
 */
const deleteOrder = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(orderId).session(session);
    if (!order)
      throw appErrors.notFound(httpMessages.ORDER_NOT_FOUND, StatusCodes.NOT_FOUND);

    for (let item of order.orderItems) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    await order.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      status: JSEND_STATUS.SUCCESS,
      statusCode: StatusCodes.OK,
      message: httpMessages.ORDER_DELETED,
      data: order
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Update order items.
 */
const updateOrderItem = async (orderId, itemId, fields, file) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const item = order.orderItems.id(itemId);
  if (!item) {
    const error = new Error('Order item not found');
    error.statusCode = 404;
    throw error;
  }

  // Update fields if provided
  if (fields.name) item.name = fields.name;
  if (fields.quantity) item.quantity = fields.quantity;
  if (fields.price) item.price = fields.price;

  // Update image if file is uploaded
  if (file) {
    item.image = file.path; // or cloudinary URL
  }

  await order.save();
  return item;
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
  deleteOrder,
  updateOrderItem
};
