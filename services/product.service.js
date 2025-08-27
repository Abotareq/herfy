import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import Store from "../models/storeModel.js";
import AppErrors from "../utils/app.errors.js";
import slugify from "slugify";
import { buildProductFilterQuery } from "../utils/filter_method.js";
import { getSortOption } from "../utils/sort.method.js";
import userRole from "../utils/user.role.js";

/**
 * Retrieves all products with filters, sorting, and pagination.
 *
 * @param {Object} options - Options for retrieving products.
 * @param {number} [options.page=1] - The current page number for pagination.
 * @param {number} [options.limit=10] - Number of products per page.
 * @param {string} [options.category] - Filter products by category.
 * @param {string} [options.search] - Search string to match product fields.
 * @param {string} [options.color] - Filter products by color.
 * @param {string} [options.size] - Filter products by size.
 * @param {number} [options.minPrice] - Minimum price filter.
 * @param {number} [options.maxPrice] - Maximum price filter.
 * @param {string} [options.sort] - Sorting criteria, possible values:
 *   - "popularity_desc" (default: most reviews first)
 *   - "popularity_asc"
 *   - "rating_desc"
 *   - "rating_asc"
 *   - "latest"
 *   - "oldest"
 *   - "price_asc"
 *   - "price_desc"
 *
 * @returns {Promise<Object>} Promise resolving to an object containing:
 *   - products: Array of product documents matching the filters.
 *   - totalProducts: Total number of products matching the filters.
 *   - totalPages: Total number of pages based on limit.
 *   - currentPage: The current page number.
 *   - limit: Number of products per page.
 */
const getAllProducts = async ({
  page = 1,
  limit = 10,
  category,
  storeId,
  search,
  color,
  size,
  minPrice,
  maxPrice,
  sort,
  status,
}, user ) => {
  const query = buildProductFilterQuery({
    category,
    search,
    color,
    size,
    minPrice,
    maxPrice,
  });

  if (status) {
    query.status = status;
  }

  if (storeId) {
    console.log("store id ",storeId)
    query.store = storeId;
    console.log(query.store)
  }
    // 
    console.log("--- DEBUGGING USER ROLE ---");
    console.log("User object received:", user);
    console.log("Value of user.role:", user ? user.role : "No user");
    console.log("Value of userRole.CUSTOMER:", userRole ? userRole.CUSTOMER : "userRole not defined");
    console.log("---------------------------");
  
  if(!user ||user.role=== userRole.CUSTOMER){
    query.status = "approved"
  }

  const sortOption = getSortOption(sort);

  const countPromise = Product.countDocuments({
    isDeleted: false,
    ...query,
  });
  console.log("query",query)
  const productsPromise = Product.find({ isDeleted: false, ...query })
    .populate("category", "name slug")
    .populate("store", "name slug")
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const [totalProducts, products] = await Promise.all([
    countPromise,
    productsPromise,
  ]);
    console.log("products",products)
  const totalPages = Math.ceil(totalProducts / limit);

  // Filter out soft-deleted variants before returning
  products.forEach((product) => {
    if (product.variants) {
      product.variants = product.variants.filter((v) => !v.isDeleted);
    }
  });
  return { products, totalProducts, totalPages, currentPage: page, limit };
};

/**
 * Retrieves a product by ID.
 *
 * @param {string} id - Product ID.
 * @returns {Promise<object>} - The product document.
 * @throws {AppError} - Throws if not found.
 */
const getProductById = async (productId,user) => {
  const query = {
    _id: productId,
    isDeleted: false,
  };
    if(!user || userRole.CUSTOMER){
    query.status = "approved"
  }
  const product = await Product.findOne(query).populate("category", "name slug");

  if (!product) throw AppErrors.notFound("Product not found");

  // Filter out soft-deleted variants before returning
  if (product.variants) {
    product.variants = product.variants.filter((v) => !v.isDeleted);
  }

  return product;
};

/**
 * Searches products with query, filters, and pagination.
 *
 * @param {object} options - Search options.
 * @param {string} options.query - Search string.
 * @param {number} [options.page=1] - Current page.
 * @param {number} [options.limit=10] - Items per page.
 * @param {string} [options.category] - Category filter.
 * @param {string} [options.color] - Color filter.
 * @param {string} [options.size] - Size filter.
 * @param {number} [options.minPrice] - Minimum price.
 * @param {number} [options.maxPrice] - Maximum price.
 * @returns {Promise<object>} - Matching products with pagination info.
 */

