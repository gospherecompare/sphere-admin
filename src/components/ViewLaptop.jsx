import React, { useState, useEffect, useRef } from "react";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom";
import {
  FaLaptop,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaSort,
  FaMicrochip,
  FaMemory,
  FaHdd,
  FaBatteryFull,
  FaDesktop,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaDownload,
  FaUpload,
  FaTimes,
  FaEyeSlash,
  FaPlug,
  FaWeightHanging,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../api";

const ViewLaptops = () => {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  // Fetch laptops from API
  useEffect(() => {
    const fetchLaptops = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = Cookies.get("authToken");
        const res = await fetch(buildUrl("/api/laptop"), {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        let rows = [];
        if (Array.isArray(data)) rows = data;
        else if (data && Array.isArray(data.laptops)) rows = data.laptops;
        else if (data && Array.isArray(data.data)) rows = data.data;
        else rows = data.laptops || [];

        // Process laptops data
        const processedLaptops = rows.map((laptop) => {
          // Get CPU details
          const cpuBrand = laptop.cpu?.brand || "N/A";
          const cpuModel = laptop.cpu?.model || "";
          const cpuDisplay = cpuModel ? `${cpuBrand} ${cpuModel}` : cpuBrand;

          // Get display details
          const displaySize = laptop.display?.size || "N/A";
          const displayResolution = laptop.display?.resolution || "";
          const displayRefresh = laptop.display?.refresh_rate || "";
          const displayType = laptop.display?.type || "";

          let displayInfo = displaySize;
          if (displayType) displayInfo += ` ${displayType}`;
          if (displayResolution) displayInfo += `, ${displayResolution}`;
          if (displayRefresh) displayInfo += ` (${displayRefresh})`;

          // Get memory details
          const memoryType = laptop.memory?.type || "";
          const memorySize = laptop.memory?.size || "";
          const memoryInfo = memorySize
            ? `${memorySize}${memoryType ? ` ${memoryType}` : ""}`
            : "N/A";

          // Get storage details
          const storageType = laptop.storage?.type || "";
          const storageSize =
            laptop.storage?.size || laptop.storage?.capacity || "";
          const storageInfo = storageSize
            ? `${storageSize}${storageType ? ` ${storageType}` : ""}`
            : "N/A";

          // Get battery details
          const batteryCapacity = laptop.battery?.capacity || "";
          const batteryInfo = batteryCapacity || "N/A";

          // Get OS
          const os = laptop.software?.os || "N/A";

          // Get features
          const features = Array.isArray(laptop.features)
            ? laptop.features.slice(0, 3) // Show only first 3 features
            : [];

          // Get weight
          const weight = laptop.physical?.weight || "N/A";

          return {
            id: laptop.product_id || laptop.id || laptop._id || null,
            name: laptop.name || "Unnamed Laptop",
            brand: laptop.brand_name || laptop.brand || "Unknown",
            cpu: cpuDisplay,
            display: displayInfo,
            memory: memoryInfo,
            storage: storageInfo,
            battery: batteryInfo,
            os: os,
            weight: weight,
            features: features,
            wifi: laptop.connectivity?.wifi || "N/A",
            bluetooth: laptop.connectivity?.bluetooth || "N/A",
            published: laptop.is_published || laptop.published || false,
            launch_date: laptop.created_at || laptop.launch_date,
            warranty_years: laptop.warranty?.years || "N/A",
            raw: laptop,
          };
        });

        setLaptops(processedLaptops);
        showToast("Success", "Laptops loaded successfully", "success");
      } catch (err) {
        console.error("Failed to fetch laptops:", err);
        setError(err.message || "Failed to load laptops");
        showToast("Error", "Failed to load laptops", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchLaptops();
  }, []);

  // Toast system
  const showToast = (title, message, type = "success") => {
    const id = Date.now();
    const newToast = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Filter and sort laptops
  const filteredAndSortedLaptops = laptops
    .filter((laptop) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "published") return laptop.published;
      if (statusFilter === "unpublished") return !laptop.published;
      return true;
    })
    .filter(
      (laptop) =>
        laptop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laptop.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laptop.cpu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laptop.os.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.launch_date) - new Date(a.launch_date);
      }
      if (sortBy === "oldest") {
        return new Date(a.launch_date) - new Date(b.launch_date);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "brand") {
        return a.brand.localeCompare(b.brand);
      }
      if (sortBy === "cpu") {
        return a.cpu.localeCompare(b.cpu);
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLaptops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLaptops = filteredAndSortedLaptops.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".action-dropdown") && activeDropdown) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  // Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl(`/api/laptop/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      setLaptops(laptops.filter((laptop) => laptop.id !== id));
      showToast("Success", `"${name}" deleted successfully`, "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error", `Failed to delete "${name}"`, "error");
    }
  };

  // Toggle publish status
  const togglePublish = async (laptop) => {
    try {
      const token = Cookies.get("authToken");
      const newPublished = !laptop.published;

      const resolvedId =
        laptop.id || laptop.raw?.product_id || laptop.raw?.id || null;

      if (!resolvedId) {
        console.error("togglePublish: missing id for laptop", laptop);
        showToast("Error", "Missing laptop id, cannot update", "error");
        return;
      }

      // Decode user id from JWT token
      const parseJwt = (t) => {
        try {
          const base64Url = t.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
          const jsonPayload = decodeURIComponent(
            atob(padded)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join(""),
          );
          return JSON.parse(jsonPayload);
        } catch (e) {
          return null;
        }
      };

      const payload = token ? parseJwt(token) : null;
      const userId =
        payload?.id ||
        payload?._id ||
        payload?.userId ||
        payload?.user_id ||
        null;

      const body = {
        id: resolvedId,
        is_published: newPublished,
        published_by: userId,
      };

      const res = await fetch(buildUrl(`/api/products/${resolvedId}/publish`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Update failed${errText ? ": " + errText : ""}`);
      }

      const data = await res.json().catch(() => null);
      const updatedPublished =
        (data && (data.data?.is_published ?? data.is_published)) ??
        newPublished;

      setLaptops((prev) =>
        prev.map((l) =>
          (l.id || l.raw?.product_id) === resolvedId
            ? { ...l, published: updatedPublished }
            : l,
        ),
      );

      showToast(
        "Success",
        `"${laptop.name}" ${updatedPublished ? "published" : "unpublished"}`,
        "success",
      );
    } catch (err) {
      console.error("Publish toggle error:", err);
      showToast("Error", "Failed to update status", "error");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Export function
  const handleExport = async (publishedOnly = false) => {
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl("/api/laptops/export"), {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("Export failed");

      const data = await res.json();
      const exportData = publishedOnly
        ? data.filter((item) => item.is_published || item.published)
        : data;

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laptops-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast(
        "Export Successful",
        `${exportData.length} laptops exported`,
        "success",
      );
    } catch (error) {
      console.error("Export error:", error);
      showToast("Export Failed", "Failed to export laptops", "error");
    }
  };

  // Import function
  const handleImport = async (file) => {
    if (!file) return;

    try {
      const token = Cookies.get("authToken");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(buildUrl("/api/import/laptops"), {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Import failed");
      }

      const { summary, rows } = data;

      showToast(
        "Import Finished",
        `Inserted: ${summary.inserted}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`,
        summary.failed > 0 ? "warning" : "success",
      );

      // Show row-level errors
      rows
        .filter((r) => r.status === "FAILED")
        .slice(0, 5)
        .forEach((r) => {
          showToast(`Row ${r.row} Failed`, r.error || "Unknown error", "error");
        });

      // Refresh list
      setTimeout(() => {
        window.location.reload();
        // or refetchLaptops();
      }, 1200);
    } catch (err) {
      console.error("Import error:", err);
      showToast("Import Failed", err.message, "error");
    }
  };
  // Stats
  const totalLaptops = laptops.length;
  const publishedLaptops = laptops.filter((l) => l.published).length;
  const unpublishedLaptops = laptops.filter((l) => !l.published).length;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-white rounded-lg shadow-lg border p-4 max-w-sm w-full flex items-start space-x-3 ${
              toast.type === "success"
                ? "border-green-200 bg-green-50"
                : toast.type === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            {toast.type === "success" && (
              <FaCheckCircle className="text-green-500 mt-0.5" />
            )}
            {toast.type === "error" && (
              <FaExclamationCircle className="text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Laptop Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your laptop inventory and specifications
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/create-laptop")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              <FaPlus className="text-sm" />
              <span>Add Laptop</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Laptops</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CountUp end={totalLaptops} duration={1.0} />
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaLaptop className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  <CountUp end={publishedLaptops} duration={1.0} />
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaEye className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Drafts</p>
                <p className="text-2xl font-bold text-gray-600">
                  <CountUp end={unpublishedLaptops} duration={1.0} />
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaEyeSlash className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <FaExclamationCircle className="text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-gray-800">Laptops List</h2>
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                {filteredAndSortedLaptops.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search laptops..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              {/* Filter & Sort */}
              <div className="flex space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Drafts</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name A-Z</option>
                  <option value="brand">Brand</option>
                  <option value="cpu">CPU</option>
                </select>
              </div>

              {/* Export/Import */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport()}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  <FaDownload className="text-sm" />
                  <span>Export</span>
                </button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json,.csv,.xlsx,.xls"
                    onChange={(e) => handleImport(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="import-file"
                  />
                  <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm">
                    <FaUpload className="text-sm" />
                    <span>Import</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Laptop
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Specifications
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hardware
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Launch Date
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <FaSpinner className="animate-spin text-2xl text-blue-600" />
                    </div>
                  </td>
                </tr>
              ) : paginatedLaptops.length > 0 ? (
                paginatedLaptops.map((laptop, idx) => (
                  <tr
                    key={laptop.id || `laptop-${startIndex + idx}`}
                    className="hover:bg-gray-50"
                  >
                    {/* Laptop Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <FaLaptop className="text-white text-lg" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900 truncate max-w-[180px]">
                            {laptop.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                              {laptop.brand}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaDesktop className="text-xs" />
                              {laptop.os}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <FaWeightHanging className="text-xs" />
                              {laptop.weight}
                            </span>
                            {laptop.warranty_years !== "N/A" && (
                              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px]">
                                {laptop.warranty_years} yr warranty
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Specifications */}
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <FaMicrochip className="text-gray-400 mr-2 flex-shrink-0" />
                          <span
                            className="text-gray-900 truncate"
                            title={laptop.cpu}
                          >
                            {laptop.cpu}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FaDesktop className="text-gray-400 mr-2 flex-shrink-0" />
                          <span
                            className="text-gray-900 truncate"
                            title={laptop.display}
                          >
                            {laptop.display}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FaPlug className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">
                            WiFi: {laptop.wifi}, BT: {laptop.bluetooth}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Hardware */}
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <FaMemory className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">{laptop.memory}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FaHdd className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">
                            {laptop.storage}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FaBatteryFull className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">
                            {laptop.battery}
                          </span>
                        </div>
                      </div>
                      {laptop.features.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {laptop.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                          {laptop.features.length > 3 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              +{laptop.features.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(laptop)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          laptop.published
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {laptop.published ? (
                          <>
                            <FaEye className="mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <FaEyeSlash className="mr-1" />
                            Draft
                          </>
                        )}
                      </button>
                    </td>

                    {/* Launch Date */}
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-2 text-gray-400 flex-shrink-0" />
                        {formatDate(laptop.launch_date)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/products/laptops/${laptop.id}/edit`, {
                              state: { laptop: laptop.raw },
                            })
                          }
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit laptop"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/products/laptops/${laptop.id}/view`, {
                              state: { laptop: laptop.raw },
                            })
                          }
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="View details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDelete(laptop.id, laptop.name)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete laptop"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <FaLaptop className="text-4xl text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">
                        {searchTerm ? "No laptops found" : "No laptops yet"}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "Add your first laptop using the form"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(
                    startIndex + itemsPerPage,
                    filteredAndSortedLaptops.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredAndSortedLaptops.length}
                </span>{" "}
                laptops
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Click on status buttons to toggle between
          Published and Draft states. Click on action buttons (Edit, View,
          Delete) to manage individual laptops.
        </p>
      </div>
    </div>
  );
};

export default ViewLaptops;
