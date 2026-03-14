import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaArrowRight,
  FaBriefcase,
  FaCheckCircle,
  FaChevronRight,
  FaDownload,
  FaExclamationCircle,
  FaFilter,
  FaSearch,
  FaSort,
  FaSpinner,
  FaSyncAlt,
  FaTimesCircle,
  FaUserCheck,
  FaUserClock,
} from "react-icons/fa";
import CareerApplicationDetails from "./CareerApplicationDetails";
import { buildUrl, getAuthToken } from "../../api";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "shortlisted", label: "Assignment Sent" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "hr_round", label: "HR Round" },
  { value: "offered", label: "Offer Sent" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_META = {
  new: {
    label: "New",
    chip: "bg-slate-100 text-slate-700 border border-slate-200",
    bar: "bg-slate-500",
  },
  screening: {
    label: "Screening",
    chip: "bg-amber-50 text-amber-700 border border-amber-200",
    bar: "bg-amber-500",
  },
  shortlisted: {
    label: "Assignment Sent",
    chip: "bg-blue-50 text-blue-700 border border-blue-200",
    bar: "bg-blue-500",
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    chip: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    bar: "bg-indigo-500",
  },
  hr_round: {
    label: "HR Round",
    chip: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200",
    bar: "bg-fuchsia-500",
  },
  offered: {
    label: "Offer Sent",
    chip: "bg-violet-50 text-violet-700 border border-violet-200",
    bar: "bg-violet-500",
  },
  hired: {
    label: "Hired",
    chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    bar: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    chip: "bg-red-50 text-red-700 border border-red-200",
    bar: "bg-red-500",
  },
};

const NEXT_STATUS = {
  new: "screening",
  screening: "shortlisted",
  shortlisted: "interview_scheduled",
  interview_scheduled: "hr_round",
  hr_round: "offered",
  offered: "hired",
};

const IN_PROGRESS_STATUS = new Set([
  "screening",
  "shortlisted",
  "interview_scheduled",
  "hr_round",
  "offered",
]);

const PIPELINE_STAGES = [
  "new",
  "screening",
  "shortlisted",
  "interview_scheduled",
  "hr_round",
  "offered",
  "hired",
];

const HIRING_STEPS = [
  { key: "new", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "shortlisted", label: "Assignment" },
  { key: "interview_scheduled", label: "Interview" },
  { key: "hr_round", label: "HR Round" },
  { key: "offered", label: "Offer" },
  { key: "hired", label: "Hired" },
];

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

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString();
};

const toInputDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const toInputDateTime = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const offset = parsed.getTimezoneOffset() * 60000;
  const local = new Date(parsed.getTime() - offset);
  return local.toISOString().slice(0, 16);
};

const toIsoDateTime = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
};

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const EDUCATION_SECTIONS = [
  {
    key: "tenth",
    label: "10th",
    fields: [
      { key: "board", label: "Board" },
      { key: "stream", label: "Stream" },
      { key: "marks", label: "Marks" },
      { key: "year", label: "Year" },
    ],
  },
  {
    key: "twelfth",
    label: "12th",
    fields: [
      { key: "board", label: "Board" },
      { key: "stream", label: "Stream" },
      { key: "marks", label: "Marks" },
      { key: "year", label: "Year" },
    ],
  },
  {
    key: "ug",
    label: "UG",
    fields: [
      { key: "institute", label: "Institute" },
      { key: "stream", label: "Stream" },
      { key: "marks", label: "Marks" },
      { key: "year", label: "Year" },
    ],
  },
  {
    key: "pg",
    label: "PG",
    fields: [
      { key: "institute", label: "Institute" },
      { key: "stream", label: "Stream" },
      { key: "marks", label: "Marks" },
      { key: "year", label: "Year" },
    ],
  },
];

const normalizeLabelValue = (value) => {
  const text = String(value ?? "").trim();
  return text.length ? text : "-";
};

