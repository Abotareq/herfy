// import Stripe from 'stripe';
import Payment from '../models/paymentModel.js';
import Order from '../models/orderModel.js';
import appErrors from '../utils/app.errors.js';
import Store from '../models/storeModel.js';
// import sendEmail from '../utils/sendEmail.js';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment and link it to an order
 */
const createPayment = async (paymentData) => {
  const existingPayment = await Payment.findOne({ order: paymentData.order });
  if (existingPayment) {
    throw appErrors.badRequest("Payment already exists for this order");
  }

  const order = await Order.findById(paymentData.order);
  if (!order) {
    throw appErrors.notFound("Order not found");
  }

  try {
    const payment = await Payment.create({
      order: order._id,
      user: paymentData.user,
      amount: order.totalAmount,
      paymentMethod: paymentData.paymentMethod || 'credit_card',
      provider: 'Stripe',
      status: 'completed',
    });

    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();

    return payment;

  } catch (error) {
    const failedPayment = await Payment.create({
      order: order._id,
      user: paymentData.user,
      amount: order.totalAmount,
      paymentMethod: paymentData.paymentMethod || 'credit_card',
      status: 'failed',
      error: error.message,
    });

    throw appErrors.internal(error.message);
  }
};

/**
 * Get payment by ID
 */
const getPaymentById = async (paymentId) => {
  const payment = await Payment.findById(paymentId)
                               .populate('order')
                               .populate('user');
  if (!payment) {
    throw appErrors.notFound("Payment not found");
  }
  return payment;
};

/**
 * Update payment status
 */
const updatePaymentStatus = async (paymentId, data) => {
  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment) {
    throw appErrors.notFound("Payment not found");
  }

  if (payment.status === "completed" && data.status === "pending") {
    throw appErrors.badRequest("Cannot change payment from completed to pending");
  }

  payment.status = data.status;
  if (data.error) payment.error = data.error;

  await payment.save();

  const order = await Order.findById(payment.order);
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

  await order.save();

  return payment;
};

/**
 * Get all payments (Admin only)
 */
const getAllPayments = async () => {
  return await Payment.find()
                      .populate('order')
                      .populate('user');
};

/**
 * Get payments by seller ID
 */
const getPaymentsBySeller = async (sellerId) => {
  console.log("Seller ID received:", sellerId);

  const stores = await Store.find({ owner: sellerId }).select('_id');
  const storeIds = stores.map(s => s._id);

  const orders = await Order.find({ "orderItems.store": { $in: storeIds } }).select('_id');
  const orderIds = orders.map(order => order._id);

  const payments = await Payment.find({ order: { $in: orderIds } })
                                .populate('order')
                                .populate('user');

  return payments;
};

/**
 * Get payments by user ID
 */
const getPaymentsByUser = async (userId) => {
  return await Payment.find({ user: userId })
                      .populate('order')
                      .populate('user');
};

export default {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  getAllPayments,
  getPaymentsByUser,
  getPaymentsBySeller
};
