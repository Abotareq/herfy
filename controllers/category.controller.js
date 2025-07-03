import Category from "../models/categoryModel.js";
import StatusCodes from '../utils/status.codes.js';
import httpStatus from '../utils/http.status.message.js'

// get all category
export const getAllCategoty = async(req, res) => {
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
    res.status(StatusCodes.ACCEPTED).json({status: httpStatus.SUCCESS, data: {allCategories}})
    } catch (err) {
        res.status(StatusCodes.UNAUTHORIZED).json({data: {status: err, message: "unothorized user"}})   
    }
}
// add category
export const addNewCategory = async (req, res) => {
    try {
        const {name} = req.body;
        const newCategory = await Category.create({
            name
            //parent
            // handle image from multer
        })
        res.status(StatusCodes.ACCEPTED).json({status: httpStatus.SUCCESS, data:{newCategory}})
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({status: error,data: {message: "Failed to add new Category"}})
    }
}
// get category by id
export const getCategotyById = async(req, res) => {
    try {
        const catId = req.params.id
    const category = await Category.findById(catId);
    if(category){
        res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.ERROR, data: {message: 'Not match Category'}});
    }
    res.status(StatusCodes.ACCEPTED).json({status: httpStatus.SUCCESS, data:{category}})
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({data: {status: error, message: 'failed to get category'}})
    }
}
export const deleteCategory = async(req, res) => {
    const categoryId = req.params.id
    try {
        const deletedCategory = Category.findByIdAndDelete(categoryId)
        if(!deletedCategory){
            res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.ERROR, data:{message: "Can't get this category"}});
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data:{message: "The Category deleted"}})
    } catch (error) {
         res.status(StatusCodes.UNAUTHORIZED).json({data: {status: error, message: 'failed to get category'}})
    }
}