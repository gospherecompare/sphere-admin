import React, { useCallback, useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import {
  FaCalendarAlt,
  FaChartArea,
  FaChartBar,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaExclamationCircle,
  FaFilter,
  FaIndustry,
  FaLaptop,
  FaLayerGroup,
  FaMobileAlt,
  FaSignal,
  FaSpinner,
  FaSyncAlt,
  FaTags,
  FaThLarge,
  FaTimes,
  FaTv,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import {
  DATE_RANGE_OPTIONS,
  GROUP_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  buildBrandCompareRows,
  buildBrandRanking,
  buildCategoryRanking,
  buildDataQualitySummary,
  buildDateRangeFromPreset,
  buildGapHistogram,
  buildLaunchSeries,
  buildPredictionModel,
  buildSummaryStats,
  buildTypeBreakdown,
  formatGapLabel,
  formatShortDate,
  getGapTone,
  parseDateOnlyAsUtc,
  sortDevicesByLaunchDateDesc,
} from "./launchTimingUtils";

const PRODUCT_META = {
  all: {
    icon: FaLayerGroup,
    accent: "text-cyan-700",
    badge: "bg-cyan-600 text-white border-cyan-600",
    inactiveBadge: "bg-white text-cyan-700 border-cyan-200",
  },
  smartphone: {
    icon: FaMobileAlt,
    accent: "text-sky-600",
    badge: "bg-sky-600 text-white border-sky-600",
    inactiveBadge: "bg-white text-sky-700 border-sky-200",
  },
  laptop: {
    icon: FaLaptop,
    accent: "text-indigo-600",
    badge: "bg-indigo-600 text-white border-indigo-600",
    inactiveBadge: "bg-white text-indigo-700 border-indigo-200",
  },
  tv: {
    icon: FaTv,
    accent: "text-emerald-600",
    badge: "bg-emerald-600 text-white border-emerald-600",
    inactiveBadge: "bg-white text-emerald-700 border-emerald-200",
  },
};

const TIMELINE_VIEW_OPTIONS = [
  { value: "bars", label: "Bars", icon: FaChartBar },
  { value: "line", label: "Line", icon: FaChartLine },
  { value: "area", label: "Area", icon: FaChartArea },
];

const BREAKDOWN_DIMENSION_OPTIONS = [
  { value: "brand", label: "Brand", icon: FaIndustry },
  { value: "category", label: "Category", icon: FaTags },
  { value: "type", label: "Device type", icon: FaLayerGroup },
];

const BREAKDOWN_VIEW_OPTIONS = [
  { value: "bars", label: "Bars", icon: FaChartBar },
  { value: "cards", label: "Cards", icon: FaThLarge },
  { value: "share", label: "Share", icon: FaSignal },
];

const COMPARE_LIMIT = 4;

const BREAKDOWN_GRADIENTS = [
  "bg-gradient-to-r from-sky-500 to-sky-400",
  "bg-gradient-to-r from-indigo-500 to-violet-500",
  "bg-gradient-to-r from-emerald-500 to-teal-400",
  "bg-gradient-to-r from-amber-500 to-orange-400",
  "bg-gradient-to-r from-rose-500 to-pink-400",
  "bg-gradient-to-r from-cyan-500 to-blue-400",
  "bg-gradient-to-r from-fuchsia-500 to-purple-400",
  "bg-gradient-to-r from-lime-500 to-green-400",
];

const BREAKDOWN_SOLID = [
  "bg-sky-500",
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-500",
];

const formatMetricValue = (value, fallback = "N/A") => {
  if (value === null || value === undefined) return fallback;
  if (!Number.isFinite(Number(value))) return fallback;
  const numeric = Number(value);
  return Number.isInteger(numeric)
    ? numeric.toLocaleString()
    : numeric.toFixed(1);
};

const buildTimelinePoints = (series, maxValue, width, height) => {
  const paddingX = 36;
  const paddingTop = 26;
  const paddingBottom = 28;
  const usableHeight = height - paddingTop - paddingBottom;
  const baselineY = height - paddingBottom;

  return series.map((item, index) => {
    const step =
      series.length > 1 ? (width - paddingX * 2) / (series.length - 1) : 0;
    const x = series.length === 1 ? width / 2 : paddingX + index * step;
    const y = baselineY - (item.count / maxValue) * usableHeight;

    return {
      ...item,
      x,
      y,
      baselineY,
    };
  });
};

const formatDateRangeLabel = (preset, start, end) => {
  const option = DATE_RANGE_OPTIONS.find((item) => item.value === preset);
  if (preset !== "custom") return option?.label || "All time";
  if (start && end) return `${start} to ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return "Custom range";
};

const isWithinLaunchRange = (launchDateValue, startValue, endValue) => {
  if (!startValue && !endValue) return true;

  const launchDate = parseDateOnlyAsUtc(launchDateValue);
  if (!launchDate) return false;

  const startDate = startValue ? parseDateOnlyAsUtc(startValue) : null;
  const endDate = endValue ? parseDateOnlyAsUtc(endValue) : null;

  if (startDate && launchDate.getTime() < startDate.getTime()) return false;
  if (endDate && launchDate.getTime() > endDate.getTime()) return false;
  return true;
};

const getIssueTone = (issue) => {
  const text = String(issue || "").toLowerCase();
  if (text.includes("negative") || text.includes("before launch")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (text.includes("missing")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (text.includes("gap")) {
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const toCsvCell = (value) => {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildCsvContent = (rows = []) => {
  const header = [
    "product_id",
    "product_type",
    "brand_name",
    "category",
    "product_name",
    "launch_date",
    "sale_start_date",
    "sale_gap_days",
    "quality_flags",
  ];

  const lines = [header.join(",")];
  for (const row of rows) {
    const qualityFlags = [];
    if (!row?.launch_date) qualityFlags.push("Missing launch date");
    if (!row?.sale_start_date) qualityFlags.push("Missing sale date");
    if (Number(row?.sale_gap_days) < 0) qualityFlags.push("Sale before launch");
    if (Number(row?.sale_gap_days) >= 120) qualityFlags.push("120+ day gap");

    lines.push(
      [
        row?.product_id,
        row?.product_type,
        row?.brand_name,
        row?.category,
        row?.product_name,
        row?.launch_date,
        row?.sale_start_date,
        row?.sale_gap_days,
        qualityFlags.join(" | "),
      ]
        .map(toCsvCell)
        .join(","),
    );
  }

  return lines.join("\n");
};

const downloadCsv = (csv, filename) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

const SelectionGroup = ({
  options,
  value,
  onChange,
  activeClass = "border-sky-600 bg-sky-600 text-white",
  inactiveClass = "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => {
      const Icon = option.icon;
      const isActive = option.value === value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
            isActive ? activeClass : inactiveClass
          }`}
        >
          {Icon ? <Icon className="text-sm" /> : null}
          {option.label}
        </button>
      );
    })}
  </div>
);

