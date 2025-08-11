// search category by name
// search coupon by code
// search user by userName
// search vendor by Name
import httpStatus from '../utils/http.status.message.js';
import StatusCodes from '../utils/status.codes.js';
import Category from "../models/categoryModel.js";
import Coupon from '../models/cuponModel.js';
import User from '../models/userModel.js';

import pkg from 'joi'       // osama saad
const { options } = pkg;    // osama saad

export const searchCategoryByName = async (req, res, next) => {
  const { name } = req.query;

  if (!name || name.trim() === '') {
    return next(new ErrorResponse("Please Enter something to start search", StatusCodes.BAD_REQUEST));
  }

  try {
    const category = await Category.find({
      name: { $regex: name, $options: 'i' },
    });

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { category },
    });

  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
export const searchCouponByCode = async (req, res, next) => {
    const searchQuery = req.query;
    const code = searchQuery.code
    if(!code || code.trim === ''){
         return next(new ErrorResponse('Please Enter coupon Id', StatusCodes.UNAUTHORIZED))
    }
    try {
        // find code by every match in the data base, 'i' to make it case sestive
        const coupon = await Coupon.find({code: {$regix: code, $options: 'i'}})
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{coupon}})
    } catch (error) {
        next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED))
    }
}
export const searchByRoleByAdmin = async (req, res, next) => {
   const admin = req.user;
   if(!admin){
    return next(new ErrorResponse("Unauthorized User", StatusCodes.UNAUTHORIZED))
   }
    const name = req.query;
   
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
export const searchUserByName = async(req, res, next) => {
  const admin = req.user;
  if(!admin){
    return next(new ErrorResponse("Unauthorized User", StatusCodes.UNAUTHORIZED))
  }
  try {
    const {userName} = req.query;
    if(!userName || userName.trim() === ''){
      return res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.FAIL,
              data: {message: "Please enter a search element"}
            })
    }
    const result = await User.find({userName: {$regix: userName, options: 'i'}}).populate(userName)
    res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{result}})
  } catch (error) {
    next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
  }
}
// export const searchRole = async (req, res, next) => {
//     const Query = req.query;
//     const name = Query.name;
//    if(!name || name.trim() === ''){
//             return res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.FAIL,
//                 data: {message: "Please enter a search element"}
//             });
//         }
//    try {
//     const result = await User.find({role: searchRole, name:{$regex: name, $options: 'i'}});
//     res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{result}})
//    } catch (error) {
//     next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
//    }
// }