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
    // 1. Find user
    const user = await User.findById(userId).session(session);
    if (!user) throw AppErrors.notFound("User not found");

    // 2. Shipping address
    let shippingAddress = {};
    if (orderData.useExisting) {
      if (!user.addresses || user.addresses.length === 0) {
        throw AppErrors.badRequest("User has no saved addresses");
      }
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
      shippingAddress = 
      {
        street: defaultAddress.street != undefined ? defaultAddress.street : "",
        city: defaultAddress.city != undefined ? defaultAddress.city : "",
        postalCode: defaultAddress.postalCode != undefined ? defaultAddress.postalCode : 12333,
        country: defaultAddress.country != undefined ? defaultAddress.country : "",
      }
    } else {
      shippingAddress = orderData.shippingAddress;
    }
    
    // 3. Get user cart
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw AppErrors.badRequest("Cart is empty");
    }

    const orderItems = [];

    // 4. Loop cart items
    for (const item of cart.items) {
      if (!item.product) throw AppErrors.notFound("Product not found");

      const product = item.product;
      // Decrease stock for each chosen variant/option
      if (item.variant?.length > 0) {
        for (const chosenVariant of item.variant) {
          const variant = product.variants.find(v => v.name === chosenVariant.name);
          if (!variant) throw AppErrors.badRequest(`Variant ${chosenVariant.name} not found`);

          const option = variant.options.find(o => o.value === chosenVariant.value);
          if (!option) throw AppErrors.badRequest(`Option ${chosenVariant.value} not found`);

          if (option.stock < item.quantity) {
            throw AppErrors.badRequest(`Not enough stock for ${chosenVariant.name}: ${chosenVariant.value}`);
          }

          option.stock -= item.quantity; // 🔽 decrease stock temporarily
        }
      }

      await product.save({ session });

      orderItems.push({
        product: product._id,
        store: product.store,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant, // snapshot of chosen variants
        image: product.images?.[0] || "",
      });
    }
     // 5. Update store order counts
    const storeIds = [
      ...new Set(orderItems.map((item) => item.store.toString())),
    ];
    await Store.updateMany(
      { _id: { $in: storeIds } },
      { $inc: { ordersCount: 1 } }, // increment active order count
      { session }
    );

    // for dev
    if (userId) {
      await User.updateOne(
        { _id: userId },
        {
          $inc: { activeOrders: 1 },
        },
        { session }
      );
    }
  // 6. Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = cart.discount || 0;
    const shippingFee = orderData.shippingFee || 50;
    const tax = orderData.tax || subtotal * 0.02;
    const totalAmount = subtotal - discount + shippingFee + tax;

    // 6. Create order
    const [order] = await Order.create(
      [
        {
          user: user._id,
          orderItems,
          shippingAddress,
          paymentMethod:orderData.paymentMethod || "credit_card",
          coupon: cart.coupon || null,
          subtotal,
          shippingFee: orderData.shippingFee || 50,
          tax: orderData.tax || subtotal * 0.2,
          totalAmount,
          status: "pending", // wait for payment confirmation
        },
      ],
      { session }
    );
       // 8. Update user order statistics
    await User.updateOne(
      { _id: userId },
      {
        $inc: { 
          ordersCount: 1,
          activeOrders: 1 
        },
      },
      { session }
    );
    // 7. Clear cart
    cart.items = [];
    cart.total = 0;
    cart.discount = 0;
    cart.totalAfterDiscount = 0;
    cart.coupon = null;
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

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
  const order = await Order.findById(orderId).populate("orderItems.product").populate("user");
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

