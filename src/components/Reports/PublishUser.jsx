import React, { useCallback, useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import {
  FaAward,
  FaChartBar,
  FaCheckCircle,
  FaChevronRight,
  FaCrown,
  FaExclamationCircle,
  FaEye,
  FaFileAlt,
  FaMedal,
  FaMobileAlt,
  FaQuestionCircle,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
  FaTrophy,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../../api";

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const parseMetric = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const parseCount = (value) => Math.max(0, Math.round(parseMetric(value) || 0));

const formatNumber = (value, options = {}) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  });

const formatDateTime = (value) => {
  if (!value) return "Not updated yet";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated yet";
  return date.toLocaleString();
};

const getProgressWidth = (value) => `${Math.min(Number(value) || 0, 100)}%`;

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  return (
    payload?.published_by_user ||
    payload?.users ||
    payload?.rows ||
    payload?.results ||
    payload?.data ||
    []
  );
};

const normalizeUserRow = (row = {}, index = 0) => {
  const userName = firstDefined(
    row.user_name,
    row.username,
    row.name,
    row.full_name,
    row.author_name,
    "Unknown User",
  );

  return {
    ...row,
    id: firstDefined(row.id, row.user_id, row.author_id, index + 1),
    user_name: userName,
    email: firstDefined(row.email, row.user_email, row.author_email, ""),
    published_count: parseCount(
      firstDefined(
        row.published_count,
        row.publishedCount,
        row.publications,
        row.product_count,
        row.products,
        row.count,
      ),
    ),
    previous_published_count: parseMetric(
      firstDefined(
        row.previous_published_count,
        row.previousPublishedCount,
        row.previous_count,
        row.last_period_published_count,
        row.lastPeriodPublishedCount,
      ),
    ),
  };
};

const getUserKey = (user) =>
  String(firstDefined(user?.id, user?.email, user?.user_name, "")).toLowerCase();

const getPayloadSummary = (payload = {}) => payload.summary || payload.meta || {};

const getPayloadTrends = (payload = {}) =>
  payload.trends || payload.trend || payload.deltas || payload.delta || {};

const getPayloadTopPerformer = (payload = {}) =>
  firstDefined(
    payload.top_performer,
    payload.topPerformer,
    payload.summary?.top_performer,
    payload.summary?.topPerformer,
    payload.meta?.top_performer,
    payload.meta?.topPerformer,
  );

const getMetric = (source, ...keys) => {
  for (const key of keys) {
    const numeric = parseMetric(source?.[key]);
    if (numeric !== null) return numeric;
  }
  return null;
};

const getDeltaPercent = (current, previous) => {
  const previousValue = Number(previous);
  if (!Number.isFinite(previousValue) || previousValue <= 0) return null;
  return ((Number(current) || 0) - previousValue) / previousValue * 100;
};

const buildInsight = (delta, fallbackPrimary, fallbackSecondary) => {
  if (Number.isFinite(delta)) {
    return {
      primary: `${delta >= 0 ? "+" : "-"} ${Math.abs(delta).toFixed(1)}%`,
      secondary: "vs previous period",
      positive: delta >= 0,
    };
  }

  return {
    primary: fallbackPrimary,
    secondary: fallbackSecondary,
    positive: true,
  };
};

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-[14px] border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.045)] ${className}`}
  >
    {children}
  </div>
);

const ToastIcon = ({ type }) => (
  <span
    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg ${
      type === "error" ? "bg-red-500" : "bg-emerald-500"
    }`}
  >
    {type === "error" ? (
      <FaTimes className="h-4 w-4" />
    ) : (
      <FaCheckCircle className="h-5 w-5" />
    )}
  </span>
);

