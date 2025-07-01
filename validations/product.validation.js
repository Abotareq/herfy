import Joi from "joi";

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

export const updateProductSchema = Joi.object({
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
