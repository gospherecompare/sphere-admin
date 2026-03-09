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
  return Number.isFinite(num) ? num.toFixed(2) : "-";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  if (typeof value === "object") {
    const candidate =
      value.calculated_at ??
      value.hook_calculated_at ??
      value.date ??
      value.value ??
      null;
    if (!candidate) return "-";
    value = candidate;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    if (!first) return "-";
    value = first;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

const HookScoreReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [recomputeNote, setRecomputeNote] = useState("");

  const fetchSmartphoneRows = useCallback(async () => {
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
    const smartphones = Array.isArray(data?.smartphones) ? data.smartphones : [];
    return smartphones.map((item, index) => ({
      ...item,
      _api_rank: index + 1,
    }));
  }, []);

  const recomputeHookScore = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(buildUrl("/api/admin/hook-score/recompute"), {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error(`Recompute failed: HTTP ${res.status}`);
    return res.json();
  }, []);

  const isMissingOrZeroHook = (row) => {
    const score = Number(row?.hook_score);
    const hasScore = Number.isFinite(score);
    const hasCalc = Boolean(row?.hook_calculated_at);
    if (!hasScore && !hasCalc) return true;
    return hasScore ? score <= 0 : !hasCalc;
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRecomputeNote("");
    try {
      let nextRows = await fetchSmartphoneRows();

      const shouldRecompute =
        nextRows.length > 0 && nextRows.every((row) => isMissingOrZeroHook(row));

      if (shouldRecompute) {
        await recomputeHookScore();
        setRecomputeNote(
          "Hook score was recomputed from latest signals and report was refreshed.",
        );
        nextRows = await fetchSmartphoneRows();
      }

      setRows(nextRows);
    } catch (err) {
      console.error("Failed to fetch hook score report:", err);
      setError(err.message || "Failed to load hook score report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchSmartphoneRows, recomputeHookScore]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredRows = useMemo(() => {
    const search = String(query || "")
      .trim()
      .toLowerCase();
    if (!search) return rows;

    return rows.filter((row) => {
      const id = String(row?.product_id ?? "");
      const name = String(row?.name ?? "").toLowerCase();
      const brand = String(row?.brand_name ?? "").toLowerCase();
      return id.includes(search) || name.includes(search) || brand.includes(search);
    });
  }, [query, rows]);

  const scoredCount = useMemo(
    () =>
      rows.filter(
        (row) =>
          row?.hook_score !== null &&
          row?.hook_score !== undefined &&
          row?.hook_score !== "",
      ).length,
    [rows],
  );

  return (
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-blue-100 rounded-lg">
                <FaChartLine className="text-blue-600" />
              </span>
              Hook Score Report
            </h1>
            <p className="text-gray-600 mt-2">
              Shows values from <code>/api/smartphone</code> with product name
              and computed hook metrics.
            </p>
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            }`}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Products Returned</p>
          <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Products With Hook Score</p>
          <p className="text-2xl font-bold text-gray-900">{scoredCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Search Product
        </label>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by product id, product name, or brand"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <FaExclamationCircle className="text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}
      {!error && recomputeNote ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-emerald-700">
          {recomputeNote}
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Rank",
                  "Product Name",
                  "Brand",
                  "Hook Score",
                  "Buyer Intent",
                  "Trend Velocity",
                  "Freshness",
                  "Hook Calculated At",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-600">
                    <FaSpinner className="inline animate-spin mr-2" />
                    Loading report...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-600">
                    No products found for current filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={row.product_id ?? `${row.name}-${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {row?._api_rank ?? index + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-900 min-w-[260px]">
                      <div className="font-semibold">{row?.name || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {row?.brand_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatScore(row?.hook_score)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatScore(row?.buyer_intent)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatScore(row?.trend_velocity)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatScore(row?.freshness)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDateTime(row?.hook_calculated_at)}
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

export default HookScoreReport;


