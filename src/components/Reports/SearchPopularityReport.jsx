import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaCube,
  FaExclamationCircle,
  FaFilter,
  FaFire,
  FaInfoCircle,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import {
  EMPTY_TEXT,
  formatCount,
  formatDateTime,
  formatScore,
  normalizeDateValue,
  sortRows,
} from "./reportHelpers";

const PRODUCT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "smartphone", label: "Smartphone" },
  { value: "laptop", label: "Laptop" },
  { value: "tv", label: "TV" },
  { value: "networking", label: "Networking" },
];

const SORT_OPTIONS = [
  {
    value: "search_popularity_score",
    label: "Search Popularity Score",
    type: "number",
  },
  { value: "search_count_30d", label: "Searches 30d", type: "number" },
  { value: "views_30d", label: "Views 30d", type: "number" },
  { value: "avg_dwell_seconds", label: "Dwell Time", type: "number" },
  { value: "freshness_score", label: "Freshness", type: "number" },
  { value: "search_weight", label: "Search Weight", type: "number" },
  { value: "last_search_at", label: "Latest Search", type: "date" },
  { value: "last_view_at", label: "Latest View", type: "date" },
  { value: "last_engagement_at", label: "Latest Engagement", type: "date" },
  { value: "name", label: "Product Name", type: "text" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 sm:px-3 md:px-4";
const SURFACE_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";
const PANEL_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";
const FIELD_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#4C35F2] focus:ring-0";
const GHOST_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300";
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white shadow-none transition hover:bg-[#4028e6] disabled:cursor-not-allowed disabled:border-[#b7adff] disabled:bg-[#b7adff]";

const DEFAULT_DEVICE_TREND = [12, 14, 13, 17, 15, 19, 16, 21, 18, 23];
const DEFAULT_SEARCH_TREND = [11, 18, 14, 21, 19, 20, 18, 22, 19, 21];
const DEFAULT_TOP_SCORE_TREND = [72, 83, 76, 88, 80, 92, 89, 81, 84, 77];
const DEFAULT_AVERAGE_TREND = [56, 54, 60, 68, 55, 59, 60, 56, 69, 61];
const DEFAULT_GENERATED_TREND = [10, 11, 10, 12, 11, 13, 12, 14, 13, 15];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampScore = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  return Math.max(0, Math.min(100, parsed));
};

const formatCompactCount = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return EMPTY_TEXT;

  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: parsed >= 1000000 ? 2 : 1,
  }).format(parsed);
};

const formatDateOnly = (value) => {
  const timestamp = normalizeDateValue(value);
  if (timestamp === null) return EMPTY_TEXT;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
};

const formatTimeOnly = (value) => {
  const timestamp = normalizeDateValue(value);
  if (timestamp === null) return EMPTY_TEXT;

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const formatDuration = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return EMPTY_TEXT;

  const totalSeconds = Math.max(0, Math.round(parsed));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};

const formatProductType = (value) =>
  String(value || "Unknown")
    .split("_")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");

const normalizeLabel = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const parseImageList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    }

    return [trimmed];
  }

  return [];
};

const getPrimaryImage = (row) =>
  row?.image_url ||
  row?.thumbnail ||
  row?.hero_image ||
  parseImageList(row?.images_json ?? row?.images ?? row?.image_urls)[0] ||
  "";

const getSparklineValues = (rows, getValue, fallback) => {
  const values = rows
    .slice(0, 10)
    .map(getValue)
    .map((value) => toNumber(value))
    .filter(Number.isFinite);

  return values.length >= 2 ? values : fallback;
};

const buildSparklinePath = (values) => {
  if (!Array.isArray(values) || values.length === 0) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const spread = max - min || 1;
  const width = 144;
  const height = 34;

  return values
    .map((value, index) => {
      const x =
        values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / spread) * (height - 6) - 3;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const getBadgeClassName = (badge) => {
  switch (normalizeLabel(badge)) {
    case "hot":
      return "bg-rose-50 text-rose-600 ring-1 ring-rose-100";
    case "trending":
      return "bg-blue-50 text-blue-600 ring-1 ring-blue-100";
    case "rising":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
    case "popular":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "live":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
};

const getProductTypeMeta = (productType) => {
  switch (normalizeLabel(productType)) {
    case "smartphone":
      return {
        badgeClassName: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
        shortLabel: "Smartphone",
      };
    case "laptop":
      return {
        badgeClassName: "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
        shortLabel: "Laptop",
      };
    case "tv":
      return {
        badgeClassName: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
        shortLabel: "TV",
      };
    case "networking":
      return {
        badgeClassName: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
        shortLabel: "Networking",
      };
    default:
      return {
        badgeClassName: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
        shortLabel: formatProductType(productType),
      };
  }
};

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage, currentPage + 1, "...", totalPages];
};

const StateBanner = ({
  icon: Icon,
  iconClassName,
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  className,
}) => (
  <section className={`rounded-md border px-4 py-3 sm:px-4 ${className}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${iconClassName}`}
        >
          <Icon />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-md border border-current px-4 py-2 text-sm font-semibold text-inherit transition hover:bg-white/60"
          >
            {actionLabel}
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md p-2 text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
            aria-label="Dismiss banner"
          >
            <FaTimes />
          </button>
        ) : null}
      </div>
    </div>
  </section>
);

