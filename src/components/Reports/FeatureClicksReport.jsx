import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaExclamationCircle,
  FaMousePointer,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import { buildUrl } from "../../api";
import {
  formatCount,
  formatDateTime,
  normalizeDateValue,
  sortRows,
} from "./reportHelpers";

const SORT_OPTIONS = [
  { value: "last_clicked_at", label: "Latest click", type: "date" },
  { value: "clicks", label: "Most clicks", type: "number" },
  { value: "feature_id", label: "Feature id", type: "text" },
];

const DEVICE_OPTIONS = [
  { value: "smartphone", label: "Smartphone" },
  { value: "laptop", label: "Laptop" },
  { value: "networking", label: "Networking" },
  { value: "home-appliance", label: "Home Appliance" },
];

const FeatureClicksReport = () => {
  const [deviceType, setDeviceType] = useState("smartphone");
  const [days, setDays] = useState(7);
  const [limit, setLimit] = useState(50);
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("last_clicked_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featureId, setFeatureId] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("deviceType", String(deviceType || "smartphone"));
      qs.set("days", String(Number(days) || 7));
      qs.set("limit", String(Number(limit) || 50));

      const res = await fetch(buildUrl(`/api/public/popular-features?${qs}`), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setRows(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      console.error("Failed to fetch feature click report:", err);
      setError(err.message || "Failed to load feature click report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [days, deviceType, limit]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredRows = useMemo(() => {
    const search = String(query || "").trim().toLowerCase();
    if (!search) return rows;

    return rows.filter((row) =>
      String(row?.feature_id || "")
        .toLowerCase()
        .includes(search),
    );
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
    const totalClicks = rows.reduce(
      (sum, row) => sum + Number(row?.clicks || 0),
      0,
    );
    const latestClickTimestamp = rows.reduce((latest, row) => {
      const current = normalizeDateValue(row?.last_clicked_at);
      if (current === null) return latest;
      return latest === null || current > latest ? current : latest;
    }, null);
    const topFeature = sortRows(rows, (row) => row?.clicks, {
      direction: "desc",
      type: "number",
    })[0];

    return {
      totalFeatures: rows.length,
      totalClicks,
      topFeature,
      latestClickTimestamp,
    };
  }, [rows]);

  const sendTestClick = useCallback(async () => {
    const normalizedFeature = String(featureId || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (!normalizedFeature) return;

    setPosting(true);
    setError(null);
    try {
      const res = await fetch(buildUrl("/api/public/feature-click"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_type: deviceType,
          feature_id: normalizedFeature,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFeatureId("");
      await fetchReport();
    } catch (err) {
      console.error("Failed to post feature click:", err);
      setError(err.message || "Failed to post feature click");
    } finally {
      setPosting(false);
    }
  }, [deviceType, featureId, fetchReport]);

  return (
    <div className="min-h-full bg-slate-50 p-2 sm:p-3">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                <FaMousePointer />
                Reports
              </div>
              <div className="space-y-2">
                <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                  <span className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                    <FaMousePointer />
                  </span>
                  Feature Click Report
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Track feature engagement by device type with mobile-friendly
                  cards, quick sort controls, and latest-click-first ordering by
                  default.
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tracked features</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.totalFeatures}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total clicks</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCount(summary.totalClicks)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Top feature</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {summary.topFeature?.feature_id || "-"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatCount(summary.topFeature?.clicks)} clicks
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Latest click</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatDateTime(summary.latestClickTimestamp)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Device type
              </label>
              <select
                value={deviceType}
                onChange={(event) => setDeviceType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                {DEVICE_OPTIONS.map((option) => (
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
                max={30}
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
                max={100}
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
                Search feature
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  placeholder="feature_id"
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

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Test click
              </label>
              <input
                value={featureId}
                onChange={(event) => setFeatureId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                placeholder="example: battery-life"
              />
            </div>
            <button
              onClick={sendTestClick}
              disabled={posting || !String(featureId || "").trim()}
              className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                posting || !String(featureId || "").trim()
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
              }`}
            >
              {posting ? "Sending..." : "Send Click"}
            </button>
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
              Loading feature clicks...
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              No feature click data.
            </div>
          ) : (
            sortedRows.map((row, index) => (
              <article
                key={`${row?.feature_id}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Rank #{index + 1}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">
                      {row?.feature_id || "-"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{deviceType}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                    <p className="text-xs text-slate-500">Clicks</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCount(row?.clicks)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Last clicked
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatDateTime(row?.last_clicked_at)}
                  </p>
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
                  {["Rank", "Feature ID", "Clicks", "Last Clicked At"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-600">
                      <FaSpinner className="mr-2 inline animate-spin" />
                      Loading feature clicks...
                    </td>
                  </tr>
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-600">
                      No feature click data.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, index) => (
                    <tr
                      key={`${row?.feature_id}-${index}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {row?.feature_id || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatCount(row?.clicks)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDateTime(row?.last_clicked_at)}
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

export default FeatureClicksReport;
