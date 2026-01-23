import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import {
  FaMemory,
  FaHdd,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaListAlt,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../api";

const RamStorageConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    ram: "",
    storage: "",
    long: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch configurations
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("authToken");
<<<<<<< HEAD
      const res = await fetch(buildUrl("/api/ram-storage-config"), {
=======
      const res = await fetch("http://apishpere.duckdns.org/api/ram-storage-config", {
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897
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
      else if (data && Array.isArray(data.configs)) rows = data.configs;
      else if (data && Array.isArray(data.data)) rows = data.data;
      else rows = data.ram_storage_long || [];

      setConfigs(rows);
      showToast("Success", "Configurations loaded successfully", "success");
    } catch (err) {
      console.error("Failed to fetch configurations:", err);
      setError(err.message || "Failed to load configurations");
      showToast("Error", "Failed to load configurations", "error");
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

  // Reset form
  const resetForm = () => {
    setFormData({
      ram: "",
      storage: "",
      long: "",
    });
    setEditingId(null);
  };

  // Handle edit
  const handleEdit = (config) => {
    setFormData({
      ram: config.ram || "",
      storage: config.storage || "",
      long: config.long || "",
    });
    setEditingId(config.id);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    // Validation
    if (!formData.ram.trim() || !formData.storage.trim()) {
      showToast("Validation Error", "RAM and Storage are required", "error");
      return;
    }

    try {
      const token = Cookies.get("authToken");
      const method = editingId ? "PUT" : "POST";
      const url = editingId
<<<<<<< HEAD
        ? buildUrl(`/api/ram-storage-config/${editingId}`)
        : buildUrl("/api/ram-storage-config");
=======
        ? `http://apishpere.duckdns.org/api/ram-storage-config/${editingId}`
        : "http://apishpere.duckdns.org/api/ram-storage-config";
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      const savedConfig = data.data || data;

      if (editingId) {
        setConfigs((prev) =>
          prev.map((config) =>
            config.id === editingId ? savedConfig : config,
          ),
        );
        showToast("Success", "Configuration updated successfully", "success");
      } else {
        setConfigs((prev) => [savedConfig, ...prev]);
        showToast("Success", "Configuration added successfully", "success");
      }

      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      showToast("Error", "Failed to save configuration", "error");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this configuration?")
    ) {
      return;
    }

    try {
      const token = Cookies.get("authToken");
<<<<<<< HEAD
      const res = await fetch(buildUrl(`/api/ram-storage-config/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
=======
      const res = await fetch(
        `http://apishpere.duckdns.org/api/ram-storage-config/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      setConfigs((prev) => prev.filter((config) => config.id !== id));
      showToast("Success", "Configuration deleted successfully", "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error", "Failed to delete configuration", "error");
    }
  };

  // Filter configurations
  const filteredConfigs = configs.filter(
    (config) =>
      config.ram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.storage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.long.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination
  const totalPages = Math.ceil(filteredConfigs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedConfigs = filteredConfigs.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

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
              RAM & Storage Configuration
            </h1>
            <p className="text-gray-600 mt-1">
              Manage RAM and storage combinations with descriptions
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
              <FaListAlt />
              <CountUp end={configs.length} duration={0.9} /> Configurations
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Configurations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {configs.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaMemory className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unique RAM Values</p>
                <p className="text-2xl font-bold text-purple-600">
                  {[...new Set(configs.map((c) => c.ram))].length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaMemory className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unique Storage Values</p>
                <p className="text-2xl font-bold text-green-600">
                  {[...new Set(configs.map((c) => c.storage))].length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaHdd className="text-green-600" />
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

      {/* Configuration Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">
            {editingId ? "Edit Configuration" : "Add New Configuration"}
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaMemory className="inline mr-2" />
                RAM
              </label>
              <input
                type="text"
                name="ram"
                value={formData.ram}
                onChange={handleInputChange}
                placeholder="e.g., 8GB, 12GB, 16GB"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaHdd className="inline mr-2" />
                Storage
              </label>
              <input
                type="text"
                name="storage"
                value={formData.storage}
                onChange={handleInputChange}
                placeholder="e.g., 128GB, 256GB, 512GB"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                name="long"
                value={formData.long}
                onChange={handleInputChange}
                placeholder="e.g., High performance configuration"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <FaTimes />
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <FaSave />
              {editingId ? "Update Configuration" : "Add Configuration"}
            </button>
          </div>
        </div>
      </div>

      {/* Configuration List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-gray-800">Configurations</h2>
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                {filteredConfigs.length}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search configurations..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
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
                  S.NO
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  RAM
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Storage
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created Date
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
              ) : paginatedConfigs.length > 0 ? (
                paginatedConfigs.map((config, idx) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {startIndex + idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <FaMemory className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {config.ram}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <FaHdd className="text-green-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {config.storage}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {config.long || "No description"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {config.created_at
                          ? new Date(config.created_at).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(config)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
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
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <FaMemory className="text-2xl text-gray-400" />
                        <FaHdd className="text-2xl text-gray-400 -ml-2" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {searchTerm
                          ? "No configurations found"
                          : "No configurations yet"}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "Add your first configuration using the form above"}
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
                  {Math.min(startIndex + itemsPerPage, filteredConfigs.length)}
                </span>{" "}
                of <span className="font-medium">{filteredConfigs.length}</span>{" "}
                configurations
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
          <strong>Note:</strong> Use this configuration to define RAM and
          storage combinations that can be used across mobile phones and
          laptops. The description field helps identify the use case or target
          market for each configuration.
        </p>
      </div>
    </div>
  );
};

export default RamStorageConfig;
