// import asyncWrapper from "../middlewares/async.wrapper.js";
// import paymentService from "../services/payment.service.js";
// import StatusCodes from "../utils/status.codes.js";
// import JSEND_STATUS from "../utils/http.status.message.js";

// /**
//  * @desc Create payment (User)
//  * @route POST /payments
//  */
// const createPayment = asyncWrapper(async (req, res) => {
//   const paymentData = { ...req.body, user: req.user.id };
//   const payment = await paymentService.createPayment(paymentData);
//   res.status(StatusCodes.CREATED).json({ status: JSEND_STATUS.SUCCESS, data: payment });
// });

// /**
//  * @desc Get payment by ID (Admin, Seller, User)
//  * @route GET /payments/:id
//  */
// const getPaymentById = asyncWrapper(async (req, res) => {
//   const payment = await paymentService.getPaymentById(req.params.id);
//   res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payment });
// });

// /**
//  * @desc Update payment status (Admin)
//  * @route PATCH /payments/:id/status
//  */
// const updatePaymentStatus = asyncWrapper(async (req, res) => {
//   const payment = await paymentService.updatePaymentStatus(req.params.id, req.body);
//   res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payment });
// });

// /**
//  * @desc Get all payments (Admin)
//  * @route GET /payments
//  */
// const getAllPayments = asyncWrapper(async (req, res) => {
//   const payments = await paymentService.getAllPayments();
//   res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payments });
// });

// /**
//  * @desc Get payments by seller (Seller)
//  * @route GET /payments/seller
//  */
// const getPaymentsBySeller = asyncWrapper(async (req, res) => {
//   const payments = await paymentService.getPaymentsBySeller(req.user.id);
//   res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payments });
// });

// /**
//  * @desc Get payments by user (User)
//  * @route GET /payments/user
//  */
// const getPaymentsByUser = asyncWrapper(async (req, res) => {
//   const payments = await paymentService.getPaymentsByUser(req.user.id);
//   res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payments });
// });

// export default {
//   createPayment,
//   getPaymentById,
//   updatePaymentStatus,
//   getAllPayments,
//   getPaymentsBySeller,
//   getPaymentsByUser,
// };

import asyncWrapper from "../middlewares/async.wrapper.js";
import paymentService from "../services/payment.service.js"
import JSEND_STATUS from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";
import AppErrors from "../utils/app.errors.js";

/**
 * @desc Create payment (User)
 * @route POST /payments
 */
const createPayment = asyncWrapper(async (req, res) => {
//const userID = req.user.id ;
const userID ="665d1b8fd5e1b2c5d9a66f11"
  const paymentData = { ...req.body, user: userID };
  const payment = await paymentService.createPayment(paymentData);
  res.status(StatusCodes.CREATED).json({ status: JSEND_STATUS.SUCCESS, data: payment });
});

/**
 * @desc Get payment by ID (Admin, Seller, User)
 * @route GET /payments/:id
 */
const getPaymentById = asyncWrapper(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payment });
});

/**
 * @desc Update payment status (Admin)
 * @route PATCH /payments/:id/status
 */
const updatePaymentStatus = asyncWrapper(async (req, res) => {
  const payment = await paymentService.updatePaymentStatus(req.params.id, req.body);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payment });
});

/**
 * @desc Get all payments (Admin)
 * @route GET /payments
 */
const getAllPayments = asyncWrapper(async (req, res) => {
  const payments = await paymentService.getAllPayments();
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payments });
});

/**
 * @desc Get payments by seller (Seller)
 * @route GET /payments/seller
 */
const getPaymentsBySeller = asyncWrapper(async (req, res) => {
    //const userID = req.user.id ;
      console.log("hi")
    const sellerID ="667f2d3b5e4a8c1f9b0e1a2b"
    console.log("hi")

  const payments = await paymentService.getPaymentsBySeller(sellerID);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payments });
});

/**
 * @desc Get payments by user (User)
 * @route GET /payments/user
 */
const getPaymentsByUser = asyncWrapper(async (req, res) => {
    //const userID = req.user.id ;
 const userID ="665d1b8fd5e1b2c5d9a66f11"
  const payments = await paymentService.getPaymentsByUser(userID);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: payments });
});


export default{
    createPayment,
    getPaymentById,
    updatePaymentStatus,
    getAllPayments,
    getPaymentsByUser,
    getPaymentsBySeller
}