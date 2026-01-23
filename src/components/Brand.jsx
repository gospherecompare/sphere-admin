// components/Brand.js
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";
import CountUp from "react-countup";
import ExportCategories from "./ExportCategories";
import ImportExcel from "./ImportExcel";
import {
  FaStore,
  FaSave,
  FaTimes,
  FaUpload,
  FaImage,
  FaPlus,
  FaSpinner,
  FaEdit,
  FaTrash,
  FaSearch,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaProductHunt,
  FaCalendarAlt,
  FaCheckCircle,
} from "react-icons/fa";

const Brand = () => {
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    category: "",
    description: "",
    status: "active",
  });

  const token = Cookies.get("authToken");

  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const categoryTypes = [
    "Electronics",
    "Laptops",
    "Networking",
    "Smartphones",
    "Home Appliances",
  ];

  // Fetch brands from API
  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(buildUrl("/api/brand"), {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response structures
      const brandsArray = data.brands || data || [];

      const normalizedBrands = brandsArray.map((brand) => ({
        id: brand.id,
        name: brand.name || "",
        logo: brand.logo || "",
        description: brand.description || "",
        category: brand.category || "",
        status: brand.status || "active",
        published_products: brand.published_products || "0",
        created_at:
          brand.created_at || brand.createdAt || new Date().toISOString(),
        updated_at:
          brand.updated_at || brand.updatedAt || new Date().toISOString(),
      }));

      setBrands(normalizedBrands);
    } catch (error) {
      console.error("Fetch brands error:", error);
      setError(`Failed to load brands: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load brands on component mount
  useEffect(() => {
    fetchBrands();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      const data = await uploadToCloudinary(file, "brands");
      if (data && data.secure_url) {
        setFormData((prev) => ({ ...prev, logo: data.secure_url }));
        setSuccess("Logo uploaded successfully!");
      } else {
        throw new Error("No secure_url in response");
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      setError(`Error uploading logo: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name.trim()) {
      setError("Brand name is required");
      setIsLoading(false);
      return;
    }

    if (!formData.logo) {
      setError("Brand logo is required");
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = isEditing
        ? buildUrl(`/api/brands/${editingId}`)
        : buildUrl("/api/brands");

      const method = isEditing ? "PUT" : "POST";

      const payload = {
        name: formData.name.trim(),
        logo: formData.logo,
        description: formData.description || "",
        category: formData.category || "",
        status: formData.status,
      };

      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        data = {};
      }

      if (response.ok) {
        // Refresh brands list
        await fetchBrands();

        // Reset form
        resetForm();

        // Show success message
        const successMsg = `Brand ${formData.name} ${
          isEditing ? "updated" : "created"
        } successfully!`;
        setSuccess(successMsg);

        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000);
      } else {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to ${isEditing ? "update" : "create"} brand. Status: ${
              response.status
            }`,
        );
      }
    } catch (error) {
      console.error("Brand operation error:", error);
      setError(
        `Error ${isEditing ? "updating" : "creating"} brand: ${error.message}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setFormData({
      name: brand.name || "",
      logo: brand.logo || "",
      description: brand.description || "",
      category: brand.category || "",
      status: brand.status || "active",
    });
    setIsEditing(true);
    setEditingId(brand.id);
    setError("");
    setSuccess("");

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this brand? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(buildUrl(`/api/brands/${id}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        // Refresh brands list
        await fetchBrands();
        setSuccess("Brand deleted successfully!");

        // Auto-clear success message
        setTimeout(() => setSuccess(""), 5000);
      } else {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("Delete brand error:", error);
      setError(`Error deleting brand: ${error.message}`);
    }
  };

  const toggleStatus = async (brand) => {
    try {
      setStatusUpdatingId(brand.id);
      const newStatus = brand.status === "active" ? "inactive" : "active";

      const response = await fetch(buildUrl(`/api/brands/${brand.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: brand.name,
          logo: brand.logo,
          category: brand.category || "",
          status: newStatus,
        }),
      });

      if (response.ok) {
        // Update local state
        setBrands((prev) =>
          prev.map((b) =>
            b.id === brand.id ? { ...b, status: newStatus } : b,
          ),
        );
        setSuccess(
          `Brand ${
            newStatus === "active" ? "activated" : "deactivated"
          } successfully!`,
        );

        // Auto-clear success message
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorText = await response.text();
        throw new Error(
          `Status update failed: ${response.status} - ${errorText}`,
        );
      }
    } catch (err) {
      console.error("Status toggle error:", err);
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo: "",
      description: "",
      category: "",
      status: "active",
    });
    setIsEditing(false);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  // Filter and sort brands
  const filteredAndSortedBrands = brands
    .filter((brand) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "active") return brand.status === "active";
      if (activeFilter === "inactive") return brand.status === "inactive";
      return true;
    })
    .filter(
      (brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (brand.category &&
          brand.category.toLowerCase().includes(searchTerm.toLowerCase())),
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
      return 0;
    });

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

  // Stats
  const totalBrands = brands.length;
  const activeBrands = brands.filter((b) => b.status === "active").length;
  const inactiveBrands = brands.filter((b) => b.status === "inactive").length;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Brand Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your product brands and their details
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
            >
              <FaSpinner className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Brands</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CountUp end={totalBrands} duration={0.9} />
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
                <p className="text-sm text-gray-500">Active Brands</p>
                <p className="text-2xl font-bold text-green-600">
                  <CountUp end={activeBrands} duration={0.9} />
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
                <p className="text-sm text-gray-500">Inactive Brands</p>
                <p className="text-2xl font-bold text-gray-600">
                  <CountUp end={inactiveBrands} duration={0.9} />
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
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
          <FaCheckCircle className="text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
          <button
            onClick={() => setSuccess("")}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-800">
                {isEditing ? "Edit Brand" : "Create New Brand"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Samsung, Apple, Dell"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional short description about the brand"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Logo *
                  {formData.logo && (
                    <span className="ml-2 text-xs text-green-600">
                      ✓ Logo uploaded
                    </span>
                  )}
                </label>

                {formData.logo ? (
                  <div className="mb-3">
                    <div className="w-20 h-20 border border-gray-300 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={formData.logo}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain p-2"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/100?text=Logo+Error";
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, logo: "" }))
                      }
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove logo
                    </button>
                  </div>
                ) : null}

                <div
                  className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
                    isUploading
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <div className="relative">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Validate file size (2MB max)
                          if (file.size > 2 * 1024 * 1024) {
                            setError(
                              "File size too large. Maximum 2MB allowed.",
                            );
                            return;
                          }
                          handleLogoUpload(file);
                        }
                      }}
                      disabled={isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center">
                      {isUploading ? (
                        <>
                          <FaSpinner className="animate-spin text-blue-500 text-xl mb-2" />
                          <p className="text-sm text-blue-600">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <FaImage className="text-gray-400 text-xl mb-2" />
                          <p className="text-sm text-gray-600">
                            Click to upload logo
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, SVG (Max 2MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {formData.logo && (
                  <div className="mt-2">
                    <p
                      className="text-xs text-gray-500 truncate"
                      title={formData.logo}
                    >
                      URL: {formData.logo.substring(0, 50)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category (optional)</option>
                  {categoryTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === "active"}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === "inactive"}
                      onChange={handleChange}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      isUploading ||
                      !formData.name ||
                      !formData.logo
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" />
                        {isEditing ? "Updating..." : "Creating..."}
                      </span>
                    ) : isEditing ? (
                      "Update Brand"
                    ) : (
                      "Create Brand"
                    )}
                  </button>

                  {(isEditing || formData.name || formData.logo) && (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={isLoading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Brands List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-gray-800">Brands List</h2>
                  <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                    <CountUp
                      end={filteredAndSortedBrands.length}
                      duration={0.7}
                    />{" "}
                    of <CountUp end={totalBrands} duration={0.9} />
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
                      placeholder="Search brands..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                    />
                  </div>

                  {/* Filter & Sort */}
                  <div className="flex space-x-2">
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All</option>
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
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Brands Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-12 text-center">
                  <FaSpinner className="animate-spin text-3xl text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading brands...</p>
                </div>
              ) : filteredAndSortedBrands.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Brand
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
                    {filteredAndSortedBrands.map((brand) => {
                      const isActive = brand.status === "active";

                      return (
                        <tr
                          key={brand.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-md object-contain bg-white border border-gray-200 p-1"
                                  src={
                                    brand.logo ||
                                    "https://via.placeholder.com/40?text=Logo"
                                  }
                                  alt={brand.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://via.placeholder.com/40?text=Logo";
                                  }}
                                />
                              </div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">
                                  {brand.name}
                                </div>
                                {/* id removed from UI */}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleStatus(brand)}
                              disabled={statusUpdatingId === brand.id}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                isActive
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              } disabled:opacity-50`}
                            >
                              {statusUpdatingId === brand.id ? (
                                <FaSpinner className="animate-spin mr-1" />
                              ) : isActive ? (
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

                          <td className="px-4 py-3">
                            <div className="flex items-center text-sm text-gray-500">
                              <FaCalendarAlt className="mr-2 text-gray-400" />
                              {formatDate(brand.created_at)}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleEdit(brand)}
                                className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                title="Edit brand"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(brand.id)}
                                disabled={
                                  parseInt(brand.published_products || 0) > 0
                                }
                                className={`p-1 transition-colors ${
                                  parseInt(brand.published_products || 0) > 0
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-red-600 hover:text-red-900"
                                }`}
                                title={
                                  parseInt(brand.published_products || 0) > 0
                                    ? "Cannot delete brand with products"
                                    : "Delete brand"
                                }
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center">
                  <FaStore className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    {searchTerm ? "No brands found" : "No brands yet"}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchTerm
                      ? "Try adjusting your search"
                      : "Create your first brand using the form"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brand;
