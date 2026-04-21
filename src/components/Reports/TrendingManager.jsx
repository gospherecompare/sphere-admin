import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBolt,
  FaChartLine,
  FaCheckCircle,
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
import {
  formatDateTime,
  formatNumber,
  normalizeDateValue,
  sortRows,
} from "./reportHelpers";

const TYPE_OPTIONS = [
  { value: "smartphone", label: "Smartphone" },
  { value: "laptop", label: "Laptop" },
  { value: "tv", label: "TV" },
  { value: "networking", label: "Networking" },
  { value: "accessories", label: "Accessories" },
];

const BADGE_OPTIONS = [
  { value: "", label: "Default (Editor Pick)" },
  { value: "Editor Pick", label: "Editor Pick" },
  { value: "Trending Now", label: "Trending Now" },
  { value: "Popular This Week", label: "Popular This Week" },
  { value: "Gaining Attention", label: "Gaining Attention" },
  { value: "Sponsored", label: "Sponsored" },
  { value: "New Launch", label: "New Launch" },
  { value: "Featured", label: "Featured" },
];

const SORT_OPTIONS = [
  { value: "calculated_at", label: "Latest calculation", type: "date" },
  { value: "trending_score", label: "Trending score", type: "number" },
  { value: "views_7d", label: "Visitors 7d", type: "number" },
  { value: "unique_visitors_total", label: "Visitors total", type: "number" },
  { value: "compares_7d", label: "Compares 7d", type: "number" },
  { value: "compares_total", label: "Compares total", type: "number" },
  { value: "manual_priority", label: "Manual priority", type: "number" },
  { value: "name", label: "Product name", type: "text" },
  { value: "brand", label: "Brand", type: "text" },
];

const getSortValue = (row, sortField) => {
  switch (sortField) {
    case "trending_score":
      return row?.trending_score;
    case "views_7d":
      return row?.views_7d;
    case "unique_visitors_total":
      return row?.unique_visitors_total;
    case "compares_7d":
      return row?.compares_7d;
    case "compares_total":
      return row?.compares_total;
    case "manual_priority":
      return row?.manual_priority;
    case "brand":
      return row?.brand;
    case "name":
      return row?.name;
    case "calculated_at":
    default:
      return row?.calculated_at;
  }
};

const getTrendData = (row) => {
  const current = Number(row?.views_7d ?? 0);
  const previous = Number(row?.views_prev_7d ?? 0);
  const delta = current - previous;
  const percentage =
    Number.isFinite(previous) && previous > 0 ? (delta / previous) * 100 : null;

  if (delta > 0) {
    return {
      delta,
      percentage,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: <FaArrowUp />,
      label: "Up",
    };
  }

  if (delta < 0) {
    return {
      delta,
      percentage,
      className: "border-red-200 bg-red-50 text-red-700",
      icon: <FaArrowDown />,
      label: "Down",
    };
  }

  return {
    delta,
    percentage,
    className: "border-slate-200 bg-slate-50 text-slate-600",
    icon: <FaMinus />,
    label: "Flat",
  };
};

