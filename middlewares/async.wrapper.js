/**
 * Async wrapper to handle errors in async route handlers.
 * Wraps an async function and forwards any errors to Express error middleware.
 *
 * @param {Function} func - The async route handler function (req, res, next) => Promise
 * @returns {Function} A new function wrapping the original async function with try-catch.
 *
 * @example
 * router.get('/example', asyncWrapper(async (req, res, next) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */
const asyncWrapper = (func) => {
    return async (req, res, next) => {
        try {
            await func(req, res, next);
        } catch (err) {
            next(err);
        }
    }
};

export default asyncWrapper;    