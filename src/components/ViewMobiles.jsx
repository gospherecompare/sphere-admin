import React, { useState, useEffect, useRef } from "react";
import CountUp from "react-countup";
import { useLocation, useNavigate } from "react-router-dom";
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
  FaRedo,
  FaDatabase,
  FaLayerGroup,
  FaCogs,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { isUpcomingOrPreorder } from "../utils/mobileStatus";

const toScore = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatScore = (value) => {
  const parsed = toScore(value);
  return parsed === null ? "N/A" : `${parsed.toFixed(1)}%`;
};

const normalizeText = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const firstNonEmpty = (...values) =>
  values.map(normalizeText).find((value) => value.length > 0) || "";

const collectStorageTech = (mobile, variant = null) =>
  firstNonEmpty(
    variant?.storage_type,
    variant?.storageType,
    variant?.storage_technology,
    variant?.storageTechnology,
    variant?.storage_tech,
    variant?.storageTech,
    mobile?.storage_type,
    mobile?.storageType,
    mobile?.storage_technology,
    mobile?.storageTechnology,
    mobile?.storage_tech,
    mobile?.storageTech,
    mobile?.performance?.storage_type,
    mobile?.performance?.storageType,
    mobile?.performance?.storage_technology,
    mobile?.performance?.storageTechnology,
    mobile?.performance_json?.storage_type,
    mobile?.performance_json?.storageType,
    mobile?.performanceJson?.storage_type,
    mobile?.performanceJson?.storageType,
    mobile?.raw?.performance?.storage_type,
    mobile?.raw?.performance?.storageType,
    mobile?.raw?.performance_json?.storage_type,
    mobile?.raw?.performance_json?.storageType,
    mobile?.raw?.performanceJson?.storage_type,
    mobile?.raw?.performanceJson?.storageType,
    mobile?.raw?.storage_type,
    mobile?.raw?.storageType,
  );

