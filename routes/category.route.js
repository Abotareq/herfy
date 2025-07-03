import {getAllCategoty, 
        addNewCategory,
        getCategotyById,
        deleteCategory } from "../controllers/category.controller.js";

import express from 'express';
const categoryRouter = express.Router();

categoryRouter.get('/', getAllCategoty)
categoryRouter.get('/:id', getCategotyById)
categoryRouter.delete('/:id', deleteCategory)
categoryRouter.post('/', addNewCategory)
export default categoryRouter;