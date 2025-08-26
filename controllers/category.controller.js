import Category from "../models/categoryModel.js";
import StatusCodes from "../utils/status.codes.js";
import httpStatus from "../utils/http.status.message.js";
import ErrorResponse from "../utils/error-model.js";
// get all category
export const getAllCategoty = async (req, res, next) => {
  // pagination
  try {
    const query = req.query;
    const limit = query.limit;
    const page = query.page;
    const end = (page - 1) * limit;
    const allCategories = await Category.find().limit(limit).skip(end);

    if (!allCategories) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ status: httpStatus.ERROR, data: { message: "Unothoriaed" } });
    }
    res
      .status(StatusCodes.OK)
      .json({ status: httpStatus.SUCCESS, data: { allCategories } });
  } catch (err) {
    next(next(new ErrorResponse(err, StatusCodes.UNAUTHORIZED)));
  }
};
// add category
export const addNewCategory = async (req, res, next) => {
  try {
    const data = req.body;
    if (req.file) {
      console.log(req.file);
      data.image = req.file.path;
    }
    const newCategory = await Category.create(data);
    res
      .status(StatusCodes.OK)
      .json({ status: httpStatus.SUCCESS, data: { newCategory } });
  } catch (error) {
    next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)));
  }
};
// get category by id
export const getCategotyById = async (req, res, next) => {
  try {
    const catId = req.params.id;
    const category = await Category.findById(catId);
    if (!category) {
      res.status(StatusCodes.NOT_FOUND).json({
        status: httpStatus.ERROR,
        data: { message: "Not match Category" },
      });
    }
    res
      .status(StatusCodes.OK)
      .json({ status: httpStatus.SUCCESS, data: { category } });
  } catch (error) {
    next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)));
  }
};
export const deleteCategory = async (req, res, next) => {
  const categoryId = req.params.id;

  try {
    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: httpStatus.ERROR,
        data: { message: "Category not found or already deleted" },
      });
    }

    return res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { message: "The Category was deleted successfully" },
    });
  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const UpdateCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const updateData = req.body;

    // If a file is uploaded, update the image path
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      {
        new: true, // return updated doc
        runValidators: true, // validate update
      }
    );

    if (!updatedCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: httpStatus.ERROR,
        data: { message: "Can't find this category" },
      });
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { updatedCategory },
    });
  } catch (error) {
    return next(
      new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR)
    );
  }
};
