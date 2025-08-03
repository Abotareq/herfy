/**
 * @fileoverview Defines JSEND status constants for standardized API responses.
 * Reference: https://github.com/omniti-labs/jsend
 */

/**
 * JSEND status constants.
 *
 * @readonly
 * @enum {string}
 *
 * @property {string} SUCCESS - Indicates a successful response.
 * @property {string} FAIL - Indicates a failure due to client-side issues (e.g. validation errors).
 * @property {string} ERROR - Indicates a server-side error preventing success.
 *
 * @example
 * import JSEND_STATUS from './jsendStatus.js';
 *
 * res.json({
 *   status: JSEND_STATUS.SUCCESS,
 *   data: { user: userData }
 * });
 */
const JSEND_STATUS = {
  SUCCESS: "success",
  FAIL: "fail",
  ERROR: "error",
};

export default JSEND_STATUS;
