import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaExclamationCircle,
  FaFilter,
  FaSearch,
  FaSpinner,
  FaStickyNote,
  FaSyncAlt,
  FaTimesCircle,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

const STATUS_META = {
  new: {
    label: "New",
    chip: "border border-sky-200 bg-sky-50 text-sky-700",
  },
  in_progress: {
    label: "In Progress",
    chip: "border border-amber-200 bg-amber-50 text-amber-700",
  },
  resolved: {
    label: "Resolved",
    chip: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  archived: {
    label: "Archived",
    chip: "border border-slate-200 bg-slate-100 text-slate-700",
  },
};

const normalizeStatus = (value) =>
  String(value || "new")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const getStatusMeta = (value) =>
  STATUS_META[normalizeStatus(value)] || STATUS_META.new;

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

const truncateText = (value, maxLength = 140) => {
  const text = String(value || "").trim();
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
};

const buildReplyMailto = (row) => {
  const params = new URLSearchParams({
    subject: `Re: ${row?.subject_label || "Contact request"}`,
  });
  return `mailto:${encodeURIComponent(row?.email || "")}?${params.toString()}`;
};

const ContactSubmissions = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("received_desc");
  const [activeId, setActiveId] = useState(null);
  const [savingKey, setSavingKey] = useState("");
  const [noteDrafts, setNoteDrafts] = useState({});

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Missing admin token. Please login again.");
      }

      const limit = 100;
      let page = 1;
      let totalCount = 0;
      const allRows = [];

      while (true) {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));

        const response = await fetch(
          buildUrl(`/api/admin/contact-submissions?${params.toString()}`),
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              "The contact submissions API is not available on the current backend. Start or deploy the updated server that includes /api/admin/contact-submissions.",
            );
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const batch = Array.isArray(data?.rows) ? data.rows : [];
        totalCount = Number(data?.total) || totalCount;
        allRows.push(...batch);

        if (batch.length < limit) break;
        if (totalCount && allRows.length >= totalCount) break;
        page += 1;
      }

      setRows(allRows);
    } catch (err) {
      console.error("Failed to fetch contact submissions:", err);
      setError(err?.message || "Failed to load contact submissions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSubmission = useCallback(async (id, patch, successMessage) => {
    const operation = Object.keys(patch).join(",") || "update";
    setSavingKey(`${id}:${operation}`);
    setError("");
    setNotice("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Missing admin token. Please login again.");
      }

      const response = await fetch(
        buildUrl(`/api/admin/contact-submissions/${id}`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(patch),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "The contact submissions API is not available on the current backend. Start or deploy the updated server that includes /api/admin/contact-submissions.",
          );
        }
        throw new Error(data?.message || `HTTP ${response.status}`);
      }

      if (data?.submission) {
        setRows((previous) =>
          previous.map((item) =>
            item.id === id ? { ...item, ...data.submission } : item,
          ),
        );
        setNoteDrafts((previous) => ({
          ...previous,
          [id]: data.submission.admin_notes || "",
        }));
      }

      setNotice(successMessage || data?.message || "Submission updated.");
    } catch (err) {
      console.error("Failed to update contact submission:", err);
      setError(err?.message || "Failed to update submission");
    } finally {
      setSavingKey("");
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const subjectOptions = useMemo(() => {
    const map = new Map();
    rows.forEach((item) => {
      const value = String(item?.subject || "").trim();
      const label = String(item?.subject_label || "").trim();
      if (!value || !label) return;
      if (!map.has(value)) {
        map.set(value, label);
      }
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = String(query || "")
      .trim()
      .toLowerCase();

    return rows.filter((item) => {
      const status = normalizeStatus(item?.status);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (subjectFilter !== "all" && item?.subject !== subjectFilter) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        item?.id,
        item?.full_name,
        item?.email,
        item?.subject,
        item?.subject_label,
        item?.message,
        item?.status,
        item?.admin_notes,
        item?.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [rows, query, statusFilter, subjectFilter]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    const getName = (item) => String(item?.full_name || "").toLowerCase();
    const getSubject = (item) => String(item?.subject_label || "").toLowerCase();
    const getEmail = (item) => String(item?.email || "").toLowerCase();
    const getStatus = (item) => normalizeStatus(item?.status);

    switch (sortBy) {
      case "received_asc":
        return list.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
      case "name_asc":
        return list.sort((a, b) => getName(a).localeCompare(getName(b)));
      case "email_asc":
        return list.sort((a, b) => getEmail(a).localeCompare(getEmail(b)));
      case "subject_asc":
        return list.sort((a, b) => getSubject(a).localeCompare(getSubject(b)));
      case "status_asc":
        return list.sort((a, b) => getStatus(a).localeCompare(getStatus(b)));
      case "received_desc":
      default:
        return list.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
    }
  }, [filteredRows, sortBy]);

  const activeRow = useMemo(() => {
    if (!activeId) return null;
    return rows.find((item) => item.id === activeId) || null;
  }, [rows, activeId]);

  useEffect(() => {
    if (activeId && !activeRow) {
      setActiveId(null);
    }
  }, [activeId, activeRow]);

  const activeNoteValue = activeRow
    ? noteDrafts[activeRow.id] ?? activeRow.admin_notes ?? ""
    : "";
  const activeNoteChanged = activeRow
    ? activeNoteValue !== (activeRow.admin_notes || "")
    : false;

  const stats = useMemo(() => {
    return rows.reduce(
      (summary, item) => {
        const status = normalizeStatus(item?.status);
        summary.total += 1;
        if (status === "new") summary.new += 1;
        if (status === "in_progress") summary.inProgress += 1;
        if (status === "resolved") summary.resolved += 1;
        if (status === "archived") summary.archived += 1;
        return summary;
      },
      {
        total: 0,
        new: 0,
        inProgress: 0,
        resolved: 0,
        archived: 0,
      },
    );
  }, [rows]);

  const updateNoteDraft = (id, value) => {
    setNoteDrafts((previous) => ({
      ...previous,
      [id]: value,
    }));
  };

  const saveActiveNotes = async () => {
    if (!activeRow) return;
    await updateSubmission(
      activeRow.id,
      { admin_notes: activeNoteValue },
      "Admin notes saved.",
    );
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
        <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Contact Inbox
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Manage contact form responses
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Review incoming contact requests from the public site, move them
              through a simple workflow, and keep internal notes in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSubmissions}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
            Refresh inbox
          </button>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
              Total
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {stats.total}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              All stored contact submissions
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">
              New
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {stats.new}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Messages waiting for first review
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
              In Progress
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {stats.inProgress}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Conversations being handled now
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Resolved
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {stats.resolved}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Closed messages with an outcome
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name, email, subject, message"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Status
            </label>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Subject
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Subjects</option>
                {subjectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Sort By
            </label>
            <div className="relative">
              <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="received_desc">Newest Received</option>
                <option value="received_asc">Oldest Received</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="email_asc">Email (A-Z)</option>
                <option value="subject_asc">Subject (A-Z)</option>
                <option value="status_asc">Status (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Visible results:{" "}
          <span className="font-semibold text-slate-900">{sortedRows.length}</span>
          <span className="mx-2 text-slate-300">|</span>
          Archived:{" "}
          <span className="font-semibold text-slate-900">{stats.archived}</span>
        </div>
      </section>

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaExclamationCircle className="mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Received
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaSpinner className="animate-spin" />
                      Loading contact submissions...
                    </span>
                  </td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No contact submissions found for the current filters.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => {
                  const status = normalizeStatus(row.status);
                  const meta = getStatusMeta(status);
                  const isSavingRow = savingKey.startsWith(`${row.id}:`);

                  return (
                    <tr key={row.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="font-semibold text-slate-950">
                          {row.full_name || "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {row.email || "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Source: {row.source || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="font-semibold text-slate-950">
                          {row.subject_label || "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Key: {row.subject || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <p className="max-w-md leading-6 text-slate-600">
                          {truncateText(row.message)}
                        </p>
                        {row.admin_notes ? (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            <FaStickyNote className="text-[10px]" />
                            Note saved
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chip}`}
                        >
                          {meta.label}
                        </span>
                        {row.resolved_at ? (
                          <div className="mt-2 text-xs text-slate-500">
                            Resolved: {formatDateTime(row.resolved_at)}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{formatDateTime(row.created_at)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Updated: {formatDateTime(row.updated_at)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm">
                        <div className="flex min-w-[220px] flex-col gap-2">
                          <select
                            value={status}
                            onChange={(event) =>
                              updateSubmission(
                                row.id,
                                { status: event.target.value },
                                `Status updated to ${
                                  getStatusMeta(event.target.value).label
                                }.`,
                              )
                            }
                            disabled={isSavingRow}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <div className="flex flex-wrap gap-2">
                            <a
                              href={buildReplyMailto(row)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              <FaEnvelope className="text-[10px]" />
                              Reply
                            </a>
                            <button
                              type="button"
                              onClick={() => setActiveId(row.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              <FaArrowRight className="text-[10px]" />
                              Open
                            </button>
                            {status !== "resolved" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  updateSubmission(
                                    row.id,
                                    { status: "resolved" },
                                    "Submission marked as resolved.",
                                  )
                                }
                                disabled={isSavingRow}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                              >
                                <FaCheckCircle className="text-[10px]" />
                                Resolve
                              </button>
                            ) : null}
                            {isSavingRow ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <FaSpinner className="animate-spin" />
                                Saving...
                              </span>
                            ) : null}
                          </div>
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

      {activeRow ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/45">
          <button
            type="button"
            aria-label="Close contact details"
            className="flex-1 cursor-default"
            onClick={() => setActiveId(null)}
          />

          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                    Contact Submission
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    {activeRow.full_name || "Contact request"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Received {formatDateTime(activeRow.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <FaTimesCircle />
                </button>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {activeRow.email || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Subject
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {activeRow.subject_label || "-"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      getStatusMeta(activeRow.status).chip
                    }`}
                  >
                    {getStatusMeta(activeRow.status).label}
                  </span>
                  <span className="text-xs text-slate-500">
                    Updated {formatDateTime(activeRow.updated_at)}
                  </span>
                  {activeRow.resolved_at ? (
                    <span className="text-xs text-slate-500">
                      Resolved {formatDateTime(activeRow.resolved_at)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((option) => {
                    const isActive =
                      normalizeStatus(activeRow.status) === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateSubmission(
                            activeRow.id,
                            { status: option.value },
                            `Status updated to ${option.label}.`,
                          )
                        }
                        disabled={savingKey.startsWith(`${activeRow.id}:`)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        } disabled:opacity-60`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Message
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-slate-950">
                      {activeRow.subject_label || "Contact message"}
                    </h3>
                  </div>

                  <a
                    href={buildReplyMailto(activeRow)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <FaEnvelope className="text-sm" />
                    Reply by email
                  </a>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {activeRow.message || "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <FaStickyNote className="text-slate-400" />
                  <h3 className="text-lg font-bold text-slate-950">
                    Internal notes
                  </h3>
                </div>

                <textarea
                  value={activeNoteValue}
                  onChange={(event) =>
                    updateNoteDraft(activeRow.id, event.target.value)
                  }
                  className="mt-4 min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add follow-up notes, ownership details, or resolution context..."
                />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Saved notes stay attached to this submission for the admin
                    team.
                  </p>
                  <button
                    type="button"
                    onClick={saveActiveNotes}
                    disabled={
                      !activeNoteChanged ||
                      savingKey.startsWith(`${activeRow.id}:`)
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingKey.startsWith(`${activeRow.id}:`) ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaCheckCircle />
                    )}
                    Save notes
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
};

export default ContactSubmissions;
