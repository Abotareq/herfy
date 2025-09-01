
import asyncWrapper from "../middlewares/async.wrapper.js";
import Payment from "../models/paymentModel.js";
import paymentService from "../services/payment.service.js";
import JSEND_STATUS from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";

/**
 * @desc Create payment (User)
 * @route POST /payments
 */
const createPayment = asyncWrapper(async (req, res) => {
  // for dev
  const userID = req.user.id ;
  // for test
  // const userID = "649c1f1f1f1f1f1f1f1f1f1f";
  const paymentData = { ...req.body, user: userID };
  console.log(paymentData)
  const payment = await paymentService.createPayment(paymentData);
  res
    .status(StatusCodes.CREATED)
    .json({ status: JSEND_STATUS.SUCCESS, data: payment });
});

/**
 * @desc Get payment by ID (Admin, Seller, User)
 * @route GET /payments/:id
 */
const getPaymentById = asyncWrapper(async (req, res) => {
  const result = await paymentService.getPaymentById(req.params.id);
  res
    .status(StatusCodes.OK)
    .json({ 
      status: JSEND_STATUS.SUCCESS, 
      data: {
        payment: result,
      },
    });
});

const getPaymentBySessionId = asyncWrapper(async (req, res) => {
  const result = await paymentService.getPaymentBySessionId(req.params.id);
  res
    .status(StatusCodes.OK)
    .json({
      status: JSEND_STATUS.SUCCESS,
      data: {
        payment: result,
      },
    });
});

/**
 * @desc Update payment status (Admin)
 * @route PATCH /payments/:id/status
 */
const updatePaymentStatus = asyncWrapper(async (req, res) => {
  const payment = await paymentService.updatePaymentStatus(
    req.params.id,
    req.body
  );
  res
    .status(StatusCodes.OK)
    .json({ status: JSEND_STATUS.SUCCESS, data: payment });
});

const updatePaymentStatusByOrderId = asyncWrapper(async (req, res) => {

  const payment = await Payment.findOne({ order: req.params.id });

  console.log("hi ", req.params.id, req.body.status, payment);
  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({ status: JSEND_STATUS.FAIL, message: "Payment not found" });
  }
  const updatedPayment = await paymentService.updatePaymentStatus(
    payment._id,
    { status: req.body.status }
  );
  console.log("Updated Payment: ", updatedPayment);
  res
    .status(StatusCodes.OK)
    .json({ status: JSEND_STATUS.SUCCESS, data: updatedPayment });
});

/**
 * @desc Get all payments (Admin)
 * @route GET /payments
 */
const getAllPayments = asyncWrapper(async (req, res) => {

  const results = await paymentService.getAllPayments(req.query);
  res
    .status(StatusCodes.OK)
    .json({ 
      status: JSEND_STATUS.SUCCESS, 
      data:{
        payments: results.data.payments,
      } ,
      meta: {
        total: results.data.total,
        page: results.data.page,
        limit: results.data.limit,
      }
    });
});

/**
 * @desc Get payments by seller (Seller)
 * @route GET /payments/seller
 */
const getPaymentsBySeller = asyncWrapper(async (req, res) => {

  const sellerId = req.user.id ;
  // const sellerID = "64e5a9f831f60c5edc2e0bf2";
  const payments = await paymentService.getPaymentsBySeller(sellerId,req.query);
  res
    .status(StatusCodes.OK)
    .json({ status: JSEND_STATUS.SUCCESS, data: payments });
});

/**
 * @desc Get payments by user (User)
 * @route GET /payments/user
 */
const getPaymentsByUser = asyncWrapper(async (req, res) => {
  // for dev
  const userID = req.user.id ;
  // for test
  // const userID = "649c1f1f1f1f1f1f1f1f1f1f";
  const payments = await paymentService.getPaymentsByUser(userID,req.query);
  res
    .status(StatusCodes.OK)
    .json({ status: JSEND_STATUS.SUCCESS, data: payments });
});

export default {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  getAllPayments,
  getPaymentsByUser,
  getPaymentsBySeller,
  getPaymentBySessionId,
  updatePaymentStatusByOrderId
};
