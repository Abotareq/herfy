class AppErrors extends Error {
    constructor(message, statusCode, httpStatusText) {
        super(message);
        this.statusCode = statusCode || 500;
        this.httpStatusText = httpStatusText || "error";
        Error.captureStackTrace(this, this.constructor);
    }

    static createError(message, statusCode = 500, httpStatusText = "error") {
        return new AppErrors(message, statusCode, httpStatusText);
    }

    static badRequest(message = "Bad Request") {
        return new AppErrors(message, 400, "fail");
    }

    static unauthorized(message = "Unauthorized") {
        return new AppErrors(message, 401, "fail");
    }

    static forbidden(message = "Forbidden") {
        return new AppErrors(message, 403, "fail");
    }

    static notFound(message = "Not Found") {
        return new AppErrors(message, 404, "fail");
    }

    static conflict(message = "Conflict") {
        return new AppErrors(message, 409, "fail");
    }

    static unprocessableEntity(message = "Unprocessable Entity") {
        return new AppErrors(message, 422, "fail");
    }

    static internal(message = "Internal Server Error") {
        return new AppErrors(message, 500, "error");
    }

    static serviceUnavailable(message = "Service Unavailable") {
        return new AppErrors(message, 503, "error");
    }
}

export default AppErrors;