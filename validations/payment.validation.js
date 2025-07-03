import Joi from "joi";

/**
 * @desc Validation schema for creating a payment
 */
export const createPaymentSchema = Joi.object({
  order: Joi.string().required(),
  amount: Joi.number().required(),
  paymentMethod: Joi.string().valid("credit_card", "paypal", "cash_on_delivery").required(),
  transactionId: Joi.string().optional(),
  provider: Joi.string().optional(),
  status: Joi.string().valid("pending", "completed", "failed", "refunded").optional(),
  error: Joi.string().optional(),
});

/**
 * @desc Validation schema for updating payment status
 */
export const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "completed", "failed", "refunded").required(),
  error: Joi.string().optional(),
});
