import mongoose from "mongoose";
import StatusCodes from "../utils/status.codes.js";
import JSEND_STATUS from "../utils/http.status.message.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import AppErrors from "../utils/app.errors.js";
import Store from "../models/storeModel.js";
import Coupon from "../models/cuponModel.js";
import Cart from "../models/cartModel.js";
import Payment from "../models/paymentModel.js";
import { httpMessages } from "../constant/constant.js";
import User from "../models/userModel.js";

const createOrder = async (orderData, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // =======================
    // STEP 1: Merge duplicate products in orderItems by summing quantities
    // =======================
    const mergedOrderItems = [];

    for (const item of orderData.orderItems) {
      const existingItem = mergedOrderItems.find(
        (i) => i.product.toString() === item.product.toString()
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        mergedOrderItems.push({ ...item });
      }
    }

    // =======================
    // STEP 2: Fetch products in parallel using Promise.all
    // =======================
    const productIds = mergedOrderItems.map((item) => item.product);

    const products = await Product.find({ _id: { $in: productIds } }).session(
      session
    );

    // Convert products array to object map for faster lookup
    const productMap = {};
    products.forEach((product) => {
      productMap[product._id.toString()] = product;
    });

    // =======================
    // STEP 3: Update products & enrich orderItems (still parallel with Promise.all)
    // =======================
    await Promise.all(
      mergedOrderItems.map(async (item) => {
        const product = productMap[item.product.toString()];

        if (!product)
          throw AppErrors.notFound(`Product not found: ${item.product}`);

        if (product.stock < item.quantity)
          throw AppErrors.badRequest(
            `Insufficient stock for product: ${product.name}`
          );

        // Decrease stock
        product.stock -= item.quantity;
        await product.save({ session });

        // Add snapshot data to order item
        item.name = product.name;
        item.price = product.basePrice;
        item.image = product.images[0] || "";
        item.store = product.store;
      })
    );

    // =======================
    // STEP 4: Calculate subtotal, totalAmount in backend
    // =======================
    const subtotal = mergedOrderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate tax based on subtotal or fixed rules (example: 10%)
    const tax = subtotal * 0.1; // or your own tax logic

    // Calculate shipping fee based on business logic
    const shippingFee = subtotal >= 500 ? 0 : 20; // example: free shipping if subtotal >= 500

    const totalAmount = subtotal + tax + shippingFee;

    // =======================
    // STEP 5: Create order with enriched order items
    // =======================
    const storeIds = [
      ...new Set(mergedOrderItems.map((item) => item.store.toString())),
    ];

    const newOrder = await Order.create(
      [
        {
          ...orderData,
          user: userId,
          orderItems: mergedOrderItems,
          subtotal,
          tax,
          shippingFee,
          totalAmount,
        },
      ],
      { session }
    );

    // =======================
    // STEP 6: Update stores' ordersCount in parallel
    // =======================
    await Store.updateMany(
      { _id: { $in: storeIds } },
      { $inc: { ordersCount: 1 } },
      { session }
    );

    // =======================
    // STEP 7: Commit & return
    // =======================
    await session.commitTransaction();
    session.endSession();

    return newOrder[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw AppErrors.badRequest(err.message);
  }
};

// const getUserOrders = async (userId, page = 1, limit = 10) => {
//   const skip = (page - 1) * limit;

//   const [orders, total] = await Promise.all([
//     Order.find({ user: userId })
//       .populate("orderItems.product")
//       .skip(skip)
//       .limit(limit),
//     Order.countDocuments({ user: userId }),
//   ]);

//   return {
//     status: JSEND_STATUS.SUCCESS,
//     statusCode: StatusCodes.OK,
//     message: httpMessages.ORDERS_FETCHED,
//     data: { orders, page, pages: Math.ceil(total / limit), total },
//   };
// };

const getUserOrders = async (userId, page = 1, limit = 10, status = "") => {
  const skip = (page - 1) * limit;

  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("orderItems.product")
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ORDERS_FETCHED,
    data: { orders, page, pages: Math.ceil(total / limit), total },
  };
};

const getAllOrders = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find().populate("orderItems.product").skip(skip).limit(limit),
    Order.countDocuments(),
  ]);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ALL_ORDERS_FETCHED,
    data: { orders, page, pages: Math.ceil(total / limit), total },
  };
};

const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId).populate("orderItems.product");
  if (!order)
    throw AppErrors.notFound(
      httpMessages.ORDER_NOT_FOUND,
      StatusCodes.NOT_FOUND
    );

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ORDER_FETCHED,
    data: order,
  };
};