const StatCard = ({
  title,
  value,
  decimals = 0,
  subtitle,
  tone,
  icon: Icon,
  insight,
}) => {
  const palette = {
    blue: {
      icon: "bg-blue-100 text-blue-600",
      value: "text-blue-600",
      accent: "text-emerald-600",
    },
    green: {
      icon: "bg-emerald-100 text-emerald-600",
      value: "text-emerald-600",
      accent: "text-emerald-600",
    },
    violet: {
      icon: "bg-violet-100 text-violet-600",
      value: "text-violet-600",
      accent: "text-emerald-600",
    },
    amber: {
      icon: "bg-amber-100 text-amber-600",
      value: "text-orange-500",
      accent: "text-orange-600",
    },
  }[tone || "blue"];

  return (
    <article className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${palette.icon}`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-700">{title}</p>
          <p
            className={`mt-1 text-[30px] font-extrabold leading-none tracking-[-0.04em] ${palette.value}`}
          >
            <CountUp
              end={Number(value) || 0}
              duration={1.1}
              decimals={decimals}
              separator=","
            />
          </p>
        </div>
      </div>
      <p className="mt-5 text-[13px] font-medium text-slate-600">{subtitle}</p>
      <div className="mt-4 flex items-center gap-3 text-[12px]">
        <span
          className={`font-bold ${
            insight?.positive === false ? "text-red-600" : palette.accent
          }`}
        >
          {insight?.positive === false ? "↓" : "↑"}{" "}
          {insight?.primary || "Current report"}
        </span>
        <span className="text-slate-500">
          {insight?.secondary || "from live data"}
        </span>
      </div>
    </article>
  );
};

const PublishedByUserReport = () => {
  const [reportData, setReportData] = useState([]);
  const [reportMeta, setReportMeta] = useState({
    summary: {},
    trends: {},
    periodLabel: "previous period",
    updatedAt: null,
    topPerformer: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "published_count",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const showToast = useCallback((title, message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl("/api/reports/published-by-user"), {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload = await res.json();
      const rows = getArrayPayload(payload).map(normalizeUserRow);
      const summary = getPayloadSummary(payload);
      const trends = getPayloadTrends(payload);

      setReportData(rows);
      setReportMeta({
        summary,
        trends,
        topPerformer: getPayloadTopPerformer(payload),
        periodLabel:
          firstDefined(
            payload.period_label,
            payload.periodLabel,
            summary.period_label,
            summary.periodLabel,
            trends.period_label,
            trends.periodLabel,
          ) || "previous period",
        updatedAt:
          firstDefined(
            payload.updated_at,
            payload.updatedAt,
            payload.generated_at,
            payload.generatedAt,
            summary.updated_at,
            summary.updatedAt,
          ) || new Date().toISOString(),
      });
      showToast(
        "Report loaded",
        "User publication data fetched successfully.",
        "success",
      );
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError(err.message || "Failed to load user report data");
      showToast(
        "Error loading report",
        "Failed to fetch publication data. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "desc" };
    });
  }, []);

  const filteredData = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return reportData;
    return reportData.filter(
      (user) =>
        user.user_name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search),
    );
  }, [reportData, searchTerm]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key.includes("count") || sortConfig.key === "id") {
        return sortConfig.direction === "asc"
          ? parseCount(aValue) - parseCount(bValue)
          : parseCount(bValue) - parseCount(aValue);
      }

      const left = String(aValue || "").toLowerCase();
      const right = String(bValue || "").toLowerCase();
      if (left < right) return sortConfig.direction === "asc" ? -1 : 1;
      if (left > right) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const computedTotalPublished = useMemo(
    () => reportData.reduce((sum, user) => sum + parseCount(user.published_count), 0),
    [reportData],
  );

  const previousTotalPublished = useMemo(() => {
    const rowTotal = reportData.reduce((sum, user) => {
      if (!Number.isFinite(user.previous_published_count)) return sum;
      return sum + user.previous_published_count;
    }, 0);
    return rowTotal || null;
  }, [reportData]);

  const reportMetrics = useMemo(() => {
    const { summary, trends } = reportMeta;
    const activeComputed = reportData.filter(
      (user) => parseCount(user.published_count) > 0,
    ).length;
    const totalUsers =
      getMetric(summary, "total_users", "totalUsers", "users_count", "usersCount") ??
      reportData.length;
    const totalPublished =
      getMetric(
        summary,
        "total_published",
        "totalPublished",
        "published_total",
        "publishedTotal",
      ) ?? computedTotalPublished;
    const activePublishers =
      getMetric(
        summary,
        "active_publishers",
        "activePublishers",
        "publishers_count",
        "publishersCount",
      ) ?? activeComputed;
    const averagePublished =
      getMetric(
        summary,
        "average_published",
        "averagePublished",
        "average_per_user",
        "averagePerUser",
      ) ??
      (activePublishers > 0
        ? Number((totalPublished / activePublishers).toFixed(2))
        : 0);

    const payloadTop = reportMeta.topPerformer
      ? normalizeUserRow(reportMeta.topPerformer)
      : null;
    const computedTop = [...reportData].sort(
      (a, b) => parseCount(b.published_count) - parseCount(a.published_count),
    )[0];
    const topPerformer =
      payloadTop && parseCount(payloadTop.published_count) > 0
        ? payloadTop
        : computedTop;
    const topPublished = parseCount(topPerformer?.published_count);
    const filteredPublished = filteredData.reduce(
      (sum, user) => sum + parseCount(user.published_count),
      0,
    );
    const filterShare =
      totalPublished > 0 ? Number(((filteredPublished / totalPublished) * 100).toFixed(2)) : 0;
    const topShare =
      totalPublished > 0 ? Number(((topPublished / totalPublished) * 100).toFixed(2)) : 0;

    const totalDelta =
      getMetric(
        trends,
        "total_published_delta_percent",
        "totalPublishedDeltaPercent",
        "totalPublished",
      ) ??
      getDeltaPercent(
        totalPublished,
        getMetric(
          summary,
          "previous_total_published",
          "previousTotalPublished",
          "last_total_published",
          "lastTotalPublished",
        ) ?? previousTotalPublished,
      );
    const activeDelta =
      getMetric(
        trends,
        "active_publishers_delta_percent",
        "activePublishersDeltaPercent",
        "activePublishers",
      ) ??
      getDeltaPercent(
        activePublishers,
        getMetric(summary, "previous_active_publishers", "previousActivePublishers"),
      );
    const averageDelta =
      getMetric(
        trends,
        "average_published_delta_percent",
        "averagePublishedDeltaPercent",
        "averagePerUser",
      ) ??
      getDeltaPercent(
        averagePublished,
        getMetric(summary, "previous_average_published", "previousAveragePublished"),
      );
    const topDelta =
      getMetric(
        trends,
        "top_performer_delta_percent",
        "topPerformerDeltaPercent",
        "topPerformer",
      ) ??
      getDeltaPercent(
        topPublished,
        parseMetric(topPerformer?.previous_published_count),
      );

    return {
      totalUsers,
      totalPublished,
      activePublishers,
      averagePublished,
      topPerformer,
      topPublished,
      filteredPublished,
      filterShare,
      topShare,
      totalDelta,
      activeDelta,
      averageDelta,
      topDelta,
    };
  }, [
    computedTotalPublished,
    filteredData,
    previousTotalPublished,
    reportData,
    reportMeta,
  ]);

  const rankByUser = useMemo(() => {
    const ranks = new Map();
    [...reportData]
      .sort((a, b) => parseCount(b.published_count) - parseCount(a.published_count))
      .forEach((user, index) => {
        ranks.set(getUserKey(user), index + 1);
      });
    return ranks;
  }, [reportData]);

  const getContributionPercentage = useCallback(
    (user) =>
      reportMetrics.totalPublished > 0
        ? Number(
            ((parseCount(user.published_count) / reportMetrics.totalPublished) * 100).toFixed(2),
          )
        : 0,
    [reportMetrics.totalPublished],
  );

  const getRankBadge = useCallback((rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-amber-500">
          <FaCrown className="h-4 w-4" /> 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400">
          <FaMedal className="h-4 w-4" /> 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-orange-500">
          <FaAward className="h-4 w-4" /> 3
        </span>
      );
    }
    return (
      <span
        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[12px] font-bold text-white ${
          rank <= 10 ? "bg-blue-600" : "bg-slate-500"
        }`}
      >
        {rank}
      </span>
    );
  }, []);

  const getUserAvatarColor = useCallback((name) => {
    const colors = [
      "bg-amber-100 text-amber-700",
      "bg-slate-100 text-slate-700",
      "bg-orange-100 text-orange-700",
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-violet-100 text-violet-700",
      "bg-red-100 text-red-700",
      "bg-cyan-100 text-cyan-700",
    ];
    return colors[(name?.length || 0) % colors.length];
  }, []);

  const getSortIcon = useCallback(
    (key) => {
      if (sortConfig.key !== key) {
        return <FaSort className="ml-1.5 h-3 w-3 text-slate-400" />;
      }
      return sortConfig.direction === "asc" ? (
        <FaSortUp className="ml-1.5 h-3 w-3 text-blue-600" />
      ) : (
        <FaSortDown className="ml-1.5 h-3 w-3 text-blue-600" />
      );
    },
    [sortConfig],
  );

  const getUserInitials = useCallback((name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  }, []);

  const previewUsers = sortedData.slice(0, 5);
  const periodLabel = reportMeta.periodLabel || "previous period";

  const statCards = [
    {
      title: "Total Published",
      value: reportMetrics.totalPublished,
      subtitle: `${formatNumber(reportMetrics.filteredPublished)} products in current view`,
      tone: "blue",
      icon: FaFileAlt,
      insight: buildInsight(
        reportMetrics.totalDelta,
        `${formatNumber(reportData.length)} rows`,
        "from report data",
      ),
    },
    {
      title: "Active Publishers",
      value: reportMetrics.activePublishers,
      subtitle: `${formatNumber(reportMetrics.totalUsers)} total users in scope`,
      tone: "green",
      icon: FaUsers,
      insight: buildInsight(
        reportMetrics.activeDelta,
        `${formatNumber(reportMetrics.activePublishers)} active`,
        "computed from rows",
      ),
    },
    {
      title: "Average Per User",
      value: reportMetrics.averagePublished,
      decimals: 2,
      subtitle: "Publications per active publisher",
      tone: "violet",
      icon: FaChartBar,
      insight: buildInsight(
        reportMetrics.averageDelta,
        `${reportMetrics.filterShare.toFixed(2)}% visible`,
        "after current search",
      ),
    },
    {
      title: "Top Performer",
      value: reportMetrics.topPublished,
      subtitle: reportMetrics.topPerformer?.user_name || "No publisher yet",
      tone: "amber",
      icon: FaTrophy,
      insight: buildInsight(
        reportMetrics.topDelta,
        `${reportMetrics.topShare.toFixed(2)}% share`,
        "of total publications",
      ),
    },
  ];

  const summaryRows = [
    ["Total Published", formatNumber(reportMetrics.totalPublished), FaFileAlt, "blue"],
    ["Active Publishers", formatNumber(reportMetrics.activePublishers), FaUsers, "green"],
    [
      "Average Per User",
      reportMetrics.averagePublished.toFixed(2),
      FaChartBar,
      "violet",
    ],
    [
      "Top Performer",
      reportMetrics.topPerformer
        ? `${reportMetrics.topPerformer.user_name} (${formatNumber(reportMetrics.topPublished)})`
        : "N/A",
      FaTrophy,
      "amber",
    ],
  ];

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F8FAFC] px-3 py-4 text-slate-950 sm:px-5 lg:px-6">
      <div className="fixed right-4 top-4 z-50 w-[min(330px,calc(100vw-2rem))] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-4 rounded-xl border bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur ${
              toast.type === "error"
                ? "border-red-200 shadow-red-100/60"
                : "border-emerald-200 shadow-emerald-100/60"
            }`}
          >
            <ToastIcon type={toast.type} />
            <div className="min-w-0 flex-1">
              <p
                className={`text-[13px] font-bold ${
                  toast.type === "error" ? "text-red-800" : "text-slate-900"
                }`}
              >
                {toast.title}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-slate-600">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 transition-colors hover:text-slate-700"
              aria-label="Close notification"
            >
              <FaTimes className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1440px] space-y-6">
        <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="border-b border-slate-200 bg-white/80 px-6 py-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
              <span>Reports</span>
              <FaChevronRight className="h-2.5 w-2.5 text-slate-400" />
              <span className="font-bold text-slate-900">
                User Publication Report
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5 bg-[radial-gradient(circle_at_15%_0%,rgba(37,99,235,0.06),transparent_32%),linear-gradient(180deg,#FFFFFF_0%,#FBFDFF_100%)] px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-slate-950 sm:text-[34px]">
                User Publication Report
              </h1>
              <p className="mt-2 text-[14px] font-medium text-slate-600">
                Track and analyze publication contributions across your team
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[13px] font-bold text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                  <FaUser className="h-3 w-3" />
                </span>
                <CountUp end={sortedData.length} duration={0.8} /> of{" "}
                <CountUp end={reportMetrics.totalUsers} duration={0.8} /> users
              </div>
            </div>

            <button
              type="button"
              onClick={fetchReportData}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-3 rounded-lg border border-blue-200 bg-white px-6 text-[14px] font-bold text-blue-600 shadow-[0_10px_24px_rgba(37,99,235,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FaSyncAlt className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh Report"}
              <FaSyncAlt className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </section>

        {(error || loading) && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {error && (
              <div className="rounded-[14px] border border-red-200 bg-red-50/80 p-6 shadow-[0_12px_34px_rgba(239,68,68,0.08)] lg:col-span-1">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <FaExclamationCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-red-800">
                      Error loading report
                    </h3>
                    <p className="mt-2 text-[13px] leading-5 text-red-700">
                      We couldn't fetch the publication data. Please try
                      refreshing the report.
                    </p>
                    <button
                      type="button"
                      onClick={fetchReportData}
                      className="mt-4 rounded-md border border-red-300 bg-white px-5 py-2 text-[13px] font-bold text-red-600 transition-colors hover:bg-red-50"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="rounded-[14px] border border-blue-200 bg-white p-6 shadow-[0_12px_34px_rgba(37,99,235,0.08)] lg:col-span-2">
                <div className="flex items-center gap-6">
                  <FaSpinner className="h-12 w-12 animate-spin text-blue-600" />
                  <div>
                    <h3 className="text-[16px] font-extrabold text-blue-600">
                      Loading user report...
                    </h3>
                    <p className="mt-3 text-[13px] font-medium text-slate-600">
                      Fetching the latest publication data
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-[17px] font-extrabold text-slate-950">
                  Publication Leaderboard
                </h2>
                <p className="mt-1 text-[13px] font-medium text-slate-500">
                  Ranked by published products
                </p>
              </div>

              <div className="flex w-full gap-2 lg:max-w-[440px]">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by username or email..."
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-[13px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600"
                    aria-label="Clear search"
                  >
                    <FaTimes className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:hidden p-4">
              {sortedData.length > 0 ? (
                <div className="space-y-3">
                  {sortedData.map((user, index) => {
                    const rank = rankByUser.get(getUserKey(user)) || index + 1;
                    const percentage = getContributionPercentage(user);
                    return (
                      <div
                        key={getUserKey(user)}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full ${getUserAvatarColor(
                                user.user_name,
                              )}`}
                            >
                              <span className="text-[14px] font-extrabold">
                                {getUserInitials(user.user_name)}
                              </span>
                            </div>
                            <div>
                              <div>{getRankBadge(rank)}</div>
                              <h3 className="mt-2 text-[14px] font-extrabold text-slate-900">
                                {user.user_name}
                              </h3>
                              <p className="mt-1 text-[12px] text-slate-500">
                                {user.email || "No email"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 text-blue-600"
                            aria-label={`View ${user.user_name}`}
                          >
                            <FaEye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[16px] font-extrabold text-blue-600">
                            {formatNumber(user.published_count)}
                          </span>
                          <span className="text-[12px] font-semibold text-slate-600">
                            {percentage.toFixed(2)}%
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: getProgressWidth(percentage) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <FaUsers className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="mt-4 text-[15px] font-bold text-slate-800">
                    {searchTerm ? "No matching users" : "No publication data"}
                  </p>
                  <p className="mt-2 text-[13px] text-slate-500">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "Users will appear here once they publish products."}
                  </p>
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-white">
                    {[
                      ["published_count", "Rank"],
                      [null, "User Profile"],
                      ["user_name", "Username"],
                      ["email", "Email"],
                      ["published_count", "Published Count"],
                      [null, "Contribution"],
                    ].map(([key, label], index) => (
                      <th
                        key={`${label}-${index}`}
                        scope="col"
                        onClick={key ? () => handleSort(key) : undefined}
                        className={`px-6 py-4 text-left text-[12px] font-extrabold text-slate-800 ${
                          key ? "cursor-pointer hover:text-blue-600" : ""
                        }`}
                      >
                        <span className="inline-flex items-center">
                          {label}
                          {key ? getSortIcon(key) : null}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length > 0 ? (
                    sortedData.map((user, index) => {
                      const rank = rankByUser.get(getUserKey(user)) || index + 1;
                      const percentage = getContributionPercentage(user);

                      return (
                        <tr
                          key={getUserKey(user)}
                          className="border-b border-slate-200 transition-colors hover:bg-blue-50/35"
                        >
                          <td className="px-6 py-4 align-middle">
                            {getRankBadge(rank)}
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-full ${getUserAvatarColor(
                                user.user_name,
                              )}`}
                            >
                              <span className="text-[13px] font-extrabold">
                                {getUserInitials(user.user_name)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span className="text-[13px] font-semibold text-slate-950">
                              {user.user_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span className="text-[13px] font-medium text-slate-600">
                              {user.email || "No email"}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span className="text-[16px] font-extrabold text-blue-600">
                              <CountUp
                                end={parseCount(user.published_count)}
                                duration={0.9}
                                separator=","
                              />
                            </span>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="w-36">
                              <div className="mb-2 text-[12px] font-semibold text-slate-700">
                                {percentage.toFixed(2)}%
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-blue-600"
                                  style={{ width: getProgressWidth(percentage) }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-8 py-14">
                        <div className="text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <FaUsers className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="mt-4 text-[15px] font-bold text-slate-800">
                            {searchTerm
                              ? "No matching users"
                              : "No publication data"}
                          </p>
                          <p className="mt-2 text-[13px] text-slate-500">
                            {searchTerm
                              ? "Try adjusting your search terms or filters."
                              : "Start by publishing products to see user contributions here."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {sortedData.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 text-[13px] md:flex-row md:items-center md:justify-between">
                <p className="font-medium text-slate-600">
                  Showing{" "}
                  <span className="font-extrabold text-slate-900">
                    {sortedData.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-extrabold text-slate-900">
                    {reportMetrics.totalUsers}
                  </span>{" "}
                  users
                </p>
                <div className="flex flex-wrap gap-6">
                  <p className="font-medium text-slate-800">
                    Total Published:{" "}
                    <span className="font-extrabold">
                      {formatNumber(reportMetrics.totalPublished)}
                    </span>
                  </p>
                  <p className="font-medium text-slate-800">
                    Average Per User:{" "}
                    <span className="font-extrabold">
                      {reportMetrics.averagePublished.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card className="hidden self-start p-4 xl:block">
            <div className="mb-4 flex items-center gap-3">
              <FaMobileAlt className="h-4 w-4 text-slate-700" />
              <h3 className="text-[14px] font-extrabold text-slate-900">
                Mobile View
              </h3>
            </div>
            <div className="space-y-3">
              {previewUsers.length > 0 ? (
                previewUsers.map((user, index) => {
                  const rank = rankByUser.get(getUserKey(user)) || index + 1;
                  const percentage = getContributionPercentage(user);
                  return (
                    <div
                      key={getUserKey(user)}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full ${getUserAvatarColor(
                                user.user_name,
                              )}`}
                            >
                              <span className="text-[13px] font-extrabold">
                                {getUserInitials(user.user_name)}
                              </span>
                            </div>
                            <span className="absolute -left-1 -top-2">
                              {getRankBadge(rank)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-[13px] font-extrabold text-slate-900">
                              {user.user_name}
                            </h4>
                            <p className="mt-1 truncate text-[12px] text-slate-500">
                              {user.email || "No email"}
                            </p>
                            <p className="mt-1 text-[12px] text-slate-600">
                              ID: {user.id || "-"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 text-blue-600"
                          aria-label={`View ${user.user_name}`}
                        >
                          <FaEye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <span className="w-14 text-[15px] font-extrabold text-blue-600">
                          {formatNumber(user.published_count)}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: getProgressWidth(percentage) }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">
                          {percentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-[13px] font-semibold text-slate-600">
                    No users to preview
                  </p>
                </div>
              )}
            </div>
            {sortedData.length > 0 && (
              <button
                type="button"
                className="mt-4 h-11 w-full rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-blue-600 transition-colors hover:bg-blue-50"
              >
                View all {sortedData.length} users
              </button>
            )}
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="p-6">
            <h3 className="mb-5 flex items-center gap-2 text-[16px] font-extrabold text-slate-950">
              <FaTrophy className="text-amber-500" />
              Ranking Legend
            </h3>
            <div className="space-y-4 text-[13px]">
              <div className="flex items-start gap-4">
                <FaCrown className="mt-1 h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-extrabold text-slate-900">Top Performer</p>
                  <p className="mt-1 text-slate-500">
                    Current highest publication count
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FaMedal className="mt-1 h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-extrabold text-slate-900">Runner-up</p>
                  <p className="mt-1 text-slate-500">
                    Second highest publication count
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FaAward className="mt-1 h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-extrabold text-slate-900">Third Place</p>
                  <p className="mt-1 text-slate-500">
                    Third highest publication count
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-blue-600 px-2 py-1 text-[11px] font-bold text-white">
                  4-10
                </span>
                <p className="font-medium text-slate-600">Remaining top 10</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-slate-500 px-2 py-1 text-[11px] font-bold text-white">
                  11+
                </span>
                <p className="font-medium text-slate-600">Other contributors</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-5 flex items-center gap-2 text-[16px] font-extrabold text-slate-950">
              <FaChartBar className="text-blue-600" />
              Report Summary
            </h3>
            <div className="space-y-3">
              {summaryRows.map(([label, value, Icon, tone]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        tone === "green"
                          ? "bg-emerald-100 text-emerald-600"
                          : tone === "violet"
                            ? "bg-violet-100 text-violet-600"
                            : tone === "amber"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate text-[13px] font-bold text-slate-800">
                      {label}
                    </span>
                  </div>
                  <span
                    className={`max-w-[150px] truncate text-right text-[13px] font-extrabold ${
                      tone === "amber" ? "text-orange-600" : "text-slate-950"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-5 flex items-center gap-2 text-[16px] font-extrabold text-slate-950">
              <FaQuestionCircle className="text-slate-600" />
              How to Use
            </h3>
            <div className="space-y-4">
              {[
                [
                  "Identify top contributors",
                  `Top rank is recalculated from ${formatNumber(reportMetrics.totalPublished)} publications`,
                  FaUsers,
                ],
                [
                  "Track publication trends",
                  `Delta values use API trends or row history for ${periodLabel}`,
                  FaChartBar,
                ],
                [
                  "Search users",
                  `Current filter matches ${formatNumber(sortedData.length)} users`,
                  FaSearch,
                ],
                [
                  "Sort columns",
                  `Current sort: ${sortConfig.key.replace(/_/g, " ")} ${sortConfig.direction}`,
                  FaSort,
                ],
              ].map(([title, description, Icon]) => (
                <div key={title} className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-extrabold text-slate-900">
                      {title}
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <div className="pb-1 text-center">
          <p className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500">
            <FaSyncAlt className="h-3.5 w-3.5" />
            Report updated: {formatDateTime(reportMeta.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublishedByUserReport;
