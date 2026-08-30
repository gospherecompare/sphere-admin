import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildUrl, getAuthToken } from "../../api";

const authHeaders = () => {
  const token = getAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const StatCard = ({ label, value, tone = "default" }) => {
  const toneClasses = {
    default: "bg-blue-50 text-blue-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="border border-slate-200 bg-white px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">
            {value}
          </p>
        </div>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </span>
      </div>
    </div>
  );
};

const normalizeGenerationStatus = (value) => {
  const normalized = String(value ?? "not_created")
    .trim()
    .toLowerCase();

  if (["success", "completed", "generated"].includes(normalized)) {
    return "generated";
  }

  if (["processing", "pending", "generating"].includes(normalized)) {
    return "pending";
  }

  if (["waiting_for_data", "waiting-for-data", "waiting"].includes(normalized)) {
    return "waiting_for_data";
  }

  if (["failed", "failure", "error"].includes(normalized)) {
    return "failed";
  }

  if (["disabled"].includes(normalized)) {
    return "disabled";
  }

  if (["not_created", "not created", "not-generated", "not generated", "empty", "null"].includes(normalized)) {
    return "not_created";
  }

  return normalized || "not_created";
};

const getGenerationStatusMeta = (value) => {
  const status = normalizeGenerationStatus(value);

  if (status === "generated") {
    return {
      label: "Completed",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "pending") {
    return {
      label: "Pending",
      className: "border border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (status === "waiting_for_data") {
    return {
      label: "Waiting for data",
      className: "border border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  if (status === "failed") {
    return {
      label: "Failed",
      className: "border border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (status === "disabled") {
    return {
      label: "Disabled",
      className: "border border-slate-200 bg-slate-50 text-slate-500",
    };
  }

  return {
    label: "Not generated",
    className: "border border-slate-200 bg-slate-50 text-slate-500",
  };
};

export default function GeminiGenerationList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(buildUrl("/api/admin/ai/history?limit=100"), {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load generation history");
      }
      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(1);
    } catch (error) {
      console.error("Failed to load generation history", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const name = (item.entity_name || `${item.entity_type || "entry"} #${item.entity_id}`).toLowerCase();
      const statusValue = normalizeGenerationStatus(item.status);
      const matchesSearch =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        String(item.model || "").toLowerCase().includes(normalizedSearch) ||
        statusValue.includes(normalizedSearch) ||
        String(item.status || "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || statusValue === statusFilter;
      const matchesEntity = entityFilter === "all" || item.entity_type === entityFilter;
      const matchesModel = modelFilter === "all" || item.model === modelFilter;
      return matchesSearch && matchesStatus && matchesEntity && matchesModel;
    });
  }, [entityFilter, items, modelFilter, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const modelOptions = Array.from(
    new Set(items.map((item) => item.model).filter(Boolean)),
  );

  const totalGenerations = items.length;
  const generatedCount = items.filter(
    (item) => normalizeGenerationStatus(item.status) === "generated",
  ).length;
  const pendingCount = items.filter(
    (item) => normalizeGenerationStatus(item.status) === "pending",
  ).length;
  const waitingCount = items.filter(
    (item) => normalizeGenerationStatus(item.status) === "waiting_for_data",
  ).length;
  const failureCount = items.filter(
    (item) => normalizeGenerationStatus(item.status) === "failed",
  ).length;
  const notGeneratedCount = items.filter(
    (item) => normalizeGenerationStatus(item.status) === "not_created",
  ).length;

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="space-y-5">
        <header className="border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Gemini AI
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-900">
                Generated Content
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/settings/gemini/create"
                className="inline-flex h-11 items-center justify-center gap-2 border border-[#345CFF] bg-[#345CFF] px-4 text-sm font-semibold text-white transition hover:bg-[#264ce5]"
              >
                Create generation
              </Link>
              <Link
                to="/settings/gemini/config"
                className="inline-flex h-11 items-center justify-center border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Provider config
              </Link>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 2xl:grid-cols-6">
          <StatCard label="Total" value={totalGenerations} tone="default" />
          <StatCard label="Completed" value={generatedCount} tone="success" />
          <StatCard label="Pending" value={pendingCount} tone="warning" />
          <StatCard label="Waiting" value={waitingCount} tone="neutral" />
          <StatCard label="Failed" value={failureCount} tone="neutral" />
          <StatCard label="Not generated" value={notGeneratedCount} tone="neutral" />
        </div>

        <section className="overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-2 py-3 sm:px-3 lg:px-4">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.75fr))_auto]">
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, model, or status..."
                  className="h-11 w-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#345CFF] focus:ring-0"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  ⌕
                </span>
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#345CFF] focus:ring-0"
              >
                <option value="all">All status</option>
                <option value="generated">Completed</option>
                <option value="pending">Pending</option>
                <option value="waiting_for_data">Waiting for data</option>
                <option value="failed">Failed</option>
                <option value="not_created">Not generated</option>
              </select>

              <select
                value={entityFilter}
                onChange={(event) => setEntityFilter(event.target.value)}
                className="h-11 border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#345CFF] focus:ring-0"
              >
                <option value="all">All entities</option>
                <option value="product">Product</option>
                <option value="blog">News</option>
                <option value="smartphone">Smartphone</option>
              </select>

              <select
                value={modelFilter}
                onChange={(event) => setModelFilter(event.target.value)}
                className="h-11 border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#345CFF] focus:ring-0"
              >
                <option value="all">All models</option>
                {modelOptions.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setEntityFilter("all");
                  setModelFilter("all");
                }}
                className="inline-flex h-11 items-center justify-center border border-slate-200 bg-white px-3 text-sm font-semibold text-[#345CFF] transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>

          {loading ? (
            <div className="border-t border-slate-200 bg-white p-4 text-sm font-medium text-slate-600">
              Loading generation history...
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 lg:block">
                <table className="min-w-[1100px] w-full text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <th className="px-3 py-3 xl:px-4">Name</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Model</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3 text-right xl:px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.length ? (
                      paginatedItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-200 transition hover:bg-slate-50">
                          <td className="px-3 py-3 xl:px-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {item.entity_name || item.entity_type || "Generated content"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.model || "gemini-3.6-flash"}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-3 capitalize text-slate-700">
                            {item.entity_type || "product"}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {item.model || "gemini-3.6-flash"}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getGenerationStatusMeta(item.status).className}`}
                            >
                              {getGenerationStatusMeta(item.status).label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {formatDate(item.generated_at || item.updated_at)}
                          </td>
                          <td className="px-3 py-3 text-right xl:px-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/settings/gemini/generations/${item.id}`}
                                className="inline-flex h-9 items-center justify-center border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                View
                              </Link>
                              <Link
                                to={`/settings/gemini/generations/${item.id}/edit`}
                                className="inline-flex h-9 items-center justify-center border border-[#345CFF] bg-[#345CFF] px-3 text-xs font-semibold text-white transition hover:bg-[#264ce5]"
                              >
                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-3xl">—</span>
                            <p className="text-base font-semibold text-slate-700">No generations found</p>
                            <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 lg:hidden">
                {paginatedItems.length ? (
                  paginatedItems.map((item) => (
                    <div key={item.id} className="border-b border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold text-slate-900">
                            {item.entity_name || item.entity_type || "Generated content"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.entity_type || "product"} • {item.model || "gemini-3.6-flash"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.status || "generated"} • {formatDate(item.generated_at || item.updated_at)}
                          </p>
                        </div>
                        <Link
                          to={`/settings/gemini/generations/${item.id}/edit`}
                          className="inline-flex h-9 items-center justify-center border border-[#345CFF] bg-[#345CFF] px-3 text-xs font-semibold text-white"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border-t border-slate-200 bg-white p-5 text-sm text-slate-500">
                    No generation matches the current filters.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 sm:px-4">
                <span>
                  Showing {paginatedItems.length ? (currentPage - 1) * pageSize + 1 : 0}–
                  {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage <= 1}
                    className="flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ‹
                  </button>
                  <span className="min-w-[48px] text-center font-semibold text-slate-700">{currentPage}</span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
