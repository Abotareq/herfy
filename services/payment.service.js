import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import AppErrors from "../utils/app.errors.js";



/**
 * @desc Create payment and link it to order
 * @param {Object} paymentData
 */
const createPayment = async (paymentData) => {
  const order = await Order.findById(paymentData.order);
  if (!order) throw new Error("Order not found");

  const payment = await Payment.create(paymentData);

  if (payment.status === "completed") {
    order.status = "paid";
    order.paidAt = new Date();
    await order.save();
  }

  return payment;
};

/**
 * @desc Get payment by ID
 * @param {String} paymentId
 */
const getPaymentById = async (paymentId) => {
  return await Payment.findById(paymentId).populate("order user");
};

/**
 * @desc Update payment status
 * @param {String} paymentId
 * @param {Object} data
 */
const updatePaymentStatus = async (paymentId, data) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error("Payment not found");

  // chech if new status pending 
  if (payment.status === "completed" && data.status === "pending") {
    throw new Error("Cannot change payment from completed to pending");
  }

  payment.status = data.status;
  if (data.error) payment.error = data.error;

  await payment.save();

  const order = await Order.findById(payment.order);
  if (!order) throw new Error("Order not found");

  // update status of order
  if (payment.status === "completed") {
    order.status = "paid";
    order.paidAt = new Date();
  } else if (payment.status === "refunded") {
    order.status = "refunded";
    // order.refundedAt = new Date(); // if is found
  } else if (payment.status === "failed") {
    order.status = "payment_failed";
  }
  await order.save();

  //send notification

  return payment;
};
/**
 * @desc Get all payments (admin)
 */
const getAllPayments = async () => {
  return await Payment.find().populate("order user");
};

/**
 * @desc Get payments by sellerId
 * @param {String} sellerId
 */
const getPaymentsBySeller = async (sellerId) => {
  return await Payment.find()
    .populate({
      path: "order",
      match: { "orderItems.store": sellerId },
    })
    .populate("user");
};

/**
 * @desc Get payments by userId
 * @param {String} userId
 */
const getPaymentsByUser = async (userId) => {
  return await Payment.find({ user: userId }).populate("order user");
};

export default {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  getAllPayments,
  getPaymentsBySeller,
  getPaymentsByUser,
};
