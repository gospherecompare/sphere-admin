import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaBolt,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaCube,
  FaExclamationCircle,
  FaFilter,
  FaMedal,
  FaMobileAlt,
  FaSearch,
  FaSpinner,
  FaStar,
  FaSyncAlt,
  FaTimes,
  FaTrophy,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import {
  formatDateTime,
  formatScore,
  normalizeDateValue,
  sortRows,
} from "./reportHelpers";

const SORT_OPTIONS = [
  { value: "hook_score", label: "Hook Score", type: "number" },
  { value: "buyer_intent", label: "Buyer Intent", type: "number" },
  { value: "trend_velocity", label: "Trend Velocity", type: "number" },
  { value: "freshness", label: "Freshness", type: "number" },
  { value: "hook_calculated_at", label: "Latest Calculation", type: "date" },
  { value: "created_at", label: "Latest Created", type: "date" },
  { value: "launch_date", label: "Launch Date", type: "date" },
  { value: "name", label: "Product Name", type: "text" },
];

const PUBLISHED_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const DEFAULT_TRACKED_TREND = [8, 12, 10, 15, 11, 14, 18];
const DEFAULT_PUBLISHED_TREND = [5, 10, 8, 13, 10, 15, 17];

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 sm:px-3 md:px-4";
const CARD_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";
const SECTION_HEADER_CLASS =
  "border-b border-slate-200 bg-white px-3 py-4 sm:px-4";
const FLAT_FIELD_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#345CFF] focus:bg-white focus:ring-0";
const GHOST_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 shadow-none disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white transition hover:bg-[#3d2be3] shadow-none disabled:cursor-not-allowed disabled:opacity-60";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampScore = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  return Math.max(0, Math.min(100, parsed));
};

const getPublished = (row) => Boolean(row?.is_published ?? row?.published);

const getSortValue = (row, sortField) => {
  switch (sortField) {
    case "hook_score":
      return row?.hook_score;
    case "buyer_intent":
      return row?.buyer_intent;
    case "trend_velocity":
      return row?.trend_velocity;
    case "freshness":
      return row?.freshness;
    case "launch_date":
      return row?.launch_date;
    case "created_at":
      return row?.created_at;
    case "name":
      return row?.name;
    case "hook_calculated_at":
    default:
      return row?.hook_calculated_at;
  }
};

const parseImageList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return [];

    if (normalized.startsWith("[")) {
      try {
        const parsed = JSON.parse(normalized);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    }

    return [normalized];
  }

  return [];
};

const getPrimaryImage = (row) =>
  parseImageList(row?.images_json ?? row?.images ?? row?.image_urls)[0] || "";

const formatDateOnly = (value) => {
  const timestamp = normalizeDateValue(value);
  if (timestamp === null) return "-";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
};

