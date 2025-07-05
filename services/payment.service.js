// import Stripe from 'stripe';
import Payment from '../models/paymentModel.js';
import Order from '../models/orderModel.js';
import appErrors from '../utils/app.errors.js';
import StatusCodes from '../utils/status.codes.js';
import Store from '../models/storeModel.js';
// import sendEmail from '../utils/sendEmail.js';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @desc Create a payment and link it to an order
 * @param {Object} paymentData
 */
const createPayment = async (paymentData) => {
  // 1. Check if a payment already exists for this order
  const existingPayment = await Payment.findOne({ order: paymentData.order });
  if (existingPayment) {
    throw appErrors.badRequest("Payment already exists for this order", StatusCodes.BAD_REQUEST);
  }

  // 2. Check if the order exists
  const order = await Order.findById(paymentData.order);
  if (!order) {
    throw appErrors.notFound("Order not found", StatusCodes.NOT_FOUND);
  }

  try {
    // 3. Create payment intent with Stripe
    // const stripePaymentIntent = await stripe.paymentIntents.create({
    //   amount: order.totalAmount * 100, // Stripe uses cents
    //   currency: 'usd',
    //   payment_method_types: ['card'],
    //   metadata: { orderId: order._id.toString() },
    // });

    // 4. Create payment document in DB with status completed
    const payment = await Payment.create({
      order: order._id,
      user: paymentData.user,
      amount: order.totalAmount,
      paymentMethod: paymentData.paymentMethod || 'credit_card',
      // transactionId: stripePaymentIntent.id,
      provider: 'Stripe',
      status: 'completed',
    });

    // 5. Update order status to paid
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();

    // 6. Send notification email to user
    // await sendEmail({
    //   to: order.user.email,
    //   subject: 'Payment Successful',
    //   text: `Your payment for order ${order._id} was successful.`,
    // });

    return payment;

  } catch (error) {
    // 7. If payment fails, create payment document with status failed
    const failedPayment = await Payment.create({
      order: order._id,
      user: paymentData.user,
      amount: order.totalAmount,
      paymentMethod: paymentData.paymentMethod || 'credit_card',
      status: 'failed',
      error: error.message,
    });

    // 8. Send failure notification email
    // await sendEmail({
    //   to: order.user.email,
    //   subject: 'Payment Failed',
    //   text: `Your payment for order ${order._id} failed. Reason: ${error.message}`,
    // });

    // 9. Throw error to be handled by controller
    throw appErrors.internal(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * @desc Get payment by ID
 * @param {String} paymentId
 */
const getPaymentById = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw appErrors.notFound("Payment not found", StatusCodes.NOT_FOUND);
  }
  return payment;
};

/**
 * @desc Update payment status
 * @param {String} paymentId
 * @param {Object} data
 */
const updatePaymentStatus = async (paymentId, data) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw appErrors.notFound("Payment not found", StatusCodes.NOT_FOUND);
  }

  // Prevent changing status from completed to pending
  if (payment.status === "completed" && data.status === "pending") {
    throw appErrors.badRequest("Cannot change payment from completed to pending", StatusCodes.BAD_REQUEST);
  }

  payment.status = data.status;
  if (data.error) payment.error = data.error;

  await payment.save();

  const order = await Order.findById(payment.order);
  if (!order) {
    throw appErrors.notFound("Order not found", StatusCodes.NOT_FOUND);
  }

  // Update order status based on payment status
  if (payment.status === "completed") {
    order.status = "paid";
    order.paidAt = new Date();
  } else if (payment.status === "refunded") {
    order.status = "refunded";
    // order.refundedAt = new Date(); // if applicable
  } else if (payment.status === "failed") {
    order.status = "payment_failed";
  }

  await order.save();

  // Send notification if needed

  return payment;
};
/**
 * @desc Get all payments (admin)
 */
const getAllPayments = async () => {
  return await Payment.find()
            // .populate("order user");
};

/**
 * @desc Get payments by sellerId
 * @param {String} sellerId
 */
const getPaymentsBySeller = async (sellerId) => {
console.log("Seller ID received:", sellerId);
 // 1. Fetch all stores owned by this seller
  const stores = await Store.find({ owner: sellerId }).select('_id');
  const storeIds = stores.map(s => s._id);

  // 2. Fetch all orders that include items from these stores
  const orders = await Order.find({ "orderItems.store": { $in: storeIds } }).select('_id');
  const orderIds = orders.map(order => order._id);

  // 3. Fetch payments for these orders
  const payments = await Payment.find({ order: { $in: orderIds } })
                                // .populate('order')
                                // .populate('user');

  return payments;
};

/**
 * @desc Get payments by userId
 * @param {String} userId
 */
const getPaymentsByUser = async (userId) => {
  return await Payment.find({ user: userId })
                        // .populate("order user");
};

export default {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  getAllPayments,
  getPaymentsByUser,
  getPaymentsBySeller
};