const searchProducts = async ({
  query,
  page = 1,
  limit = 10,
  category,
  color,
  size,
  minPrice,
  maxPrice,
  sort,
}) => {
  const filterQuery = buildProductFilterQuery({
    category,
    search: query,
    color,
    size,
    minPrice,
    maxPrice,
  });

  const sortOption = getSortOption(sort);

  const countPromise = Product.countDocuments(filterQuery);

  const productsPromise = Product.find({ isDeleted: false, ...filterQuery })
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("category", "name slug")
    .lean();

  const [totalProducts, products] = await Promise.all([
    countPromise,
    productsPromise,
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  // Filter out soft-deleted variants before returning
  products.forEach((product) => {
    if (product.variants) {
      product.variants = product.variants.filter((v) => !v.isDeleted);
    }
  });

  return { products, totalProducts, totalPages, currentPage: page, limit };
};

/**
 * Creates a new product.
 *
 * @param {object} data - Product data.
 * @param {object} [file] - Uploaded file (image).
 * @returns {Promise<object>} - The created product.
 */

const createProduct = async (data, files, userId,role) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (files && files.length > 0) {
      // Multiple images
      const urls = files.map((file) => {
        return file.path.startsWith("http")
          ? file.path
          : cloudinary.url(file.filename);
      });
      data.images = urls;
    } else if (files) {
      // Single image passed as single file object
      const url = files.path.startsWith("http")
        ? files.path
        : cloudinary.url(files.filename);
      data.images = [url];
    }

    //  Price validation
    if (data.basePrice < 0) {
      throw AppErrors.badRequest("Base price cannot be negative");
    }
    if (data.discountPrice && data.discountPrice >= data.basePrice) {
      throw AppErrors.badRequest("Discount price must be less than base price");
    }

    // Generate slug
    data.slug = slugify(data.name, { lower: true });

    data.createdBy = userId;

    const store = await Store.findById(data.store).session(session);
    if (!store) throw AppErrors.notFound("Store not found");

    if (!store.owner || store.owner.toString() !== userId.toString() && role.toLowerCase() !== 'admin') {
      throw AppErrors.unauthorized(
        "You are not authorized to add products to this store"
      );
    }

    // Check if category exists for dev
    const category = await Category.findById(data.category).session(session);
    if (!category) throw AppErrors.notFound("Category not found");
    // soft deleted
    // if (category.isDeleted) {
    //   throw AppErrors.badRequest("Category has been deleted");
    // }

    //Check for existing product with same name in the same store
    // const existingProduct = await Product.findOne({
    //   store: data.store,
    //   slug: data.slug,
    // }).session(session);

    // if (existingProduct) {
    //   throw AppErrors.badRequest(
    //     "Product with this name already exists in this store"
    //   );
    // }
    
    const product = await Product.create([data], { session });

    // Update store's products array
    await Store.findByIdAndUpdate(
      data.store,
      { $inc: { productCount: 1 } },
      { session }
    );

    // Increment category product count
    // for dev
    await Category.findByIdAndUpdate(
      data.category,
      { $inc: { productCount: 1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return product[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw AppErrors.badRequest(err.message);
  }
};

const updateProduct = async (productId, updateData, file, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw AppErrors.notFound("Product not found");

    // If the product is already 'approved' and the vendor tries to change critical data...
    if (user.role === 'vendor' && product.status === 'approved') {
      const criticalFieldsChanged = updateData.name || updateData.description || updateData.basePrice || updateData.category;
      if (criticalFieldsChanged) {
        // ...reset the status to 'pending' for admin re-approval.
        product.status = 'pending';
      }
    }

    if (user.role === 'vendor') {
      delete updateData.status;
    }


    //  Price validation
    if (updateData.basePrice < 0) {
      throw AppErrors.badRequest("Base price cannot be negative");
    }
    if (
      updateData.discountPrice &&
      updateData.discountPrice >= (updateData.basePrice || product.basePrice)
    ) {
      throw AppErrors.badRequest("Discount price must be less than base price");
    }

    //  Category validation and productCount adjustment

    // for dev
    if (updateData.category) {
      const category = await Category.findById(updateData.category).session(
        session
      );
      if (!category) throw AppErrors.notFound("Category not found");
      // if (category.isDeleted) {
      //   throw AppErrors.badRequest("Category has been deleted");
      // }

      if (product.category.toString() !== updateData.category.toString()) {
        // Decrement old category count
        await Category.findByIdAndUpdate(
          product.category,
          { $inc: { productCount: -1 } },
          { session }
        );
        // Increment new category count
        await Category.findByIdAndUpdate(
          updateData.category,
          { $inc: { productCount: 1 } },
          { session }
        );
      }
    }

    //  Store change logic
    if (
      updateData.store &&
      updateData.store.toString() !== product.store.toString()
    ) {
      const newStore = await Store.findById(updateData.store).session(session);
      if (!newStore) throw AppErrors.notFound("New store not found");

      //  Optional: Check user owns the new store
      if (newStore.owner.toString() !== user._id.toString()) {
        throw AppErrors.unauthorized(
          "You are not authorized to move product to this store"
        );
      }

      //  Remove product from old store
      await Store.findByIdAndUpdate(
        product.store,
        { $inc: { productCount: -1 } },
        { session }
      );

      //  Add product to new store
      await Store.findByIdAndUpdate(
        updateData.store,
        { $inc: { productCount: 1 } },
        { session }
      );

      // Update store field in product
      product.store = updateData.store;
    }

    //  Slug update with uniqueness check inside new store
    if (updateData.name) {
      const newSlug = slugify(updateData.name, { lower: true });

      const duplicate = await Product.findOne({
        _id: { $ne: productId },
        store: product.store,
        slug: newSlug,
      }).session(session);

      if (duplicate) {
        throw AppErrors.badRequest(
          "Product with this name already exists in this store"
        );
      }

      product.slug = newSlug;
    }

    // Image update
    // Image update
    if (file && file.length > 0) {
      // Multiple images
      const urls = file.map((f) => {
        return f.path.startsWith("http") ? f.path : cloudinary.url(f.filename);
      });
      updateData.images = urls;
    } else if (file) {
      // Single image
      const url = file.path.startsWith("http")
        ? file.path
        : cloudinary.url(file.filename);
      updateData.images = [url];
    }

    //  isDeleted update
    if (updateData.isDeleted !== undefined) {
      product.isDeleted = updateData.isDeleted;
    }

    // Allowed fields update
    const allowedUpdates = [
      "name",
      "description",
      "basePrice",
      "category",
      "variants",
      "discountPrice",
      "discountStart",
      "discountEnd",
      "stock",
      "store", // Allow store update here
    ];

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        product[key] = updateData[key];
      }
    });

    await product.save({ session });

    await session.commitTransaction();
    session.endSession();
    return product;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw AppErrors.badRequest(error.message);
  }
};


