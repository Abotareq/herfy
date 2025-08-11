
import mongoose from "mongoose";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import appErrors from "../utils/app.errors.js";
import Store from "../models/storeModel.js";
import Stripe from "stripe";
import dotenv from "dotenv";
import Product from "../models/productModel.js";
import { buildPaymentFilter } from "../utils/filter_method.js";
import { getPaymentSortOption } from "../utils/sort.method.js";
import JSEND_STATUS from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
/**
 * Create a Stripe Checkout Session
 * @param {Object} order
 * @returns {Object} Stripe Session
 */
export const createStripeCheckoutSession = async (order) => {
  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: order.orderItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100, // convert to cents
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
  });
};

/**
 * Create a payment and initiate Stripe Checkout Session
 */
const createPayment = async (paymentData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingPayment = await Payment.findOne({
      order: paymentData.order,
    }).session(session);
    if (existingPayment) {
      throw appErrors.badRequest("Payment already exists for this order");
    }

    const order = await Order.findById(paymentData.order).session(session);
    if (!order) {
      throw appErrors.notFound("Order not found");
    }

    // Check if user is allowed to pay for this order
    if (order.user.toString() !== paymentData.user) {
      throw appErrors.forbidden("You are not allowed to pay for this order");
    }
    // Call separated Stripe utility
    //for dev
    // const stripeSession = await createStripeCheckoutSession(order);

    const payment = await Payment.create(
      [
        {
          order: order._id,
          user: paymentData.user,
          amount: order.totalAmount,
          paymentMethod: paymentData.paymentMethod || "credit_card",
          provider: paymentData.provider || "Stripe",
          status: paymentData.status || "pending",
          //for dev
          // stripeSessionId: stripeSession.id,
          // for test
          stripeSessionId: "test_session_id_12345",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // return { payment: payment[0], sessionUrl: stripeSession.url };
    // for test
    return { payment: payment[0] };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw appErrors.internal(error.message);
  }
};
/**
 * Stripe Webhook handler (to be placed in routes/webhook.js)
 * Not part of service but used to confirm payments
 */
const handleStripeWebhook = async (event) => {
  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object;

  // Start transaction
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Find payment by stripeSessionId
    const payment = await Payment.findOne({
      stripeSessionId: session.id,
    }).session(dbSession);
    if (!payment) {
      throw appErrors.notFound("Payment not found for session");
    }

    if (payment.status !== "completed") {
      // Update payment status
      payment.status = "completed";
      await payment.save({ session: dbSession });

      // Update order status
      const order = await Order.findById(payment.order).session(dbSession);
      if (!order) {
        throw appErrors.notFound("Order not found for payment");
      }
      order.status = "paid";
      order.paidAt = new Date();
      await order.save({ session: dbSession });

      // Reduce stock for each order item
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product).session(dbSession);
        if (product) {
          product.countInStock -= item.quantity;
          if (product.countInStock < 0) {
            throw appErrors.badRequest(
              `Insufficient stock for product ${product.name}`
            );
          }
          await product.save({ session: dbSession });
        }
      }

      // Update store revenue
      const store = await Store.findById(order.store).session(dbSession);
      if (store) {
        store.totalRevenue += payment.amount;
        await store.save({ session: dbSession });
      }

      // Cart deletion, Review creation, Loyalty points, Notifications
    }

    // Commit transaction
    await dbSession.commitTransaction();
    dbSession.endSession();
  } catch (error) {
    await dbSession.abortTransaction();
    dbSession.endSession();
    console.error("Webhook handling failed:", error);
    throw appErrors.internal(error.message);
  }
};

/**
 * Get payment by ID
 */
const getPaymentById = async (paymentId) => {
  // Validate paymentId format
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw appErrors.badRequest("Invalid payment ID");
  }
  // Find payment by ID
  const payment = await Payment.findById(paymentId)
    .populate("order")
    .populate("user")
    .lean();
  if (!payment) {
    throw appErrors.notFound("Payment not found");
  }
  return payment;
};

/**
 * Update payment status (includes Stripe refund)
 */
const updatePaymentStatus = async (paymentId, data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate paymentId format
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw appErrors.badRequest("Invalid payment ID");
    }
    // 2. Find payment by ID
    const payment = await Payment.findById(paymentId)
      .session(session);
    if (!payment) {
      throw appErrors.notFound("Payment not found");
    }

    // 3. Check if status change is valid
    if (payment.status === data.status) {
      throw appErrors.badRequest(`Payment is already '${data.status}'`);
    }

    if (payment.status === "completed" && data.status === "pending") {
      throw appErrors.badRequest(
        "Cannot change payment from completed to pending"
      );
    }

    // for dev
    // if (data.status === "refunded") {
    //   // Process Stripe refund
    //   if (payment.stripeSessionId) {
    //     await stripe.refunds.create({
    //       payment_intent: payment.stripeSessionId,
    //     });
    //   }
    // }

    payment.status = data.status;
    if (data.error) payment.error = data.error;
    await payment.save({ session });

    const order = await Order.findById(payment.order).session(session);
    if (!order) {
      throw appErrors.notFound("Order not found");
    }

    if (payment.status === "completed") {
      order.status = "paid";
      order.paidAt = new Date();
    } else if (payment.status === "refunded") {
      order.status = "refunded";
    } else if (payment.status === "failed") {
      order.status = "payment_failed";
    }

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return payment;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw appErrors.internal(error.message);
  }
};

/**
 * Get all payments (Admin only)
 */
const getAllPayments = async (query) => {
  const { page = 1, limit = 20 } = query;

  const filter = buildPaymentFilter(query);
  const sort = getPaymentSortOption(query.sort);

  const skip = (page - 1) * limit;

  const paymentsPromise = Payment.find(filter)
    .populate("user" , "userName email")
    .populate("order")
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const totalPromise = Payment.countDocuments(filter);

  const [payments, total] = await Promise.all([paymentsPromise, totalPromise]);

  return {
    data: {
      payments,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit),
      },
    },
  };
};
/**
 * Get payments by seller ID
 */
const getPaymentsBySeller = async (sellerId, query) => {
  const { page = 1, limit = 20, sort = "newest" } = query;
  const skip = (page - 1) * limit;

  // Fetch stores owned by seller
  const stores = await Store.find({ owner: sellerId }).select("_id").lean();
  if (stores.length === 0) return { payments: [], total: 0 };

  const storeIds = stores.map((s) => s._id);

  // Fetch orders related to those stores
  const orders = await Order.find({
    "orderItems.store": { $in: storeIds },
  }).select("_id").lean();
  if (orders.length === 0) return { payments: [], total: 0 };

  const orderIds = orders.map((o) => o._id);

  // Build payment filter
  const filter = { order: { $in: orderIds } };

  // Build sort options
  const sortOptions = getPaymentSortOption(sort);

  // Fetch payments with pagination and sorting
  const payments = await Payment.find(filter)
    .populate("order")
    .populate("user")
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Payment.countDocuments(filter);

  return {
    payments,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    },
  };
};


/**
 * Get payments by user ID with pagination, filtering, and sorting
 */
const getPaymentsByUser = async (userId, query) => {
  const { page = 1, limit = 20, sort = "newest"} = query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = { user: userId };

  // Sort options
  const sortOptions = getPaymentSortOption(sort);

  // Fetch payments
  const payments = await Payment.find(filter)
    .populate("order")
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Payment.countDocuments(filter);

  return {
    payments,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    },
  };
};


export default {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  getAllPayments,
  getPaymentsByUser,
  getPaymentsBySeller,
  handleStripeWebhook, // Exported for webhook controller
};
