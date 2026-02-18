import React, { useState, useEffect, useRef } from "react";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaSort,
  FaStar,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaDownload,
  FaUpload,
  FaTimes,
  FaEyeSlash,
  FaBolt,
  FaTint,
  FaWeight,
  FaRulerCombined,
  FaShieldAlt,
  FaCog,
  FaCube,
  FaFlag,
  FaTv,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../api";

const ViewTVs = () => {
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [applianceTypeFilter, setApplianceTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const asObject = (value) =>
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  const resolveTvId = (tv) =>
    tv?.product_id ||
    tv?.id ||
    tv?._id ||
    tv?.product?.id ||
    tv?.product?.product_id ||
    null;

  const formatScalar = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "N/A";
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "N/A";
      }
    }
    return String(value);
  };

  // Fetch appliances from API
  useEffect(() => {
    const fetchAppliances = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = Cookies.get("authToken");
        const res = await fetch(buildUrl("/api/tv"), {
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
        else if (data && Array.isArray(data.tvs)) rows = data.tvs;
        else if (data && Array.isArray(data.data)) rows = data.data;
        else rows = data.tvs || [];

        // Process tv rows with support for both legacy and current payloads.
        const processedAppliances = rows.map((appliance) => {
          const keySpecs = asObject(appliance.key_specs_json);
          const display = asObject(appliance.display_json);
          const performance = asObject(appliance.video_engine_json);
          const audio = asObject(appliance.audio_json);
          const smartTv = asObject(appliance.smart_tv_json);
          const connectivity = asObject(appliance.connectivity_json);
          const ports = asObject(appliance.ports_json);
          const power = asObject(appliance.power_json);
          const physical = asObject(appliance.physical_json);
          const dimensionsJson = asObject(appliance.dimensions_json);
          const designJson = asObject(appliance.design_json);
          const warranty = asObject(appliance.warranty_json);
          const details = asObject(appliance.product_details_json);
          const basicInfo = asObject(appliance.basic_info_json);

          const physicalDetails = {
            ...physical,
            ...dimensionsJson,
            ...designJson,
          };

          const rawFeatures = Array.isArray(appliance.features)
            ? appliance.features
            : Array.isArray(smartTv.smart_features)
              ? smartTv.smart_features
              : Array.isArray(smartTv.supported_apps)
                ? smartTv.supported_apps
                : [];

          const id = resolveTvId(appliance);
          const applianceTypeRaw =
            appliance.category ||
            appliance.appliance_type ||
            appliance.applianceType ||
            appliance.product_type;

          const type =
            keySpecs.panel_type ||
            display.panel_type ||
            keySpecs.resolution ||
            display.resolution ||
            "N/A";
          const capacity =
            keySpecs.screen_size ||
            display.screen_size ||
            keySpecs.size ||
            display.size ||
            "N/A";
          const motor =
            keySpecs.refresh_rate ||
            display.refresh_rate ||
            performance.refresh_rate ||
            "N/A";
          const energyRating =
            power.energy_rating || performance.energy_rating || "N/A";
          const waterConsumption =
            audio.output_power || keySpecs.audio_output || "N/A";

          const width = physicalDetails.width || "";
          const height = physicalDetails.height || "";
          const depth = physicalDetails.depth || "";
          const dimensions =
            width || height || depth
              ? `${width || "-"} × ${height || "-"} × ${depth || "-"}`
              : "N/A";

          return {
            id,
            editId: id,
            name: appliance.product_name || appliance.name || "Unnamed TV",
            brand: appliance.brand_name || appliance.brand || "Unknown",
            model:
              appliance.model_number ||
              appliance.model ||
              basicInfo.model_number ||
              "N/A",
            applianceType:
              applianceTypeRaw && String(applianceTypeRaw).trim()
                ? String(applianceTypeRaw)
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                : "Television",
            type: formatScalar(type),
            motor: formatScalar(motor),
            capacity: formatScalar(capacity),
            energyRating: formatScalar(energyRating),
            waterConsumption: formatScalar(waterConsumption),
            dimensions: formatScalar(dimensions),
            weight: formatScalar(physicalDetails.weight),
            motorWarranty: formatScalar(
              warranty.panel_warranty || warranty.panel || warranty.installation,
            ),
            productWarranty: formatScalar(
              warranty.product_warranty || warranty.product,
            ),
            releaseYear: formatScalar(
              appliance.release_year ||
                details.launch_year ||
                basicInfo.launch_year,
            ),
            country: formatScalar(
              appliance.country_of_origin ||
                details.country_of_origin ||
                warranty.country_of_origin,
            ),
            features: rawFeatures,
            published: Boolean(
              appliance.is_published ?? appliance.published ?? appliance.publish,
            ),
            launch_date: appliance.created_at || appliance.updated_at || null,
            raw: appliance,
          };
        });
        setAppliances(processedAppliances);
        showToast("Success", "TVs loaded successfully", "success");
      } catch (err) {
        console.error("Failed to fetch TVs:", err);
        setError(err.message || "Failed to load TVs");
        showToast("Error", "Failed to load TVs", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAppliances();
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

  // Filter and sort appliances
  const filteredAndSortedAppliances = appliances
    .filter((appliance) => {
      // Status filter
      if (statusFilter === "all") return true;
      if (statusFilter === "published") return appliance.published;
      if (statusFilter === "unpublished") return !appliance.published;
      return true;
    })
    .filter((appliance) => {
      // Appliance type filter
      if (applianceTypeFilter === "all") return true;
      return (
        appliance.applianceType.toLowerCase() ===
        applianceTypeFilter.toLowerCase()
      );
    })
    .filter(
      (appliance) =>
        appliance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appliance.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appliance.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appliance.applianceType
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
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
      if (sortBy === "capacity") {
        const aCap = parseFloat(a.capacity) || 0;
        const bCap = parseFloat(b.capacity) || 0;
        return bCap - aCap;
      }
      if (sortBy === "type") {
        return a.applianceType.localeCompare(b.applianceType);
      }
      return 0;
    });

  // Get unique appliance types for filter
  const applianceTypes = [
    ...new Set(appliances.map((a) => a.applianceType.toLowerCase())),
  ].filter(Boolean);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedAppliances.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppliances = filteredAndSortedAppliances.slice(
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
      const res = await fetch(buildUrl(`/api/tvs/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      setAppliances(appliances.filter((appliance) => appliance.id !== id));
      showToast("Success", `"${name}" deleted successfully`, "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error", `Failed to delete "${name}"`, "error");
    }
  };

  // Toggle publish status
  const togglePublish = async (appliance) => {
    try {
      const token = Cookies.get("authToken");
      const newPublished = !appliance.published;

      const resolvedId =
        appliance.id || appliance.raw?.product_id || appliance.raw?.id || null;

      if (!resolvedId) {
        console.error("togglePublish: missing id for appliance", appliance);
        showToast("Error", "Missing TV id, cannot update", "error");
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

      setAppliances((prev) =>
        prev.map((a) =>
          (a.id || a.raw?.product_id) === resolvedId
            ? { ...a, published: updatedPublished }
            : a,
        ),
      );

      showToast(
        "Success",
        `"${appliance.name}" ${updatedPublished ? "published" : "unpublished"}`,
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
      const res = await fetch(buildUrl("/api/home-appliances/export"), {
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
      a.download = `home-appliances-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast(
        "Export Successful",
        `${exportData.length} TVs exported`,
        "success",
      );
    } catch (error) {
      console.error("Export error:", error);
      showToast("Export Failed", "Failed to export TVs", "error");
    }
  };

  // Import function
  const handleImport = async (file) => {
    if (!file) return;

    try {
      const token = Cookies.get("authToken");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(buildUrl("/api/home-appliances/import"), {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Import failed");

      showToast(
        "Import Successful",
        "TVs imported successfully",
        "success",
      );

      // Reload the data
      window.location.reload();
    } catch (error) {
      console.error("Import error:", error);
      showToast("Import Failed", "Failed to import TVs", "error");
    }
  };

  // Stats
  const totalAppliances = appliances.length;
  const publishedAppliances = appliances.filter((a) => a.published).length;
  const unpublishedAppliances = appliances.filter((a) => !a.published).length;

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
              TV Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your TV inventory and specifications
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/products/tvs/create")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              <FaPlus className="text-sm" />
              <span>Add TV</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total TVs</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CountUp end={totalAppliances} duration={1.0} />
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaTv className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  <CountUp end={publishedAppliances} duration={1.0} />
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
                  <CountUp end={unpublishedAppliances} duration={1.0} />
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
              <h2 className="font-semibold text-gray-800">TVs List</h2>
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                {filteredAndSortedAppliances.length}
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
                  placeholder="Search TVs..."
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
                  value={applianceTypeFilter}
                  onChange={(e) => setApplianceTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Types</option>
                  {applianceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
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
                  <option value="capacity">Capacity</option>
                  <option value="type">TV Type</option>
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
                  Appliance
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
                  Performance & Features
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Dimensions
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
                  Added Date
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
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <FaSpinner className="animate-spin text-2xl text-blue-600" />
                    </div>
                  </td>
                </tr>
              ) : paginatedAppliances.length > 0 ? (
                paginatedAppliances.map((appliance, idx) => (
                  <tr
                    key={appliance.id || `appliance-${startIndex + idx}`}
                    className="hover:bg-gray-50"
                  >
                    {/* Appliance Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                            <FaTv className="text-white text-lg" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">
                            {appliance.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                              {appliance.brand}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                              {appliance.applianceType}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <FaFlag className="text-xs" />
                              {appliance.country}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Model: {appliance.model} | {appliance.releaseYear}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Specifications */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <FaCog className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">
                            {appliance.capacity} | {appliance.type}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FaBolt className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">
                            {appliance.motor}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FaShieldAlt className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900 text-xs">
                            Panel: {appliance.motorWarranty}, Product:{" "}
                            {appliance.productWarranty}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Performance & Features */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <FaStar className="text-yellow-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900 font-medium">
                            {appliance.energyRating}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FaTint className="text-blue-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">
                            {appliance.waterConsumption}
                          </span>
                        </div>
                        {appliance.features.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">
                              Features:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {appliance.features.slice(0, 3).map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                                >
                                  {feature}
                                </span>
                              ))}
                              {appliance.features.length > 3 && (
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                                  +{appliance.features.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Dimensions */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <FaRulerCombined className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">
                            {appliance.dimensions}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FaWeight className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">
                            {appliance.weight}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(appliance)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          appliance.published
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {appliance.published ? (
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
                        {formatDate(appliance.launch_date)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const targetId =
                              appliance.editId ||
                              appliance.id ||
                              resolveTvId(appliance.raw);
                            if (!targetId) {
                              showToast(
                                "Missing ID",
                                "Unable to open edit page: TV id is missing.",
                                "error",
                              );
                              return;
                            }
                            navigate(`/products/tvs/${targetId}/edit`, {
                              state: { appliance: appliance.raw },
                            });
                          }}
                          className={`p-1 rounded ${
                            appliance.editId || appliance.id
                              ? "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                          disabled={!(appliance.editId || appliance.id)}
                          title="Edit TV"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            const targetId =
                              appliance.editId ||
                              appliance.id ||
                              resolveTvId(appliance.raw);
                            if (!targetId) {
                              showToast(
                                "Missing ID",
                                "Unable to open TV details: id is missing.",
                                "error",
                              );
                              return;
                            }
                            navigate(`/products/tvs/${targetId}/edit`, {
                              state: { appliance: appliance.raw },
                            });
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="View details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => {
                            const targetId =
                              appliance.editId ||
                              appliance.id ||
                              resolveTvId(appliance.raw);
                            if (!targetId) {
                              showToast(
                                "Missing ID",
                                "Unable to delete: TV id is missing.",
                                "error",
                              );
                              return;
                            }
                            handleDelete(targetId, appliance.name);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete TV"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <FaTv className="text-4xl text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">
                        {searchTerm
                          ? "No TVs found"
                          : "No TVs yet"}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "Add your first TV using the form"}
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
                    filteredAndSortedAppliances.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredAndSortedAppliances.length}
                </span>{" "}
                TVs
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
          Delete) to manage individual TVs.
        </p>
      </div>
    </div>
  );
};

export default ViewTVs;



