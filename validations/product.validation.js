import Joi from "joi";
import { isValidObjectId } from "./custome.validation.js";
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
 * Schema for creating a new product.
 * Validates store, name, description, basePrice, category, images, and variants.
 * Variants are an array of objects, each with a name and options.
 * Each option includes value, priceModifier, stock, and optional SKU.
 *
 * @type {Joi.ObjectSchema}
 * @property {string} store - The ID of the store this product belongs to (required).
 * @property {string} name - The name of the product (required).
 * @property {string} [description] - Optional description of the product.
 * @property {number} basePrice - The base price of the product (required).
 * @property {string} category - The ID of the product category (required).
 * @property {array} [images] - Optional array of image URLs.
 * @property {array} [variants] - Optional array of variants.
 * @property {string} variants.name - Name of the variant (e.g. Color, Size).
 * @property {array} variants.options - Array of options for each variant.
 * @property {string} variants.options.value - The option value (e.g. Red, Large).
 * @property {number} [variants.options.priceModifier=0] - Price change for this option.
 * @property {number} [variants.options.stock=0] - Stock quantity for this option.
 * @property {string} [variants.options.sku] - Optional SKU for this option.
 * @returns {Joi.ObjectSchema} - The Joi schema for product creation.
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
 *         { value: "White", priceModifier: 0, stock: 15 }
 *       ]
 *     }
 *   ]
 * };
 */
export const createProductSchema = Joi.object({
    store: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().optional(),
    basePrice: Joi.number().required(),
    category: Joi.string().required(),
    images: Joi.array().items(Joi.string()).optional(),
    variants: Joi.array().items(
        Joi.object({
        name: Joi.string().required(),
        options: Joi.array().items(
            Joi.object({
            value: Joi.string().required(),
            priceModifier: Joi.number().default(0),
            stock: Joi.number().default(0),
            sku: Joi.string().optional()
            })
        )
        })
    ).optional()
});

/**
 * Schema for updating a product.
 * Allows partial updates to any product field including name, description, basePrice, category, images, and variants.
 * Variants follow the same structure as in createProductSchema.
 *
 * @type {Joi.ObjectSchema}
 * @property {string} [name] - Updated name of the product.
 * @property {string} [description] - Updated description of the product.
 * @property {number} [basePrice] - Updated base price.
 * @property {string} [category] - Updated category ID.
 * @property {array} [images] - Updated array of image URLs.
 * @property {array} [variants] - Updated array of variants.
 * @property {string} variants.name - Name of the variant.
 * @property {array} variants.options - Options within the variant.
 * @property {string} variants.options.value - The option value.
 * @property {number} [variants.options.priceModifier=0] - Price change for this option.
 * @property {number} [variants.options.stock=0] - Stock quantity for this option.
 * @property {string} [variants.options.sku] - Optional SKU for this option.
 * @returns {Joi.ObjectSchema} - The Joi schema for product updates.
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
 */
export const updateProductSchema = Joi.object({
    store: Joi.string().required(),
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    basePrice: Joi.number().optional(),
    category: Joi.string().optional(),
    images: Joi.array().items(Joi.string()).optional(),
    variants: Joi.array().items(
        Joi.object({
        name: Joi.string().required(),
        options: Joi.array().items(
            Joi.object({
            value: Joi.string().required(),
            priceModifier: Joi.number().default(0),
            stock: Joi.number().default(0),
            sku: Joi.string().optional()
            })
        )
        })
    ).optional()
});
