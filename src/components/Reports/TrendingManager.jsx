import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBolt,
  FaCheckCircle,
  FaChartLine,
  FaExclamationCircle,
  FaMinus,
  FaSave,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const TrendingManager = () => {
  const [type, setType] = useState("smartphone");
  const [limit, setLimit] = useState(200);
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [savingById, setSavingById] = useState({});
  const [error, setError] = useState(null);

  const [updatedAt, setUpdatedAt] = useState(null);
  const [rows, setRows] = useState([]);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message, toastType = "success") => {
    const id = Date.now();
    const newToast = { id, title, message, type: toastType };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const authHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  }, []);

  const fetchTrending = useCallback(
    async (opts = {}) => {
      const { silent = false } = opts;
      setLoading(true);
      setError(null);
      try {
        const safeLimit = Number.isFinite(Number(limit))
          ? Math.min(200, Math.max(1, Math.floor(Number(limit))))
          : 200;

        const qs = new URLSearchParams();
        if (type) qs.set("type", type);
        qs.set("limit", String(safeLimit));

        const res = await fetch(buildUrl(`/api/admin/trending?${qs}`), {
          method: "GET",
          headers: authHeaders(),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setUpdatedAt(data.updated_at || null);
        setRows(Array.isArray(data.results) ? data.results : []);

        if (!silent) showToast("Success", "Trending report loaded", "success");
      } catch (err) {
        console.error("Failed to fetch trending:", err);
        setError(err.message || "Failed to load trending report");
        showToast("Error", "Failed to load trending report", "error");
      } finally {
        setLoading(false);
      }
    },
    [authHeaders, limit, showToast, type],
  );

  const recompute = useCallback(async () => {
    setRecomputing(true);
    setError(null);
    try {
      const res = await fetch(buildUrl("/api/admin/trending/recompute"), {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data?.skipped) {
        showToast(
          "Skipped",
          `Recompute skipped (${data?.reason || "lock_unavailable"})`,
          "info",
        );
      } else {
        const updated = Number(data?.updated ?? 0);
        showToast(
          "Success",
          `Trending recomputed (${Number.isFinite(updated) ? updated : 0} products)`,
          "success",
        );
      }
      await fetchTrending({ silent: true });
    } catch (err) {
      console.error("Failed to recompute trending:", err);
      setError(err.message || "Failed to recompute trending");
      showToast("Error", "Failed to recompute trending", "error");
    } finally {
      setRecomputing(false);
    }
  }, [authHeaders, fetchTrending, showToast]);

  useEffect(() => {
    fetchTrending({ silent: true });
  }, [fetchTrending]);

  const filteredRows = useMemo(() => {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const id = String(r.product_id ?? "");
      const name = String(r.name ?? "").toLowerCase();
      const brand = String(r.brand ?? "").toLowerCase();
      const pType = String(r.product_type ?? "").toLowerCase();
      return (
        id.includes(q) ||
        name.includes(q) ||
        brand.includes(q) ||
        pType.includes(q)
      );
    });
  }, [query, rows]);

  const updateRow = useCallback((productId, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.product_id === productId ? { ...r, ...patch } : r)),
    );
  }, []);

  const setSaving = useCallback((productId, isSaving) => {
    setSavingById((prev) => ({ ...prev, [productId]: isSaving }));
  }, []);

  const saveOverride = useCallback(
    async (row) => {
      const productId = row?.product_id;
      if (!productId) return;

      setSaving(productId, true);
      setError(null);
      try {
        const badgeTrimmed = String(row.manual_badge ?? "").trim();
        const payload = {
          product_id: productId,
          manual_boost: Boolean(row.manual_boost),
          manual_priority: Number.isFinite(Number(row.manual_priority))
            ? Math.max(0, Math.floor(Number(row.manual_priority)))
            : 0,
          badge: badgeTrimmed ? badgeTrimmed : null,
        };

        const res = await fetch(buildUrl("/api/admin/trending/boost"), {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        updateRow(productId, {
          manual_boost: Boolean(data.manual_boost),
          manual_priority: data.manual_priority ?? payload.manual_priority,
          manual_badge: data.manual_badge ?? payload.badge,
        });

        const displayName = String(row?.name || "").trim();
        showToast(
          "Saved",
          displayName
            ? `Manual override saved for ${displayName}`
            : "Manual override saved",
          "success",
        );
      } catch (err) {
        console.error("Failed to save override:", err);
        setError(err.message || "Failed to save override");
        const displayName = String(row?.name || "").trim();
        showToast(
          "Error",
          displayName
            ? `Failed to save override for ${displayName}`
            : "Failed to save override",
          "error",
        );
      } finally {
        setSaving(productId, false);
      }
    },
    [authHeaders, setSaving, showToast, updateRow],
  );

  const clearOverride = useCallback(
    async (row) => {
      const productId = row?.product_id;
      if (!productId) return;
      setSaving(productId, true);
      setError(null);
      try {
        const res = await fetch(buildUrl("/api/admin/trending/boost"), {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            product_id: productId,
            manual_boost: false,
            manual_priority: 0,
            badge: null,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await res.json();

        updateRow(productId, {
          manual_boost: false,
          manual_priority: 0,
          manual_badge: null,
        });

        const displayName = String(row?.name || "").trim();
        showToast(
          "Cleared",
          displayName
            ? `Manual override cleared for ${displayName}`
            : "Manual override cleared",
          "success",
        );
      } catch (err) {
        console.error("Failed to clear override:", err);
        setError(err.message || "Failed to clear override");
        const displayName = String(row?.name || "").trim();
        showToast(
          "Error",
          displayName
            ? `Failed to clear override for ${displayName}`
            : "Failed to clear override",
          "error",
        );
      } finally {
        setSaving(productId, false);
      }
    },
    [authHeaders, setSaving, showToast, updateRow],
  );

  const formatNumber = useCallback((v, digits = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "-";
    return n.toFixed(digits);
  }, []);

  const formatDateTime = useCallback((value) => {
    if (!value) return "-";

    const tryParse = (v) => {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    // Prefer native parsing (ISO strings)
    let d = tryParse(value);
    if (!d) {
      // Fallback for Postgres "timestamp without time zone" strings
      const s = String(value).trim();
      const normalized = s.includes("T") ? s : s.replace(" ", "T");
      d = tryParse(`${normalized}Z`) || tryParse(normalized);
    }

    if (!d) return String(value);

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(d);
  }, []);

  const TYPE_OPTIONS = useMemo(
    () => [
      { value: "smartphone", label: "Smartphone" },
      { value: "laptop", label: "Laptop" },
      { value: "tv", label: "TV" },
      { value: "networking", label: "Networking" },
      { value: "accessories", label: "Accessories" },
    ],
    [],
  );

  const BADGE_OPTIONS = useMemo(
    () => [
      { value: "", label: "Default (Editor Pick)" },
      { value: "Editor Pick", label: "Editor Pick" },
      { value: "Trending Now", label: "Trending Now" },
      { value: "Popular This Week", label: "Popular This Week" },
      { value: "Gaining Attention", label: "Gaining Attention" },
      { value: "Sponsored", label: "Sponsored" },
      { value: "New Launch", label: "New Launch" },
      { value: "Featured", label: "Featured" },
    ],
    [],
  );

  return (
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-white rounded-lg shadow-lg border p-4 max-w-sm w-full flex items-start space-x-3 ${
              toast.type === "success"
                ? "border-green-200 bg-green-50"
                : toast.type === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            {toast.type === "success" && (
              <FaCheckCircle className="text-green-500 mt-0.5" />
            )}
            {toast.type === "error" && (
              <FaExclamationCircle className="text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-blue-100 rounded-lg">
                <FaChartLine className="text-blue-600" />
              </span>
              Trending Manager
            </h1>
            <p className="text-gray-600 mt-2">
              Admin-only view: shows internal signals (views/compares/score) and
              lets you manually boost products.
            </p>
            {type === "laptop" && (
              <p className="text-xs text-blue-600 mt-1">
                Laptop boosts and badges here are reflected on laptop trending
                cards in the client app.
              </p>
            )}
            {updatedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Updated at: {formatDateTime(updatedAt)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchTrending()}
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

            <button
              onClick={recompute}
              disabled={recomputing}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                recomputing
                  ? "bg-orange-100 text-orange-400 cursor-not-allowed"
                  : "bg-orange-600 text-white hover:bg-orange-700 shadow-sm"
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Limit
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="200"
            />
            <p className="text-xs text-gray-500 mt-1">Max: 200</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by id, name, brand, type…"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Showing {filteredRows.length} of {rows.length}
            </p>
          </div>
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Name",
                  "Brand",
                  "Type",
                  "Unique Visitors (7d)",
                  "Trend",
                  "Total Unique Visitors",
                  "Compares (7d)",
                  "Total Compares",
                  "Score",
                  "Calculated",
                  "Manual Boost",
                  "Priority",
                  "Manual Badge",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-8 text-center text-gray-600"
                  >
                    <FaSpinner className="inline animate-spin mr-2" />
                    Loading…
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-8 text-center text-gray-600"
                  >
                    No results. If this is a new setup, click{" "}
                    <span className="font-semibold">Recompute</span> to generate
                    the trending table.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const isSaving = Boolean(savingById[r.product_id]);

                  const current = Number(r.views_7d ?? 0);
                  const prev = Number(r.views_prev_7d ?? 0);
                  const delta = current - prev;
                  const pct =
                    Number.isFinite(prev) && prev > 0
                      ? (delta / prev) * 100
                      : null;

                  const trendStyle =
                    delta > 0
                      ? "bg-green-50 text-green-700 border-green-200"
                      : delta < 0
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-gray-50 text-gray-600 border-gray-200";

                  return (
                    <tr key={r.product_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 min-w-[240px]">
                        <div className="font-semibold">{r.name}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {r.brand || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {r.product_type}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatNumber(r.views_7d)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold ${trendStyle}`}
                        >
                          {delta > 0 ? (
                            <FaArrowUp />
                          ) : delta < 0 ? (
                            <FaArrowDown />
                          ) : (
                            <FaMinus />
                          )}
                          <span>{delta > 0 ? `+${delta}` : `${delta}`}</span>
                          {pct !== null && Number.isFinite(pct) && (
                            <span className="opacity-80">
                              ({pct > 0 ? "+" : ""}
                              {Math.round(pct)}%)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatNumber(r.unique_visitors_total)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatNumber(r.compares_7d)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatNumber(r.compares_total)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatNumber(r.trending_score, 2)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatDateTime(r.calculated_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(r.manual_boost)}
                            onChange={(e) =>
                              updateRow(r.product_id, {
                                manual_boost: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-xs text-gray-600">
                            {r.manual_boost ? "On" : "Off"}
                          </span>
                        </label>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        <input
                          type="number"
                          min={0}
                          value={r.manual_priority ?? 0}
                          onChange={(e) =>
                            updateRow(r.product_id, {
                              manual_priority: e.target.value,
                            })
                          }
                          className="w-24 px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-700 min-w-[220px]">
                        {(() => {
                          const currentBadge = String(r.manual_badge ?? "");
                          const hasCurrent = BADGE_OPTIONS.some(
                            (b) => b.value === currentBadge,
                          );
                          const options = hasCurrent
                            ? BADGE_OPTIONS
                            : [
                                {
                                  value: currentBadge,
                                  label: `${currentBadge} (Custom)`,
                                },
                                ...BADGE_OPTIONS,
                              ];

                          return (
                            <select
                              value={r.manual_badge ?? ""}
                              onChange={(e) =>
                                updateRow(r.product_id, {
                                  manual_badge: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {options.map((b) => (
                                <option key={b.label} value={b.value}>
                                  {b.label}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveOverride(r)}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                              isSaving
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {isSaving ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaSave />
                            )}
                            Save
                          </button>
                          <button
                            onClick={() => clearOverride(r)}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                              isSaving
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                            title="Clear manual override"
                          >
                            <FaTrash />
                            Clear
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
      </div>

      {/* Info */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h4 className="font-bold text-gray-900 mb-2">How manual boost works</h4>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>
            - Manual boost does <span className="font-semibold">not</span>{" "}
            change views/compares. Those signals come from real activity.
          </li>
          <li>
            - Turning on <span className="font-semibold">Manual Boost</span> and
            setting a higher <span className="font-semibold">Priority</span>{" "}
            makes a product appear above algorithm results.
          </li>
          <li>
            - Public API only returns clean fields (no scores or counters). This
            page is admin-only.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TrendingManager;


