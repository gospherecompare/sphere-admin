import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaArrowDown,
  FaArrowUp,
  FaCheckCircle,
  FaExclamationCircle,
  FaExternalLinkAlt,
  FaMagic,
  FaPlus,
  FaSave,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const SITE_ORIGIN = "https://tryhook.shop";
const MAX_COMPARE_ITEMS = 3;
const PAGE_SIZE = 8;

const EMPTY_FORM = {
  id: null,
  items: [],
  primary_product_id: null,
  compare_key: "",
  segment_label: "",
  smartphone_type_label: "",
  slug: "",
  title: "",
  meta_description: "",
  status: "published",
  source: "manual",
  generation_reason: "",
  system_score: 0,
  manual_compare_count: 0,
  last_compared_at: null,
  generated_at: null,
  route_path: "",
  updated_at: null,
  published_at: null,
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toFiniteNumber = (value) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  const match = String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const nextValue = Number(match[0]);
  return Number.isFinite(nextValue) ? nextValue : null;
};

const normalizeText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const toSlug = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/-price-in-india$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const joinNamesWithoutCommas = (names = []) => {
  const clean = (Array.isArray(names) ? names : [])
    .map((name) => normalizeText(name))
    .filter(Boolean);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  return clean.join(" and ");
};

const resolveSmartphoneSegmentLabel = (items = []) => {
  const prices = (Array.isArray(items) ? items : [])
    .map((item) => toFiniteNumber(item?.best_price))
    .filter((value) => value != null && value > 0);
  if (!prices.length) return "";

  const averagePrice = prices.reduce((sum, value) => sum + value, 0) / prices.length;
  if (averagePrice <= 10000) return "Entry";
  if (averagePrice <= 20000) return "Budget";
  if (averagePrice <= 30000) return "Lower Mid Range";
  if (averagePrice <= 45000) return "Mid Range";
  if (averagePrice <= 65000) return "Upper Mid Range";
  if (averagePrice <= 90000) return "Premium";
  if (averagePrice <= 130000) return "Flagship";
  return "Ultra Flagship";
};

const buildCompareSlug = (items = []) => {
  const parts = items
    .map((item) => item?.product_name || item?.name || "")
    .map((name) => toSlug(name))
    .filter(Boolean)
    .slice(0, MAX_COMPARE_ITEMS);
  if (parts.length < 2) return "";
  return `${parts.join("-and-")}-comparison`;
};

const buildCompareTitle = ({
  items = [],
  segmentLabel = "",
  smartphoneTypeLabel = "",
} = {}) => {
  const joinedNames = joinNamesWithoutCommas(
    items.map((item) => item?.product_name || item?.name || ""),
  );
  if (!joinedNames) {
    return "Compare Smartphones Price Specifications and Features in India";
  }

  const segment = normalizeText(segmentLabel);
  if (segment) {
    return `Compare ${joinedNames} in the ${segment} Segment Price Specifications and Features in India`;
  }

  const smartphoneType = normalizeText(smartphoneTypeLabel);
  if (smartphoneType) {
    return `Compare ${joinedNames} ${smartphoneType} Smartphones Price Specifications and Features in India`;
  }

  return `Compare ${joinedNames} Price Specifications and Features in India`;
};

const buildCompareDescription = ({
  items = [],
  segmentLabel = "",
  smartphoneTypeLabel = "",
} = {}) => {
  const joinedNames = joinNamesWithoutCommas(
    items.map((item) => item?.product_name || item?.name || ""),
  );
  if (!joinedNames) {
    return "Compare smartphones with latest price specifications camera battery performance and features in India.";
  }

  const segment = normalizeText(segmentLabel);
  if (segment) {
    return `Compare ${joinedNames} in the ${segment} Segment with latest price specifications camera battery performance and features in India`;
  }

  const smartphoneType = normalizeText(smartphoneTypeLabel);
  if (smartphoneType) {
    return `Compare ${joinedNames} ${smartphoneType} smartphones with latest price specifications camera battery performance and features in India`;
  }

  return `Compare ${joinedNames} with latest price specifications camera battery performance and features in India`;
};

