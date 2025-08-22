import {
  deleteUserByAdmin,
  deleteUserByUser,
  getAllUsers,
  getUserById,
  updateByUser,
  updateUserByAdmin,
} from "../controllers/user.controller.js";
import express from "express";
import { checkRole, requireAuth } from "../auth/auth.middleware.js";
import userRole from "../utils/user.role.js";
import { searchByRoleByAdmin } from "../controllers/search.controller.js";
import { fiterUserByRole } from "../controllers/filter.controller.js";

const userRouter = express.Router();

userRouter.get(
  "/search",
  requireAuth,
  checkRole([userRole.ADMIN]),
  searchByRoleByAdmin
);
userRouter.get("/", requireAuth, checkRole([userRole.ADMIN]), getAllUsers);
userRouter.get("/:id", requireAuth, checkRole([userRole.ADMIN, userRole.CUSTOMER, userRole.VENDOR]), getUserById);
userRouter.patch(
  "/",
  requireAuth,
  checkRole([userRole.CUSTOMER, userRole.VENDOR]),
  updateByUser
);
userRouter.patch(
  "/:id",
  requireAuth,
  checkRole([userRole.ADMIN]),
  updateUserByAdmin
);
userRouter.delete(
  "/:id",
  requireAuth,
  checkRole([userRole.ADMIN]),
  deleteUserByAdmin
);
userRouter.delete(
  "/",
  requireAuth,
  checkRole([userRole.CUSTOMER]),
  deleteUserByUser
);
userRouter.get('/filter', requireAuth, checkRole([userRole.ADMIN]), fiterUserByRole)
userRouter.get("/search", searchByRoleByAdmin);
// userRouter.get('/filter', fiterUserByRole)
// userRouter.get("/", getAllUsers);
// userRouter.get("/:id", getUserById);
// userRouter.patch("/", updateByUser);
// userRouter.patch("/:id", updateUserByAdmin);
// userRouter.delete("/:id", deleteUserByAdmin);
// userRouter.delete("/", deleteUserByUser); 
// userRouter.get('/search',requireAuth, checkRole([userRole.CUSTOMER, userRole.VENDOR]),searchRole)
export default userRouter;
//delete user by user
// search user by userName adminrole
// searc for username of vendor
