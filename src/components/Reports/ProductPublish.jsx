import React, { useState, useEffect, useMemo, useCallback } from "react";
import CountUp from "react-countup";
import {
  FaChartPie,
  FaMobileAlt,
  FaLaptop,
  FaTv,
  FaNetworkWired,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimes,
  FaGlobe,
  FaEdit,
  FaSyncAlt,
  FaEye,
  FaListUl,
  FaTable,
  FaQuestionCircle,
  FaHeadphones,
  FaCube,
  FaClock,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../../api";

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-5 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.05),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] px-2 py-3 sm:px-3 md:px-4";
const SURFACE_CLASS =
  "overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_20px_55px_-40px_rgba(15,23,42,0.22)]";
const PANEL_CLASS =
  "rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_55px_-42px_rgba(15,23,42,0.2)]";
const BUTTON_BASE_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY_BUTTON_CLASS = `${BUTTON_BASE_CLASS} border-[#245CFF] bg-[#245CFF] text-white hover:bg-[#174ee9]`;
const GHOST_BUTTON_CLASS = `${BUTTON_BASE_CLASS} border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50`;
const TOGGLE_WRAPPER_CLASS =
  "inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_14px_38px_-34px_rgba(15,23,42,0.24)]";

const numberFormatter = new Intl.NumberFormat("en-US");

const PRODUCT_TYPE_META = {
  smartphone: {
    label: "Smartphones",
    icon: FaMobileAlt,
    iconClassName: "border-blue-100 bg-blue-50 text-blue-600",
  },
  laptop: {
    label: "Laptops",
    icon: FaLaptop,
    iconClassName: "border-violet-100 bg-violet-50 text-violet-600",
  },
  tv: {
    label: "TVs & Appliances",
    icon: FaTv,
    iconClassName: "border-cyan-100 bg-cyan-50 text-cyan-600",
  },
  home_appliance: {
    label: "TVs & Appliances",
    icon: FaTv,
    iconClassName: "border-cyan-100 bg-cyan-50 text-cyan-600",
  },
  networking: {
    label: "Networking",
    icon: FaNetworkWired,
    iconClassName: "border-orange-100 bg-orange-50 text-orange-600",
  },
  accessories: {
    label: "Accessories",
    icon: FaHeadphones,
    iconClassName: "border-indigo-100 bg-indigo-50 text-indigo-600",
  },
};

const LEGEND_ITEMS = [
  {
    label: "Excellent",
    threshold: "75% and above",
    note: "Strong publication health",
    dotClassName: "bg-emerald-500",
  },
  {
    label: "Good",
    threshold: "50% to 74%",
    note: "Good coverage, room to grow",
    dotClassName: "bg-blue-500",
  },
  {
    label: "Needs Work",
    threshold: "25% to 49%",
    note: "Needs improvement",
    dotClassName: "bg-amber-500",
  },
  {
    label: "Critical",
    threshold: "Below 25%",
    note: "Immediate attention needed",
    dotClassName: "bg-rose-500",
  },
];

