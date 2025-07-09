/**
 * @fileoverview Joi validation schemas for Product operations:
 * - Create product
 * - Update product
 * - Create variant
 * - Update variant
 */

import Joi from "joi";
import { isValidObjectId } from "./custome.validation.js";

/**
 * @typedef {Object} VariantOption
 * @property {string} [id] - Optional MongoDB ObjectId string of the option.
 * @property {string} value - Option value (e.g. Red, Large).
 * @property {number} [priceModifier=0] - Price change for this option.
 * @property {number} [stock=0] - Stock quantity for this option.
 * @property {string} [sku] - Optional SKU for this option.
 */

/**
 * @typedef {Object} Variant
 * @property {string} name - Name of the variant (e.g. Color, Size).
 * @property {VariantOption[]} options - Array of variant options.
 */

/**
 * Validation schema for updating a variant option.
 *
 * @type {Joi.ObjectSchema}
 */
const updateVariantOptionSchema = Joi.object({
  _id: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (!isValidObjectId(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "ObjectId Validation"),
  value: Joi.string().trim().optional().messages({
    "string.base": "Option value must be a string",
    "string.empty": "Option value cannot be empty",
  }),
  priceModifier: Joi.number().min(0).optional().messages({
    "number.base": "Price modifier must be a number",
    "number.min": "Price modifier cannot be negative",
  }),
  stock: Joi.number().integer().min(0).optional().messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
  }),
  sku: Joi.string().trim().optional().messages({
    "string.base": "SKU must be a string",
    "string.empty": "SKU cannot be empty",
  }),
});

/**
 * Validation schema for updating a variant.
 *
 * @type {Joi.ObjectSchema}
 */
export const updateVariantSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    "string.base": "Variant name must be a string",
    "string.empty": "Variant name cannot be empty",
  }),
  options: Joi.array()
    .items(updateVariantOptionSchema)
    .optional()
    .messages({
      "array.base": "Options must be an array",
    }),
});

/**
 * Validation schema for creating a variant option.
 *
 * @type {Joi.ObjectSchema}
 */
const createVariantOptionSchema = Joi.object({
  value: Joi.string().trim().required().messages({
    "string.base": "Option value must be a string",
    "string.empty": "Option value is required",
  }),
  priceModifier: Joi.number().min(0).default(0).messages({
    "number.base": "Price modifier must be a number",
    "number.min": "Price modifier cannot be negative",
  }),
  stock: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
  }),
  sku: Joi.string().trim().required().messages({
    "string.base": "SKU must be a string",
    "string.empty": "SKU is required",
  }),
});

/**
 * Validation schema for creating a variant.
 *
 * @type {Joi.ObjectSchema}
 */
export const createVariantSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Variant name must be a string",
    "string.empty": "Variant name is required",
  }),
  options: Joi.array().items(createVariantOptionSchema).min(1).required().messages({
    "array.base": "Options must be an array",
    "array.min": "At least one option is required",
  }),
});

/**
 * Validation schema for creating a product.
 *
 * @type {Joi.ObjectSchema}
 *
 * @example
 * const productData = {
 *   store: "60c72b2f9b1d4c001c8e4f11",
 *   name: "Handmade Soap",
 *   description: "Natural lavender handmade soap bar.",
 *   basePrice: 50,
 *   category: "60c72b2f9b1d4c001c8e4f12",
 *   images: ["https://example.com/image1.jpg"],
 *   variants: [
 *     {
 *       name: "Color",
 *       options: [
 *         { value: "Purple", priceModifier: 0, stock: 20, sku: "SOAP-PRP-001" },
 *         { value: "White", priceModifier: 0, stock: 15, sku: "SOAP-WHT-001" }
 *       ]
 *     }
 *   ]
 * };
 * const { error, value } = createProductSchema.validate(productData);
 */
export const createProductSchema = Joi.object({
  store: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  basePrice: Joi.number().required(),
  category: Joi.string().required(),
  images: Joi.array().items(Joi.string()).optional(),
  variants: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        options: Joi.array().items(createVariantOptionSchema).min(1).required(),
      })
    )
    .optional(),
});

/**
 * Validation schema for updating a product.
 *
 * @type {Joi.ObjectSchema}
 *
 * @example
 * const updateData = {
 *   name: "Updated Handmade Soap",
 *   basePrice: 55,
 *   images: ["https://example.com/new-image.jpg"],
 *   variants: [
 *     {
 *       name: "Color",
 *       options: [
 *         { value: "Purple", priceModifier: 5, stock: 10, sku: "SOAP-PRP-002" }
 *       ]
 *     }
 *   ]
 * };
 * const { error, value } = updateProductSchema.validate(updateData);
 */
export const updateProductSchema = Joi.object({
  store: Joi.string().required(),
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  basePrice: Joi.number().optional(),
  category: Joi.string().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  variants: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        options: Joi.array().items(updateVariantOptionSchema).min(1).required(),
      })
    )
    .optional(),
});
