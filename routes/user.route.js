import {deleteUserByAdmin, deleteUserByUser, getAllUsers, getUserById, updateByUser, updateUserByAdmin, updateUserByVendor} from '../controllers/user.controller.js';
import express  from 'express';
import { checkRole,requireAuth } from '../auth/auth.middleware.js';
import userRole from '../utils/user.role.js';
import { searchByRoleByAdmin, searchRole} from '../controllers/search.controller.js';
const userRouter = express.Router();

userRouter.get('/', requireAuth,checkRole([userRole.ADMIN]), getAllUsers);
userRouter.get('/:id',requireAuth,checkRole([userRole.ADMIN]),  getUserById);
userRouter.patch('/:id', requireAuth,checkRole([userRole.CUSTOMER]), updateByUser);
userRouter.patch('/:id', requireAuth,checkRole([userRole.VENDOR]), updateUserByVendor);
userRouter.patch('/:id', requireAuth,checkRole([userRole.ADMIN]), updateUserByAdmin);
userRouter.delete('/:id', requireAuth,checkRole([userRole.ADMIN]), deleteUserByAdmin)
userRouter.delete('/:id', requireAuth, checkRole([userRole.CUSTOMER]), deleteUserByUser)
userRouter.get('/search',requireAuth, checkRole([userRole.ADMIN]), searchByRoleByAdmin)
userRouter.get('/search',requireAuth, checkRole([userRole.CUSTOMER, userRole.VENDOR]),searchRole)
export default userRouter;
//delete user by user
// search user by userName adminrole 
// searc for username of vendor 