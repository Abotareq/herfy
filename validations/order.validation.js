import Joi from "joi";

import { isValidObjectId } from "./custome.validation.js";

/**
 * @schema updateOrderStatusSchema
 * @description Schema for updating the status of an order.
 */
export const updateOrderStatusSchema = Joi.object({
  orderId: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isValidObjectId(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "ObjectId Validation"),
  status: Joi.string()
    .valid("pending", "paid", "processing", "shipped", "delivered", "cancelled")
    .required(),
  shippedAt: Joi.date().optional(),
  deliveredAt: Joi.date().optional(),
});

export const createOrderSchema = Joi.object({
    orderItems: Joi.array().items(
        Joi.object({
        product: Joi.string().required(),
        store: Joi.string().required(),
        name: Joi.string().required(),
        quantity: Joi.number().required(),
        price: Joi.number().required(),
        image: Joi.string().required(),
        })
    ).required(),
    shippingAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),
    }).required(),
    payment: Joi.string(),
    subtotal: Joi.number().required(),
    shippingFee: Joi.number().required(),
    tax: Joi.number().required(),
    totalAmount: Joi.number().required(),
});