const formatTimeOnly = (value) => {
  const timestamp = normalizeDateValue(value);
  if (timestamp === null) return "-";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const getScoreTone = (value) => {
  const parsed = clampScore(value);
  if (parsed === null) {
    return {
      valueClassName: "text-slate-400",
      barClassName: "bg-slate-300",
    };
  }

  if (parsed >= 90) {
    return {
      valueClassName: "text-[#1D4ED8]",
      barClassName: "bg-[#2563EB]",
    };
  }

  if (parsed >= 75) {
    return {
      valueClassName: "text-emerald-700",
      barClassName: "bg-emerald-500",
    };
  }

  if (parsed >= 55) {
    return {
      valueClassName: "text-amber-700",
      barClassName: "bg-amber-400",
    };
  }

  return {
    valueClassName: "text-rose-700",
    barClassName: "bg-rose-400",
  };
};

const buildTrendSeries = (rows, predicate, fallback) => {
  const buckets = new Map();

  rows.forEach((row) => {
    if (!predicate(row)) return;
    const timestamp = normalizeDateValue(
      row?.hook_calculated_at ?? row?.created_at ?? row?.launch_date,
    );
    if (timestamp === null) return;

    const date = new Date(timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });

  const values = Array.from(buckets.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-7)
    .map((entry) => entry[1]);

  return values.length ? values : fallback;
};

const buildSparklinePath = (values) => {
  if (!Array.isArray(values) || values.length === 0) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const spread = max - min || 1;
  const width = 128;
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

const getAverageDelta = (rows) => {
  const ordered = sortRows(
    rows,
    (row) => row?.hook_calculated_at ?? row?.created_at ?? row?.launch_date,
    { direction: "desc", type: "date" },
  );

  const recent = ordered
    .slice(0, 8)
    .map((row) => toNumber(row?.hook_score))
    .filter(Number.isFinite);
  const previous = ordered
    .slice(8, 16)
    .map((row) => toNumber(row?.hook_score))
    .filter(Number.isFinite);

  if (recent.length < 2 || previous.length < 2) return null;

  const recentAverage =
    recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const previousAverage =
    previous.reduce((sum, value) => sum + value, 0) / previous.length;

  return recentAverage - previousAverage;
};

const getRankMeta = (index) => {
  if (index === 0) {
    return {
      icon: FaTrophy,
      className: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
      label: "1",
    };
  }

  if (index === 1) {
    return {
      icon: FaMedal,
      className: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
      label: "2",
    };
  }

  if (index === 2) {
    return {
      icon: FaMedal,
      className: "bg-orange-50 text-orange-500 ring-1 ring-orange-100",
      label: "3",
    };
  }

  return {
    icon: null,
    className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    label: String(index + 1),
  };
};

const StatusBadge = ({ published }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
      published
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
        : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
    }`}
  >
    {published ? "Published" : "Draft"}
  </span>
);

const RankBadge = ({ index }) => {
  const meta = getRankMeta(index);
  const Icon = meta.icon;

  return (
    <div
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-2xl px-2 text-sm font-semibold ${meta.className}`}
    >
      {Icon ? <Icon className="text-sm" /> : meta.label}
    </div>
  );
};

