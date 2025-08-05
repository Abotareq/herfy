import Category from "../models/categoryModel.js";
import StatusCodes from '../utils/status.codes.js';
import httpStatus from '../utils/http.status.message.js'

// get all category
export const getAllCategoty = async(req, res, next) => {
    // pagination 
    try {
    const query = req.query;
    const limit = query.limit;
    const page = query.page
    const end = (page - 1) * limit
    const allCategories = await Category.find().limit(limit).skip(end);
    if(!allCategories){
        res.status(StatusCodes.UNAUTHORIZED).json({status: httpStatus.ERROR, data:{message: "Unothoriaed"}})
    }
    res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {allCategories}})
    } catch (err) {
       next(next(new ErrorResponse(err, StatusCodes.UNAUTHORIZED)))
    }
}
// add category
export const addNewCategory = async (req, res, next) => {
    try {
        const {name, image} = req.body;
        const newCategory = await Category.create({
            name,
            image 
        })
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{newCategory}})
    } catch (error) {
       next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
    }
}
// get category by id
export const getCategotyById = async(req, res, next) => {
    try {
        const catId = req.params.id
        const category = await Category.findById(catId);
        if(!category){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.ERROR, data: {message: 'Not match Category'}});
        }
            res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{category}})
        } catch (error) {
            next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
        }
}
export const deleteCategory = async(req, res, next) => {
    const categoryId = req.params.id
    try {
        const deletedCategory = Category.findByIdAndDelete(categoryId)
        if(!deletedCategory){
            res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.ERROR, data:{message: "Can't get this category"}});
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{message: "The Category deleted"}})
    } catch (error) {
         next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)))
    }
}
export const UpdateCategory = async (req, res, next) => {
    // if(!req.user.role || req.user.role !== 'ADMIN'){
    //     res.json(StatusCodes.UNAUTHORIZED).json({data: {message: 'UNAUTHORIZED User'}})
    // }
    try {
        const categoryId = req.params.id;
        const UpdatedCategory =await Category.findByIdAndUpdate(categoryId,
            {$set: {...req.body}},
            {new: true}
        );
        if(!UpdatedCategory){
            res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.ERROR, data:{message: "Can't get this category"}});
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{UpdatedCategory}})
    } catch (error) {
       return next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
    }
}