const getInitials = (firstName, lastName) => {
  const first = String(firstName || "").trim();
  const last = String(lastName || "").trim();
  const initial =
    (first ? first[0] : "") + (last ? last[0] : "");
  return initial ? initial.toUpperCase() : "NA";
};

const getProgressPercent = (statusValue) => {
  const status = normalizeStatus(statusValue);
  if (status === "rejected") return 0;
  const idx = PIPELINE_STAGES.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
};

const CareerApplications = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("applied_desc");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [actionDrafts, setActionDrafts] = useState({});
  const [actionSending, setActionSending] = useState({});
  const [notice, setNotice] = useState("");

  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const selectAllRef = useRef(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
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

        const response = await fetch(buildUrl(`/api/admin/careers?${params}`), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
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
      setTotal(totalCount || allRows.length);
    } catch (err) {
      console.error("Failed to fetch career applications:", err);
      setError(err.message || "Failed to load career applications");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id, nextStatus) => {
    const normalized = normalizeStatus(nextStatus);
    setUpdatingId(id);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Missing admin token. Please login again.");
      }

      const response = await fetch(
        buildUrl(`/api/admin/careers/${id}/status`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: normalized }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const updatedStatus = normalizeStatus(
        data?.application?.status || normalized,
      );
      const updatedAt =
        data?.application?.updated_at || new Date().toISOString();

      setRows((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: updatedStatus,
                updated_at: updatedAt,
              }
            : item,
        ),
      );
    } catch (err) {
      console.error("Failed to update application status:", err);
      setError(err.message || "Failed to update application status");
    } finally {
      setUpdatingId(null);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [rows]);

  const roleOptions = useMemo(() => {
    const map = new Map();
    rows.forEach((item) => {
      const label = String(item?.role || "").trim();
      if (!label) return;
      const key = label.toLowerCase();
      if (!map.has(key)) map.set(key, label);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    const roleValue = String(roleFilter || "")
      .trim()
      .toLowerCase();

    return rows.filter((item) => {
      const status = normalizeStatus(item?.status);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (roleValue !== "all") {
        const role = String(item?.role || "")
          .trim()
          .toLowerCase();
        if (!role || role !== roleValue) return false;
      }

      if (!q) return true;
      const haystack = [
        item?.id,
        item?.role,
        item?.first_name,
        item?.last_name,
        item?.email,
        item?.phone,
        item?.preferred_location,
        item?.experience_level,
        item?.employment_status,
        item?.current_company,
        item?.current_designation,
        item?.skills,
        item?.projects,
        item?.cover_letter,
        item?.application_place,
        item?.gender,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query, statusFilter, roleFilter]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    const getName = (item) =>
      `${item?.first_name || ""} ${item?.last_name || ""}`.trim().toLowerCase();
    const getRole = (item) => String(item?.role || "").toLowerCase();
    const getEmail = (item) => String(item?.email || "").toLowerCase();
    const getStatus = (item) => normalizeStatus(item?.status);

    switch (sortBy) {
      case "applied_asc":
        return list.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
      case "name_asc":
        return list.sort((a, b) => getName(a).localeCompare(getName(b)));
      case "name_desc":
        return list.sort((a, b) => getName(b).localeCompare(getName(a)));
      case "email_asc":
        return list.sort((a, b) => getEmail(a).localeCompare(getEmail(b)));
      case "role_asc":
        return list.sort((a, b) => getRole(a).localeCompare(getRole(b)));
      case "status_asc":
        return list.sort((a, b) => getStatus(a).localeCompare(getStatus(b)));
      case "applied_desc":
      default:
        return list.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
    }
  }, [filteredRows, sortBy]);

  const activeRow = useMemo(() => {
    if (!activeId) return null;
    return rows.find((row) => row.id === activeId) || null;
  }, [rows, activeId]);

  const activeDetail = useMemo(() => {
    if (!activeRow) return null;
    const status = normalizeStatus(activeRow.status);
    const meta = getStatusMeta(status);
    const actionDraft = actionDrafts[activeRow.id] || {};
    const timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const assignmentPdfValue =
      actionDraft.assignmentPdfUrl !== undefined
        ? actionDraft.assignmentPdfUrl
        : activeRow.assignment_pdf_url || "";
    const assignmentDueValue =
      actionDraft.assignmentDueDate !== undefined
        ? actionDraft.assignmentDueDate
        : toInputDate(activeRow.assignment_due_date);
    const interviewMeetValue =
      actionDraft.interviewMeetLink !== undefined
        ? actionDraft.interviewMeetLink
        : activeRow.interview_link || "";
    const interviewScheduleValue =
      actionDraft.interviewScheduledAt !== undefined
        ? actionDraft.interviewScheduledAt
        : toInputDateTime(activeRow.interview_scheduled_at);
    const hrScheduleValue =
      actionDraft.hrScheduledAt !== undefined
        ? actionDraft.hrScheduledAt
        : toInputDateTime(activeRow.hr_scheduled_at);
    const offerPdfValue =
      actionDraft.offerPdfUrl !== undefined
        ? actionDraft.offerPdfUrl
        : activeRow.offer_pdf_url || "";

    return {
      row: activeRow,
      status,
      meta,
      actionDraft,
      timeZone,
      assignmentPdfValue,
      assignmentDueValue,
      interviewMeetValue,
      interviewScheduleValue,
      hrScheduleValue,
      offerPdfValue,
      actionSending: {
        assignment: actionSending[`${activeRow.id}:assignment`],
        interview: actionSending[`${activeRow.id}:interview`],
        hr: actionSending[`${activeRow.id}:hr`],
        offer: actionSending[`${activeRow.id}:offer`],
      },
    };
  }, [activeRow, actionDrafts, actionSending]);

  useEffect(() => {
    if (activeId && !activeRow) {
      setActiveId(null);
    }
  }, [activeId, activeRow]);

  const visibleIds = useMemo(
    () => sortedRows.map((row) => row.id),
    [sortedRows],
  );
  const selectedOnPage = useMemo(
    () => visibleIds.filter((id) => selectedIds.has(id)),
    [visibleIds, selectedIds],
  );
  const allOnPageSelected =
    visibleIds.length > 0 && selectedOnPage.length === visibleIds.length;
  const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someOnPageSelected;
    }
  }, [someOnPageSelected]);

  const updateSelected = (updater) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      updater(next);
      return next;
    });
  };

  const toggleSelectAllOnPage = (checked) => {
    updateSelected((set) => {
      if (checked) {
        visibleIds.forEach((id) => set.add(id));
      } else {
        visibleIds.forEach((id) => set.delete(id));
      }
    });
  };

  const toggleSelectOne = (id) => {
    updateSelected((set) => {
      if (set.has(id)) set.delete(id);
      else set.add(id);
    });
  };

  const updateDraft = (id, patch) => {
    setActionDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        ...patch,
      },
    }));
  };

  const setActionLoading = (id, type, value) => {
    const key = `${id}:${type}`;
    setActionSending((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const sendHiringAction = async (id, type, payload) => {
    setError(null);
    setNotice("");
    setActionLoading(id, type, true);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Missing admin token. Please login again.");
      }

      const body = {
        type,
        ...payload,
      };

      Object.keys(body).forEach((key) => {
        if (body[key] === undefined || body[key] === null || body[key] === "") {
          delete body[key];
        }
      });

      const response = await fetch(
        buildUrl(`/api/admin/careers/${id}/notify`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || `HTTP ${response.status}`);
      }

      if (data?.application) {
        setRows((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, ...data.application } : item,
          ),
        );
      }

      setNotice("Notification sent successfully.");
    } catch (err) {
      console.error("Hiring notification error:", err);
      setError(err.message || "Failed to send notification");
    } finally {
      setActionLoading(id, type, false);
    }
  };

  const buildEmailCsv = (list) => {
    const emails = new Set();
    list.forEach((item) => {
      const email = String(item?.email || "").trim();
      if (email) emails.add(email);
    });

    if (!emails.size) return null;

    const header = "email";
    const body = Array.from(emails)
      .map((email) => `"${email.replace(/"/g, '""')}"`)
      .join("\n");
    return `${header}\n${body}\n`;
  };

  const downloadCsv = (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportEmails = (mode) => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const list =
      mode === "selected"
        ? rows.filter((item) => selectedIds.has(item.id))
        : sortedRows;

    const csv = buildEmailCsv(list);
    if (!csv) {
      setError("No emails available to export");
      return;
    }

    const label = mode === "selected" ? "selected" : "filtered";
    downloadCsv(csv, `career-emails-${label}-${dateStamp}.csv`);
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) {
      setError("Please select a status for bulk action");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Select at least one application to apply bulk action");
      return;
    }

    setBulkUpdating(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Missing admin token. Please login again.");
      }

      const normalized = normalizeStatus(bulkStatus);
      const ids = Array.from(selectedIds);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const response = await fetch(
              buildUrl(`/api/admin/careers/${id}/status`),
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: normalized }),
              },
            );

            if (!response.ok) {
              return { id, ok: false };
            }

            const data = await response.json().catch(() => ({}));
            return {
              id,
              ok: true,
              status: normalizeStatus(data?.application?.status || normalized),
              updated_at:
                data?.application?.updated_at || new Date().toISOString(),
            };
          } catch (err) {
            return { id, ok: false };
          }
        }),
      );

      const updates = new Map(
        results
          .filter((r) => r.ok)
          .map((r) => [r.id, { status: r.status, updated_at: r.updated_at }]),
      );

      setRows((prev) =>
        prev.map((item) =>
          updates.has(item.id) ? { ...item, ...updates.get(item.id) } : item,
        ),
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length) {
        setError(`${failed.length} application(s) failed to update`);
      } else {
        setSelectedIds(new Set());
      }
    } catch (err) {
      setError(err.message || "Failed to apply bulk action");
    } finally {
      setBulkUpdating(false);
    }
  };

  const stats = useMemo(() => {
    const normalized = rows.map((item) => normalizeStatus(item.status));
    return {
      total,
      newCount: normalized.filter((status) => status === "new").length,
      inProcess: normalized.filter((status) => IN_PROGRESS_STATUS.has(status))
        .length,
      hired: normalized.filter((status) => status === "hired").length,
      rejected: normalized.filter((status) => status === "rejected").length,
    };
  }, [rows, total]);

  return (
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-blue-100 rounded-lg">
                <FaBriefcase className="text-blue-600" />
              </span>
              Career Hiring Pipeline
            </h1>
            <p className="text-gray-600 mt-2">
              Manage applicants with structured hiring actions and clear stage
              tracking.
            </p>
          </div>
          <button
            onClick={fetchApplications}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Total Applications
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            New Candidates
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-700">
            {stats.newCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
            <FaUserClock className="text-amber-500" />
            In Process
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {stats.inProcess}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
            <FaUserCheck className="text-emerald-500" />
            Final Outcomes
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stats.hired + stats.rejected}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Hired: {stats.hired} | Rejected: {stats.rejected}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name, role, email, location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stages</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>
            <div className="relative">
              <FaBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sort By
            </label>
            <div className="relative">
              <FaSort className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="applied_desc">Newest Applied</option>
                <option value="applied_asc">Oldest Applied</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="email_asc">Email (A-Z)</option>
                <option value="role_asc">Role (A-Z)</option>
                <option value="status_asc">Status (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <div className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
              Visible results: <strong>{sortedRows.length}</strong>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-600">
              Selected:{" "}
              <span className="font-semibold">{selectedIds.size}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleExportEmails("filtered")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <FaDownload className="text-sm" />
                Export Emails
              </button>
              <button
                type="button"
                onClick={() => handleExportEmails("selected")}
                disabled={selectedIds.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
              >
                <FaDownload className="text-sm" />
                Export Selected
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="text-sm font-semibold text-gray-700">
              Bulk Action
            </div>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkStatusUpdate}
              disabled={bulkUpdating || selectedIds.size === 0 || !bulkStatus}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-50"
            >
              {bulkUpdating ? <FaSpinner className="animate-spin" /> : null}
              Apply
            </button>
          </div>
        </div>
      </div>

      {notice ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
          <FaExclamationCircle className="mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                    aria-label="Select all visible applications"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Experience
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  CTC / Notice
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Hiring Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Actions
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Applied On
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaSpinner className="animate-spin" />
                      Loading applications...
                    </span>
                  </td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No career applications found for selected filters.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => {
                  const status = normalizeStatus(row.status);
                  const meta = getStatusMeta(status);
                  const nextStatus = NEXT_STATUS[status];
                  const progress = getProgressPercent(status);
                  const isUpdating = updatingId === row.id;

                  return (
                    <tr key={row.id} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelectOne(row.id)}
                          aria-label={`Select ${row.first_name || "candidate"}`}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold">
                          {`${row.first_name || ""} ${row.last_name || ""}`.trim() ||
                            "-"}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {row.email || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.phone || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.preferred_location || "-"}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveId(row.id)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <FaChevronRight className="text-[10px]" />
                          View details
                        </button>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">
                          {row.role || "-"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {row.current_designation || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.current_company || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{row.experience_level || "-"}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {row.employment_status || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(row.expected_ctc)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Notice: {row.notice_period || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chip}`}
                        >
                          {meta.label}
                        </span>
                        <div className="mt-2 w-36 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full ${meta.bar}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {status === "rejected"
                            ? "Pipeline closed"
                            : `${progress}% pipeline completion`}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <select
                            value={status}
                            onChange={(e) => updateStatus(row.id, e.target.value)}
                            disabled={isUpdating}
                            className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-wrap gap-2">
                            {nextStatus && status !== "rejected" ? (
                              <button
                                type="button"
                                onClick={() => updateStatus(row.id, nextStatus)}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                              >
                                <FaArrowRight className="text-[10px]" />
                                Move to {getStatusMeta(nextStatus).label}
                              </button>
                            ) : null}
                            {status !== "rejected" && status !== "hired" ? (
                              <button
                                type="button"
                                onClick={() => updateStatus(row.id, "rejected")}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                              >
                                <FaTimesCircle className="text-[10px]" />
                                Reject
                              </button>
                            ) : null}
                            {status === "rejected" ? (
                              <button
                                type="button"
                                onClick={() => updateStatus(row.id, "screening")}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                              >
                                Reopen
                              </button>
                            ) : null}
                            {status !== "hired" && status !== "rejected" ? (
                              <button
                                type="button"
                                onClick={() => updateStatus(row.id, "hired")}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                              >
                                <FaCheckCircle className="text-[10px]" />
                                Mark Hired
                              </button>
                            ) : null}
                            {isUpdating ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                <FaSpinner className="animate-spin" />
                                Updating...
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{formatDateTime(row.created_at)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Last update: {formatDateTime(row.updated_at)}
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

      <CareerApplicationDetails
        open={Boolean(activeDetail)}
        onClose={() => setActiveId(null)}
        detail={activeDetail}
        hiringSteps={HIRING_STEPS}
        educationSections={EDUCATION_SECTIONS}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        normalizeLabelValue={normalizeLabelValue}
        getInitials={getInitials}
        updateDraft={updateDraft}
        sendHiringAction={sendHiringAction}
        toIsoDateTime={toIsoDateTime}
      />
    </div>
  );
};

export default CareerApplications;
