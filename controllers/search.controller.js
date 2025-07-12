// search category by name
// search coupon by code
// search user by userName
// search vendor by Name
import httpStatus from '../utils/http.status.message.js';
import StatusCodes from '../utils/status.codes.js';
import Category from "../models/categoryModel.js";
import Coupon from '../models/cuponModel.js';
import User from '../models/userModel.js';
import userRole from './../utils/user.role.js';

export const searchCategoryByName = async (req, res, next) => {
    const searchQuery = req.query;
    const name = searchQuery.name;

    if(!name || name.trim() === ''){
        res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.ERROR, 
            data:{message: "Please enter category name to start search"}})
    }
    try {
        const category = await Category.find({name:{$regex: name, $options: 'i'}})
        res.status(StatusCodes.OK).json({status:httpStatus.SUCCESS, data:{category}})
    } catch (error) {
        next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
    }
}
export const searchCouponByCode = async (req, res, next) => {
    const searchQuery = req.query;
    const code = searchQuery.code
    if(!code || code.trim === ''){
         res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.ERROR, 
            data:{message: "Please enter coupon code to start search"}})
    }
    try {
        // find code by every match in the data base, 'i' to make it case sestive
        const coupon = await Coupon.find({code: {$regix: code, $options: 'i'}})
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{coupon}})
    } catch (error) {
        next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
    }
}
export const searchByRoleByAdmin = async (req, res, next) => {
   const searchRole = req.user.role;
   const name = req.query;
   if(!searchRole || req.user.role !== userRole.ADMIN){
    return res.status(StatusCodes.UNAUTHORIZED).json({status: httpStatus.ERROR,
        data: {message: "UNAUTHORIZED user"}
    })
   }
   try {
        if(!name || name.trim() === ''){
            return res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.FAIL,
                data: {message: "Please enter a search element"}
            })
        }
        const result = await User.find({name: {$regix: name, $options: 'i'}}).populate(role)
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{result}})
   } catch (error) {
    next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
   }
}
export const searchRole = async (req, res, next) => {
    const searchRole = req.user.role;
    const Query = req.query;
    const name = Query.name;
    if(!searchRole || ![userRole.VENDOR, userRole.CUSTOMER].includes(searchRole)){
    return res.status(StatusCodes.UNAUTHORIZED).json({status: httpStatus.ERROR,
        data: {message: "UNAUTHORIZED user"}
    });
   }
   if(!name || name.trim() === ''){
            return res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.FAIL,
                data: {message: "Please enter a search element"}
            });
        }
   try {
    const result = await User.find({role: searchRole, name:{$regex: name, $options: 'i'}});
    res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{result}})
   } catch (error) {
    next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
   }
}