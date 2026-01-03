import React, { useState, useEffect, useRef } from "react";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom";
import {
  FaMobile,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaSort,
  FaStar,
  FaEllipsisV,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaDownload,
  FaUpload,
  FaTimes,
  FaEyeSlash,
} from "react-icons/fa";
import Cookies from "js-cookie";

const ViewMobiles = () => {
  const [mobiles, setMobiles] = useState([]);
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

  // Fetch mobiles from API
  useEffect(() => {
    const fetchMobiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = Cookies.get("authToken");
        const res = await fetch("http://localhost:5000/api/smartphone", {
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
        else if (data && Array.isArray(data.smartphones))
          rows = data.smartphones;
        else if (data && Array.isArray(data.data)) rows = data.data;

        // Process mobiles data
        const processedMobiles = rows.map((mobile) => {
          // Get price from variants or store prices
          let price = 0;
          if (Array.isArray(mobile.variants) && mobile.variants.length > 0) {
            const prices = mobile.variants.flatMap((v) =>
              (v.store_prices || []).map((sp) => Number(sp.price) || 0)
            );
            price =
              prices.length > 0 ? Math.min(...prices.filter((p) => p > 0)) : 0;
          }

          // Get storage and RAM
          let storage = "";
          let ram = "";
          if (Array.isArray(mobile.variants) && mobile.variants.length > 0) {
            const firstVariant = mobile.variants[0];
            storage = firstVariant.storage || "";
            ram = firstVariant.ram || "";
          }

          // Get status
          const published = mobile.published || mobile.is_published || false;

          return {
            id:
              mobile.id ||
              mobile._id ||
              mobile.product_id ||
              mobile.productId ||
              (mobile.raw && (mobile.raw.product_id || mobile.raw.productId)) ||
              null,
            name: mobile.name || mobile.product_name || "Unnamed",
            brand: mobile.brand || mobile.brand_name || "Unknown",
            model: mobile.model || mobile.model_name || "Unknown",
            price: price || mobile.price || 0,
            storage: storage || mobile.storage || "",
            ram: ram || mobile.ram || "",
            published: published,
            rating: Number(mobile.rating) || Number(mobile.avg_rating) || 0,
            launch_date: mobile.launch_date || mobile.created_at,
            images: mobile.images || [],
            variants: mobile.variants || [],
            raw: mobile,
          };
        });

        setMobiles(processedMobiles);
        showToast("Success", "Mobiles loaded successfully", "success");
      } catch (err) {
        console.error("Failed to fetch mobiles:", err);
        setError(err.message || "Failed to load mobiles");
        showToast("Error", "Failed to load mobiles", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchMobiles();
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

  // Filter and sort mobiles
  const filteredAndSortedMobiles = mobiles
    .filter((mobile) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "published") return mobile.published;
      if (statusFilter === "unpublished") return !mobile.published;
      return true;
    })
    .filter(
      (mobile) =>
        mobile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mobile.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mobile.model.toLowerCase().includes(searchTerm.toLowerCase())
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
      if (sortBy === "rating") {
        return b.rating - a.rating;
      }
      if (sortBy === "price-high") {
        return b.price - a.price;
      }
      if (sortBy === "price-low") {
        return a.price - b.price;
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMobiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMobiles = filteredAndSortedMobiles.slice(
    startIndex,
    startIndex + itemsPerPage
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
      const res = await fetch(`http://localhost:5000/api/smartphone/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      setMobiles(mobiles.filter((mobile) => mobile.id !== id));
      showToast("Success", `"${name}" deleted successfully`, "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error", `Failed to delete "${name}"`, "error");
    }
  };

  // Toggle publish status
  const togglePublish = async (mobile) => {
    try {
      const token = Cookies.get("authToken");
      const newPublished = !mobile.published;

      // resolve a reliable id for the mobile
      const resolvedId =
        mobile.id ||
        mobile.raw?.id ||
        mobile.raw?._id ||
        mobile.raw?.product_id ||
        mobile.raw?.productId ||
        mobile.raw?._doc?._id ||
        null;

      if (!resolvedId) {
        console.error("togglePublish: missing id for mobile", mobile);
        showToast("Error", "Missing mobile id, cannot update", "error");
        return;
      }

      // decode user id from JWT token if available
      const parseJwt = (t) => {
        try {
          const base64Url = t.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
          const jsonPayload = decodeURIComponent(
            atob(padded)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
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

      const res = await fetch(
        `http://localhost:5000/api/products/${resolvedId}/publish`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Update failed${errText ? ": " + errText : ""}`);
      }

      const data = await res.json().catch(() => null);
      const updatedPublished =
        (data &&
          (data.data?.is_published ??
            data.data?.published ??
            data.is_published ??
            data.published)) ??
        newPublished;

      setMobiles((prev) =>
        prev.map((m) =>
          (m.id ||
            m.raw?.id ||
            m.raw?._id ||
            m.raw?.product_id ||
            m.raw?.productId) === resolvedId
            ? { ...m, published: updatedPublished }
            : m
        )
      );

      showToast(
        "Success",
        `"${mobile.name}" ${updatedPublished ? "published" : "unpublished"}`,
        "success"
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

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Export function
  const handleExport = async (publishedOnly = false) => {
    try {
      const token = Cookies.get("authToken");
      const res = await fetch("http://localhost:5000/api/smartphones/export", {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("Export failed");

      const data = await res.json();
      const exportData = publishedOnly
        ? data.filter((item) => item.published || item.is_published)
        : data;

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mobiles-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast(
        "Export Successful",
        `${exportData.length} mobiles exported`,
        "success"
      );
    } catch (error) {
      console.error("Export error:", error);
      showToast("Export Failed", "Failed to export mobiles", "error");
    }
  };

  // Import function
  const handleImport = async (file) => {
    if (!file) return;

    try {
      const token = Cookies.get("authToken");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:5000/api/smartphones/import", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Import failed");

      showToast(
        "Import Successful",
        "Mobiles imported successfully",
        "success"
      );

      // Reload the data
      window.location.reload();
    } catch (error) {
      console.error("Import error:", error);
      showToast("Import Failed", "Failed to import mobiles", "error");
    }
  };

  // Stats
  const totalMobiles = mobiles.length;
  const publishedMobiles = mobiles.filter((m) => m.published).length;
  const unpublishedMobiles = mobiles.filter((m) => !m.published).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Mobile Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your smartphone inventory and details
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/create-mobile")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              <FaPlus className="text-sm" />
              <span>Add Mobile</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Mobiles</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CountUp end={totalMobiles} duration={1.0} />
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaMobile className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  <CountUp end={publishedMobiles} duration={1.0} />
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
                  <CountUp end={unpublishedMobiles} duration={1.0} />
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
              <h2 className="font-semibold text-gray-800">Mobiles List</h2>
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                {filteredAndSortedMobiles.length}
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
                  placeholder="Search mobiles..."
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
                  <option value="rating">Rating</option>
                  <option value="price-high">Price High</option>
                  <option value="price-low">Price Low</option>
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
                  Mobile
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Model
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Specs
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rating
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
                  <td colSpan="8" className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <FaSpinner className="animate-spin text-2xl text-blue-600" />
                    </div>
                  </td>
                </tr>
              ) : paginatedMobiles.length > 0 ? (
                paginatedMobiles.map((mobile, idx) => (
                  <tr
                    key={
                      mobile.id ||
                      mobile.raw?.id ||
                      mobile.raw?._id ||
                      `mobile-${startIndex + idx}`
                    }
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {mobile.images && mobile.images.length > 0 ? (
                            <img
                              className="h-10 w-10 rounded-md object-contain bg-white border border-gray-200 p-1"
                              src={mobile.images[0]}
                              alt={mobile.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://via.placeholder.com/40?text=Mobile";
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <FaMobile className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">
                            {mobile.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                              {mobile.brand}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {mobile.model}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">Storage:</span>{" "}
                          {mobile.storage || "N/A"}
                        </div>
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">RAM:</span>{" "}
                          {mobile.ram || "N/A"}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(mobile.price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {mobile.variants?.length || 0} variants
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <FaStar className="text-yellow-400 mr-1" />
                        <span className="text-sm font-semibold text-gray-900">
                          {mobile.rating}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(mobile)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          mobile.published
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {mobile.published ? (
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

                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        {formatDate(mobile.launch_date)}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/edit-mobile/${mobile.id}`, {
                              state: { smartphone: mobile.raw },
                            })
                          }
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit mobile"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => navigate(`/mobile/${mobile.id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="View details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDelete(mobile.id, mobile.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete mobile"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <FaMobile className="text-4xl text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">
                        {searchTerm ? "No mobiles found" : "No mobiles yet"}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "Add your first mobile using the form"}
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
                    filteredAndSortedMobiles.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredAndSortedMobiles.length}
                </span>{" "}
                mobiles
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
          Delete) to manage individual mobiles.
        </p>
      </div>
    </div>
  );
};

export default ViewMobiles;
