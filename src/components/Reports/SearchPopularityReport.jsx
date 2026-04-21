import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaExclamationCircle,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import {
  formatCount,
  formatDateTime,
  formatScore,
  formatSeconds,
  sortRows,
} from "./reportHelpers";

const SORT_OPTIONS = [
  { value: "last_engagement_at", label: "Latest engagement", type: "date" },
  { value: "last_search_at", label: "Latest search", type: "date" },
  { value: "last_viewed_at", label: "Latest view", type: "date" },
  { value: "search_popularity_score", label: "Popularity score", type: "number" },
  { value: "search_count_30d", label: "Searches 30d", type: "number" },
  { value: "views_30d", label: "Views 30d", type: "number" },
  { value: "dwell_seconds_30d", label: "Dwell time", type: "number" },
  { value: "freshness_score", label: "Freshness", type: "number" },
  { value: "name", label: "Product name", type: "text" },
];

const PRODUCT_TYPES = [
  { value: "all", label: "All" },
  { value: "smartphone", label: "Smartphone" },
  { value: "laptop", label: "Laptop" },
  { value: "tv", label: "TV" },
  { value: "networking", label: "Networking" },
];

const SearchPopularityReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [productType, setProductType] = useState("all");
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(100);
  const [sortField, setSortField] = useState("last_engagement_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [generatedAt, setGeneratedAt] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const qs = new URLSearchParams();
      qs.set("limit", String(Number(limit) || 100));
      qs.set("days", String(Number(days) || 30));
      if (productType && productType !== "all") {
        qs.set("productType", productType);
      }

      const res = await fetch(
        buildUrl(`/api/admin/search-popularity?${qs.toString()}`),
        {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data?.devices) ? data.devices : []);
      setGeneratedAt(data?.generated_at || null);
    } catch (err) {
      console.error("Failed to fetch search popularity report:", err);
      setError(err.message || "Failed to load search popularity report");
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
    const topScore = rows.length
      ? Math.max(
          ...rows.map((row) => Number(row?.search_popularity_score || 0)),
        )
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
      topScore,
      averageScore,
    };
  }, [rows]);

  return (
    <div className="min-h-full bg-slate-50 p-2 sm:p-3">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                <FaChartLine />
                Reports
              </div>
              <div className="space-y-2">
                <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                  <span className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                    <FaChartLine />
                  </span>
                  Search Popularity Report
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Monthly search demand, engagement quality, and freshness
                  signals in a layout that stays readable from mobile cards up to
                  wide admin tables.
                </p>
              </div>
            </div>

            <button
              onClick={fetchReport}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                loading
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
              }`}
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
              Refresh
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Devices returned</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.totalRows}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total searches</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCount(summary.totalSearches)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Top popularity score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatScore(summary.topScore)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Average score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatScore(summary.averageScore)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Generated</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatDateTime(generatedAt)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Product type
              </label>
              <select
                value={productType}
                onChange={(event) => setProductType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Limit
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Sort by
              </label>
              <select
                value={sortField}
                onChange={(event) => setSortField(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                <option value="desc">Latest / highest first</option>
                <option value="asc">Oldest / lowest first</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  placeholder="Product, brand, type, or path"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              Showing {sortedRows.length} of {rows.length}
            </span>
            <span>Missing values always stay at the bottom.</span>
          </div>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <FaExclamationCircle className="mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold text-red-700">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4 lg:hidden">
          {loading && rows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              <FaSpinner className="mr-2 inline animate-spin" />
              Loading search popularity...
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              No devices found for the selected filters.
            </div>
          ) : (
            sortedRows.map((row, index) => (
              <article
                key={row?.product_id ?? `${row?.name}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Rank #{index + 1}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">
                      {row?.name || "Untitled product"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {[row?.brand_name, row?.product_type]
                        .filter(Boolean)
                        .join(" • ") || "No product metadata"}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {row?.badge || "No badge"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Searches 30d</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatCount(row?.search_count_30d)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Score</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatScore(row?.search_popularity_score)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Views 30d</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatCount(row?.views_30d)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Dwell time</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatSeconds(row?.dwell_seconds_30d)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Search weight
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatScore(row?.search_weight_30d)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Freshness
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatScore(row?.freshness_score)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Last search
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDateTime(row?.last_search_at)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Last engagement
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDateTime(row?.last_engagement_at)}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
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
                      className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-slate-600">
                      <FaSpinner className="mr-2 inline animate-spin" />
                      Loading search popularity...
                    </td>
                  </tr>
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-slate-600">
                      No devices found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, index) => (
                    <tr
                      key={row?.product_id ?? `${row?.name}-${index}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        {row?.hero_rank ?? index + 1}
                      </td>
                      <td className="min-w-[240px] px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {row?.name || "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {row?.detail_path || "-"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {row?.product_type || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {row?.brand_name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatCount(row?.search_count_30d)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatScore(row?.search_weight_30d)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatCount(row?.views_30d)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatSeconds(row?.dwell_seconds_30d)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatScore(row?.freshness_score)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                        {formatScore(row?.search_popularity_score)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {row?.badge || "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDateTime(row?.last_search_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDateTime(row?.last_viewed_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDateTime(row?.last_engagement_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SearchPopularityReport;