const ScoreBar = ({ value, compact = false }) => {
  const parsed = clampScore(value);
  const tone = getScoreTone(value);

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <div className={`font-semibold ${tone.valueClassName}`}>
        {formatScore(parsed, 2)}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${tone.barClassName}`}
          style={{ width: `${parsed ?? 0}%` }}
        />
      </div>
    </div>
  );
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
  <section className={`border px-2 py-3 sm:px-3 ${className}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center ${iconClassName}`}
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
            className="border border-current px-4 py-2 text-sm font-semibold text-inherit transition hover:bg-white/60"
          >
            {actionLabel}
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="p-2 text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
            aria-label="Dismiss message"
          >
            <FaTimes />
          </button>
        ) : null}
      </div>
    </div>
  </section>
);

const HeroButton = ({
  children,
  onClick,
  disabled,
  tone = "secondary",
  icon: Icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`${tone === "primary" ? PRIMARY_BUTTON_CLASS : GHOST_BUTTON_CLASS} w-full sm:w-auto`}
  >
    {Icon ? <Icon className={disabled ? "animate-spin" : ""} /> : null}
    {children}
  </button>
);

const SummaryCard = ({
  icon: Icon,
  iconClassName,
  label,
  value,
  supporting,
  secondary,
  trend,
  badge,
  className = "",
  valueClassName = "",
}) => {
  const trendPath = buildSparklinePath(trend || []);

  return (
    <article className={`${CARD_CLASS} px-4 py-4 sm:px-5 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center border border-current/10 text-lg ${iconClassName}`}
        >
          <Icon />
        </div>
        {badge ? <div>{badge}</div> : null}
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div
          className={`text-[1.8rem] font-bold tracking-tight text-slate-900 ${valueClassName}`}
        >
          {value}
        </div>
      </div>

      <div className="mt-2 min-h-[42px] space-y-1">
        {supporting ? (
          <p className="text-xs font-medium text-slate-500">{supporting}</p>
        ) : null}
        {secondary ? (
          <div className="text-xs font-semibold text-slate-700">
            {secondary}
          </div>
        ) : null}
      </div>

      {trendPath ? (
        <div className="mt-3">
          <svg viewBox="0 0 128 34" className="h-8 w-full">
            <path
              d={trendPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              className="text-[#356BFF]"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
    </article>
  );
};

const HookScoreReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("all");
  const [sortField, setSortField] = useState("hook_score");
  const [sortDirection, setSortDirection] = useState("desc");

  const hasFetchedRef = useRef(false);
  const searchInputRef = useRef(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const res = await fetch(buildUrl("/api/smartphone"), {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data?.smartphones) ? data.smartphones : []);
    } catch (err) {
      console.error("Failed to fetch hook score report:", err);
      setError(err.message || "Failed to load hook score report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const recomputeReport = useCallback(async () => {
    setRecomputing(true);
    setError(null);

    try {
      const token = getAuthToken();
      const res = await fetch(buildUrl("/api/admin/hook-score/recompute"), {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      await fetchReport();
    } catch (err) {
      console.error("Failed to recompute hook score report:", err);
      setError(err.message || "Failed to recompute hook scores");
    } finally {
      setRecomputing(false);
    }
  }, [fetchReport]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchReport();
  }, [fetchReport]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(query || "")
      .trim()
      .toLowerCase();

    return rows.filter((row) => {
      const published = getPublished(row);

      if (publishedFilter === "published" && !published) return false;
      if (publishedFilter === "draft" && published) return false;

      if (!normalizedQuery) return true;

      const haystacks = [
        row?.product_id,
        row?.name,
        row?.brand_name,
        row?.brand,
        row?.model,
        row?.product_type,
      ];

      return haystacks.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedQuery),
      );
    });
  }, [publishedFilter, query, rows]);

  const sortMeta = useMemo(
    () =>
      SORT_OPTIONS.find((option) => option.value === sortField) ||
      SORT_OPTIONS[0],
    [sortField],
  );

  const sortedRows = useMemo(
    () =>
      sortRows(filteredRows, (row) => getSortValue(row, sortField), {
        direction: sortDirection,
        type: sortMeta.type,
      }),
    [filteredRows, sortDirection, sortField, sortMeta.type],
  );

  const summary = useMemo(() => {
    const validHookScores = rows
      .map((row) => toNumber(row?.hook_score))
      .filter(Number.isFinite);

    const topScoreRow = rows.reduce((currentTop, row) => {
      const rowScore = toNumber(row?.hook_score);
      if (rowScore === null) return currentTop;

      if (!currentTop) return row;

      const currentScore = toNumber(currentTop?.hook_score);
      return rowScore > (currentScore ?? -1) ? row : currentTop;
    }, null);

    const latestCalculatedAt = rows.reduce((latest, row) => {
      const current = normalizeDateValue(row?.hook_calculated_at);
      if (current === null) return latest;
      return latest === null || current > latest ? current : latest;
    }, null);

    const publishedRows = rows.filter((row) => getPublished(row)).length;
    const publishedPercent = rows.length
      ? (publishedRows / rows.length) * 100
      : null;

    return {
      totalRows: rows.length,
      publishedRows,
      publishedPercent,
      averageHookScore: validHookScores.length
        ? validHookScores.reduce((sum, value) => sum + value, 0) /
          validHookScores.length
        : null,
      topHookScore: topScoreRow?.hook_score ?? null,
      topScoreName: topScoreRow?.name || "No top device yet",
      latestCalculatedAt,
      averageDelta: getAverageDelta(rows),
      trackedTrend: buildTrendSeries(rows, () => true, DEFAULT_TRACKED_TREND),
      publishedTrend: buildTrendSeries(
        rows,
        (row) => getPublished(row),
        DEFAULT_PUBLISHED_TREND,
      ),
    };
  }, [rows]);

  const hasActiveFilters =
    query.trim() ||
    publishedFilter !== "all" ||
    sortField !== "hook_score" ||
    sortDirection !== "desc";

  const handleFilterAction = useCallback(() => {
    if (hasActiveFilters) {
      setQuery("");
      setPublishedFilter("all");
      setSortField("hook_score");
      setSortDirection("desc");
      return;
    }

    searchInputRef.current?.focus();
  }, [hasActiveFilters]);

  const visibleRangeLabel = useMemo(() => {
    if (sortedRows.length === 0) return `Showing 0 of ${rows.length} devices`;
    return `Showing 1 to ${sortedRows.length} of ${rows.length} devices`;
  }, [rows.length, sortedRows.length]);

  return (
    <div className={PAGE_CLASS}>
      <div className="space-y-4 sm:space-y-5">
        <section className="border-b border-slate-200 pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Hook Score Report
                </h1>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-600 shadow-none">
                  <FaTrophy className="text-base" />
                </div>
              </div>
              <p className="mt-2 max-w-[42rem] text-sm text-slate-500">
                Track and analyze Hook Scores across all devices to measure
                discovery potential, buyer intent, trend, and freshness.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <HeroButton
                onClick={fetchReport}
                disabled={loading}
                icon={loading ? FaSpinner : FaSyncAlt}
              >
                Refresh
              </HeroButton>
              <HeroButton
                onClick={recomputeReport}
                disabled={recomputing}
                icon={recomputing ? FaSpinner : FaBolt}
                tone="primary"
              >
                Recompute Scores
              </HeroButton>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            icon={FaCube}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            label="Tracked Devices"
            value={rows.length.toLocaleString()}
            supporting="100% of catalog"
            trend={summary.trackedTrend}
            className="col-span-1"
          />
          <SummaryCard
            icon={FaCheckCircle}
            iconClassName="bg-emerald-50 text-emerald-600"
            label="Published Devices"
            value={summary.publishedRows.toLocaleString()}
            supporting={
              summary.publishedPercent === null
                ? "-"
                : `${formatScore(summary.publishedPercent, 1)}% published`
            }
            trend={summary.publishedTrend}
            className="col-span-1"
          />
          <SummaryCard
            icon={FaChartLine}
            iconClassName="bg-violet-50 text-violet-600"
            label="Average Hook Score"
            value={formatScore(summary.averageHookScore, 2)}
            supporting="vs last calc"
            secondary={
              summary.averageDelta === null ? (
                <span className="text-slate-400">Not enough history</span>
              ) : (
                <span
                  className={
                    summary.averageDelta >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                >
                  {summary.averageDelta >= 0 ? "+" : ""}
                  {formatScore(summary.averageDelta, 2)}
                </span>
              )
            }
          />
          <SummaryCard
            icon={FaStar}
            iconClassName="bg-amber-50 text-amber-500"
            label="Top Hook Score"
            value={formatScore(summary.topHookScore, 2)}
            supporting={summary.topScoreName}
          />
          <SummaryCard
            icon={FaCalendarAlt}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            label="Latest Calculation"
            value={formatDateOnly(summary.latestCalculatedAt)}
            supporting={formatTimeOnly(summary.latestCalculatedAt)}
            badge={
              summary.latestCalculatedAt ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  Success
                </span>
              ) : null
            }
            className="col-span-2 xl:col-span-1"
            valueClassName="text-[1.2rem] sm:text-[1.35rem]"
          />
        </section>

        <section className={`${CARD_CLASS} px-2 py-3 sm:px-3 lg:px-4`}>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-[1.55fr_repeat(3,minmax(0,0.92fr))_auto]">
            <div className="col-span-2 xl:col-span-1">
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Search
              </label>
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by product or model..."
                  className={`${FLAT_FIELD_CLASS} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Status
              </label>
              <select
                value={publishedFilter}
                onChange={(event) => setPublishedFilter(event.target.value)}
                className={FLAT_FIELD_CLASS}
              >
                {PUBLISHED_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Sort By
              </label>
              <select
                value={sortField}
                onChange={(event) => setSortField(event.target.value)}
                className={FLAT_FIELD_CLASS}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Sort Direction
              </label>
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value)}
                className={FLAT_FIELD_CLASS}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="col-span-2 xl:col-span-1 xl:self-end">
              <button
                type="button"
                onClick={handleFilterAction}
                className={`${GHOST_BUTTON_CLASS} w-full xl:min-w-[130px]`}
              >
                <FaFilter className="text-sm" />
                Filters
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm font-medium text-slate-600">
            {visibleRangeLabel}
          </div>
        </section>

        {error ? (
          <StateBanner
            icon={FaExclamationCircle}
            iconClassName="bg-rose-100 text-rose-600"
            title="Failed to load Hook Score data."
            description={error || "Please try again."}
            actionLabel="Try Again"
            onAction={fetchReport}
            onDismiss={() => setError(null)}
            className="border-rose-200 bg-rose-50 text-rose-600"
          />
        ) : null}

        {loading ? (
          <StateBanner
            icon={FaSpinner}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            title="Loading Hook Score data..."
            description="Please wait while we fetch the latest information."
            className="border-[#DCE5FF] bg-white text-[#2F66F6]"
          />
        ) : null}

        {!loading && sortedRows.length === 0 ? (
          <StateBanner
            icon={FaCube}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            title="No devices found"
            description="Try adjusting your search or filter to find what you are looking for."
            className="border-[#DCE5FF] bg-white text-[#2F66F6]"
          />
        ) : null}

        <section className={`${CARD_CLASS} lg:hidden`}>
          {sortedRows.map((row, index) => {
            const productImage = getPrimaryImage(row);
            const published = getPublished(row);

            return (
              <article
                key={row?.product_id ?? `${row?.name}-${index}`}
                className="border-b border-slate-200 last:border-b-0"
              >
                <div className="px-2 py-3 sm:px-3">
                  <div className="flex items-start gap-3">
                    <RankBadge index={index} />

                    <div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={row?.name || "Device"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FaMobileAlt className="text-xl text-slate-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="border-b border-slate-200 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-base font-semibold text-slate-900">
                              {row?.name || "Untitled device"}
                            </h2>
                            <p className="mt-1 truncate text-sm text-slate-500">
                              {[row?.brand_name || row?.brand, row?.model]
                                .filter(Boolean)
                                .join(" / ") || "No brand details"}
                            </p>
                          </div>
                          <StatusBadge published={published} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-px border border-slate-200 bg-slate-200">
                        {[
                          { label: "Hook", value: row?.hook_score },
                          { label: "Intent", value: row?.buyer_intent },
                          { label: "Trend", value: row?.trend_velocity },
                          { label: "Freshness", value: row?.freshness },
                        ].map((metric) => {
                          const tone = getScoreTone(metric.value);
                          return (
                            <div
                              key={metric.label}
                              className="bg-white px-3 py-2.5"
                            >
                              <div
                                className={`text-base font-semibold ${tone.valueClassName}`}
                              >
                                {formatScore(metric.value, 2)}
                              </div>
                              <div className="mt-0.5 text-xs font-medium text-slate-500">
                                {metric.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-2 border-t border-slate-200 py-3 text-sm">
                        {[
                          {
                            label: "Latest Calculated",
                            value: formatDateTime(row?.hook_calculated_at),
                          },
                          {
                            label: "Created",
                            value: formatDateOnly(row?.created_at),
                          },
                          {
                            label: "Launch Date",
                            value: formatDateOnly(row?.launch_date),
                          },
                          {
                            label: "Product ID",
                            value: row?.product_id ?? "-",
                          },
                        ].map((entry) => (
                          <div
                            key={entry.label}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-slate-500">
                              {entry.label}
                            </span>
                            <span className="text-right font-medium text-slate-900">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className={`${CARD_CLASS} hidden lg:block`}>
          <div className="overflow-x-auto">
            <table className="min-w-[1260px] w-full text-sm">
              <thead className="bg-slate-50/90">
                <tr className="border-b border-slate-200">
                  {[
                    "Rank",
                    "Product",
                    "Brand / Model",
                    "Hook",
                    "Intent",
                    "Trend",
                    "Freshness",
                    "Status",
                    "Calculated",
                    "Created",
                    "Launch",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map((row, index) => {
                  const productImage = getPrimaryImage(row);
                  const published = getPublished(row);

                  return (
                    <tr
                      key={row?.product_id ?? `${row?.name}-${index}`}
                      className="align-top transition hover:bg-[#F8FAFF]"
                    >
                      <td className="px-4 py-4">
                        <RankBadge index={index} />
                      </td>
                      <td className="min-w-[260px] px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={row?.name || "Device"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FaMobileAlt className="text-xl text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">
                              {row?.name || "-"}
                            </div>
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              ID: {row?.product_id ?? "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="min-w-[180px] px-4 py-4">
                        <div className="font-medium text-slate-700">
                          {row?.brand_name || row?.brand || "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {row?.model || "-"}
                        </div>
                      </td>
                      <td className="min-w-[90px] px-4 py-4">
                        <ScoreBar value={row?.hook_score} />
                      </td>
                      <td className="min-w-[90px] px-4 py-4">
                        <ScoreBar value={row?.buyer_intent} />
                      </td>
                      <td className="min-w-[90px] px-4 py-4">
                        <ScoreBar value={row?.trend_velocity} />
                      </td>
                      <td className="min-w-[90px] px-4 py-4">
                        <ScoreBar value={row?.freshness} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <StatusBadge published={published} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        <div>{formatDateOnly(row?.hook_calculated_at)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatTimeOnly(row?.hook_calculated_at)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDateOnly(row?.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDateOnly(row?.launch_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HookScoreReport;
