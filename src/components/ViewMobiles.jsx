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
import { buildUrl } from "../api";

const ViewMobiles = () => {
  const [mobiles, setMobiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [brandFilter, setBrandFilter] = useState("all");
  const [storageFilter, setStorageFilter] = useState("all");
  const [ramFilter, setRamFilter] = useState("all");
  const [variantFilter, setVariantFilter] = useState("all");
  const [variantStoreFilter, setVariantStoreFilter] = useState("all");
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
        const res = await fetch(buildUrl("/api/smartphone"), {
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

        // Process mobiles data into rows per-variant (so storage-specific variants appear separately)
        const processedMobiles = [];
        rows.forEach((mobile) => {
          const published = mobile.published || mobile.is_published || false;
          const productId =
            mobile.id ||
            mobile._id ||
            mobile.product_id ||
            mobile.productId ||
            (mobile.raw && (mobile.raw.product_id || mobile.raw.productId)) ||
            null;

          const base = {
            id: productId,
            name: mobile.name || mobile.product_name || "Unnamed",
            brand: mobile.brand || mobile.brand_name || "Unknown",
            model: mobile.model || mobile.model_name || "Unknown",
            published,
            launch_date: mobile.launch_date || mobile.created_at,
            images: mobile.images || [],
            variants: mobile.variants || [],
            raw: mobile,
          };

          if (Array.isArray(mobile.variants) && mobile.variants.length > 0) {
            mobile.variants.forEach((v, vi) => {
              const prices = (v.store_prices || []).map(
                (sp) => Number(sp.price) || 0,
              );
              const variantPrice = prices.filter((p) => p > 0).length
                ? Math.min(...prices.filter((p) => p > 0))
                : 0;

              const storage = v.storage || v.attributes?.storage || "";
              const ram = v.ram || v.attributes?.ram || "";

              processedMobiles.push({
                ...base,
                // keep product-level id for delete/publish actions
                rowKey: `${productId || "p"}-${
                  v.id || v.variant_id || v.variant_key || vi
                }`,
                price: variantPrice || mobile.price || 0,
                storage: storage || mobile.storage || "",
                ram: ram || mobile.ram || "",
                variant: v,
              });
            });
          } else {
            // single-row product without explicit variants
            // price fallback: product-level price or first available
            let price = 0;
            if (Array.isArray(mobile.variants) && mobile.variants.length > 0) {
              const prices = mobile.variants.flatMap((vv) =>
                (vv.store_prices || []).map((sp) => Number(sp.price) || 0),
              );
              price = prices.length
                ? Math.min(...prices.filter((p) => p > 0))
                : 0;
            }

            processedMobiles.push({
              ...base,
              rowKey: `${productId || "p"}-0`,
              price: price || mobile.price || 0,
              storage: mobile.storage || "",
              ram: mobile.ram || "",
            });
          }
        });

        // Group processed rows by product id so each product appears once (variants aggregated)
        const groupedMap = new Map();
        processedMobiles.forEach((m) => {
          const pid =
            m.id || (m.raw && (m.raw.id || m.raw._id)) || m.rowKey || m.name;
          if (!groupedMap.has(pid)) {
            groupedMap.set(pid, {
              id: m.id,
              rowKey: pid,
              name: m.name,
              brand: m.brand,
              model: m.model,
              published: m.published,
              images: Array.isArray(m.images) ? [...m.images] : [],
              variants: m.variant
                ? [m.variant]
                : Array.isArray(m.variants)
                  ? [...m.variants]
                  : [],
              priceList: typeof m.price === "number" ? [m.price] : [],
              storagesSet: new Set(m.storage ? [m.storage] : []),
              ramsSet: new Set(m.ram ? [m.ram] : []),
              raw: m.raw || {},
              created_at:
                (m.raw && (m.raw.created_at || m.raw.createdAt)) ||
                m.launch_date ||
                m.raw?.created_at ||
                null,
            });
          } else {
            const g = groupedMap.get(pid);
            if (Array.isArray(m.images))
              g.images.push(...m.images.filter(Boolean));
            if (m.variant) g.variants.push(m.variant);
            if (Array.isArray(m.variants)) g.variants.push(...m.variants);
            if (typeof m.price === "number") g.priceList.push(m.price);
            if (m.storage) g.storagesSet.add(m.storage);
            if (m.ram) g.ramsSet.add(m.ram);
            g.published = g.published || m.published;
          }
        });

        const groupedMobiles = Array.from(groupedMap.values()).map((g) => {
          const prices = (g.priceList || []).filter(
            (p) => typeof p === "number" && p > 0,
          );
          const price = prices.length ? Math.min(...prices) : 0;
          const storages = Array.from(g.storagesSet || []).filter(Boolean);
          const rams = Array.from(g.ramsSet || []).filter(Boolean);
          return {
            id: g.id,
            rowKey: g.rowKey,
            name: g.name,
            brand: g.brand,
            model: g.model,
            published: g.published,
            images: Array.from(new Set(g.images || [])).filter(Boolean),
            variants: g.variants || [],
            price,
            storage: storages.join("/") || "",
            ram: rams.join("/") || "",
            raw: g.raw || {},
            created_at: g.created_at,
          };
        });

        setMobiles(groupedMobiles);
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
  // Derived filter options
  const brands = Array.from(
    new Set(
      mobiles.map((m) => (m.brand || "").toString().trim()).filter(Boolean),
    ),
  ).sort();
  const rams = Array.from(
    new Set(
      mobiles.map((m) => (m.ram || "").toString().trim()).filter(Boolean),
    ),
  ).sort((a, b) => {
    const na = parseInt(a) || 0;
    const nb = parseInt(b) || 0;
    return na - nb;
  });
  const storages = Array.from(
    new Set(
      mobiles.map((m) => (m.storage || "").toString().trim()).filter(Boolean),
    ),
  ).sort((a, b) => {
    const na = parseInt(a) || 0;
    const nb = parseInt(b) || 0;
    return na - nb;
  });

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("newest");
    setBrandFilter("all");
    setStorageFilter("all");
    setRamFilter("all");
    setVariantFilter("all");
    setVariantStoreFilter("all");
    setCurrentPage(1);
  };

  // Helpers to check variant store/price/affiliate completeness
  const isVariantComplete = (variant) => {
    if (!variant) return false;
    const storePrices = variant.store_prices || variant.storePrices || [];
    if (!Array.isArray(storePrices) || storePrices.length === 0) return false;
    // A store price entry is considered complete if it has a positive price and a store identifier and/or affiliate/link
    return storePrices.some((sp) => {
      const price = Number(sp?.price) || 0;
      const hasPrice = price > 0;
      const hasAffiliate = Boolean(
        sp?.affiliate_link ||
        sp?.affiliate ||
        sp?.affiliateUrl ||
        sp?.link ||
        sp?.url,
      );
      const hasStore = Boolean(
        sp?.store || sp?.store_id || sp?.shop || sp?.merchant,
      );
      return hasPrice && (hasAffiliate || hasStore);
    });
  };

  const productAllVariantsComplete = (mobile) => {
    // If product has variants, ensure every variant is complete
    if (Array.isArray(mobile.variants) && mobile.variants.length > 0) {
      return mobile.variants.every((v) => isVariantComplete(v));
    }
    // For single-row products, try to inspect raw.store_prices or raw data
    const raw = mobile.raw || {};
    const storePrices =
      raw.store_prices || raw.storePrices || raw.store_price || [];
    if (Array.isArray(storePrices) && storePrices.length > 0) {
      return storePrices.some((sp) => {
        const price = Number(sp?.price) || 0;
        const hasPrice = price > 0;
        const hasAffiliate = Boolean(
          sp?.affiliate_link ||
          sp?.affiliate ||
          sp?.affiliateUrl ||
          sp?.link ||
          sp?.url,
        );
        const hasStore = Boolean(
          sp?.store || sp?.store_id || sp?.shop || sp?.merchant,
        );
        return hasPrice && (hasAffiliate || hasStore);
      });
    }
    return false;
  };
  const filteredAndSortedMobiles = mobiles
    .filter((mobile) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "published") return mobile.published;
      if (statusFilter === "unpublished") return !mobile.published;
      return true;
    })
    .filter((mobile) => {
      if (brandFilter === "all") return true;
      return (
        (mobile.brand || "").toString().toLowerCase() ===
        brandFilter.toString().toLowerCase()
      );
    })
    .filter((mobile) => {
      if (storageFilter === "all") return true;
      return (
        (mobile.storage || "").toString().toLowerCase() ===
        storageFilter.toString().toLowerCase()
      );
    })
    .filter((mobile) => {
      if (ramFilter === "all") return true;
      return (
        (mobile.ram || "").toString().toLowerCase() ===
        ramFilter.toString().toLowerCase()
      );
    })

    .filter((mobile) => {
      if (variantFilter === "all") return true;
      const hasVariants =
        Array.isArray(mobile.variants) && mobile.variants.length > 0;
      if (variantFilter === "with") return hasVariants;
      if (variantFilter === "without") return !hasVariants;
      return true;
    })
    .filter((mobile) => {
      if (variantStoreFilter === "all") return true;
      const allComplete = productAllVariantsComplete(mobile);
      if (variantStoreFilter === "complete") return allComplete;
      if (variantStoreFilter === "incomplete") return !allComplete;
      return true;
    })
    .filter(
      (mobile) =>
        mobile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mobile.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mobile.model.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.created_at || b.launch_date) -
          new Date(a.created_at || a.launch_date)
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at || a.launch_date) -
          new Date(b.created_at || b.launch_date)
        );
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
    startIndex + itemsPerPage,
  );

  // Reset to first page when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    brandFilter,
    storageFilter,
    ramFilter,
    variantFilter,
    sortBy,
  ]);

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

  // Handle delete (robust id resolution + error logging)
  const handleDelete = async (idOrMobile, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const token = Cookies.get("authToken");

      // Accept either an id or a mobile object
      const mobileObj = typeof idOrMobile === "object" ? idOrMobile : null;
      const raw = mobileObj?.raw || mobileObj;

      const resolvedId =
        idOrMobile && typeof idOrMobile !== "object"
          ? idOrMobile
          : mobileObj?.id ||
            raw?.id ||
            raw?._id ||
            raw?.product_id ||
            raw?.productId ||
            null;

      if (!resolvedId) {
        throw new Error("Missing id for delete request");
      }

      const res = await fetch(
        buildUrl(`/api/smartphone/${encodeURIComponent(resolvedId)}`),
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Delete failed", res.status, text);
        throw new Error(`Delete failed: HTTP ${res.status} ${text}`);
      }

      setMobiles((prev) =>
        prev.filter((mobile) => {
          const candidateIds = [
            mobile.id,
            mobile.raw?.id,
            mobile.raw?._id,
            mobile.raw?.product_id,
            mobile.raw?.productId,
          ].map((v) => (v !== undefined && v !== null ? String(v) : null));
          return !candidateIds.includes(String(resolvedId));
        }),
      );

      showToast("Success", `"${name}" deleted successfully`, "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error", `Failed to delete "${name}": ${err.message}`, "error");
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
            : m,
        ),
      );

      showToast(
        "Success",
        `"${mobile.name}" ${updatedPublished ? "published" : "unpublished"}`,
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
      const res = await fetch(buildUrl("/api/smartphones/export"), {
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
        "success",
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

      const res = await fetch(buildUrl("/api/import/smartphones"), {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Import failed: ${res.status} ${txt}`);
      }

      const data = await res.json().catch(() => null);
      if (data && data.summary) {
        showToast(
          "Import Completed",
          `Rows: ${data.summary.total_rows}, Inserted: ${data.summary.inserted}, Skipped: ${data.summary.skipped}, Failed: ${data.summary.failed}`,
          "success",
        );

        // If server returned missing values (brands or fields), show an error toast
        if (Array.isArray(data.missing) && data.missing.length) {
          showToast(
            "Import Error",
            `Missing: ${data.missing.join(", ")}`,
            "error",
          );
        }
      } else {
        showToast(
          "Import Successful",
          "Mobiles imported successfully",
          "success",
        );
      }

      // Delay reload briefly so toasts are visible to the user
      setTimeout(() => window.location.reload(), 1400);
    } catch (error) {
      console.error("Import error:", error);
      showToast(
        "Import Failed",
        error.message || "Failed to import mobiles",
        "error",
      );
    }
  };

  // Stats
  const totalMobiles = mobiles.length;
  const publishedMobiles = mobiles.filter((m) => m.published).length;
  const unpublishedMobiles = mobiles.filter((m) => !m.published).length;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-white   shadow-lg border p-4 max-w-sm w-full flex items-start space-x-3 ${
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
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Mobile Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Manage your smartphone inventory and details
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/create-mobile")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm"
            >
              <FaPlus className="text-sm" />
              <span>Add Mobile</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Mobiles</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CountUp end={totalMobiles} duration={1.0} />
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100   flex items-center justify-center">
                <FaMobile className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md  p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  <CountUp end={publishedMobiles} duration={1.0} />
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100   flex items-center justify-center">
                <FaEye className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md  p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Drafts</p>
                <p className="text-2xl font-bold text-gray-600">
                  <CountUp end={unpublishedMobiles} duration={1.0} />
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100   flex items-center justify-center">
                <FaEyeSlash className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200   flex items-center space-x-3">
          <FaExclamationCircle className="text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-3 sm:px-4 py-3 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm sm:text-base text-gray-800">
                Mobiles List
              </h2>
              <span className="bg-gray-100 text-gray-600 text-xs sm:text-sm px-2 py-1 rounded-full">
                {filteredAndSortedMobiles.length}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Filter & Sort */}
              <div className="flex flex-wrap gap-1 items-center">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-1.5 sm:px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap min-w-[88px]"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Drafts</option>
                </select>

                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="px-1.5 sm:px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap min-w-[100px]"
                >
                  <option value="all">All Brands</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <select
                  value={storageFilter}
                  onChange={(e) => setStorageFilter(e.target.value)}
                  className="px-1.5 sm:px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap min-w-[88px]"
                >
                  <option value="all">All Storage</option>
                  {storages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={ramFilter}
                  onChange={(e) => setRamFilter(e.target.value)}
                  className="px-1.5 sm:px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap min-w-[88px]"
                >
                  <option value="all">All RAM</option>
                  {rams.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {/* price inputs removed */}

                <select
                  value={variantFilter}
                  onChange={(e) => setVariantFilter(e.target.value)}
                  className="px-1.5 sm:px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap min-w-[88px]"
                >
                  <option value="all">All Variants</option>
                  <option value="with">With Variants</option>
                  <option value="without">Without Variants</option>
                </select>

                <select
                  value={variantStoreFilter}
                  onChange={(e) => setVariantStoreFilter(e.target.value)}
                  className="px-1.5 sm:px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap min-w-[140px]"
                >
                  <option value="all">All</option>
                  <option value="complete">All Variants Have Store Data</option>
                  <option value="incomplete">Missing Variant Store Data</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-1.5 sm:px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap min-w-[88px]"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-high">Price ↓</option>
                  <option value="price-low">Price ↑</option>
                </select>

                <button
                  onClick={clearAllFilters}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                  title="Clear filters"
                >
                  Clear
                </button>
              </div>

              {/* Export/Import removed from header - moved to table top */}
            </div>
          </div>
        </div>

        {/* Responsive Table / Card Layout */}
        <div className="overflow-x-auto">
          {/* Table Top Export/Import */}
          <div className="px-3 sm:px-4 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
            <div className="w-full sm:w-1/2">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400 text-sm" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap"
              >
                <FaDownload className="text-xs sm:text-sm" />
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
                <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap">
                  <FaUpload className="text-xs sm:text-sm" />
                  <span>Import</span>
                </button>
              </div>
            </div>
          </div>
          {/* Desktop Table View */}
          <table className="hidden md:table w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specs
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Launch Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              ) : paginatedMobiles.length > 0 ? (
                paginatedMobiles.map((mobile, idx) => (
                  <tr
                    key={
                      mobile.rowKey ||
                      mobile.id ||
                      mobile.raw?.id ||
                      `mobile-${startIndex + idx}`
                    }
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4  py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-14 w-14 ">
                          {mobile.images && mobile.images.length > 0 ? (
                            <img
                              className="rounded-sm object-contain"
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
                              <FaMobile className="text-white text-xs" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900 truncate max-w-[150px] text-sm">
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
                          <span className="font-semibold">
                            {mobile.storage || "N/A"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">RAM:</span>{" "}
                          <span className="font-semibold">
                            {mobile.ram || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">
                        {formatDateTime(mobile.created_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {mobile.variants?.length || 0} variants
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
                            <FaEye className="mr-1 text-xs" />
                            Published
                          </>
                        ) : (
                          <>
                            <FaEyeSlash className="mr-1 text-xs" />
                            Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-2 text-xs text-gray-400" />
                        {formatDate(mobile.launch_date)}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex items-center gap-2">
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
                          onClick={() =>
                            navigate(
                              `/mobile/${encodeURIComponent(mobile.name)}`,
                            )
                          }
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
                  <td colSpan="7" className="px-4 py-8 text-center">
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-3 sm:p-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <FaSpinner className="animate-spin text-2xl text-blue-600" />
              </div>
            ) : paginatedMobiles.length > 0 ? (
              paginatedMobiles.map((mobile, idx) => (
                <div
                  key={
                    mobile.rowKey ||
                    mobile.id ||
                    mobile.raw?.id ||
                    `mobile-${startIndex + idx}`
                  }
                  className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 h-16 w-16">
                      {mobile.images && mobile.images.length > 0 ? (
                        <img
                          className="h-16 w-16 rounded-md object-contain bg-white border border-gray-200 p-1"
                          src={mobile.images[0]}
                          alt={mobile.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/64?text=Mobile";
                          }}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <FaMobile className="text-white text-2xl" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {mobile.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {mobile.brand}
                          </p>
                        </div>
                        <button
                          onClick={() => togglePublish(mobile)}
                          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                            mobile.published
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {mobile.published ? "Published" : "Draft"}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-2">
                        <div>
                          <p className="text-gray-500">Model</p>
                          <p className="font-medium text-gray-900">
                            {mobile.model}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(mobile.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Storage</p>
                          <p className="font-medium text-gray-900">
                            {mobile.storage || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">RAM</p>
                          <p className="font-medium text-gray-900">
                            {mobile.ram || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="text-xs" />
                          {formatDate(mobile.launch_date)}
                        </span>
                        <span>{mobile.variants?.length || 0} variants</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/edit-mobile/${mobile.id}`, {
                              state: { mobile },
                            })
                          }
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded text-xs font-medium transition"
                          title="Edit mobile"
                        >
                          <FaEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/view-mobile/${mobile.id}`, {
                              state: { mobile },
                            })
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded text-xs font-medium transition"
                          title="View mobile"
                        >
                          <FaEye className="inline mr-1" /> View
                        </button>
                        <button
                          onClick={() => handleDelete(mobile.id, mobile.name)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded text-xs font-medium transition"
                          title="Delete mobile"
                        >
                          <FaTrash className="inline mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
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
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-3 sm:px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(
                    startIndex + itemsPerPage,
                    filteredAndSortedMobiles.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredAndSortedMobiles.length}
                </span>{" "}
                mobiles
              </div>
              <div className="flex items-center justify-center gap-2 overflow-x-auto">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
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
                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs sm:text-sm font-medium ${
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
                  className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs sm:text-sm text-blue-700">
          <strong>Note:</strong> Click on status buttons to toggle between
          Published and Draft states. Use action buttons to manage individual
          mobiles.
        </p>
      </div>
    </div>
  );
};

export default ViewMobiles;
