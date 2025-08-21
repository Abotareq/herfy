import Coupon from "../models/cuponModel.js";

/**
 * Get a coupon by ID.
 * @param {string} couponId
 * @returns {Promise<Object|null>}
 */
const getCouponById = async (couponId) => {
    return await Coupon.findById(couponId);
};
/** **/
const getCouponByCode = async (code) => {
    return await Coupon.findOne({ code });
};
/**
 * Check if a user has already used a coupon.
 * @param {string} couponId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
const hasUserUsedCoupon = async (couponId, userId) => {
  // Example: implement if you store coupon usage per user
  const coupon = await Coupon.findOne({
    _id: couponId,
    usedBy: userId, // assuming usedBy is an array of user IDs
  });
  return !!coupon;
};

export default {
  getCouponById,
  hasUserUsedCoupon,
  getCouponByCode
};
