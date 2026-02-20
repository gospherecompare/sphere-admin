import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaExclamationCircle,
  FaMousePointer,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import { buildUrl } from "../../api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

const FeatureClicksReport = () => {
  const [deviceType, setDeviceType] = useState("smartphone");
  const [days, setDays] = useState(7);
  const [limit, setLimit] = useState(50);
  const [query, setQuery] = useState("");

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
      const list = Array.isArray(data?.results) ? data.results : [];
      setRows(list);
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
    const search = String(query || "")
      .trim()
      .toLowerCase();
    if (!search) return rows;
    return rows.filter((row) =>
      String(row?.feature_id || "")
        .toLowerCase()
        .includes(search),
    );
  }, [query, rows]);

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
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-blue-100 rounded-lg">
                <FaMousePointer className="text-blue-600" />
              </span>
              Feature Click Report
            </h1>
            <p className="text-gray-600 mt-2">
              Reads click analytics from <code>/api/public/popular-features</code>
              .
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Device Type
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="smartphone">Smartphone</option>
              <option value="laptop">Laptop</option>
              <option value="networking">Networking</option>
              <option value="home-appliance">Home Appliance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Days
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Limit
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search Feature
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="feature_id"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Test Click (`/api/public/feature-click`)
            </label>
            <input
              value={featureId}
              onChange={(e) => setFeatureId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example: battery-life"
            />
          </div>
          <button
            onClick={sendTestClick}
            disabled={posting || !String(featureId || "").trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              posting || !String(featureId || "").trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {posting ? "Sending..." : "Send Click"}
          </button>
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Rank", "Feature ID", "Clicks", "Last Clicked At"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-600">
                    <FaSpinner className="inline animate-spin mr-2" />
                    Loading feature clicks...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-600">
                    No feature click data.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={`${row?.feature_id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">
                      {row?.feature_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {Number(row?.clicks ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDateTime(row?.last_clicked_at)}
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

export default FeatureClicksReport;


