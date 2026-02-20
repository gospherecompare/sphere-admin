const normalizeProductType = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const isTvLikeProduct = (normalizedType) =>
  normalizedType === "tv" ||
  normalizedType === "television" ||
  normalizedType.includes("homeappliance");

export const getProductEditRoute = (productType, id) => {
  if (!id) return null;

  const type = normalizeProductType(productType);
  if (!type) return null;

  if (
    type.includes("smartphone") ||
    type.includes("mobile") ||
    type.includes("phone")
  ) {
    return `/edit-mobile/${id}`;
  }

  if (type.includes("laptop")) {
    return `/products/laptops/${id}/edit`;
  }

  if (isTvLikeProduct(type)) {
    return `/products/tvs/${id}/edit`;
  }

  return null;
};

export const getSearchNavigationTarget = (suggestion, fallbackQuery = "") => {
  if (!suggestion || typeof suggestion !== "object") {
    return { path: "/dashboard" };
  }

  if (suggestion.type === "product") {
    const editPath = getProductEditRoute(suggestion.product_type, suggestion.id);
    if (editPath) {
      return { path: editPath };
    }

    return {
      path: "/products/smartphones/inventory",
      state: {
        searchTerm: (fallbackQuery || suggestion.name || "").trim(),
      },
    };
  }

  if (suggestion.type === "brand") {
    return {
      path: "/specifications/brands",
      state: {
        searchTerm: (suggestion.name || fallbackQuery || "").trim(),
      },
    };
  }

  return { path: "/dashboard" };
};
