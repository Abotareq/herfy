
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Maintain proper stack trace for where our error was thrown (only in dev mode)
    Error.captureStackTrace(this, this.constructor);
  }
}
export default ErrorResponse;