const getSellerOrders = async (sellerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const stores = await Store.find({ owner: sellerId }).select("_id");
  const storeIds = stores.map((s) => s._id);

  const [orders, total] = await Promise.all([
    Order.find({ "orderItems.store": { $in: storeIds } })
      .populate("orderItems.product")
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ "orderItems.store": { $in: storeIds } }),
  ]);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.SELLER_ORDERS_FETCHED,
    data: { orders, page, pages: Math.ceil(total / limit), total },
  };
};

const updateOrderStatus = async (orderId, status) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order)
      throw AppErrors.notFound(
        httpMessages.ORDER_NOT_FOUND,
        StatusCodes.NOT_FOUND
      );

    if (order.status === status) {
      await session.abortTransaction();
      session.endSession();
      return {
        status: JSEND_STATUS.SUCCESS,
        statusCode: StatusCodes.OK,
        message: "Order status unchanged.",
        data: order,
      };
    }

    // Prevent cancellation after delivery
    if (order.status === "delivered" && status === "Cancelled")
      throw AppErrors.badRequest(
        "Cannot cancel an order that is already delivered."
      );

    // Refund stock on cancellation
    if (status === "Cancelled" && order.status !== "Cancelled") {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      const storeIds = [
        ...new Set(order.orderItems.map((item) => item.store.toString())),
      ];
      await Store.updateMany(
        { _id: { $in: storeIds } },
        { $pull: { orders: order._id } },
        { session }
      );
    }

    order.status = status;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      status: JSEND_STATUS.SUCCESS,
      statusCode: StatusCodes.OK,
      message: httpMessages.ORDER_UPDATED,
      data: order,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const cancelOrder = async (orderId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order)
      throw AppErrors.notFound(
        httpMessages.ORDER_NOT_FOUND,
        StatusCodes.NOT_FOUND
      );
    // Security Check: Verify ownership before allowing cancellation.
    if (order.user.toString() !== userId.toString()) {
      throw AppErrors.forbidden(httpMessages.UNAUTHORIZED);
    }
    if (order.status === "cancelled")
      throw AppErrors.badRequest(
        httpMessages.ORDER_ALREADY_CANCELLED,
        StatusCodes.BAD_REQUEST
      );

    const nonCancellableStatuses = ["processing", "shipped", "delivered"];

    if (nonCancellableStatuses.includes(order.status))
      throw AppErrors.badRequest(
        `Cannot cancel an order that is already ${order.status}. Please contact support for assistance.`,
        StatusCodes.BAD_REQUEST
      );

    // Refund stock
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    const storeIds = [
      ...new Set(order.orderItems.map((item) => item.store.toString())),
    ];
    await Store.updateMany(
      { _id: { $in: storeIds } },
      { $inc: { ordersCount: -1 } }, // decrement active order count
      { session }
    );

    // for dev
    if (order.user) {
      await User.updateOne(
        { _id: order.user },
        {
          $inc: { cancelledOrders: 1 },
          $inc: { activeOrders: -1 },
        },
        { session }
      );
    }

    order.status = "cancelled";
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      status: JSEND_STATUS.SUCCESS,
      statusCode: StatusCodes.OK,
      message: httpMessages.ORDER_CANCELLED,
      data: order,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const deleteOrder = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ========================
    // STEP 1: Find order with session
    // ========================
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw AppErrors.notFound(
        httpMessages.ORDER_NOT_FOUND,
        StatusCodes.NOT_FOUND
      );
    }

    // Check if order is cancelled
    if (order.status === "cancelled") {
      throw AppErrors.badRequest(
        httpMessages.ORDER_ALREADY_CANCELLED,
        StatusCodes.BAD_REQUEST
      );
    }

    // ========================
    // STEP 2: Validate deletion eligibility
    // ========================
    if (["shipped", "delivered"].includes(order.status)) {
      throw AppErrors.badRequest(
        "Cannot delete an order that has been shipped or delivered.",
        StatusCodes.BAD_REQUEST
      );
    }

    // ========================
    // STEP 3: Refund stock for each item concurrently (improve performance)
    // ========================
    await Promise.all(
      order.orderItems.map(async (item) => {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.stock += item.quantity;
          await product.save({ session });
        }
      })
    );

    // ========================
    // STEP 4: Update user order stats if user exists
    // ========================
    if (order.user) {
      await User.updateOne(
        { _id: order.user },
        {
          $inc: { cancelledOrders: 1, activeOrders: -1 },
        },
        { session }
      );
    }

    // ========================
    // STEP 5: Update ordersCount for related stores
    // ========================
    const storeIds = [
      ...new Set(order.orderItems.map((item) => item.store.toString())),
    ];
    await Store.updateMany(
      { _id: { $in: storeIds } },
      {
        $inc: { ordersCount: -1 },
      },
      { session }
    );

    // ========================
    // STEP 6: Soft delete by setting storeDeletedAt and status
    // ========================
    order.storeDeletedAt = new Date();
    order.status = "cancelled"; // update status to cancelled
    await order.save({ session });

    // If you want hard deletion instead, replace above with:
    // await order.deleteOne({ session });

    // ===========================
    // STEP 7: Commit transaction
    // ===========================
    await session.commitTransaction();
    session.endSession();

    // ========================
    // STEP 8: Return success response
    // ========================
    return {
      status: JSEND_STATUS.SUCCESS,
      statusCode: StatusCodes.OK,
      message: httpMessages.ORDER_DELETED,
      data: order,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getMyOrderById = async (orderId, userId) => {
  const order = await Order.findById(orderId).populate("orderItems.product");

  if (!order)
    throw AppErrors.notFound(
      httpMessages.ORDER_NOT_FOUND,
      StatusCodes.NOT_FOUND
    );

  console.log("userId:", userId.toString(), "\n", "order.user:", order.user);
  if (order.user.toString() !== userId.toString())
    throw AppErrors.forbidden(httpMessages.UNAUTHORIZED, StatusCodes.FORBIDDEN);

  return {
    status: JSEND_STATUS.SUCCESS,
    statusCode: StatusCodes.OK,
    message: httpMessages.ORDER_FETCHED,
    data: order,
  };
};

/**
 * Updates fields of a specific order item in an order.
 * Ensures backend calculation for all financial fields with transaction safety and optimized performance.
 *
 * @param {string} orderId - Order ID.
 * @param {string} itemId - Order item ID.
 * @param {object} fields - Fields to update.
 * @param {object} file - File object for image update.
 * @returns {Promise<object>} Updated order item.
 * @throws {Error} If order or item is not found.
 */
const updateOrderItem = async (orderId, itemId, fields, file) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ==========================
    // Fetch order and item in parallel for performance
    // ==========================
    const [order] = await Promise.all([
      Order.findById(orderId).session(session),
    ]);

    if (!order) {
      throw AppErrors.notFound(
        httpMessages.ORDER_NOT_FOUND,
        StatusCodes.NOT_FOUND
      );
    }

    const item = order.orderItems.id(itemId);
    if (!item) {
      throw AppErrors.notFound("Order item not found", StatusCodes.NOT_FOUND);
    }

    // ==========================
    // Fetch product snapshot for backend price and stock validation
    // ==========================
    const product = await Product.findById(item.product).session(session);
    if (!product) {
      throw AppErrors.notFound(
        httpMessages.PRODUCT_NOT_FOUND,
        StatusCodes.NOT_FOUND
      );
    }

    // ==========================
    // Adjust stock if quantity is updated
    // ==========================
    if (fields.quantity && fields.quantity !== item.quantity) {
      const quantityDiff = fields.quantity - item.quantity;

      if (quantityDiff > 0 && product.stock < quantityDiff) {
        throw AppErrors.badRequest(
          `${httpMessages.INSUFFICIENT_STOCK} ${product.name}`,
          StatusCodes.BAD_REQUEST
        );
      }

      product.stock -= quantityDiff;
      item.quantity = fields.quantity;
    }

    // ==========================
    // Always use backend price snapshot for financial security
    // ==========================
    item.price = product.basePrice;

    // ==========================
    // Update name or image if provided
    // ==========================
    if (fields.name) item.name = fields.name;
    if (file) item.image = file.path;

    // ==========================
    // Perform stock save and order save in parallel for performance
    // ==========================
    await Promise.all([product.save({ session })]);

    // ==========================
    // Recalculate subtotal, tax, shippingFee, totalAmount based on your snippet logic
    // ==========================
    const subtotal = order.orderItems.reduce(
      (sum, orderItem) => sum + orderItem.price * orderItem.quantity,
      0
    );

    const tax = subtotal * 0.1; // 10% tax
    const shippingFee = subtotal >= 500 ? 0 : 20;
    const totalAmount = subtotal + tax + shippingFee;

    order.subtotal = subtotal;
    order.tax = tax;
    order.shippingFee = shippingFee;
    order.totalAmount = totalAmount;

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return item;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export default {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  getSellerOrders,
  getMyOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  updateOrderItem,
};
