import React, { useState } from "react";
import Cookies from "js-cookie";
import { FaFileExport, FaSpinner } from "react-icons/fa";

const ExportCategories = ({ filename = "brand_data.xlsx", className = "" }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const token = Cookies.get("authToken");
      const resp = await fetch("http://apishpere.duckdns.org/api/categories/export", {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.message || `Export failed: HTTP ${resp.status}`);
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setError(err.message || "Failed to export categories");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
      >
        {isExporting ? (
          <FaSpinner className="animate-spin" />
        ) : (
          <FaFileExport />
        )}
        <span>{isExporting ? "Exporting..." : "Export"}</span>
      </button>
      {error && (
        <div className="text-red-600 text-sm mt-2">Export error: {error}</div>
      )}
    </div>
  );
};

export default ExportCategories;
