import User from "../models/userModel.js";
import StatusCodes from "../utils/status.codes.js";
import httpStatus from "../utils/http.status.message.js";
import userRole from "../utils/user.role.js";
// getAllUsers, getUserbyId, delete, update => admin;
// get all users
export const getAllUsers = async (req, res) => {
  // pagination
  const query = req.query;
  const page = query.page;
  const limit = query.limit;
  const end = (page - 1) * limit;
  // get all users
  const users = await User.find()
    .populate("wishlist", "addresses")
    .limit(limit)
    .skip(end);
  if (!users) {
    res
      .status(StatusCodes.NOT_FOUND)
      .json({ staus: httpStatus.FAIL, data: { message: "No user available" } });
  }
  res
    .status(StatusCodes.ACCEPTED)
    .json({ status: httpStatus.SUCCESS, data: { users, currentPage: page, count: users.length } });
};
// get user by id
export const getUserById = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const userId = req.params.id;

    // If vendor or customer, only allow access to their own account
    if (currentUser.role === userRole.VENDOR || currentUser.role === userRole.CUSTOMER) {
      if (currentUser._id.toString() !== userId) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ data: { message: "Unauthorized access" } });
      }
    }

    // Admin can access anyone, so no restriction here
    const user = await User.findById(userId).populate("wishlist");
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ data: { message: "User not found" } });
    }

    return res.status(StatusCodes.OK).json({ data: { user } });
  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


// update user by ADMIn
export const updateUserByAdmin = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updateUser = await User.findByIdAndUpdate(
      userId,
      { $set: { ...req.body } },
      { new: true }
    );
    if (!updateUser) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({
          status: httpStatus.ERROR,
          data: { message: "not found user" },
        });
    }
    res
      .status(StatusCodes.OK)
      .json({ status: httpStatus.SUCCESS, data: { updateUser } });
  } catch (error) {
    next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)));
  }
};
//BY ADMIN
export const updateByUser = async (req, res, next) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return next(new ErrorResponse("User not found", StatusCodes.NOT_FOUND));
    }

    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      { $set: { ...req.body } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: httpStatus.FAIL,
        data: { message: "User not found or update failed" },
      });
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { updatedUser },
    });
  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const deleteUserByAdmin = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId); // Await the promise
    if (!deletedUser) {
      return next(new ErrorResponse('User Not Found', StatusCodes.NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { message: 'User Deleted Successfully' } // Fix typo: "Succefully" -> "Successfully"
    });
  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
export const deleteUserByUser = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const deletedUser = await User.findByIdAndDelete(currentUser._id);
    if (!deletedUser) {
      return next(new ErrorResponse("User not Found", StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { message: "User deleted successfully" },
    });
  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
