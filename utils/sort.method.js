/**
 * Returns the MongoDB sort object based on the given sort key.
 *
 * @param {string} sort - The sort key indicating the sorting criteria.
 * Supported values:
 *   - "popularity_desc": Sort by reviewCount descending (most popular first)
 *   - "popularity_asc": Sort by reviewCount ascending
 *   - "rating_desc": Sort by averageRating descending (highest rating first)
 *   - "rating_asc": Sort by averageRating ascending
 *   - "latest": Sort by createdAt descending (newest first)
 *   - "oldest": Sort by createdAt ascending (oldest first)
 *   - "price_asc": Sort by price ascending (lowest price first)
 *   - "price_desc": Sort by price descending (highest price first)
 *
 * @returns {Object} MongoDB sort object, e.g. { fieldName: 1 } or { fieldName: -1 }.
 * Defaults to sorting by createdAt descending if the sort key is invalid or missing.
 */
export const getSortOption = (sort) => {
  const sortOptionsMap = {
    popularity_desc: { reviewCount: -1 },
    popularity_asc: { reviewCount: 1 },
    rating_desc: { averageRating: -1 },
    rating_asc: { averageRating: 1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
  };
  
  return sortOptionsMap[sort] || { createdAt: -1 };
};


/**
 * Returns a Mongoose sort object based on provided sort key for payments.
 * @param {string} sort - Sort option key.
 * @returns {object} Mongoose sort object.
 */
export const getPaymentSortOption = (sort) => {
  const sortOptionsMap = {
    amount_desc: { amount: -1 },
    amount_asc: { amount: 1 },
    status_desc: { status: -1 },
    status_asc: { status: 1 },
    method_desc: { method: -1 },
    method_asc: { method: 1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
  };

  return sortOptionsMap[sort] || { createdAt: -1 }; // default: newest
};