const normalizeCount = (value) => {
  const parsed = Number.parseInt(value ?? 0, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCount = (value) => numberFormatter.format(normalizeCount(value));

const getDecimalCount = (value) => (Number.isInteger(value) ? 0 : 1);

const formatTimestamp = (value) => {
  if (!value) return "Not available";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const calculatePercentageValue = (part, total) => {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
};

const getProductTypeMeta = (type) => {
  const key = String(type || "").toLowerCase();
  const meta = PRODUCT_TYPE_META[key];
  if (meta) return meta;

  return {
    label: String(type || "Other")
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    icon: FaCube,
    iconClassName: "border-slate-200 bg-slate-50 text-slate-500",
  };
};

const getStatusConfig = (percentage) => {
  if (percentage >= 75) {
    return {
      label: "Excellent",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      progressClassName: "bg-emerald-500",
      dotClassName: "bg-emerald-500",
    };
  }

  if (percentage >= 50) {
    return {
      label: "Good",
      badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
      progressClassName: "bg-blue-500",
      dotClassName: "bg-blue-500",
    };
  }

  if (percentage >= 25) {
    return {
      label: "Needs Work",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      progressClassName: "bg-amber-500",
      dotClassName: "bg-amber-500",
    };
  }

  return {
    label: "Critical",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    progressClassName: "bg-rose-500",
    dotClassName: "bg-rose-500",
  };
};

const ToastCard = ({ toast, onDismiss }) => (
  <div
    className={`flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.32)] ${
      toast.type === "success"
        ? "border-emerald-200 bg-emerald-50"
        : toast.type === "error"
          ? "border-rose-200 bg-rose-50"
          : "border-blue-200 bg-blue-50"
    }`}
  >
    <div className="mt-0.5">
      {toast.type === "success" ? (
        <FaCheckCircle className="text-emerald-500" />
      ) : toast.type === "error" ? (
        <FaExclamationCircle className="text-rose-500" />
      ) : (
        <FaGlobe className="text-blue-500" />
      )}
    </div>
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
);

const OverviewCard = ({
  title,
  value,
  suffix,
  supporting,
  accent,
  icon: Icon,
  iconClassName,
  ringPercentage,
}) => (
  <article className={`${SURFACE_CLASS} p-5`}>
    <div className="flex items-center gap-4">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border ${
          iconClassName || "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        {typeof ringPercentage === "number" ? (
          <div
            className="grid h-14 w-14 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#245CFF ${Math.max(
                0,
                Math.min(100, ringPercentage),
              )}%, #E6EAF2 0)`,
            }}
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-[10px] font-semibold text-[#245CFF]">
              {`${Number(ringPercentage).toFixed(getDecimalCount(ringPercentage))}%`}
            </div>
          </div>
        ) : Icon ? (
          <Icon className="text-[1.75rem]" />
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-950">
          <CountUp
            end={value}
            duration={1.2}
            decimals={getDecimalCount(value)}
            suffix={suffix || ""}
          />
        </p>
        <p className="mt-1 text-sm text-slate-500">{supporting}</p>
        {accent ? (
          <p className="mt-1 text-xs font-medium text-slate-400">{accent}</p>
        ) : null}
      </div>
    </div>
  </article>
);

const ReportBanner = ({
  icon: Icon,
  title,
  description,
  className,
  actionLabel,
  onAction,
}) => (
  <section className={`rounded-[22px] border px-4 py-4 sm:px-5 ${className}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-lg">
          <Icon />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm opacity-90">{description}</p>
        </div>
      </div>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-current/20 bg-white px-4 text-sm font-semibold"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  </section>
);

const ProductTypeCard = ({ item }) => {
  const total = normalizeCount(item.total);
  const published = normalizeCount(item.published);
  const drafts = normalizeCount(item.drafts);
  const publishPercentage = calculatePercentageValue(published, total);
  const draftPercentage = calculatePercentageValue(drafts, total);
  const status = getStatusConfig(publishPercentage);
  const meta = getProductTypeMeta(item.product_type);
  const Icon = meta.icon;

  return (
    <article className={`${PANEL_CLASS} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-xl ${meta.iconClassName}`}
          >
            <Icon />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-slate-950">
              {meta.label}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Total Products</p>
            <p className="mt-1 text-[2rem] font-semibold tracking-tight text-slate-950">
              <CountUp end={total} duration={1.1} />
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${status.badgeClassName}`}
        >
          <CountUp
            end={publishPercentage}
            duration={1}
            decimals={getDecimalCount(publishPercentage)}
            suffix="%"
          />
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-600">Published</span>
            <span className="font-semibold text-slate-900">
              {formatCount(published)} ({publishPercentage}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${status.progressClassName}`}
              style={{ width: `${Math.min(100, publishPercentage)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-600">Drafts</span>
            <span className="font-semibold text-slate-900">
              {formatCount(drafts)} ({draftPercentage}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${Math.min(100, draftPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            <FaEye className="text-sm" />
            Published
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatCount(published)}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
            <FaEdit className="text-sm" />
            Drafts
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatCount(drafts)}
          </p>
        </div>
      </div>
    </article>
  );
};

const ProductPublishStatusReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [viewMode, setViewMode] = useState("cards");
  const [lastUpdated, setLastUpdated] = useState(null);

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
      const token = Cookies.get("authToken");
      const response = await fetch(buildUrl("/api/reports/publish-status"), {
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
      const normalized = Array.isArray(data.publish_by_type)
        ? data.publish_by_type
        : [];

      setReportData(normalized);
      setLastUpdated(new Date());
      showToast("Success", "Publish status loaded successfully", "success");
    } catch (requestError) {
      console.error("Failed to fetch report:", requestError);
      setError(requestError.message || "Failed to load publish status data");
      showToast("Error", "Failed to load publish status", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const totals = useMemo(
    () =>
      reportData.reduce(
        (accumulator, item) => {
          accumulator.total += normalizeCount(item.total);
          accumulator.published += normalizeCount(item.published);
          accumulator.drafts += normalizeCount(item.drafts);
          return accumulator;
        },
        { total: 0, published: 0, drafts: 0 },
      ),
    [reportData],
  );

  const overallPublishPercentage = useMemo(
    () => calculatePercentageValue(totals.published, totals.total),
    [totals.published, totals.total],
  );

  const overallDraftPercentage = useMemo(
    () => calculatePercentageValue(totals.drafts, totals.total),
    [totals.drafts, totals.total],
  );

  const overviewCards = useMemo(
    () => [
      {
        title: "Overall Publish Rate",
        value: overallPublishPercentage,
        suffix: "%",
        supporting: "Across all product types",
        accent: `${formatCount(totals.published)} of ${formatCount(totals.total)} products`,
        ringPercentage: overallPublishPercentage,
      },
      {
        title: "Published Products",
        value: totals.published,
        supporting: "Products are live and visible",
        accent: `${overallPublishPercentage}% of total catalog`,
        icon: FaEye,
        iconClassName: "border-emerald-100 bg-emerald-50 text-emerald-600",
      },
      {
        title: "Draft Products",
        value: totals.drafts,
        supporting: "Products in draft mode",
        accent: `${overallDraftPercentage}% of total catalog`,
        icon: FaEdit,
        iconClassName: "border-amber-100 bg-amber-50 text-amber-600",
      },
      {
        title: "Total Products",
        value: totals.total,
        supporting: "Across all product types",
        accent: `${reportData.length} product types tracked`,
        icon: FaChartPie,
        iconClassName: "border-violet-100 bg-violet-50 text-violet-600",
      },
    ],
    [
      overallDraftPercentage,
      overallPublishPercentage,
      reportData.length,
      totals.drafts,
      totals.published,
      totals.total,
    ],
  );

  return (
    <div className={PAGE_CLASS}>
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>

      <section className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.25rem]">
              Product Publish Status
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Track publication status across all product types
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
            <div className={TOGGLE_WRAPPER_CLASS}>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                  viewMode === "cards"
                    ? "bg-[#245CFF] text-white shadow-[0_18px_40px_-26px_rgba(36,92,255,0.65)]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FaListUl className="text-sm" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                  viewMode === "table"
                    ? "bg-[#245CFF] text-white shadow-[0_18px_40px_-26px_rgba(36,92,255,0.65)]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FaTable className="text-sm" />
                Table
              </button>
            </div>

            <button
              type="button"
              onClick={fetchReportData}
              disabled={loading}
              className={GHOST_BUTTON_CLASS}
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <OverviewCard key={card.title} {...card} />
        ))}
      </section>

      {error ? (
        <ReportBanner
          icon={FaExclamationCircle}
          title="Error Loading Report"
          description={error}
          actionLabel="Try Again"
          onAction={fetchReportData}
          className="border-rose-200 bg-rose-50 text-rose-700"
        />
      ) : null}

      {loading ? (
        <ReportBanner
          icon={FaSpinner}
          title="Loading publish status"
          description="Fetching the latest product publication data."
          className="border-blue-200 bg-blue-50 text-blue-700"
        />
      ) : null}

      {!loading && reportData.length === 0 ? (
        <section className={`${SURFACE_CLASS} px-5 py-12 text-center sm:px-8`}>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
            <FaChartPie className="text-3xl text-slate-400" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">
            No Publish Status Data
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
            There is no publish status data available right now. Publish some
            products to see the report here.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={fetchReportData}
              className={PRIMARY_BUTTON_CLASS}
            >
              <FaSyncAlt />
              Try Again
            </button>
          </div>
        </section>
      ) : null}

      {!loading && reportData.length > 0 && viewMode === "cards" ? (
        <section className={`${SURFACE_CLASS} p-4 sm:p-5`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Product Type Breakdown
              </h2>
            </div>
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
              {reportData.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {reportData.map((item, index) => (
              <ProductTypeCard
                key={`${item.product_type || "type"}-${index}`}
                item={item}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!loading && reportData.length > 0 && viewMode === "table" ? (
        <section className={SURFACE_CLASS}>
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Publish Status by Product Type
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Detailed breakdown of publication health across every tracked
                  product type
                </p>
              </div>
              <span className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
                {reportData.length} types
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  {[
                    "Product Type",
                    "Total",
                    "Published",
                    "Drafts",
                    "Publish Rate",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {reportData.map((item, index) => {
                  const total = normalizeCount(item.total);
                  const published = normalizeCount(item.published);
                  const drafts = normalizeCount(item.drafts);
                  const publishPercentage = calculatePercentageValue(
                    published,
                    total,
                  );
                  const draftPercentage = calculatePercentageValue(
                    drafts,
                    total,
                  );
                  const status = getStatusConfig(publishPercentage);
                  const meta = getProductTypeMeta(item.product_type);
                  const Icon = meta.icon;

                  return (
                    <tr
                      key={`${item.product_type || "type"}-${index}`}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${meta.iconClassName}`}
                          >
                            <Icon />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">
                              {meta.label}
                            </p>
                            <p className="text-xs text-slate-500">Product type</p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-lg font-semibold text-slate-950">
                        {formatCount(total)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                            <FaEye className="text-sm" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">
                              {formatCount(published)}
                            </p>
                            <p className="text-xs text-slate-500">Published</p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
                            <FaEdit className="text-sm" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">
                              {formatCount(drafts)}
                            </p>
                            <p className="text-xs text-slate-500">Drafts</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="min-w-[220px]">
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="font-semibold text-slate-900">
                              {publishPercentage}%
                            </span>
                            <span className="text-slate-500">
                              {draftPercentage}% drafts
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${status.progressClassName}`}
                              style={{ width: `${Math.min(100, publishPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.badgeClassName}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!loading && reportData.length > 0 ? (
        <section className={`${SURFACE_CLASS} p-4 sm:p-5`}>
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-950">
              Bottom insights
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <article className={`${PANEL_CLASS} p-5`}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                <FaQuestionCircle className="text-slate-400" />
                Status Legend
              </h3>

              <div className="mt-5 space-y-4">
                {LEGEND_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl border border-slate-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${item.dotClassName}`}
                      />
                      <span className="font-semibold text-slate-900">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">{item.threshold}</div>
                    <div />
                    <div className="text-sm text-slate-500">{item.note}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className={`${PANEL_CLASS} p-5`}>
              <h3 className="text-lg font-semibold text-slate-950">
                Summary Statistics
              </h3>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    Overall Publish Rate
                  </span>
                  <span className="text-3xl font-semibold tracking-tight text-slate-950">
                    {overallPublishPercentage}%
                  </span>
                </div>

                <div className="mt-4">
                  <div
                    className="relative h-3 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg,#16a34a 0%,#22c55e 65%,#f59e0b 84%,#ef4444 100%)",
                    }}
                  >
                    <span
                      className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_10px_18px_-12px_rgba(15,23,42,0.4)]"
                      style={{
                        left: `calc(${Math.max(
                          0,
                          Math.min(100, overallPublishPercentage),
                        )}% - 3px)`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <FaEye />
                    Published Products
                  </div>
                  <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
                    {formatCount(totals.published)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {overallPublishPercentage}% of total
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                    <FaEdit />
                    Draft Products
                  </div>
                  <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
                    {formatCount(totals.drafts)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {overallDraftPercentage}% of total
                  </p>
                </div>
              </div>
            </article>

            <article className={`${PANEL_CLASS} p-5`}>
              <h3 className="text-lg font-semibold text-slate-950">
                How This Works
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <FaListUl />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Cards / Table Toggle
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Switch between card view for quick insights or table view
                      for detailed analysis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <FaCheckCircle />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Publish Percentage
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Calculated as Published / Total x 100. Higher percentage
                      means better publication health.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <FaSyncAlt />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Refresh Data</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Click the refresh button to get the latest publication
                      status directly from the server.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {!loading ? (
        <div className="flex items-center justify-center gap-2 pt-2 text-sm text-slate-500">
          <FaClock className="text-slate-400" />
          <span>Report last updated: {formatTimestamp(lastUpdated)}</span>
        </div>
      ) : null}
    </div>
  );
};

export default ProductPublishStatusReport;
