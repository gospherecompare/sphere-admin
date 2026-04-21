import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaBolt,
  FaCheckCircle,
  FaChartLine,
  FaExclamationCircle,
  FaMobileAlt,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import {
  formatDateTime,
  formatScore,
  normalizeDateValue,
  sortRows,
} from "./reportHelpers";

const SORT_OPTIONS = [
  { value: "hook_calculated_at", label: "Latest calculation", type: "date" },
  { value: "created_at", label: "Latest created", type: "date" },
  { value: "hook_score", label: "Hook score", type: "number" },
  { value: "buyer_intent", label: "Buyer intent", type: "number" },
  { value: "trend_velocity", label: "Trend velocity", type: "number" },
  { value: "freshness", label: "Freshness", type: "number" },
  { value: "name", label: "Product name", type: "text" },
  { value: "launch_date", label: "Launch date", type: "date" },
];

const PUBLISHED_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft only" },
];

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

const HookScoreReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("all");
  const [sortField, setSortField] = useState("hook_calculated_at");
  const [sortDirection, setSortDirection] = useState("desc");

  const hasFetchedRef = useRef(false);

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
    const search = String(query || "").trim().toLowerCase();

    return rows.filter((row) => {
      if (
        publishedFilter === "published" &&
        !Boolean(row?.is_published ?? row?.published)
      ) {
        return false;
      }

      if (
        publishedFilter === "draft" &&
        Boolean(row?.is_published ?? row?.published)
      ) {
        return false;
      }

      if (!search) return true;

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
          .includes(search),
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
      .map((row) => Number(row?.hook_score))
      .filter(Number.isFinite);
    const latestCalculatedAt = rows.reduce((latest, row) => {
      const current = normalizeDateValue(row?.hook_calculated_at);
      if (current === null) return latest;
      return latest === null || current > latest ? current : latest;
    }, null);

    return {
      totalRows: rows.length,
      publishedRows: rows.filter((row) => Boolean(row?.is_published)).length,
      averageHookScore: validHookScores.length
        ? validHookScores.reduce((sum, value) => sum + value, 0) /
          validHookScores.length
        : null,
      topHookScore: validHookScores.length ? Math.max(...validHookScores) : null,
      latestCalculatedAt,
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
                    <FaMobileAlt />
                  </span>
                  Hook Score Report
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Review smartphone hook-score signals in one place, with
                  responsive cards, latest-first sorting, and empty values always
                  pushed to the bottom.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={fetchReport}
                disabled={loading}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  loading
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
                Refresh
              </button>
              <button
                onClick={recomputeReport}
                disabled={recomputing}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  recomputing
                    ? "cursor-not-allowed bg-blue-100 text-blue-300"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                }`}
              >
                {recomputing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaBolt />
                )}
                Recompute
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tracked devices</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.totalRows}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Published devices</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.publishedRows}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Average hook score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatScore(summary.averageHookScore)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Top hook score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatScore(summary.topHookScore)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Latest calculation</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatDateTime(summary.latestCalculatedAt)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search products
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, brand, model, type, or ID"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                value={publishedFilter}
                onChange={(event) => setPublishedFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                {PUBLISHED_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              Loading hook score report...
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              No hook score data matched the current filters.
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
                      {row?.name || "Untitled device"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {[row?.brand_name || row?.brand, row?.model]
                        .filter(Boolean)
                        .join(" • ") || "No brand details"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      row?.is_published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <FaCheckCircle className={row?.is_published ? "" : "hidden"} />
                    {row?.is_published ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Hook score</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatScore(row?.hook_score)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Buyer intent</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatScore(row?.buyer_intent)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Trend velocity</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatScore(row?.trend_velocity)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Freshness</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatScore(row?.freshness)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Latest calculated
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDateTime(row?.hook_calculated_at)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Created
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDateTime(row?.created_at)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Launch date
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDateTime(row?.launch_date)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Product ID
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {row?.product_id ?? "-"}
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
              <thead className="bg-slate-50">
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
                    <td
                      colSpan={11}
                      className="px-4 py-10 text-center text-slate-600"
                    >
                      <FaSpinner className="mr-2 inline animate-spin" />
                      Loading hook score report...
                    </td>
                  </tr>
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-10 text-center text-slate-600"
                    >
                      No hook score data matched the current filters.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, index) => (
                    <tr
                      key={row?.product_id ?? `${row?.name}-${index}`}
                      className="align-top hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        #{index + 1}
                      </td>
                      <td className="min-w-[220px] px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {row?.name || "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          ID: {row?.product_id ?? "-"}
                        </div>
                      </td>
                      <td className="min-w-[180px] px-4 py-4 text-slate-700">
                        <div>{row?.brand_name || row?.brand || "-"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {row?.model || "-"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                        {formatScore(row?.hook_score)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatScore(row?.buyer_intent)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatScore(row?.trend_velocity)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatScore(row?.freshness)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            row?.is_published
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row?.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDateTime(row?.hook_calculated_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDateTime(row?.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDateTime(row?.launch_date)}
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

export default HookScoreReport;
