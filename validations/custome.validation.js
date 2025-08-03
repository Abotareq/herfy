import mongoose from "mongoose";
/**
 * Check if the value is a valid MongoDB ObjectId
 * @param {string} value - The value to validate
 * @returns {boolean}
 */
export const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

/**
 * Custom validation for checking if a value is a valid URL.
 * @param {string} value - The URL string to validate
 * @returns {boolean}
 */
export const isValidURL = (value) => {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Custom validation for checking if a value is a valid latitude and longitude.
 * @param {Array} coordinates - [longitude, latitude]
 * @returns {boolean}
 */
export const isValidCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  const [lng, lat] = coordinates;
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
};
