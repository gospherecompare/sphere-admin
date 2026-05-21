import React, { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaArrowUp,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaChevronDown,
  FaEllipsisH,
  FaEye,
  FaImage,
  FaInfoCircle,
  FaListAlt,
  FaPenNib,
  FaPlus,
  FaSearch,
  FaShoppingBag,
  FaSpinner,
  FaSyncAlt,
  FaUpload,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../api";
import { getCurrentPermissions, hasAnyPermissions } from "../utils/access";

const cardPalettes = [
  "bg-blue-50 text-blue-600",
  "bg-violet-50 text-violet-600",
  "bg-orange-50 text-orange-500",
  "bg-emerald-50 text-emerald-600",
  "bg-indigo-50 text-indigo-600",
  "bg-cyan-50 text-cyan-600",
];

const gradientPalettes = [
  "from-amber-400 to-orange-500",
  "from-orange-400 to-rose-500",
  "from-red-400 to-pink-500",
  "from-indigo-400 to-violet-500",
  "from-sky-500 to-blue-500",
  "from-emerald-400 to-teal-500",
];

const parseNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const parseCount = (value) => Math.max(0, Math.round(parseNumber(value, 0)));

const formatCompact = (value) =>
  Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(parseNumber(value, 0));

const formatNumber = (value, options = {}) =>
  Intl.NumberFormat("en-IN", {
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  }).format(parseNumber(value, 0));

const getProgressWidth = (value) =>
  `${Math.min(100, Math.max(0, parseNumber(value, 0)))}%`;

const getInitials = (name) =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "--";

const normalizeText = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return "Date unavailable";
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatTimeAgo = (value) => {
  const date = toDate(value);
  if (!date) return "recently";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds || 1}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
};

const daysUntil = (value) => {
  const date = toDate(value);
  if (!date) return null;
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
};

const getTrendDelta = (series) => {
  if (!Array.isArray(series) || series.length < 2) return null;
  const first = parseNumber(series[0], 0);
  const last = parseNumber(series[series.length - 1], 0);
  if (first <= 0 && last <= 0) return null;
  if (first <= 0) return 100;
  return ((last - first) / first) * 100;
};

const formatDelta = (delta) => {
  if (!Number.isFinite(delta)) return "Live";
  return `${delta >= 0 ? "+" : "-"}${Math.abs(delta).toFixed(1)}%`;
};

const buildLinePath = (values, width, height, padding) => {
  if (!Array.isArray(values) || values.length === 0) return "";

  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x =
        padding +
        (values.length === 1 ? usableWidth / 2 : (usableWidth / (values.length - 1)) * index);
      const normalized = (value - minValue) / (maxValue - minValue || 1);
      const y = height - padding - normalized * usableHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const getRows = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const requestJson = async (path, { auth = false } = {}) => {
  const token = getAuthToken();
  const response = await fetch(buildUrl(path), {
    headers:
      auth && token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : undefined,
  });

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }

  return response.json();
};

