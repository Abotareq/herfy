/**
 * @fileoverview Defines the AppErrors class for standardized API error handling.
 * Provides static factory methods for common HTTP error responses.
 */

/**
  * Custom application error class extending the native Error.
  * Includes statusCode and httpStatusText for standardized API error responses.
  *
  * @extends Error
  */
class AppErrors extends Error {
    /**
     * Create an application error.
     *
     * @param {string} message - The error message.
     * @param {number} [statusCode=500] - HTTP status code associated with the error.
     * @param {string} [httpStatusText="error"] - Status text ('fail' or 'error').
     */
    constructor(message, statusCode, httpStatusText) {
        super(message);
        this.statusCode = statusCode || 500;
        this.httpStatusText = httpStatusText || "error";
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Create a custom error with specified message, status code, and status text.
     *
     * @param {string} message - Error message.
     * @param {number} [statusCode=500] - HTTP status code.
     * @param {string} [httpStatusText="error"] - Status text.
     * @returns {AppErrors} - New AppErrors instance.
     *
     * @example
     * throw AppErrors.createError("Custom error", 418, "fail");
     */
    static createError(message, statusCode = 500, httpStatusText = "error") {
        return new AppErrors(message, statusCode, httpStatusText);
    }

    /**
     * 400 Bad Request error.
     *
     * @param {string} [message="Bad Request"] - Error message.
     * @returns {AppErrors}
     */
    static badRequest(message = "Bad Request") {
        return new AppErrors(message, 400, "fail");
    }

    /**
     * 401 Unauthorized error.
     *
     * @param {string} [message="Unauthorized"] - Error message.
     * @returns {AppErrors}
     */
    static unauthorized(message = "Unauthorized") {
        return new AppErrors(message, 401, "fail");
    }

    /**
     * 403 Forbidden error.
     *
     * @param {string} [message="Forbidden"] - Error message.
     * @returns {AppErrors}
     */
    static forbidden(message = "Forbidden") {
        return new AppErrors(message, 403, "fail");
    }

    /**
     * 404 Not Found error.
     *
     * @param {string} [message="Not Found"] - Error message.
     * @returns {AppErrors}
     */
    static notFound(message = "Not Found") {
        return new AppErrors(message, 404, "fail");
    }

    /**
     * 409 Conflict error.
     *
     * @param {string} [message="Conflict"] - Error message.
     * @returns {AppErrors}
     */
    static conflict(message = "Conflict") {
        return new AppErrors(message, 409, "fail");
    }

    /**
     * 422 Unprocessable Entity error.
     *
     * @param {string} [message="Unprocessable Entity"] - Error message.
     * @returns {AppErrors}
     */
    static unprocessableEntity(message = "Unprocessable Entity") {
        return new AppErrors(message, 422, "fail");
    }

    /**
     * 500 Internal Server Error.
     *
     * @param {string} [message="Internal Server Error"] - Error message.
     * @returns {AppErrors}
     */
    static internal(message = "Internal Server Error") {
        return new AppErrors(message, 500, "error");
    }

    /**
     * 503 Service Unavailable error.
     *
     * @param {string} [message="Service Unavailable"] - Error message.
     * @returns {AppErrors}
     */
    static serviceUnavailable(message = "Service Unavailable") {
        return new AppErrors(message, 503, "error");
    }
}

export default AppErrors;
