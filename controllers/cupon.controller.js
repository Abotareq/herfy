import Coupon from '../models/cuponModel.js';
import StatusCodes from '../utils/status.codes.js';
import httpStatus from '../utils/http.status.message.js';
// get All cupons
// admin can get all coupons to see them
export const getAllCupons = async(req, res) => {
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
        res.status(StatusCodes.UNAUTHORIZED).json({data: {status: err, message: "unothorized user"}})
    }
}
// add new cupon
// VENDOR can add new one
export const addCupon = async(req, res) => {
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
        res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.FAIL, data: {message: "Failed to add new Cupon"}})
    }
}
// get cupon by id
// admin can get spacific coupon
export const getCuponById = async(req, res) => {
    try {
        const cuponId = req.params.id
        const cupon = await Coupon.findById(cuponId);
        if(!cupon){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: 'Not found coupon'}})
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {cupon}})
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.FAIL, data: {message: "Failed"}})
    }
}
// update coupon by the vendor
export const updateCoupon = async(req, res) => {
    try {
        const cuponId = req.params.id;
        const updatedcoupon = await Coupon.findByIdAndUpdate(cuponId, {$set: {...req.body}}, {new: true});
        if(!updateCoupon){
            res.status(StatusCodes.NOT_FOUND).json({status:httpStatus.FAIL, data: {message: "not found coupon"}})
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {updatedcoupon}})
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({status: httpStatus.FAIL, data: {message: "Unauthorized User"}})
    }
}
// delete coupon (Admin , vendor)
export const deleteCoupon = async(req, res) => {
   try {
    const cuponId = req.params.id;
    const deletedCoupon = await Coupon.findByIdAndDelete(cuponId);
    if(!deletedCoupon){
        res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.ERROR, data: {message: 'No Coupon found to delete'}})
    }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {message: "Coupon deleted Succefully"}})
   } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({status: httpStatus.FAIL, data: {message: "Unauthorized User"}})
   }
}