const StatCard = ({
  icon: Icon,
  label,
  value,
  helper,
  tone = "slate",
  suffix = "",
}) => {
  const toneClasses =
    tone === "sky"
      ? "bg-sky-50 border-sky-200 text-sky-700"
      : tone === "emerald"
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : tone === "indigo"
          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
          : tone === "amber"
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : tone === "rose"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : tone === "cyan"
                ? "bg-cyan-50 border-cyan-200 text-cyan-700"
                : "bg-slate-50 border-slate-200 text-slate-700";

  const numericValue = Number(value);
  const canAnimate = Number.isFinite(numericValue);

  return (
    <div className="ui-stat-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 truncate text-3xl font-bold tracking-tight text-slate-900">
            {canAnimate ? (
              <CountUp
                end={numericValue}
                duration={1}
                decimals={Number.isInteger(numericValue) ? 0 : 1}
              />
            ) : (
              value
            )}
            {canAnimate && suffix ? (
              <span className="ml-1 text-lg text-slate-500">{suffix}</span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${toneClasses}`}
        >
          <Icon className="text-lg" />
        </div>
      </div>
    </div>
  );
};

const TimelineChart = ({ series, maxValue, view }) => {
  if (!series.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
        <p className="font-medium text-slate-700">
          No launch dates found for this filter
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Adjust the date range or add launch dates to unlock the timeline view.
        </p>
      </div>
    );
  }

  if (view === "bars") {
    return (
      <div className="overflow-x-auto pb-2">
        <div
          className="flex items-end gap-3"
          style={{ minWidth: `${Math.max(series.length * 82, 680)}px` }}
        >
          {series.map((item) => (
            <div
              key={item.key}
              className="flex min-w-[72px] flex-1 flex-col items-center gap-3"
            >
              <div className="flex h-56 w-full items-end">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-b from-sky-400 via-sky-500 to-indigo-600 shadow-[0_12px_24px_rgba(14,165,233,0.18)]"
                  style={{
                    height: `${Math.max((item.count / maxValue) * 100, 8)}%`,
                  }}
                />
              </div>

              <div className="text-center">
                <p className="text-base font-semibold text-slate-900">
                  {item.count}
                </p>
                <p className="text-[11px] text-slate-500">{item.shortLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const width = Math.max(series.length * 92, 700);
  const height = 280;
  const points = buildTimelinePoints(series, maxValue, width, height);
  const baselineY = points[0]?.baselineY || height - 28;
  const linePath = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
  const areaPath = points.length
    ? [
        `M ${points[0].x.toFixed(2)} ${baselineY.toFixed(2)}`,
        ...points.map(
          (point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
        ),
        `L ${points[points.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)}`,
        "Z",
      ].join(" ")
    : "";

  return (
    <div className="overflow-x-auto pb-2">
      <div style={{ minWidth: `${width}px` }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label="Launch timing chart"
        >
          <defs>
            <linearGradient id="launch-timing-area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = baselineY - tick * (baselineY - 26);
            return (
              <line
                key={tick}
                x1="24"
                y1={y}
                x2={width - 24}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
            );
          })}

          {view === "area" ? (
            <path d={areaPath} fill="url(#launch-timing-area-fill)" />
          ) : null}

          <path
            d={linePath}
            fill="none"
            stroke={view === "area" ? "#4f46e5" : "#0ea5e9"}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((point) => (
            <g key={point.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#ffffff"
                stroke={view === "area" ? "#4f46e5" : "#0ea5e9"}
                strokeWidth="3"
              />
              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                className="fill-slate-500 text-[11px] font-semibold"
              >
                {point.count}
              </text>
            </g>
          ))}
        </svg>

        <div
          className="mt-4 grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))`,
          }}
        >
          {series.map((item) => (
            <div key={item.key} className="text-center">
              <p className="text-sm font-semibold text-slate-900">{item.count}</p>
              <p className="text-[11px] text-slate-500">{item.shortLabel}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LaunchTimingReport = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [deviceType, setDeviceType] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("month");
  const [timelineView, setTimelineView] = useState("bars");
  const [breakdownDimension, setBreakdownDimension] = useState("brand");
  const [breakdownView, setBreakdownView] = useState("bars");
  const [datePreset, setDatePreset] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [compareBrands, setCompareBrands] = useState([]);

  const showToast = useCallback((title, message, type = "success") => {
    const id = Date.now() + Math.random();
    const nextToast = { id, title, message, type };

    setToasts((previous) => [...previous, nextToast]);

    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const response = await fetch(buildUrl("/api/reports/launch-timing"), {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const rows = Array.isArray(data?.devices) ? data.devices : [];

      setDevices(rows);
      showToast("Success", "Launch timing report loaded successfully", "success");
    } catch (err) {
      console.error("Failed to load launch timing report:", err);
      setError(err?.message || "Failed to load launch timing report");
      showToast("Error", "Unable to load launch timing report", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const deviceScopedDevices = useMemo(() => {
    if (deviceType === "all") return devices;
    return devices.filter((device) => device?.product_type === deviceType);
  }, [deviceType, devices]);

  const resolvedDateRange = useMemo(() => {
    if (datePreset === "custom") {
      return {
        start: customStartDate,
        end: customEndDate,
      };
    }

    return buildDateRangeFromPreset(datePreset);
  }, [customEndDate, customStartDate, datePreset]);

  const dateScopedDevices = useMemo(
    () =>
      deviceScopedDevices.filter((device) =>
        isWithinLaunchRange(
          device?.launch_date,
          resolvedDateRange.start,
          resolvedDateRange.end,
        ),
      ),
    [deviceScopedDevices, resolvedDateRange.end, resolvedDateRange.start],
  );

  const brandOptions = useMemo(() => {
    const uniqueBrands = Array.from(
      new Set(
        deviceScopedDevices.map(
          (device) => String(device?.brand_name || "Unknown").trim() || "Unknown",
        ),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return uniqueBrands.map((brand) => ({
      value: brand,
      label: brand,
    }));
  }, [deviceScopedDevices]);

  useEffect(() => {
    if (
      brandFilter !== "all" &&
      !brandOptions.some((option) => option.value === brandFilter)
    ) {
      setBrandFilter("all");
    }
  }, [brandFilter, brandOptions]);

  const filteredDevices = useMemo(() => {
    if (brandFilter === "all") return dateScopedDevices;
    return dateScopedDevices.filter(
      (device) =>
        (String(device?.brand_name || "Unknown").trim() || "Unknown") ===
        brandFilter,
    );
  }, [brandFilter, dateScopedDevices]);

  const qualityScopeDevices = useMemo(() => {
    if (brandFilter === "all") return deviceScopedDevices;
    return deviceScopedDevices.filter(
      (device) =>
        (String(device?.brand_name || "Unknown").trim() || "Unknown") ===
        brandFilter,
    );
  }, [brandFilter, deviceScopedDevices]);

  const compareBrandOptions = useMemo(
    () =>
      Array.from(
        new Set(
          dateScopedDevices.map(
            (device) =>
              String(device?.brand_name || "Unknown").trim() || "Unknown",
          ),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [dateScopedDevices],
  );

  const dateScopedBrandRanking = useMemo(
    () => buildBrandRanking(dateScopedDevices, 8),
    [dateScopedDevices],
  );

  useEffect(() => {
    const available = new Set(compareBrandOptions);

    setCompareBrands((previous) => {
      const sanitized = previous.filter((brand) => available.has(brand)).slice(0, COMPARE_LIMIT);
      if (sanitized.length) return sanitized;

      return dateScopedBrandRanking
        .slice(0, Math.min(COMPARE_LIMIT, 4))
        .map((row) => row.label);
    });
  }, [compareBrandOptions, dateScopedBrandRanking]);

  const handleCompareBrandToggle = useCallback(
    (brand) => {
      setCompareBrands((previous) => {
        if (previous.includes(brand)) {
          return previous.filter((item) => item !== brand);
        }

        if (previous.length >= COMPARE_LIMIT) {
          showToast(
            "Brand compare limit",
            `Select up to ${COMPARE_LIMIT} brands at once.`,
            "error",
          );
          return previous;
        }

        return [...previous, brand];
      });
    },
    [showToast],
  );

  const handleExport = useCallback(() => {
    const csv = buildCsvContent(filteredDevices);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const deviceLabel = deviceType === "all" ? "all-devices" : deviceType;
    const brandLabel =
      brandFilter === "all"
        ? "all-brands"
        : brandFilter.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const rangeLabel =
      datePreset === "custom"
        ? "custom-range"
        : datePreset.replace(/[^a-z0-9]+/g, "-");

    downloadCsv(
      csv,
      `launch-timing-${deviceLabel}-${brandLabel}-${rangeLabel}-${dateStamp}.csv`,
    );
    showToast("Export ready", `${filteredDevices.length} rows exported`, "success");
  }, [brandFilter, datePreset, deviceType, filteredDevices, showToast]);

  const scopeBrandCount = useMemo(
    () =>
      new Set(
        filteredDevices.map(
          (device) => String(device?.brand_name || "Unknown").trim() || "Unknown",
        ),
      ).size,
    [filteredDevices],
  );

  const summary = useMemo(
    () => buildSummaryStats(filteredDevices),
    [filteredDevices],
  );

  const launchSeries = useMemo(() => {
    const series = buildLaunchSeries(filteredDevices, groupBy);
    return groupBy === "year" ? series : series.slice(-12);
  }, [filteredDevices, groupBy]);

  const maxLaunchCount = useMemo(
    () => Math.max(...launchSeries.map((item) => item.count), 1),
    [launchSeries],
  );

  const gapHistogram = useMemo(
    () => buildGapHistogram(filteredDevices),
    [filteredDevices],
  );

  const maxHistogramCount = useMemo(
    () => Math.max(...gapHistogram.map((item) => item.count), 1),
    [gapHistogram],
  );

  const prediction = useMemo(
    () => buildPredictionModel(filteredDevices),
    [filteredDevices],
  );

  const topBrands = useMemo(
    () => buildBrandRanking(filteredDevices, 8),
    [filteredDevices],
  );

  const topCategories = useMemo(
    () => buildCategoryRanking(filteredDevices, 8),
    [filteredDevices],
  );

  const typeBreakdown = useMemo(
    () => buildTypeBreakdown(filteredDevices),
    [filteredDevices],
  );

  const brandCompareRows = useMemo(
    () => buildBrandCompareRows(dateScopedDevices, compareBrands),
    [compareBrands, dateScopedDevices],
  );

  const dataQuality = useMemo(
    () => buildDataQualitySummary(qualityScopeDevices),
    [qualityScopeDevices],
  );

  const breakdownRows = useMemo(() => {
    if (breakdownDimension === "category") {
      return topCategories.map((row) => ({
        key: row.label,
        label: row.label,
        count: row.count,
        avgGapDays: row.avgGapDays,
        saleCoverage: row.saleCoverage,
      }));
    }

    if (breakdownDimension === "type") {
      return typeBreakdown.map((row) => ({
        key: row.productType,
        label:
          PRODUCT_TYPE_OPTIONS.find((option) => option.value === row.productType)
            ?.label || row.productType,
        count: row.count,
        avgGapDays: row.avgGapDays,
        saleCoverage: row.saleCoverage,
      }));
    }

    return topBrands.map((row) => ({
      key: row.label,
      label: row.label,
      count: row.count,
      avgGapDays: row.avgGapDays,
      saleCoverage: row.saleCoverage,
    }));
  }, [breakdownDimension, topBrands, topCategories, typeBreakdown]);

  const maxBreakdownCount = useMemo(
    () => Math.max(...breakdownRows.map((row) => row.count), 1),
    [breakdownRows],
  );

  const totalBreakdownCount = useMemo(
    () => breakdownRows.reduce((sum, row) => sum + row.count, 0),
    [breakdownRows],
  );

  const topBrand = topBrands[0] || null;
  const latestDevices = useMemo(
    () => sortDevicesByLaunchDateDesc(filteredDevices).slice(0, 10),
    [filteredDevices],
  );
  const activeMeta = PRODUCT_META[deviceType] || PRODUCT_META.all;
  const breakdownMeta = useMemo(
    () =>
      BREAKDOWN_DIMENSION_OPTIONS.find(
        (option) => option.value === breakdownDimension,
      ) || BREAKDOWN_DIMENSION_OPTIONS[0],
    [breakdownDimension],
  );

  const renderBreakdownContent = () => {
    if (!breakdownRows.length) {
      return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <p className="font-medium text-slate-700">No breakdown data found</p>
          <p className="mt-1 text-sm text-slate-500">
            Add more tagged devices to populate this section.
          </p>
        </div>
      );
    }

    if (breakdownView === "cards") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {breakdownRows.map((row, index) => (
            <div
              key={row.key}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {row.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Sale coverage {row.saleCoverage}%
                  </p>
                </div>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                    BREAKDOWN_SOLID[index % BREAKDOWN_SOLID.length]
                  }`}
                >
                  {index + 1}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Count
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {row.count}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Avg gap
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {row.avgGapDays === null
                      ? "N/A"
                      : `${formatMetricValue(row.avgGapDays)}d`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (breakdownView === "share") {
      return (
        <div>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
            {breakdownRows.map((row, index) => (
              <div
                key={row.key}
                className={BREAKDOWN_SOLID[index % BREAKDOWN_SOLID.length]}
                style={{
                  width: `${Math.max(
                    (row.count / totalBreakdownCount) * 100,
                    row.count ? 4 : 0,
                  )}%`,
                }}
              />
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {breakdownRows.map((row, index) => {
              const share = totalBreakdownCount
                ? Math.round((row.count / totalBreakdownCount) * 100)
                : 0;

              return (
                <div key={row.key} className="flex items-start gap-3">
                  <span
                    className={`mt-1 inline-flex h-3 w-3 rounded-full ${
                      BREAKDOWN_SOLID[index % BREAKDOWN_SOLID.length]
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {row.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {share}%
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.count} devices | Sale coverage {row.saleCoverage}% |
                      Avg gap{" "}
                      {row.avgGapDays === null
                        ? "N/A"
                        : `${formatMetricValue(row.avgGapDays)}d`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {breakdownRows.map((row, index) => (
          <div key={row.key}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-700">{row.label}</p>
                <p className="text-xs text-slate-500">
                  Sale coverage {row.saleCoverage}% | Avg gap{" "}
                  {row.avgGapDays === null
                    ? "N/A"
                    : `${formatMetricValue(row.avgGapDays)}d`}
                </p>
              </div>
              <span className="font-semibold text-slate-900">{row.count}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  BREAKDOWN_GRADIENTS[index % BREAKDOWN_GRADIENTS.length]
                }`}
                style={{
                  width: `${Math.max((row.count / maxBreakdownCount) * 100, 10)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-shell page-stack py-2 sm:py-3">
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white p-4 shadow-lg ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            {toast.type === "success" ? (
              <FaCheckCircle className="mt-0.5 text-emerald-500" />
            ) : (
              <FaExclamationCircle className="mt-0.5 text-rose-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 transition hover:text-slate-600"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      <section className="ui-form-shell overflow-hidden">
        <div className="ui-form-header px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="page-kicker">Reports</p>
              <h1 className="page-title mt-2">Launch Timing Report</h1>
              <p className="page-copy mt-3">
                Track launch volume across year, month, and week, compare brands
                side by side, export the visible dataset, and surface timing data
                quality issues before they affect the rest of the dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={!filteredDevices.length}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaDownload className="text-sm" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={fetchReportData}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} />
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-500">
                Device family
              </p>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TYPE_OPTIONS.map((option) => {
                  const meta = PRODUCT_META[option.value] || PRODUCT_META.all;
                  const Icon = meta.icon;
                  const isActive = option.value === deviceType;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDeviceType(option.value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isActive ? meta.badge : meta.inactiveBadge
                      }`}
                    >
                      <Icon className="text-sm" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-500">
                Launch date range
              </p>
              <SelectionGroup
                options={DATE_RANGE_OPTIONS}
                value={datePreset}
                onChange={setDatePreset}
                activeClass="border-indigo-600 bg-indigo-600 text-white"
              />
            </div>

            {datePreset === "custom" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 inline-block text-sm font-medium text-slate-500">
                    Start date
                  </span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 inline-block text-sm font-medium text-slate-500">
                    End date
                  </span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className={`text-sm font-semibold ${activeMeta.accent}`}>
                  Current scope
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {[
                    PRODUCT_TYPE_OPTIONS.find((option) => option.value === deviceType)
                      ?.label || "All devices",
                    brandFilter === "all" ? "All brands" : brandFilter,
                    formatDateRangeLabel(
                      datePreset,
                      resolvedDateRange.start,
                      resolvedDateRange.end,
                    ),
                  ].join(" | ")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {filteredDevices.length} visible devices in the report after
                  filters.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                  <FaFilter className="text-xs" />
                  Brand filter
                </span>
                <select
                  value={brandFilter}
                  onChange={(event) => setBrandFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="all">All brands</option>
                  {brandOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="ui-form-shell px-4 py-14 text-center sm:px-6">
          <div className="flex flex-col items-center justify-center">
            <FaSpinner className="mb-4 animate-spin text-3xl text-sky-500" />
            <p className="font-semibold text-slate-800">
              Loading launch timing analytics...
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Pulling launch dates, sale dates, brand data, and historical timing
              windows.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="ui-stat-grid">
            <StatCard
              icon={FaLayerGroup}
              label="Tracked devices"
              value={summary.totalDevices}
              helper="Devices included after the current filters"
              tone="slate"
            />
            <StatCard
              icon={FaIndustry}
              label="Brands in scope"
              value={scopeBrandCount}
              helper="Unique brands in the visible result set"
              tone="cyan"
            />
            <StatCard
              icon={FaTags}
              label="Top brand"
              value={topBrand?.label || "N/A"}
              helper={
                topBrand
                  ? `${topBrand.count} devices, ${topBrand.saleCoverage}% sale coverage`
                  : "No brand data available in this scope"
              }
              tone="sky"
            />
            <StatCard
              icon={FaCalendarAlt}
              label="Launch records"
              value={summary.launchedDevices}
              helper="Devices with a usable launch date"
              tone="sky"
            />
            <StatCard
              icon={FaSignal}
              label="Sale records"
              value={summary.saleTaggedDevices}
              helper="Devices with a usable sale start date"
              tone="emerald"
            />
            <StatCard
              icon={FaClock}
              label="Average gap"
              value={
                summary.avgGapDays === null
                  ? "N/A"
                  : formatMetricValue(summary.avgGapDays)
              }
              helper="Average days from launch to first sale"
              tone="indigo"
              suffix={summary.avgGapDays === null ? "" : "days"}
            />
            <StatCard
              icon={FaClock}
              label="Minimum gap"
              value={
                summary.minGapDays === null
                  ? "N/A"
                  : formatMetricValue(summary.minGapDays)
              }
              helper="Smallest launch-to-sale difference in the sample"
              tone="amber"
              suffix={summary.minGapDays === null ? "" : "days"}
            />
            <StatCard
              icon={FaChartLine}
              label="Maximum gap"
              value={
                summary.maxGapDays === null
                  ? "N/A"
                  : formatMetricValue(summary.maxGapDays)
              }
              helper="Largest launch-to-sale difference in the sample"
              tone="rose"
              suffix={summary.maxGapDays === null ? "" : "days"}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
            <section className="ui-form-shell overflow-hidden">
              <div className="ui-form-header px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Launch volume by {groupBy}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        How many devices were launched in each selected time bucket.
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      {launchSeries.length} periods
                    </span>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">
                      Chart type
                    </p>
                    <SelectionGroup
                      options={TIMELINE_VIEW_OPTIONS}
                      value={timelineView}
                      onChange={setTimelineView}
                      activeClass="border-sky-600 bg-sky-600 text-white"
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">
                      Grouping
                    </p>
                    <SelectionGroup
                      options={GROUP_OPTIONS}
                      value={groupBy}
                      onChange={setGroupBy}
                      activeClass="border-indigo-600 bg-indigo-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 py-5 sm:px-6">
                <TimelineChart
                  series={launchSeries}
                  maxValue={maxLaunchCount}
                  view={timelineView}
                />
              </div>
            </section>

            <section className="ui-form-shell overflow-hidden">
              <div className="ui-form-header px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Prediction window
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Historical probability that sale starts by a target window.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    Sample {prediction?.sampleSize || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-5 px-4 py-5 sm:px-6">
                {prediction ? (
                  <>
                    {[
                      {
                        label: "By launch day",
                        value: prediction.withinLaunchDay,
                        color: "bg-amber-500",
                      },
                      {
                        label: "Within 7 days",
                        value: prediction.within7Days,
                        color: "bg-sky-500",
                      },
                      {
                        label: "Within 30 days",
                        value: prediction.within30Days,
                        color: "bg-indigo-500",
                      },
                      {
                        label: "Within 60 days",
                        value: prediction.within60Days,
                        color: "bg-emerald-500",
                      },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {row.label}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {row.value}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${row.color}`}
                            style={{ width: `${row.value}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className={`text-sm font-semibold ${activeMeta.accent}`}>
                        Most common timing window
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {prediction.strongestBucket?.label || "N/A"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Median launch-to-sale gap is{" "}
                        <span className="font-semibold text-slate-900">
                          {formatMetricValue(prediction.medianGapDays)}
                        </span>{" "}
                        days, and 75% of the sample lands within{" "}
                        <span className="font-semibold text-slate-900">
                          {formatMetricValue(prediction.upperQuartileGapDays)}
                        </span>{" "}
                        days.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                    <p className="font-medium text-slate-700">
                      Not enough launch-to-sale pairs yet
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Add sale start dates to devices to generate probability ranges.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <section className="ui-form-shell overflow-hidden">
              <div className="ui-form-header px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Launch to sale distribution
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Frequency of devices grouped by launch-to-sale delay bucket.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {summary.comparableDevices} comparable devices
                  </span>
                </div>
              </div>

              <div className="space-y-4 px-4 py-5 sm:px-6">
                {gapHistogram.map((bucket, index) => (
                  <div key={bucket.key}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {bucket.label}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {bucket.count}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          BREAKDOWN_GRADIENTS[index % BREAKDOWN_GRADIENTS.length]
                        }`}
                        style={{
                          width: `${Math.max(
                            (bucket.count / maxHistogramCount) * 100,
                            bucket.count ? 8 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="ui-form-shell overflow-hidden">
              <div className="ui-form-header px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Statistical breakdown
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Switch between brand-wise, category-wise, and device-type
                        comparisons with different graph styles.
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      {breakdownRows.length} rows
                    </span>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">
                      Breakdown by
                    </p>
                    <SelectionGroup
                      options={BREAKDOWN_DIMENSION_OPTIONS}
                      value={breakdownDimension}
                      onChange={setBreakdownDimension}
                      activeClass="border-emerald-600 bg-emerald-600 text-white"
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">
                      Graph style
                    </p>
                    <SelectionGroup
                      options={BREAKDOWN_VIEW_OPTIONS}
                      value={breakdownView}
                      onChange={setBreakdownView}
                      activeClass="border-indigo-600 bg-indigo-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 py-5 sm:px-6">
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className={`text-sm font-semibold ${activeMeta.accent}`}>
                    Active breakdown
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {breakdownMeta.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    The current scope includes{" "}
                    <span className="font-semibold text-slate-900">
                      {summary.totalDevices}
                    </span>{" "}
                    devices across{" "}
                    <span className="font-semibold text-slate-900">
                      {breakdownRows.length}
                    </span>{" "}
                    visible {breakdownMeta.label.toLowerCase()} rows.
                  </p>
                </div>

                {renderBreakdownContent()}
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <section className="ui-form-shell overflow-hidden">
              <div className="ui-form-header px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Brand compare mode
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Compare up to {COMPARE_LIMIT} brands inside the current
                        device family and date range.
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      {compareBrands.length} selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {compareBrandOptions.length ? (
                      compareBrandOptions.map((brand) => {
                        const active = compareBrands.includes(brand);
                        return (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => handleCompareBrandToggle(brand)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                              active
                                ? "border-cyan-600 bg-cyan-600 text-white"
                                : "border-cyan-200 bg-white text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50"
                            }`}
                          >
                            {brand}
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        No brand options available for this date scope.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-4 py-5 sm:px-6">
                {brandCompareRows.length ? (
                  brandCompareRows.map((row, index) => (
                    <div
                      key={row.brand}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${
                                BREAKDOWN_SOLID[index % BREAKDOWN_SOLID.length]
                              }`}
                            >
                              {index + 1}
                            </span>
                            <div>
                              <p className="truncate text-base font-semibold text-slate-900">
                                {row.brand}
                              </p>
                              <p className="text-xs text-slate-500">
                                {row.count} devices in compare scope
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {row.saleCoverage}% sale coverage
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Average
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {row.avgGapDays === null
                              ? "N/A"
                              : `${formatMetricValue(row.avgGapDays)}d`}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Median
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {row.medianGapDays === null
                              ? "N/A"
                              : `${formatMetricValue(row.medianGapDays)}d`}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Min / Max
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {row.minGapDays === null
                              ? "N/A"
                              : `${formatMetricValue(row.minGapDays)}d`}
                            {row.maxGapDays === null
                              ? ""
                              : ` / ${formatMetricValue(row.maxGapDays)}d`}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Within 30 days
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {row.within30DaysRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                    <p className="font-medium text-slate-700">
                      Select brands to compare
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Compare mode uses the current device family and date range,
                      but it stays independent from the single brand filter above.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="ui-form-shell overflow-hidden">
              <div className="ui-form-header px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Data quality panel
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Quality checks stay on the selected device family and brand
                      scope, even when the date filter hides rows with missing launch dates.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {dataQuality.flaggedDevicesCount} flagged
                  </span>
                </div>
              </div>

              <div className="space-y-5 px-4 py-5 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {dataQuality.issueCards.map((item, index) => (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.helper}
                          </p>
                        </div>
                        <span
                          className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full px-2 text-xs font-bold text-white ${
                            BREAKDOWN_SOLID[index % BREAKDOWN_SOLID.length]
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {dataQuality.flaggedRows.length ? (
                  <div className="space-y-3">
                    {dataQuality.flaggedRows.map((device) => (
                      <div
                        key={`${device.product_type}-${device.product_id}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {device.product_name}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {[device.brand_name || "Unknown", device.category || "Uncategorized", device.product_type]
                                .filter(Boolean)
                                .join(" | ")}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {device.issues.map((issue) => (
                              <span
                                key={`${device.product_id}-${issue}`}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getIssueTone(
                                  issue,
                                )}`}
                              >
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              Launch
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {formatShortDate(device.launch_date)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              Sale
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {formatShortDate(device.sale_start_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                    <p className="font-medium text-slate-700">
                      No major quality issues detected
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      The selected device and brand scope looks clean right now.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="ui-form-shell overflow-hidden">
            <div className="ui-form-header px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Launch to sale tracker
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest devices in the selected filter with their launch and sale timing.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  Showing {latestDevices.length}
                </span>
              </div>
            </div>

            <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 xl:grid-cols-3">
              {latestDevices.length ? (
                latestDevices.map((device) => {
                  const meta = PRODUCT_META[device.product_type] || PRODUCT_META.all;
                  const Icon = meta.icon;

                  return (
                    <article
                      key={`${device.product_type}-${device.product_id}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-50 ${meta.accent}`}
                            >
                              <Icon className="text-sm" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {device.product_name}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {[device.brand_name, device.category]
                                  .filter(Boolean)
                                  .join(" | ")}
                              </p>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getGapTone(
                            device.sale_gap_days,
                          )}`}
                        >
                          {formatGapLabel(device.sale_gap_days)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Launch
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatShortDate(device.launch_date)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Sale
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatShortDate(device.sale_start_date)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <p className="font-medium text-slate-700">
                    No device timing rows found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Change the filters or widen the date range to populate this tracker.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default LaunchTimingReport;
