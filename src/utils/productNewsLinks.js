import { buildUrl, getAuthToken } from "../api";

const normalizePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizePositiveIntegerList = (values = []) => {
  const seen = new Set();
  const normalized = [];

  (Array.isArray(values) ? values : []).forEach((value) => {
    const parsed = normalizePositiveInteger(value);
    if (!parsed || seen.has(parsed)) return;
    seen.add(parsed);
    normalized.push(parsed);
  });

  return normalized;
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

const readResponseJson = async (response) =>
  response.json().catch(() => ({}));

const buildSearchParams = ({ query = "", limit = 12, selectedIds = [] } = {}) => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const trimmedQuery = String(query || "").trim();
  if (trimmedQuery) params.set("query", trimmedQuery);

  const normalizedSelectedIds = normalizePositiveIntegerList(selectedIds);
  if (normalizedSelectedIds.length) {
    params.set("selected_ids", normalizedSelectedIds.join(","));
  }

  return params;
};

const fetchLinkedNewsForProduct = async (
  productId,
  { query = "", limit = 12 } = {},
) => {
  const normalizedProductId = normalizePositiveInteger(productId);
  if (!normalizedProductId) {
    throw new Error("A valid product id is required");
  }

  const params = buildSearchParams({ query, limit });
  const response = await fetch(
    buildUrl(
      `/api/admin/products/${normalizedProductId}/linked-news?${params.toString()}`,
    ),
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await readResponseJson(response);
  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data;
};

const searchNewsArticles = async ({
  query = "",
  limit = 12,
  selectedIds = [],
} = {}) => {
  const params = buildSearchParams({ query, limit, selectedIds });
  const response = await fetch(
    buildUrl(`/api/admin/news-articles/search?${params.toString()}`),
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await readResponseJson(response);
  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data;
};

const saveProductNewsLinks = async (productId, blogIds = []) => {
  const normalizedProductId = normalizePositiveInteger(productId);
  if (!normalizedProductId) {
    throw new Error("A valid product id is required");
  }

  const response = await fetch(
    buildUrl(`/api/admin/products/${normalizedProductId}/linked-news`),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        blog_ids: normalizePositiveIntegerList(blogIds),
      }),
    },
  );

  const data = await readResponseJson(response);
  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data;
};

export {
  fetchLinkedNewsForProduct,
  normalizePositiveInteger,
  normalizePositiveIntegerList,
  saveProductNewsLinks,
  searchNewsArticles,
};