//*!  Added by Osama Saad

//  New service function for admins to update status    


/**
 * Updates the status of a product. Only accessible by Admins.
 * @param {string} productId - The ID of the product to update.
 * @param {string} status - The new status ('approved', 'rejected', 'suspended').
 * @returns {Promise<object>} The updated product document.
 */
const updateStatusByAdmin = async (productId, status) => {
  // Basic validation
  const allowedStatuses = ['approved', 'rejected', 'suspended'];
  if (!allowedStatuses.includes(status)) {
    throw AppErrors.badRequest("Invalid status provided.");
  }
  
  const product = await Product.findByIdAndUpdate(
    productId,
    { status },
    { new: true }
  );

  if (!product) {
    throw AppErrors.notFound("Product not found.");
  }

  return product;
};

// SOFT DELETE PRODUCT
const SoftDeleteProduct = async (productId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw AppErrors.notFound("Product not found");

    product.isDeleted = true;
    product.updatedBy = userId;

    await product.save({ session });

    await session.commitTransaction();
    session.endSession();
    return product;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * hard Deletes a product by ID.
 *
 * @param {string} id - Product ID.
 * @returns {Promise<void>}
 * @throws {AppError} - Throws if not found.
 */
const deleteProduct = async (id) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(id).session(session);
    if (!product) throw AppErrors.notFound("Product not found");

    // Delete product
    await Product.deleteOne({ _id: id }).session(session);

    // Remove from store.products array if applicable
    await Store.findByIdAndUpdate(
      product.store,
      { $inc: { productCount: -1 } },
      { session }
    );

    // Decrement productCount in category
    await Category.findByIdAndUpdate(
      product.category,
      { $inc: { productCount: -1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * Adds a new variant to a product.
 *
 * @param {string} productId - Product ID.
 * @param {object} variantData - Variant details.
 * @returns {Promise<object>} - Updated product.
 * @throws {AppError} - Throws if product not found.
 */

const addVariant = async (productId, variantData) => {
  const product = await Product.findById(productId);
  if (!product) throw AppErrors.notFound("Product not found");

  const existingVariant = product.variants.find(
    (v) => v.name.toLowerCase() === variantData.name.toLowerCase()
  );

  if (existingVariant) {
    const existingOptionsValues = existingVariant.options.map((opt) =>
      opt.value.toLowerCase()
    );

    // Filter only new options not already present
    const newOptions = variantData.options.filter(
      (opt) => !existingOptionsValues.includes(opt.value.toLowerCase())
    );

    if (newOptions.length === 0) {
      // Early return without saving if no changes
      return {
        product,
        message:
          "Variant exists and all provided options already exist. No update performed.",
      };
    }

    // Merge only new options
    existingVariant.options.push(...newOptions);

    await product.save();
    return {
      product,
      message: `Variant exists. Added ${newOptions.length} new option(s).`,
    };
  } else {
    product.variants.push(variantData);
    await product.save();
    return {
      product,
      message: "Variant added successfully.",
    };
  }
};

/**
 * Updates a variant of a product.
 *
 * @param {string} productId - Product ID.
 * @param {string} variantId - Variant ID.
 * @param {object} variantData - Data to update.
 * @returns {Promise<object>} - Updated product.
 * @throws {AppError} - Throws if product or variant not found.
 */
const updateVariant = async (productId, variantId, variantData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw AppErrors.notFound("Product not found");

    const variant = product.variants.id(variantId);
    if (!variant) throw AppErrors.notFound("Variant not found");

    // Update name if provided
    if (variantData.name) {
      variant.name = variantData.name;
    }

    // Update or add options
    if (variantData.options && Array.isArray(variantData.options)) {
      variantData.options.forEach((newOpt) => {
        // Validate newOpt structure
        if (!newOpt.value) {
          throw AppErrors.badRequest("Option value is required");
        }

        const existingOpt = variant.options.find(
          (opt) => opt.value.toLowerCase() === newOpt.value.toLowerCase()
        );

        if (existingOpt) {
          // Update existing option fields if provided
          if ("priceModifier" in newOpt)
            existingOpt.priceModifier = newOpt.priceModifier;
          if ("stock" in newOpt) existingOpt.stock = newOpt.stock;
          if ("sku" in newOpt) existingOpt.sku = newOpt.sku;
        } else {
          // ➕ Add new option
          variant.options.push(newOpt);
        }
      });
    }

    await product.save({ session });
    await session.commitTransaction();
    session.endSession();

    return variant; // Return updated variant only
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Deletes a variant from a product.
 *
 * @param {string} productId - Product ID.
 * @param {string} variantId - Variant ID.
 * @returns {Promise<void>}
 * @throws {AppError} - Throws if product or variant not found.
 */
const deleteVariant = async (productId, variantId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw AppErrors.notFound("Product not found");

    const variant = product.variants.id(variantId);
    if (!variant) throw AppErrors.notFound("Variant not found");

    // Soft delete by marking isDeleted true
    variant.isDeleted = true;

    await product.save({ session });
    await session.commitTransaction();
    return { message: "Variant marked as deleted successfully" };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Adds multiple images to a product.
 *
 * @param {string} productId - Product ID.
 * @param {array} files - Uploaded files.
 * @returns {Promise<object>} - Updated product.
 * @throws {AppError} - Throws if product not found.
 */
const addImages = async (productId, files) => {
  const product = await Product.findById(productId);
  if (!product) throw AppErrors.notFound("Product not found");

  // Extract Cloudinary URLs from files array
  const imagePaths = files.map((file) => file.path);

  // Push new image URLs into existing images array
  product.images.push(...imagePaths);

  // Save updated product
  await product.save();

  return product;
};

export default {
  createProduct,
  getAllProducts,
  getProductById,
  searchProducts,
  updateProduct,
  deleteProduct,
  addVariant,
  deleteVariant,
  updateVariant,
  addImages,
  SoftDeleteProduct,
  updateStatusByAdmin
};
