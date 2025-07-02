import User from '../models/userModel';
import StatusCodes from '../utils/status.codes';
import httpStatus from '../utils/http.status.message'
// getAllUsers, getUserbyId, delete, update => admin;
// get all users
export const getAllUsers = async(req, res) => {
    // pagination
    const query = req.query
    const page = query.page
    const limit = query.limit
    const end = (page - 1)*limit
    // get all users
    const users = await User.find().populate('wishlist').limit(limit).skip(end)
    if(!users){
        res.status(StatusCodes.NOT_FOUND).json({staus: httpStatus.FAIL, data: {message: 'No user available'}})
    }
    res.status(StatusCodes.ACCEPTED).json({status: httpStatus.SUCCESS, data: {users}})
}
// get user by id
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id
        const user = await User.findById(userId).populate('wishlist')
        if(!user){
            res.status(StatusCodes.NOT_FOUND).json({data: {message: "user isn't found"}})
        }
        res.select(StatusCodes.ACCEPTED).json({data:{ user}})
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({data: {message:error}})
}
}
const updateUser = async(req, res) => {
    // check if the token contain the id
    if(req.decoded.id !== req.params.id){
        return res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.ERROR, data:{message: "Unothraized User"}});
    }
    try {
        const userId = req.params.id
        const updateUser = await User.findByIdAndUpdate(userId,
            {$set: {...req.body}},{ new: true })
        if(!updateUser){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.ERROR, data: {message:"not found user"}});
        }
        res.status(StatusCodes.FOUND).json({status: httpStatus.SUCCESS, data: {updateUser}})
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: httpStatus.ERROR, data: {message: error}})
    }
}