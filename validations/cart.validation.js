import Joi from "joi";
import { isValidObjectId } from "./custome.validation.js"

/**
 * Schema for creating or updating a cart.
 */
export const createOrUpdateCartSchema = Joi.object({
  user: Joi.string().custom(isValidObjectId, "ObjectId Validation").required().description("User ID"),
  items: Joi.array().items(
    Joi.object({
      product: Joi.string().custom(isValidObjectId, "ObjectId Validation").required().description("Product ID"),
      quantity: Joi.number().min(1).default(1).required().description("Quantity of the product"),
      variant: Joi.object().pattern(Joi.string(), Joi.string()).optional().description("Product variant options"),
    })
  ).required().description("Array of cart items"),
  coupon: Joi.string().custom(isValidObjectId, "ObjectId Validation").optional().description("Coupon ID applied to cart"),
});

/**
 * Schema for updating a cart.
 */
export const updateCartSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product: Joi.string().custom(isValidObjectId, "ObjectId Validation").required().description("Product ID"),
      quantity: Joi.number().min(1).default(1).required().description("Quantity of the product"),
      variant: Joi.object().pattern(Joi.string(), Joi.string()).optional().description("Product variant options"),
    })
  ).optional().description("Array of cart items to update"),
  coupon: Joi.string().custom(isValidObjectId, "ObjectId Validation").optional().description("Coupon ID to update"),
});

/**
 * Schema for adding an item to cart.
 */
export const addItemSchema = Joi.object({
  product: Joi.string().custom(isValidObjectId, "ObjectId Validation").required().description("Product ID"),
  quantity: Joi.number().min(1).default(1).required().description("Quantity of the product"),
  variant: Joi.object().pattern(Joi.string(), Joi.string()).optional().description("Product variant options"),
});

/**
 * Schema for removing an item from cart.
 */
export const removeItemSchema = Joi.object({
  productId: Joi.string().custom(isValidObjectId, "ObjectId Validation").required().description("Product ID to remove"),
});
