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
        }, "ObjectId Validation").optional().message("Invalid ObjectId"),
    name: Joi.string().trim().min(3).max(100).required().messages({
        "string.base": `"name" should be a type of 'text'`,
        "string.empty": `"name" cannot be an empty field`,
        "string.min": `"name" should have a minimum length of {#limit}`,
        "string.max": `"name" should have a maximum length of {#limit}`,
        "any.required": `"name" is a required field`
    }),
    description: Joi.string().trim().min(10).required().messages({
        "string.base": `"description" should be a type of 'text'`,
        "string.empty": `"description" cannot be an empty field`,
        "string.min": `"description" should have a minimum length of {#limit}`,
        "any.required": `"description" is a required field`
    }),
    logoUrl: Joi.string().optional().messages({
        "string.base": `"logoUrl" should be a type of 'text'`,
        "string.empty": `"logoUrl" cannot be an empty field`,
    }),
    status: Joi.string().valid("pending", "approved", "rejected", "suspended").optional().messages({
        "string.base": `"status" should be a type of 'text'`,
        "any.only": `"status" must be one of {#valids}`,
    }),
    location: Joi.object({
        type: Joi.string().valid("Point").optional().messages({
            "string.base": `"location.type" should be a type of 'text'`,
            "any.only": `"location.type" must be one of {#valids}`,
            "any.required": `"location.type" is a required field`
        }),
        coordinates: Joi.array().items(
            Joi.number().min(-180).max(180).messages({
                "number.base": `"location.coordinates[0]" should be a type of 'number'`,
                "number.min": `"location.coordinates[0]" must be at least {#limit}`,
                "number.max": `"location.coordinates[0]" must be less than or equal to {#limit}`,
            }),
            Joi.number().min(-90).max(90).messages({
                "number.base": `"location.coordinates[1]" should be a type of 'number'`,
                "number.min": `"location.coordinates[1]" must be at least {#limit}`,
                "number.max": `"location.coordinates[1]" must be less than or equal to {#limit}`,
            })
        ).length(2).optional().messages({
            "array.base": `"location.coordinates" should be a type of 'array'`,
            "array.length": `"location.coordinates" must have exactly 2 items`,
        }),
    }).optional(),
    address: Joi.object({
        city: Joi.string().required().trim(),
        postalCode: Joi.number().required(),
        street: Joi.string().required().trim(),
    }).required().messages({
        "object.base": `"address" should be a type of 'object'`,
        "any.required": `"address" is a required field`
    }),
    policies: Joi.object({
        shipping: Joi.string().optional().messages({
            "string.base": `"policies.shipping" should be a type of 'text'`,
            "string.empty": `"policies.shipping" cannot be an empty field`,
        }),
        returns: Joi.string().optional().messages({
            "string.base": `"policies.returns" should be a type of 'text'`,
            "string.empty": `"policies.returns" cannot be an empty field`,
        }),
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
    }, "ObjectId Validation").optional().messages({
        "any.invalid": `"owner" must be a valid ObjectId`,
    }),
    name: Joi.string().trim().min(3).max(100).optional().messages({
        "string.base": `"name" should be a type of 'text'`,
        "string.empty": `"name" cannot be an empty field`,
        "string.min": `"name" should have a minimum length of {#limit}`,
        "string.max": `"name" should have a maximum length of {#limit}`,
    }),
    description: Joi.string().trim().min(10).optional().messages({
        "string.base": `"description" should be a type of 'text'`,
        "string.empty": `"description" cannot be an empty field`,
        "string.min": `"description" should have a minimum length of {#limit}`,
    }),
    logoUrl: Joi.string().optional().messages({
        "string.base": `"logoUrl" should be a type of 'text'`,
        "string.empty": `"logoUrl" cannot be an empty field`,
    }),
    status: Joi.string().valid("pending", "approved", "rejected", "suspended").optional().messages({
        "string.base": `"status" should be a type of 'text'`,
        "any.only": `"status" must be one of {#valids}`,
    }),
    location: Joi.object({
        type: Joi.string().valid("Point").required().messages({
            "string.base": `"location.type" should be a type of 'text'`,
            "any.only": `"location.type" must be one of {#valids}`,
            "any.required": `"location.type" is a required field`,
        }),
        coordinates: Joi.array().items(
            Joi.number().min(-180).max(180).messages({
                "number.base": `"location.coordinates[0]" should be a type of 'number'`,
                "number.min": `"location.coordinates[0]" must be at least {#limit}`,
                "number.max": `"location.coordinates[0]" must be less than or equal to {#limit}`,
            }),
            Joi.number().min(-90).max(90).messages({
                "number.base": `"location.coordinates[1]" should be a type of 'number'`,
                "number.min": `"location.coordinates[1]" must be at least {#limit}`,
                "number.max": `"location.coordinates[1]" must be less than or equal to {#limit}`,
            })
        ).length(2).required().messages({
            "array.base": `"location.coordinates" should be a type of 'array'`,
            "array.length": `"location.coordinates" must have exactly 2 items`,
        }),
    }).optional(),
    address: Joi.object({
        city: Joi.string().required().trim().messages({
            "string.base": `"address.city" should be a type of 'text'`,
            "string.empty": `"address.city" cannot be an empty field`,
            "any.required": `"address.city" is a required field`,
        }),
        postalCode: Joi.number().required().messages({
            "number.base": `"address.postalCode" should be a type of 'number'`,
            "any.required": `"address.postalCode" is a required field`,
        }),
        street: Joi.string().required().trim().messages({
            "string.base": `"address.street" should be a type of 'text'`,
            "string.empty": `"address.street" cannot be an empty field`,
            "any.required": `"address.street" is a required field`,
        }),
    }).optional().messages({
        "object.base": `"address" should be a type of 'object'`,
    }),
    policies: Joi.object({
        shipping: Joi.string().optional().messages({
            "string.base": `"policies.shipping" should be a type of 'text'`,
            "string.empty": `"policies.shipping" cannot be an empty field`,
        }),
        returns: Joi.string().optional().messages({
            "string.base": `"policies.returns" should be a type of 'text'`,
            "string.empty": `"policies.returns" cannot be an empty field`,
        }),
    }).optional(),
});
