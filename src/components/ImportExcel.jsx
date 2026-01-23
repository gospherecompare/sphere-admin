import React, { useRef, useState } from "react";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { FaUpload, FaSpinner } from "react-icons/fa";

const ImportExcel = ({
  uploadUrl = buildUrl("/api/categories/import"),
  onImported,
  buttonLabel = "Import",
}) => {
  const fileRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Basic validation
    const allowed = [".xlsx", ".xls", ".csv"];
    const ext = file.name
      .slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2)
      .toLowerCase();
    if (!allowed.some((a) => file.name.toLowerCase().endsWith(a))) {
      alert("Please upload an Excel file (.xlsx, .xls or .csv)");
      return;
    }

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const token = Cookies.get("authToken");

      const resp = await fetch(uploadUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });

      const body = await resp.json();
      if (!resp.ok) {
        throw new Error(body.message || body.error || "Import failed");
      }

      alert(body.message || "Import successful");
      if (typeof onImported === "function") onImported();
    } catch (err) {
      console.error("Import error:", err);
      alert(err.message || "Failed to import file");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = null;
    }
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-150"
        title="Import categories from Excel"
      >
        {isUploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
        <span>{isUploading ? "Importing..." : buttonLabel}</span>
      </button>
    </div>
  );
};

export default ImportExcel;