const TrendingManager = () => {
  const [type, setType] = useState("smartphone");
  const [limit, setLimit] = useState(200);
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("calculated_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [savingById, setSavingById] = useState({});
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [rows, setRows] = useState([]);
  const [toasts, setToasts] = useState([]);
  const lastFetchSignatureRef = useRef("");

  const showToast = useCallback((title, message, toastType = "success") => {
    const id = Date.now() + Math.random();
    const nextToast = { id, title, message, type: toastType };
    setToasts((previous) => [...previous, nextToast]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const authHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  }, []);

  const fetchTrending = useCallback(
    async (options = {}) => {
      const { silent = false } = options;
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

        setUpdatedAt(data?.updated_at || null);
        setRows(Array.isArray(data?.results) ? data.results : []);

        if (!silent) {
          showToast("Success", "Trending report loaded", "success");
        }
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
    const signature = `${type}:${limit}`;
    if (lastFetchSignatureRef.current === signature) return;
    lastFetchSignatureRef.current = signature;
    fetchTrending({ silent: true });
  }, [fetchTrending, limit, type]);

  const updateRow = useCallback((productId, patch) => {
    setRows((previous) =>
      previous.map((row) =>
        row.product_id === productId ? { ...row, ...patch } : row,
      ),
    );
  }, []);

  const setSaving = useCallback((productId, isSaving) => {
    setSavingById((previous) => ({ ...previous, [productId]: isSaving }));
  }, []);

  const saveOverride = useCallback(
    async (row) => {
      const productId = row?.product_id;
      if (!productId) return;

      setSaving(productId, true);
      setError(null);
      try {
        const trimmedBadge = String(row?.manual_badge ?? "").trim();
        const payload = {
          product_id: productId,
          manual_boost: Boolean(row?.manual_boost),
          manual_priority: Number.isFinite(Number(row?.manual_priority))
            ? Math.max(0, Math.floor(Number(row?.manual_priority)))
            : 0,
          badge: trimmedBadge || null,
        };

        const res = await fetch(buildUrl("/api/admin/trending/boost"), {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        updateRow(productId, {
          manual_boost: Boolean(data?.manual_boost),
          manual_priority: data?.manual_priority ?? payload.manual_priority,
          manual_badge: data?.manual_badge ?? payload.badge,
        });

        showToast(
          "Saved",
          row?.name
            ? `Manual override saved for ${row.name}`
            : "Manual override saved",
          "success",
        );
      } catch (err) {
        console.error("Failed to save override:", err);
        setError(err.message || "Failed to save override");
        showToast(
          "Error",
          row?.name
            ? `Failed to save override for ${row.name}`
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

        showToast(
          "Cleared",
          row?.name
            ? `Manual override cleared for ${row.name}`
            : "Manual override cleared",
          "success",
        );
      } catch (err) {
        console.error("Failed to clear override:", err);
        setError(err.message || "Failed to clear override");
        showToast(
          "Error",
          row?.name
            ? `Failed to clear override for ${row.name}`
            : "Failed to clear override",
          "error",
        );
      } finally {
        setSaving(productId, false);
      }
    },
    [authHeaders, setSaving, showToast, updateRow],
  );

  const filteredRows = useMemo(() => {
    const search = String(query || "").trim().toLowerCase();
    if (!search) return rows;

    return rows.filter((row) => {
      const values = [row?.product_id, row?.name, row?.brand, row?.product_type];
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
      sortRows(filteredRows, (row) => getSortValue(row, sortField), {
        direction: sortDirection,
        type: sortMeta.type,
      }),
    [filteredRows, sortDirection, sortField, sortMeta.type],
  );

  const summary = useMemo(() => {
    const scores = rows
      .map((row) => Number(row?.trending_score))
      .filter(Number.isFinite);
    const latestCalculated = rows.reduce((latest, row) => {
      const current = normalizeDateValue(row?.calculated_at);
      if (current === null) return latest;
      return latest === null || current > latest ? current : latest;
    }, null);

    return {
      totalRows: rows.length,
      manualBoosts: rows.filter((row) => Boolean(row?.manual_boost)).length,
      averageScore: scores.length
        ? scores.reduce((sum, value) => sum + value, 0) / scores.length
        : null,
      latestCalculated,
    };
  }, [rows]);

  return (
    <div className="min-h-full bg-slate-50 p-2 sm:p-3">
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-lg ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50"
                : toast.type === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            {toast.type === "success" && (
              <FaCheckCircle className="mt-0.5 text-emerald-500" />
            )}
            {toast.type === "error" && (
              <FaExclamationCircle className="mt-0.5 text-red-500" />
            )}
            {toast.type === "info" && (
              <FaChartLine className="mt-0.5 text-blue-500" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {toast.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 transition hover:text-slate-600"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

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
                  Trending Manager
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Manage manual boosts, compare short-term movement, and keep the
                  trending report usable on both wide desktops and smaller admin
                  screens.
                </p>
                {type === "laptop" && (
                  <p className="text-xs font-medium text-blue-700">
                    Laptop boosts and badges here are reflected on laptop
                    trending cards in the client app.
                  </p>
                )}
                {updatedAt && (
                  <p className="text-xs text-slate-500">
                    Updated at {formatDateTime(updatedAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => fetchTrending()}
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
                onClick={recompute}
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tracked products</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.totalRows}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Manual boosts on</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.manualBoosts}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Average score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatNumber(summary.averageScore, 2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Latest calculation</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatDateTime(summary.latestCalculated || updatedAt)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Product type
              </label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                  placeholder="Search by ID, name, or brand"
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

        <section className="space-y-4 xl:hidden">
          {loading && rows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              <FaSpinner className="mr-2 inline animate-spin" />
              Loading trending report...
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              No results yet. Recompute the report to generate trending data.
            </div>
          ) : (
            sortedRows.map((row, index) => {
              const trend = getTrendData(row);
              const isSaving = Boolean(savingById[row?.product_id]);
              const currentBadge = String(row?.manual_badge ?? "");
              const hasCurrentBadge = BADGE_OPTIONS.some(
                (badge) => badge.value === currentBadge,
              );
              const badgeOptions = hasCurrentBadge
                ? BADGE_OPTIONS
                : [
                    { value: currentBadge, label: `${currentBadge} (Custom)` },
                    ...BADGE_OPTIONS,
                  ];

              return (
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
                        {[row?.brand, row?.product_type]
                          .filter(Boolean)
                          .join(" • ") || "No brand details"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${trend.className}`}
                    >
                      {trend.icon}
                      <span>
                        {trend.delta > 0 ? `+${trend.delta}` : trend.delta}
                      </span>
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Visitors 7d</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {formatNumber(row?.views_7d)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Score</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {formatNumber(row?.trending_score, 2)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Visitors total</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {formatNumber(row?.unique_visitors_total)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Compares 7d</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {formatNumber(row?.compares_7d)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="rounded-2xl border border-slate-200 p-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Manual boost
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(row?.manual_boost)}
                          onChange={(event) =>
                            updateRow(row.product_id, {
                              manual_boost: event.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {row?.manual_boost ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </label>

                    <label className="rounded-2xl border border-slate-200 p-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Priority
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={row?.manual_priority ?? 0}
                        onChange={(event) =>
                          updateRow(row.product_id, {
                            manual_priority: event.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Manual badge
                    </p>
                    <select
                      value={row?.manual_badge ?? ""}
                      onChange={(event) =>
                        updateRow(row.product_id, {
                          manual_badge: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    >
                      {badgeOptions.map((badge) => (
                        <option key={`${badge.label}-${badge.value}`} value={badge.value}>
                          {badge.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Calculated
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {formatDateTime(row?.calculated_at)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Trend change
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {trend.label}
                        {trend.percentage !== null &&
                          ` (${trend.percentage > 0 ? "+" : ""}${Math.round(trend.percentage)}%)`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => saveOverride(row)}
                      disabled={isSaving}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                        isSaving
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                          : "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                      }`}
                    >
                      {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                      Save
                    </button>
                    <button
                      onClick={() => clearOverride(row)}
                      disabled={isSaving}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                        isSaving
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <FaTrash />
                      Clear
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {[
                    "Product",
                    "Brand",
                    "Type",
                    "Trend",
                    "Visitors 7d",
                    "Visitors total",
                    "Compares 7d",
                    "Compares total",
                    "Score",
                    "Calculated",
                    "Manual boost",
                    "Priority",
                    "Badge",
                    "Actions",
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
                      Loading trending report...
                    </td>
                  </tr>
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-slate-600">
                      No results yet. Recompute the report to generate trending data.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, index) => {
                    const trend = getTrendData(row);
                    const isSaving = Boolean(savingById[row?.product_id]);
                    const currentBadge = String(row?.manual_badge ?? "");
                    const hasCurrentBadge = BADGE_OPTIONS.some(
                      (badge) => badge.value === currentBadge,
                    );
                    const badgeOptions = hasCurrentBadge
                      ? BADGE_OPTIONS
                      : [
                          { value: currentBadge, label: `${currentBadge} (Custom)` },
                          ...BADGE_OPTIONS,
                        ];

                    return (
                      <tr
                        key={row?.product_id ?? `${row?.name}-${index}`}
                        className="align-top hover:bg-slate-50"
                      >
                        <td className="min-w-[240px] px-4 py-4">
                          <div className="font-semibold text-slate-900">
                            {row?.name || "-"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            #{index + 1} • ID {row?.product_id ?? "-"}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {row?.brand || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {row?.product_type || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${trend.className}`}
                          >
                            {trend.icon}
                            <span>
                              {trend.delta > 0 ? `+${trend.delta}` : trend.delta}
                            </span>
                            {trend.percentage !== null && (
                              <span>
                                ({trend.percentage > 0 ? "+" : ""}
                                {Math.round(trend.percentage)}%)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatNumber(row?.views_7d)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatNumber(row?.unique_visitors_total)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatNumber(row?.compares_7d)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatNumber(row?.compares_total)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                          {formatNumber(row?.trending_score, 2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatDateTime(row?.calculated_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(row?.manual_boost)}
                              onChange={(event) =>
                                updateRow(row.product_id, {
                                  manual_boost: event.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-medium text-slate-600">
                              {row?.manual_boost ? "On" : "Off"}
                            </span>
                          </label>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <input
                            type="number"
                            min={0}
                            value={row?.manual_priority ?? 0}
                            onChange={(event) =>
                              updateRow(row.product_id, {
                                manual_priority: event.target.value,
                              })
                            }
                            className="w-24 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                          />
                        </td>
                        <td className="min-w-[220px] px-4 py-4">
                          <select
                            value={row?.manual_badge ?? ""}
                            onChange={(event) =>
                              updateRow(row.product_id, {
                                manual_badge: event.target.value,
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                          >
                            {badgeOptions.map((badge) => (
                              <option
                                key={`${badge.label}-${badge.value}`}
                                value={badge.value}
                              >
                                {badge.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveOverride(row)}
                              disabled={isSaving}
                              className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                                isSaving
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
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
                              onClick={() => clearOverride(row)}
                              disabled={isSaving}
                              className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                                isSaving
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
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
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            How manual boost works
          </h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <p>
              Manual boost does not change views or compares. Those numbers still
              come from real activity.
            </p>
            <p>
              Turning on manual boost and increasing priority moves a product
              above algorithm-only ordering.
            </p>
            <p>
              Public APIs keep the clean client payload. This page stays admin
              only for internal controls and diagnostics.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrendingManager;
