/**
 * @fileoverview Joi validation schemas for Order operations:
 * - Create order
 * - Update order status
 */

import Joi from "joi";
import { isValidObjectId } from "./custome.validation.js";


// osama

export const validateOrderIdParam = Joi.object({
  orderId: Joi.string().required().custom((value, helpers) => {
    if (!isValidObjectId(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  }),
});


/**
 * Validation schema for updating the status of an order.
 *
 * @type {Joi.ObjectSchema}
 *
 * @example
 * const data = {
 *   orderId: "60c72b...",
 *   status: "shipped",
 *   shippedAt: "2025-07-05T12:00:00Z"
 * };
 * const { error, value } = updateOrderStatusSchema.validate(data);
 */
export const updateOrderStatusSchema = Joi.object({
  // orderId: Joi.string()
  //   .required()
  //   .custom((value, helpers) => {
  //     if (!isValidObjectId(value)) {
  //       return helpers.error("any.invalid");
  //     }
  //     return value;
  //   }, "ObjectId Validation"),
  status: Joi.string()
    .valid("pending", "paid", "processing", "shipped", "delivered", "cancelled")
    .required(),
  shippedAt: Joi.date().optional(),
  deliveredAt: Joi.date().optional(),
});

/**
 * @typedef {Object} OrderItem
 * @property {string} product - MongoDB ObjectId string of the product.
 * @property {string} store - MongoDB ObjectId string of the store.
 * @property {number} quantity - Quantity of the product (min: 1).
 */

/**
 * Validation schema for creating an order.
 *
 * @type {Joi.ObjectSchema}
 *
 * @example
 * const data = {
 *   user: "60c72b...",
 *   orderItems: [
 *     { product: "60c72b...", store: "60c72b...", quantity: 2 }
 *   ],
 *   shippingAddress: {
 *     street: "123 Main St",
 *     city: "Cairo",
 *     postalCode: "12345",
 *     country: "Egypt"
 *   },
 *   payment: "60c72b...",
 *   subtotal: 100,
 *   shippingFee: 10,
 *   tax: 5,
 *   totalAmount: 115,
 *   status: "pending",
 *   paidAt: null,
 *   shippedAt: null,
 *   deliveredAt: null
 * };
 * const { error, value } = createOrderSchema.validate(data);
 */
export const createOrderSchema = Joi.object({
  useExisting: Joi.boolean().required(),

  // shippingAddress can be an object with address fields, or a string "Profile Address"
  paymentMethod: Joi.string()
      .valid("credit_card", "paypal", "cash_on_delivery")
      .required(),
  shippingAddress: Joi.alternatives()
    .try(
      Joi.string().valid("Profile Address"),
      Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        postalCode: Joi.number().required(),
        country: Joi.string().required(),
      })
    )
    .required(),
});