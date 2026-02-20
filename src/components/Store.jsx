import React, { useState, useEffect, useRef } from "react";
import {
  FaStore,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaFilter,
  FaSort,
  FaGlobe,
  FaLink,
  FaImage,
  FaStar,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
  FaUpload,
  FaCamera,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";
import CountUp from "react-countup";

const OnlineStoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    status: "active",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [toasts, setToasts] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch stores
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl("/api/online-stores"), {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let rows = [];
      if (Array.isArray(data)) rows = data;
      else if (data && Array.isArray(data.stores)) rows = data.stores;
      else if (data && Array.isArray(data.data)) rows = data.data;
      else rows = data || [];

      setStores(rows);
      showToast("Success", "Online stores loaded successfully", "success");
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      setError(err.message || "Failed to load online stores");
      showToast("Error", "Failed to load online stores", "error");
    } finally {
      setLoading(false);
    }
  };

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

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image file upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      showToast(
        "Error",
        "Please upload a valid image (JPEG, PNG, SVG, WebP)",
        "error",
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Error", "Image size should be less than 5MB", "error");
      return;
    }

    setUploadingImage(true);

    try {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);

      // Upload to Cloudinary using shared utility (brands preset)
      const data = await uploadToCloudinary(file, "brands");
      if (data && data.secure_url) {
        setFormData((prev) => ({ ...prev, logo: data.secure_url }));
        showToast("Success", "Logo uploaded successfully", "success");
      } else {
        throw new Error("No secure_url returned from upload");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      showToast("Error", "Failed to upload image", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      logo: "",
      status: "active",
    });
    setImagePreview(null);
    setEditingId(null);
  };

  // Handle edit
  const handleEdit = (store) => {
    setFormData({
      name: store.name || "",
      logo: store.logo || "",
      status: store.status || "active",
    });
    setImagePreview(store.logo || null);
    setEditingId(store.id);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      showToast("Validation Error", "Store name is required", "error");
      return;
    }

    if (!formData.logo.trim()) {
      showToast("Validation Error", "Store logo is required", "error");
      return;
    }

    // no website/description validation required

    try {
      const token = Cookies.get("authToken");
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? buildUrl(`/api/online-stores/${editingId}`)
        : buildUrl("/api/online-stores");

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Save failed");
      }

      const data = await res.json();
      const savedStore = data.data || data;

      if (editingId) {
        setStores((prev) =>
          prev.map((store) => (store.id === editingId ? savedStore : store)),
        );
        showToast("Success", "Online store updated successfully", "success");
      } else {
        setStores((prev) => [savedStore, ...prev]);
        showToast("Success", "Online store added successfully", "success");
      }

      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      showToast("Error", err.message || "Failed to save store", "error");
    }
  };

  // Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl(`/api/online-stores/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      setStores((prev) => prev.filter((store) => store.id !== id));
      showToast("Success", "Online store deleted successfully", "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error", "Failed to delete store", "error");
    }
  };

  // Toggle store status
  const toggleStatus = async (store) => {
    try {
      const token = Cookies.get("authToken");
      const newStatus = store.status === "active" ? "inactive" : "active";

      const res = await fetch(
        buildUrl(`/api/online-stores/${store.id}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!res.ok) throw new Error("Status update failed");

      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, status: newStatus } : s)),
      );

      showToast("Success", `"${store.name}" marked as ${newStatus}`, "success");
    } catch (err) {
      console.error("Status toggle error:", err);
      showToast("Error", "Failed to update status", "error");
    }
  };

  // removed website URL helpers (website field no longer used)

  // Filter and sort stores
  const filteredAndSortedStores = stores
    .filter((store) => {
      if (statusFilter === "all") return true;
      return store.status === statusFilter;
    })
    .filter((store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStores = filteredAndSortedStores.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Stats
  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.status === "active").length;
  const inactiveStores = stores.filter((s) => s.status === "inactive").length;

  return (
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
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
              Online Store Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage e-commerce platforms like Amazon, Flipkart, Vijay Sales,
              etc.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
              <FaStore />
              <CountUp end={totalStores} duration={0.9} /> Stores
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Stores</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CountUp end={totalStores} duration={0.9} />
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaStore className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Stores</p>
                <p className="text-2xl font-bold text-green-600">
                  <CountUp end={activeStores} duration={0.9} />
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
                <p className="text-sm text-gray-500">Inactive Stores</p>
                <p className="text-2xl font-bold text-gray-600">
                  <CountUp end={inactiveStores} duration={0.9} />
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

      {/* Store Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">
            {editingId ? "Edit Online Store" : "Add New Online Store"}
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Amazon, Flipkart, Vijay Sales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* website field removed */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Right Column - Logo Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Logo *
                </label>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/jpg,image/svg+xml,image/webp"
                  className="hidden"
                />

                {/* Logo preview and upload area */}
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Logo preview"
                          className="w-full h-full object-contain bg-white p-2"
                        />
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <FaCamera className="text-white text-2xl" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        Logo preview. Click on logo to change.
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={triggerFileInput}
                      className="w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {uploadingImage ? (
                        <FaSpinner className="animate-spin text-gray-400 text-2xl mb-2" />
                      ) : (
                        <>
                          <FaImage className="text-gray-400 text-2xl mb-2" />
                          <span className="text-sm text-gray-600 text-center px-2">
                            Click to upload logo
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    Upload store logo. Supported formats: JPEG, PNG, SVG, WebP.
                    Max size: 5MB
                  </div>
                </div>
              </div>

              {/* description field removed */}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <FaTimes />
                Cancel Edit
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={uploadingImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploadingImage ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaSave />
              )}
              {editingId ? "Update Store" : "Add Store"}
            </button>
          </div>
        </div>
      </div>

      {/* Store List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-gray-800">Online Stores</h2>
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                {filteredAndSortedStores.length}
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
                  placeholder="Search stores..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name A-Z</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Logo & Name
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
                  Created
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
                  <td colSpan="4" className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <FaSpinner className="animate-spin text-2xl text-blue-600" />
                    </div>
                  </td>
                </tr>
              ) : paginatedStores.length > 0 ? (
                paginatedStores.map((store, idx) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    {/* Logo & Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {store.logo ? (
                            <div className="h-12 w-12 rounded-lg border border-gray-200 bg-white p-1 flex items-center justify-center">
                              <img
                                src={store.logo}
                                alt={store.name}
                                className="h-10 w-10 object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    store.name,
                                  )}&background=3b82f6&color=fff&size=40`;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <FaStore className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            {store.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(store)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          store.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {store.status === "active" ? (
                          <>
                            <FaEye className="mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <FaEyeSlash className="mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">
                          {store.created_at
                            ? new Date(store.created_at).toLocaleDateString()
                            : "N/A"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {store.created_at
                            ? new Date(store.created_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : ""}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(store)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(store.id, store.name)}
                          className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <FaStore className="text-2xl text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {searchTerm || statusFilter !== "all"
                          ? "No stores found"
                          : "No online stores yet"}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm
                          ? "Try adjusting your search or filters"
                          : "Add your first online store using the form above"}
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
                    filteredAndSortedStores.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredAndSortedStores.length}
                </span>{" "}
                stores
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
    </div>
  );
};

export default OnlineStoreManagement;


