import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaHistory,
  FaHome,
  FaLaptop,
  FaMobileAlt,
  FaNetworkWired,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../../api";

const SURFACE_CLASS = "border border-slate-200 bg-white";
const FIELD_CLASS =
  "h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#345CFF] focus:ring-0";
const SECONDARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 border border-[#345CFF] bg-[#345CFF] px-4 text-sm font-semibold text-white transition hover:bg-[#274eef] disabled:cursor-not-allowed disabled:border-[#9db3ff] disabled:bg-[#9db3ff]";

const DEFAULT_FILTERS = {
  status: "all",
  productType: "all",
  assignment: "all",
};

const SORT_FIELD_OPTIONS = [
  { value: "updated_at", label: "Last Updated" },
  { value: "product_name", label: "Product Name" },
  { value: "product_id", label: "Product ID" },
  { value: "is_published", label: "Status" },
  { value: "product_type", label: "Product Type" },
  { value: "user_name", label: "Updated By" },
];

const getUserInitials = (value) =>
  String(value || "NA")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const formatProductType = (type) =>
  String(type || "Unknown")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatRelativeDate = (dateString) => {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return "-";

  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
};

const formatFullDate = (dateString) => {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const formatTimeOnly = (dateString) => {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return "-";

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const getProductTypeMeta = (type) => {
  switch (String(type || "").toLowerCase()) {
    case "smartphone":
      return {
        icon: FaMobileAlt,
        frameClassName: "bg-blue-50 text-blue-600",
      };
    case "laptop":
      return {
        icon: FaLaptop,
        frameClassName: "bg-violet-50 text-violet-600",
      };
    case "tv":
    case "home_appliance":
      return {
        icon: FaHome,
        frameClassName: "bg-emerald-50 text-emerald-600",
      };
    case "networking":
      return {
        icon: FaNetworkWired,
        frameClassName: "bg-amber-50 text-amber-600",
      };
    default:
      return {
        icon: FaHistory,
        frameClassName: "bg-slate-100 text-slate-600",
      };
  }
};

const sortActivityRows = (rows, sortConfig) => {
  const direction = sortConfig?.direction === "asc" ? 1 : -1;
  const key = sortConfig?.key || "updated_at";

  return [...rows].sort((left, right) => {
    let leftValue = left?.[key];
    let rightValue = right?.[key];

    if (key === "updated_at") {
      leftValue = new Date(leftValue).getTime();
      rightValue = new Date(rightValue).getTime();
      leftValue = Number.isFinite(leftValue) ? leftValue : 0;
      rightValue = Number.isFinite(rightValue) ? rightValue : 0;
    } else if (key === "product_id") {
      leftValue = Number(leftValue) || 0;
      rightValue = Number(rightValue) || 0;
    } else if (key === "is_published") {
      leftValue = leftValue ? 1 : 0;
      rightValue = rightValue ? 1 : 0;
    } else {
      leftValue = String(leftValue || "").toLowerCase();
      rightValue = String(rightValue || "").toLowerCase();
    }

    if (leftValue < rightValue) return -1 * direction;
    if (leftValue > rightValue) return 1 * direction;
    return 0;
  });
};

const StatusBadge = ({ published }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
      published
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
        : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
    }`}
  >
    {published ? <FaEye className="text-[11px]" /> : <FaEyeSlash className="text-[11px]" />}
    {published ? "Published" : "Draft"}
  </span>
);

const ToastNotice = ({ toast, onDismiss }) => (
  <div
    className={`flex items-start gap-3 border px-4 py-3 ${
      toast.type === "error"
        ? "border-rose-200 bg-rose-50"
        : "border-emerald-200 bg-emerald-50"
    }`}
  >
    <div
      className={`mt-0.5 flex h-8 w-8 items-center justify-center ${
        toast.type === "error" ? "text-rose-600" : "text-emerald-600"
      }`}
    >
      {toast.type === "error" ? <FaExclamationCircle /> : <FaCheckCircle />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
      <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>
    </div>
    <button
      type="button"
      onClick={onDismiss}
      className="text-slate-400 transition hover:text-slate-700"
      aria-label="Dismiss notification"
    >
      <FaTimes className="text-sm" />
    </button>
  </div>
);

const StateBanner = ({
  icon: Icon,
  iconClassName,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => (
  <section className={`border px-2 py-3 sm:px-3 ${className}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center ${iconClassName}`}>
          <Icon />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="border border-current px-4 py-2 text-sm font-semibold text-inherit transition hover:bg-white/70"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  </section>
);

const MetricCard = ({
  icon: Icon,
  iconClassName,
  label,
  value,
  supporting,
  secondary,
  valueClassName = "",
}) => (
  <article className="bg-white px-4 py-4 sm:px-5">
    <div className="flex items-start justify-between gap-3">
      <div className={`flex h-12 w-12 items-center justify-center border border-current/10 text-lg ${iconClassName}`}>
        <Icon />
      </div>
    </div>

    <div className="mt-4 space-y-1">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className={`text-[1.75rem] font-bold tracking-tight text-slate-900 ${valueClassName}`}>
        {value}
      </div>
    </div>

    <div className="mt-2 min-h-[40px] space-y-1">
      {supporting ? <p className="text-xs font-medium text-slate-500">{supporting}</p> : null}
      {secondary ? <div className="text-xs font-semibold text-slate-700">{secondary}</div> : null}
    </div>
  </article>
);

const SortableHeader = ({ label, active, direction, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 transition hover:text-slate-700"
  >
    <span>{label}</span>
    {active ? (
      direction === "asc" ? (
        <FaSortUp className="text-slate-600" />
      ) : (
        <FaSortDown className="text-slate-600" />
      )
    ) : (
      <FaSort className="text-slate-300" />
    )}
  </button>
);

const RecentPublishActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [timeRange, setTimeRange] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "updated_at",
    direction: "desc",
  });

  const showToast = useCallback((title, message, type = "success") => {
    const id = Date.now() + Math.random();
    const nextToast = { id, title, message, type };

    setToasts((previous) => [...previous, nextToast]);

    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const fetchActivityData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(buildUrl("/api/reports/recent-publish-activity"), {
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
      const normalizedRows = Array.isArray(payload?.recent_publish_activity)
        ? payload.recent_publish_activity
        : [];

      setActivities(normalizedRows);
      showToast("Success", "Activity data loaded successfully", "success");
    } catch (requestError) {
      console.error("Failed to fetch recent publish activity:", requestError);
      const message = requestError?.message || "Failed to load activity data";
      setError(message);
      showToast("Error", "Failed to load activity data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  const handleSort = useCallback((key) => {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilters(DEFAULT_FILTERS);
    setTimeRange("all");
  }, []);

  const filteredBaseActivities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return activities.filter((activity) => {
      if (filters.status === "published" && !activity?.is_published) return false;
      if (filters.status === "draft" && activity?.is_published) return false;

      if (
        filters.productType !== "all" &&
        String(activity?.product_type || "") !== filters.productType
      ) {
        return false;
      }

      if (filters.assignment === "assigned" && !activity?.published_by && !activity?.user_name) {
        return false;
      }

      if (filters.assignment === "unassigned" && (activity?.published_by || activity?.user_name)) {
        return false;
      }

      if (timeRange !== "all") {
        const updatedAt = new Date(activity?.updated_at).getTime();
        if (Number.isNaN(updatedAt)) return false;

        const diffDays = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);

        if (timeRange === "today" && diffDays > 1) return false;
        if (timeRange === "week" && diffDays > 7) return false;
        if (timeRange === "month" && diffDays > 30) return false;
      }

      if (query) {
        const searchBody = [
          activity?.product_name,
          activity?.product_type,
          activity?.user_name,
          activity?.email,
          activity?.product_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchBody.includes(query)) return false;
      }

      return true;
    });
  }, [activities, filters, searchTerm, timeRange]);

  const filteredActivities = useMemo(
    () => sortActivityRows(filteredBaseActivities, sortConfig),
    [filteredBaseActivities, sortConfig],
  );

  const timelineActivities = useMemo(
    () =>
      sortActivityRows(filteredBaseActivities, {
        key: "updated_at",
        direction: "desc",
      }).slice(0, 5),
    [filteredBaseActivities],
  );

  const stats = useMemo(() => {
    const total = activities.length;
    const published = activities.filter((activity) => activity?.is_published).length;
    const drafts = total - published;
    const assigned = activities.filter((activity) => activity?.published_by || activity?.user_name).length;
    const latestActivity =
      total > 0
        ? sortActivityRows(activities, { key: "updated_at", direction: "desc" })[0]
        : null;

    return {
      total,
      published,
      drafts,
      assigned,
      latestActivity,
    };
  }, [activities]);

  const visibleTypeCounts = useMemo(() => {
    return filteredBaseActivities.reduce((accumulator, activity) => {
      const key = String(activity?.product_type || "unknown");
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
  }, [filteredBaseActivities]);

  const typeDistribution = useMemo(() => {
    return Object.entries(visibleTypeCounts)
      .sort((left, right) => right[1] - left[1])
      .map(([type, count]) => ({
        type,
        count,
        percentage:
          filteredBaseActivities.length > 0
            ? Math.round((count / filteredBaseActivities.length) * 100)
            : 0,
      }));
  }, [filteredBaseActivities.length, visibleTypeCounts]);

  const uniqueProductTypes = useMemo(
    () => [...new Set(activities.map((activity) => activity?.product_type).filter(Boolean))],
    [activities],
  );

  const visibleRangeLabel = useMemo(() => {
    if (filteredActivities.length === 0) {
      return `Showing 0 of ${activities.length} activities`;
    }

    return `Showing 1 to ${filteredActivities.length} of ${activities.length} activities`;
  }, [activities.length, filteredActivities.length]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    filters.status !== "all" ||
    filters.productType !== "all" ||
    filters.assignment !== "all" ||
    timeRange !== "all";

  return (
    <div className="min-h-full bg-[#F5F7FF] p-2 sm:p-3">
      <div className="fixed right-4 top-4 z-50 w-[min(22rem,calc(100vw-2rem))] space-y-2">
        {toasts.map((toast) => (
          <ToastNotice
            key={toast.id}
            toast={toast}
            onDismiss={() =>
              setToasts((previous) => previous.filter((entry) => entry.id !== toast.id))
            }
          />
        ))}
      </div>

      <div className="mx-auto max-w-[1480px] space-y-4 sm:space-y-5">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-[2rem] font-bold tracking-tight text-slate-950 sm:text-[2.35rem]">
                Recent Publish Activity
              </h1>
              <p className="mt-2 max-w-[42rem] text-base text-slate-500">
                Review the latest publish and draft changes across products,
                see who made the update, and monitor activity patterns by
                product type.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className={`${SECONDARY_BUTTON_CLASS} w-full sm:w-auto`}
              >
                <FaFilter className="text-sm" />
                Clear Filters
              </button>
              <button
                type="button"
                onClick={fetchActivityData}
                disabled={loading}
                className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            icon={FaHistory}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            label="Total Activities"
            value={stats.total.toLocaleString()}
            supporting="Recent catalog updates"
          />
          <MetricCard
            icon={FaEye}
            iconClassName="bg-emerald-50 text-emerald-600"
            label="Published"
            value={stats.published.toLocaleString()}
            supporting={
              stats.total > 0
                ? `${Math.round((stats.published / stats.total) * 100)}% visible`
                : "No activity yet"
            }
          />
          <MetricCard
            icon={FaEyeSlash}
            iconClassName="bg-amber-50 text-amber-600"
            label="Drafts"
            value={stats.drafts.toLocaleString()}
            supporting="Still in progress"
          />
          <MetricCard
            icon={FaUser}
            iconClassName="bg-violet-50 text-violet-600"
            label="Assigned Updates"
            value={stats.assigned.toLocaleString()}
            supporting={
              stats.total > 0
                ? `${Math.round((stats.assigned / stats.total) * 100)}% with owner`
                : "No owners yet"
            }
          />
          <MetricCard
            icon={FaCalendarAlt}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            label="Latest Activity"
            value={formatRelativeDate(stats.latestActivity?.updated_at)}
            supporting={stats.latestActivity?.product_name || "No recent update"}
            secondary={
              stats.latestActivity?.updated_at
                ? formatTimeOnly(stats.latestActivity.updated_at)
                : null
            }
            valueClassName="text-[1.3rem] sm:text-[1.5rem]"
          />
        </section>

        <section className={`${SURFACE_CLASS} px-2 py-3 sm:px-3 lg:px-4`}>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-[1.35fr_repeat(4,minmax(0,0.82fr))]">
            <div className="col-span-2 xl:col-span-1">
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Search
              </label>
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by product, user, email, or ID..."
                  className={`${FIELD_CLASS} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    status: event.target.value,
                  }))
                }
                className={FIELD_CLASS}
              >
                <option value="all">All Status</option>
                <option value="published">Published Only</option>
                <option value="draft">Draft Only</option>
              </select>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Product Type
              </label>
              <select
                value={filters.productType}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    productType: event.target.value,
                  }))
                }
                className={FIELD_CLASS}
              >
                <option value="all">All Types</option>
                {uniqueProductTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatProductType(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Assignment
              </label>
              <select
                value={filters.assignment}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    assignment: event.target.value,
                  }))
                }
                className={FIELD_CLASS}
              >
                <option value="all">All Updates</option>
                <option value="assigned">Assigned Only</option>
                <option value="unassigned">Unassigned Only</option>
              </select>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(event) => setTimeRange(event.target.value)}
                className={FIELD_CLASS}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,0.92fr)_auto]">
            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Sort By
              </label>
              <select
                value={sortConfig.key}
                onChange={(event) =>
                  setSortConfig((previous) => ({
                    ...previous,
                    key: event.target.value,
                  }))
                }
                className={FIELD_CLASS}
              >
                {SORT_FIELD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Direction
              </label>
              <select
                value={sortConfig.direction}
                onChange={(event) =>
                  setSortConfig((previous) => ({
                    ...previous,
                    direction: event.target.value,
                  }))
                }
                className={FIELD_CLASS}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>

            <div className="sm:self-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className={`${SECONDARY_BUTTON_CLASS} w-full xl:min-w-[144px]`}
              >
                <FaFilter className="text-sm" />
                Reset
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
            title="Failed to load recent activity."
            description={error || "Please try again."}
            actionLabel="Try Again"
            onAction={fetchActivityData}
            className="border-rose-200 bg-rose-50 text-rose-600"
          />
        ) : null}

        {loading ? (
          <StateBanner
            icon={FaSpinner}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            title="Loading recent publish activity..."
            description="Please wait while we fetch the latest catalog changes."
            className="border-[#DCE5FF] bg-white text-[#2F66F6]"
          />
        ) : null}

        {!loading && filteredActivities.length === 0 ? (
          <StateBanner
            icon={FaHistory}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            title={activities.length === 0 ? "No activity data available" : "No activities match your filters"}
            description={
              activities.length === 0
                ? "Activity will appear here when products are updated."
                : "Try adjusting your filters or search query."
            }
            className="border-[#DCE5FF] bg-white text-[#2F66F6]"
          />
        ) : null}

        {!loading && filteredActivities.length > 0 ? (
          <>
            <section className={`${SURFACE_CLASS} overflow-hidden lg:hidden`}>
              {filteredActivities.map((activity, index) => {
                const typeMeta = getProductTypeMeta(activity?.product_type);
                const TypeIcon = typeMeta.icon;

                return (
                  <article
                    key={`${activity?.product_id}-${activity?.updated_at}-${index}`}
                    className="border-b border-slate-200 last:border-b-0"
                  >
                    <div className="px-2 py-3 sm:px-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center border border-current/10 ${typeMeta.frameClassName}`}
                          >
                            <TypeIcon />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {activity?.product_name || "Unnamed product"}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>{formatProductType(activity?.product_type)}</span>
                              <span className="text-slate-300">/</span>
                              <span>#{activity?.product_id || "-"}</span>
                            </div>
                          </div>
                        </div>
                        <StatusBadge published={Boolean(activity?.is_published)} />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Updated By
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-slate-700">
                            <div className="flex h-7 w-7 items-center justify-center bg-violet-50 text-[11px] font-bold text-violet-600">
                              {getUserInitials(activity?.user_name)}
                            </div>
                            <span className="truncate font-medium">
                              {activity?.user_name || "Not assigned"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Last Updated
                          </p>
                          <p
                            className="mt-1 font-medium text-slate-700"
                            title={formatFullDate(activity?.updated_at)}
                          >
                            {formatRelativeDate(activity?.updated_at)}
                          </p>
                        </div>

                        <div className="col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Contact
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-slate-600">
                            <FaEnvelope className="text-xs text-slate-400" />
                            <span className="truncate">
                              {activity?.email || "No email available"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className={`${SURFACE_CLASS} hidden overflow-hidden lg:block`}>
              <div className="border-b border-slate-200 px-4 py-3 lg:px-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Recent Activity Timeline
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Latest publish and draft changes across your product catalog
                    </p>
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Showing {filteredActivities.length} visible updates
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left lg:px-5">
                        <SortableHeader
                          label="Product"
                          active={sortConfig.key === "product_name"}
                          direction={sortConfig.direction}
                          onClick={() => handleSort("product_name")}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <SortableHeader
                          label="Type"
                          active={sortConfig.key === "product_type"}
                          direction={sortConfig.direction}
                          onClick={() => handleSort("product_type")}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <SortableHeader
                          label="Status"
                          active={sortConfig.key === "is_published"}
                          direction={sortConfig.direction}
                          onClick={() => handleSort("is_published")}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <SortableHeader
                          label="Updated By"
                          active={sortConfig.key === "user_name"}
                          direction={sortConfig.direction}
                          onClick={() => handleSort("user_name")}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <SortableHeader
                          label="Last Updated"
                          active={sortConfig.key === "updated_at"}
                          direction={sortConfig.direction}
                          onClick={() => handleSort("updated_at")}
                        />
                      </th>
                      <th className="px-4 py-3 text-left lg:px-5">
                        <SortableHeader
                          label="Product ID"
                          active={sortConfig.key === "product_id"}
                          direction={sortConfig.direction}
                          onClick={() => handleSort("product_id")}
                        />
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredActivities.map((activity, index) => {
                      const typeMeta = getProductTypeMeta(activity?.product_type);
                      const TypeIcon = typeMeta.icon;

                      return (
                        <tr
                          key={`${activity?.product_id}-${activity?.updated_at}-${index}`}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 align-top lg:px-5">
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center border border-current/10 ${typeMeta.frameClassName}`}
                              >
                                <TypeIcon />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {activity?.product_name || "Unnamed product"}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {activity?.email || "No email available"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-sm font-medium text-slate-700">
                              {formatProductType(activity?.product_type)}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <StatusBadge published={Boolean(activity?.is_published)} />
                          </td>

                          <td className="px-4 py-4 align-top">
                            {activity?.user_name ? (
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center bg-violet-50 text-[11px] font-bold text-violet-600">
                                  {getUserInitials(activity.user_name)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {activity.user_name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {activity.email || "No email available"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm italic text-slate-500">
                                Not assigned
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p
                              className="text-sm font-medium text-slate-900"
                              title={formatFullDate(activity?.updated_at)}
                            >
                              {formatRelativeDate(activity?.updated_at)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatTimeOnly(activity?.updated_at)}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top lg:px-5">
                            <span className="text-sm font-semibold text-slate-700">
                              #{activity?.product_id || "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <section className={`${SURFACE_CLASS} px-4 py-4 lg:px-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Activity by Product Type
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Distribution across the currently visible activity set
                    </p>
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    {filteredBaseActivities.length} updates
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {typeDistribution.map((entry) => {
                    const typeMeta = getProductTypeMeta(entry.type);
                    const TypeIcon = typeMeta.icon;

                    return (
                      <div key={entry.type} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span
                              className={`flex h-8 w-8 items-center justify-center border border-current/10 ${typeMeta.frameClassName}`}
                            >
                              <TypeIcon className="text-sm" />
                            </span>
                            <span>{formatProductType(entry.type)}</span>
                          </div>
                          <div className="text-sm text-slate-500">
                            {entry.count} ({entry.percentage}%)
                          </div>
                        </div>

                        <div className="h-2 overflow-hidden bg-slate-100">
                          <div
                            className="h-full bg-[#345CFF]"
                            style={{ width: `${entry.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={`${SURFACE_CLASS} px-4 py-4 lg:px-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Latest Visible Updates
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Freshest changes after the active filters are applied
                    </p>
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    {timelineActivities.length} items
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {timelineActivities.map((activity, index) => {
                    const typeMeta = getProductTypeMeta(activity?.product_type);
                    const TypeIcon = typeMeta.icon;

                    return (
                      <div
                        key={`${activity?.product_id}-${activity?.updated_at}-${index}`}
                        className="border border-slate-200 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center border border-current/10 ${typeMeta.frameClassName}`}
                            >
                              <TypeIcon className="text-sm" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {activity?.product_name || "Unnamed product"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatProductType(activity?.product_type)} / #
                                {activity?.product_id || "-"}
                              </p>
                            </div>
                          </div>
                          <StatusBadge published={Boolean(activity?.is_published)} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                          <span>
                            By {activity?.user_name || "Not assigned"}
                          </span>
                          <span>{formatRelativeDate(activity?.updated_at)}</span>
                          <span>{formatTimeOnly(activity?.updated_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default RecentPublishActivity;
