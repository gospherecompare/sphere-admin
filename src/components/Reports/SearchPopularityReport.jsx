import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaExclamationCircle,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const formatScore = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(1) : "-";
};

const formatCount = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : "-";
};

const formatSeconds = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  return Number.isFinite(num) ? `${num.toFixed(1)}s` : "-";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

const SearchPopularityReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [productType, setProductType] = useState("all");
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(100);

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
      const devices = Array.isArray(data?.devices) ? data.devices : [];
      setRows(devices);
    } catch (err) {
      console.error("Failed to fetch search popularity report:", err);
      setError(err.message || "Failed to load search popularity report");
      setRows([]);
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
      const id = String(row?.product_id ?? "");
      const name = String(row?.name ?? "").toLowerCase();
      const brand = String(row?.brand_name ?? "").toLowerCase();
      const type = String(row?.product_type ?? "").toLowerCase();
      return (
        id.includes(search) ||
        name.includes(search) ||
        brand.includes(search) ||
        type.includes(search)
      );
    });
  }, [query, rows]);

  const summary = useMemo(() => {
    const totalSearches = rows.reduce(
      (sum, row) => sum + Number(row?.search_count_30d || 0),
      0,
    );
    const topScore = rows.length
      ? Math.max(
          ...rows.map((row) => Number(row?.search_popularity_score || 0)),
        )
      : 0;
    const averageScore = rows.length
      ? rows.reduce(
          (sum, row) => sum + Number(row?.search_popularity_score || 0),
          0,
        ) / rows.length
      : 0;

    return {
      totalRows: rows.length,
      totalSearches,
      topScore,
      averageScore,
    };
  }, [rows]);

  return (
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
      <div className="mb-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 md:text-3xl">
              <span className="rounded-lg bg-blue-100 p-2">
                <FaChartLine className="text-blue-600" />
              </span>
              Search Popularity Report
            </h1>
            <p className="mt-2 text-gray-600">
              Monthly search interest, page engagement, and freshness ranking
              for the top devices that power the hero section.
            </p>
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              loading
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
            }`}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Devices Returned</p>
          <p className="text-2xl font-bold text-gray-900">{summary.totalRows}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Search Events</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCount(summary.totalSearches)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Top Popularity Score</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatScore(summary.topScore)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Average Popularity Score</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatScore(summary.averageScore)}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Product Type
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="smartphone">Smartphone</option>
              <option value="laptop">Laptop</option>
              <option value="tv">TV</option>
              <option value="networking">Networking</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Days
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Limit
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Product name, brand, type, or ID"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <FaExclamationCircle className="mt-0.5 text-red-500" />
            <div>
              <p className="font-semibold text-red-700">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
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
                    className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-gray-600">
                    <FaSpinner className="mr-2 inline animate-spin" />
                    Loading search popularity...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-gray-600">
                    No devices found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={row.product_id ?? `${row.name}-${index}`} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {row.hero_rank ?? index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{row.name || "-"}</div>
                      <div className="text-xs text-gray-500">
                        {row.detail_path || "-"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {row.product_type || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {row.brand_name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatCount(row.search_count_30d)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatScore(row.search_weight_30d)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatCount(row.views_30d)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatSeconds(row.dwell_seconds_30d)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatScore(row.freshness_score)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatScore(row.search_popularity_score)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {row.badge || "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatDateTime(row.last_search_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatDateTime(row.last_viewed_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatDateTime(row.last_engagement_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SearchPopularityReport;
