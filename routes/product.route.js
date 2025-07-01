import express from "express";
import upload from "../middlewares/uploade.middleware";

import productController from "../controllers/product.controller.js";
const productRoute =express.Router();

productRoute.route("/")
                .get(ProductController.getAllProducts)
                /*
                image point to 
                    // frontend
                    <form action="/api/products" method="POST" enctype="multipart/form-data">
                        <input type="file" name="image" /> same name here
                        <button type="submit">Upload</button>
                    </form>

                    // postman 
                    field name of formate data 
                */ 
                .post(upload.single("image"),productController.createProduct)
productRoute.route("/:productId")
                .delete()
                .patch()
                .put()
                .get()
productRoute.route("/search")
                .get(ProductController.searchProducts)

export default productRoute ;