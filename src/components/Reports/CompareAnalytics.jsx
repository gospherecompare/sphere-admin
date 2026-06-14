import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaExternalLinkAlt,
  FaFilter,
  FaLink,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const SITE_ORIGIN = "https://tryhook.shop";
const RETENTION_DAYS = 548;
const PUBLIC_WINDOW_DAYS = 180;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatNumber = (value) =>
  toNumber(value).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDatePart = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTimePart = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const DateTimeStack = ({ value }) => {
  const date = formatDatePart(value);
  const time = formatTimePart(value);

  if (date === "-") return <span>-</span>;

  return (
    <span className="inline-flex flex-col leading-5">
      <span>{date}</span>
      {time ? <span>{time}</span> : null}
    </span>
  );
};

const normalizeText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeProduct = (product = {}) => {
  const productId = Number(product.product_id ?? product.id);
  return {
    product_id: Number.isInteger(productId) ? productId : null,
    product_name: normalizeText(product.product_name || product.name || "Device"),
    product_type: normalizeText(product.product_type || "unknown").toLowerCase(),
    brand_name: normalizeText(product.brand_name || product.brand || ""),
    image_url: product.image_url || product.image || "",
    best_price: toNumber(product.best_price ?? product.price, null),
    launch_date: product.launch_date || null,
    detail_path: product.detail_path || "",
  };
};

const normalizeCompareRow = (row = {}) => {
  const products = (Array.isArray(row.products) ? row.products : [])
    .map(normalizeProduct)
    .filter((product) => product.product_id);
  const productIds = Array.isArray(row.product_ids)
    ? row.product_ids.map(Number).filter((value) => Number.isInteger(value))
    : products.map((product) => product.product_id);
  const groupKey =
    row.group_key ||
    productIds
      .slice()
      .sort((left, right) => left - right)
      .join("-");
  const productTypes = Array.from(
    new Set(products.map((product) => product.product_type).filter(Boolean)),
  );

  return {
    groupKey,
    productIds,
    products,
    productCount: toNumber(row.product_count ?? products.length),
    compareCount: toNumber(row.compare_count_180d ?? row.compare_count),
    uniqueUsers: toNumber(row.unique_users_180d ?? row.unique_users),
    firstComparedAt: row.first_compared_at || null,
    lastComparedAt: row.last_compared_at || null,
    aliveDate: row.alive_date || row.alive_at || row.last_compared_at || null,
    deadDate: row.dead_date || row.dead_at || null,
    launchDate: row.latest_launch_date || row.launch_date || null,
    oldestLaunchDate: row.oldest_launch_date || null,
    isAlive: Boolean(row.is_alive),
    comparePageId: row.compare_page_id || row.comparePageId || null,
    routePath: normalizeText(row.route_path || row.routePath),
    title: normalizeText(row.title || "User compare group"),
    status: normalizeText(row.status || "not_created").toLowerCase(),
    source: normalizeText(row.source || "user_compare").toLowerCase(),
    canCreatePage: Boolean(row.can_create_page || row.canCreatePage),
    productTypes,
    productTypeLabel: productTypes.length ? productTypes.join(", ") : "unknown",
  };
};

const ProductStack = ({ products = [] }) => (
  <div className="flex -space-x-2">
    {products.slice(0, 4).map((product) => (
      <div
        key={product.product_id}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-sm border border-white bg-slate-100"
        title={product.product_name}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-xs font-bold text-slate-500">
            {product.product_name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
    ))}
  </div>
);

const LifecyclePill = ({ alive }) => (
  <span
    className={`inline-flex rounded-sm px-2.5 py-1 text-[11px] font-semibold ${
      alive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
    }`}
  >
    {alive ? "Alive" : "Expired"}
  </span>
);

const PageStatusPill = ({ status, hasPage }) => {
  if (!hasPage) {
    return (
      <span className="inline-flex rounded-sm bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
        No page
      </span>
    );
  }

  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex rounded-sm px-2.5 py-1 text-[11px] font-semibold ${
        isPublished
          ? "bg-blue-50 text-[#155BFF]"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {isPublished ? "Published" : "Draft"}
    </span>
  );
};

const TimelineItem = ({ label, value, dateOnly = false }) => (
  <div className="rounded-sm border border-slate-100 bg-white px-3 py-2">
    <p className="text-[11px] font-semibold text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-xs font-semibold leading-5 text-slate-800">
      {dateOnly ? formatDate(value) : formatDateTime(value)}
    </p>
  </div>
);

const DemandMetric = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-semibold text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-lg font-bold text-slate-950">{formatNumber(value)}</p>
  </div>
);

