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
import sendReminderEmail from "../utils/email.notifications.js";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout Session
 * @param {Object} order - The order object containing order items and details
 * @returns {Object} Stripe Session
 */
export const createStripeCheckoutSession = async (order) => {
  try {
    // Validate required order items
    if (!order.orderItems || order.orderItems.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Create line_items from actual order items
    const lineItems = order.orderItems.map((item) => {
      // Validate required item data
      if (!item.product || !item.price || !item.quantity) {
        throw new Error('Invalid order item data');
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.name || item.name || "Product",
            description: item.product.description || item.description,
            images: item.product.images ? [item.product.images[0]] : undefined,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    const sessionConfig = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      // Add useful metadata
      metadata: {
        order_id: order._id.toString(),
        user_id: order.user.toString(),
      },
      // Add customer information if available
      customer_email: "menamosadef5@gmail.com",
      // Add shipping options if required
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB'], // Specify allowed countries
      },
    };

    return await stripe.checkout.sessions.create(sessionConfig);
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

/**
 * Create a payment and initiate Stripe Checkout Session
 * @param {Object} paymentData - Payment data including order ID and user ID
 * @returns {Object} Payment object and session URL
 */
export const createPayment = async (paymentData) => {
  // Validate input data
  if (!paymentData.order || !paymentData.user) {
    throw appErrors.badRequest("Order ID and User ID are required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for existing payment for this order
    const existingPayment = await Payment.findOne({
      order: paymentData.order,
    }).session(session);
    
    if (existingPayment) {
      throw appErrors.badRequest("Payment already exists for this order");
    }

    // Find the order
    const order = await Order.findById(paymentData.order)
      .populate('orderItems.product') // Load product data
      .session(session);
    
    if (!order) {
      throw appErrors.notFound("Order not found");
    }

    // Check if user is authorized to pay for this order
    if (order.user.toString() !== paymentData.user.toString()) {
      throw appErrors.forbidden("You are not allowed to pay for this order");
    }

    // Check order status
    if (order.status === 'cancelled') {
      throw appErrors.badRequest("Cannot pay for a cancelled order");
    }

    if (order.status === 'paid') {
      throw appErrors.badRequest("Order is already paid");
    }

    console.log("Order details:", {
      id: order._id,
      totalAmount: order.totalAmount,
      itemsCount: order.orderItems.length
    });

    // Create Stripe session
    let stripeSession = 0 ;
    if(paymentData.paymentMethod == "credit_card")
    {
      stripeSession = await createStripeCheckoutSession(order);
      console.log("Stripe session created:", {
      id: stripeSession.id,
      url: stripeSession.url
    });
    }
    else{
      
    }
    console.log("Payment data:", paymentData);
    // Create payment record
    const payment = await Payment.create(
      [{
        order: order._id,
        user: paymentData.user,
        amount: order.totalAmount,
        paymentMethod: paymentData.paymentMethod || "credit_card",
        provider: paymentData.provider || "Stripe",
        status: paymentData.status || "pending",
        stripeSessionId: stripeSession.id || 0,
        // Add additional information
        currency: "USD",
        createdAt: new Date(),
      }],
      { session }
    );

    // Update order status
    if(paymentData.paymentMethod == "credit_card")
   { await Order.findByIdAndUpdate(
      order._id,
      { 
        status: 'processing_payment',
        updatedAt: new Date()
      },
      { session }
    );}
    else{
      console.log("pending")
      await Order.findByIdAndUpdate(
      order._id,
      { 
        status: 'pending',
        updatedAt: new Date()
      },
      { session }
       );
    }

    await session.commitTransaction();
    
    return { 
      payment: payment[0], 
      sessionUrl: stripeSession.url,
      sessionId: stripeSession.id
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Payment creation error:', error);
    
    // Return appropriate error message
    if (error.name === 'AppError') {
      throw error;
    } else {
      throw appErrors.internal(`Payment processing failed: ${error.message}`);
    }
  } finally {
    session.endSession();
  }
};


const reverseStock = async (orderId) => {
  const order = await Order.findById(orderId).populate("orderItems.product");
  if (!order) throw AppErrors.notFound("Order not found");

  for (const item of order.orderItems) {
    const product = item.product;

    if (item.variant?.length > 0) {
      for (const chosenVariant of item.variant) {
        const variant = product.variants.find(v => v.name === chosenVariant.name);
        if (!variant) continue;

        const option = variant.options.find(o => o.value === chosenVariant.value);
        if (option) option.stock += item.quantity; //  restore stock
      }
    }

    await product.save();
  }

  order.status = "cancelled";
  await order.save();
};

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe webhook event
 */
export const handleStripeWebhook = async (event) => {
  try {
    switch (event.type) {
      //  Checkout completed (most common)
      case "checkout.session.completed":
        await handlePaymentSuccess(event.data.object);
        break;

      //  PaymentIntent succeeded (backup event, sometimes not tied to checkout)
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      //  Payment failed
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      //  Checkout session expired (user didn’t finish payment)
      case "checkout.session.expired":
        await handlePaymentExpired(event.data.object);
        break;

      // ↩ Refund issued
      case "charge.refunded":
        await handleRefund(event.data.object);
        break;

      default:
        console.log(` Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(" Webhook handling error:", error);
    throw error;
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (session) => {
  const paymentSession = await mongoose.startSession();
  paymentSession.startTransaction();

  try {
    // Update Payment record & return the populated document
    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        status: "completed",
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent,
      },
      { new: true, session: paymentSession }
    ).populate("user", "email"); // populate only email

    // Update linked Order
    if (payment?.order) {
      await Order.findByIdAndUpdate(
        payment.order,
        {
          status: "paid",
          paidAt: new Date(),
          updatedAt: new Date(),
        },
        { session: paymentSession }
      );
    }

    // Send reminder email if user email exists
    // if (payment?.user?.email) {
    //   await sendReminderEmail(payment, payment.user.email);
    // }

    await paymentSession.commitTransaction();
    console.log(`Payment completed for session: ${session.id}`);
  } catch (error) {
    await paymentSession.abortTransaction();
    console.error("Error handling payment success:", error);
    throw error;
  } finally {
    paymentSession.endSession();
  }
};

/**
 * Handle PaymentIntent success (backup for checkout)
 */
const handlePaymentIntentSucceeded = async (intent) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: "completed", paidAt: new Date() },
      { new: true }
    );

    if (payment?.order) {
      await Order.findByIdAndUpdate(payment.order, {
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(` PaymentIntent succeeded: ${intent.id}`);
  } catch (error) {
    console.error(" Error handling PaymentIntent success:", error);
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (intent) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: "failed", updatedAt: new Date() },
      { new: true }
    );

    if (payment?.order) {
      // Restore stock because payment failed
      await reverseStock(payment.order);

      await Order.findByIdAndUpdate(payment.order, {
        status: "failed",
        updatedAt: new Date(),
      });
    }

    console.log(` Payment failed: ${intent.id}`);
  } catch (error) {
    console.error(" Error handling payment failure:", error);
  }
};

/**
 * Handle expired checkout session
 */
const handlePaymentExpired = async (session) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      { status: "expired", updatedAt: new Date() },
      { new: true }
    );

    if (payment?.order) {
      // Restore stock
      await reverseStock(payment.order);

      await Order.findByIdAndUpdate(payment.order, {
        status: "cancelled",
        updatedAt: new Date(),
      });
    }

    console.log(` Payment session expired: ${session.id}`);
  } catch (error) {
    console.error(" Error handling payment expiration:", error);
  }
};

/**
 * Handle refund
 */
const handleRefund = async (charge) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: charge.payment_intent },
      { status: "refunded", updatedAt: new Date() },
      { new: true }
    );

    if (payment?.order) {
      await Order.findByIdAndUpdate(payment.order, {
        status: "refunded",
        updatedAt: new Date(),
      });
    }

    console.log(` Refund processed for charge: ${charge.id}`);
  } catch (error) {
    console.error(" Error handling refund:", error);
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

const getPaymentBySessionId = async (sessionId) => {
  // Find payment by ID
  console.log(sessionId)
  const payment = await Payment.find({ stripeSessionId: sessionId })
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
    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      throw appErrors.notFound("Payment not found");
    }
    console.log("Current Payment Status:", payment.status, "-> New Status:", data.status);
    // 3. Check if status change is valid
    if (payment.status === data.status) {
      console.log("No status change required");
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

// update payment method by order id 

/**
 * Get all payments (Admin only)
 */
const getAllPayments = async (query) => {
  const { page = 1, limit = 20 } = query;

  const filter = buildPaymentFilter(query);
  const sort = getPaymentSortOption(query.sort);

  const skip = (page - 1) * limit;

  const paymentsPromise = Payment.find(filter)
    .populate("user", "userName email")
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
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    }
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
  })
    .select("_id")
    .lean();
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
  const { page = 1, limit = 20, sort = "newest" } = query;
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
  getPaymentBySessionId,
};
