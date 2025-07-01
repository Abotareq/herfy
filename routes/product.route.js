import express from "express";
import productController from "../controllers/product.controller.js";
import upload from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { createProductSchema, updateProductSchema } from "../validations/product.validation.js";

const router = express.Router();

/*
  |  | Route                                          | Method | Purpose                            |
| -- | ---------------------------------------------- | ------ | ---------------------------------- |
| 1  | `/api/products`                                | POST   | Create Product                     |
| 2  | `/api/products`                                | GET    | List Products (filters/pagination) |
| 3  | `/api/products/search`                         | GET    | Search Products                    |
| 4  | `/api/products/:productId`                     | GET    | Get single Product                 |
| 5  | `/api/products/:productId`                     | PATCH  | Update Product                     |
| 6  | `/api/products/:productId`                     | DELETE | Delete Product                     |
| 7  | `/api/products/:productId/variants`            | POST   | Add Variant                        |
| 8  | `/api/products/:productId/variants/:variantId` | PATCH  | Update Variant                     |
| 9  | `/api/products/:productId/variants/:variantId` | DELETE | Delete Variant                     |
| 10 | `/api/products/:productId/images`              | POST   | Add multiple images                |

*/ 
router.route("/")
  .get(productController.getAllProducts) // supports filters, pagination, search
  .post(upload.single("image"), validate(createProductSchema), productController.createProduct);

router.route("/search")
  .get(productController.searchProducts);

router.route("/:productId")
  .get(productController.getProductById)
  .patch(validate(updateProductSchema), productController.updateProduct)
  .delete(productController.deleteProduct);

router.route("/:productId/variants")
  .post(validate(createVariantSchema), productController.addVariant);

router.route("/:productId/variants/:variantId")
  .patch(validate(updateVariantSchema), productController.updateVariant)
  .delete(productController.deleteVariant);

router.route("/:productId/images")
  .post(upload.array("images"), productController.addImages);

export default router;
