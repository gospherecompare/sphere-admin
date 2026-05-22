import React, { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import {
  FaChartPie,
  FaExclamationCircle,
  FaLaptop,
  FaLayerGroup,
  FaMobileAlt,
  FaNetworkWired,
  FaSpinner,
  FaSyncAlt,
  FaTv,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-5 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.05),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] px-2 py-3 sm:px-3 md:px-4";
const SURFACE_CLASS =
  "overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_20px_55px_-40px_rgba(15,23,42,0.22)]";
const PANEL_CLASS =
  "rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_55px_-42px_rgba(15,23,42,0.2)]";
const BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

const TYPE_META = {
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
    label: "TVs",
    icon: FaTv,
    iconClassName: "border-cyan-100 bg-cyan-50 text-cyan-600",
  },
  homeappliance: {
    label: "Home Appliances",
    icon: FaTv,
    iconClassName: "border-cyan-100 bg-cyan-50 text-cyan-600",
  },
  home_appliance: {
    label: "Home Appliances",
    icon: FaTv,
    iconClassName: "border-cyan-100 bg-cyan-50 text-cyan-600",
  },
  network: {
    label: "Networking",
    icon: FaNetworkWired,
    iconClassName: "border-amber-100 bg-amber-50 text-amber-600",
  },
  networking: {
    label: "Networking",
    icon: FaNetworkWired,
    iconClassName: "border-amber-100 bg-amber-50 text-amber-600",
  },
};

const formatCount = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

const normalizeRegistryCategory = (row = {}) => {
  const type = String(row.product_type || row.type || "")
    .trim()
    .toLowerCase();

  return {
    id:
      row.id ||
      row.category_id ||
      `${type || "unknown"}-${String(row.name || "category").toLowerCase()}`,
    name: String(row.name || "").trim() || "Untitled category",
    product_type: type || "smartphone",
    description: String(row.description || "").trim(),
    created_at: row.created_at || row.updated_at || "",
  };
};

const normalizeReportBucket = (row = {}) => ({
  category: String(row.category || "").trim() || "Uncategorized",
  count: Number(row.count || 0) || 0,
});

const normalizeTotalRow = (row = {}) => {
  const type = String(row.product_type || "")
    .trim()
    .toLowerCase();

  return {
    product_type: type || "unknown",
    count: Number(row.count || 0) || 0,
  };
};

const getTypeMeta = (type) =>
  TYPE_META[String(type || "").trim().toLowerCase()] || {
    label: type || "Other",
    icon: FaLayerGroup,
    iconClassName: "border-slate-100 bg-slate-50 text-slate-600",
  };

const EmptyState = ({ label }) => (
  <div className="flex min-h-[180px] items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
    {label}
  </div>
);