const SectionCard = ({ className = "", children }) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-5 ${className}`}
  >
    {children}
  </div>
);

const EmptyState = ({ label }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

const SummaryCard = ({ icon: Icon, iconWrapClass, title, value, delta, helper }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
    <div className="flex items-start gap-3">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconWrapClass}`}>
        <Icon className="text-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-[1.7rem] font-bold tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-slate-500">
          <span
            className={`font-semibold ${
              Number.isFinite(delta) && delta < 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {Number.isFinite(delta)
              ? `${delta >= 0 ? "up" : "down"} ${formatDelta(delta)}`
              : "Live"}
          </span>{" "}
          {helper}
        </p>
      </div>
    </div>
  </div>
);

const DesktopPerformanceChart = ({ labels, publishedSeries, draftSeries }) => {
  const width = 760;
  const height = 250;
  const padding = 24;
  const publishedPath = buildLinePath(publishedSeries, width, height, padding);
  const draftPath = buildLinePath(draftSeries, width, height, padding);
  const maxValue = Math.max(...publishedSeries, ...draftSeries, 1);
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) =>
    formatCompact(Math.round(maxValue * ratio)),
  );

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#345CFF]" />
          Published Activity
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#9A46FF]" />
          Draft Activity
        </span>
        <span className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
          Last 7 Days <FaChevronDown className="text-[10px]" />
        </span>
      </div>

      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
        <div className="min-w-[620px]">
          <svg viewBox={`0 0 ${width} ${height + 34}`} className="h-[250px] w-full">
            {[0, 1, 2, 3, 4].map((row) => {
              const y = padding + ((height - padding * 2) / 4) * row;
              return (
                <g key={row}>
                  <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#E7EAF4" strokeWidth="1" />
                  <text x="0" y={y + 4} fontSize="11" fill="#94A3B8">
                    {yLabels[4 - row]}
                  </text>
                </g>
              );
            })}

            <path d={publishedPath} fill="none" stroke="#345CFF" strokeWidth="3" strokeLinecap="round" />
            <path d={draftPath} fill="none" stroke="#9A46FF" strokeWidth="3" strokeLinecap="round" />

            {labels.map((label, index) => {
              const usableWidth = width - padding * 2;
              const usableHeight = height - padding * 2;
              const x = padding + (usableWidth / Math.max(labels.length - 1, 1)) * index;
              const publishedY =
                height - padding - (parseNumber(publishedSeries[index], 0) / maxValue) * usableHeight;
              const draftY =
                height - padding - (parseNumber(draftSeries[index], 0) / maxValue) * usableHeight;

              return (
                <g key={label}>
                  <circle cx={x} cy={publishedY} r="4" fill="#345CFF" />
                  <circle cx={x} cy={draftY} r="4" fill="#9A46FF" />
                  <text x={x} y={height + 20} textAnchor="middle" fontSize="11" fill="#64748B">
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const userName = Cookies.get("userName") || Cookies.get("username") || "Admin";
  const firstName = String(userName).split(" ")[0] || "Admin";
  const currentPermissions = useMemo(() => getCurrentPermissions(), []);
  const [payloads, setPayloads] = useState({
    publishStatus: [],
    recentActivity: [],
    launchDevices: [],
    trending: [],
    searchDevices: [],
    featureClicks: [],
    comparePages: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errors, setErrors] = useState([]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    const endpoints = [
      ["publishStatus", "/api/reports/publish-status", true, ["publish_by_type"]],
      ["recentActivity", "/api/reports/recent-publish-activity", true, ["recent_publish_activity"]],
      ["launchDevices", "/api/reports/launch-timing", true, ["devices"]],
      ["trending", "/api/public/trending/all?limit=12", false, ["trending"]],
      ["searchDevices", "/api/public/search-popularity?limit=8", false, ["devices"]],
      [
        "featureClicks",
        "/api/public/popular-features?deviceType=smartphone&days=7&limit=8",
        false,
        ["results"],
      ],
      ["comparePages", "/api/admin/compare-pages?limit=100", true, ["pages"]],
      ["categories", "/api/reports/products-by-category", true, ["totals"]],
    ];

    const settled = await Promise.allSettled(
      endpoints.map(async ([key, path, auth, rowKeys]) => {
        const payload = await requestJson(path, { auth });
        return [key, getRows(payload, rowKeys), payload];
      }),
    );

    const nextPayloads = {
      publishStatus: [],
      recentActivity: [],
      launchDevices: [],
      trending: [],
      searchDevices: [],
      featureClicks: [],
      comparePages: [],
      categories: [],
    };
    const nextErrors = [];
    let latestUpdatedAt = new Date().toISOString();

    settled.forEach((result, index) => {
      const [key, path] = endpoints[index];
      if (result.status === "fulfilled") {
        nextPayloads[key] = result.value[1];
        latestUpdatedAt =
          result.value[2]?.updated_at ||
          result.value[2]?.generated_at ||
          result.value[2]?.calculated_at ||
          latestUpdatedAt;
      } else {
        nextErrors.push(`${path}: ${result.reason?.message || "failed"}`);
      }
    });

    setPayloads(nextPayloads);
    setErrors(nextErrors);
    setLastUpdated(latestUpdatedAt);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const dashboard = useMemo(() => {
    const publishTotals = payloads.publishStatus.reduce(
      (acc, row) => {
        acc.total += parseCount(row.total);
        acc.published += parseCount(row.published);
        acc.drafts += parseCount(row.drafts);
        return acc;
      },
      { total: 0, published: 0, drafts: 0 },
    );
    const publishHealth = publishTotals.total
      ? Math.round((publishTotals.published / publishTotals.total) * 100)
      : 0;

    const today = startOfDay(new Date());
    const upcomingLaunches = payloads.launchDevices
      .filter((device) => {
        const launchDate = toDate(device.launch_date);
        return launchDate && startOfDay(launchDate) >= today;
      })
      .sort((left, right) => toDate(left.launch_date) - toDate(right.launch_date));

    const recentPublished = payloads.recentActivity.filter((item) => item.is_published);
    const activeEditors = new Set(
      payloads.recentActivity
        .map((item) => normalizeText(item.user_name, item.email, item.published_by))
        .filter(Boolean),
    ).size;

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = startOfDay(new Date());
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
    const dayKeys = days.map((date) => date.toISOString().slice(0, 10));
    const labels = days.map((date) =>
      date.toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
    );
    const publishedSeries = dayKeys.map((key) =>
      payloads.recentActivity.filter(
        (item) => item.is_published && toDate(item.updated_at)?.toISOString().slice(0, 10) === key,
      ).length,
    );
    const draftSeries = dayKeys.map((key) =>
      payloads.recentActivity.filter(
        (item) => !item.is_published && toDate(item.updated_at)?.toISOString().slice(0, 10) === key,
      ).length,
    );

    const searchTotal = payloads.searchDevices.reduce(
      (sum, item) =>
        sum +
        parseCount(
          item.search_count ??
            item.searches ??
            item.total_searches ??
            item.count ??
            item.score,
        ),
      0,
    );
    const featureClickTotal = payloads.featureClicks.reduce(
      (sum, item) => sum + parseCount(item.clicks ?? item.count ?? item.total_clicks),
      0,
    );
    const avgTrendScore = payloads.trending.length
      ? payloads.trending.reduce(
          (sum, item) =>
            sum +
            parseNumber(
              item.trending_score ??
                item.trend_score ??
                item.score ??
                item.spec_score ??
                item.hook_score,
              0,
            ),
          0,
        ) / payloads.trending.length
      : 0;

    const summaryCards = [
      {
        title: "Total Products",
        value: formatCompact(publishTotals.total),
        delta: getTrendDelta(publishedSeries),
        helper: "from publish report",
        icon: FaShoppingBag,
        iconWrapClass: cardPalettes[0],
      },
      {
        title: "Published Products",
        value: formatCompact(publishTotals.published),
        delta: getTrendDelta(publishedSeries),
        helper: "last activity trend",
        icon: FaCheckCircle,
        iconWrapClass: cardPalettes[1],
      },
      {
        title: "Upcoming Launches",
        value: formatCompact(upcomingLaunches.length),
        delta: null,
        helper: "from launch timing",
        icon: FaCalendarAlt,
        iconWrapClass: cardPalettes[2],
      },
      {
        title: "Compare Pages",
        value: formatCompact(payloads.comparePages.length),
        delta: null,
        helper: "published compare pages",
        icon: FaEye,
        iconWrapClass: cardPalettes[3],
      },
      {
        title: "Avg. Trend Score",
        value: avgTrendScore ? avgTrendScore.toFixed(1) : "0",
        delta: null,
        helper: "from trending API",
        icon: FaChartLine,
        iconWrapClass: cardPalettes[4],
      },
      {
        title: "Search Signals",
        value: formatCompact(searchTotal),
        delta: null,
        helper: "from search popularity",
        icon: FaSearch,
        iconWrapClass: cardPalettes[5],
      },
    ];

    const performanceMetrics = [
      {
        label: "Publish Events",
        value: formatCompact(payloads.recentActivity.length),
        delta: getTrendDelta(publishedSeries.map((value, index) => value + draftSeries[index])),
      },
      {
        label: "Published Updates",
        value: formatCompact(recentPublished.length),
        delta: getTrendDelta(publishedSeries),
      },
      {
        label: "Feature Clicks",
        value: formatCompact(featureClickTotal),
        delta: null,
      },
      {
        label: "Active Editors",
        value: formatCompact(activeEditors),
        delta: null,
      },
    ];

    return {
      publishTotals,
      publishHealth,
      upcomingLaunches,
      labels,
      publishedSeries,
      draftSeries,
      summaryCards,
      performanceMetrics,
      recentPublished,
      searchTotal,
      featureClickTotal,
      activeEditors,
    };
  }, [payloads]);

  const quickActions = useMemo(() => {
    const canUse = (permissions) =>
      !permissions?.length || hasAnyPermissions(permissions, currentPermissions);

    const actions = [
      {
        label: "Review Drafts",
        icon: FaListAlt,
        path: "/reports/productpublishstatus",
        metric: `${formatCompact(dashboard.publishTotals.drafts)} drafts`,
        priority: dashboard.publishTotals.drafts ? 100 : 0,
        visible:
          dashboard.publishTotals.drafts > 0 &&
          canUse(["reports.view", "reports.export"]),
      },
      {
        label: "Launch Timing",
        icon: FaCalendarAlt,
        path: "/reports/launch-timing",
        metric: `${formatCompact(dashboard.upcomingLaunches.length)} upcoming`,
        priority: dashboard.upcomingLaunches.length ? 90 : 0,
        visible:
          dashboard.upcomingLaunches.length > 0 &&
          canUse(["reports.view", "reports.export"]),
      },
      {
        label: "Search Insights",
        icon: FaSearch,
        path: "/reports/search-popularity",
        metric: `${formatCompact(dashboard.searchTotal)} signals`,
        priority: dashboard.searchTotal ? 80 : 0,
        visible: dashboard.searchTotal > 0 && canUse(["reports.view", "reports.export"]),
      },
      {
        label: "Feature Clicks",
        icon: FaChartLine,
        path: "/reports/feature-clicks",
        metric: `${formatCompact(dashboard.featureClickTotal)} clicks`,
        priority: dashboard.featureClickTotal ? 70 : 0,
        visible:
          dashboard.featureClickTotal > 0 &&
          canUse(["reports.view", "reports.export"]),
      },
      {
        label: "Compare Pages",
        icon: FaChartLine,
        path: "/settings/compare-pages",
        metric: `${formatCompact(payloads.comparePages.length)} pages`,
        priority: payloads.comparePages.length ? 65 : 20,
        visible: canUse(["settings.view", "settings.edit", "settings.manage"]),
      },
      {
        label: "Add Product",
        icon: FaPlus,
        path: "/products/smartphones/create",
        metric: `${formatCompact(dashboard.publishTotals.total)} catalog total`,
        priority: canUse(["products.create", "products.*"]) ? 60 : 0,
        visible: canUse(["products.create", "products.*"]),
      },
      {
        label: "Product Inventory",
        icon: FaUpload,
        path: "/products/smartphones/inventory",
        metric: `${formatCompact(payloads.categories.length)} categories`,
        priority: payloads.categories.length ? 55 : 15,
        visible: canUse(["products.view", "products.import", "products.*"]),
      },
      {
        label: "News Articles",
        icon: FaPenNib,
        path: "/content/news-articles",
        metric: "Editorial workspace",
        priority: 35,
        visible: canUse(["content.news.view", "content.news.create", "content.news.*"]),
      },
      {
        label: "Banner Studio",
        icon: FaImage,
        path: "/marketing/banners",
        metric: "Campaign workspace",
        priority: 25,
        visible: canUse(["marketing.view", "marketing.create", "marketing.*"]),
      },
    ];

    return actions
      .filter((action) => action.visible)
      .sort((left, right) => right.priority - left.priority)
      .slice(0, 6);
  }, [currentPermissions, dashboard, payloads.categories.length, payloads.comparePages.length]);

  const primaryAction = quickActions[0] || null;

  const publishRingStyle = {
    background: `conic-gradient(#ffffff 0deg ${dashboard.publishHealth * 3.6}deg, rgba(255,255,255,0.28) ${dashboard.publishHealth * 3.6}deg 360deg)`,
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[1.9rem] font-bold tracking-tight text-slate-950 sm:text-[2.2rem]">
            Welcome back, {firstName}! <span className="inline-block">{"\u{1F44B}"}</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Live platform intelligence from publishing, discovery, search, and comparison data.
          </p>
          {errors.length > 0 && (
            <p className="mt-2 text-xs font-medium text-amber-600">
              {errors.length} dashboard source{errors.length > 1 ? "s" : ""} unavailable.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <FaCalendarAlt className="text-slate-500" />
            {lastUpdated ? `Synced ${formatTimeAgo(lastUpdated)}` : "Syncing dashboard"}
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#345CFF] shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
            Refresh Data
          </button>
          <button
            type="button"
            onClick={() => {
              if (primaryAction) {
                navigate(primaryAction.path);
              }
            }}
            disabled={!primaryAction}
            className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#345CFF] to-[#7A2CFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(92,76,255,0.25)]"
          >
            {primaryAction ? React.createElement(primaryAction.icon) : <FaPlus />}
            {primaryAction?.label || "No Action"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {dashboard.summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.75fr_1.05fr_1.15fr]">
        <SectionCard>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">Performance Overview</h2>
            <FaInfoCircle className="text-sm text-slate-300" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {dashboard.performanceMetrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-[11px] font-medium text-slate-500">{metric.label}</p>
                <p className="mt-1 text-[1.15rem] font-bold text-slate-950">{metric.value}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-600">
                  {Number.isFinite(metric.delta)
                    ? `${metric.delta >= 0 ? "up" : "down"} ${formatDelta(metric.delta)}`
                    : "Live"}
                </p>
              </div>
            ))}
          </div>

          <DesktopPerformanceChart
            labels={dashboard.labels}
            publishedSeries={dashboard.publishedSeries}
            draftSeries={dashboard.draftSeries}
          />
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Top Search Devices</h2>
            <button
              type="button"
              onClick={() => navigate("/reports/search-popularity")}
              className="text-sm font-medium text-[#345CFF]"
            >
              View All
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {payloads.searchDevices.length > 0 ? (
              payloads.searchDevices.slice(0, 5).map((device, index) => {
                const name = normalizeText(device.name, device.product_name, device.model, "Unknown device");
                const count = parseCount(device.search_count ?? device.searches ?? device.count ?? device.score);
                const pct = dashboard.searchTotal ? (count / dashboard.searchTotal) * 100 : 0;
                return (
                  <div key={`${name}-${index}`} className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r text-xs font-semibold text-white ${gradientPalettes[index % gradientPalettes.length]}`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">{formatCompact(count)} searches</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#345CFF] to-[#8A35FF]"
                          style={{ width: getProgressWidth(pct) }}
                        />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-slate-500">{pct.toFixed(1)}%</p>
                  </div>
                );
              })
            ) : (
              <EmptyState label="No search popularity data yet" />
            )}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-[#345CFF] via-[#6243FF] to-[#9431FF] p-5 text-white shadow-[0_18px_45px_rgba(97,75,255,0.26)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Today&apos;s Publish Health</h2>
                <p className="mt-1 text-sm text-white/75">
                  {lastUpdated ? `Last synced ${formatTimeAgo(lastUpdated)}` : "Waiting for sync"}
                </p>
              </div>
              <button type="button" className="text-white/70">
                <FaEllipsisH />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative mx-auto h-40 w-40 flex-shrink-0 rounded-full p-[14px]" style={publishRingStyle}>
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#456BFF] to-[#7B38FF] text-center">
                  <p className="text-4xl font-bold">{dashboard.publishHealth}%</p>
                  <p className="mt-1 text-sm text-white/80">Overall Health</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-6">
                  <span className="inline-flex items-center gap-2 text-white/85">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                    Published
                  </span>
                  <span className="font-semibold">
                    {formatNumber(dashboard.publishTotals.published)} ({dashboard.publishHealth}%)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="inline-flex items-center gap-2 text-white/85">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    Draft
                  </span>
                  <span className="font-semibold">
                    {formatNumber(dashboard.publishTotals.drafts)} (
                    {dashboard.publishTotals.total
                      ? Math.round((dashboard.publishTotals.drafts / dashboard.publishTotals.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="inline-flex items-center gap-2 text-white/85">
                    <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-300" />
                    Upcoming
                  </span>
                  <span className="font-semibold">{formatNumber(dashboard.upcomingLaunches.length)}</span>
                </div>
              </div>
            </div>
          </div>

          <SectionCard>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
              <FaArrowRight className="text-sm text-slate-300" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {quickActions.length > 0 ? (
                quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => navigate(action.path)}
                      className="group rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center transition hover:border-[#8A35FF]/25 hover:bg-white"
                    >
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EFF3FF] to-[#F4ECFF] text-[#5A49FF]">
                        <Icon className="text-sm" />
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-700">{action.label}</p>
                      <p className="mt-1 truncate text-[10px] font-medium text-slate-400">{action.metric}</p>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-2">
                  <EmptyState label="No permitted quick actions for this account yet" />
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Discovery Insights</h2>
              <button
                type="button"
                onClick={() => navigate("/reports/feature-clicks")}
                className="text-sm font-medium text-[#345CFF]"
              >
                View Report
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Search Signals", value: formatCompact(dashboard.searchTotal) },
                { label: "Feature Clicks", value: formatCompact(dashboard.featureClickTotal) },
                { label: "Compare Pages", value: formatCompact(payloads.comparePages.length) },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-[11px] text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{metric.value}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-600">Live</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1.2fr_1fr]">
        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
            <button
              type="button"
              onClick={() => navigate("/reports/recentactivity")}
              className="text-sm font-medium text-[#345CFF]"
            >
              View All
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {payloads.recentActivity.length > 0 ? (
              payloads.recentActivity.slice(0, 5).map((item, index) => (
                <div key={`${item.product_id}-${item.updated_at}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 text-white">
                    <FaCheckCircle className="text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {normalizeText(item.product_name, "Unnamed product")} {item.is_published ? "published" : "saved as draft"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      by {normalizeText(item.user_name, item.email, "Unknown user")}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">{formatTimeAgo(item.updated_at)}</p>
                </div>
              ))
            ) : (
              <EmptyState label="No recent publish activity yet" />
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Top Trending This Week</h2>
            <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              Score <FaChevronDown className="text-[10px]" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {payloads.trending.length > 0 ? (
              payloads.trending.slice(0, 5).map((item, index) => {
                const name = normalizeText(item.name, item.product_name, item.model, "Unknown product");
                const score = parseNumber(
                  item.trending_score ?? item.trend_score ?? item.score ?? item.spec_score ?? item.hook_score,
                  0,
                );
                return (
                  <div key={`${item.id || item.product_id || name}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r text-[11px] font-semibold text-white ${gradientPalettes[index % gradientPalettes.length]}`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-700">
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">{normalizeText(item.product_type, item.type, "Product")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-950">{score.toFixed(0)}</p>
                      <p className="text-xs font-semibold text-emerald-600">
                        <FaArrowUp className="inline-block" />
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState label="No trending products available" />
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Most Clicked Features</h2>
            <button
              type="button"
              onClick={() => navigate("/reports/feature-clicks")}
              className="text-sm font-medium text-[#345CFF]"
            >
              View All
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {payloads.featureClicks.length > 0 ? (
              payloads.featureClicks.slice(0, 6).map((feature) => {
                const label = normalizeText(feature.feature_label, feature.feature, feature.feature_id, "Feature");
                const clicks = parseCount(feature.clicks ?? feature.count ?? feature.total_clicks);
                const value = dashboard.featureClickTotal ? (clicks / dashboard.featureClickTotal) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="text-slate-500">{value.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#5A4BFF] to-[#A238FF]"
                        style={{ width: getProgressWidth(value) }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState label="No feature click data yet" />
            )}
          </div>
        </SectionCard>
      </section>

      <SectionCard>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Upcoming Launches</h2>
          <button
            type="button"
            onClick={() => navigate("/reports/launch-timing")}
            className="text-sm font-medium text-[#345CFF]"
          >
            View All
          </button>
        </div>

        <div className="mt-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
          {dashboard.upcomingLaunches.length > 0 ? (
            <div className="flex min-w-max gap-4">
              {dashboard.upcomingLaunches.slice(0, 8).map((launch, index) => {
                const name = normalizeText(launch.product_name, launch.name, "Unnamed device");
                const left = daysUntil(launch.launch_date);
                return (
                  <div
                    key={`${launch.product_id || name}-${index}`}
                    className="flex min-w-[250px] items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                  >
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white ${gradientPalettes[index % gradientPalettes.length]}`}
                    >
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(launch.launch_date)}</p>
                      <span className="mt-2 inline-flex rounded-full bg-[#EFE9FF] px-3 py-1 text-[11px] font-semibold text-[#6A45FF]">
                        {left === null ? "Date pending" : left <= 0 ? "Launching now" : `${left} days left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState label="No upcoming launches found" />
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default Dashboard;
