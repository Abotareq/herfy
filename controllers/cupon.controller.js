import Coupon from '../models/cuponModel.js';
import StatusCodes from '../utils/status.codes.js';
import httpStatus from '../utils/http.status.message.js';
// get All cupons
// admin can get all coupons to see them
export const getAllCupons = async(req, res, next) => {
    try {
        const query = req.query;
        const page = query.page;
        const limit = query.limit;
        const end = (page - 1)*limit
        const allCupons = await Coupon.find().populate('code').limit(limit).skip(end);
        if(!allCupons){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.ERROR, data:{message: "No cupons found"}})
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{allCupons}})
    } catch (error) {
       next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
    }
}
// add new cupon
// VENDOR can add new one
export const addCupon = async(req, res, next) => {
    try {
        const {code, type, value, minCartTotal, maxDiscount, expiryDate, usageLimit, usedCount, active} = req.body;
    const newCupon = await Coupon.create({
        code,
        type,
        value,
        minCartTotal,
        maxDiscount,
        expiryDate,
        usageLimit,
        usedCount,
        active
    })
    res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, date: {newCupon}})
    } catch (error) {
       next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
    }
}
// get cupon by id
// admin can get spacific coupon
export const getCuponById = async(req, res, next) => {
    try {
        const cuponId = req.params.id
        const cupon = await Coupon.findById(cuponId);
        if(!cupon){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: 'Not found coupon'}})
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {cupon}})
    } catch (error) {
       next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
    }
}
// update coupon by the vendor
export const updateCoupon = async(req, res, next) => {
    try {
        const cuponId = req.params.id;
        const updatedcoupon = await Coupon.findByIdAndUpdate(cuponId, {$set: {...req.body}}, {new: true});
        if(!updateCoupon){
            res.status(StatusCodes.NOT_FOUND).json({status:httpStatus.FAIL, data: {message: "not found coupon"}})
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {updatedcoupon}})
    } catch (error) {
      next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
    }
}
// delete coupon (Admin , vendor)
export const deleteCoupon = async(req, res, next) => {
    if (!req.user.role || req.user.role !== 'ADMIN'){
        res.json(StatusCodes.UNAUTHORIZED).json({data: {message: 'UNAUTHORIZED User'}}) 
    }
   try {
    const cuponId = req.params.id;
    const deletedCoupon = await Coupon.findByIdAndDelete(cuponId);
    if(!deletedCoupon){
        res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.ERROR, data: {message: 'No Coupon found to delete'}})
    }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {message: "Coupon deleted Succefully"}})
   } catch (error) {
       next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
   }
}
//delete coupon by vendor
export const deleteCouponByVendor = async (req, res, next) => {
    // make it by code not id
    if (!req.user.role || req.user.role !== 'VENDOR'){
       return res.json(StatusCodes.UNAUTHORIZED).json({data: {message: 'UNAUTHORIZED User'}})
    }
    try {
        const couponId = req.params.id;
        const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
        if(!deletedCoupon){
            return res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.ERROR, data: {message: 'No Coupon found to delete'}})
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {message: "Coupon deleted Succefully"}})
    } catch (error) {
       next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
    }
}