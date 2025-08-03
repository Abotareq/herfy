/**
 * @fileoverview Joi validation schemas for Payment operations:
 * - Create payment
 * - Update payment status
 */

import Joi from "joi";
import { isValidObjectId } from "./custome.validation.js";

/**
 * Validation schema for creating a payment.
 *
 * @type {Joi.ObjectSchema}
 *
 * @example
 * const data = {
 *   order: "60c72b...",
 *   amount: 150,
 *   paymentMethod: "credit_card",
 *   transactionId: "txn_123456",
 *   provider: "Stripe",
 *   status: "pending",
 *   error: null
 * };
 * const { error, value } = createPaymentSchema.validate(data);
 */
export const createPaymentSchema = Joi.object({
  order: Joi.required().custom((value, helpers) => {
    if (!isValidObjectId(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  }, "ObjectId Validation"),
  paymentMethod: Joi.string()
    .valid("credit_card", "paypal", "cash_on_delivery")
    .required(),
  transactionId: Joi.string().optional(),
  provider: Joi.string().optional(),
  status: Joi.string()
    .valid("pending", "completed", "failed", "refunded")
    .optional(),
  error: Joi.string().optional(),
});

/**
 * Validation schema for updating payment status.
 *
 * @type {Joi.ObjectSchema}
 *
 * @example
 * const data = {
 *   status: "completed",
 *   error: null
 * };
 * const { error, value } = updatePaymentStatusSchema.validate(data);
 */
export const updatePaymentStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "completed", "failed", "refunded")
    .required(),
  error: Joi.string().optional(),
});
