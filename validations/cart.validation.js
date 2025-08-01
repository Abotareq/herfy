/**
 * @fileoverview Joi validation schemas for Cart operations:
 * - Create or update cart
 * - Update cart items
 * - Add item to cart
 */

import Joi from "joi";
import { isValidObjectId } from "./custome.validation.js";

/**
 * @typedef {Object} CartItem
 * @property {string} product - MongoDB ObjectId string of the product.
 * @property {number} quantity - Quantity of the product (integer, min: 1).
 */

/**
 * Validation schema for creating or updating a cart.
 *
 * @type {Joi.ObjectSchema}
 *
 * @example
 * const data = {
 *   items: [
 *     { product: "60c72b...", quantity: 2 }
 *   ],
 *   coupon: "60c72b..."
 * };
 * const { error, value } = createOrUpdateCartSchema.validate(data);
 */
export const createOrUpdateCartSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string()
          .custom((value, helpers) => {
            if (!isValidObjectId(value)) {
              return helpers.error("any.invalid", { message: "Invalid product ID." });
            }
            return value;
          }, "ObjectId Validation")
          .required(),
        quantity: Joi.number().integer().min(1).required(),
        variant: Joi.object({
          name: Joi.string().required(),
          value: Joi.string().required(),
        }).optional(),
      })
    )
    .optional(),

  coupon: Joi.string()
    .allow(null, "")
    .custom((value, helpers) => {
      if (value && !isValidObjectId(value)) {
        return helpers.error("any.invalid", { message: "Invalid coupon ID." });
      }
      return value;
    }, "ObjectId Validation")
    .optional(),
});

/**
 * Validation schema for updating cart items and coupon.
 *
 * @type {Joi.ObjectSchema}
 *
 * @example
 * const data = {
 *   items: [
 *     { product: "60c72b...", quantity: 3 }
 *   ],
 *   coupon: "60c72b..."
 * };
 * const { error, value } = updateCartSchema.validate(data);
 */
export const updateCartSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string()
          .custom((value, helpers) => {
            if (!isValidObjectId(value)) {
              return helpers.error("any.invalid");
            }
            return value;
          }, "ObjectId Validation")
          .required(),

        quantity: Joi.number().integer().min(1).required(),

        variant: Joi.object({
          name: Joi.string().trim().required(),
          value: Joi.string().trim().required(),
        }).optional(),
      })
    )
    .min(1)
    .required(),

  coupon: Joi.string()
    .custom((value, helpers) => {
      if (!isValidObjectId(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "ObjectId Validation")
    .optional()
    .allow(null, ""),
});
/**
 * Validation schema for adding a single item to the cart.
 *
 * @type {Joi.ObjectSchema}
 *
 * @example
 * const data = {
 *   productId: "60c72b...",
 *   quantity: 1
 * };
 * const { error, value } = addItemSchema.validate(data);
 */
export const addItemSchema = Joi.object({
  productId: Joi.string().custom((value, helpers) => {
    if (!isValidObjectId(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  }, "ObjectId Validation").required(),
  variant: Joi.object({
    name: Joi.string().required(),
    value: Joi.string().required(),
  }).optional(),
  quantity: Joi.number().integer().min(1).required(),
});

export const applyCouponSchema = Joi.object({
  code: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Coupon code is required",
      "string.empty": "Coupon code cannot be empty",
    }),
});