const SummaryCard = ({
  icon: Icon,
  iconClassName,
  label,
  value,
  supporting,
  accentText,
  badge,
  sparkline,
  sparklineColorClassName,
  className = "",
  valueClassName = "",
}) => {
  const sparklinePath = buildSparklinePath(sparkline || []);

  return (
    <article className={`${PANEL_CLASS} px-4 py-4 sm:px-5 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-md border border-current/10 text-lg ${iconClassName}`}
        >
          <Icon />
        </div>
        {badge ? <div>{badge}</div> : null}
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div
          className={`text-[1.65rem] font-bold tracking-tight text-slate-900 sm:text-[1.85rem] ${valueClassName}`}
        >
          {value}
        </div>
      </div>

      <div className="mt-2 min-h-[40px] space-y-1">
        {supporting ? (
          <p className="text-xs font-medium text-slate-500">{supporting}</p>
        ) : null}
        {accentText ? (
          <div className="text-xs font-semibold text-emerald-600">{accentText}</div>
        ) : null}
      </div>

      {sparklinePath ? (
        <div className="mt-3">
          <svg viewBox="0 0 144 34" className="h-8 w-full">
            <path
              d={sparklinePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className={sparklineColorClassName}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
    </article>
  );
};

const SearchPopularityReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [productType, setProductType] = useState("all");
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(50);
  const [sortField, setSortField] = useState("search_popularity_score");
  const [sortDirection, setSortDirection] = useState("desc");
  const [generatedAt, setGeneratedAt] = useState(null);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.set("limit", String(Number(limit) || 50));
      params.set("days", String(Number(days) || 30));

      if (productType && productType !== "all") {
        params.set("productType", productType);
      }

      const response = await fetch(
        buildUrl(`/api/admin/search-popularity?${params.toString()}`),
        {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const devices = Array.isArray(payload?.devices) ? payload.devices : [];

      setRows(devices);
      setGeneratedAt(payload?.generated_at || new Date().toISOString());
    } catch (requestError) {
      console.error("Failed to fetch search popularity report:", requestError);
      setError(
        requestError?.message || "Failed to load search popularity report",
      );
      setRows([]);
      setGeneratedAt(null);
    } finally {
      setLoading(false);
    }
  }, [days, limit, productType]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredRows = useMemo(() => {
    const search = String(query || "").trim().toLowerCase();
    if (!search) return rows;

    return rows.filter((row) => {
      const values = [
        row?.product_id,
        row?.name,
        row?.brand_name,
        row?.product_type,
        row?.detail_path,
        row?.badge,
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(search),
      );
    });
  }, [query, rows]);

  const sortMeta = useMemo(
    () =>
      SORT_OPTIONS.find((option) => option.value === sortField) ||
      SORT_OPTIONS[0],
    [sortField],
  );

  const sortedRows = useMemo(
    () =>
      sortRows(filteredRows, (row) => row?.[sortField], {
        direction: sortDirection,
        type: sortMeta.type,
      }),
    [filteredRows, sortDirection, sortField, sortMeta.type],
  );

  const summary = useMemo(() => {
    const totalSearches = rows.reduce(
      (sum, row) => sum + Number(row?.search_count_30d || 0),
      0,
    );
    const topRow =
      rows.length > 0
        ? [...rows].sort(
            (left, right) =>
              Number(right?.search_popularity_score || 0) -
              Number(left?.search_popularity_score || 0),
          )[0]
        : null;

    const averageScore = rows.length
      ? rows.reduce(
          (sum, row) => sum + Number(row?.search_popularity_score || 0),
          0,
        ) / rows.length
      : null;

    return {
      totalRows: rows.length,
      totalSearches,
      topRow,
      averageScore,
      devicesTrend: getSparklineValues(
        rows,
        (row) => row?.hero_rank,
        DEFAULT_DEVICE_TREND,
      ),
      searchesTrend: getSparklineValues(
        rows,
        (row) => row?.search_count_30d,
        DEFAULT_SEARCH_TREND,
      ),
      topScoreTrend: getSparklineValues(
        rows,
        (row) => row?.search_popularity_score,
        DEFAULT_TOP_SCORE_TREND,
      ),
      averageTrend: getSparklineValues(
        rows,
        (row) => row?.search_weight,
        DEFAULT_AVERAGE_TREND,
      ),
      generatedTrend: getSparklineValues(
        rows,
        (row) => normalizeDateValue(row?.last_search_at),
        DEFAULT_GENERATED_TREND,
      ),
    };
  }, [rows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    productType,
    days,
    limit,
    sortField,
    sortDirection,
    pageSize,
    rows.length,
  ]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, sortedRows]);

  const paginationItems = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const visibleRangeLabel = useMemo(() => {
    if (sortedRows.length === 0) return `Showing 0 of ${rows.length} results`;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, sortedRows.length);
    return `Showing ${startIndex + 1} to ${endIndex} of ${sortedRows.length} results`;
  }, [currentPage, pageSize, rows.length, sortedRows.length]);

  const selectedTypeLabel = useMemo(
    () =>
      PRODUCT_TYPES.find((option) => option.value === productType)?.label ||
      "All Types",
    [productType],
  );

  return (
    <div className={PAGE_CLASS}>
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Search Popularity Report
              </h1>
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-600 shadow-none">
                <FaSearch className="text-base" />
              </div>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Track monthly search demand, engagement quality, and freshness
              signals across devices and products.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={fetchReport}
              disabled={loading}
              className={PRIMARY_BUTTON_CLASS}
            >
              {loading ? <FaSpinner className="animate-spin text-sm" /> : <FaSyncAlt className="text-sm" />}
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            icon={FaCube}
            iconClassName="bg-[#EEF3FF] text-[#2F63FF]"
            label="Devices Returned"
            value={formatCount(summary.totalRows)}
            supporting={
              productType === "all"
                ? "Across all types"
                : `Filtered to ${selectedTypeLabel.toLowerCase()}`
            }
            sparkline={summary.devicesTrend}
            sparklineColorClassName="text-[#2F63FF]"
          />
          <SummaryCard
            icon={FaSearch}
            iconClassName="bg-emerald-50 text-emerald-600"
            label={`Total Searches (${days}d)`}
            value={formatCompactCount(summary.totalSearches)}
            supporting={`Window: last ${days} days`}
            accentText={
              summary.totalRows > 0 ? `${formatCount(summary.totalRows)} ranked devices` : null
            }
            sparkline={summary.searchesTrend}
            sparklineColorClassName="text-emerald-500"
          />
          <SummaryCard
            icon={FaFire}
            iconClassName="bg-violet-50 text-violet-600"
            label="Top Popularity Score"
            value={formatScore(summary.topRow?.search_popularity_score, 2)}
            supporting={summary.topRow?.name || "No leading device yet"}
            sparkline={summary.topScoreTrend}
            sparklineColorClassName="text-violet-500"
          />
          <SummaryCard
            icon={FaChartLine}
            iconClassName="bg-amber-50 text-amber-500"
            label="Average Score"
            value={formatScore(summary.averageScore, 2)}
            supporting={
              summary.totalRows > 0
                ? `Across ${formatCount(summary.totalRows)} results`
                : "No scored devices yet"
            }
            sparkline={summary.averageTrend}
            sparklineColorClassName="text-amber-500"
          />
          <SummaryCard
            icon={FaClock}
            iconClassName="bg-[#EEF3FF] text-[#2F63FF]"
            label="Generated At"
            value={formatDateOnly(generatedAt)}
            supporting={formatTimeOnly(generatedAt)}
            badge={
              generatedAt ? (
                <span className="rounded-md bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  Live
                </span>
              ) : null
            }
            sparkline={summary.generatedTrend}
            sparklineColorClassName="text-[#2F63FF]"
            className="sm:col-span-2 xl:col-span-1"
            valueClassName="text-[1.35rem]"
          />
        </section>

        <section className={`${PANEL_CLASS} hidden p-4 sm:p-5 lg:block`}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.72fr_0.72fr_1.2fr_1.1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Product Type
              </label>
              <select
                value={productType}
                onChange={(event) => setProductType(event.target.value)}
                className={FIELD_CLASS}
              >
                {PRODUCT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Days
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={days}
                onChange={(event) => setDays(event.target.value)}
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Limit
              </label>
              <select
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                className={FIELD_CLASS}
              >
                {[25, 50, 100, 200].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Sort By
              </label>
              <select
                value={sortField}
                onChange={(event) => setSortField(event.target.value)}
                className={FIELD_CLASS}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Direction
              </label>
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value)}
                className={FIELD_CLASS}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.55fr] xl:items-center">
            <div>
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className={`${FIELD_CLASS} pl-11`}
                  placeholder="Search product, brand, type or path..."
                />
              </div>
            </div>

            <div className="space-y-1 text-sm text-slate-500 xl:justify-self-end xl:text-right">
              <p className="font-medium text-slate-600">{visibleRangeLabel}</p>
              <p className="inline-flex items-center gap-1.5">
                Missing values always stay at the bottom
                <FaInfoCircle className="text-slate-400" />
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((previous) => !previous)}
            className={`${PANEL_CLASS} flex w-full items-center justify-between px-4 py-3 text-left`}
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FaFilter className="text-[#2F63FF]" />
              Filters
            </span>
            <span className="text-xs font-medium text-slate-500">
              {mobileFiltersOpen ? "Hide" : "Show"}
            </span>
          </button>

          {mobileFiltersOpen ? (
            <section className={`${PANEL_CLASS} p-4`}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Type
                  </label>
                  <select
                    value={productType}
                    onChange={(event) => setProductType(event.target.value)}
                    className={FIELD_CLASS}
                  >
                    {PRODUCT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Days
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={days}
                      onChange={(event) => setDays(event.target.value)}
                      className={FIELD_CLASS}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Limit
                    </label>
                    <select
                      value={limit}
                      onChange={(event) => setLimit(event.target.value)}
                      className={FIELD_CLASS}
                    >
                      {[25, 50, 100, 200].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sort By
                  </label>
                  <select
                    value={sortField}
                    onChange={(event) => setSortField(event.target.value)}
                    className={FIELD_CLASS}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Direction
                  </label>
                  <select
                    value={sortDirection}
                    onChange={(event) => setSortDirection(event.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Search
                  </label>
                  <div className="relative">
                    <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className={`${FIELD_CLASS} pl-11`}
                      placeholder="Search product, brand, type or path..."
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <div className="px-1 text-sm text-slate-500">
            <p className="font-medium text-slate-600">{visibleRangeLabel}</p>
            <p className="mt-1">Missing values always stay at the bottom</p>
          </div>
        </section>

        {error ? (
          <StateBanner
            icon={FaExclamationCircle}
            iconClassName="bg-rose-100 text-rose-600"
            title="Error Loading Report"
            description="We couldn't load the search popularity data. Please try again."
            actionLabel="Try Again"
            onAction={fetchReport}
            onDismiss={() => setError(null)}
            className="border-rose-200 bg-rose-50 text-rose-600"
          />
        ) : null}

        {loading ? (
          <StateBanner
            icon={FaSpinner}
            iconClassName="bg-[#EEF3FF] text-[#2F63FF]"
            title="Loading Search Popularity Report"
            description="Fetching the latest search demand and engagement insights..."
            className="border-[#DCE5FF] bg-white text-[#2F63FF]"
          />
        ) : null}

        <section className="space-y-4 lg:hidden">
          {!loading && paginatedRows.length === 0 ? (
            <section className={`${PANEL_CLASS} px-5 py-8 text-center text-sm text-slate-600`}>
              No devices found for the selected filters.
            </section>
          ) : (
            paginatedRows.map((row, index) => {
              const absoluteRank = (currentPage - 1) * pageSize + index + 1;
              const badgeLabel = row?.badge || "Popular";
              const typeMeta = getProductTypeMeta(row?.product_type);
              const productImage = getPrimaryImage(row);

              return (
                <article
                  key={row?.product_id ?? `${row?.name}-${absoluteRank}`}
                  className={`${PANEL_CLASS} px-4 py-4`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 min-w-6 items-center justify-center rounded-md bg-[#EEF3FF] px-1.5 text-[11px] font-semibold text-[#2F63FF]">
                      {row?.hero_rank ?? absoluteRank}
                    </div>

                    <div className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={row?.name || "Product thumbnail"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FaSearch className="text-slate-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-slate-950">
                            {row?.name || "Untitled product"}
                          </h2>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {[row?.brand_name, formatProductType(row?.product_type)]
                              .filter(Boolean)
                              .join(" / ") || "No product metadata"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ${getBadgeClassName(
                            badgeLabel,
                          )}`}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-[11px] text-slate-400">Searches 30d</p>
                      <p className="mt-1 font-semibold text-[#2F63FF]">
                        {formatCount(row?.search_count_30d)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Score</p>
                      <p className="mt-1 font-semibold text-[#2F63FF]">
                        {formatScore(row?.search_popularity_score, 2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Search Weight</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatScore(row?.search_weight, 2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Views 30d</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatCount(row?.views_30d)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Dwell Time</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDuration(row?.avg_dwell_seconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Freshness</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatScore(row?.freshness_score, 1)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <p className="text-[11px] text-slate-400">Last Search</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {formatDateTime(row?.last_search_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Last Engagement</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {formatDateTime(row?.last_engagement_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex rounded-md px-2.5 py-1 font-semibold ${typeMeta.badgeClassName}`}
                    >
                      {typeMeta.shortLabel}
                    </span>
                    <span className="truncate text-slate-400">
                      {row?.detail_path || EMPTY_TEXT}
                    </span>
                  </div>
                </article>
              );
            })
          )}

          {sortedRows.length > 0 ? (
            <section className={`${PANEL_CLASS} px-4 py-3`}>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <FaChevronLeft />
                </button>

                <div className="flex items-center gap-2">
                  {paginationItems.map((item, index) =>
                    item === "..." ? (
                      <span
                        key={`mobile-gap-${index}`}
                        className="inline-flex h-10 w-10 items-center justify-center text-sm text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={`mobile-page-${item}`}
                        type="button"
                        onClick={() => setCurrentPage(Number(item))}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition ${
                          currentPage === item
                            ? "border-[#4C35F2] bg-[#4C35F2] text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((previous) => Math.min(totalPages, previous + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <FaChevronRight />
                </button>
              </div>
            </section>
          ) : null}
        </section>

        <section className={`${SURFACE_CLASS} hidden overflow-hidden lg:block`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-white">
                <tr>
                  {[
                    "Rank",
                    "Product",
                    "Type",
                    "Brand",
                    "Searches 30d",
                    "Search Weight",
                    "Views 30d",
                    "Dwell Time",
                    "Freshness",
                    "Score",
                    "Badge",
                    "Last Search",
                    "Last View",
                    "Last Engagement",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {!loading && paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No devices found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, index) => {
                    const absoluteRank = (currentPage - 1) * pageSize + index + 1;
                    const badgeLabel = row?.badge || "Popular";
                    const typeMeta = getProductTypeMeta(row?.product_type);
                    const productImage = getPrimaryImage(row);

                    return (
                      <tr
                        key={row?.product_id ?? `${row?.name}-${absoluteRank}`}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
                          {row?.hero_rank ?? absoluteRank}
                        </td>
                        <td className="min-w-[260px] px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt={row?.name || "Product thumbnail"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <FaSearch className="text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-950">
                                {row?.name || EMPTY_TEXT}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {row?.detail_path || EMPTY_TEXT}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${typeMeta.badgeClassName}`}
                          >
                            {typeMeta.shortLabel}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {row?.brand_name || EMPTY_TEXT}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatCount(row?.search_count_30d)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatScore(row?.search_weight, 2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatCount(row?.views_30d)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatDuration(row?.avg_dwell_seconds)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatScore(row?.freshness_score, 1)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-base font-semibold text-[#2F63FF]">
                          {formatScore(row?.search_popularity_score, 2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${getBadgeClassName(
                              badgeLabel,
                            )}`}
                          >
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatDateTime(row?.last_search_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatDateTime(row?.last_view_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatDateTime(row?.last_engagement_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {sortedRows.length > 0 ? (
            <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600">
                  Rows per page
                </label>
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#4C35F2] focus:ring-0"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <FaChevronLeft />
                </button>

                {paginationItems.map((item, index) =>
                  item === "..." ? (
                    <span
                      key={`page-gap-${index}`}
                      className="inline-flex h-10 w-10 items-center justify-center text-sm text-slate-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => setCurrentPage(Number(item))}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition ${
                        currentPage === item
                          ? "border-[#4C35F2] bg-[#4C35F2] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((previous) => Math.min(totalPages, previous + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          ) : null}
        </section>
    </div>
  );
};

export default SearchPopularityReport;