const normalizeCompareItem = (item) => {
  const productId = Number(item?.product_id ?? item?.productId ?? item?.id);
  if (!Number.isInteger(productId) || productId <= 0) return null;
  return {
    product_id: productId,
    product_name: normalizeText(item?.product_name || item?.name || item?.title),
    product_type: normalizeText(item?.product_type || item?.productType || "smartphone"),
    brand_name: normalizeText(item?.brand_name || item?.brandName || ""),
    best_price: toFiniteNumber(item?.best_price ?? item?.bestPrice),
    reason: normalizeText(item?.reason || ""),
    position: Number(item?.position) || null,
  };
};

const ensurePrimaryFirst = (items = [], primaryProductId = null) => {
  const normalizedPrimaryId = Number(primaryProductId);
  const deduped = [];
  const seen = new Set();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const normalized = normalizeCompareItem(item);
    if (!normalized) return;
    if (seen.has(normalized.product_id)) return;
    seen.add(normalized.product_id);
    deduped.push(normalized);
  });

  if (!deduped.length) return [];
  if (!Number.isInteger(normalizedPrimaryId) || normalizedPrimaryId <= 0) {
    return deduped.slice(0, MAX_COMPARE_ITEMS);
  }

  const primaryItem = deduped.find((item) => item.product_id === normalizedPrimaryId);
  const remaining = deduped.filter((item) => item.product_id !== normalizedPrimaryId);
  return (primaryItem ? [primaryItem, ...remaining] : deduped).slice(
    0,
    MAX_COMPARE_ITEMS,
  );
};

const normalizeComparePage = (page) => {
  const items = ensurePrimaryFirst(
    Array.isArray(page?.items) ? page.items : [],
    page?.primary_product_id ?? page?.primaryProductId,
  );
  const primaryProductId =
    Number(page?.primary_product_id ?? page?.primaryProductId) ||
    items[0]?.product_id ||
    null;

  return {
    id: Number(page?.id) || null,
    items,
    primary_product_id: primaryProductId,
    compare_key: normalizeText(page?.compare_key ?? page?.compareKey),
    segment_label: normalizeText(page?.segment_label ?? page?.segmentLabel),
    smartphone_type_label: normalizeText(
      page?.smartphone_type_label ?? page?.smartphoneTypeLabel,
    ),
    slug: normalizeText(page?.slug),
    title: normalizeText(page?.title),
    meta_description: normalizeText(page?.meta_description ?? page?.metaDescription),
    status: String(page?.status || "published").trim().toLowerCase() === "draft"
      ? "draft"
      : "published",
    source: String(page?.source || "manual").trim().toLowerCase() === "automatic"
      ? "automatic"
      : "manual",
    generation_reason: normalizeText(
      page?.generation_reason ?? page?.generationReason,
    ),
    system_score: toFiniteNumber(page?.system_score ?? page?.systemScore) ?? 0,
    manual_compare_count:
      Number(page?.manual_compare_count ?? page?.manualCompareCount) || 0,
    last_compared_at: page?.last_compared_at ?? page?.lastComparedAt ?? null,
    generated_at: page?.generated_at ?? page?.generatedAt ?? null,
    route_path: normalizeText(page?.route_path ?? page?.routePath),
    updated_at: page?.updated_at ?? page?.updatedAt ?? null,
    published_at: page?.published_at ?? page?.publishedAt ?? null,
  };
};

const createEmptyForm = () => ({ ...EMPTY_FORM, items: [] });

