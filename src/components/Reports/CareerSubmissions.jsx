import React, { useCallback, useEffect, useState } from "react";
import { FaSearch, FaSpinner, FaSyncAlt } from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const PAGE_SIZE = 50;

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const CareerSubmissions = () => {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Missing admin token. Please login again.");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(
        buildUrl(`/api/admin/career-submissions?${params.toString()}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || `Unable to load submissions (HTTP ${response.status})`);
      }

      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setTotal(Number(data?.total) || 0);
    } catch (fetchError) {
      console.error("Failed to fetch career submissions:", fetchError);
      setRows([]);
      setTotal(0);
      setError(fetchError?.message || "Failed to load career submissions.");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Reports</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Career Submissions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Contact details submitted through the MobilesX careers form.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchSubmissions}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaSyncAlt />
          )}
          Refresh
        </button>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {total.toLocaleString()} submission{total === 1 ? "" : "s"}
          </p>
          <label className="relative block w-full sm:max-w-sm">
            <FaSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
              placeholder="Search name, phone, email or ID"
              aria-label="Search career submissions"
              className="min-h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {error ? (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchSubmissions}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th scope="col" className="px-4 py-3">ID</th>
                <th scope="col" className="px-4 py-3">Full name</th>
                <th scope="col" className="px-4 py-3">Phone number</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <FaSpinner className="animate-spin" />
                      Loading submissions...
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    {error ? "Submissions could not be loaded." : "No career submissions found."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="text-sm text-slate-700 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {row.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {row.full_name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.phone_no || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.email ? (
                        <a
                          className="text-blue-700 hover:underline"
                          href={`mailto:${row.email}`}
                        >
                          {row.email}
                        </a>
                      ) : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {formatDateTime(row.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {total === 0
              ? "No submissions"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                  page * PAGE_SIZE,
                  total,
                )} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={loading || page >= totalPages}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
};

export default CareerSubmissions;
