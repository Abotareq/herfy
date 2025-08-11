import Joi from "joi";
import { isValidObjectId } from "./custome.validation.js";

/**
✅ Uses custom ObjectId validator to ensure valid Mongo IDs.
✅ Clean separation for create and update schemas.
✅ location.coordinates validated as [longitude, latitude].
✅ Integrates directly with your validate middleware in store.route.js.
 */

/**
 * Custom Joi validator for MongoDB ObjectId.
 * Validates whether a provided value is a valid MongoDB ObjectId.
 * Useful for schema fields that require referencing documents by their ObjectId.
 *
 * @function objectId
 * @param {string} value - The value to validate.
 * @param {object} helpers - Joi's helpers object for generating validation errors.
 * @returns {string} - Returns the original value if it is a valid ObjectId.
 * @throws {Error} - Returns a Joi validation error (any.invalid) if the value is not a valid ObjectId.
 *
 * @example
 * const schema = Joi.object({
 *   userId: Joi.string().custom(objectId).required(),
 * });
 *
 * // Usage in validation:
 * const data = { userId: "60c72b2f9b1d4c001c8e4f11" };
 * const result = schema.validate(data);
 * if (result.error) console.error(result.error);
 */
/**
 * Schema for creating a new store.
 * Validates owner, name, description, logoUrl, status, location, and policies.
 * Location must be a GeoJSON Point with valid coordinates.
 * Policies can include shipping and returns information.
 * @type {Joi.ObjectSchema}
 * @property {string} owner - The ID of the store owner (must be a valid MongoDB ObjectId).
 * @property {string} name - The name of the store (3-100 characters).
 * @property {string} description - A brief description of the store (minimum 10 characters).
 * @property {string} [logoUrl] - Optional URL for the store logo.
 * @property {string} [status] - The status of the store (one of: pending, approved, rejected, suspended).
 * @property {object} [location] - Optional location information.
 * @property {string} location.type - Must be "Point" for GeoJSON.
 * @property {array} location.coordinates - An array of two numbers representing longitude and latitude.
 * @property {object} [policies] - Optional policies for the store.
 * @property {string} [policies.shipping] - Shipping policy.
 * @property {string} [policies.returns] - Returns policy.
 * @returns {Joi.ObjectSchema} - The Joi schema for store creation.
 * @example const storeData = {
    owner: "60c72b2f9b1d4c001c8e4f11", // valid ObjectId of an existing user

    name: "My Awesome Store",

    description: "This is my awesome store for handmade crafts and natural skincare products.",

    logoUrl: "https://example.com/store-logo.png",

    status: "pending", // optional, defaults to pending

    location: {
        type: "Point",
        coordinates: [31.2357, 30.0444], // longitude, latitude (example: Cairo coordinates)
    },

    policies: {
        shipping: "We ship within 2-3 business days.",
        returns: "Returns accepted within 14 days in original condition.",
    },
    };

 */
export const createStoreSchema = Joi.object({
    owner: Joi.string()
        .optional()
        .custom((value, helpers) => {
        if (!isValidObjectId(value)) {
            return helpers.error("any.invalid");
        }
        return value;
        }, "ObjectId Validation").optional(),
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().min(10).required(),
    logoUrl: Joi.string().uri().optional(),
    status: Joi.string().valid("pending", "approved", "rejected", "suspended").optional(),
    location: Joi.object({
        type: Joi.string().valid("Point").required(),
        coordinates: Joi.array().items(
        Joi.number().min(-180).max(180),
        Joi.number().min(-90).max(90)
        ).length(2).required(),
    }).optional(),
    address: Joi.object({
        city: Joi.string().required().trim(),
        postalCode: Joi.number().required(),
        street: Joi.string().required().trim(),
    }).required(),
    policies: Joi.object({
        shipping: Joi.string().optional(),
        returns: Joi.string().optional(),
    }).optional(),
});

/**
 * Schema for updating a store.
 * Validates optional fields including owner, name, description, logoUrl, status, location, and policies.
 * Location must be a GeoJSON Point with valid coordinates if provided.
 * Policies can include shipping and returns information.
 * Unlike createStoreSchema, all fields here are optional to support partial updates.
 * @type {Joi.ObjectSchema}
 * @property {string} [owner] - The ID of the store owner (must be a valid MongoDB ObjectId).
 * @property {string} [name] - The name of the store (3-100 characters).
 * @property {string} [description] - A brief description of the store (minimum 10 characters).
 * @property {string} [logoUrl] - Optional URL for the store logo.
 * @property {string} [status] - The status of the store (one of: pending, approved, rejected, suspended).
 * @property {object} [location] - Optional location information.
 * @property {string} location.type - Must be "Point" for GeoJSON if location is provided.
 * @property {array} location.coordinates - An array of two numbers representing longitude and latitude.
 * @property {object} [policies] - Optional policies for the store.
 * @property {string} [policies.shipping] - Shipping policy.
 * @property {string} [policies.returns] - Returns policy.
 * @returns {Joi.ObjectSchema} - The Joi schema for store updates.
 * @example const storeUpdateData = {
    name: "Updated Store Name",
    description: "Updated description for the store with more than ten characters.",
    logoUrl: "https://example.com/new-logo.png",
    status: "approved",
    location: {
        type: "Point",
        coordinates: [31.2357, 30.0444],
    },
    policies: {
        shipping: "Updated shipping policy here.",
        returns: "Updated returns policy here.",
    },
  };
 */
export const updateStoreSchema = Joi.object({
    owner: Joi.string().custom((value, helpers) => {
        if (!isValidObjectId(value)) {
            return helpers.error("any.invalid");
        }
        return value;
        }, "ObjectId Validation").optional(),
    name: Joi.string().trim().min(3).max(100).optional(),
    description: Joi.string().trim().min(10).optional(),
    logoUrl: Joi.string().uri().optional(),
    status: Joi.string().valid("pending", "approved", "rejected", "suspended").optional(),
    location: Joi.object({
        type: Joi.string().valid("Point").required(),
        coordinates: Joi.array().items(
        Joi.number().min(-180).max(180),
        Joi.number().min(-90).max(90)
        ).length(2).required(),
    }).optional(),
    address: Joi.object({
        city: Joi.string().required().trim(),
        postalCode: Joi.number().required(),
        street: Joi.string().required().trim(),
    }).optional(),
    policies: Joi.object({
        shipping: Joi.string().optional(),
        returns: Joi.string().optional(),
    }).optional(),
});
