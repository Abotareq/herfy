import StatusCodes from "../utils/status.codes.js";
import JSEND_STATUS from "../utils/http.status.message.js";

/**
 * Middleware to validate request body against a Joi schema.
 * If validation fails, responds with 400 Bad Request and error details.
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @returns {import('express').RequestHandler} Express middleware function
 *
 * @example
 * router.post('/api/products', validate(createProductSchema), productController.createProduct);
 */

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
        const errorDetails = error.details.map(d => d.message);
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: JSEND_STATUS.FAIL,
            message: "Validation Error",
            data: errorDetails
        });
        }

        next();
    };
};

export default validate;



//*! osama 
export const validateParams = (schema) => {
    return (req, res, next) => {
      console.log("hi from val")
      const { error } = schema.validate(req.params, { abortEarly: false });
      if (error) {
        return res.status(400).json({
          status: "fail",
          message: "Validation Error",
          data: error.details.map((err) => err.message),
        });
      }
      next();
    };
  };