const ProductCategoryReport = () => {
  const [registryCategories, setRegistryCategories] = useState([]);
  const [categoryBuckets, setCategoryBuckets] = useState([]);
  const [productTypeTotals, setProductTypeTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  const authHeaders = useMemo(() => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    let active = true;

    const loadReport = async (silent = false) => {
      if (!active) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const [categoriesResponse, reportResponse] = await Promise.all([
          fetch(buildUrl("/api/categories"), {
            headers: authHeaders,
          }),
          fetch(buildUrl("/api/reports/products-by-category"), {
            headers: authHeaders,
          }),
        ]);

        const categoriesData = await categoriesResponse.json().catch(() => ({}));
        const reportData = await reportResponse.json().catch(() => ({}));

        if (!categoriesResponse.ok) {
          throw new Error(
            categoriesData?.message || "Failed to load category registry",
          );
        }

        if (!reportResponse.ok) {
          throw new Error(
            reportData?.message || "Failed to load category report",
          );
        }

        if (!active) return;

        const registryRows = Array.isArray(categoriesData)
          ? categoriesData
          : Array.isArray(categoriesData?.categories)
            ? categoriesData.categories
            : [];

        setRegistryCategories(
          registryRows.map(normalizeRegistryCategory).sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        );
        setCategoryBuckets(
          Array.isArray(reportData?.categories)
            ? reportData.categories.map(normalizeReportBucket)
            : [],
        );
        setProductTypeTotals(
          Array.isArray(reportData?.totals)
            ? reportData.totals.map(normalizeTotalRow)
            : [],
        );
        setLastUpdatedAt(new Date().toISOString());
      } catch (requestError) {
        if (!active) return;
        setError(requestError?.message || "Failed to load product category report");
        setRegistryCategories([]);
        setCategoryBuckets([]);
        setProductTypeTotals([]);
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadReport();

    return () => {
      active = false;
    };
  }, [authHeaders]);

  const registryByType = useMemo(() => {
    return registryCategories.reduce((acc, category) => {
      const key = category.product_type || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [registryCategories]);

  const topBucket = categoryBuckets[0] || null;
  const totalTrackedProducts = useMemo(
    () => productTypeTotals.reduce((sum, row) => sum + Number(row.count || 0), 0),
    [productTypeTotals],
  );

  const summaryCards = useMemo(
    () => [
      {
        label: "Category Registry",
        value: registryCategories.length,
        tone: "from-blue-500 via-sky-500 to-cyan-500",
        hint: "Saved categories available across product forms",
        icon: FaLayerGroup,
      },
      {
        label: "Tracked Products",
        value: totalTrackedProducts,
        tone: "from-violet-500 via-fuchsia-500 to-pink-500",
        hint: "Products counted in the live products table",
        icon: FaChartPie,
      },
      {
        label: "Top Smartphone Bucket",
        value: topBucket?.count || 0,
        tone: "from-emerald-500 via-teal-500 to-cyan-500",
        hint: topBucket?.category || "No smartphone category data yet",
        icon: FaMobileAlt,
      },
      {
        label: "Smartphone Categories",
        value: registryByType.smartphone || 0,
        tone: "from-amber-500 via-orange-500 to-rose-500",
        hint: "Registered smartphone category definitions",
        icon: FaMobileAlt,
      },
    ],
    [registryCategories.length, registryByType.smartphone, topBucket, totalTrackedProducts],
  );

  const lastUpdatedLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(lastUpdatedAt))
    : "Not refreshed yet";

  return (
    <div className={PAGE_CLASS}>
      <section className={`${SURFACE_CLASS} px-4 py-5 sm:px-6 sm:py-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              Category Analytics
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Product Category Report
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Track the category registry alongside the live product counts so we can
                quickly spot sparse coverage, uncategorized inventory, and category growth.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">Last updated</div>
              <div className="mt-1">{lastUpdatedLabel}</div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              disabled={loading || refreshing}
              className={BUTTON_CLASS}
            >
              {refreshing ? (
                <FaSpinner className="animate-spin text-sm" />
              ) : (
                <FaSyncAlt className="text-sm" />
              )}
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <section className={`${PANEL_CLASS} px-4 py-5 sm:px-6`}>
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
            <FaExclamationCircle className="mt-0.5 shrink-0 text-lg" />
            <div>
              <p className="font-semibold">Unable to load the category report</p>
              <p className="mt-1 text-sm leading-6">{error}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, hint, tone, icon }) => (
          <article
            key={label}
            className={`${PANEL_CLASS} overflow-hidden border-none text-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.45)]`}
          >
            <div className={`bg-gradient-to-br ${tone} p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                    {label}
                  </p>
                  <div className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                    <CountUp end={Number(value || 0)} duration={1.1} separator="," />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                  {React.createElement(icon, { className: "text-xl" })}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/85">{hint}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr,0.9fr]">
        <article className={PANEL_CLASS}>
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <h2 className="text-lg font-bold text-slate-900">
              Smartphone Products By Category
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Live grouping from the smartphone inventory table.
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <EmptyState label="Loading category distribution..." />
            ) : categoryBuckets.length === 0 ? (
              <EmptyState label="No smartphone category data is available yet." />
            ) : (
              <div className="space-y-3">
                {categoryBuckets.map((bucket, index) => {
                  const share =
                    totalTrackedProducts > 0
                      ? Math.max(
                          4,
                          Math.round((bucket.count / Math.max(totalTrackedProducts, 1)) * 100),
                        )
                      : 0;

                  return (
                    <div
                      key={`${bucket.category}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {bucket.category}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                            Smartphone bucket
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-slate-900">
                            {formatCount(bucket.count)}
                          </div>
                          <div className="text-xs text-slate-500">products</div>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500"
                          style={{ width: `${Math.min(share, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </article>

        <article className={PANEL_CLASS}>
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <h2 className="text-lg font-bold text-slate-900">Products By Type</h2>
            <p className="mt-1 text-sm text-slate-500">
              Overall tracked product totals across device families.
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <EmptyState label="Loading product type totals..." />
            ) : productTypeTotals.length === 0 ? (
              <EmptyState label="No product totals are available yet." />
            ) : (
              <div className="space-y-3">
                {productTypeTotals.map((row) => {
                  const meta = getTypeMeta(row.product_type);
                  const Icon = meta.icon;

                  return (
                    <div
                      key={row.product_type}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${meta.iconClassName}`}
                        >
                          <Icon className="text-lg" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {meta.label}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                            Product type
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900">
                          {formatCount(row.count)}
                        </div>
                        <div className="text-xs text-slate-500">products</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className={PANEL_CLASS}>
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900">Category Registry</h2>
          <p className="mt-1 text-sm text-slate-500">
            Admin-defined categories currently available for product entry workflows.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <EmptyState label="Loading category registry..." />
          ) : registryCategories.length === 0 ? (
            <EmptyState label="No saved categories are available yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {registryCategories.map((category) => {
                    const meta = getTypeMeta(category.product_type);
                    const Icon = meta.icon;

                    return (
                      <tr key={category.id} className="align-top">
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {category.name}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.iconClassName}`}
                          >
                            <Icon className="text-xs" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {category.description || "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {category.created_at
                            ? new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }).format(new Date(category.created_at))
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductCategoryReport;