const getSellerOrders = async (
  sellerId,
  { page = 1, limit = 10, searchQuery = "", statusFilter = "",paymentMethodFilter="" }
) => {
  const skip = (page - 1) * limit;

  // Get vendor store IDs
  const stores = await Store.find({ owner: sellerId }).select("_id");
  const storeIds = stores.map((s) => s._id);

  // Build query
  const query = { "orderItems.store": { $in: storeIds } };

  // Status filter
  if (statusFilter !== "all") {
    query.status = statusFilter;
  }
  else {
    query.status = { $ne: "Cancelled" };
  }

  if(paymentMethodFilter == "all"){
    // credit or cod
    query.paymentMethod = { $in: ["credit_card", "cash_on_delivery"] };
  }
  else{
    query.paymentMethod = paymentMethodFilter;
  }
  console.log("Query:", query);

  // Search filter
  if (searchQuery) {
    const searchRegex = new RegExp(searchQuery, "i"); // case-insensitive

    // Check if search is an ObjectId (for orderId search)
    if (/^[0-9a-fA-F]{24}$/.test(searchQuery)) {
      query.$or = [
        { _id: searchQuery }, // exact match by order ID
        { "orderItems.name": { $regex: searchRegex } }, // match by product name
      ];
    } else {
      query.$or = [
        { "orderItems.name": { $regex: searchRegex } }, // product name
        { status: { $regex: searchRegex } }, // status search
      ];
    }
  }

  // Fetch orders
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("orderItems.product")
      .populate("user")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Order.countDocuments(query),
  ]);
  console.log("orders : ",orders)
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
    const order = await Order.findById(orderId)
      .populate("orderItems.product")
      .session(session);
    
    console.log("order", order);
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

    // // Handle payment status updates
    if (status === "confirmed" || status === "paid") {
      await Payment.updateOne(
        { order: orderId },
        { status: "completed" },
        { session }
      );
    }

    // Refund stock on cancellation
    if (status === "Cancelled" && order.status !== "Cancelled") {
      // Refund stock for each item
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product).session(session);
        if (product && item.variant && item.variant.length > 0) {
          // Restore variant stock
          for (const chosenVariant of item.variant) {
            const variant = product.variants.find(v => v.name === chosenVariant.name);
            if (variant) {
              const option = variant.options.find(o => o.value === chosenVariant.value);
              if (option) {
                option.stock += item.quantity;
              }
            }
          }
          await product.save({ session });
        }
      }

      // Update store order counts
      const storeIds = [
        ...new Set(order.orderItems.map((item) => item.store.toString())),
      ];
      await Store.updateMany(
        { _id: { $in: storeIds } },
        { $inc: { ordersCount: -1 } }, // decrement active order count
        { session }
      );

      // Update user statistics
      if (order.user) {
        await User.updateOne(
          { _id: order.user },
          {
            $inc: { 
              cancelledOrders: 1,
              activeOrders: -1 
            },
          },
          { session }
        );
      }

      // Update payment status to refunded
      await Payment.updateOne(
        { order: orderId },
        { 
          status: "refunded",
          refundedAt: new Date()
        },
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
    const order = await Order.findById(orderId)
      .populate("orderItems.product")
      .session(session);
      
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

    // Refund stock for products with variants
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product).session(session);
      if (product && item.variant && item.variant.length > 0) {
        // Restore variant stock
        for (const chosenVariant of item.variant) {
          const variant = product.variants.find(v => v.name === chosenVariant.name);
          if (variant) {
            const option = variant.options.find(o => o.value === chosenVariant.value);
            if (option) {
              option.stock += item.quantity;
            }
          }
        }
        await product.save({ session });
      }
    }

    // Update store order counts
    const storeIds = [
      ...new Set(order.orderItems.map((item) => item.store.toString())),
    ];
    await Store.updateMany(
      { _id: { $in: storeIds } },
      { $inc: { ordersCount: -1 } }, // decrement active order count
      { session }
    );

    // Update user statistics
    if (order.user) {
      await User.updateOne(
        { _id: order.user },
        {
          $inc: { 
            cancelledOrders: 1,
            activeOrders: -1 
          },
        },
        { session }
      );
    }

    // Update payment status
    await Payment.updateOne(
      { order: orderId },
      { 
        status: "refunded",
        refundedAt: new Date()
      },
      { session }
    );

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
    const order = await Order.findById(orderId)
      .populate("orderItems.product")
      .session(session);
      
    if (!order) {
      throw AppErrors.notFound(
        httpMessages.ORDER_NOT_FOUND,
        StatusCodes.NOT_FOUND
      );
    }

    // Check if order is already cancelled
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
    // STEP 3: Refund stock for each item with variants
    // ========================
    await Promise.all(
      order.orderItems.map(async (item) => {
        const product = await Product.findById(item.product).session(session);
        if (product && item.variant && item.variant.length > 0) {
          // Restore variant stock
          for (const chosenVariant of item.variant) {
            const variant = product.variants.find(v => v.name === chosenVariant.name);
            if (variant) {
              const option = variant.options.find(o => o.value === chosenVariant.value);
              if (option) {
                option.stock += item.quantity;
              }
            }
          }
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
          $inc: { 
            cancelledOrders: 1, 
            activeOrders: -1 
          },
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
    // STEP 6: Update payment status
    // ========================
    await Payment.updateOne(
      { order: orderId },
      { 
        status: "refunded",
        refundedAt: new Date()
      },
      { session }
    );

    // ========================
    // STEP 7: Soft delete by setting storeDeletedAt and status
    // ========================
    order.storeDeletedAt = new Date();
    order.status = "cancelled"; // update status to cancelled
    await order.save({ session });

    // If you want hard deletion instead, replace above with:
    // await order.deleteOne({ session });

    // ===========================
    // STEP 8: Commit transaction
    // ===========================
    await session.commitTransaction();
    session.endSession();

    // ========================
    // STEP 9: Return success response
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

const getStoreOrders = async (
  storeId,
  { page = 1, limit = 10, status = "" } = {}
) => {
  const skip = (page - 1) * limit;

  // Base query: orders that include items from this store
  const query = { "orderItems.store": storeId };

  // Optional filter by status
  if (status) {
    query.status = status;
  }

  const [orders, count] = await Promise.all([
    Order.find(query)
      .skip(skip)
      .limit(limit)
      .populate("user", "name email") // include user info
      .populate("orderItems.product", "name price"), // include product info
    Order.countDocuments(query),
  ]);

  if (!orders || orders.length === 0) {
    throw AppErrors.notFound(
      "No orders found for this store",
      StatusCodes.NOT_FOUND
    );
  }

  return {
    data: {
      orders,
      totalOrders: count,
      totalPages: Math.ceil(count / limit),
    },
  };
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
  getStoreOrders
};
