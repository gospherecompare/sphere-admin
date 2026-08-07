import React, { useEffect, useState } from "react";
import { FaPlus, FaSave, FaSpinner, FaSyncAlt } from "react-icons/fa";
import { buildUrl, getAuthToken } from "../api";

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 sm:px-3 md:px-4";
const CARD_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";
const SECTION_HEADER_CLASS = "border-b border-slate-200 bg-white px-3 py-4 sm:px-4";
const FIELD_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4C35F2] focus:bg-white focus:ring-0";
const TEXTAREA_CLASS =
  "min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4C35F2] focus:bg-white focus:ring-0";
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white transition hover:bg-[#3E29DE] disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
const TABLE_ACTION_BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

const normalizeText = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const formatIssuesText = (issues) => {
  if (Array.isArray(issues)) {
    return JSON.stringify(issues, null, 2);
  }
  if (!issues) return "[]";
  if (typeof issues === "string") {
    try {
      const parsed = JSON.parse(issues);
      return Array.isArray(parsed) ? JSON.stringify(parsed, null, 2) : issues;
    } catch {
      return issues;
    }
  }
  return String(issues);
};

const parseIssuesValue = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [String(value)];
};

const toInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const toApiDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const getHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const MerchantProductSync = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [createData, setCreateData] = useState({
    product_id: "",
    enabled: true,
    merchant_product_id: "",
    status: "",
    last_synced_at: "",
    issues: "[]",
  });
  const [editValues, setEditValues] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4500);
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl("/api/merchant-product-sync"), {
        method: "GET",
        headers: getHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRecords(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "Failed to load merchant sync records.");
      showToast("Unable to load merchant sync records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleCreateChange = (field, value) => {
    setCreateData((current) => ({ ...current, [field]: value }));
  };

  const handleCreate = async () => {
    if (!createData.product_id.trim()) {
      showToast("Product ID is required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        product_id: Number(createData.product_id),
        enabled: Boolean(createData.enabled),
        merchant_product_id: normalizeText(createData.merchant_product_id) || null,
        status: normalizeText(createData.status) || null,
        last_synced_at: toApiDateTime(createData.last_synced_at),
        issues: parseIssuesValue(createData.issues),
      };

      const res = await fetch(buildUrl("/api/merchant-product-sync"), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRecords((current) => [data.data, ...current.filter((item) => item.product_id !== data.data.product_id)]);
      setCreateData({
        product_id: "",
        enabled: true,
        merchant_product_id: "",
        status: "",
        last_synced_at: "",
        issues: "[]",
      });
      showToast("Merchant sync record created", "success");
    } catch (err) {
      showToast(err.message || "Failed to create merchant sync record", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (productId, field, value) => {
    setEditValues((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }));
  };

  const getEditValue = (row, field) => {
    const rowEdits = editValues[row.product_id] || {};
    if (rowEdits[field] !== undefined) return rowEdits[field];
    if (field === "last_synced_at") return toInputDateTime(row[field]);
    if (field === "issues") return formatIssuesText(row[field]);
    if (field === "enabled") return Boolean(row.enabled);
    return row[field] ?? "";
  };

  const buildPatchPayload = (row) => {
    const rowEdits = editValues[row.product_id];
    if (!rowEdits) return null;

    const payload = {};
    if (rowEdits.enabled !== undefined && rowEdits.enabled !== row.enabled) {
      payload.enabled = Boolean(rowEdits.enabled);
    }
    if (
      rowEdits.merchant_product_id !== undefined &&
      normalizeText(rowEdits.merchant_product_id) !== normalizeText(row.merchant_product_id)
    ) {
      payload.merchant_product_id = normalizeText(rowEdits.merchant_product_id) || null;
    }
    if (
      rowEdits.status !== undefined &&
      normalizeText(rowEdits.status) !== normalizeText(row.status)
    ) {
      payload.status = normalizeText(rowEdits.status) || null;
    }
    if (rowEdits.last_synced_at !== undefined) {
      const normalized = toApiDateTime(rowEdits.last_synced_at);
      const original = row.last_synced_at ? toApiDateTime(row.last_synced_at) : null;
      if (normalized !== original) {
        payload.last_synced_at = normalized;
      }
    }
    if (rowEdits.issues !== undefined) {
      const parsed = parseIssuesValue(rowEdits.issues);
      const original = Array.isArray(row.issues) ? row.issues : parseIssuesValue(row.issues);
      if (JSON.stringify(parsed) !== JSON.stringify(original)) {
        payload.issues = parsed;
      }
    }

    return Object.keys(payload).length ? payload : null;
  };

  const handleSaveRow = async (row) => {
    const payload = buildPatchPayload(row);
    if (!payload) {
      showToast("No changes detected", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(buildUrl(`/api/merchant-product-sync/${row.product_id}`), {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRecords((current) =>
        current.map((item) =>
          item.product_id === data.data.product_id ? data.data : item,
        ),
      );
      setEditValues((current) => {
        const next = { ...current };
        delete next[row.product_id];
        return next;
      });
      showToast("Merchant sync record updated", "success");
    } catch (err) {
      showToast(err.message || "Failed to update merchant sync record", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={PAGE_CLASS}>
      <div className={CARD_CLASS}>
        <div className={SECTION_HEADER_CLASS}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">Merchant Product Sync</p>
              <p className="mt-1 text-sm text-slate-500">
                Create and manage merchant sync metadata for product records.
              </p>
            </div>
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              onClick={fetchRecords}
              disabled={loading || saving}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Refreshing
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr,1fr,1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Product ID
              </label>
              <input
                type="number"
                name="product_id"
                value={createData.product_id}
                onChange={(event) => handleCreateChange("product_id", event.target.value)}
                className={FIELD_CLASS}
                placeholder="Enter product id"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Merchant Product ID
              </label>
              <input
                type="text"
                name="merchant_product_id"
                value={createData.merchant_product_id}
                onChange={(event) => handleCreateChange("merchant_product_id", event.target.value)}
                className={FIELD_CLASS}
                placeholder="Optional merchant product id"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sync Status
              </label>
              <input
                type="text"
                name="status"
                value={createData.status}
                onChange={(event) => handleCreateChange("status", event.target.value)}
                className={FIELD_CLASS}
                placeholder="e.g. synced, pending"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Last Synced At
              </label>
              <input
                type="datetime-local"
                value={createData.last_synced_at}
                onChange={(event) => handleCreateChange("last_synced_at", event.target.value)}
                className={FIELD_CLASS}
              />
            </div>
            <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-4">
              <label className="text-sm font-medium text-slate-700">Sync Enabled</label>
              <input
                type="checkbox"
                checked={Boolean(createData.enabled)}
                onChange={(event) => handleCreateChange("enabled", event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Issues
            </label>
            <textarea
              value={createData.issues}
              onChange={(event) => handleCreateChange("issues", event.target.value)}
              className={TEXTAREA_CLASS}
              placeholder='Enter JSON array, e.g. ["price mismatch"]'
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Use this form to create a new merchant sync record. Existing product ids will be updated automatically.
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className={PRIMARY_BUTTON_CLASS}
              disabled={saving}
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving
                </>
              ) : (
                <>
                  <FaPlus /> Create record
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={CARD_CLASS}>
        <div className={SECTION_HEADER_CLASS}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">Sync Records</p>
              <p className="mt-1 text-sm text-slate-500">
                Update merchant sync metadata for existing product records.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              {loading ? "Loading records..." : `${records.length} record(s)`}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-4 sm:p-5">
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="px-3 py-3 font-semibold">Product ID</th>
                <th className="px-3 py-3 font-semibold">Enabled</th>
                <th className="px-3 py-3 font-semibold">Merchant Product ID</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Last Synced At</th>
                <th className="px-3 py-3 font-semibold">Issues</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.map((row) => (
                <tr key={row.product_id} className="bg-white">
                  <td className="px-3 py-3 align-top text-slate-800">{row.product_id}</td>
                  <td className="px-3 py-3 align-top">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(getEditValue(row, "enabled"))}
                        onChange={(event) => handleEditChange(row.product_id, "enabled", event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                      />
                    </label>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      type="text"
                      value={getEditValue(row, "merchant_product_id")}
                      onChange={(event) => handleEditChange(row.product_id, "merchant_product_id", event.target.value)}
                      className={FIELD_CLASS}
                      placeholder="Merchant product id"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      type="text"
                      value={getEditValue(row, "status")}
                      onChange={(event) => handleEditChange(row.product_id, "status", event.target.value)}
                      className={FIELD_CLASS}
                      placeholder="Status"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      type="datetime-local"
                      value={getEditValue(row, "last_synced_at")}
                      onChange={(event) => handleEditChange(row.product_id, "last_synced_at", event.target.value)}
                      className={FIELD_CLASS}
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea
                      value={getEditValue(row, "issues")}
                      onChange={(event) => handleEditChange(row.product_id, "issues", event.target.value)}
                      className={TEXTAREA_CLASS}
                      placeholder='JSON array or comma-separated list'
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => handleSaveRow(row)}
                      className={TABLE_ACTION_BUTTON_CLASS}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <FaSpinner className="animate-spin" /> Save
                        </>
                      ) : (
                        <>
                          <FaSave /> Save
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {!records.length && !loading ? (
                <tr>
                  <td className="px-3 py-10 text-center text-slate-500" colSpan={7}>
                    No merchant sync records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${
                toast.type === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              {toast.type === "success" ? "✓" : "!"}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{toast.type === "success" ? "Success" : "Error"}</p>
              <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MerchantProductSync;
