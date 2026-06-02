import React, { useEffect, useMemo, useState } from "react";
import {
  FaBullhorn,
  FaCalendarAlt,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaExternalLinkAlt,
  FaFilter,
  FaLink,
  FaPlus,
  FaSave,
  FaSearch,
  FaTags,
  FaTrash,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../api";
import {
  editorDangerButtonClassName,
  editorGhostButtonClassName,
  editorPrimaryButtonClassName,
  EditorStatusChip,
  EditorTabBar,
} from "./MobileEditorUi";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

const SCOPE_OPTIONS = [
  { value: "global", label: "Global", helper: "Show anywhere this page permission is enabled." },
  { value: "product", label: "Product", helper: "Attach this link to a single product." },
  { value: "blog", label: "News Article", helper: "Show only inside a specific news article." },
  { value: "brand", label: "Brand", helper: "Reuse the same link across a brand family." },
  { value: "category", label: "Category", helper: "Target a category like flagship or gaming." },
];

const PAGE_PERMISSION_OPTIONS = [
  { key: "allow_product_list", label: "Product Listing" },
  { key: "allow_product_detail", label: "Product Details" },
  { key: "allow_news", label: "News Page" },
];

const LIST_SLOT_OPTIONS = [
  { value: "product_card", label: "Product Card" },
  { value: "listing_featured", label: "Featured Listing Block" },
];

const DETAIL_SLOT_OPTIONS = [
  { value: "detail_highlight", label: "Detail Highlight" },
  { value: "store_panel", label: "Store Panel" },
];

const NEWS_SLOT_OPTIONS = [
  { value: "inline_after_intro", label: "After Intro" },
  { value: "article_end", label: "Near Article End" },
];

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 sm:px-3 md:px-4";

const CARD_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";

const SECTION_HEADER_CLASS =
  "border-b border-slate-200 bg-white px-3 py-4 sm:px-4";

const SECTION_BODY_CLASS = "px-3 py-4 sm:px-4";

const FIELD_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:bg-white focus:ring-0";

const TEXTAREA_CLASS =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:bg-white focus:ring-0";

const GHOST_BUTTON_CLASS = `${editorGhostButtonClassName} rounded-md border-slate-200 bg-white shadow-none`;

const PRIMARY_BUTTON_CLASS = `${editorPrimaryButtonClassName} rounded-md border-[#4C35F2] bg-[#4C35F2] shadow-none`;

const DANGER_BUTTON_CLASS = `${editorDangerButtonClassName} rounded-md shadow-none`;

const FILTER_BADGE_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-[#4C35F2] shadow-none";

const ROW_ACTION_BUTTON_CLASS =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";

const ROW_PRIMARY_BUTTON_CLASS =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-3 text-xs font-semibold text-white transition hover:bg-[#3f2ae0]";

const ROW_DANGER_BUTTON_CLASS =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50";

const SUBSECTION_CARD_CLASS = "rounded-md border border-slate-200 bg-slate-50 px-4 py-4";

const EDITOR_TABS = [
  { id: "content", label: "Content", icon: FaLink },
  { id: "targeting", label: "Targeting", icon: FaTags },
  { id: "schedule", label: "Schedule", icon: FaCalendarAlt },
  { id: "preview", label: "Preview", icon: FaBullhorn },
];

const PAGE_PERMISSION_HELPERS = {
  allow_product_list: "Category pages, product grids, and search/list cards.",
  allow_product_detail: "The main product detail page and detail modules.",
  allow_news: "News articles, launch stories, and deal coverage.",
};

const STAT_ICON_CLASSES = {
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
};

const createEmptyFormData = () => ({
  name: "",
  title: "",
  description: "",
  cta_text: "Check price",
  cta_subtext: "",
  badge_text: "Affiliate",
  disclosure_text: "Affiliate link",
  store_name: "",
  store_logo_url: "",
  image_url: "",
  destination_url: "",
  affiliate_url: "",
  price: "",
  currency_code: "INR",
  priority: 0,
  status: "draft",
  publish_at: "",
  unpublish_at: "",
  duration_days: "",
  allow_product_list: true,
  allow_product_detail: false,
  allow_news: false,
  scope_type: "global",
  product_id: "",
  blog_id: "",
  brand_id: "",
  category_name: "",
  list_slot: "product_card",
  detail_slot: "detail_highlight",
  news_slot: "inline_after_intro",
});

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toUtcIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const formatDateLabel = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (value, currencyCode = "INR") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Price optional";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode || "INR",
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `₹${Math.round(numeric).toLocaleString("en-IN")}`;
  }
};

const getLifecycleBadgeClass = (state) => {
  if (state === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (state === "scheduled") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (state === "expired") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (state === "unpublished") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
};

const resolvePlacementTitle = (placement) =>
  placement?.title || placement?.name || "Untitled placement";

const buildHeaders = (json = false) => {
  const token = getAuthToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const normalizeComparisonText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeComparisonUrl = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/g, "");

const hasPageOverlap = (left = {}, right = {}) =>
  Boolean(
    (Boolean(left.allow_product_list) && Boolean(right.allow_product_list)) ||
      (Boolean(left.allow_product_detail) &&
        Boolean(right.allow_product_detail)) ||
      (Boolean(left.allow_news) && Boolean(right.allow_news)),
  );

const resolveScopeLabel = (value) =>
  SCOPE_OPTIONS.find((option) => option.value === value)?.label || "Global";

const resolvePlacementPageTags = (placement) =>
  PAGE_PERMISSION_OPTIONS.filter((option) => Boolean(placement?.[option.key])).map(
    (option) => option.label,
  );

const resolvePlacementTargetLabel = (placement) => {
  if (placement?.product_name) return placement.product_name;
  if (placement?.blog_title) return placement.blog_title;
  if (placement?.brand_name) return placement.brand_name;
  if (placement?.category_name) return placement.category_name;
  return "Applies broadly";
};

const resolveLifecycleTone = (state) => {
  if (state === "active") return "success";
  if (state === "scheduled") return "warning";
  if (state === "expired") return "danger";
  if (state === "unpublished") return "neutral";
  return "info";
};

function SummaryCard({ label, value, helper, icon: Icon, tone = "violet" }) {
  return (
    <div className={`${CARD_CLASS} px-4 py-4 sm:px-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </div>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${STAT_ICON_CLASSES[tone]}`}
        >
          <Icon className="text-lg" />
        </div>
      </div>
    </div>
  );
}

const AffiliatePlacementManager = () => {
  const [placements, setPlacements] = useState([]);
  const [options, setOptions] = useState({
    products: [],
    blogs: [],
    brands: [],
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeEditorTab, setActiveEditorTab] = useState("content");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    page: "all",
  });
  const [formData, setFormData] = useState(createEmptyFormData);
  const [toasts, setToasts] = useState([]);

  const showToast = (title, message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4200);
  };

  const fetchAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [placementsRes, optionsRes] = await Promise.all([
        fetch(buildUrl("/api/admin/affiliate-placements"), {
          headers: buildHeaders(),
        }),
        fetch(buildUrl("/api/admin/affiliate-placements/options"), {
          headers: buildHeaders(),
        }),
      ]);

      if (!placementsRes.ok) {
        let message = `Placements request failed (${placementsRes.status})`;
        try {
          const errorData = await placementsRes.json();
          if (errorData?.message) message = errorData.message;
        } catch (_error) {
          // Ignore parse failures and keep the fallback message.
        }
        throw new Error(message);
      }
      if (!optionsRes.ok) {
        let message = `Options request failed (${optionsRes.status})`;
        try {
          const errorData = await optionsRes.json();
          if (errorData?.message) message = errorData.message;
        } catch (_error) {
          // Ignore parse failures and keep the fallback message.
        }
        throw new Error(message);
      }

      const placementsData = await placementsRes.json();
      const optionsData = await optionsRes.json();

      setPlacements(Array.isArray(placementsData?.rows) ? placementsData.rows : []);
      setOptions({
        products: Array.isArray(optionsData?.products) ? optionsData.products : [],
        blogs: Array.isArray(optionsData?.blogs) ? optionsData.blogs : [],
        brands: Array.isArray(optionsData?.brands) ? optionsData.brands : [],
        categories: Array.isArray(optionsData?.categories)
          ? optionsData.categories
          : [],
      });

      if (!silent && Array.isArray(placementsData?.warnings)) {
        placementsData.warnings
          .filter((warning) => typeof warning === "string" && warning.trim())
          .forEach((warning, index) => {
            window.setTimeout(() => {
              showToast("Warning", warning, "warning");
            }, index * 50);
          });
      }
    } catch (error) {
      console.error("Affiliate placement fetch error:", error);
      showToast("Error", error.message || "Failed to load affiliate data.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAllData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData(createEmptyFormData());
    setActiveEditorTab("content");
  };

  const handleEdit = (placement) => {
    setEditingId(placement.id);
    setActiveEditorTab("content");
    setFormData({
      name: placement.name || "",
      title: placement.title || "",
      description: placement.description || "",
      cta_text: placement.cta_text || "Check price",
      cta_subtext: placement.cta_subtext || "",
      badge_text: placement.badge_text || "Affiliate",
      disclosure_text: placement.disclosure_text || "Affiliate link",
      store_name: placement.store_name || "",
      store_logo_url: placement.store_logo_url || "",
      image_url: placement.image_url || "",
      destination_url: placement.destination_url || "",
      affiliate_url: placement.affiliate_url || "",
      price:
        placement.price === null || placement.price === undefined
          ? ""
          : String(placement.price),
      currency_code: placement.currency_code || "INR",
      priority: Number(placement.priority || 0),
      status: placement.status || "draft",
      publish_at: toDateTimeLocal(placement.publish_at),
      unpublish_at: toDateTimeLocal(placement.unpublish_at),
      duration_days:
        placement.duration_days === null || placement.duration_days === undefined
          ? ""
          : String(placement.duration_days),
      allow_product_list: Boolean(placement.allow_product_list),
      allow_product_detail: Boolean(placement.allow_product_detail),
      allow_news: Boolean(placement.allow_news),
      scope_type: placement.scope_type || "global",
      product_id: placement.product_id ? String(placement.product_id) : "",
      blog_id: placement.blog_id ? String(placement.blog_id) : "",
      brand_id: placement.brand_id ? String(placement.brand_id) : "",
      category_name: placement.category_name || "",
      list_slot: placement.list_slot || "product_card",
      detail_slot: placement.detail_slot || "detail_highlight",
      news_slot: placement.news_slot || "inline_after_intro",
    });
  };

  const handleDelete = async (placement) => {
    if (!window.confirm(`Delete "${resolvePlacementTitle(placement)}"?`)) return;
    try {
      const response = await fetch(
        buildUrl(`/api/admin/affiliate-placements/${placement.id}`),
        {
          method: "DELETE",
          headers: buildHeaders(),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || `Delete failed (${response.status})`);
      }

      setPlacements((prev) => prev.filter((item) => item.id !== placement.id));
      if (editingId === placement.id) resetForm();
      showToast("Deleted", "Affiliate placement removed.", "success");
    } catch (error) {
      console.error("Affiliate placement delete error:", error);
      showToast("Error", error.message || "Failed to delete placement.", "error");
    }
  };

  const handleTogglePublish = async (placement) => {
    const nextStatus = placement.status === "published" ? "unpublished" : "published";
    const payload = {
      status: nextStatus,
      publish_at:
        nextStatus === "published"
          ? placement.publish_at || new Date().toISOString()
          : placement.publish_at || null,
    };

    try {
      const response = await fetch(
        buildUrl(`/api/admin/affiliate-placements/${placement.id}`),
        {
          method: "PUT",
          headers: buildHeaders(true),
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || `Update failed (${response.status})`);
      }

      setPlacements((prev) =>
        prev.map((item) => (item.id === placement.id ? data.data : item)),
      );
      if (editingId === placement.id) {
        handleEdit(data.data);
      }
      showToast(
        nextStatus === "published" ? "Published" : "Unpublished",
        `Placement is now ${nextStatus}.`,
        "success",
      );
    } catch (error) {
      console.error("Affiliate placement publish toggle error:", error);
      showToast("Error", error.message || "Failed to update placement.", "error");
    }
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePermissionToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (duplicateAutoPlacement) {
      showToast(
        "Duplicate auto placement",
        `A system-generated affiliate placement already exists for ${duplicateAutoPlacement.product_name || "this product"} on ${duplicateAutoPlacement.store_name || "the same store"}.`,
        "error",
      );
      return;
    }

    const payload = {
      ...formData,
      price: formData.price ? Number(formData.price) : null,
      priority: Number(formData.priority || 0),
      duration_days: formData.duration_days ? Number(formData.duration_days) : null,
      publish_at: toUtcIso(formData.publish_at),
      unpublish_at: toUtcIso(formData.unpublish_at),
      product_id: formData.product_id ? Number(formData.product_id) : null,
      blog_id: formData.blog_id ? Number(formData.blog_id) : null,
      brand_id: formData.brand_id ? Number(formData.brand_id) : null,
      category_name: formData.category_name || null,
    };

    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? buildUrl(`/api/admin/affiliate-placements/${editingId}`)
        : buildUrl("/api/admin/affiliate-placements");

      const response = await fetch(url, {
        method,
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data?.duplicate) {
          throw new Error(
            `${data.message} Existing auto placement: ${data.duplicate.title || data.duplicate.product_name || "automatic placement"}.`,
          );
        }
        throw new Error(data?.message || `Save failed (${response.status})`);
      }

      if (editingId) {
        setPlacements((prev) =>
          prev.map((item) => (item.id === editingId ? data.data : item)),
        );
        showToast("Saved", "Affiliate placement updated.", "success");
      } else {
        setPlacements((prev) => [data.data, ...prev]);
        showToast("Saved", "Affiliate placement created.", "success");
      }

      handleEdit(data.data);
    } catch (error) {
      console.error("Affiliate placement save error:", error);
      showToast("Error", error.message || "Failed to save placement.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredPlacements = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();

    return placements.filter((placement) => {
      if (filters.status !== "all" && placement.status !== filters.status) {
        return false;
      }

      if (filters.page !== "all") {
        if (
          filters.page === "product_list" &&
          !placement.allow_product_list
        ) {
          return false;
        }
        if (
          filters.page === "product_detail" &&
          !placement.allow_product_detail
        ) {
          return false;
        }
        if (filters.page === "news" && !placement.allow_news) {
          return false;
        }
      }

      if (!needle) return true;

      const haystack = [
        placement.name,
        placement.title,
        placement.description,
        placement.store_name,
        placement.scope_type,
        placement.product_name,
        placement.blog_title,
        placement.brand_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [filters.page, filters.search, filters.status, placements]);

  const summary = useMemo(() => {
    const total = placements.length;
    const automatic = placements.filter((item) => item.source_type === "auto").length;
    const manual = total - automatic;
    const active = placements.filter((item) => item.lifecycle_state === "active").length;
    const scheduled = placements.filter(
      (item) => item.lifecycle_state === "scheduled",
    ).length;
    const clicks = placements.reduce(
      (sum, item) => sum + Number(item.total_clicks || 0),
      0,
    );
    return { total, automatic, manual, active, scheduled, clicks };
  }, [placements]);

  const selectedScopeMeta =
    SCOPE_OPTIONS.find((option) => option.value === formData.scope_type) ||
    SCOPE_OPTIONS[0];

  const selectedProduct = useMemo(
    () =>
      options.products.find(
        (product) => String(product.id) === String(formData.product_id),
      ) || null,
    [formData.product_id, options.products],
  );

  const selectedBlog = useMemo(
    () =>
      options.blogs.find((blog) => String(blog.id) === String(formData.blog_id)) ||
      null,
    [formData.blog_id, options.blogs],
  );

  const selectedBrand = useMemo(
    () =>
      options.brands.find((brand) => String(brand.id) === String(formData.brand_id)) ||
      null,
    [formData.brand_id, options.brands],
  );

  const duplicateAutoPlacement = useMemo(() => {
    const isProductScope = formData.scope_type === "product" && formData.product_id;
    if (!isProductScope) return null;

    const targetUrl =
      normalizeComparisonUrl(formData.affiliate_url) ||
      normalizeComparisonUrl(formData.destination_url);
    const targetStore = normalizeComparisonText(formData.store_name);

    return (
      placements.find((placement) => {
        if (placement.source_type !== "auto") return false;
        if (editingId && Number(placement.id) === Number(editingId)) return false;
        if (String(placement.product_id || "") !== String(formData.product_id || "")) {
          return false;
        }
        if (!hasPageOverlap(formData, placement)) return false;

        const placementUrl =
          normalizeComparisonUrl(placement.affiliate_url) ||
          normalizeComparisonUrl(placement.destination_url);
        const placementStore = normalizeComparisonText(placement.store_name);

        const urlMatches = targetUrl && placementUrl && targetUrl === placementUrl;
        const storeMatches =
          targetStore && placementStore && targetStore === placementStore;

        return Boolean(urlMatches || storeMatches);
      }) || null
    );
  }, [editingId, formData, placements]);

  const selectedPageLabels = useMemo(
    () =>
      PAGE_PERMISSION_OPTIONS.filter((option) => Boolean(formData[option.key])).map(
        (option) => option.label,
      ),
    [formData],
  );

  const editorTargetSummary =
    (formData.scope_type === "product" && selectedProduct?.name) ||
    (formData.scope_type === "blog" && selectedBlog?.title) ||
    (formData.scope_type === "brand" && selectedBrand?.name) ||
    (formData.scope_type === "category" && formData.category_name) ||
    "No specific target selected";

  return (
    <div className="relative min-h-screen bg-[#f8fafc]">
      <div className={PAGE_CLASS}>
        <div className="border-b border-slate-200 pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Affiliate Links
                </h1>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-600 shadow-none">
                  <FaBullhorn className="text-base" />
                </div>
              </div>

              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Control where affiliate links render across product listings,
                product details, and news pages with manual permissions, timing,
                and automatic placement support.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => fetchAllData(false)}
                className={GHOST_BUTTON_CLASS}
              >
                <FaBullhorn className="text-sm" />
                <span>Refresh Data</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={PRIMARY_BUTTON_CLASS}
              >
                <FaPlus className="text-sm" />
                <span>New Placement</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Placements",
              value: summary.total.toLocaleString(),
              helper: "All affiliate modules in the system.",
              icon: FaBullhorn,
              tone: "violet",
            },
            {
              label: "Manual Placements",
              value: summary.manual.toLocaleString(),
              helper: "Created directly by the marketing team.",
              icon: FaEdit,
              tone: "emerald",
            },
            {
              label: "Automatic Placements",
              value: summary.automatic.toLocaleString(),
              helper: "Generated from product and store data already in the database.",
              icon: FaLink,
              tone: "amber",
            },
            {
              label: "Live / Scheduled",
              value: `${summary.active.toLocaleString()} / ${summary.scheduled.toLocaleString()}`,
              helper: "Live now on the left, scheduled to publish on the right.",
              icon: FaCalendarAlt,
              tone: "blue",
            },
          ].map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(460px,0.95fr)]">
          <section className={CARD_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative min-w-0 flex-1">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: event.target.value,
                      }))
                    }
                    placeholder="Search by title, product, brand, or store..."
                    className={`${FIELD_CLASS} pl-10`}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[170px_180px_auto]">
                  <select
                    value={filters.status}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                    className={FIELD_CLASS}
                  >
                    <option value="all">All statuses</option>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.page}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        page: event.target.value,
                      }))
                    }
                    className={FIELD_CLASS}
                  >
                    <option value="all">All pages</option>
                    <option value="product_list">Product listing</option>
                    <option value="product_detail">Product details</option>
                    <option value="news">News page</option>
                  </select>

                  <div className="flex gap-2">
                    <div className={FILTER_BADGE_CLASS}>
                      <FaFilter className="text-sm" />
                      <span>Filters</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          search: "",
                          status: "all",
                          page: "all",
                        })
                      }
                      className={GHOST_BUTTON_CLASS}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={SECTION_BODY_CLASS}>
              {loading ? (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500">
                  Loading affiliate placements...
                </div>
              ) : filteredPlacements.length ? (
                <>
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="min-w-full text-sm text-slate-700">
                      <thead className="bg-white text-xs uppercase tracking-[0.08em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Placement</th>
                          <th className="px-4 py-3 text-left font-semibold">Type</th>
                          <th className="px-4 py-3 text-left font-semibold">Target</th>
                          <th className="px-4 py-3 text-left font-semibold">Pages</th>
                          <th className="px-4 py-3 text-left font-semibold">Performance</th>
                          <th className="px-4 py-3 text-left font-semibold">Schedule</th>
                          <th className="px-4 py-3 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredPlacements.map((placement) => {
                          const isAutomatic = placement.source_type === "auto";
                          const pageTags = resolvePlacementPageTags(placement);
                          const targetLabel = resolvePlacementTargetLabel(placement);

                          return (
                            <tr
                              key={placement.id}
                              className={
                                editingId === placement.id
                                  ? "bg-violet-50/50"
                                  : "hover:bg-slate-50/70"
                              }
                            >
                              <td className="px-4 py-4 align-top">
                                <div className="min-w-[240px]">
                                  <p className="font-semibold text-slate-900">
                                    {resolvePlacementTitle(placement)}
                                  </p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                    {placement.description || "No description added yet."}
                                  </p>
                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {placement.store_name ? (
                                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                                        {placement.store_name}
                                      </span>
                                    ) : null}
                                    {placement.badge_text ? (
                                      <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                        {placement.badge_text}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="flex min-w-[170px] flex-wrap gap-2">
                                  <EditorStatusChip
                                    label={placement.lifecycle_state || placement.status}
                                    tone={resolveLifecycleTone(placement.lifecycle_state)}
                                    className="rounded-md"
                                  />
                                  <EditorStatusChip
                                    label={resolveScopeLabel(placement.scope_type)}
                                    tone="info"
                                    className="rounded-md"
                                  />
                                  <EditorStatusChip
                                    label={isAutomatic ? "Automatic" : "Manual"}
                                    tone={isAutomatic ? "warning" : "success"}
                                    className="rounded-md"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="min-w-[180px]">
                                  <p className="font-medium text-slate-900">{targetLabel}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {resolveScopeLabel(placement.scope_type)}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="flex min-w-[180px] flex-wrap gap-2">
                                  {pageTags.length ? (
                                    pageTags.map((tag) => (
                                      <span
                                        key={`${placement.id}-${tag}`}
                                        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                                      >
                                        {tag}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400">No page permissions</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="min-w-[140px] space-y-2">
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                                      Price
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                      {formatPrice(placement.price, placement.currency_code)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                                      Clicks
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                      {Number(placement.total_clicks || 0).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="min-w-[170px] space-y-2 text-xs text-slate-500">
                                  <div>
                                    <p className="uppercase tracking-[0.08em] text-slate-400">
                                      Publish
                                    </p>
                                    <p className="mt-1 text-slate-700">
                                      {formatDateLabel(placement.publish_at)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="uppercase tracking-[0.08em] text-slate-400">
                                      Auto stop
                                    </p>
                                    <p className="mt-1 text-slate-700">
                                      {formatDateLabel(placement.effective_unpublish_at)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="flex min-w-[220px] flex-col gap-2">
                                  {isAutomatic ? (
                                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                      Auto-generated from product store data
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleEdit(placement)}
                                        className={ROW_ACTION_BUTTON_CLASS}
                                      >
                                        <FaEdit className="text-xs" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleTogglePublish(placement)}
                                        className={
                                          placement.status === "published"
                                            ? ROW_ACTION_BUTTON_CLASS
                                            : ROW_PRIMARY_BUTTON_CLASS
                                        }
                                      >
                                        {placement.status === "published" ? (
                                          <FaEyeSlash className="text-xs" />
                                        ) : (
                                          <FaEye className="text-xs" />
                                        )}
                                        <span>
                                          {placement.status === "published"
                                            ? "Unpublish"
                                            : "Publish"}
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(placement)}
                                        className={ROW_DANGER_BUTTON_CLASS}
                                      >
                                        <FaTrash className="text-xs" />
                                        <span>Delete</span>
                                      </button>
                                    </>
                                  )}
                                  {(placement.affiliate_url || placement.destination_url) && (
                                    <a
                                      href={placement.affiliate_url || placement.destination_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#4C35F2] hover:text-[#3f2ae0]"
                                    >
                                      Open link
                                      <FaExternalLinkAlt className="text-[10px]" />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-4 xl:hidden">
                    {filteredPlacements.map((placement) => {
                      const isAutomatic = placement.source_type === "auto";
                      const pageTags = resolvePlacementPageTags(placement);

                      return (
                        <article
                          key={placement.id}
                          className={`rounded-md border px-4 py-4 transition ${
                            editingId === placement.id
                              ? "border-violet-200 bg-violet-50/50"
                              : "border-slate-200 bg-white hover:bg-slate-50/70"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <EditorStatusChip
                              label={placement.lifecycle_state || placement.status}
                              tone={resolveLifecycleTone(placement.lifecycle_state)}
                              className="rounded-md"
                            />
                            <EditorStatusChip
                              label={isAutomatic ? "Automatic" : "Manual"}
                              tone={isAutomatic ? "warning" : "success"}
                              className="rounded-md"
                            />
                          </div>

                          <h3 className="mt-3 text-base font-semibold text-slate-900">
                            {resolvePlacementTitle(placement)}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {placement.description || "No description added yet."}
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className={SUBSECTION_CARD_CLASS}>
                              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                                Target
                              </p>
                              <p className="mt-2 font-semibold text-slate-900">
                                {resolvePlacementTargetLabel(placement)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {resolveScopeLabel(placement.scope_type)}
                              </p>
                            </div>
                            <div className={SUBSECTION_CARD_CLASS}>
                              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                                Performance
                              </p>
                              <p className="mt-2 font-semibold text-slate-900">
                                {formatPrice(placement.price, placement.currency_code)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {Number(placement.total_clicks || 0).toLocaleString()} clicks
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {pageTags.map((tag) => (
                              <span
                                key={`${placement.id}-${tag}`}
                                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                            {!isAutomatic ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(placement)}
                                  className={ROW_ACTION_BUTTON_CLASS}
                                >
                                  <FaEdit className="text-xs" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublish(placement)}
                                  className={
                                    placement.status === "published"
                                      ? ROW_ACTION_BUTTON_CLASS
                                      : ROW_PRIMARY_BUTTON_CLASS
                                  }
                                >
                                  {placement.status === "published" ? (
                                    <FaEyeSlash className="text-xs" />
                                  ) : (
                                    <FaEye className="text-xs" />
                                  )}
                                  <span>
                                    {placement.status === "published"
                                      ? "Unpublish"
                                      : "Publish"}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(placement)}
                                  className={ROW_DANGER_BUTTON_CLASS}
                                >
                                  <FaTrash className="text-xs" />
                                  <span>Delete</span>
                                </button>
                              </>
                            ) : (
                              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                Automatic placement
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    No placements match these filters
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Clear the filters or create a new affiliate placement from the editor.
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className={`${CARD_CLASS} xl:sticky xl:top-6 xl:max-h-[calc(100vh-40px)] xl:overflow-y-auto`}>
            <div className={SECTION_HEADER_CLASS}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Editor
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {editingId ? "Update placement" : "Create placement"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Responsive rendering is handled by the public site. This screen
                only controls page permissions, targeting, and timing.
              </p>
            </div>

            <div
              className={`space-y-6 ${SECTION_BODY_CLASS} [&_input:not([type='checkbox'])]:h-11 [&_input:not([type='checkbox'])]:rounded-md [&_input:not([type='checkbox'])]:border [&_input:not([type='checkbox'])]:border-slate-200 [&_input:not([type='checkbox'])]:bg-white [&_input:not([type='checkbox'])]:px-3 [&_input:not([type='checkbox'])]:text-sm [&_input:not([type='checkbox'])]:text-slate-700 [&_input:not([type='checkbox'])]:outline-none [&_input:not([type='checkbox'])]:transition [&_input:not([type='checkbox'])]:placeholder:text-slate-400 [&_input:not([type='checkbox'])]:focus:border-[#345CFF] [&_input:not([type='checkbox'])]:focus:bg-white [&_input:not([type='checkbox'])]:focus:ring-0 [&_select]:h-11 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:text-slate-700 [&_select]:outline-none [&_select]:transition [&_select]:focus:border-[#345CFF] [&_select]:focus:bg-white [&_select]:focus:ring-0 [&_textarea]:w-full [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:bg-white [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-sm [&_textarea]:text-slate-700 [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:placeholder:text-slate-400 [&_textarea]:focus:border-[#345CFF] [&_textarea]:focus:bg-white [&_textarea]:focus:ring-0`}
            >
              {duplicateAutoPlacement ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                  A system-generated placement already exists for{" "}
                  <span className="font-semibold">
                    {duplicateAutoPlacement.product_name || "this product"}
                  </span>
                  {duplicateAutoPlacement.store_name
                    ? ` on ${duplicateAutoPlacement.store_name}`
                    : ""}.
                  Update the product/store data source instead of creating a duplicate
                  manual entry.
                </div>
              ) : null}

              <div className={SUBSECTION_CARD_CLASS}>
                <div className="flex flex-wrap items-center gap-2">
                  <EditorStatusChip
                    label={editingId ? "Editing existing placement" : "Creating new placement"}
                    tone={editingId ? "info" : "neutral"}
                    className="rounded-md"
                  />
                  <EditorStatusChip
                    label={resolveScopeLabel(formData.scope_type)}
                    tone="indigo"
                    className="rounded-md"
                  />
                  <EditorStatusChip
                    label={
                      selectedPageLabels.length
                        ? `${selectedPageLabels.length} page permissions`
                        : "No pages selected"
                    }
                    tone={selectedPageLabels.length ? "success" : "warning"}
                    className="rounded-md"
                  />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Target:{" "}
                  <span className="font-semibold text-slate-900">
                    {editorTargetSummary}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Use the tabs below to build the offer, choose placement rules,
                  and preview how it will look.
                </p>
              </div>

              <EditorTabBar
                tabs={EDITOR_TABS}
                activeTab={activeEditorTab}
                onSelect={setActiveEditorTab}
              />

              {activeEditorTab === "content" ? (
                <>
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FaLink className="text-[#4C35F2]" />
                  Content & offer
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Placement name
                  </span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Example: iPhone deal card"
                    className={FIELD_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Headline
                  </span>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Lowest tracked price this week"
                    className={FIELD_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Tell users why this store or offer matters here."
                    className={FIELD_CLASS}
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      CTA text
                    </span>
                    <input
                      name="cta_text"
                      value={formData.cta_text}
                      onChange={handleInputChange}
                      placeholder="Check price"
                      className={FIELD_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      CTA subtext
                    </span>
                    <input
                      name="cta_subtext"
                      value={formData.cta_subtext}
                      onChange={handleInputChange}
                      placeholder="Updated today"
                      className={FIELD_CLASS}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Badge text
                    </span>
                    <input
                      name="badge_text"
                      value={formData.badge_text}
                      onChange={handleInputChange}
                      placeholder="Affiliate"
                      className={FIELD_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Disclosure text
                    </span>
                    <input
                      name="disclosure_text"
                      value={formData.disclosure_text}
                      onChange={handleInputChange}
                      placeholder="Affiliate link"
                      className={FIELD_CLASS}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Store name
                    </span>
                    <input
                      name="store_name"
                      value={formData.store_name}
                      onChange={handleInputChange}
                      placeholder="Amazon"
                      className={FIELD_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Price
                    </span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="29999"
                      className={FIELD_CLASS}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Hero image URL
                  </span>
                  <input
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className={FIELD_CLASS}
                  />
                </label>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FaExternalLinkAlt className="text-[#4C35F2]" />
                  Destination
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Affiliate URL
                  </span>
                  <input
                    name="affiliate_url"
                    value={formData.affiliate_url}
                    onChange={handleInputChange}
                    placeholder="https://affiliate-network.example/link"
                    className={FIELD_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Fallback destination URL
                  </span>
                  <input
                    name="destination_url"
                    value={formData.destination_url}
                    onChange={handleInputChange}
                    placeholder="https://store.example/product"
                    className={FIELD_CLASS}
                  />
                </label>
              </section>
                </>
              ) : null}

              {activeEditorTab === "targeting" ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FaTags className="text-[#4C35F2]" />
                  Targeting & permissions
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Scope
                  </span>
                  <select
                    name="scope_type"
                    value={formData.scope_type}
                    onChange={handleInputChange}
                    className={FIELD_CLASS}
                  >
                    {SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {selectedScopeMeta.helper}
                  </p>
                </label>

                {formData.scope_type === "product" ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Product
                    </span>
                    <select
                      name="product_id"
                      value={formData.product_id}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    >
                      <option value="">Choose a product</option>
                      {options.products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.brand_name ? `· ${product.brand_name}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {formData.scope_type === "blog" ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      News article
                    </span>
                    <select
                      name="blog_id"
                      value={formData.blog_id}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    >
                      <option value="">Choose a news article</option>
                      {options.blogs.map((blog) => (
                        <option key={blog.id} value={blog.id}>
                          {blog.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {formData.scope_type === "brand" ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Brand
                    </span>
                    <select
                      name="brand_id"
                      value={formData.brand_id}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    >
                      <option value="">Choose a brand</option>
                      {options.brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {formData.scope_type === "category" ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Category
                    </span>
                    <select
                      name="category_name"
                      value={formData.category_name}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    >
                      <option value="">Choose a category</option>
                      {options.categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <div>
                  <span className="mb-3 block text-sm font-medium text-slate-700">
                    Manual page permissions
                  </span>
                  <div className="grid grid-cols-1 gap-3">
                    {PAGE_PERMISSION_OPTIONS.map((option) => {
                      const active = Boolean(formData[option.key]);
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => handlePermissionToggle(option.key)}
                          className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition ${
                            active
                              ? "border-violet-200 bg-violet-50 text-violet-700"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span>
                            <span className="block font-medium">{option.label}</span>
                            <span className="mt-1 block text-xs font-normal normal-case tracking-normal opacity-80">
                              {PAGE_PERMISSION_HELPERS[option.key]}
                            </span>
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                            {active ? "Allowed" : "Hidden"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Listing slot
                    </span>
                    <select
                      name="list_slot"
                      value={formData.list_slot}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    >
                      {LIST_SLOT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Detail slot
                    </span>
                    <select
                      name="detail_slot"
                      value={formData.detail_slot}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    >
                      {DETAIL_SLOT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      News slot
                    </span>
                    <select
                      name="news_slot"
                      value={formData.news_slot}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    >
                      {NEWS_SLOT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
              ) : null}

              {activeEditorTab === "schedule" ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FaCalendarAlt className="text-[#4C35F2]" />
                  Publishing
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Status
                    </span>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Priority
                    </span>
                    <input
                      type="number"
                      min="0"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Publish at
                  </span>
                  <input
                    type="datetime-local"
                    name="publish_at"
                    value={formData.publish_at}
                    onChange={handleInputChange}
                    className={FIELD_CLASS}
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Unpublish at
                    </span>
                    <input
                      type="datetime-local"
                      name="unpublish_at"
                      value={formData.unpublish_at}
                      onChange={handleInputChange}
                      className={FIELD_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Auto expiry days
                    </span>
                    <input
                      type="number"
                      min="1"
                      name="duration_days"
                      value={formData.duration_days}
                      onChange={handleInputChange}
                      placeholder="30"
                      className={FIELD_CLASS}
                    />
                  </label>
                </div>
              </section>
              ) : null}

              {activeEditorTab === "preview" ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FaBullhorn className="text-[#4C35F2]" />
                  Quick preview
                </div>

                <div className="overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt={formData.title || formData.name || "Preview"}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.09),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef2ff_100%)]">
                      <div className="rounded-full border border-violet-200 bg-white p-4 text-violet-600 shadow-none">
                        <FaLink className="text-lg" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 px-5 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
                        {formData.badge_text || "Affiliate"}
                      </span>
                      {formData.store_name ? (
                        <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {formData.store_name}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold leading-7">
                        {formData.title || formData.name || "Preview title"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {formData.description || "A short preview of how this affiliate module will read on the public site."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {formatPrice(formData.price, formData.currency_code)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formData.cta_subtext || formData.disclosure_text || "Affiliate link"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white shadow-none"
                      >
                        {formData.cta_text || "Check price"}
                      </button>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
                      Pages:{" "}
                      {PAGE_PERMISSION_OPTIONS.filter((option) => formData[option.key])
                        .map((option) => option.label)
                        .join(", ") || "No pages selected"}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                  <p>
                    Scope preview:{" "}
                    <span className="font-semibold text-slate-900">
                      {formData.scope_type}
                    </span>
                  </p>
                  {selectedProduct ? (
                    <p className="mt-1">
                      Product target:{" "}
                      <span className="font-semibold text-slate-900">
                        {selectedProduct.name}
                      </span>
                    </p>
                  ) : null}
                  {selectedBlog ? (
                    <p className="mt-1">
                      News target:{" "}
                      <span className="font-semibold text-slate-900">
                        {selectedBlog.title}
                      </span>
                    </p>
                  ) : null}
                  {selectedBrand ? (
                    <p className="mt-1">
                      Brand target:{" "}
                      <span className="font-semibold text-slate-900">
                        {selectedBrand.name}
                      </span>
                    </p>
                  ) : null}
                  {formData.category_name ? (
                    <p className="mt-1">
                      Category target:{" "}
                      <span className="font-semibold text-slate-900">
                        {formData.category_name}
                      </span>
                    </p>
                  ) : null}
                </div>
              </section>
              ) : null}

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={PRIMARY_BUTTON_CLASS}
                >
                  <FaSave className="text-sm" />
                  {saving
                    ? editingId
                      ? "Saving changes..."
                      : "Creating placement..."
                    : editingId
                      ? "Save changes"
                      : "Create placement"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={GHOST_BUTTON_CLASS}
                >
                  <FaPlus className="text-sm" />
                  Reset form
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-md border px-4 py-3 shadow-none ${
              toast.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-white text-slate-900"
            }`}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="mt-1 text-sm leading-5">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AffiliatePlacementManager;