const ViewMobiles = ({
  title = "Mobile Management",
  subtitle = "Manage your smartphone inventory and details",
  listTitle = "Mobiles List",
  totalLabel = "Total Mobiles",
  filterFn = null,
  excludeUpcoming = true,
} = {}) => {
  const [mobiles, setMobiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [brandFilter, setBrandFilter] = useState("all");
  const [storageFilter, setStorageFilter] = useState("all");
  const [storageTechFilter, setStorageTechFilter] = useState("all");
  const [ramFilter, setRamFilter] = useState("all");
  const [variantFilter, setVariantFilter] = useState("all");
  const [variantStoreFilter, setVariantStoreFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const itemsPerPage = 10;

  useEffect(() => {
    const seededSearch = location.state?.searchTerm;
    if (typeof seededSearch === "string" && seededSearch.trim()) {
      setSearchTerm(seededSearch.trim());
    }
  }, [location.key, location.state]);

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

        // Process mobiles data into rows per-variant so storage-specific variants stay visible.
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

          const launchDateRaw =
            mobile.launch_date ||
            mobile.launchDate ||
            mobile.launch_date_text ||
            mobile.launchDateText ||
            null;

          const base = {
            id: productId,
            name: mobile.name || mobile.product_name || "Unnamed",
            brand: mobile.brand || mobile.brand_name || "Unknown",
            model: mobile.model || mobile.model_name || "Unknown",
            hook_score: mobile.hook_score ?? mobile.hookScore ?? null,
            buyer_intent: mobile.buyer_intent ?? mobile.buyerIntent ?? null,
            trend_velocity:
              mobile.trend_velocity ?? mobile.trendVelocity ?? null,
            freshness: mobile.freshness ?? null,
            published,
            launch_date: launchDateRaw,
            images: mobile.images || [],
            variants: mobile.variants || [],
            storageTech: collectStorageTech(mobile),
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
              const storageTech = collectStorageTech(mobile, v);

              processedMobiles.push({
                ...base,
                // keep product-level id for delete/publish actions
                rowKey: `${productId || "p"}-${
                  v.id || v.variant_id || v.variant_key || vi
                }`,
                price: variantPrice || mobile.price || 0,
                storage: storage || mobile.storage || "",
                storageTech: storageTech || mobile.storageTech || "",
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
              storageTech: collectStorageTech(mobile) || base.storageTech || "",
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
              launch_date:
                (m.raw && (m.raw.launch_date || m.raw.launchDate)) ||
                m.launch_date ||
                null,
              images: Array.isArray(m.images) ? [...m.images] : [],
              variants: m.variant
                ? [m.variant]
                : Array.isArray(m.variants)
                  ? [...m.variants]
                  : [],
              priceList: typeof m.price === "number" ? [m.price] : [],
              storagesSet: new Set(m.storage ? [m.storage] : []),
              storageTechSet: new Set(m.storageTech ? [m.storageTech] : []),
              ramsSet: new Set(m.ram ? [m.ram] : []),
              hook_score: toScore(m.hook_score),
              buyer_intent: toScore(m.buyer_intent),
              trend_velocity: toScore(m.trend_velocity),
              freshness: toScore(m.freshness),
              raw: m.raw || {},
              created_at:
                (m.raw &&
                  (m.raw.created_at ||
                    m.raw.createdAt ||
                    m.raw.created_on ||
                    m.raw.createdOn ||
                    m.raw.created ||
                    m.raw.updated_at ||
                    m.raw.updatedAt ||
                    m.raw.last_updated ||
                    m.raw.lastUpdated)) ||
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
            if (m.storageTech) g.storageTechSet.add(m.storageTech);
            if (m.ram) g.ramsSet.add(m.ram);
            if (g.hook_score === null && toScore(m.hook_score) !== null) {
              g.hook_score = toScore(m.hook_score);
            }
            if (g.buyer_intent === null && toScore(m.buyer_intent) !== null) {
              g.buyer_intent = toScore(m.buyer_intent);
            }
            if (
              g.trend_velocity === null &&
              toScore(m.trend_velocity) !== null
            ) {
              g.trend_velocity = toScore(m.trend_velocity);
            }
            if (g.freshness === null && toScore(m.freshness) !== null) {
              g.freshness = toScore(m.freshness);
            }
            g.published = g.published || m.published;
            if (!g.launch_date && m.launch_date) g.launch_date = m.launch_date;
          }
        });

        const groupedMobiles = Array.from(groupedMap.values()).map((g) => {
          const prices = (g.priceList || []).filter(
            (p) => typeof p === "number" && p > 0,
          );
          const price = prices.length ? Math.min(...prices) : 0;
          const storages = Array.from(g.storagesSet || []).filter(Boolean);
          const storageTechs = Array.from(g.storageTechSet || []).filter(Boolean);
          const rams = Array.from(g.ramsSet || []).filter(Boolean);
          return {
            id: g.id,
            rowKey: g.rowKey,
            name: g.name,
            brand: g.brand,
            model: g.model,
            published: g.published,
            launch_date: g.launch_date,
            images: Array.from(new Set(g.images || [])).filter(Boolean),
            variants: g.variants || [],
            price,
            storage: storages.join("/") || "",
            storageTech: storageTechs.join(" / ") || "",
            ram: rams.join("/") || "",
            hook_score: g.hook_score,
            buyer_intent: g.buyer_intent,
            trend_velocity: g.trend_velocity,
            freshness: g.freshness,
            raw: g.raw || {},
            created_at: g.created_at,
          };
        });

        let nextMobiles = groupedMobiles;
        if (excludeUpcoming) {
          nextMobiles = nextMobiles.filter(
            (mobile) => !isUpcomingOrPreorder(mobile),
          );
        }
        if (typeof filterFn === "function") {
          nextMobiles = nextMobiles.filter(filterFn);
        }
        setMobiles(nextMobiles);
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
  }, [reloadKey]);

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

  const resolveProductId = (mobile) => {
    if (!mobile) return null;
    return (
      mobile.raw?.product_id ||
      mobile.product_id ||
      mobile.id ||
      mobile.raw?.id ||
      mobile.raw?._id ||
      mobile.raw?.productId ||
      null
    );
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
  const storageTechs = Array.from(
    new Set(
      mobiles
        .map((m) => normalizeText(m.storageTech))
        .filter((value) => value.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const totalMobiles = mobiles.length;
  const publishedMobiles = mobiles.filter((m) => m.published).length;
  const unpublishedMobiles = mobiles.filter((m) => !m.published).length;
  const storageTechMobiles = mobiles.filter((m) => normalizeText(m.storageTech)).length;
  const completeVariantMobiles = mobiles.filter((m) =>
    productAllVariantsComplete(m),
  ).length;
  const incompleteVariantMobiles = Math.max(
    totalMobiles - completeVariantMobiles,
    0,
  );
  const storageTechCoverage = totalMobiles
    ? Math.round((storageTechMobiles / totalMobiles) * 100)
    : 0;
  const variantHealthCoverage = totalMobiles
    ? Math.round((completeVariantMobiles / totalMobiles) * 100)
    : 0;

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("newest");
    setBrandFilter("all");
    setStorageFilter("all");
    setStorageTechFilter("all");
    setRamFilter("all");
    setVariantFilter("all");
    setVariantStoreFilter("all");
    setCurrentPage(1);
  };

  // Helpers to check variant store/price/affiliate completeness
  function isVariantComplete(variant) {
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
  }

  function productAllVariantsComplete(mobile) {
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
  }
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
      if (storageTechFilter === "all") return true;
      return (
        normalizeText(mobile.storageTech).toLowerCase() ===
        storageTechFilter.toString().toLowerCase()
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
        mobile.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        normalizeText(mobile.storageTech)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
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
      if (sortBy === "hook-score") {
        return (toScore(b.hook_score) ?? -1) - (toScore(a.hook_score) ?? -1);
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
    storageTechFilter,
    ramFilter,
    variantFilter,
    variantStoreFilter,
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
      if (dateString instanceof Date) {
        if (Number.isNaN(dateString.getTime())) return "N/A";
        return dateString.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      // Handle date-only values without timezone shifting (e.g. "2026-02-08")
      const s = String(dateString).trim();
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]);
        const d = Number(m[3]);
        const utcDate = new Date(Date.UTC(y, mo - 1, d));
        return utcDate.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "N/A";
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
      if (dateString instanceof Date) {
        if (Number.isNaN(dateString.getTime())) return "N/A";
        return dateString.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "N/A";
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

  return (
    <div className="page-shell page-stack py-2 sm:py-3">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-xs space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`ui-form-shell flex items-start space-x-3 p-4 ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50/90"
                : toast.type === "error"
                  ? "border-rose-200 bg-rose-50/90"
                  : "border-blue-200 bg-blue-50/90"
            }`}
          >
            {toast.type === "success" && (
              <FaCheckCircle className="text-green-500 mt-0.5" />
            )}
            {toast.type === "error" && (
              <FaExclamationCircle className="text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{toast.title}</p>
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
      <div className="ui-form-shell p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="page-kicker mb-1">Inventory</p>
            <h1 className="page-title text-2xl sm:text-3xl">
              {title}
            </h1>
            <p className="page-copy mt-2 text-xs sm:text-sm">
              {subtitle}
            </p>
          </div>

          <div className="ui-toolbar-actions">
            <button
              onClick={() => navigate("/create-mobile")}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              <FaPlus className="text-sm" />
              <span>Add Mobile</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="ui-stat-grid mt-6">
          <div className="ui-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="page-kicker">{totalLabel}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  <CountUp end={totalMobiles} duration={1.0} />
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <FaMobile className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="ui-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="page-kicker">Published</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  <CountUp end={publishedMobiles} duration={1.0} />
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <FaEye className="text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="ui-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="page-kicker">Drafts</p>
                <p className="mt-2 text-2xl font-bold text-slate-600">
                  <CountUp end={unpublishedMobiles} duration={1.0} />
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <FaEyeSlash className="text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ui-form-shell p-4 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="page-kicker mb-1">Storage Intelligence</p>
              <span className="soft-pill text-[11px] uppercase tracking-[0.18em]">
                Live inventory signal
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Capacity, storage tech, and variant health in one place
            </h2>
            <p className="page-copy mt-2 text-sm">
              Filter by storage capacity or storage technology such as UFS, then
              inspect which products have complete store data.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="soft-pill text-xs sm:text-sm">
                <CountUp end={storageTechs.length} duration={1.0} /> storage technologies
              </span>
              <span className="soft-pill text-xs sm:text-sm">
                <CountUp end={storageTechCoverage} duration={1.0} suffix="%" /> tech coverage
              </span>
              <span className="soft-pill text-xs sm:text-sm">
                <CountUp end={completeVariantMobiles} duration={1.0} /> complete variants
              </span>
            </div>
          </div>

          <div className="ui-toolbar-actions xl:justify-end">
            <button
              onClick={() => setReloadKey((value) => value + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              <FaRedo className={`${loading ? "animate-spin" : ""} text-xs sm:text-sm`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => handleExport(true)}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 sm:text-sm"
            >
              <FaDownload className="text-xs sm:text-sm" />
              <span>Export Published</span>
            </button>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm"
            >
              <FaFilter className="text-xs sm:text-sm" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="rounded-md bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="page-kicker">Storage Techniques</p>
                <p className="mt-1 text-sm text-slate-600">
                  Tap a technique to isolate matching devices
                </p>
              </div>
              <button
                onClick={() => setStorageTechFilter("all")}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Show all
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setStorageTechFilter("all")}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                  storageTechFilter === "all"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                All techniques
              </button>
              {storageTechs.length > 0 ? (
                storageTechs.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => setStorageTechFilter(tech)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                      storageTechFilter === tech
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tech}
                  </button>
                ))
              ) : (
                <span className="soft-pill text-xs text-slate-500">
                  No storage-tech metadata yet
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="soft-pill text-xs sm:text-sm">
                <CountUp end={storageTechMobiles} duration={1.0} /> tagged rows
              </span>
              <span className="soft-pill text-xs sm:text-sm">
                <CountUp end={totalMobiles - storageTechMobiles} duration={1.0} /> missing tech data
              </span>
              <span className="soft-pill text-xs sm:text-sm">
                {storageTechFilter === "all"
                  ? "No active tech filter"
                  : `Filtering by ${storageTechFilter}`}
              </span>
            </div>
          </div>

          <div className="rounded-md bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="page-kicker">Health Snapshot</p>
                <p className="mt-1 text-sm text-slate-600">
                  Variant store completeness and storage coverage
                </p>
              </div>
              <span className="soft-pill text-xs">Live</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                  <span>Storage tech coverage</span>
                  <span>{storageTechCoverage}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-sm bg-white">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${storageTechCoverage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                  <span>Complete variant health</span>
                  <span>
                    {completeVariantMobiles}/{totalMobiles}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-sm bg-white">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${variantHealthCoverage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>{storageTechMobiles} rows tagged</span>
                <span>{incompleteVariantMobiles} need review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="ui-form-shell flex items-center space-x-3 border border-rose-200 bg-rose-50/90 p-4">
          <FaExclamationCircle className="text-red-500 flex-shrink-0" />
          <span className="text-rose-700">{error}</span>
        </div>
      )}

      <div className="ui-table-shell overflow-hidden">
        <div className="ui-form-header px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800 sm:text-base">
                {listTitle}
              </h2>
              <span className="soft-pill text-xs sm:text-sm">
                {filteredAndSortedMobiles.length}
              </span>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {/* Filter & Sort */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2 items-center">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full min-w-[88px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Drafts</option>
                </select>

                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full min-w-[100px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
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
                  className="w-full min-w-[88px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
                >
                  <option value="all">All Storage</option>
                  {storages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={storageTechFilter}
                  onChange={(e) => setStorageTechFilter(e.target.value)}
                  className="w-full min-w-[120px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
                >
                  <option value="all">All Storage Tech</option>
                  {storageTechs.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>

                <select
                  value={ramFilter}
                  onChange={(e) => setRamFilter(e.target.value)}
                  className="w-full min-w-[88px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
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
                  className="w-full min-w-[88px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
                >
                  <option value="all">All Variants</option>
                  <option value="with">With Variants</option>
                  <option value="without">Without Variants</option>
                </select>

                <select
                  value={variantStoreFilter}
                  onChange={(e) => setVariantStoreFilter(e.target.value)}
                  className="w-full min-w-[140px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
                >
                  <option value="all">All</option>
                  <option value="complete">All Variants Have Store Data</option>
                  <option value="incomplete">Missing Variant Store Data</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full min-w-[88px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-high">Price ↓</option>
                  <option value="price-low">Price ↑</option>
                  <option value="hook-score">Hook Score</option>
                </select>

                <button
                  onClick={clearAllFilters}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white sm:w-auto"
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
          <div className="flex flex-col items-stretch gap-2 border-b border-slate-200/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
                  className="w-full rounded-2xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:items-center sm:justify-end">
              <button
                onClick={() => handleExport()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 sm:w-auto sm:text-sm"
              >
                <FaDownload className="text-xs sm:text-sm" />
                <span>Export</span>
              </button>

              <div className="relative w-full sm:w-auto">
                <input
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={(e) => handleImport(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="import-file"
                />
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 sm:w-auto sm:text-sm">
                  <FaUpload className="text-xs sm:text-sm" />
                  <span>Import</span>
                </button>
              </div>
            </div>
          </div>
          {/* Desktop Table View */}
          <table className="ui-table hidden md:table w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Hook Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Specs
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Launch Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
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
                      mobile.rowKey ||
                      mobile.id ||
                      mobile.raw?.id ||
                      `mobile-${startIndex + idx}`
                    }
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4  py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-14 w-14">
                          {mobile.images && mobile.images.length > 0 ? (
                            <img
                              className="h-14 w-14 rounded-lg bg-white object-contain p-1"
                              src={mobile.images[0]}
                              alt={mobile.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://via.placeholder.com/40?text=Mobile";
                              }}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600">
                              <FaMobile className="text-white text-xs" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="max-w-[150px] truncate text-sm font-semibold text-slate-900">
                            {mobile.name}
                          </div>
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              {mobile.brand}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-900">
                        {mobile.model}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-violet-700">
                        {formatScore(mobile.hook_score)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Intent: {formatScore(mobile.buyer_intent)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-sm text-slate-900">
                          <span className="font-medium">Storage:</span>{" "}
                          <span className="font-semibold">
                            {mobile.storage || "N/A"}
                          </span>
                        </div>
                        <div className="text-sm text-slate-900">
                          <span className="font-medium">Storage Tech:</span>{" "}
                          <span className="font-semibold">
                            {mobile.storageTech || "N/A"}
                          </span>
                        </div>
                        <div className="text-sm text-slate-900">
                          <span className="font-medium">RAM:</span>{" "}
                          <span className="font-semibold">
                            {mobile.ram || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">
                        {formatDateTime(mobile.created_at)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {mobile.variants?.length || 0} variants
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(mobile)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          mobile.published
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
                      <div className="flex items-center text-sm text-slate-500">
                        <FaCalendarAlt className="mr-2 text-xs text-slate-400" />
                        {formatDate(mobile.launch_date)}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const editId = resolveProductId(mobile);
                            if (!editId) {
                              showToast(
                                "Error",
                                "Missing product id for edit",
                                "error",
                              );
                              return;
                            }
                            navigate(`/edit-mobile/${editId}`, {
                              state: { smartphone: mobile.raw },
                            });
                          }}
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
                  <td colSpan="8" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <FaMobile className="text-4xl text-gray-300 mb-3" />
                      <p className="font-medium text-slate-500">
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
                  className="ui-form-shell p-4 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex gap-3">
                        <div className="flex-shrink-0 h-16 w-16">
                          {mobile.images && mobile.images.length > 0 ? (
                            <img
                              className="h-16 w-16 rounded-lg bg-white object-contain p-1"
                              src={mobile.images[0]}
                              alt={mobile.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/64?text=Mobile";
                          }}
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600">
                          <FaMobile className="text-white text-2xl" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                            {mobile.name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {mobile.brand}
                          </p>
                        </div>
                        <button
                          onClick={() => togglePublish(mobile)}
                          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                            mobile.published
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {mobile.published ? "Published" : "Draft"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 sm:text-sm mb-2">
                        <div>
                          <p className="text-slate-500">Model</p>
                          <p className="font-medium text-slate-900">
                            {mobile.model}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Created</p>
                          <p className="font-medium text-slate-900">
                            {formatDateTime(mobile.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Storage</p>
                          <p className="font-medium text-slate-900">
                            {mobile.storage || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Storage Tech</p>
                          <p className="font-medium text-slate-900">
                            {mobile.storageTech || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">RAM</p>
                          <p className="font-medium text-slate-900">
                            {mobile.ram || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Hook Score</p>
                          <p className="font-medium text-violet-700">
                            {formatScore(mobile.hook_score)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Buyer Intent</p>
                          <p className="font-medium text-violet-700">
                            {formatScore(mobile.buyer_intent)}
                          </p>
                        </div>
                      </div>

                      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="text-xs" />
                          {formatDate(mobile.launch_date)}
                        </span>
                        <span>{mobile.variants?.length || 0} variants</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const editId = resolveProductId(mobile);
                            if (!editId) {
                              showToast(
                                "Error",
                                "Missing product id for edit",
                                "error",
                              );
                              return;
                            }
                            navigate(`/edit-mobile/${editId}`, {
                              state: { mobile },
                            });
                          }}
                          className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
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
                          className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-2 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
                          title="View mobile"
                        >
                          <FaEye className="inline mr-1" /> View
                        </button>
                        <button
                          onClick={() => handleDelete(mobile.id, mobile.name)}
                          className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-2 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
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
                <FaMobile className="mb-3 text-4xl text-slate-300" />
                <p className="font-medium text-slate-500">
                  {searchTerm ? "No mobiles found" : "No mobiles yet"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
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
          <div className="ui-form-header px-4 py-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="text-xs text-slate-700 sm:text-sm">
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
                  className="whitespace-nowrap rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
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
                        className={`flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-semibold shadow-sm sm:h-9 sm:w-9 sm:text-sm ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-white/80 text-slate-700 hover:bg-white"
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
                  className="whitespace-nowrap rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="ui-form-shell mt-4 border border-blue-200 bg-blue-50/80 p-4">
        <p className="text-xs sm:text-sm text-blue-700">
          <strong>Note:</strong> Click on status buttons to toggle between
          Published and Draft states. Use storage-tech filters, export tools,
          and action buttons to manage individual mobiles.
        </p>
      </div>
    </div>
  );
};

export default ViewMobiles;



