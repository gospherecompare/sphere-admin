import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import Cookies from "js-cookie";

/**
 * ExportButton
 * Props:
 * - endpoint: full URL or relative path to export endpoint (default: "/api/smartphones/export")
 * - published: boolean -> append ?published=true when true
 * - filenamePrefix: optional prefix for fallback filename
 * - className: optional button classes
 * - label: button label (default: "Export")
 */
const ExportButton = ({
  endpoint = "http://apishpere.duckdns.org/api/smartphones/export",
  published = false,
  filenamePrefix = "smartphones_data",
  className = "flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60",
  label = "Export",
  onError,
  onStart,
  onFinish,
}) => {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    try {
      setBusy(true);
      onStart && onStart();

      const token = Cookies.get("authToken");
      const url = published ? `${endpoint}?published=true` : endpoint;

      const res = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err = new Error(`Export failed: ${res.status} ${text}`);
        throw err;
      }

      const blob = await res.blob();

      // Try to parse filename from header
      const disposition = res.headers.get("content-disposition") || "";
      let filename = `${filenamePrefix}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      const m =
        disposition.match(/filename\*=UTF-8''([^;\n]+)/i) ||
        disposition.match(/filename="?([^";]+)"?/i);
      if (m && m[1]) filename = decodeURIComponent(m[1]);

      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);

      onFinish && onFinish();
    } catch (err) {
      console.error("ExportButton error:", err);
      onError && onError(err);
      // fallback user-visible message
      alert("Export failed: " + (err && err.message ? err.message : err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={busy} className={className}>
      <FaDownload className="text-sm lg:text-lg" />
      <span>{busy ? `${label}...` : label}</span>
    </button>
  );
};

export default ExportButton;
