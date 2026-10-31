import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaFileExcel,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaSpinner,
  FaSyncAlt,
  FaUpload,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const PAGE_SIZE = 50;

const maskEmail = (email) => {
  const value = String(email || "");
  const at = value.indexOf("@");
  if (at < 1) return "••••••••";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  return `${local.slice(0, 1)}${"•".repeat(Math.min(6, Math.max(3, local.length - 1)))}@${domain}`;
};

const getResponseBody = async (response) =>
  response.json().catch(() => ({}));

const EmailSubscribers = () => {
  const fileInputRef = useRef(null);
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showEmails, setShowEmails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualConsentConfirmed, setManualConsentConfirmed] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [importReport, setImportReport] = useState(null);
  const requestIdRef = useRef(0);

  const fetchSubscribers = useCallback(async (requestedPage, requestedSearch) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Your admin session has expired. Please sign in again.");

      const params = new URLSearchParams({
        page: String(requestedPage),
        search: requestedSearch,
      });
      const response = await fetch(
        buildUrl(`/api/admin/email-updates/subscribers?${params.toString()}`),
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const body = await getResponseBody(response);
      if (!response.ok) {
        throw new Error(
          body.message ||
            (response.status === 404
              ? "Subscriber management is not available on this backend yet."
              : `Could not load subscribers (${response.status}).`),
        );
      }

      if (requestId !== requestIdRef.current) return;
      setSubscribers(Array.isArray(body.subscribers) ? body.subscribers : []);
      setTotal(Number(body.total) || 0);
    } catch (fetchError) {
      if (requestId !== requestIdRef.current) return;
      setError(fetchError.message || "Could not load subscribers.");
      setSubscribers([]);
      setTotal(0);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setShowEmails(false);
    fetchSubscribers(page, search);
  }, [fetchSubscribers, page, search]);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    setPage(1);
    setShowEmails(false);
    if (nextSearch === search) {
      if (page === 1) fetchSubscribers(1, nextSearch);
    } else {
      setSearch(nextSearch);
    }
  };

  const handleTemplateDownload = async () => {
    setDownloadingTemplate(true);
    setError("");
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Your admin session has expired. Please sign in again.");

      const response = await fetch(
        buildUrl("/api/admin/email-updates/import-template"),
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      if (!response.ok) {
        const body = await getResponseBody(response);
        throw new Error(body.message || "Could not download the Excel template.");
      }

      const downloadUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "mobilesx-email-subscribers-template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (downloadError) {
      setError(downloadError.message || "Could not download the Excel template.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async (event) => {
    event.preventDefault();
    if (!selectedFile || !consentConfirmed || importing) return;

    setImporting(true);
    setError("");
    setNotice("");
    setImportReport(null);
    setShowEmails(false);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Your admin session has expired. Please sign in again.");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("consentConfirmed", "true");

      const response = await fetch(buildUrl("/api/admin/email-updates/import"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const body = await getResponseBody(response);
      if (!response.ok) {
        setImportReport(body.invalidRows ? body : null);
        throw new Error(body.message || `Import failed (${response.status}).`);
      }

      setNotice(
        `Imported ${body.inserted || 0} new address${body.inserted === 1 ? "" : "es"}; ${body.duplicates || 0} duplicate${body.duplicates === 1 ? "" : "s"} skipped; ${body.invalidCount || 0} invalid row${body.invalidCount === 1 ? "" : "s"}.`,
      );
      setImportReport(body.invalidRows?.length ? body : null);
      setSelectedFile(null);
      setConsentConfirmed(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPage(1);
      if (page === 1) fetchSubscribers(1, search);
    } catch (importError) {
      setError(importError.message || "Could not import the email workbook.");
    } finally {
      setImporting(false);
    }
  };

  const handleManualAdd = async (event) => {
    event.preventDefault();
    if (!manualEmail.trim() || !manualConsentConfirmed || addingManual) return;

    setAddingManual(true);
    setError("");
    setNotice("");
    setImportReport(null);
    setShowEmails(false);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Your admin session has expired. Please sign in again.");

      const response = await fetch(buildUrl("/api/admin/email-updates/subscribers"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: manualEmail.trim(),
          consentConfirmed: true,
        }),
      });
      const body = await getResponseBody(response);
      if (!response.ok) {
        throw new Error(body.message || `Could not add the email address (${response.status}).`);
      }

      setNotice(body.message || "Email address added to MobilesX updates.");
      setManualEmail("");
      setManualConsentConfirmed(false);
      setPage(1);
      if (page === 1) fetchSubscribers(1, search);
    } catch (addError) {
      setError(addError.message || "Could not add the email address.");
    } finally {
      setAddingManual(false);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstVisible = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <FaShieldAlt aria-hidden="true" />
              Admin only
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Email subscribers
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              View MobilesX newsletter addresses and import opted-in subscribers
              from an Excel workbook. Addresses are hidden until you reveal them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowEmails(false);
                fetchSubscribers(page, search);
              }}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Subscriber list</h2>
              <p className="mt-1 text-sm text-slate-500">
                {search ? `${total.toLocaleString()} matching addresses` : `${total.toLocaleString()} total addresses`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmails((visible) => !visible)}
                className="inline-flex min-h-10 items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                aria-pressed={showEmails}
              >
                {showEmails ? <FaEyeSlash /> : <FaEye />}
                {showEmails ? "Hide addresses" : "Reveal addresses"}
              </button>
              <form onSubmit={handleSearch} className="flex min-w-0 flex-1 sm:flex-none">
                <label className="sr-only" htmlFor="subscriber-search">
                  Search email addresses
                </label>
                <input
                  id="subscriber-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search email"
                  maxLength={254}
                  className="h-10 min-w-0 w-full border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-48"
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-900 text-white hover:bg-slate-700"
                  aria-label="Search subscribers"
                >
                  <FaSearch />
                </button>
              </form>
            </div>
          </div>

          {error && (
            <div className="m-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:m-5" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="m-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:m-5" role="status">
              {notice}
            </div>
          )}

          {importReport?.invalidRows?.length > 0 && (
            <div className="mx-4 mb-4 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:mx-5">
              <p className="font-semibold">Invalid spreadsheet rows</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {importReport.invalidRows.map((row) => (
                  <li key={row.row}>Row {row.row}: {row.reason}</li>
                ))}
              </ul>
              {importReport.invalidCount > importReport.invalidRows.length && (
                <p className="mt-2">
                  Showing the first {importReport.invalidRows.length} invalid rows.
                </p>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-5">#</th>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-5">Email address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-12 text-center text-slate-500">
                      <FaSpinner className="mx-auto mb-2 animate-spin text-lg" />
                      Loading subscriber addresses…
                    </td>
                  </tr>
                ) : subscribers.length ? (
                  subscribers.map((subscriber, index) => (
                    <tr key={subscriber.email} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-slate-400 sm:px-5">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="break-all px-4 py-3 font-medium text-slate-800 sm:px-5">
                        {showEmails ? subscriber.email : maskEmail(subscriber.email)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-5 py-12 text-center text-slate-500">
                      {search ? "No email addresses match this search." : "No email subscribers yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-slate-500">
              Showing {firstVisible}–{lastVisible} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={loading || page <= 1}
                className="inline-flex min-h-9 items-center gap-2 border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FaChevronLeft /> Previous
              </button>
              <span className="px-1 text-sm text-slate-500">{page} / {pageCount}</span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={loading || page >= pageCount}
                className="inline-flex min-h-9 items-center gap-2 border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700">
              <FaFileExcel aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">Import email addresses</h2>
              <p className="text-xs text-slate-500">Excel workbook (.xlsx)</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Use the first worksheet and include an <code className="bg-slate-100 px-1">email</code> column. Up to 10,000 rows per import.
          </p>

          <form onSubmit={handleImport} className="mt-5 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              aria-label="Select Excel workbook"
            />
            {selectedFile && (
              <p className="break-all text-xs text-slate-500">Selected: {selectedFile.name}</p>
            )}

            <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-slate-600">
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(event) => setConsentConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                required
              />
              <span>I confirm every address in this file opted in to MobilesX email updates.</span>
            </label>

            <button
              type="submit"
              disabled={!selectedFile || !consentConfirmed || importing}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? <FaSpinner className="animate-spin" /> : <FaUpload />}
              {importing ? "Importing addresses…" : "Import Excel list"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleTemplateDownload}
            disabled={downloadingTemplate}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
          >
            {downloadingTemplate ? <FaSpinner className="animate-spin" /> : <FaDownload />}
            Download blank template
          </button>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-900">Add one email address</h3>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Add an individual who has agreed to receive MobilesX email updates.
            </p>
            <form onSubmit={handleManualAdd} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700" htmlFor="manual-subscriber-email">
                Email address
              </label>
              <input
                id="manual-subscriber-email"
                type="email"
                value={manualEmail}
                onChange={(event) => setManualEmail(event.target.value)}
                placeholder="name@example.com"
                maxLength={254}
                autoComplete="email"
                required
                className="h-11 w-full border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-slate-600">
                <input
                  type="checkbox"
                  checked={manualConsentConfirmed}
                  onChange={(event) => setManualConsentConfirmed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                  required
                />
                <span>I confirm this person opted in to MobilesX email updates.</span>
              </label>

              <button
                type="submit"
                disabled={!manualEmail.trim() || !manualConsentConfirmed || addingManual}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingManual ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                {addingManual ? "Adding address…" : "Add email address"}
              </button>
            </form>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default EmailSubscribers;
