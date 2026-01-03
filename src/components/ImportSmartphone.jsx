// === React Component: ImportSmartphones.jsx ===
import React, { useRef, useState } from "react";
import Cookies from "js-cookie";
import { FaUpload, FaSpinner } from "react-icons/fa";

const ImportSmartphones = ({
  uploadUrl = "http://localhost:5000/api/smartphones/import",
  onImported,
  buttonLabel = "Import Smartphones",
}) => {
  const fileRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => fileRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".xlsx", ".xls", ".csv"];
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      alert("Please upload a valid Excel or CSV file!");
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

      if (!resp.ok) throw new Error(body.message || "Import failed");

      alert(body.message || "Smartphones imported successfully!");

      onImported?.();
    } catch (err) {
      console.error("Import error:", err);
      alert(err.message || "Failed to import file");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
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
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-150"
        title="Import Smartphones from Excel or CSV"
      >
        {isUploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
        <span>{isUploading ? "Importing..." : buttonLabel}</span>
      </button>
    </div>
  );
};

export default ImportSmartphones;
