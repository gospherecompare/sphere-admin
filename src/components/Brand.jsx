// components/Brand.js
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    website: "",
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
  const [selectedBrandIds, setSelectedBrandIds] = useState([]);

  useEffect(() => {
    const seededSearch = location.state?.searchTerm;
    if (typeof seededSearch === "string" && seededSearch.trim()) {
      setSearchTerm(seededSearch.trim());
    }
  }, [location.key, location.state]);

  const categoryTypes = [
    "Electronics",
    "Laptops",
    "Networking",
    "Smartphones",
    "Home Appliances",
  ];

  const normalizeAssetUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;
    if (raw.startsWith("/")) return buildUrl(raw);
    if (/^(uploads|assets|images)\//i.test(raw)) {
      return buildUrl(`/${raw.replace(/^\/+/, "")}`);
    }
    return raw;
  };

  const resolveBrandLogo = (brand) =>
    normalizeAssetUrl(
      brand?.logo ||
        brand?.logo_url ||
        brand?.logoUrl ||
        brand?.image ||
        brand?.brand_logo ||
        brand?.brandLogo ||
        "",
    );

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
        logo: resolveBrandLogo(brand),
        website: brand.website || "",
        description: brand.description || "",
        category: brand.category || "",
        status: brand.status || "active",
        product_count:
          Number(
            brand.product_count ??
              brand.products_count ??
              brand.total_products ??
              brand.published_products ??
              0,
          ) || 0,
        published_products: brand.published_products || "0",
        created_at:
          brand.created_at || brand.createdAt || new Date().toISOString(),
        updated_at:
          brand.updated_at ||
          brand.updatedAt ||
          brand.created_at ||
          brand.createdAt ||
          new Date().toISOString(),
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
        website: formData.website.trim() || "",
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
      logo: resolveBrandLogo(brand),
      website: brand.website || "",
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
    setStatusUpdatingId(brand.id);
    const newStatus = brand.status === "active" ? "inactive" : "active";

    try {
      const token = Cookies.get("authToken");
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
          `Brand ${newStatus === "active" ? "activated" : "deactivated"} successfully!`,
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
      website: "",
      description: "",
      category: "",
      status: "active",
    });
    setIsEditing(false);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleCreateNew = () => {
    resetForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const visibleBrandIds = filteredAndSortedBrands.map((brand) => brand.id);
  const allVisibleSelected =
    visibleBrandIds.length > 0 &&
    visibleBrandIds.every((id) => selectedBrandIds.includes(id));

  const toggleSelectBrand = (brandId) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId],
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedBrandIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleBrandIds.includes(id));
      }

      const next = new Set(prev);
      visibleBrandIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
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

  // Stats
  const totalBrands = brands.length;
  const activeBrands = brands.filter((b) => b.status === "active").length;
  const inactiveBrands = brands.filter((b) => b.status === "inactive").length;

  return (
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
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

      <div className="space-y-6">
        {/* Left Side - Form */}
        <div className="w-full">
          <div className="max-w-4xl bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-800">
                {isEditing ? "Edit Brand" : "Create New Brand"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Use the edit action from the table to load brand details into this form.
              </p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Official Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.brand.com/store"
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
        <div className="w-full">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FaStore className="text-sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">
                        Brands Directory
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <CountUp
                          end={filteredAndSortedBrands.length}
                          duration={0.7}
                        />{" "}
                        of <CountUp end={totalBrands} duration={0.9} />
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Clean list view for search, status control, and quick edits.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FaSearch className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search brands..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:w-64"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="all">All status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest</option>
                      <option value="name">Name A-Z</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                      <FaPlus className="text-xs" />
                      {isEditing ? "Create New" : "Add Brand"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Brands Table */}
            <div className="px-5 py-4">
              {isLoading ? (
                <div className="py-12 text-center">
                  <FaSpinner className="animate-spin text-3xl text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading brands...</p>
                </div>
              ) : filteredAndSortedBrands.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-[1040px] w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr>
                        <th className="w-10 px-3 pb-2">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            aria-label="Select all visible brands"
                          />
                        </th>
                        <th className="px-3 pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Brand
                        </th>
                        <th className="px-3 pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Category
                        </th>
                        <th className="px-3 pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Products
                        </th>
                        <th className="px-3 pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Status
                        </th>
                        <th className="px-3 pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Created
                        </th>
                        <th className="px-3 pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedBrands.map((brand) => {
                        const isActive = brand.status === "active";
                        const productCount = Number(
                          brand.product_count ??
                            brand.published_products ??
                            0,
                        );
                        const isSelected = selectedBrandIds.includes(brand.id);

                        return (
                          <tr
                            key={brand.id}
                            className="group"
                          >
                            <td
                              className={`rounded-l-2xl border border-r-0 px-3 py-3 align-middle ${
                                isSelected
                                  ? "border-indigo-200 bg-indigo-50/70"
                                  : "border-slate-200 bg-white group-hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectBrand(brand.id)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                aria-label={`Select ${brand.name}`}
                              />
                            </td>
                            <td
                              className={`border border-l-0 border-r-0 px-3 py-3 align-middle ${
                                isSelected
                                  ? "border-indigo-200 bg-indigo-50/70"
                                  : "border-slate-200 bg-white group-hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex min-w-[220px] items-center gap-3">
                                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                  <img
                                    className="h-full w-full object-contain p-2"
                                    src={
                                      brand.logo ||
                                      "https://via.placeholder.com/64?text=Logo"
                                    }
                                    alt={brand.name}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src =
                                        "https://via.placeholder.com/64?text=Logo";
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {brand.name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-400">
                                    Brand ID: {brand.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td
                              className={`border border-l-0 border-r-0 px-3 py-3 align-middle ${
                                isSelected
                                  ? "border-indigo-200 bg-indigo-50/70"
                                  : "border-slate-200 bg-white group-hover:bg-slate-50"
                              }`}
                            >
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {brand.category || "No category"}
                              </span>
                            </td>
                            <td
                              className={`border border-l-0 border-r-0 px-3 py-3 text-center align-middle ${
                                isSelected
                                  ? "border-indigo-200 bg-indigo-50/70"
                                  : "border-slate-200 bg-white group-hover:bg-slate-50"
                              }`}
                            >
                              <span className="inline-flex min-w-[64px] items-center justify-center rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-600">
                                <CountUp end={productCount} duration={0.5} />
                              </span>
                            </td>
                            <td
                              className={`border border-l-0 border-r-0 px-3 py-3 align-middle ${
                                isSelected
                                  ? "border-indigo-200 bg-indigo-50/70"
                                  : "border-slate-200 bg-white group-hover:bg-slate-50"
                              }`}
                            >
                              <button
                                onClick={() => toggleStatus(brand)}
                                disabled={statusUpdatingId === brand.id}
                                className={`inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  isActive
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                } disabled:opacity-50`}
                              >
                                {statusUpdatingId === brand.id ? (
                                  <FaSpinner className="mr-2 animate-spin" />
                                ) : isActive ? (
                                  <>
                                    <FaEye className="mr-2 text-[10px]" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <FaEyeSlash className="mr-2 text-[10px]" />
                                    Inactive
                                  </>
                                )}
                              </button>
                            </td>
                            <td
                              className={`border border-l-0 border-r-0 px-3 py-3 align-middle ${
                                isSelected
                                  ? "border-indigo-200 bg-indigo-50/70"
                                  : "border-slate-200 bg-white group-hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center text-sm text-slate-500">
                                <FaCalendarAlt className="mr-2 text-slate-400" />
                                {formatDate(brand.created_at)}
                              </div>
                            </td>
                            <td
                              className={`rounded-r-2xl border border-l-0 px-3 py-3 align-middle ${
                                isSelected
                                  ? "border-indigo-200 bg-indigo-50/70"
                                  : "border-slate-200 bg-white group-hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(brand)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-500 transition hover:bg-amber-100 hover:text-amber-600"
                                  title="Edit brand"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDelete(brand.id)}
                                  disabled={productCount > 0}
                                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                                    productCount > 0
                                      ? "cursor-not-allowed bg-slate-100 text-slate-300"
                                      : "bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                                  }`}
                                  title={
                                    productCount > 0
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
                </div>
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

              {!isLoading && filteredAndSortedBrands.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Selected brands: <span className="font-semibold text-slate-700">{selectedBrandIds.length}</span>
                  </p>
                  <p>
                    Active brands in view: <span className="font-semibold text-slate-700">{filteredAndSortedBrands.filter((brand) => brand.status === "active").length}</span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brand;


