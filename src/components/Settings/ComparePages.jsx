import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowDown,
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
const DEFAULT_GENERATION_REASONS = [
  "User Comparison Trend",
  "Price Segment Demand",
  "Brand Rivalry",
  "Editorial Selection",
];
const DEVICE_ACCENT_CLASSES = [
  "from-[#0F172A] via-[#1E3A8A] to-[#60A5FA]",
  "from-[#111827] via-[#475569] to-[#E2E8F0]",
  "from-[#1E40AF] via-[#3B82F6] to-[#93C5FD]",
];

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
  const [registryQuery, setRegistryQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [isCreateModeForced, setIsCreateModeForced] = useState(false);
  const [toasts, setToasts] = useState([]);
  const searchInputRef = useRef(null);

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
        setIsCreateModeForced(false);
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
    if (loading || isCreateModeForced || pages.length === 0) return;

    if (!selectedPageId) {
      setSelectedPageId(pages[0].id);
      setForm(pages[0]);
      return;
    }

    const matched = pages.find((page) => page.id === selectedPageId);
    if (!matched) {
      setSelectedPageId(pages[0].id);
      setForm(pages[0]);
      return;
    }

    if (form.id !== selectedPageId) {
      setForm(matched);
    }
  }, [form.id, isCreateModeForced, loading, pages, selectedPageId]);

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
              String(item?.product_type || "")
                .trim()
                .toLowerCase() === "smartphone",
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
    setForm({ ...createEmptyForm(), status: "draft" });
    setSearchQuery("");
    setSearchResults([]);
    setSuggestions([]);
    setExistingPageHint(null);
    setError("");
    setIsCreateModeForced(true);
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
    setSelectedPageId(null);
    setIsCreateModeForced(true);
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
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.items.length) return prev;

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

  const copyValue = useCallback(
    async (value, label) => {
      if (!value) return;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
          showToast("Copied", `${label} copied`, "success");
        }
      } catch {
        showToast("Error", `Unable to copy ${label.toLowerCase()}`, "error");
      }
    },
    [showToast],
  );

  const savePage = async (statusOverride = form.status) => {
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
        status: statusOverride,
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
        const requestError = new Error(data?.message || `HTTP ${response.status}`);
        requestError.existingPage = data?.existingPage
          ? normalizeComparePage(data.existingPage)
          : null;
        throw requestError;
      }

      const data = await response.json();
      const page = normalizeComparePage(data?.page || {});
      setForm(page);
      setSelectedPageId(page.id);
      setIsCreateModeForced(false);
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

  const handleSaveAs = (status) => {
    setForm((prev) => ({ ...prev, status }));
    savePage(status);
  };

  const deletePage = async () => {
    if (!form.id) return;
    const confirmed = window.confirm("Delete this compare page?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(buildUrl(`/api/admin/compare-pages/${form.id}`), {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const deletedId = form.id;
      setPages((prev) => prev.filter((page) => page.id !== deletedId));
      setSelectedPageId(null);
      setForm({ ...createEmptyForm(), status: "draft" });
      setIsCreateModeForced(true);
      showToast("Deleted", "Compare page removed", "success");
    } catch (err) {
      setError("Failed to delete compare page");
      showToast("Error", "Failed to delete compare page", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredPages = useMemo(() => {
    const query = normalizeText(registryQuery).toLowerCase();
    return pages.filter((page) => {
      const matchesQuery =
        !query ||
        [
          page.title,
          page.slug,
          page.route_path,
          page.segment_label,
          page.smartphone_type_label,
          ...page.items.map((item) => item.product_name),
        ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesSource = sourceFilter === "all" || page.source === sourceFilter;
      const matchesStatus = statusFilter === "all" || page.status === statusFilter;
      const matchesSegment =
        segmentFilter === "all" ||
        normalizeText(page.segment_label) === normalizeText(segmentFilter);

      return matchesQuery && matchesSource && matchesStatus && matchesSegment;
    });
  }, [pages, registryQuery, segmentFilter, sourceFilter, statusFilter]);

  const segmentOptions = useMemo(
    () =>
      [...new Set(pages.map((page) => normalizeText(page.segment_label)).filter(Boolean))].sort(
        (left, right) => left.localeCompare(right),
      ),
    [pages],
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredPages.length / PAGE_SIZE));
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [filteredPages.length]);

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

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedPages = useMemo(() => {
    const start = (currentPageSafe - 1) * PAGE_SIZE;
    return filteredPages.slice(start, start + PAGE_SIZE);
  }, [currentPageSafe, filteredPages]);

  const pageRangeStart =
    filteredPages.length === 0 ? 0 : (currentPageSafe - 1) * PAGE_SIZE + 1;
  const pageRangeEnd = Math.min(currentPageSafe * PAGE_SIZE, filteredPages.length);
  const isCreateMode = isCreateModeForced || !form.id;

  const generationReasonOptions = useMemo(
    () =>
      [...new Set([...DEFAULT_GENERATION_REASONS, form.generation_reason].filter(Boolean))],
    [form.generation_reason],
  );

  const pageNumberItems = useMemo(() => {
    const pagesToShow = [];
    const start = Math.max(1, currentPageSafe - 2);
    const end = Math.min(totalPages, start + 4);
    for (let index = start; index <= end; index += 1) {
      pagesToShow.push(index);
    }
    return pagesToShow;
  }, [currentPageSafe, totalPages]);

  const getDeviceInitials = useCallback((value) => {
    const parts = String(value || "Compare")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "CP";
  }, []);

  const editorIdentity = form.id
    ? `#CMP-${String(form.id).padStart(4, "0")}`
    : "New Draft";

  const currentRoutePath = form.route_path || previewRoutePath;

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-sm ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <FaCheckCircle className="mt-0.5 text-emerald-500" />
            ) : (
              <FaExclamationCircle className="mt-0.5 text-red-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{toast.title}</p>
              <p className="mt-0.5 text-slate-600">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== toast.id))
              }
              className="text-slate-400 transition hover:text-slate-600"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Compare Pages
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage, create and auto-sync smartphone compare landing pages for SEO.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={loadPages}
            disabled={loading || saving || deleting || syncingAutomaticPages}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={syncAutomaticPages}
            disabled={loading || saving || deleting || syncingAutomaticPages}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {syncingAutomaticPages ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaMagic />
            )}
            Auto Sync
            <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500" />
          </button>
          <button
            type="button"
            onClick={resetDraft}
            disabled={saving || deleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#4D39FF] to-[#7A2CFF] px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <FaPlus />
            New Compare Page
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Pages",
            value: pages.length.toLocaleString("en-IN"),
            helper: "All compare pages",
            accent: "bg-violet-50 text-violet-600",
            icon: FaSave,
          },
          {
            label: "Published",
            value: publishedPageCount.toLocaleString("en-IN"),
            helper: "Live on website",
            accent: "bg-emerald-50 text-emerald-600",
            icon: FaCheckCircle,
          },
          {
            label: "Automatic",
            value: automaticPageCount.toLocaleString("en-IN"),
            helper: "Auto-generated",
            accent: "bg-blue-50 text-[#345CFF]",
            icon: FaMagic,
          },
          {
            label: "Manual",
            value: manualPageCount.toLocaleString("en-IN"),
            helper: "Manually created",
            accent: "bg-amber-50 text-amber-500",
            icon: FaPlus,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-md border border-slate-200 bg-white px-4 py-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${card.accent}`}
                >
                  <Icon className="text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-1 text-4xl font-bold leading-none tracking-tight text-slate-950">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {existingPageHint ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">A compare page already exists for this device set.</p>
              <p className="mt-1 text-amber-800">
                {existingPageHint.source === "automatic"
                  ? "This automatic compare page already matches the current devices."
                  : "You can open the existing page instead of creating a duplicate."}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {existingPageHint.route_path || "/compare"}
              </p>
            </div>
            {existingPageHint.id ? (
              <button
                type="button"
                onClick={() => loadPageDetail(existingPageHint.id)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Open Existing Page
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,1.08fr)]">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-3 py-4 sm:px-4">
            <h2 className="text-lg font-semibold text-slate-950">
              Compare Page Registry
            </h2>
          </div>

          <div className="border-b border-slate-200 px-2 py-3 sm:px-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_0.9fr_0.9fr_0.9fr_auto]">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="text"
                  value={registryQuery}
                  onChange={(event) => setRegistryQuery(event.target.value)}
                  placeholder="Search compare pages..."
                  className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
                />
              </div>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
              >
                <option value="all">All Source</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <select
                value={segmentFilter}
                onChange={(event) => setSegmentFilter(event.target.value)}
                className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
              >
                <option value="all">All Segment</option>
                {segmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              >
                <FaSearch className="text-sm" />
              </button>
            </div>
          </div>

          <div className="px-3 py-3 text-sm text-slate-500 sm:px-4">
            {filteredPages.length.toLocaleString("en-IN")} results
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
              <table className="min-w-[920px] w-full text-sm text-slate-700">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-3 py-3 sm:px-4">Compare Page</th>
                    <th className="px-3 py-3">Devices</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Segment</th>
                    <th className="px-3 py-3">Count</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Updated</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-10 text-center">
                        <FaSpinner className="mx-auto animate-spin text-xl text-[#4D39FF]" />
                      </td>
                    </tr>
                  ) : paginatedPages.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-10 text-center text-sm text-slate-500">
                        No compare pages found.
                      </td>
                    </tr>
                  ) : (
                    paginatedPages.map((page) => {
                      const isActive = !isCreateMode && selectedPageId === page.id;
                      return (
                        <tr
                          key={page.id}
                          className={`border-b border-slate-100 transition ${
                            isActive ? "bg-[#F5F3FF]" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-3 py-3 align-top sm:px-4">
                            <div className="max-w-[240px]">
                              <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                {page.title || page.slug || "Untitled compare page"}
                              </p>
                              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                {page.route_path || previewRoutePath}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex items-center gap-1.5">
                              {page.items.slice(0, 3).map((item, index) => (
                                <div
                                  key={`${page.id}-${item.product_id}`}
                                  className={`flex h-10 w-8 items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br text-[11px] font-semibold text-white ${DEVICE_ACCENT_CLASSES[index % DEVICE_ACCENT_CLASSES.length]}`}
                                >
                                  {getDeviceInitials(item.product_name)}
                                </div>
                              ))}
                              <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-200 px-2 text-[11px] font-semibold text-slate-500">
                                {page.items.length}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                page.source === "automatic"
                                  ? "bg-blue-50 text-[#345CFF]"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {page.source === "automatic" ? "Automatic" : "Manual"}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-top text-sm text-slate-700">
                            {page.segment_label || "-"}
                          </td>
                          <td className="px-3 py-3 align-top font-semibold text-slate-900">
                            {page.manual_compare_count
                              ? `${page.manual_compare_count.toLocaleString("en-IN")}`
                              : "-"}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                page.status === "published"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {page.status === "published" ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-top text-xs text-slate-500">
                            {formatDateTime(page.updated_at) || "Not saved"}
                          </td>
                          <td className="px-3 py-3 align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => loadPageDetail(page.id)}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Open
                              </button>
                              {page.route_path ? (
                                <a
                                  href={`${SITE_ORIGIN}${page.route_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-[#4D39FF] transition hover:bg-slate-50"
                                >
                                  <FaExternalLinkAlt className="text-[11px]" />
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
          </div>

          <div className="lg:hidden">
            {loading ? (
              <div className="px-4 py-10 text-center">
                <FaSpinner className="mx-auto animate-spin text-xl text-[#4D39FF]" />
              </div>
            ) : paginatedPages.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No compare pages found.
              </div>
            ) : (
              paginatedPages.map((page) => {
                const isActive = !isCreateMode && selectedPageId === page.id;
                return (
                  <article
                    key={page.id}
                    className={`border-t border-slate-200 px-2 py-3 ${
                      isActive ? "bg-[#F5F3FF]" : ""
                    }`}
                  >
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {page.title || page.slug || "Untitled compare page"}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {page.route_path || previewRoutePath}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadPageDetail(page.id)}
                          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                        >
                          Open
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5">
                        {page.items.slice(0, 3).map((item, index) => (
                          <div
                            key={`${page.id}-mobile-${item.product_id}`}
                            className={`flex h-10 w-8 items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br text-[11px] font-semibold text-white ${DEVICE_ACCENT_CLASSES[index % DEVICE_ACCENT_CLASSES.length]}`}
                          >
                            {getDeviceInitials(item.product_name)}
                          </div>
                        ))}
                        <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-200 px-2 text-[11px] font-semibold text-slate-500">
                          {page.items.length}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Source
                          </p>
                          <p className="mt-1 text-slate-700 capitalize">{page.source}</p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Status
                          </p>
                          <p className="mt-1 text-slate-700 capitalize">{page.status}</p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Segment
                          </p>
                          <p className="mt-1 text-slate-700">{page.segment_label || "-"}</p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Updated
                          </p>
                          <p className="mt-1 text-slate-700">
                            {formatDateTime(page.updated_at) || "Not saved"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-sm text-slate-500">
              Showing {pageRangeStart}-{pageRangeEnd} of {filteredPages.length} compare pages
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPageSafe <= 1}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {"<"}
              </button>
              {pageNumberItems.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-semibold transition ${
                    pageNumber === currentPageSafe
                      ? "border-[#4D39FF] bg-[#4D39FF] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPageSafe >= totalPages}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {">"}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Compare Page Editor
              </h2>
            </div>
            <div className="text-sm text-slate-500">ID: {editorIdentity}</div>
          </div>

          <div className="space-y-0">
            <section className="border-b border-slate-200 px-2 py-4 sm:px-4">
              <h3 className="text-sm font-semibold text-slate-950">
                1. Select Smartphones (2 to 3)
              </h3>

              <div className="mt-3 flex flex-col gap-3">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {form.items.map((item, index) => {
                    const isPrimary = item.product_id === form.primary_product_id;
                    const canMoveLeft = index > 0;
                    const canMoveRight = index < form.items.length - 1;
                    return (
                      <div
                        key={item.product_id}
                        className={`relative rounded-md border px-3 py-3 ${
                          isPrimary
                            ? "border-[#8B5CF6] bg-[#FAF7FF]"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        {isPrimary ? (
                          <span className="absolute left-0 top-0 rounded-br-md rounded-tl-md bg-[#6D35FF] px-2 py-1 text-[10px] font-semibold text-white">
                            Primary
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="absolute right-2 top-2 text-slate-400 transition hover:text-slate-700"
                        >
                          <FaTimes className="text-sm" />
                        </button>
                        <div className="flex items-center gap-3 pt-4">
                          <div className="flex shrink-0 flex-col gap-0.5 pt-1 text-slate-300">
                            <span className="block h-1 w-1 rounded-full bg-current" />
                            <span className="block h-1 w-1 rounded-full bg-current" />
                            <span className="block h-1 w-1 rounded-full bg-current" />
                            <span className="block h-1 w-1 rounded-full bg-current" />
                          </div>
                          <div
                            className={`flex h-14 w-10 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br text-xs font-semibold text-white ${DEVICE_ACCENT_CLASSES[index % DEVICE_ACCENT_CLASSES.length]}`}
                          >
                            {getDeviceInitials(item.product_name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                              {item.product_name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.brand_name || "Unknown brand"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          {!isPrimary ? (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(item.product_id)}
                              className="text-xs font-semibold text-[#4D39FF]"
                            >
                              Make Primary
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600">
                              Primary Device
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            {canMoveLeft ? (
                              <button
                                type="button"
                                onClick={() => handleMoveItem(index, -1)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
                                aria-label="Move device left"
                              >
                                <span className="text-[10px]">‹</span>
                              </button>
                            ) : null}
                            {canMoveRight ? (
                              <button
                                type="button"
                                onClick={() => handleMoveItem(index, 1)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
                                aria-label="Move device right"
                              >
                                <span className="text-[10px]">›</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {form.items.length < MAX_COMPARE_ITEMS ? (
                    <button
                      type="button"
                      onClick={() => searchInputRef.current?.focus()}
                      className="flex min-h-[132px] items-center justify-center rounded-md border border-dashed border-[#C4B5FD] bg-[#FCFBFF] px-4 py-4 text-center"
                    >
                      <div>
                        <p className="text-xl font-semibold text-[#6D35FF]">+</p>
                        <p className="mt-2 text-sm font-semibold text-[#6D35FF]">
                          Add Device
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          ({form.items.length} to 3 devices)
                        </p>
                      </div>
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => fetchSuggestions(form.primary_product_id, true)}
                    disabled={!form.primary_product_id || suggestionsLoading}
                    className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#6D35FF] disabled:opacity-50"
                  >
                    {suggestionsLoading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaMagic />
                    )}
                    Suggest device combinations
                  </button>

                  {form.items.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          items: [],
                          primary_product_id: null,
                        }));
                        setSuggestions([]);
                      }}
                      className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#6D35FF]"
                    >
                      <FaTrash className="text-xs" />
                      Clear all
                    </button>
                  ) : null}
                </div>

                <div className="relative">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    id="compare-page-device-search"
                    placeholder="Search smartphones to add into this compare page"
                    className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
                  />
                </div>

                {searchQuery.trim().length >= 2 ? (
                  <div className="rounded-md border border-slate-200 bg-white">
                    {searchLoading ? (
                      <div className="px-4 py-4 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <FaSpinner className="animate-spin" />
                          Searching smartphones
                        </span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-slate-500">
                        No smartphone results found.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {searchResults.map((item, index) => {
                          const alreadyAdded = form.items.some(
                            (entry) => entry.product_id === item.product_id,
                          );
                          return (
                            <div
                              key={item.product_id}
                              className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className={`flex h-12 w-9 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br text-xs font-semibold text-white ${DEVICE_ACCENT_CLASSES[index % DEVICE_ACCENT_CLASSES.length]}`}
                                >
                                  {getDeviceInitials(item.product_name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {item.product_name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {item.brand_name || "Unknown brand"}
                                    {item.best_price != null
                                      ? ` • Rs ${Number(item.best_price).toLocaleString("en-IN")}`
                                      : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => addItemToForm(item, false)}
                                  disabled={
                                    alreadyAdded ||
                                    (form.items.length >= MAX_COMPARE_ITEMS &&
                                      !alreadyAdded)
                                  }
                                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                  {alreadyAdded ? "Added" : "Add"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrimarySelection(item)}
                                  disabled={
                                    form.items.length >= MAX_COMPARE_ITEMS &&
                                    !alreadyAdded
                                  }
                                  className="inline-flex h-9 items-center justify-center rounded-md bg-[#4D39FF] px-3 text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                                >
                                  Use as Primary
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

                {form.primary_product_id && suggestions.length ? (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((item) => {
                      const alreadyAdded = form.items.some(
                        (entry) => entry.product_id === item.product_id,
                      );
                      return (
                        <button
                          key={`suggestion-${item.product_id}`}
                          type="button"
                          onClick={() => handleAddSuggestion(item)}
                          disabled={alreadyAdded || form.items.length >= MAX_COMPARE_ITEMS}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            alreadyAdded
                              ? "border-slate-200 bg-slate-100 text-slate-400"
                              : "border-[#C4B5FD] bg-[#FAF7FF] text-[#6D35FF] hover:bg-[#F4F0FF]"
                          }`}
                        >
                          {alreadyAdded ? "Added" : `+ ${item.product_name}`}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="border-b border-slate-200 px-2 py-4 sm:px-4">
              <h3 className="text-sm font-semibold text-slate-950">2. SEO Settings</h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Slug
                  </label>
                  <div className="flex overflow-hidden rounded-md border border-slate-200">
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(event) => setField("slug", event.target.value)}
                      placeholder={previewSlug || "auto generated on save"}
                      className="h-11 min-w-0 flex-1 border-0 px-3 text-sm text-slate-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyValue(previewSlug, "Slug")}
                      className="border-l border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-slate-700">
                      SEO Title
                    </label>
                    <span className="text-xs text-slate-400">
                      {form.title.length || previewTitle.length}/70
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setField("title", event.target.value)}
                    placeholder={previewTitle}
                    className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Meta Description
                    </label>
                    <span className="text-xs text-slate-400">
                      {form.meta_description.length || previewDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    value={form.meta_description}
                    onChange={(event) => setField("meta_description", event.target.value)}
                    placeholder={previewDescription}
                    rows={3}
                    className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
                  />
                </div>
              </div>
            </section>

            <section className="border-b border-slate-200 px-2 py-4 sm:px-4">
              <h3 className="text-sm font-semibold text-slate-950">
                3. Publishing Settings
              </h3>

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) => setField("status", event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Source
                  </label>
                  <select
                    value={form.source}
                    onChange={(event) => setField("source", event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Generation Reason
                  </label>
                  <select
                    value={form.generation_reason}
                    onChange={(event) =>
                      setField("generation_reason", event.target.value)
                    }
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
                  >
                    <option value="">Select reason</option>
                    {generationReasonOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Segment Label
                  </label>
                  <input
                    type="text"
                    value={form.segment_label}
                    onChange={(event) => setField("segment_label", event.target.value)}
                    placeholder={previewSegmentLabel || "Premium"}
                    className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Smartphone Type Label
                  </label>
                  <input
                    type="text"
                    value={form.smartphone_type_label}
                    onChange={(event) =>
                      setField("smartphone_type_label", event.target.value)
                    }
                    placeholder="Camera Flagship"
                    className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-[#4D39FF]"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Route Path (Auto-generated)
                </label>
                <div className="flex overflow-hidden rounded-md border border-slate-200">
                  <input
                    type="text"
                    value={currentRoutePath}
                    readOnly
                    className="h-11 min-w-0 flex-1 border-0 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyValue(currentRoutePath, "Route path")}
                    className="border-l border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </section>

            <section className="border-b border-slate-200 px-2 py-4 sm:px-4">
              <h3 className="text-sm font-semibold text-slate-950">4. Live Preview</h3>

              <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="flex shrink-0 items-center gap-2">
                    {form.items.length ? (
                      form.items.slice(0, MAX_COMPARE_ITEMS).map((item, index) => (
                        <React.Fragment key={`preview-${item.product_id}`}>
                          <div
                            className={`flex h-20 w-12 items-center justify-center rounded-sm bg-gradient-to-br text-xs font-semibold text-white ${DEVICE_ACCENT_CLASSES[index % DEVICE_ACCENT_CLASSES.length]}`}
                          >
                            {getDeviceInitials(item.product_name)}
                          </div>
                          {index < Math.min(form.items.length, MAX_COMPARE_ITEMS) - 1 ? (
                            <span className="text-xs font-semibold text-slate-400">VS</span>
                          ) : null}
                        </React.Fragment>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-400">
                        Add devices to preview compare layout
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-semibold text-[#2944C5]">
                      {previewTitle}
                    </h4>
                    <a
                      href={`${SITE_ORIGIN}${currentRoutePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 break-all text-sm text-emerald-600"
                    >
                      {`${SITE_ORIGIN}${currentRoutePath}`}
                      <FaExternalLinkAlt className="text-xs" />
                    </a>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {previewDescription}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4D39FF]">
                        {form.items.length} Devices
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {form.source === "automatic" ? "Auto Generated" : "Manual"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {form.updated_at
                          ? `Updated ${formatDateTime(form.updated_at)}`
                          : "Not saved yet"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="px-2 py-4 sm:px-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {form.id ? (
                  <button
                    type="button"
                    onClick={deletePage}
                    disabled={saving || deleting}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                    Delete Page
                  </button>
                ) : (
                  <span className="text-sm text-slate-400">Create a new compare page draft</span>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleSaveAs("draft")}
                    disabled={loading || saving || deleting}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {saving && form.status === "draft" ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaSave />
                    )}
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAs("published")}
                    disabled={loading || saving || deleting}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#4D39FF] to-[#7A2CFF] px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
                  >
                    {saving && form.status === "published" ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaSave />
                    )}
                    Publish Page
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

