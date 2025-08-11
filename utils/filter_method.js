/**
 * Builds a MongoDB query object for filtering stores.
 *
 * @param {object} filters - The filters to apply.
 * @param {string} [filters.search] - Search string for store name.
 * @param {string} [filters.status] - Status filter (pending, approved, rejected, suspended).
 * @returns {object} - The constructed MongoDB query.
 *
 * @example
 * const query = buildStoreFilterQuery({ search: "handmade", status: "approved" });
 */
export const buildStoreFilterQuery = ({ search, status }) => {
    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (status) query.status = status;
    return query;
};


/**
 * Builds the query object for product filters.
 *
 * @param {object} filters - Filters to apply.
 * @param {string} [filters.category] - Category ID.
 * @param {string} [filters.search] - Search string for product name.
 * @param {string} [filters.color] - Color filter.
 * @param {string} [filters.size] - Size filter.
 * @param {number} [filters.minPrice] - Minimum price.
 * @param {number} [filters.maxPrice] - Maximum price.
 * @returns {object} - The MongoDB query object.
 */
export const buildProductFilterQuery = ({ category, search, color, size, minPrice, maxPrice }) => {
    const query = {};

    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.category = category;
    if (color) query["variants.options.value"] = color;
    if (size) query["variants.options.value"] = size;

    if (minPrice || maxPrice) {
        query.basePrice = {};
        if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
        if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }

    return query;
};

/**
 * Builds a MongoDB filter object for Payment queries.
 * @param {object} query - Query parameters.
 * @returns {object} Filter object for Mongoose.
 */
export const buildPaymentFilter = (query) => {
  console.log(query)
  const filter = {};

  if (query.status) {
    filter.status = query.status; // e.g. 'completed', 'failed'
  }

  if (query.provider) {
    filter.provider = query.provider; // user ID for user-specific payments
  }
  if (query.user) {
    filter.user = query.user; // user ID for user-specific payments
  }

  if (query.paymentMethod) {
    filter.paymentMethod = query.paymentMethod; // e.g. 'card', 'cash', 'paypal'
  }

  if (query.minAmount) {
    filter.amount = { ...filter.amount, $gte: Number(query.minAmount) };
  }

  if (query.maxAmount) {
    filter.amount = { ...filter.amount, $lte: Number(query.maxAmount) };
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }

  if (query.search) {
    filter.$or = [
      { reference: { $regex: query.search, $options: "i" } },
      { method: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};