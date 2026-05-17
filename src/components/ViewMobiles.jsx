import React, { useEffect, useMemo, useRef, useState } from "react";
import CountUp from "react-countup";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaEdit,
  FaEllipsisH,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaMobile,
  FaPlus,
  FaRedo,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaUpload,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { isUpcomingOrPreorder } from "../utils/mobileStatus";

const DEFAULT_TITLE = "View Mobiles";
const DEFAULT_SUBTITLE = "Manage and view all smartphone listings on your platform.";
const DEFAULT_TOTAL_LABEL = "Total Mobiles";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const toScore = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampScore = (value) => {
  const parsed = toScore(value);
  if (parsed === null) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const normalizeText = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const firstFilledValue = (...values) => {
  for (const value of values) {
    if (value === 0 || value === false) return value;
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    return value;
  }
  return "";
};

const getNestedValue = (source, path) =>
  String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((current, key) => current?.[key], source);

const getFirstPathValue = (source, paths) => {
  for (const path of paths) {
    const value = getNestedValue(source, path);
    if (value === 0 || value === false) return value;
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return null;
};

const collectStorageTech = (mobile, variant = null) =>
  firstFilledValue(
    variant?.storage_type,
    variant?.storageType,
    variant?.storage_technology,
    variant?.storageTechnology,
    variant?.storage_tech,
    variant?.storageTech,
    mobile?.storage_type,
    mobile?.storageType,
    mobile?.storage_technology,
    mobile?.storageTechnology,
    mobile?.storage_tech,
    mobile?.storageTech,
    mobile?.performance?.storage_type,
    mobile?.performance?.storageType,
    mobile?.performance?.storage_technology,
    mobile?.performance?.storageTechnology,
    mobile?.performance_json?.storage_type,
    mobile?.performance_json?.storageType,
    mobile?.performanceJson?.storage_type,
    mobile?.performanceJson?.storageType,
    mobile?.raw?.performance?.storage_type,
    mobile?.raw?.performance?.storageType,
    mobile?.raw?.performance_json?.storage_type,
    mobile?.raw?.performance_json?.storageType,
    mobile?.raw?.performanceJson?.storage_type,
    mobile?.raw?.performanceJson?.storageType,
    mobile?.raw?.storage_type,
    mobile?.raw?.storageType,
  );

const getStatusValue = (mobile) => {
  if (isUpcomingOrPreorder(mobile)) return "upcoming";
  return mobile.published ? "published" : "draft";
};

const getStatusLabel = (mobile) => {
  const status = getStatusValue(mobile);
  if (status === "published") return "Published";
  if (status === "upcoming") return "Upcoming";
  return "Draft";
};

const getStatusClasses = (mobile) => {
  const status = getStatusValue(mobile);
  if (status === "published") return "bg-emerald-50 text-emerald-700";
  if (status === "upcoming") return "bg-indigo-50 text-indigo-700";
  return "bg-orange-50 text-orange-700";
};

const slugify = (value) =>
  String(value || "smartphone-preview")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatCompactNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "N/A";
  if (parsed >= 1_000_000) return `${(parsed / 1_000_000).toFixed(2)}M`;
  if (parsed >= 1000) return `${(parsed / 1000).toFixed(1)}K`;
  return `${parsed}`;
};

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const value = String(dateString).trim();
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      return utcDate.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const formatScoreChip = (value) => {
  const parsed = clampScore(value);
  return parsed === null ? "N/A" : `${parsed}`;
};

const getPriceValues = (mobile) => {
  const prices = [];
  const variants = Array.isArray(mobile.variants) ? mobile.variants : [];

  variants.forEach((variant) => {
    const storePrices = variant?.store_prices || variant?.storePrices || [];
    if (!Array.isArray(storePrices)) return;
    storePrices.forEach((entry) => {
      const price = Number(entry?.price);
      if (Number.isFinite(price) && price > 0) prices.push(price);
    });
  });

  const directPrice = Number(mobile.price);
  if (prices.length === 0 && Number.isFinite(directPrice) && directPrice > 0) {
    prices.push(directPrice);
  }

  return prices;
};

const formatPriceRange = (mobile) => {
  const prices = getPriceValues(mobile);
  if (prices.length === 0) return "N/A";

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

const resolveOperatingSystem = (mobile) => {
  const raw = mobile.raw || mobile;
  const osValue = firstFilledValue(
    getFirstPathValue(raw, [
      "os",
      "operating_system",
      "software.os",
      "software.operating_system",
      "platform.os",
    ]),
  );

  if (normalizeText(osValue)) return normalizeText(osValue);
  if (/iphone|ios/i.test(`${mobile.name} ${mobile.brand}`)) return "iOS";
  return "Android";
};

const resolveHas5G = (mobile) => {
  const raw = mobile.raw || mobile;
  const directValue = firstFilledValue(
    getFirstPathValue(raw, [
      "has_5g",
      "has5g",
      "is_5g",
      "is5g",
      "network.has_5g",
      "network.has5g",
      "connectivity.has_5g",
      "connectivity.has5g",
    ]),
  );

  if (typeof directValue === "boolean") return directValue;
  if (typeof directValue === "number") return directValue > 0;

  const searchableText = [
    mobile.name,
    mobile.model,
    getFirstPathValue(raw, ["network.technology", "network.cellular", "connectivity.network"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes("5g");
};

const resolveCompareScore = (mobile) => {
  const raw = mobile.raw || mobile;
  return clampScore(
    firstFilledValue(
      getFirstPathValue(raw, ["compare_score", "compareScore", "scores.compare"]),
      mobile.buyer_intent,
      mobile.hook_score !== null && mobile.hook_score !== undefined ? Number(mobile.hook_score) - 1 : null,
    ),
  );
};

const resolveCameraScore = (mobile) => {
  const raw = mobile.raw || mobile;
  return clampScore(
    firstFilledValue(
      getFirstPathValue(raw, ["camera_score", "cameraScore", "scores.camera", "camera.score"]),
      mobile.freshness,
      mobile.hook_score !== null && mobile.hook_score !== undefined ? Number(mobile.hook_score) + 2 : null,
    ),
  );
};

const resolvePerformanceScore = (mobile) => {
  const raw = mobile.raw || mobile;
  return clampScore(
    firstFilledValue(
      getFirstPathValue(raw, ["performance_score", "performanceScore", "scores.performance", "performance.score"]),
      mobile.trend_velocity,
      mobile.hook_score !== null && mobile.hook_score !== undefined ? Number(mobile.hook_score) + 1 : null,
    ),
  );
};

const resolveSearchVolume = (mobile, index) => {
  const raw = mobile.raw || mobile;
  const directValue = toScore(
    firstFilledValue(
      getFirstPathValue(raw, [
        "search_volume",
        "searchVolume",
        "monthly_searches",
        "monthlySearches",
        "searches_7d",
        "searches",
      ]),
    ),
  );

  if (directValue !== null) return formatCompactNumber(directValue);

  const baseScore = clampScore(mobile.hook_score) ?? 72;
  return formatCompactNumber((baseScore + index * 3) * 1000);
};

const resolveTrendingRank = (mobile, index) => {
  const raw = mobile.raw || mobile;
  const rank = getFirstPathValue(raw, ["trending_rank", "trendingRank", "rank"]);
  const numericRank = Number(rank);
  if (Number.isFinite(numericRank) && numericRank > 0) return `#${numericRank}`;
  return `#${index + 2}`;
};

const resolveTrendDirection = (mobile) => {
  const raw = mobile.raw || mobile;
  const value = toScore(
    firstFilledValue(
      getFirstPathValue(raw, ["trend_direction", "trendDirection", "trend_velocity", "trendVelocity"]),
      mobile.trend_velocity,
    ),
  );

  if (value === null) return "up";
  return value >= 0 ? "up" : "down";
};

const StatCard = ({ icon, iconClassName, label, value, delta, deltaTone = "up" }) => {
  const Icon = icon;
  const deltaClassName = deltaTone === "down" ? "text-rose-600" : "text-emerald-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-[0_16px_35px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconClassName}`}>
          <Icon className="text-lg" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-2 text-[2rem] font-bold tracking-tight text-slate-950">
            {typeof value === "number" ? <CountUp end={value} duration={1} /> : value}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            <span className={`font-semibold ${deltaClassName}`}>{delta}</span> vs last 7 days
          </p>
        </div>
      </div>
    </div>
  );
};

const SelectField = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={onChange}
    className={`h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#5A49FF] focus:ring-4 focus:ring-[#5A49FF]/10 ${className}`}
  >
    {children}
  </select>
);

const Toasts = ({ toasts, onDismiss }) => (
  <div className="fixed right-4 top-4 z-50 w-full max-w-sm space-y-2">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50"
            : toast.type === "error"
              ? "border-rose-200 bg-rose-50"
              : "border-blue-200 bg-blue-50"
        }`}
      >
        {toast.type === "success" ? (
          <FaCheckCircle className="mt-0.5 text-emerald-600" />
        ) : (
          <FaExclamationCircle className="mt-0.5 text-rose-600" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
          <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 transition hover:text-slate-700"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
    ))}
  </div>
);

const ViewMobiles = ({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  totalLabel = DEFAULT_TOTAL_LABEL,
  filterFn = null,
  excludeUpcoming = false,
} = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [mobiles, setMobiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [toasts, setToasts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [launchYearFilter, setLaunchYearFilter] = useState("all");
  const [fiveGFilter, setFiveGFilter] = useState("all");
  const [osFilter, setOsFilter] = useState("all");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [storageFilter, setStorageFilter] = useState("all");
  const [storageTechFilter, setStorageTechFilter] = useState("all");
  const [ramFilter, setRamFilter] = useState("all");
  const [variantFilter, setVariantFilter] = useState("all");
  const [variantStoreFilter, setVariantStoreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("launch-latest");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    const seededSearch = location.state?.searchTerm;
    if (typeof seededSearch === "string" && seededSearch.trim()) {
      setSearchTerm(seededSearch.trim());
    }
  }, [location.key, location.state]);

  const showToast = (toastTitle, message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((previous) => [...previous, { id, title: toastTitle, message, type }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const resolveProductId = (mobile) =>
    mobile?.id ||
    mobile?.raw?.id ||
    mobile?.raw?._id ||
    mobile?.raw?.product_id ||
    mobile?.raw?.productId ||
    null;

  const isVariantComplete = (variant) => {
    if (!variant) return false;
    const storePrices = variant.store_prices || variant.storePrices || [];
    if (!Array.isArray(storePrices) || storePrices.length === 0) return false;

    return storePrices.some((entry) => {
      const price = Number(entry?.price) || 0;
      const hasStore = Boolean(entry?.store || entry?.store_id || entry?.merchant || entry?.shop);
      const hasLink = Boolean(entry?.affiliate_link || entry?.affiliate || entry?.affiliateUrl || entry?.url || entry?.link);
      return price > 0 && (hasStore || hasLink);
    });
  };

  const productAllVariantsComplete = (mobile) => {
    if (Array.isArray(mobile.variants) && mobile.variants.length > 0) {
      return mobile.variants.every((variant) => isVariantComplete(variant));
    }

    const raw = mobile.raw || {};
    const storePrices = raw.store_prices || raw.storePrices || [];
    if (Array.isArray(storePrices) && storePrices.length > 0) {
      return storePrices.some((entry) => {
        const price = Number(entry?.price) || 0;
        return price > 0 && Boolean(entry?.store || entry?.store_id || entry?.affiliate_link || entry?.url);
      });
    }

    return false;
  };

  useEffect(() => {
    const fetchMobiles = async () => {
      setLoading(true);
      setError("");

      try {
        const token = Cookies.get("authToken");
        const response = await fetch(buildUrl("/api/smartphone"), {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        let rows = [];

        if (Array.isArray(payload)) rows = payload;
        else if (Array.isArray(payload?.smartphones)) rows = payload.smartphones;
        else if (Array.isArray(payload?.data)) rows = payload.data;

        const processedRows = [];

        rows.forEach((mobile) => {
          const published = Boolean(mobile.published || mobile.is_published);
          const productId =
            mobile.id ||
            mobile._id ||
            mobile.product_id ||
            mobile.productId ||
            mobile.raw?.product_id ||
            mobile.raw?.productId ||
            null;

          const baseRow = {
            id: productId,
            name: firstFilledValue(mobile.name, mobile.product_name, "Unnamed"),
            brand: firstFilledValue(mobile.brand, mobile.brand_name, "Unknown"),
            model: firstFilledValue(mobile.model, mobile.model_name, "Unknown"),
            hook_score: toScore(mobile.hook_score ?? mobile.hookScore),
            buyer_intent: toScore(mobile.buyer_intent ?? mobile.buyerIntent),
            trend_velocity: toScore(mobile.trend_velocity ?? mobile.trendVelocity),
            freshness: toScore(mobile.freshness),
            published,
            launch_date: firstFilledValue(
              mobile.launch_date,
              mobile.launchDate,
              mobile.launch_date_text,
              mobile.launchDateText,
            ),
            images: Array.isArray(mobile.images) ? mobile.images : [],
            variants: Array.isArray(mobile.variants) ? mobile.variants : [],
            storageTech: collectStorageTech(mobile),
            raw: mobile,
          };

          if (Array.isArray(mobile.variants) && mobile.variants.length > 0) {
            mobile.variants.forEach((variant, variantIndex) => {
              const storePrices = Array.isArray(variant?.store_prices) ? variant.store_prices : [];
              const positivePrices = storePrices
                .map((entry) => Number(entry?.price) || 0)
                .filter((price) => price > 0);

              processedRows.push({
                ...baseRow,
                rowKey: `${productId || mobile.name || "mobile"}-${variant.id || variant.variant_id || variantIndex}`,
                price: positivePrices.length > 0 ? Math.min(...positivePrices) : Number(mobile.price) || 0,
                storage: firstFilledValue(variant.storage, variant.attributes?.storage, mobile.storage, ""),
                storageTech: collectStorageTech(mobile, variant) || baseRow.storageTech || "",
                ram: firstFilledValue(variant.ram, variant.attributes?.ram, mobile.ram, ""),
                variant,
              });
            });
          } else {
            processedRows.push({
              ...baseRow,
              rowKey: `${productId || mobile.name || "mobile"}-0`,
              price: Number(mobile.price) || 0,
              storage: firstFilledValue(mobile.storage, ""),
              storageTech: collectStorageTech(mobile) || "",
              ram: firstFilledValue(mobile.ram, ""),
              variant: null,
            });
          }
        });

        const groupedMap = new Map();

        processedRows.forEach((row) => {
          const productKey = row.id || row.raw?.id || row.raw?._id || row.rowKey || row.name;

          if (!groupedMap.has(productKey)) {
            groupedMap.set(productKey, {
              id: row.id,
              rowKey: productKey,
              name: row.name,
              brand: row.brand,
              model: row.model,
              published: row.published,
              launch_date: row.launch_date || row.raw?.launch_date || row.raw?.launchDate || null,
              images: Array.isArray(row.images) ? [...row.images] : [],
              variants: row.variant ? [row.variant] : Array.isArray(row.variants) ? [...row.variants] : [],
              prices: typeof row.price === "number" ? [row.price] : [],
              storages: new Set(normalizeText(row.storage) ? [normalizeText(row.storage)] : []),
              storageTechs: new Set(normalizeText(row.storageTech) ? [normalizeText(row.storageTech)] : []),
              rams: new Set(normalizeText(row.ram) ? [normalizeText(row.ram)] : []),
              hook_score: row.hook_score,
              buyer_intent: row.buyer_intent,
              trend_velocity: row.trend_velocity,
              freshness: row.freshness,
              raw: row.raw || {},
              created_at:
                row.raw?.created_at ||
                row.raw?.createdAt ||
                row.raw?.created_on ||
                row.raw?.createdOn ||
                row.raw?.updated_at ||
                row.raw?.updatedAt ||
                null,
            });
            return;
          }

          const grouped = groupedMap.get(productKey);
          grouped.published = grouped.published || row.published;
          if (!grouped.launch_date && row.launch_date) grouped.launch_date = row.launch_date;
          if (Array.isArray(row.images)) grouped.images.push(...row.images.filter(Boolean));
          if (row.variant) grouped.variants.push(row.variant);
          if (typeof row.price === "number") grouped.prices.push(row.price);
          if (normalizeText(row.storage)) grouped.storages.add(normalizeText(row.storage));
          if (normalizeText(row.storageTech)) grouped.storageTechs.add(normalizeText(row.storageTech));
          if (normalizeText(row.ram)) grouped.rams.add(normalizeText(row.ram));
          if (grouped.hook_score === null && row.hook_score !== null) grouped.hook_score = row.hook_score;
          if (grouped.buyer_intent === null && row.buyer_intent !== null) grouped.buyer_intent = row.buyer_intent;
          if (grouped.trend_velocity === null && row.trend_velocity !== null) grouped.trend_velocity = row.trend_velocity;
          if (grouped.freshness === null && row.freshness !== null) grouped.freshness = row.freshness;
        });

        let nextMobiles = Array.from(groupedMap.values()).map((grouped) => ({
          id: grouped.id,
          rowKey: grouped.rowKey,
          name: grouped.name,
          brand: grouped.brand,
          model: grouped.model,
          published: grouped.published,
          launch_date: grouped.launch_date,
          images: Array.from(new Set(grouped.images || [])).filter(Boolean),
          variants: grouped.variants || [],
          price: grouped.prices.length > 0 ? Math.min(...grouped.prices.filter((price) => price > 0)) : 0,
          storage: Array.from(grouped.storages || []).filter(Boolean).join(" / "),
          storageTech: Array.from(grouped.storageTechs || []).filter(Boolean).join(" / "),
          ram: Array.from(grouped.rams || []).filter(Boolean).join(" / "),
          hook_score: grouped.hook_score,
          buyer_intent: grouped.buyer_intent,
          trend_velocity: grouped.trend_velocity,
          freshness: grouped.freshness,
          raw: grouped.raw || {},
          created_at: grouped.created_at,
        }));

        if (excludeUpcoming) {
          nextMobiles = nextMobiles.filter((mobile) => !isUpcomingOrPreorder(mobile));
        }

        if (typeof filterFn === "function") {
          nextMobiles = nextMobiles.filter(filterFn);
        }

        setMobiles(nextMobiles);
      } catch (fetchError) {
        console.error("Failed to fetch mobiles:", fetchError);
        setError(fetchError.message || "Failed to load mobiles");
        showToast("Load Failed", fetchError.message || "Failed to load mobiles", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchMobiles();
  }, [excludeUpcoming, filterFn, reloadKey]);

  const enhancedMobiles = useMemo(
    () =>
      mobiles.map((mobile) => ({
        ...mobile,
        os: resolveOperatingSystem(mobile),
        has5g: resolveHas5G(mobile),
        compareScore: resolveCompareScore(mobile),
        cameraScore: resolveCameraScore(mobile),
        performanceScore: resolvePerformanceScore(mobile),
        compareEnabled: resolveCompareScore(mobile) !== null,
      })),
    [mobiles],
  );

  const brandOptions = useMemo(
    () =>
      Array.from(new Set(enhancedMobiles.map((mobile) => normalizeText(mobile.brand)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [enhancedMobiles],
  );

  const launchYearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          enhancedMobiles
            .map((mobile) => {
              const match = String(mobile.launch_date || "").match(/^(\d{4})/);
              if (match) return match[1];
              const parsed = new Date(mobile.launch_date || "");
              return Number.isNaN(parsed.getTime()) ? "" : `${parsed.getFullYear()}`;
            })
            .filter(Boolean),
        ),
      ).sort((a, b) => Number(b) - Number(a)),
    [enhancedMobiles],
  );

  const osOptions = useMemo(
    () =>
      Array.from(new Set(enhancedMobiles.map((mobile) => normalizeText(mobile.os)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [enhancedMobiles],
  );

  const storageOptions = useMemo(
    () =>
      Array.from(new Set(enhancedMobiles.map((mobile) => normalizeText(mobile.storage)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    [enhancedMobiles],
  );

  const storageTechOptions = useMemo(
    () =>
      Array.from(new Set(enhancedMobiles.map((mobile) => normalizeText(mobile.storageTech)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [enhancedMobiles],
  );

  const ramOptions = useMemo(
    () =>
      Array.from(new Set(enhancedMobiles.map((mobile) => normalizeText(mobile.ram)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    [enhancedMobiles],
  );

  const filteredMobiles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return enhancedMobiles
      .filter((mobile) => {
        if (query) {
          const haystack = [
            mobile.name,
            mobile.brand,
            mobile.model,
            mobile.storage,
            mobile.ram,
            mobile.storageTech,
            mobile.os,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!haystack.includes(query)) return false;
        }

        if (brandFilter !== "all" && normalizeText(mobile.brand).toLowerCase() !== brandFilter.toLowerCase()) {
          return false;
        }

        if (statusFilter !== "all" && getStatusValue(mobile) !== statusFilter) {
          return false;
        }

        if (launchYearFilter !== "all") {
          const match = String(mobile.launch_date || "").match(/^(\d{4})/);
          const launchYear =
            match?.[1] ||
            (() => {
              const parsed = new Date(mobile.launch_date || "");
              return Number.isNaN(parsed.getTime()) ? "" : `${parsed.getFullYear()}`;
            })();

          if (launchYear !== launchYearFilter) return false;
        }

        if (fiveGFilter === "5g" && !mobile.has5g) return false;
        if (fiveGFilter === "non-5g" && mobile.has5g) return false;

        if (osFilter !== "all" && normalizeText(mobile.os).toLowerCase() !== osFilter.toLowerCase()) {
          return false;
        }

        if (storageFilter !== "all" && !normalizeText(mobile.storage).toLowerCase().includes(storageFilter.toLowerCase())) {
          return false;
        }

        if (
          storageTechFilter !== "all" &&
          !normalizeText(mobile.storageTech).toLowerCase().includes(storageTechFilter.toLowerCase())
        ) {
          return false;
        }

        if (ramFilter !== "all" && !normalizeText(mobile.ram).toLowerCase().includes(ramFilter.toLowerCase())) {
          return false;
        }

        if (variantFilter === "with" && (!Array.isArray(mobile.variants) || mobile.variants.length === 0)) {
          return false;
        }

        if (variantFilter === "without" && Array.isArray(mobile.variants) && mobile.variants.length > 0) {
          return false;
        }

        if (variantStoreFilter === "complete" && !productAllVariantsComplete(mobile)) {
          return false;
        }

        if (variantStoreFilter === "incomplete" && productAllVariantsComplete(mobile)) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        if (sortBy === "name-asc") return left.name.localeCompare(right.name);
        if (sortBy === "name-desc") return right.name.localeCompare(left.name);
        if (sortBy === "hook-high") return (clampScore(right.hook_score) ?? -1) - (clampScore(left.hook_score) ?? -1);
        if (sortBy === "price-high") return (Math.max(...getPriceValues(right), 0) || 0) - (Math.max(...getPriceValues(left), 0) || 0);
        if (sortBy === "price-low") return (Math.min(...getPriceValues(left), Infinity) || 0) - (Math.min(...getPriceValues(right), Infinity) || 0);
        if (sortBy === "launch-oldest") return new Date(left.launch_date || 0).getTime() - new Date(right.launch_date || 0).getTime();
        return new Date(right.launch_date || right.created_at || 0).getTime() - new Date(left.launch_date || left.created_at || 0).getTime();
      });
  }, [
    brandFilter,
    enhancedMobiles,
    fiveGFilter,
    launchYearFilter,
    osFilter,
    ramFilter,
    searchTerm,
    sortBy,
    statusFilter,
    storageFilter,
    storageTechFilter,
    variantFilter,
    variantStoreFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    brandFilter,
    statusFilter,
    launchYearFilter,
    fiveGFilter,
    osFilter,
    storageFilter,
    storageTechFilter,
    ramFilter,
    variantFilter,
    variantStoreFilter,
    sortBy,
    rowsPerPage,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredMobiles.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedMobiles = filteredMobiles.slice(startIndex, endIndex);

  useEffect(() => {
    setSelectedRowKeys((previous) => previous.filter((rowKey) => paginatedMobiles.some((mobile) => mobile.rowKey === rowKey)));
  }, [paginatedMobiles]);

  const totalMobiles = enhancedMobiles.length;
  const publishedMobiles = enhancedMobiles.filter((mobile) => getStatusValue(mobile) === "published").length;
  const draftMobiles = enhancedMobiles.filter((mobile) => getStatusValue(mobile) === "draft").length;
  const upcomingMobiles = enhancedMobiles.filter((mobile) => getStatusValue(mobile) === "upcoming").length;
  const compareEnabledCount = enhancedMobiles.filter((mobile) => mobile.compareEnabled).length;
  const averageHookScore = (() => {
    const scores = enhancedMobiles.map((mobile) => clampScore(mobile.hook_score)).filter((value) => value !== null);
    if (scores.length === 0) return "N/A";
    return (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1);
  })();

  const allVisibleSelected = paginatedMobiles.length > 0 && paginatedMobiles.every((mobile) => selectedRowKeys.includes(mobile.rowKey));

  const clearFilters = () => {
    setSearchTerm("");
    setBrandFilter("all");
    setStatusFilter("all");
    setLaunchYearFilter("all");
    setFiveGFilter("all");
    setOsFilter("all");
    setStorageFilter("all");
    setStorageTechFilter("all");
    setRamFilter("all");
    setVariantFilter("all");
    setVariantStoreFilter("all");
    setSortBy("launch-latest");
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedRowKeys((previous) => previous.filter((rowKey) => !paginatedMobiles.some((mobile) => mobile.rowKey === rowKey)));
      return;
    }

    setSelectedRowKeys((previous) => Array.from(new Set([...previous, ...paginatedMobiles.map((mobile) => mobile.rowKey)])));
  };

  const toggleSelectedRow = (rowKey) => {
    setSelectedRowKeys((previous) =>
      previous.includes(rowKey) ? previous.filter((value) => value !== rowKey) : [...previous, rowKey],
    );
  };

  const handleDelete = async (mobile) => {
    if (!window.confirm(`Are you sure you want to delete "${mobile.name}"?`)) return;

    try {
      const token = Cookies.get("authToken");
      const resolvedId = resolveProductId(mobile);

      if (!resolvedId) {
        throw new Error("Missing product id for delete request");
      }

      const response = await fetch(buildUrl(`/api/smartphone/${encodeURIComponent(resolvedId)}`), {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}${details ? ` ${details}` : ""}`);
      }

      setMobiles((previous) =>
        previous.filter((candidate) => {
          const candidateId = resolveProductId(candidate);
          return String(candidateId) !== String(resolvedId);
        }),
      );

      showToast("Deleted", `"${mobile.name}" removed successfully`, "success");
    } catch (deleteError) {
      console.error("Delete failed:", deleteError);
      showToast("Delete Failed", deleteError.message || "Unable to delete mobile", "error");
    }
  };

  const togglePublish = async (mobile) => {
    try {
      const token = Cookies.get("authToken");
      const resolvedId = resolveProductId(mobile);
      const nextPublished = !mobile.published;

      if (!resolvedId) {
        showToast("Update Failed", "Missing mobile id for status update", "error");
        return;
      }

      const parseJwt = (value) => {
        try {
          const payloadSegment = value.split(".")[1];
          const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
          return JSON.parse(
            decodeURIComponent(
              atob(padded)
                .split("")
                .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join(""),
            ),
          );
        } catch {
          return null;
        }
      };

      const payload = token ? parseJwt(token) : null;
      const userId = payload?.id || payload?._id || payload?.userId || payload?.user_id || null;

      const response = await fetch(buildUrl(`/api/products/${resolvedId}/publish`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          id: resolvedId,
          is_published: nextPublished,
          published_by: userId,
        }),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(details || `HTTP ${response.status}`);
      }

      const payloadData = await response.json().catch(() => null);
      const updatedPublished =
        payloadData?.data?.is_published ??
        payloadData?.data?.published ??
        payloadData?.is_published ??
        payloadData?.published ??
        nextPublished;

      setMobiles((previous) =>
        previous.map((candidate) =>
          String(resolveProductId(candidate)) === String(resolvedId)
            ? { ...candidate, published: Boolean(updatedPublished) }
            : candidate,
        ),
      );

      showToast("Status Updated", `"${mobile.name}" is now ${updatedPublished ? "published" : "draft"}`, "success");
    } catch (publishError) {
      console.error("Publish toggle failed:", publishError);
      showToast("Update Failed", publishError.message || "Unable to update status", "error");
    }
  };

  const handleExport = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(buildUrl("/api/smartphones/export"), {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Export request failed");
      }

      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `mobiles-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      showToast("Export Complete", "Mobiles exported successfully", "success");
    } catch (exportError) {
      console.error("Export failed:", exportError);
      showToast("Export Failed", exportError.message || "Unable to export mobiles", "error");
    }
  };

  const handleImport = async (file) => {
    if (!file) return;

    try {
      const token = Cookies.get("authToken");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(buildUrl("/api/import/smartphones"), {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(details || `HTTP ${response.status}`);
      }

      const payload = await response.json().catch(() => null);

      if (payload?.summary) {
        showToast(
          "Import Completed",
          `Rows: ${payload.summary.total_rows}, Inserted: ${payload.summary.inserted}, Skipped: ${payload.summary.skipped}, Failed: ${payload.summary.failed}`,
          "success",
        );
      } else {
        showToast("Import Completed", "Mobiles imported successfully", "success");
      }

      setReloadKey((previous) => previous + 1);
    } catch (importError) {
      console.error("Import failed:", importError);
      showToast("Import Failed", importError.message || "Unable to import mobiles", "error");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const openPreview = (mobile) => {
    navigate("/products/smartphones/preview", {
      state: {
        previewState: {
          title: mobile.name,
          slug: slugify(mobile.name),
          publishEnabled: mobile.published,
          launchStatus: getStatusValue(mobile) === "upcoming" ? "upcoming" : mobile.published ? "released" : "announced",
          savedAt: new Date().toISOString(),
          formData: {
            product: {
              name: mobile.name,
            },
            smartphone: mobile.raw || {},
            images: mobile.images || [],
            variants: mobile.variants || [],
          },
        },
      },
    });
  };

  const visiblePageItems = useMemo(() => {
    const firstPage = 1;
    const lastPage = totalPages;

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [firstPage, firstPage + 1, firstPage + 2, "...", lastPage];
    }

    if (currentPage >= totalPages - 2) {
      return [firstPage, "...", lastPage - 2, lastPage - 1, lastPage];
    }

    return [firstPage, "...", currentPage, currentPage + 1, "...", lastPage];
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <Toasts toasts={toasts} onDismiss={removeToast} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv,.xlsx,.xls"
        className="hidden"
        onChange={(event) => handleImport(event.target.files?.[0])}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[2.35rem] font-bold tracking-tight text-slate-950">
              {title} <span className="ml-1 align-middle text-[1.4rem]">{`\u{1F4F1}`}</span>
            </h1>
            <p className="mt-2 text-base text-slate-500">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
            >
              <FaUpload className="text-sm text-slate-500" />
              Import Excel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
            >
              <FaDownload className="text-sm text-slate-500" />
              Export
            </button>
            <button
              type="button"
              onClick={() => navigate("/products/smartphones/create")}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#345CFF] to-[#5C35FF] px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(92,76,255,0.25)] transition hover:brightness-105"
            >
              <FaPlus className="text-sm" />
              Add New Mobile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-6">
          <StatCard
            icon={FaMobile}
            iconClassName="bg-blue-50 text-blue-600"
            label={totalLabel}
            value={totalMobiles}
            delta="↑ 8.4%"
          />
          <StatCard
            icon={FaCheckCircle}
            iconClassName="bg-emerald-50 text-emerald-600"
            label="Published"
            value={publishedMobiles}
            delta="↑ 12.6%"
          />
          <StatCard
            icon={FaEyeSlash}
            iconClassName="bg-orange-50 text-orange-500"
            label="Drafts"
            value={draftMobiles}
            delta="↓ 4.3%"
            deltaTone="down"
          />
          <StatCard
            icon={FaCalendarAlt}
            iconClassName="bg-violet-50 text-violet-600"
            label="Upcoming"
            value={upcomingMobiles}
            delta="↑ 9.7%"
          />
          <StatCard
            icon={FaFilter}
            iconClassName="bg-blue-50 text-blue-600"
            label="Compare Enabled"
            value={compareEnabledCount}
            delta="↑ 15.2%"
          />
          <StatCard
            icon={FaCheckCircle}
            iconClassName="bg-emerald-50 text-emerald-600"
            label="Avg. Hook Score"
            value={averageHookScore}
            delta="↑ 6.1%"
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-200 px-4 py-4 lg:px-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_repeat(5,minmax(0,0.78fr))_auto_auto]">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, brand, model..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#5A49FF] focus:ring-4 focus:ring-[#5A49FF]/10"
              />
            </div>

            <SelectField value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
              <option value="all">All Brands</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </SelectField>

            <SelectField value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
            </SelectField>

            <SelectField value={launchYearFilter} onChange={(event) => setLaunchYearFilter(event.target.value)}>
              <option value="all">All Launch Year</option>
              {launchYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </SelectField>

            <SelectField value={fiveGFilter} onChange={(event) => setFiveGFilter(event.target.value)}>
              <option value="all">All 5G Status</option>
              <option value="5g">5G</option>
              <option value="non-5g">Non-5G</option>
            </SelectField>

            <SelectField value={osFilter} onChange={(event) => setOsFilter(event.target.value)}>
              <option value="all">All OS</option>
              {osOptions.map((osValue) => (
                <option key={osValue} value={osValue}>
                  {osValue}
                </option>
              ))}
            </SelectField>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((previous) => !previous)}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                showAdvancedFilters
                  ? "border-[#5A49FF]/20 bg-[#F5F4FF] text-[#5A49FF]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FaFilter className="text-sm" />
              Filters
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#5A49FF] transition hover:bg-slate-50"
            >
              <FaRedo className="text-sm" />
              Reset
            </button>
          </div>

          {showAdvancedFilters ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <SelectField value={storageFilter} onChange={(event) => setStorageFilter(event.target.value)}>
                <option value="all">All Storage</option>
                {storageOptions.map((storage) => (
                  <option key={storage} value={storage}>
                    {storage}
                  </option>
                ))}
              </SelectField>

              <SelectField value={storageTechFilter} onChange={(event) => setStorageTechFilter(event.target.value)}>
                <option value="all">All Storage Tech</option>
                {storageTechOptions.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </SelectField>

              <SelectField value={ramFilter} onChange={(event) => setRamFilter(event.target.value)}>
                <option value="all">All RAM</option>
                {ramOptions.map((ram) => (
                  <option key={ram} value={ram}>
                    {ram}
                  </option>
                ))}
              </SelectField>

              <SelectField value={variantFilter} onChange={(event) => setVariantFilter(event.target.value)}>
                <option value="all">All Variants</option>
                <option value="with">With Variants</option>
                <option value="without">Without Variants</option>
              </SelectField>

              <SelectField value={variantStoreFilter} onChange={(event) => setVariantStoreFilter(event.target.value)}>
                <option value="all">All Store Data</option>
                <option value="complete">Complete Store Data</option>
                <option value="incomplete">Missing Store Data</option>
              </SelectField>

              <SelectField value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="launch-latest">Newest First</option>
                <option value="launch-oldest">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="hook-high">Highest Hook Score</option>
                <option value="price-high">Highest Price</option>
                <option value="price-low">Lowest Price</option>
              </SelectField>
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
          <table className="min-w-[1280px] w-full text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-4 py-4 lg:px-5">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 rounded border-slate-300 text-[#5A49FF] focus:ring-[#5A49FF]"
                  />
                </th>
                <th className="px-4 py-4 lg:px-5">Mobile</th>
                <th className="px-4 py-4">Brand</th>
                <th className="px-4 py-4">Launch Date</th>
                <th className="px-4 py-4">Price Range</th>
                <th className="px-4 py-4">Hook Score</th>
                <th className="px-4 py-4">Compare Score</th>
                <th className="px-4 py-4">Camera Score</th>
                <th className="px-4 py-4">Performance Score</th>
                <th className="px-4 py-4">Search Volume</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Trending Rank</th>
                <th className="px-4 py-4 text-right lg:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="13" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <FaSpinner className="animate-spin text-2xl text-[#5A49FF]" />
                      Loading mobile inventory...
                    </div>
                  </td>
                </tr>
              ) : paginatedMobiles.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <FaMobile className="text-4xl text-slate-300" />
                      <p className="text-base font-semibold text-slate-700">
                        {searchTerm ? "No mobiles found" : "No mobiles available"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {searchTerm ? "Try adjusting your search or filters." : "Import inventory or add a new mobile to get started."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMobiles.map((mobile, index) => {
                  const resolvedId = resolveProductId(mobile);
                  const selected = selectedRowKeys.includes(mobile.rowKey);

                  return (
                    <tr key={mobile.rowKey} className="border-b border-slate-100 transition hover:bg-slate-50/70">
                      <td className="px-4 py-4 lg:px-5">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelectedRow(mobile.rowKey)}
                          className="h-4 w-4 rounded border-slate-300 text-[#5A49FF] focus:ring-[#5A49FF]"
                        />
                      </td>

                      <td className="px-4 py-4 lg:px-5">
                        <div className="flex items-center gap-3">
                          {mobile.images?.[0] ? (
                            <img
                              src={mobile.images[0]}
                              alt={mobile.name}
                              className="h-10 w-10 rounded-lg border border-slate-200 bg-white object-contain p-1"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = "https://via.placeholder.com/40?text=M";
                              }}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <FaMobile className="text-sm" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-950">{mobile.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {normalizeText(mobile.ram) || "N/A"} {normalizeText(mobile.storage) ? `, ${mobile.storage}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{mobile.brand}</div>
                      </td>

                      <td className="px-4 py-4 text-slate-700">{formatDate(mobile.launch_date)}</td>

                      <td className="px-4 py-4 font-medium text-slate-700">{formatPriceRange(mobile)}</td>

                      <td className="px-4 py-4">
                        <span className="inline-flex min-w-[2.2rem] items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                          {formatScoreChip(mobile.hook_score)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex min-w-[2.2rem] items-center justify-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                          {formatScoreChip(mobile.compareScore)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex min-w-[2.2rem] items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                          {formatScoreChip(mobile.cameraScore)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex min-w-[2.2rem] items-center justify-center rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
                          {formatScoreChip(mobile.performanceScore)}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700">{resolveSearchVolume(mobile, startIndex + index)}</td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (getStatusValue(mobile) === "upcoming") return;
                            togglePublish(mobile);
                          }}
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(mobile)}`}
                        >
                          {getStatusLabel(mobile)}
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <span>{resolveTrendingRank(mobile, startIndex + index)}</span>
                          <span className={resolveTrendDirection(mobile) === "down" ? "text-rose-500" : "text-emerald-500"}>
                            {resolveTrendDirection(mobile) === "down" ? (
                              <span className="inline-block rotate-180">{`\u2191`}</span>
                            ) : (
                              `\u2191`
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right lg:px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openPreview(mobile)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                            title="Preview"
                          >
                            <FaEye className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!resolvedId) {
                                showToast("Edit Failed", "Missing product id for edit", "error");
                                return;
                              }
                              navigate(`/edit-mobile/${resolvedId}`, {
                                state: { smartphone: mobile.raw },
                              });
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(mobile)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                            title="Delete"
                          >
                            <FaEllipsisH className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-4 py-4 lg:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-600">
              Showing {filteredMobiles.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredMobiles.length)} of {filteredMobiles.length} results
            </p>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <SelectField
                value={rowsPerPage}
                onChange={(event) => setRowsPerPage(Number(event.target.value))}
                className="h-10 min-w-[120px] px-3 text-sm"
              >
                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} per page
                  </option>
                ))}
              </SelectField>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((previous) => Math.max(previous - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaChevronLeft className="text-xs" />
                </button>

                {visiblePageItems.map((item, index) =>
                  item === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(Number(item))}
                      className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                        currentPage === item
                          ? "bg-[#345CFF] text-white shadow-[0_12px_24px_rgba(52,92,255,0.28)]"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage((previous) => Math.min(previous + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ViewMobiles;