const UserCompareManager = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const authHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const loadRows = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const response = await fetch(
          buildUrl(`/api/admin/user-compares?days=${RETENTION_DAYS}&limit=500`),
          { headers: authHeaders() },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || `HTTP ${response.status}`);
        }

        const nextRows = Array.isArray(data?.user_compares)
          ? data.user_compares.map(normalizeCompareRow)
          : [];
        setRows(nextRows);
      } catch (err) {
        setError(err?.message || "Failed to load user compares");
        setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authHeaders],
  );

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (typeFilter !== "all" && !row.productTypes.includes(typeFilter)) {
          return false;
        }
        if (statusFilter === "alive" && !row.isAlive) return false;
        if (statusFilter === "expired" && row.isAlive) return false;
        if (statusFilter === "with_page" && !row.comparePageId) return false;
        if (statusFilter === "without_page" && row.comparePageId) return false;
        if (!query) return true;
        const productNames = row.products
          .map((product) => product.product_name)
          .join(" ");
        return `${row.title} ${row.routePath} ${row.productTypeLabel} ${productNames}`
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => {
        const countDiff = right.compareCount - left.compareCount;
        if (countDiff !== 0) return countDiff;
        return (
          new Date(right.lastComparedAt || 0).getTime() -
          new Date(left.lastComparedAt || 0).getTime()
        );
      });
  }, [rows, search, statusFilter, typeFilter]);

  const availableTypes = useMemo(
    () =>
      Array.from(new Set(rows.flatMap((row) => row.productTypes)))
        .filter(Boolean)
        .sort(),
    [rows],
  );

  const summary = useMemo(() => {
    const totalCompares = rows.reduce((sum, row) => sum + row.compareCount, 0);
    const totalUniqueUsers = rows.reduce((sum, row) => sum + row.uniqueUsers, 0);
    const aliveRows = rows.filter((row) => row.isAlive).length;
    const pageRows = rows.filter((row) => row.comparePageId).length;

    return [
      { label: "User Compare Sets", value: rows.length },
      { label: "Stored Window", value: `${RETENTION_DAYS}d` },
      { label: "Public Window", value: `${PUBLIC_WINDOW_DAYS}d` },
      { label: "Total Compares", value: totalCompares },
      { label: "Unique Users", value: totalUniqueUsers },
      { label: "Alive Sets", value: aliveRows },
      { label: "Pages Created", value: pageRows },
    ];
  }, [rows]);

  const saveComparePage = useCallback(
    async (row) => {
      if (!row.comparePageId && !row.canCreatePage) {
        setError("This compare set cannot create a dynamic page yet.");
        return;
      }

      const nowIso = new Date().toISOString();
      setActionKey(row.groupKey);
      setError("");
      setNotice("");

      try {
        const endpoint = row.comparePageId
          ? `/api/admin/compare-pages/${row.comparePageId}`
          : "/api/admin/compare-pages";
        const response = await fetch(buildUrl(endpoint), {
          method: row.comparePageId ? "PUT" : "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            items: row.products,
            product_ids: row.productIds,
            status: "published",
            source: "manual",
            generation_reason: "User Compare Manager",
            manual_compare_count: row.compareCount,
            last_compared_at: nowIso,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || `HTTP ${response.status}`);
        }

        setNotice(
          row.comparePageId
            ? "Compare page refreshed and kept alive."
            : "Compare page created from user compare data.",
        );
        await loadRows({ silent: true });
      } catch (err) {
        setError(err?.message || "Failed to save compare page");
      } finally {
        setActionKey("");
      }
    },
    [authHeaders, loadRows],
  );

  return (
    <div className="mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 text-slate-900 sm:px-3 md:px-4">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white p-5 shadow-none sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#155BFF]">
                Compare Intelligence
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">
                User Compare Manager
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Manage real user comparison sets. The system stores compare
                history for {RETENTION_DAYS} days, while public popularity
                widgets use the latest {PUBLIC_WINDOW_DAYS} days.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/settings/compare-pages"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <FaLink />
                Compare Pages
              </Link>
              <button
                type="button"
                onClick={() => loadRows({ silent: true })}
                disabled={refreshing}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white shadow-none transition hover:bg-[#3f2fd0] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {refreshing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSyncAlt />
                )}
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-none"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {typeof item.value === "number" ? formatNumber(item.value) : item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-none">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
                <FaFilter className="text-[#155BFF]" />
                User Compare Sets
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Includes pair and group comparisons. Alive date follows last
                compared date; dead date is calculated from the public window.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 xl:w-[720px]">
              <label className="relative block">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products..."
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#155BFF]"
                />
              </label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#155BFF]"
              >
                <option value="all">All product types</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#155BFF]"
              >
                <option value="all">All lifecycle</option>
                <option value="alive">Alive only</option>
                <option value="expired">Expired only</option>
                <option value="with_page">With page</option>
                <option value="without_page">Without page</option>
              </select>
            </div>
          </div>

          {notice ? (
            <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <FaCheckCircle />
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-[1580px] w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                  <th className="w-[250px] px-4 py-3">Compare Set</th>
                  <th className="w-[240px] px-4 py-3">Products</th>
                  <th className="w-[120px] px-4 py-3">Type</th>
                  <th className="w-[95px] px-4 py-3">Compares</th>
                  <th className="w-[105px] px-4 py-3">Unique Users</th>
                  <th className="w-[120px] px-4 py-3">Launch Date</th>
                  <th className="w-[150px] px-4 py-3">First Compared</th>
                  <th className="w-[150px] px-4 py-3">Last Compared</th>
                  <th className="w-[150px] px-4 py-3">Alive Date</th>
                  <th className="w-[120px] px-4 py-3">Dead Date</th>
                  <th className="w-[100px] px-4 py-3">Lifecycle</th>
                  <th className="w-[110px] px-4 py-3">Page</th>
                  <th className="w-[150px] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="13" className="px-4 py-12 text-center">
                      <FaSpinner className="mx-auto animate-spin text-2xl text-[#155BFF]" />
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan="13"
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      No user compare data found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const actionDisabled =
                      actionKey === row.groupKey ||
                      (!row.comparePageId && !row.canCreatePage);
                    const actionLabel = row.comparePageId
                      ? row.status === "published"
                        ? "Refresh Alive"
                        : "Make Live"
                      : row.canCreatePage
                        ? "Create Page"
                        : "Analytics Only";

                    return (
                      <tr
                        key={row.groupKey}
                        className="border-b border-slate-200 align-top transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-5">
                          <div className="flex items-start gap-3">
                            <ProductStack products={row.products} />
                            <div className="min-w-0">
                              <p className="break-words font-semibold leading-5 text-slate-950">
                                {row.products
                                  .map((product) => product.product_name)
                                  .join(" vs ")}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {row.productCount} products
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <div className="space-y-2">
                            {row.products.map((product) => (
                              <div
                                key={product.product_id}
                                className="text-slate-800"
                              >
                                <p className="break-words font-semibold leading-5 text-slate-800">
                                  {product.product_name}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {product.brand_name || "Brand not set"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-5 capitalize text-slate-700">
                          {row.productTypeLabel}
                        </td>
                        <td className="px-4 py-5 font-bold text-slate-950">
                          {formatNumber(row.compareCount)}
                        </td>
                        <td className="px-4 py-5 font-bold text-slate-950">
                          {formatNumber(row.uniqueUsers)}
                        </td>
                        <td className="px-4 py-5 leading-5 text-slate-700">
                          {formatDate(row.launchDate)}
                        </td>
                        <td className="px-4 py-5 leading-5 text-slate-700">
                          <DateTimeStack value={row.firstComparedAt} />
                        </td>
                        <td className="px-4 py-5 leading-5 text-slate-700">
                          <DateTimeStack value={row.lastComparedAt} />
                        </td>
                        <td className="px-4 py-5 leading-5 text-slate-700">
                          <DateTimeStack value={row.aliveDate} />
                        </td>
                        <td className="px-4 py-5 leading-5 text-slate-700">
                          {formatDate(row.deadDate)}
                        </td>
                        <td className="px-4 py-5">
                          <LifecyclePill alive={row.isAlive} />
                        </td>
                        <td className="px-4 py-5">
                          <PageStatusPill
                            status={row.status}
                            hasPage={Boolean(row.comparePageId)}
                          />
                        </td>
                        <td className="px-4 py-5 text-right">
                          <div className="flex flex-col items-end gap-2">
                            {row.routePath ? (
                              <a
                                href={`${SITE_ORIGIN}${row.routePath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 min-w-[112px] items-center justify-center gap-2 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-[#155BFF] transition hover:bg-slate-50"
                              >
                                <FaExternalLinkAlt />
                                Open
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => saveComparePage(row)}
                              disabled={actionDisabled}
                              className="inline-flex h-9 min-w-[112px] items-center justify-center gap-2 rounded-sm bg-[#155BFF] px-3 text-xs font-semibold text-white transition hover:bg-[#0f4ae0] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              {actionKey === row.groupKey ? (
                                <FaSpinner className="animate-spin" />
                              ) : null}
                              {actionLabel}
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
        </section>
      </div>
    </div>
  );
};

export default UserCompareManager;
