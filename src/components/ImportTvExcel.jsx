import React, { useMemo, useRef, useState } from "react";
import {
  FaCheckCircle,
  FaCloudUploadAlt,
  FaDownload,
  FaExclamationTriangle,
  FaFileExcel,
  FaSpinner,
} from "react-icons/fa";
import { useToast } from "./Ui/ToastProvider";
import { buildUrl, getAuthToken } from "../api";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"];

const getStatusMeta = (status) => {
  const value = String(status || "").toUpperCase();
  if (["NEW", "READY"].includes(value)) {
    return {
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: value,
    };
  }
  if (value === "INVALID") {
    return { className: "bg-red-50 text-red-700 border-red-200", label: value };
  }
  if (
    value === "DUPLICATE" ||
    value === "MODEL_MATCH_DATE_CONFLICT" ||
    value === "POSSIBLE_DUPLICATE"
  ) {
    return {
      className: "bg-amber-50 text-amber-700 border-amber-200",
      label: value.replaceAll("_", " "),
    };
  }
  return {
    className: "bg-slate-50 text-slate-600 border-slate-200",
    label: value || "UNKNOWN",
  };
};

const formatSummaryValue = (value) =>
  Number.isFinite(Number(value)) ? Number(value).toLocaleString() : "0";

const ImportTvExcel = () => {
  const fileRef = useRef(null);
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const hasPreviewErrors = useMemo(
    () =>
      Boolean(
        preview?.rows?.some(
          (row) => String(row.status).toUpperCase() === "INVALID",
        ),
      ),
    [preview],
  );

  const readyCount = useMemo(
    () =>
      (preview?.rows || []).filter((row) =>
        ["NEW", "READY"].includes(String(row.status).toUpperCase()),
      ).length,
    [preview],
  );

  const chooseFile = () => fileRef.current?.click();

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    if (!selected) return;

    const lowerName = selected.name.toLowerCase();
    if (
      !ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
    ) {
      toast.warning(
        "Please select an .xlsx or .xls workbook.",
        "Unsupported file",
      );
      event.target.value = "";
      return;
    }

    setFile(selected);
    setPreview(null);
  };

  const requestImport = async ({ isPreview }) => {
    if (!file) {
      toast.warning("Select an Excel workbook first.", "No file selected");
      return null;
    }

    const token = getAuthToken();
    const form = new FormData();
    form.append("file", file);

    const url = buildUrl(`/api/import/tvs${isPreview ? "?preview=true" : ""}`);
    const response = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      throw new Error(
        body?.message || body?.error || `TV import failed (${response.status})`,
      );
    }

    return body;
  };

  const handlePreview = async () => {
    if (!file) {
      toast.warning("Select an Excel workbook first.", "No file selected");
      return;
    }

    setLoading(true);
    try {
      const result = await requestImport({ isPreview: true });
      setPreview(result);
      const invalidCount = (result?.rows || []).filter(
        (row) => String(row.status).toUpperCase() === "INVALID",
      ).length;
      if (invalidCount) {
        toast.warning(
          `${invalidCount} row(s) need attention before import.`,
          "Validation complete",
        );
      } else {
        toast.success(
          "Workbook validation completed successfully.",
          "Ready to import",
        );
      }
    } catch (error) {
      console.error("TV workbook preview failed:", error);
      setPreview(null);
      toast.error(
        error.message || "Unable to validate workbook",
        "Validation failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.warning("Select an Excel workbook first.", "No file selected");
      return;
    }
    if (!preview) {
      toast.warning(
        "Validate the workbook before importing it.",
        "Preview required",
      );
      return;
    }
    if (hasPreviewErrors) {
      toast.warning(
        "Fix the invalid rows and run validation again before importing.",
        "Import blocked",
      );
      return;
    }

    setImporting(true);
    try {
      const result = await requestImport({ isPreview: false });
      setPreview(result);
      const summary = result?.summary || {};
      toast.success(
        `${formatSummaryValue(summary.ready)} TV row(s) imported successfully.`,
        "TV import complete",
      );
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      console.error("TV workbook import failed:", error);
      toast.error(
        error.message || "Unable to import workbook",
        "Import failed",
      );
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    const token = getAuthToken();
    try {
      const response = await fetch(buildUrl("/api/import/tvs/template"), {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok)
        throw new Error(`Template download failed (${response.status})`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "MobilesX_TV_Import_Template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("TV template download failed:", error);
      toast.error(
        error.message || "Unable to download the template",
        "Download failed",
      );
    }
  };

  const rows = Array.isArray(preview?.rows) ? preview.rows : [];
  const summary = preview?.summary || {};

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FaFileExcel className="text-xl" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  TV Catalog
                </p>
                <h1 className="text-2xl font-bold text-slate-900">
                  Import TVs from Excel
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Upload the standard MobilesX TV workbook. Validation happens
              before commit, and the import uses the same TV catalog persistence
              and scoring flow as manual TV entry.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            <FaDownload />
            Download Template
          </button>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <FaCloudUploadAlt className="mx-auto text-3xl text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Select your TV Excel workbook
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Supported formats: .xlsx, .xls
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={chooseFile}
              disabled={loading || importing}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Choose Excel File
            </button>
            {file ? (
              <span className="max-w-full truncate text-sm font-medium text-slate-600">
                {file.name}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!file || loading || importing}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaCheckCircle />
            )}
            {loading ? "Validating Workbook..." : "Validate & Preview"}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={
              !file || !preview || hasPreviewErrors || loading || importing
            }
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importing ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaFileExcel />
            )}
            {importing ? "Importing TVs..." : "Import Validated TVs"}
          </button>
        </div>
      </div>

      {preview ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Validation Summary
              </h2>
              <p className="text-sm text-slate-500">
                {preview.preview
                  ? "No database changes were made."
                  : "Import response from the server."}
              </p>
            </div>
            {hasPreviewErrors ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                <FaExclamationTriangle /> Fix invalid rows
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <FaCheckCircle /> Ready
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {[
              ["TV rows", summary.tv_rows],
              ["Variants", summary.variant_rows],
              ["Store rows", summary.store_price_rows],
              ["Known prices", summary.known_prices],
              ["Unknown prices", summary.unknown_prices],
              ["Ready", readyCount],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatSummaryValue(value)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Brand
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((row, index) => {
                    const status = getStatusMeta(row.status);
                    return (
                      <tr
                        key={`${row.row || index}-${row.product_name || "tv"}`}
                        className="align-top"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                          {row.row || index + 2}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.brand_name || "—"}
                        </td>
                        <td className="min-w-[240px] px-4 py-3 font-semibold text-slate-900">
                          {row.product_name || "—"}
                        </td>
                        <td className="min-w-[180px] px-4 py-3 text-slate-600">
                          {row.manufacturer_model || row.model || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="min-w-[300px] px-4 py-3 text-slate-500">
                          {row.reason || "Validated"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ImportTvExcel;
