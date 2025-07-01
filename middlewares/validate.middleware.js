import StatusCodes from "../utils/statusCodes.js";
import JSEND_STATUS from "../utils/httpStatusMessages.js";

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