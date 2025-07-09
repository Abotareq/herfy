/**
 * @fileoverview Defines commonly used HTTP status codes for API responses.
 */

/**
 * HTTP Status Codes.
 *
 * Provides a set of constants representing standard HTTP status codes.
 *
 * @readonly
 * @enum {number}
 *
 * @property {number} CONTINUE 100 Continue
 * @property {number} SWITCHING_PROTOCOLS 101 Switching Protocols
 * @property {number} PROCESSING 102 Processing (WebDAV)
 *
 * @property {number} OK 200 OK
 * @property {number} CREATED 201 Created
 * @property {number} ACCEPTED 202 Accepted
 * @property {number} NON_AUTHORITATIVE_INFORMATION 203 Non-Authoritative Information
 * @property {number} NO_CONTENT 204 No Content
 * @property {number} RESET_CONTENT 205 Reset Content
 * @property {number} PARTIAL_CONTENT 206 Partial Content
 * @property {number} MULTI_STATUS 207 Multi-Status (WebDAV)
 * @property {number} ALREADY_REPORTED 208 Already Reported (WebDAV)
 * @property {number} IM_USED 226 IM Used
 *
 * @property {number} MULTIPLE_CHOICES 300 Multiple Choices
 * @property {number} MOVED_PERMANENTLY 301 Moved Permanently
 * @property {number} FOUND 302 Found
 * @property {number} SEE_OTHER 303 See Other
 * @property {number} NOT_MODIFIED 304 Not Modified
 * @property {number} USE_PROXY 305 Use Proxy
 * @property {number} TEMPORARY_REDIRECT 307 Temporary Redirect
 * @property {number} PERMANENT_REDIRECT 308 Permanent Redirect
 *
 * @property {number} BAD_REQUEST 400 Bad Request
 * @property {number} UNAUTHORIZED 401 Unauthorized
 * @property {number} PAYMENT_REQUIRED 402 Payment Required
 * @property {number} FORBIDDEN 403 Forbidden
 * @property {number} NOT_FOUND 404 Not Found
 * @property {number} METHOD_NOT_ALLOWED 405 Method Not Allowed
 * @property {number} NOT_ACCEPTABLE 406 Not Acceptable
 * @property {number} PROXY_AUTHENTICATION_REQUIRED 407 Proxy Authentication Required
 * @property {number} REQUEST_TIMEOUT 408 Request Timeout
 * @property {number} CONFLICT 409 Conflict
 * @property {number} GONE 410 Gone
 * @property {number} LENGTH_REQUIRED 411 Length Required
 * @property {number} PRECONDITION_FAILED 412 Precondition Failed
 * @property {number} PAYLOAD_TOO_LARGE 413 Payload Too Large
 * @property {number} URI_TOO_LONG 414 URI Too Long
 * @property {number} UNSUPPORTED_MEDIA_TYPE 415 Unsupported Media Type
 * @property {number} RANGE_NOT_SATISFIABLE 416 Range Not Satisfiable
 * @property {number} EXPECTATION_FAILED 417 Expectation Failed
 * @property {number} IM_A_TEAPOT 418 I'm a teapot
 * @property {number} MISDIRECTED_REQUEST 421 Misdirected Request
 * @property {number} UNPROCESSABLE_ENTITY 422 Unprocessable Entity
 * @property {number} LOCKED 423 Locked
 * @property {number} FAILED_DEPENDENCY 424 Failed Dependency
 * @property {number} TOO_EARLY 425 Too Early
 * @property {number} UPGRADE_REQUIRED 426 Upgrade Required
 * @property {number} PRECONDITION_REQUIRED 428 Precondition Required
 * @property {number} TOO_MANY_REQUESTS 429 Too Many Requests
 * @property {number} REQUEST_HEADER_FIELDS_TOO_LARGE 431 Request Header Fields Too Large
 * @property {number} UNAVAILABLE_FOR_LEGAL_REASONS 451 Unavailable For Legal Reasons
 *
 * @property {number} INTERNAL_SERVER_ERROR 500 Internal Server Error
 * @property {number} NOT_IMPLEMENTED 501 Not Implemented
 * @property {number} BAD_GATEWAY 502 Bad Gateway
 * @property {number} SERVICE_UNAVAILABLE 503 Service Unavailable
 * @property {number} GATEWAY_TIMEOUT 504 Gateway Timeout
 * @property {number} HTTP_VERSION_NOT_SUPPORTED 505 HTTP Version Not Supported
 * @property {number} VARIANT_ALSO_NEGOTIATES 506 Variant Also Negotiates
 * @property {number} INSUFFICIENT_STORAGE 507 Insufficient Storage (WebDAV)
 * @property {number} LOOP_DETECTED 508 Loop Detected (WebDAV)
 * @property {number} NOT_EXTENDED 510 Not Extended
 * @property {number} NETWORK_AUTHENTICATION_REQUIRED 511 Network Authentication Required
 *
 * @example
 * import StatusCodes from './statusCodes.js';
 * res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid input" });
 */
const StatusCodes = {
  // 1xx Informational
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102,

  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFORMATION: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  MULTI_STATUS: 207,
  ALREADY_REPORTED: 208,
  IM_USED: 226,

  // 3xx Redirection
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  USE_PROXY: 305,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  IM_A_TEAPOT: 418,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511,
};

export default StatusCodes;