export default function ComparePages() {
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [syncingAutomaticPages, setSyncingAutomaticPages] = useState(false);
  const [existingPageHint, setExistingPageHint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const authHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  }, []);

  const loadPages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildUrl("/api/admin/compare-pages"), {
        method: "GET",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const nextPages = Array.isArray(data?.pages)
        ? data.pages.map(normalizeComparePage)
        : [];
      setPages(nextPages);
      setCurrentPage(1);
    } catch (err) {
      setError("Failed to load compare pages");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const syncAutomaticPages = useCallback(async () => {
    setSyncingAutomaticPages(true);
    setError("");
    try {
      const response = await fetch(buildUrl("/api/admin/compare-pages/auto-sync"), {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || `HTTP ${response.status}`);
      }
      await loadPages();
      const result = data?.result || {};
      showToast(
        "Auto Sync Complete",
        `Generated ${Number(result.generated) || 0} compare pages`,
        "success",
      );
    } catch (err) {
      const message = err?.message || "Failed to sync automatic compare pages";
      setError(message);
      showToast("Error", message, "error");
    } finally {
      setSyncingAutomaticPages(false);
    }
  }, [authHeaders, loadPages, showToast]);

  const loadPageDetail = useCallback(
    async (pageId) => {
      const normalizedId = Number(pageId);
      if (!Number.isInteger(normalizedId) || normalizedId <= 0) return;

      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          buildUrl(`/api/admin/compare-pages/${normalizedId}`),
          {
            method: "GET",
            headers: authHeaders(),
          },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const page = normalizeComparePage(data?.page || {});
        setSelectedPageId(page.id);
        setForm(page);
        setExistingPageHint(null);
        setIsFormOpen(true);
      } catch (err) {
        setError("Failed to load compare page details");
      } finally {
        setLoading(false);
      }
    },
    [authHeaders],
  );

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(pages.length / PAGE_SIZE));
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [pages]);

  useEffect(() => {
    if (!isFormOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFormOpen]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const token = getAuthToken();
        const response = await fetch(
          buildUrl(`/api/search/admin?q=${encodeURIComponent(query)}`),
          {
            signal: controller.signal,
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        const smartphoneResults = results
          .filter(
            (item) =>
              item?.type === "product" &&
              String(item?.product_type || "").trim().toLowerCase() === "smartphone",
          )
          .map(normalizeCompareItem)
          .filter(Boolean)
          .slice(0, 8);
        setSearchResults(smartphoneResults);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const fetchSuggestions = useCallback(
    async (productId, autoApply = false) => {
      const normalizedId = Number(productId);
      if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
        setSuggestions([]);
        setExistingPageHint(null);
        return;
      }

      setSuggestionsLoading(true);
      try {
        const response = await fetch(
          buildUrl(`/api/admin/compare-pages/suggestions/${normalizedId}`),
          {
            method: "GET",
            headers: authHeaders(),
          },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const nextSuggestions = Array.isArray(data?.suggestions)
          ? data.suggestions.map(normalizeCompareItem).filter(Boolean)
          : [];
        setSuggestions(nextSuggestions);
        setExistingPageHint(
          data?.existing_page ? normalizeComparePage(data.existing_page) : null,
        );

        if (autoApply && nextSuggestions.length) {
          setForm((prev) => {
            const merged = ensurePrimaryFirst(
              [...prev.items, ...nextSuggestions],
              prev.primary_product_id || normalizedId,
            );
            return {
              ...prev,
              items: merged,
            };
          });
        }
      } catch (err) {
        setSuggestions([]);
        setExistingPageHint(null);
      } finally {
        setSuggestionsLoading(false);
      }
    },
    [authHeaders],
  );

  useEffect(() => {
    if (!form.primary_product_id) {
      setSuggestions([]);
      return;
    }
    fetchSuggestions(form.primary_product_id, false);
  }, [fetchSuggestions, form.primary_product_id]);

  const setField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetDraft = () => {
    setSelectedPageId(null);
    setForm(createEmptyForm());
    setSearchQuery("");
    setSearchResults([]);
    setSuggestions([]);
    setExistingPageHint(null);
    setError("");
    setIsFormOpen(true);
  };

  const closeFormPanel = () => {
    setIsFormOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const addItemToForm = (item, makePrimary = false) => {
    const normalized = normalizeCompareItem(item);
    if (!normalized) return;

    setForm((prev) => {
      const nextPrimary =
        makePrimary || !prev.primary_product_id
          ? normalized.product_id
          : prev.primary_product_id;
      return {
        ...prev,
        primary_product_id: nextPrimary,
        items: ensurePrimaryFirst([...prev.items, normalized], nextPrimary),
      };
    });
  };

  const handlePrimarySelection = (item) => {
    const normalized = normalizeCompareItem(item);
    if (!normalized) return;
    addItemToForm(normalized, true);
    setSearchQuery("");
    setSearchResults([]);
    fetchSuggestions(normalized.product_id, true);
  };

  const handleAddSuggestion = (item) => {
    addItemToForm(item, false);
  };

  const handleSetPrimary = (productId) => {
    setForm((prev) => ({
      ...prev,
      primary_product_id: productId,
      items: ensurePrimaryFirst(prev.items, productId),
    }));
  };

  const handleRemoveItem = (productId) => {
    setForm((prev) => {
      const remaining = prev.items.filter((item) => item.product_id !== productId);
      const nextPrimary =
        prev.primary_product_id === productId
          ? remaining[0]?.product_id || null
          : prev.primary_product_id;
      return {
        ...prev,
        primary_product_id: nextPrimary,
        items: ensurePrimaryFirst(remaining, nextPrimary),
      };
    });
  };

  const handleMoveItem = (index, direction) => {
    setForm((prev) => {
      if (index <= 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex <= 0 || nextIndex >= prev.items.length) return prev;

      const nextItems = [...prev.items];
      const moving = nextItems[index];
      nextItems[index] = nextItems[nextIndex];
      nextItems[nextIndex] = moving;
      return {
        ...prev,
        items: ensurePrimaryFirst(nextItems, prev.primary_product_id),
      };
    });
  };

  const savePage = async () => {
    if (form.items.length < 2) {
      setError("Select at least 2 smartphones before saving.");
      showToast("Error", "Select at least 2 smartphones", "error");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        product_ids: form.items.map((item) => item.product_id),
        primary_product_id:
          form.primary_product_id || form.items[0]?.product_id || null,
        compare_key: form.compare_key,
        segment_label: form.segment_label,
        smartphone_type_label: form.smartphone_type_label,
        slug: form.slug,
        title: form.title,
        meta_description: form.meta_description,
        status: form.status,
        source: form.source,
        generation_reason: form.generation_reason,
        system_score: form.system_score,
        manual_compare_count: form.manual_compare_count,
        last_compared_at: form.last_compared_at,
        generated_at: form.generated_at,
      };
      const endpoint = form.id
        ? `/api/admin/compare-pages/${form.id}`
        : "/api/admin/compare-pages";
      const method = form.id ? "PUT" : "POST";
      const response = await fetch(buildUrl(endpoint), {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const error = new Error(data?.message || `HTTP ${response.status}`);
        error.existingPage = data?.existingPage
          ? normalizeComparePage(data.existingPage)
          : null;
        throw error;
      }

      const data = await response.json();
      const page = normalizeComparePage(data?.page || {});
      setForm(page);
      setSelectedPageId(page.id);
      setExistingPageHint(null);
      setPages((prev) => {
        const others = prev.filter((item) => item.id !== page.id);
        return [page, ...others].sort((left, right) =>
          String(right.updated_at || "").localeCompare(String(left.updated_at || "")),
        );
      });
      showToast(
        "Saved",
        page.status === "published"
          ? "Compare page published successfully"
          : "Compare page saved as draft",
        "success",
      );
    } catch (err) {
      const message = err?.message || "Failed to save compare page";
      if (err?.existingPage) {
        setExistingPageHint(err.existingPage);
      }
      setError(message);
      showToast("Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async () => {
    if (!form.id) return;
    const confirmed = window.confirm("Delete this compare page?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(
        buildUrl(`/api/admin/compare-pages/${form.id}`),
        {
          method: "DELETE",
          headers: authHeaders(),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPages((prev) => prev.filter((page) => page.id !== form.id));
      resetDraft();
      setIsFormOpen(false);
      showToast("Deleted", "Compare page removed", "success");
    } catch (err) {
      setError("Failed to delete compare page");
      showToast("Error", "Failed to delete compare page", "error");
    } finally {
      setDeleting(false);
    }
  };

  const previewSegmentLabel = useMemo(
    () => form.segment_label || resolveSmartphoneSegmentLabel(form.items),
    [form.items, form.segment_label],
  );
  const previewSlug = useMemo(
    () => form.slug || buildCompareSlug(form.items),
    [form.items, form.slug],
  );
  const previewRoutePath = previewSlug ? `/compare/${previewSlug}` : "/compare";
  const previewTitle = useMemo(
    () =>
      form.title ||
      buildCompareTitle({
        items: form.items,
        segmentLabel: previewSegmentLabel,
        smartphoneTypeLabel: form.smartphone_type_label,
      }),
    [form.items, form.smartphone_type_label, form.title, previewSegmentLabel],
  );
  const previewDescription = useMemo(
    () =>
      form.meta_description ||
      buildCompareDescription({
        items: form.items,
        segmentLabel: previewSegmentLabel,
        smartphoneTypeLabel: form.smartphone_type_label,
      }),
    [
      form.items,
      form.meta_description,
      form.smartphone_type_label,
      previewSegmentLabel,
    ],
  );
  const publishedPageCount = pages.filter((page) => page.status === "published").length;
  const automaticPageCount = pages.filter((page) => page.source === "automatic").length;
  const manualPageCount = pages.filter((page) => page.source === "manual").length;
  const totalPages = Math.max(1, Math.ceil(pages.length / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedPages = useMemo(() => {
    const start = (currentPageSafe - 1) * PAGE_SIZE;
    return pages.slice(start, start + PAGE_SIZE);
  }, [currentPageSafe, pages]);
  const pageRangeStart = pages.length === 0 ? 0 : (currentPageSafe - 1) * PAGE_SIZE + 1;
  const pageRangeEnd = Math.min(currentPageSafe * PAGE_SIZE, pages.length);
  const isCreateMode = !form.id;

  return (
    <div className="min-h-full bg-slate-50 p-3 sm:p-4 md:p-6">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-white rounded-lg shadow-lg border p-4 max-w-sm w-full flex items-start space-x-3 ${
              toast.type === "success"
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            {toast.type === "success" ? (
              <FaCheckCircle className="text-green-500 mt-0.5" />
            ) : (
              <FaExclamationCircle className="text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== toast.id))
              }
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Compare ERP
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Compare Pages
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Automatic smartphone compare pages are generated from competitor data
            and you can still manage manual pages on the same compare route.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadPages}
            disabled={loading || saving || deleting || syncingAutomaticPages}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={syncAutomaticPages}
            disabled={loading || saving || deleting || syncingAutomaticPages}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            {syncingAutomaticPages ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaMagic />
            )}
            Auto Sync
          </button>
          <button
            type="button"
            onClick={resetDraft}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <FaPlus />
            New Compare Page
          </button>
          {isFormOpen ? (
            <button
              type="button"
              onClick={closeFormPanel}
              disabled={saving || deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              <FaTimes />
              Close Form
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Total Pages
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{pages.length}</p>
          <p className="mt-1 text-xs text-slate-500">Published and draft compare pages</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Published
          </p>
          <p className="mt-3 text-2xl font-bold text-emerald-700">{publishedPageCount}</p>
          <p className="mt-1 text-xs text-slate-500">Ready for SEO route and prerender</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Automatic
          </p>
          <p className="mt-3 text-2xl font-bold text-blue-700">{automaticPageCount}</p>
          <p className="mt-1 text-xs text-slate-500">Created by system compare logic</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Manual
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{manualPageCount}</p>
          <p className="mt-1 text-xs text-slate-500">Created or managed from admin panel</p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      ) : null}

      {existingPageHint ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Already compared exists</p>
              <p className="mt-1 text-amber-800">
                {existingPageHint.source === "automatic"
                  ? "This automatic compare page already matches the current devices."
                  : "A compare page already exists for this device set."}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {existingPageHint.route_path || "/compare"}
              </p>
            </div>
            {existingPageHint.id ? (
              <button
                type="button"
                onClick={() => loadPageDetail(existingPageHint.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 font-medium text-amber-900 hover:bg-amber-100"
              >
                Open Existing Page
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Compare Page Registry</h2>
            <p className="mt-1 text-sm text-slate-500">
              ERP list view for automatic and manual compare pages
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {pageRangeStart}-{pageRangeEnd} of {pages.length}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm text-slate-700 min-w-[1180px] w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Compare Page
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Devices
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Segment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Compare Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center">
                    <FaSpinner className="mx-auto animate-spin text-2xl text-blue-600" />
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-sm text-slate-500">
                    No compare pages created yet.
                  </td>
                </tr>
              ) : (
                paginatedPages.map((page) => {
                  const itemNames = page.items
                    .map((item) => item.product_name)
                    .filter(Boolean)
                    .join(" | ");
                  const isActive = selectedPageId === page.id;
                  return (
                    <tr
                      key={page.id}
                      className={isActive ? "bg-blue-50/70" : "hover:bg-slate-50"}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[280px]">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                            {page.title || page.slug}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{page.route_path}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[260px] text-sm text-slate-700 line-clamp-3">
                          {itemNames || "No devices selected yet"}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            page.source === "automatic"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {page.source === "automatic" ? "Automatic" : "Manual"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-slate-700">
                        <div>{page.segment_label || "-"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {page.smartphone_type_label || "No type label"}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm font-medium text-slate-900">
                        {page.manual_compare_count || 0}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            page.status === "published"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {page.status === "published" ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-slate-500">
                        {formatDateTime(page.updated_at) || "Not saved"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => loadPageDetail(page.id)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Open
                          </button>
                          {page.route_path ? (
                            <a
                              href={`${SITE_ORIGIN}${page.route_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              View
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {pageRangeStart}-{pageRangeEnd} of {pages.length} compare pages
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPageSafe <= 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              Page {currentPageSafe} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPageSafe >= totalPages}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isFormOpen
        ? createPortal(
            <div className="fixed inset-0 z-[140] bg-slate-950/45 backdrop-blur-sm">
              <button
                type="button"
                aria-label="Close compare form"
                onClick={closeFormPanel}
                className="absolute inset-0 h-full w-full cursor-default"
              />
              <div className="absolute inset-y-0 right-0 flex w-full justify-end">
                <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl">
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Compare Form
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">
                        {isCreateMode ? "New Compare Page" : "Edit Compare Page"}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={closeFormPanel}
                      disabled={saving || deleting}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      <FaTimes />
                      Close
                    </button>
                  </div>
                  <div className="overflow-y-auto px-5 py-5">
      <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Compare Form
                </p>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isCreateMode ? "New Compare Form" : "Edit Compare Form"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Use this separate form to create or update a compare page without working inside the registry table.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {form.items.length}/{MAX_COMPARE_ITEMS} selected
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  {isCreateMode ? "Create Mode" : "Edit Mode"}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                  Same /compare route
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-8">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Device List and Actions
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Search products, assign the primary device, and manage dynamic suggestions
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Smartphones
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search a smartphone to use as primary product"
                      className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  {searchQuery.trim().length >= 2 ? (
                    <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
                      {searchLoading ? (
                        <div className="px-4 py-6 text-sm text-gray-500 flex items-center gap-2">
                          <FaSpinner className="animate-spin" />
                          Searching smartphones
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-gray-500">
                          No smartphone results found.
                        </div>
                      ) : (
                        <table className="text-sm text-slate-700 min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Smartphone
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Brand
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Price
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {searchResults.map((item) => (
                              <tr key={item.product_id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                  {item.product_name}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {item.brand_name || "Unknown brand"}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {item.best_price != null
                                    ? `Rs ${Number(item.best_price).toLocaleString("en-IN")}`
                                    : "-"}
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => handlePrimarySelection(item)}
                                    disabled={
                                      form.items.length >= MAX_COMPARE_ITEMS &&
                                      !form.items.some(
                                        (entry) => entry.product_id === item.product_id,
                                      )
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                  >
                                    <FaMagic />
                                    Use as Primary
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Selected Smartphones
                    </label>
                    <button
                      type="button"
                      onClick={() => fetchSuggestions(form.primary_product_id, true)}
                      disabled={!form.primary_product_id || suggestionsLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                    >
                      {suggestionsLoading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaMagic />
                      )}
                      Auto Fill Suggestions
                    </button>
                  </div>

                  {form.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                      Choose a primary smartphone first.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="text-sm text-slate-700 min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Slot
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Smartphone
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Brand
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Role
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {form.items.map((item, index) => {
                            const isPrimary = item.product_id === form.primary_product_id;
                            return (
                              <tr key={item.product_id} className={isPrimary ? "bg-blue-50/60" : "hover:bg-slate-50"}>
                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-medium text-slate-900">
                                    {item.product_name}
                                  </div>
                                  {item.reason ? (
                                    <div className="mt-1 text-xs text-blue-700 line-clamp-2">
                                      {item.reason}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {item.brand_name || "Unknown brand"}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {item.best_price != null
                                    ? `Rs ${Number(item.best_price).toLocaleString("en-IN")}`
                                    : "-"}
                                </td>
                                <td className="px-4 py-3">
                                  {isPrimary ? (
                                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                      Primary
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                      Compare
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    {!isPrimary ? (
                                      <button
                                        type="button"
                                        onClick={() => handleSetPrimary(item.product_id)}
                                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                      >
                                        Make Primary
                                      </button>
                                    ) : null}
                                    {index > 1 ? (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveItem(index, -1)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                      >
                                        <span className="inline-flex items-center gap-1">
                                          <FaArrowUp />
                                          Up
                                        </span>
                                      </button>
                                    ) : null}
                                    {index >= 1 && index < form.items.length - 1 ? (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveItem(index, 1)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                      >
                                        <span className="inline-flex items-center gap-1">
                                          <FaArrowDown />
                                          Down
                                        </span>
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(item.product_id)}
                                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                                    >
                                      <span className="inline-flex items-center gap-1">
                                        <FaTrash />
                                        Remove
                                      </span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {form.primary_product_id ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">
                        Dynamic Suggestions
                      </h3>
                      {suggestionsLoading ? (
                        <span className="text-xs text-gray-500 flex items-center gap-2">
                          <FaSpinner className="animate-spin" />
                          Loading suggestions
                        </span>
                      ) : null}
                    </div>
                    {suggestions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                        No dynamic suggestions available yet for this smartphone.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="text-sm text-slate-700 min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Suggested Device
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Brand
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Price
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Reason
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {suggestions.map((item) => {
                              const alreadyAdded = form.items.some(
                                (entry) => entry.product_id === item.product_id,
                              );
                              return (
                                <tr key={item.product_id} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                    {item.product_name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {item.brand_name || "Unknown brand"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {item.best_price != null
                                      ? `Rs ${Number(item.best_price).toLocaleString("en-IN")}`
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-500">
                                    {item.reason || "-"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => handleAddSuggestion(item)}
                                      disabled={alreadyAdded || form.items.length >= MAX_COMPARE_ITEMS}
                                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-60"
                                    >
                                      <FaPlus />
                                      {alreadyAdded ? "Added" : "Add"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="space-y-5 border-t border-slate-200 pt-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Page Information</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    ERP form details for route, SEO content, source, and publish state
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Segment Label
                    </label>
                    <input
                      type="text"
                      value={form.segment_label}
                      onChange={(event) => setField("segment_label", event.target.value)}
                      placeholder={previewSegmentLabel || "Flagship"}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Smartphone Type Label
                    </label>
                    <input
                      type="text"
                      value={form.smartphone_type_label}
                      onChange={(event) =>
                        setField("smartphone_type_label", event.target.value)
                      }
                      placeholder="Camera Flagship"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(event) => setField("slug", event.target.value)}
                      placeholder={previewSlug || "auto generated on save"}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <textarea
                      value={form.title}
                      onChange={(event) => setField("title", event.target.value)}
                      rows={4}
                      placeholder={previewTitle}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={form.meta_description}
                      onChange={(event) =>
                        setField("meta_description", event.target.value)
                      }
                      rows={5}
                      placeholder={previewDescription}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(event) => setField("status", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    SEO Preview
                  </h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Route</p>
                      <p className="mt-1 break-all text-slate-900">{previewRoutePath}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Title</p>
                      <p className="mt-1 text-slate-900">{previewTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Description</p>
                      <p className="mt-1 text-slate-900">{previewDescription}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                        Segment {previewSegmentLabel || "Auto"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                        Status {form.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                        Source {form.source}
                      </span>
                    </div>
                    {previewSlug ? (
                      <a
                        href={`${SITE_ORIGIN}${previewRoutePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                      >
                        <FaExternalLinkAlt />
                        Open public route
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Source
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {form.source === "automatic" ? "Automatic compare page" : "Manual compare page"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {form.generation_reason || "No automatic generation note available"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Compare Signals
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Count {form.manual_compare_count || 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Score {Number(form.system_score || 0).toFixed(1)}
                      {form.last_compared_at
                        ? ` | Last compared ${formatDateTime(form.last_compared_at)}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Publish Actions
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  New compare pages default to published so the same compare route
                  is ready for prerender and SEO as soon as you save.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {form.id ? (
                  <button
                    type="button"
                    onClick={deletePage}
                    disabled={saving || deleting}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                    Delete
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={savePage}
                  disabled={loading || saving || deleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {form.status === "published" ? "Save and Publish" : "Save Draft"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Route
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {form.route_path || previewRoutePath}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Updated
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {formatDateTime(form.updated_at) || "Not saved yet"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Published
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {formatDateTime(form.published_at) || "Not published yet"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Generated
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {formatDateTime(form.generated_at) || "Not generated yet"}
                </p>
              </div>
            </div>
          </div>
        </section>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

