import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowRight,
  FaArrowUp,
  FaBolt,
  FaBullseye,
  FaCalendarAlt,
  FaCamera,
  FaChartLine,
  FaChevronDown,
  FaDownload,
  FaExclamationCircle,
  FaInfoCircle,
  FaLaptop,
  FaLayerGroup,
  FaMicrochip,
  FaMobileAlt,
  FaMousePointer,
  FaShieldAlt,
  FaSpinner,
  FaSyncAlt,
  FaThLarge,
  FaTv,
  FaVolumeUp,
  FaWifi,
  FaWindowRestore,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 sm:px-3 md:px-4";
const PANEL_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";
const SECTION_HEADER_CLASS = "border-b border-slate-200 bg-white px-4 py-4";
const FIELD_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:bg-white focus:ring-0";
const GHOST_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 shadow-none";
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white transition hover:bg-[#3d2be3] shadow-none disabled:cursor-not-allowed disabled:opacity-60";
const SELECT_WRAPPER_CLASS = "relative min-w-[170px]";
const SELECT_CLASS =
  `${FIELD_CLASS} appearance-none pr-10 font-semibold`;
const TEXT_LINK_CLASS =
  "inline-flex items-center gap-2 text-sm font-semibold text-[#4D39FF] transition hover:text-[#3B2AE6]";

const RANGE_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

const DEVICE_OPTIONS = [
  { value: "all", label: "All device types" },
  { value: "smartphone", label: "Smartphone" },
  { value: "laptop", label: "Laptop" },
  { value: "tv", label: "TV" },
  { value: "home-appliance", label: "Home Appliance" },
  { value: "networking", label: "Networking" },
];

const DEVICE_BREAKDOWN_COLORS = {
  smartphone: "#6D35FF",
  laptop: "#5B83F6",
  tv: "#FF9A2D",
  "home-appliance": "#10B981",
  networking: "#F15167",
};

const CATEGORY_BREAKDOWN_COLORS = {
  Performance: "#6D35FF",
  Display: "#5B83F6",
  Connectivity: "#10B981",
  Battery: "#FF9A2D",
  Camera: "#F15167",
  "Smart Features": "#7C3AED",
  Security: "#0EA5E9",
  Audio: "#F97316",
  Design: "#8B5CF6",
  Other: "#94A3B8",
};

const CATEGORY_META = {
  Battery: {
    icon: FaBolt,
    iconClassName: "bg-amber-50 text-amber-500",
  },
  Camera: {
    icon: FaCamera,
    iconClassName: "bg-rose-50 text-rose-500",
  },
  Connectivity: {
    icon: FaWifi,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  Display: {
    icon: FaWindowRestore,
    iconClassName: "bg-blue-50 text-[#345CFF]",
  },
  Performance: {
    icon: FaMicrochip,
    iconClassName: "bg-violet-50 text-violet-600",
  },
  "Smart Features": {
    icon: FaThLarge,
    iconClassName: "bg-indigo-50 text-indigo-600",
  },
  Security: {
    icon: FaShieldAlt,
    iconClassName: "bg-cyan-50 text-cyan-600",
  },
  Audio: {
    icon: FaVolumeUp,
    iconClassName: "bg-orange-50 text-orange-500",
  },
  Design: {
    icon: FaMobileAlt,
    iconClassName: "bg-fuchsia-50 text-fuchsia-600",
  },
  Other: {
    icon: FaLayerGroup,
    iconClassName: "bg-slate-100 text-slate-600",
  },
};

const EMPTY_REPORT = {
  filters: {
    days: 7,
    device_type: "all",
    range_start: "",
    range_end: "",
  },
  summary: {
    total_clicks: 0,
    total_clicks_change_pct: 0,
    avg_daily_clicks: 0,
    avg_daily_clicks_change_pct: 0,
    avg_clicks_per_feature: 0,
    avg_clicks_per_feature_change_pct: 0,
    features_clicked: 0,
    features_clicked_change_pct: 0,
    top_category_label: "None",
    top_category_share_pct: 0,
    top_category_share_change_pct: 0,
    active_days: 0,
    active_days_change_pct: 0,
  },
  series: [],
  top_features: [],
  device_breakdown: [],
  category_breakdown: [],
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCount = (value) => toNumber(value, 0).toLocaleString();

const formatMetric = (value, digits = 1) => {
  const parsed = toNumber(value, 0);
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatPercent = (value, digits = 1) => `${formatMetric(value, digits)}%`;

const formatCompactCount = (value) =>
  new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value, 0));

const formatDateLabel = (value, options) => {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

const formatDateRangeLabel = (start, end) => {
  const startLabel = formatDateLabel(start, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endLabel = formatDateLabel(end, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  return "Selected range";
};

const formatRelativeTime = (value) => {
  if (!value) return "No recent activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent activity";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateLabel(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatScopeLabel = (labels = []) => {
  if (!Array.isArray(labels) || !labels.length) return "Unknown";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return labels.join(" + ");
  return `${labels.length} device types`;
};

const getCategoryMeta = (category) => CATEGORY_META[category] || CATEGORY_META.Other;

const getBreakdownColor = (itemKey, label, index) =>
  DEVICE_BREAKDOWN_COLORS[itemKey] ||
  CATEGORY_BREAKDOWN_COLORS[label] ||
  ["#6D35FF", "#5B83F6", "#10B981", "#FF9A2D", "#F15167", "#8B5CF6"][index % 6];

const getNiceChartMax = (value) => {
  const parsed = toNumber(value, 0);
  if (parsed <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(parsed));
  const residual = parsed / magnitude;
  let niceBase = 10;
  if (residual <= 1) niceBase = 1;
  else if (residual <= 2) niceBase = 2;
  else if (residual <= 5) niceBase = 5;
  return Math.max(10, niceBase * magnitude);
};

const chartPoints = (values, width, height, padding, maxValue) => {
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  return values.map((value, index) => {
    const x =
      padding.left +
      (values.length === 1
        ? usableWidth / 2
        : (usableWidth / Math.max(values.length - 1, 1)) * index);
    const normalized = maxValue > 0 ? value / maxValue : 0;
    const y = height - padding.bottom - normalized * usableHeight;
    return { x, y };
  });
};

const linePath = (points) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

const areaPath = (points, height, padding) => {
  if (!points.length) return "";
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const baseline = height - padding.bottom;
  return `${linePath(points)} L ${lastPoint.x.toFixed(2)} ${baseline.toFixed(2)} L ${firstPoint.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
};

const tickY = (tick, chartHeight, padding, maxValue) => {
  const usableHeight = chartHeight - padding.top - padding.bottom;
  const normalized = maxValue > 0 ? tick / maxValue : 0;
  return chartHeight - padding.bottom - normalized * usableHeight;
};

const buildCsvContent = (report) => {
  const header = [
    "rank",
    "feature",
    "category",
    "devices",
    "clicks",
    "share_percent",
    "change_percent",
    "last_clicked_at",
  ];
  const rows = (report?.top_features || []).map((row) => [
    row.rank,
    row.feature_label,
    row.category,
    (row.device_labels || []).join(" | "),
    row.clicks,
    row.share_pct,
    row.change_pct,
    row.last_clicked_at || "",
  ]);

  return [header, ...rows]
    .map((columns) =>
      columns
        .map((value) => {
          const text = String(value ?? "");
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(","),
    )
    .join("\n");
};

const SummaryCard = ({ icon: Icon, iconClassName, label, value, deltaValue, deltaLabel, note }) => {
  const numericDelta = toNumber(deltaValue, 0);
  const isPositive = numericDelta >= 0;
  const ArrowIcon = isPositive ? FaArrowUp : FaArrowDown;
  const deltaTone = isPositive ? "text-emerald-600" : "text-rose-600";

  return (
    <div className={`${PANEL_CLASS} h-full px-4 py-4`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${iconClassName}`}>
          <Icon className="text-lg" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-[2rem] font-bold leading-none tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
            <ArrowIcon className={`text-[10px] ${deltaTone}`} />
            <span className={`font-semibold ${deltaTone}`}>{formatPercent(Math.abs(numericDelta), 1)}</span>
            <span>{deltaLabel}</span>
          </p>
          {note ? <p className="mt-1 text-xs text-slate-400">{note}</p> : null}
        </div>
      </div>
    </div>
  );
};

const MobileFeatureCard = ({ row }) => {
  const meta = getCategoryMeta(row.category);
  const Icon = meta.icon;

  return (
    <article className="border-b border-slate-200 px-4 py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${meta.iconClassName}`}>
          <Icon className="text-sm" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                #{row.rank}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">{row.feature_label}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {row.category} · {formatScopeLabel(row.device_labels)}
              </p>
            </div>
            <p className="shrink-0 text-xs font-medium text-slate-400">
              {formatRelativeTime(row.last_clicked_at)}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Clicks
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(row.clicks)}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Share
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatPercent(row.share_pct)}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Change
              </p>
              <p className={`mt-1 inline-flex items-center gap-1 text-sm font-semibold ${toNumber(row.change_pct, 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {toNumber(row.change_pct, 0) >= 0 ? (
                  <FaArrowUp className="text-[10px]" />
                ) : (
                  <FaArrowDown className="text-[10px]" />
                )}
                {formatPercent(Math.abs(row.change_pct))}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Devices
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatScopeLabel(row.device_labels)}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const FeatureClicksReport = () => {
  const [days, setDays] = useState(7);
  const [deviceType, setDeviceType] = useState("all");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReport = useCallback(
    async ({ signal, manual = false } = {}) => {
      if (manual) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Please sign in again to load feature analytics.");
        }

        const params = new URLSearchParams({
          days: String(days),
          deviceType,
        });

        const response = await fetch(buildUrl(`/api/reports/feature-clicks?${params.toString()}`), {
          signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          throw new Error(payload?.message || "Failed to load feature clicks report.");
        }

        setReport({
          ...EMPTY_REPORT,
          ...payload,
          filters: {
            ...EMPTY_REPORT.filters,
            ...(payload?.filters || {}),
          },
          summary: {
            ...EMPTY_REPORT.summary,
            ...(payload?.summary || {}),
          },
          series: Array.isArray(payload?.series) ? payload.series : [],
          top_features: Array.isArray(payload?.top_features) ? payload.top_features : [],
          device_breakdown: Array.isArray(payload?.device_breakdown) ? payload.device_breakdown : [],
          category_breakdown: Array.isArray(payload?.category_breakdown) ? payload.category_breakdown : [],
        });
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError(err?.message || "Failed to load feature clicks report.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days, deviceType],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadReport({ signal: controller.signal });
    return () => controller.abort();
  }, [loadReport]);

  const data = report || {
    ...EMPTY_REPORT,
    filters: {
      ...EMPTY_REPORT.filters,
      days,
      device_type: deviceType,
    },
  };

  const chartWidth = 780;
  const chartHeight = 280;
  const chartPadding = useMemo(() => ({ top: 18, right: 22, bottom: 36, left: 22 }), []);

  const rangeLabel = useMemo(
    () => formatDateRangeLabel(data.filters.range_start, data.filters.range_end),
    [data.filters.range_end, data.filters.range_start],
  );

  const selectedDeviceLabel = useMemo(
    () => DEVICE_OPTIONS.find((item) => item.value === deviceType)?.label || "All device types",
    [deviceType],
  );

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Clicks",
        value: formatCount(data.summary.total_clicks),
        deltaValue: data.summary.total_clicks_change_pct,
        deltaLabel: "vs previous window",
        note: rangeLabel,
        icon: FaMousePointer,
        iconClassName: "bg-violet-50 text-violet-600",
      },
      {
        label: "Avg. Daily Clicks",
        value: formatMetric(data.summary.avg_daily_clicks, 1),
        deltaValue: data.summary.avg_daily_clicks_change_pct,
        deltaLabel: "vs previous window",
        note: `${data.filters.days || days}-day average`,
        icon: FaChartLine,
        iconClassName: "bg-blue-50 text-[#345CFF]",
      },
      {
        label: "Avg. Clicks per Feature",
        value: formatMetric(data.summary.avg_clicks_per_feature, 1),
        deltaValue: data.summary.avg_clicks_per_feature_change_pct,
        deltaLabel: "vs previous window",
        note: `Across ${formatCount(data.summary.features_clicked)} tracked features`,
        icon: FaBullseye,
        iconClassName: "bg-amber-50 text-amber-500",
      },
      {
        label: "Features Clicked",
        value: formatCount(data.summary.features_clicked),
        deltaValue: data.summary.features_clicked_change_pct,
        deltaLabel: "vs previous window",
        note: selectedDeviceLabel,
        icon: FaThLarge,
        iconClassName: "bg-emerald-50 text-emerald-600",
      },
      {
        label: "Top Category Share",
        value: formatPercent(data.summary.top_category_share_pct),
        deltaValue: data.summary.top_category_share_change_pct,
        deltaLabel: "vs previous share",
        note: data.summary.top_category_label || "No category activity",
        icon: FaLayerGroup,
        iconClassName: "bg-rose-50 text-rose-500",
      },
      {
        label: "Active Days",
        value: formatCount(data.summary.active_days),
        deltaValue: data.summary.active_days_change_pct,
        deltaLabel: "vs previous window",
        note: `${formatCount(data.summary.active_days)} of ${data.filters.days || days} days recorded clicks`,
        icon: FaCalendarAlt,
        iconClassName: "bg-indigo-50 text-indigo-600",
      },
    ],
    [data.filters.days, data.summary, days, rangeLabel, selectedDeviceLabel],
  );

  const series = useMemo(
    () =>
      (data.series || []).map((item) => ({
        ...item,
        clicks: toNumber(item.clicks, 0),
        label: formatDateLabel(item.date, { month: "short", day: "numeric" }),
      })),
    [data.series],
  );

  const hasSeriesData = series.some((item) => item.clicks > 0);
  const chartMax = useMemo(
    () => getNiceChartMax(Math.max(...series.map((item) => item.clicks), 0)),
    [series],
  );
  const yAxisTicks = useMemo(
    () => [chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25, 0].map((value) => Math.round(value)),
    [chartMax],
  );
  const points = useMemo(
    () =>
      chartPoints(
        series.map((item) => item.clicks),
        chartWidth,
        chartHeight,
        chartPadding,
        chartMax,
      ),
    [chartMax, chartPadding, series],
  );
  const highlightIndex = useMemo(() => {
    if (!series.length) return 0;
    return series.reduce(
      (bestIndex, item, index, array) =>
        item.clicks > array[bestIndex].clicks ? index : bestIndex,
      0,
    );
  }, [series]);

  const breakdownTitle = deviceType === "all" ? "Clicks by Device Type" : "Clicks by Category";
  const breakdownItems = useMemo(() => {
    const source =
      deviceType === "all"
        ? data.device_breakdown || []
        : (data.category_breakdown || []).slice(0, 5).map((item) => ({ ...item, key: item.label }));

    const total = source.reduce((sum, item) => sum + toNumber(item.clicks, 0), 0);
    return source
      .filter((item) => toNumber(item.clicks, 0) > 0)
      .map((item, index) => ({
        ...item,
        percent: total > 0 ? (toNumber(item.clicks, 0) / total) * 100 : 0,
        color: getBreakdownColor(item.key, item.label, index),
      }));
  }, [data.category_breakdown, data.device_breakdown, deviceType]);

  const donutBackground = useMemo(() => {
    if (!breakdownItems.length) {
      return "conic-gradient(#E5E7EB 0% 100%)";
    }
    let offset = 0;
    const segments = breakdownItems.map((item) => {
      const start = offset;
      offset += item.percent;
      return `${item.color} ${start}% ${offset}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, [breakdownItems]);

  const categoryBreakdown = useMemo(
    () =>
      (data.category_breakdown || []).map((item, index) => ({
        ...item,
        color: getBreakdownColor(item.key, item.label, index),
      })),
    [data.category_breakdown],
  );

  const topFeatures = useMemo(
    () =>
      (data.top_features || []).map((row) => ({
        ...row,
        device_labels: Array.isArray(row.device_labels) ? row.device_labels : [],
      })),
    [data.top_features],
  );

  const isEmpty = !loading && !error && toNumber(data.summary.total_clicks, 0) <= 0;

  const handleExport = useCallback(() => {
    if (!topFeatures.length || typeof window === "undefined") return;
    const csv = buildCsvContent(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `feature-clicks-${deviceType}-${days}d.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, [data, days, deviceType, topFeatures.length]);

  return (
    <div className={PAGE_CLASS}>
      <section className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Feature Clicks Report
              </h1>
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-600 shadow-none">
                <FaMousePointer className="text-base" />
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Track user engagement by analyzing live clicks on product feature filters.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <label className={SELECT_WRAPPER_CLASS}>
              <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500" />
              <select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                className={`${SELECT_CLASS} pl-10`}
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
            </label>

            <label className={SELECT_WRAPPER_CLASS}>
              <FaLayerGroup className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500" />
              <select
                value={deviceType}
                onChange={(event) => setDeviceType(event.target.value)}
                className={`${SELECT_CLASS} pl-10`}
              >
                {DEVICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
            </label>

            <button
              type="button"
              className={GHOST_BUTTON_CLASS}
              onClick={() => loadReport({ manual: true })}
            >
              {refreshing ? (
                <FaSpinner className="animate-spin text-sm" />
              ) : (
                <FaSyncAlt className="text-sm" />
              )}
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              onClick={handleExport}
              disabled={!topFeatures.length}
            >
              <FaDownload className="text-sm" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <section className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-none">
          <div className="flex items-start gap-3">
            <FaExclamationCircle className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">Unable to load live feature-click analytics.</p>
              <p className="mt-1 text-rose-600/90">{error}</p>
            </div>
          </div>
        </section>
      ) : null}

      {loading ? (
        <section className={`${PANEL_CLASS} px-4 py-3 text-sm text-slate-500`}>
          <div className="flex items-center gap-2">
            <FaSpinner className="animate-spin text-sm text-slate-400" />
            <span>Loading live feature-click analytics...</span>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_410px]">
        <div className={PANEL_CLASS}>
          <div className={`${SECTION_HEADER_CLASS} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">
                Feature Clicks Over Time
              </h2>
              <FaInfoCircle className="text-sm text-slate-300" />
            </div>

            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
              {rangeLabel}
            </div>
          </div>

          <div className="px-2 py-3 sm:px-4 sm:py-4">
            {!hasSeriesData ? (
              <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/40 px-6 text-center text-sm text-slate-500">
                {isEmpty
                  ? "No feature click activity has been recorded for this range yet."
                  : "Chart data will appear here once feature clicks are recorded."}
              </div>
            ) : (
              <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
                <div className="min-w-[680px]">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[280px] w-full">
                    {yAxisTicks.map((tick) => {
                      const y = tickY(tick, chartHeight, chartPadding, chartMax);
                      return (
                        <g key={`tick-${tick}-${y}`}>
                          <text x="0" y={y + 4} fill="#94A3B8" fontSize="11" fontWeight="600">
                            {formatCompactCount(tick)}
                          </text>
                          <line
                            x1={chartPadding.left}
                            y1={y}
                            x2={chartWidth - chartPadding.right}
                            y2={y}
                            stroke="#E7EBF3"
                            strokeWidth="1"
                          />
                        </g>
                      );
                    })}

                    <path
                      d={areaPath(points, chartHeight, chartPadding)}
                      fill="url(#feature-clicks-area)"
                      opacity="0.26"
                    />
                    <path
                      d={linePath(points)}
                      fill="none"
                      stroke="#5A35FF"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {points[highlightIndex] ? (
                      <line
                        x1={points[highlightIndex].x}
                        y1={chartPadding.top}
                        x2={points[highlightIndex].x}
                        y2={chartHeight - chartPadding.bottom}
                        stroke="#D8DEEA"
                        strokeDasharray="4 5"
                      />
                    ) : null}

                    {points.map((point, index) => (
                      <circle
                        key={series[index]?.date || index}
                        cx={point.x}
                        cy={point.y}
                        r="4.7"
                        fill="#5A35FF"
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                      />
                    ))}

                    {points[highlightIndex] && series[highlightIndex] ? (
                      <foreignObject
                        x={points[highlightIndex].x - 62}
                        y={points[highlightIndex].y - 70}
                        width="146"
                        height="60"
                      >
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                          <p className="font-medium text-slate-500">
                            {formatDateLabel(series[highlightIndex].date, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="mt-1 font-semibold text-[#5A35FF]">
                            Clicks: {formatCount(series[highlightIndex].clicks)}
                          </p>
                        </div>
                      </foreignObject>
                    ) : null}

                    {series.map((item, index) => (
                      <text
                        key={`label-${item.date}`}
                        x={points[index]?.x || 0}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize="12"
                        fontWeight="600"
                      >
                        {item.label}
                      </text>
                    ))}

                    <defs>
                      <linearGradient id="feature-clicks-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6D35FF" />
                        <stop offset="100%" stopColor="#6D35FF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={PANEL_CLASS}>
          <div className={SECTION_HEADER_CLASS}>
            <h2 className="text-lg font-semibold text-slate-950">{breakdownTitle}</h2>
          </div>

          <div className="px-4 py-5">
            {!breakdownItems.length ? (
              <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/40 px-6 text-center text-sm text-slate-500">
                Breakdown data will appear here once feature clicks are available.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-6 md:flex-row md:items-center xl:flex-col xl:items-stretch">
                  <div
                    className="relative mx-auto h-44 w-44 rounded-full p-[15px]"
                    style={{ background: donutBackground }}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
                      <p className="text-[1.95rem] font-bold leading-none text-slate-950">
                        {formatCount(data.summary.total_clicks)}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">Total Clicks</p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    {breakdownItems.map((item) => (
                      <div
                        key={`${item.key || item.label}-${item.label}`}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="inline-flex items-center gap-3 text-slate-600">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.label}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {formatCount(item.clicks)}{" "}
                          <span className="text-slate-400">({formatPercent(item.percent)})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-6 text-sm text-slate-500">
                  {deviceType === "all"
                    ? "Live share of feature clicks across tracked device families."
                    : "Live share of feature clicks across the most active feature categories."}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_430px]">
        <div className={PANEL_CLASS}>
          <div className={`${SECTION_HEADER_CLASS} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">
                Top Features by Clicks
              </h2>
              <FaInfoCircle className="text-sm text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">
              {topFeatures.length ? `${topFeatures.length} live rows` : "No live rows"}
            </p>
          </div>

          {!topFeatures.length ? (
            <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-slate-500">
              No feature ranking data is available for this selection yet.
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
                  <table className="min-w-[980px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-4 py-4">#</th>
                        <th className="px-4 py-4">Feature</th>
                        <th className="px-4 py-4">Category</th>
                        <th className="px-4 py-4">Devices</th>
                        <th className="px-4 py-4">Clicks</th>
                        <th className="px-4 py-4">Share</th>
                        <th className="px-4 py-4">Change</th>
                        <th className="px-4 py-4">Last Activity</th>
                      </tr>
                    </thead>

                    <tbody>
                      {topFeatures.map((row) => {
                        const meta = getCategoryMeta(row.category);
                        const Icon = meta.icon;

                        return (
                          <tr
                            key={`${row.feature_id}-${row.rank}`}
                            className="border-b border-slate-100 transition hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-4 font-semibold text-slate-900">{row.rank}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${meta.iconClassName}`}>
                                  <Icon className="text-sm" />
                                </div>
                                <span className="font-medium text-slate-800">{row.feature_label}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{row.category}</td>
                            <td className="px-4 py-4 text-slate-700">{formatScopeLabel(row.device_labels)}</td>
                            <td className="px-4 py-4 font-semibold text-slate-900">{formatCount(row.clicks)}</td>
                            <td className="px-4 py-4 text-slate-700">{formatPercent(row.share_pct)}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1 font-semibold ${
                                  toNumber(row.change_pct, 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {toNumber(row.change_pct, 0) >= 0 ? (
                                  <FaArrowUp className="text-[10px]" />
                                ) : (
                                  <FaArrowDown className="text-[10px]" />
                                )}
                                {formatPercent(Math.abs(row.change_pct))}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-500">{formatRelativeTime(row.last_clicked_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:hidden">
                {topFeatures.map((row) => (
                  <MobileFeatureCard key={`${row.feature_id}-${row.rank}`} row={row} />
                ))}
              </div>
            </>
          )}

          <div className="border-t border-slate-200 px-4 py-4 text-center">
            <span className="text-sm font-medium text-slate-500">
              Rankings update from the live feature-click feed for {selectedDeviceLabel.toLowerCase()}.
            </span>
          </div>
        </div>

        <div className={PANEL_CLASS}>
          <div className={`${SECTION_HEADER_CLASS} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">
                Top Features by Category
              </h2>
              <FaInfoCircle className="text-sm text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">{categoryBreakdown.length} groups</p>
          </div>

          <div className="px-4 py-5">
            {!categoryBreakdown.length ? (
              <div className="flex min-h-[260px] items-center justify-center text-center text-sm text-slate-500">
                Category insights will appear once feature clicks are recorded.
              </div>
            ) : (
              <>
                <div className="mb-4 hidden grid-cols-[minmax(0,1fr)_86px_86px] gap-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:grid">
                  <span>Category</span>
                  <span className="text-right">Clicks</span>
                  <span className="text-right">% of Total</span>
                </div>

                <div className="space-y-5">
                  {categoryBreakdown.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_76px_72px] items-center gap-3 text-sm">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="text-right font-semibold text-slate-700">
                          {formatCount(item.clicks)}
                        </span>
                        <span className="text-right text-slate-500">{formatPercent(item.percent)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(8, Math.min(100, toNumber(item.percent, 0)))}%`,
                            background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className={`${PANEL_CLASS} px-4 py-4 sm:px-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
              <FaInfoCircle className="text-base" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                About Feature Clicks
              </h3>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
                Feature Clicks report now reads from the live analytics store and shows how often product feature filters are used, which categories attract the most attention, and how interest changes over the selected reporting window.
              </p>
            </div>
          </div>

          <button type="button" className={`${TEXT_LINK_CLASS} self-start lg:self-auto`} onClick={handleExport} disabled={!topFeatures.length}>
            Export live feature rankings
            <FaArrowRight className="text-xs" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default FeatureClicksReport;
