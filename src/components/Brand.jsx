import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import CountUp from "react-countup";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaGlobe,
  FaImage,
  FaPlus,
  FaSave,
  FaSearch,
  FaSpinner,
  FaStore,
  FaTimes,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";
import { requestDeleteApproval } from "../utils/deleteApproval";
import { getProductEditRoute } from "../utils/searchNavigation";
import {
  EditorStatusChip,
  editorGhostButtonClassName,
  editorPrimaryButtonClassName,
} from "./MobileEditorUi";

const DEFAULT_FORM_DATA = {
  name: "",
  slug: "",
  marketingName: "",
  logo: "",
  banner: "",
  website: "",
  originCountry: "",
  foundedYear: "",
  description: "",
  status: "active",
  featured: false,
  sortOrder: "0",
  metaTitle: "",
  metaDescription: "",
};

const BASE_CATEGORY_OPTIONS = [
  "Electronics",
  "Laptops",
  "Networking",
  "Smartphones",
  "Home Appliances",
];

const BRAND_EDITOR_STORAGE_KEY = "client_1_brand_editor_extras_v1";
const BRAND_PUBLIC_BASE_URL = "https://www.hooks.in/brands";
const ORIGIN_COUNTRY_OPTIONS = [
  "United States",
  "China",
  "South Korea",
  "Japan",
  "India",
  "Finland",
  "Taiwan",
  "Germany",
  "United Kingdom",
  "Canada",
  "Sweden",
  "Vietnam",
];

const PAGE_SIZE = 10;
const BRAND_PRODUCT_PAGE_SIZE = 10;

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 sm:px-3 md:px-4";

const CARD_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";

const SECTION_HEADER_CLASS =
  "border-b border-slate-200 bg-white px-3 py-4 sm:px-4";

const FIELD_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:bg-white focus:ring-0";

const TEXTAREA_CLASS =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:bg-white focus:ring-0";

const GHOST_BUTTON_CLASS = `${editorGhostButtonClassName} rounded-md border-slate-200 bg-white shadow-none`;

const PRIMARY_BUTTON_CLASS = `${editorPrimaryButtonClassName} rounded-md border-[#4C35F2] bg-[#4C35F2] shadow-none`;

const TABLE_ICON_BUTTON_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700";

const TABLE_DANGER_BUTTON_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-none transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700";

const ORDER_BADGE_CLASS =
  "flex h-9 w-12 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-none";

const STAT_ICON_CLASSES = {
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

const slugifyValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildBrandMetaTitle = (name) =>
  String(name || "").trim() ? `${String(name || "").trim()} | hooks` : "";

const readStoredBrandExtras = () => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(BRAND_EDITOR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
};

const writeStoredBrandExtras = (value) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      BRAND_EDITOR_STORAGE_KEY,
      JSON.stringify(value || {}),
    );
  } catch (error) {
    console.error("Failed to persist brand editor extras:", error);
  }
};

const persistBrandExtras = (brandId, formData) => {
  if (!brandId) return;

  const next = readStoredBrandExtras();
  next[String(brandId)] = {
    slug: formData.slug.trim() || slugifyValue(formData.name),
    marketing_name: formData.marketingName.trim(),
    banner: formData.banner || "",
    founded_year: formData.foundedYear || "",
    featured: Boolean(formData.featured),
    sort_order: String(formData.sortOrder || "0"),
    meta_title: formData.metaTitle.trim(),
    meta_description: formData.metaDescription.trim(),
    origin_country: formData.originCountry || "",
  };
  writeStoredBrandExtras(next);
};

const removeStoredBrandExtras = (brandId) => {
  if (!brandId) return;

  const next = readStoredBrandExtras();
  delete next[String(brandId)];
  writeStoredBrandExtras(next);
};

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

const buildWebsiteHref = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const formatWebsiteLabel = (value) => {
  const href = buildWebsiteHref(value);
  if (!href) return "Not set";

  try {
    return new URL(href).hostname.replace(/^www\./i, "");
  } catch (error) {
    return String(value || "").trim() || "Not set";
  }
};

const formatDate = (value) => {
  if (!value) return "Not set";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const PRODUCT_TYPE_LABELS = {
  smartphone: "Smartphones",
  laptop: "Laptops",
  tv: "TVs",
  networking: "Networking",
  accessories: "Accessories",
};

const formatProductTypeLabel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Unknown";
  if (PRODUCT_TYPE_LABELS[normalized]) return PRODUCT_TYPE_LABELS[normalized];
  return normalized
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
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

function StatCard({ label, value, helper, icon: Icon, tone = "violet" }) {
  return (
    <div className={`${CARD_CLASS} px-4 py-4 sm:px-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {typeof value === "number" ? (
              <CountUp end={value} duration={0.8} />
            ) : (
              value
            )}
          </p>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${STAT_ICON_CLASSES[tone]}`}
        >
          <Icon className="text-lg" />
        </div>
      </div>
    </div>
  );
}

function BrandOverviewRing({ activeCount, inactiveCount, total }) {
  const activePercent = total ? (activeCount / total) * 100 : 0;
  const activeDegrees = (activePercent / 100) * 360;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-28 w-28 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#49c46b 0deg ${activeDegrees}deg, #fb7185 ${activeDegrees}deg 360deg)`,
        }}
      >
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-3xl font-semibold text-slate-950">{total}</span>
          <span className="text-xs font-medium text-slate-500">Brands</span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#49c46b]" />
            <span className="text-slate-600">Active</span>
          </div>
          <span className="font-semibold text-slate-900">
            {activeCount} (
            {total ? ((activeCount / total) * 100).toFixed(1) : "0.0"}%)
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#fb7185]" />
            <span className="text-slate-600">Inactive</span>
          </div>
          <span className="font-semibold text-slate-900">
            {inactiveCount} (
            {total ? ((inactiveCount / total) * 100).toFixed(1) : "0.0"}%)
          </span>
        </div>
      </div>
    </div>
  );
}

const Brand = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedBrandIds, setSelectedBrandIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [assignedProducts, setAssignedProducts] = useState([]);
  const [assignedProductsLoading, setAssignedProductsLoading] = useState(false);
  const [assignedProductsError, setAssignedProductsError] = useState("");
  const [assignedProductsSearch, setAssignedProductsSearch] = useState("");
  const [assignedProductsTypeFilter, setAssignedProductsTypeFilter] =
    useState("all");
  const [assignedProductsStatusFilter, setAssignedProductsStatusFilter] =
    useState("all");
  const [assignedProductsPage, setAssignedProductsPage] = useState(1);
  const [selectedAssignedProductIds, setSelectedAssignedProductIds] = useState(
    [],
  );

  useEffect(() => {
    const seededSearch = location.state?.searchTerm;
    if (typeof seededSearch === "string" && seededSearch.trim()) {
      setSearchTerm(seededSearch.trim());
    }
  }, [location.key, location.state]);

  const fetchBrands = async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(buildUrl("/api/brand"), {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const brandsArray = data.brands || data || [];
      const storedExtras = readStoredBrandExtras();

      const normalizedBrands = brandsArray.map((brand) => {
        const stored = storedExtras[String(brand.id)] || {};
        const normalizedName = brand.name || "";

        return {
          id: brand.id,
          name: normalizedName,
          slug: stored.slug || slugifyValue(normalizedName),
          marketingName: stored.marketing_name || normalizedName,
          logo: resolveBrandLogo(brand),
          banner: stored.banner || "",
          website: brand.website || "",
          description: brand.description || "",
          category: brand.category || "",
          originCountry: brand.category || stored.origin_country || "",
          foundedYear: stored.founded_year || "",
          status: String(brand.status || "active").toLowerCase(),
          featured: Boolean(stored.featured),
          sortOrder: String(stored.sort_order || "0"),
          metaTitle: stored.meta_title || buildBrandMetaTitle(normalizedName),
          metaDescription: stored.meta_description || brand.description || "",
          product_count:
            Number(
              brand.product_count ??
                brand.products_count ??
                brand.total_products ??
                brand.published_products ??
                0,
            ) || 0,
          published_products:
            Number(brand.published_products ?? brand.product_count ?? 0) || 0,
          created_at:
            brand.created_at || brand.createdAt || new Date().toISOString(),
        };
      });

      setBrands(normalizedBrands);
    } catch (fetchError) {
      console.error("Fetch brands error:", fetchError);
      setError(`Failed to load brands: ${fetchError.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchAssignedProducts = async (brandId) => {
    if (!brandId) {
      setAssignedProducts([]);
      setAssignedProductsError("");
      return;
    }

    setAssignedProductsLoading(true);
    setAssignedProductsError("");

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(buildUrl(`/api/brands/${brandId}/products`), {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse brand products response:", parseError);
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `HTTP ${response.status}`,
        );
      }

      const rows = Array.isArray(data?.products) ? data.products : [];
      const normalizedRows = rows.map((product) => {
        const releaseYear = Number(product?.release_year);
        const normalizedType = String(product?.product_type || "")
          .trim()
          .toLowerCase();
        return {
          id: Number(product?.product_id ?? product?.id) || null,
          name: String(product?.product_name || product?.name || "").trim() ||
            "Untitled product",
          productType: normalizedType,
          productTypeLabel: formatProductTypeLabel(normalizedType),
          category:
            String(product?.category || "").trim() ||
            formatProductTypeLabel(normalizedType),
          model: String(product?.model || "").trim() || "Not set",
          releaseYear: Number.isFinite(releaseYear)
            ? String(Math.trunc(releaseYear))
            : "",
          isPublished: Boolean(product?.is_published),
          createdAt: product?.product_created_at || null,
          imageUrl: normalizeAssetUrl(product?.image_url || ""),
          raw: product,
        };
      });

      setAssignedProducts(normalizedRows);
    } catch (fetchError) {
      console.error("Fetch brand products error:", fetchError);
      setAssignedProducts([]);
      setAssignedProductsError(
        `Failed to load assigned products: ${fetchError.message}`,
      );
    } finally {
      setAssignedProductsLoading(false);
    }
  };

  const resetFormValues = () => {
    setFormData(DEFAULT_FORM_DATA);
    setIsEditing(false);
    setEditingId(null);
    setAssignedProducts([]);
    setAssignedProductsLoading(false);
    setAssignedProductsError("");
    setAssignedProductsSearch("");
    setAssignedProductsTypeFilter("all");
    setAssignedProductsStatusFilter("all");
    setAssignedProductsPage(1);
    setSelectedAssignedProductIds([]);
  };

  const closeEditor = () => {
    resetFormValues();
    setShowEditor(false);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "name") {
        const previousAutoSlug = prev.slug || slugifyValue(prev.name);
        const previousAutoTitle =
          prev.metaTitle || buildBrandMetaTitle(prev.name);
        const previousAutoMarketing = prev.marketingName || prev.name;

        if (!prev.slug || prev.slug === previousAutoSlug) {
          next.slug = slugifyValue(value);
        }

        if (!prev.metaTitle || prev.metaTitle === previousAutoTitle) {
          next.metaTitle = buildBrandMetaTitle(value);
        }

        if (
          !prev.marketingName ||
          prev.marketingName === previousAutoMarketing
        ) {
          next.marketingName = value;
        }
      }

      if (
        name === "description" &&
        (!prev.metaDescription || prev.metaDescription === prev.description)
      ) {
        next.metaDescription = value;
      }

      return next;
    });
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
      if (!data?.secure_url) {
        throw new Error("No secure_url in upload response");
      }

      setFormData((prev) => ({
        ...prev,
        logo: data.secure_url,
      }));
      setSuccess("Logo uploaded successfully.");
    } catch (uploadError) {
      console.error("Logo upload error:", uploadError);
      setError(`Error uploading logo: ${uploadError.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      const data = await uploadToCloudinary(file, "banners");
      if (!data?.secure_url) {
        throw new Error("No secure_url in upload response");
      }

      setFormData((prev) => ({
        ...prev,
        banner: data.secure_url,
      }));
      setSuccess("Brand banner uploaded successfully.");
    } catch (uploadError) {
      console.error("Banner upload error:", uploadError);
      setError(`Error uploading banner: ${uploadError.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Brand name is required.");
      setIsLoading(false);
      return;
    }

    if (!formData.logo) {
      setError("Brand logo is required.");
      setIsLoading(false);
      return;
    }

    try {
      const token = Cookies.get("authToken");
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing
        ? buildUrl(`/api/brands/${editingId}`)
        : buildUrl("/api/brands");

      const payload = {
        name: formData.name.trim(),
        logo: formData.logo,
        website: formData.website.trim(),
        description: formData.description.trim(),
        category: formData.originCountry,
        status: formData.status,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse brand response:", parseError);
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to ${isEditing ? "update" : "create"} brand.`,
        );
      }

      persistBrandExtras(data?.data?.id || editingId, formData);
      await fetchBrands();
      resetFormValues();
      setShowEditor(false);
      setSuccess(
        `Brand ${formData.name.trim()} ${
          isEditing ? "updated" : "created"
        } successfully.`,
      );
    } catch (submitError) {
      console.error("Brand operation error:", submitError);
      setError(
        `Error ${isEditing ? "updating" : "creating"} brand: ${
          submitError.message
        }`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    resetFormValues();
    setShowEditor(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (brand) => {
    setAssignedProducts([]);
    setAssignedProductsError("");
    setAssignedProductsSearch("");
    setAssignedProductsTypeFilter("all");
    setAssignedProductsStatusFilter("all");
    setAssignedProductsPage(1);
    setSelectedAssignedProductIds([]);
    setFormData({
      name: brand.name || "",
      slug: brand.slug || slugifyValue(brand.name),
      marketingName: brand.marketingName || brand.name || "",
      logo: resolveBrandLogo(brand),
      banner: brand.banner || "",
      website: brand.website || "",
      originCountry: brand.originCountry || brand.category || "",
      foundedYear: brand.foundedYear || "",
      description: brand.description || "",
      status: String(brand.status || "active").toLowerCase(),
      featured: Boolean(brand.featured),
      sortOrder: String(brand.sortOrder || "0"),
      metaTitle: brand.metaTitle || buildBrandMetaTitle(brand.name),
      metaDescription: brand.metaDescription || brand.description || "",
    });
    setIsEditing(true);
    setEditingId(brand.id);
    setShowEditor(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditAssignedProduct = (product) => {
    const editPath = getProductEditRoute(product?.productType, product?.id);
    if (!editPath) return;

    navigate(editPath, {
      state: {
        product: product?.raw || null,
        fromBrandEditor: true,
        brandId: editingId || null,
      },
    });
  };

  const toggleAssignedProductSelection = (productId) => {
    if (!productId) return;
    setSelectedAssignedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  useEffect(() => {
    if (!showEditor || !isEditing || !editingId) return;
    fetchAssignedProducts(editingId);
  }, [editingId, isEditing, showEditor]);

  const handleDelete = async (brand) => {
    const deleteApproval = requestDeleteApproval({
      itemName: brand.name,
      itemLabel: "brand",
    });
    if (!deleteApproval) return;
    if (deleteApproval.error) {
      setError(deleteApproval.error);
      return;
    }

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(buildUrl(`/api/brands/${brand.id}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(deleteApproval),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} - ${errorText}`);
      }

      await fetchBrands();
      removeStoredBrandExtras(brand.id);
      setSuccess("Brand deleted successfully.");
      setSelectedBrandIds((prev) => prev.filter((id) => id !== brand.id));
    } catch (deleteError) {
      console.error("Delete brand error:", deleteError);
      setError(`Error deleting brand: ${deleteError.message}`);
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
          category: brand.originCountry || brand.category || "",
          description: brand.description || "",
          website: brand.website || "",
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Status update failed: ${response.status} - ${errorText}`,
        );
      }

      setBrands((prev) =>
        prev.map((item) =>
          item.id === brand.id ? { ...item, status: newStatus } : item,
        ),
      );
      setSuccess(
        `Brand ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
      );
    } catch (statusError) {
      console.error("Status toggle error:", statusError);
      setError(`Failed to update status: ${statusError.message}`);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const normalizedBrands = useMemo(
    () =>
      brands.map((brand) => ({
        ...brand,
        slug: brand.slug || slugifyValue(brand.name),
        marketingName: brand.marketingName || brand.name,
        originCountry: brand.originCountry || brand.category || "",
        foundedYear: brand.foundedYear || "",
        featured: Boolean(brand.featured),
        sortOrder: String(brand.sortOrder || "0"),
        metaTitle: brand.metaTitle || buildBrandMetaTitle(brand.name),
        metaDescription: brand.metaDescription || brand.description || "",
        productCount: Number(
          brand.product_count ?? brand.published_products ?? 0,
        ),
        publishedCount: Number(brand.published_products ?? 0),
        websiteHref: buildWebsiteHref(brand.website),
        websiteLabel: formatWebsiteLabel(brand.website),
      })),
    [brands],
  );

  useEffect(() => {
    setSelectedBrandIds((prev) =>
      prev.filter((id) => normalizedBrands.some((brand) => brand.id === id)),
    );
  }, [normalizedBrands]);

  const categoryOptions = useMemo(() => {
    const values = new Set(BASE_CATEGORY_OPTIONS);
    normalizedBrands.forEach((brand) => {
      if (brand.category) values.add(brand.category);
    });

    return [
      { value: "all", label: "All Categories" },
      ...Array.from(values)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ];
  }, [normalizedBrands]);

  const originCountryOptions = useMemo(() => {
    const values = new Set(ORIGIN_COUNTRY_OPTIONS);
    normalizedBrands.forEach((brand) => {
      if (brand.originCountry) values.add(brand.originCountry);
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [normalizedBrands]);

  const filteredBrands = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const list = normalizedBrands.filter((brand) => {
      const matchesQuery =
        !query ||
        brand.name.toLowerCase().includes(query) ||
        brand.slug.includes(query) ||
        brand.category.toLowerCase().includes(query) ||
        brand.websiteLabel.toLowerCase().includes(query);

      const matchesStatus =
        activeFilter === "all" || brand.status === activeFilter;

      const matchesCategory =
        categoryFilter === "all" || brand.category === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });

    return list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (sortBy === "products") {
        return b.productCount - a.productCount || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [activeFilter, categoryFilter, normalizedBrands, searchTerm, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, categoryFilter, sortBy]);

  useEffect(() => {
    setAssignedProductsPage(1);
  }, [
    assignedProductsSearch,
    assignedProductsTypeFilter,
    assignedProductsStatusFilter,
    editingId,
  ]);

  useEffect(() => {
    const availableIds = new Set(
      assignedProducts
        .map((product) => Number(product?.id))
        .filter((productId) => Number.isInteger(productId) && productId > 0),
    );
    setSelectedAssignedProductIds((prev) =>
      prev.filter((id) => availableIds.has(Number(id))),
    );
  }, [assignedProducts]);

  const totalBrands = normalizedBrands.length;
  const activeBrands = normalizedBrands.filter(
    (brand) => brand.status === "active",
  ).length;
  const inactiveBrands = normalizedBrands.filter(
    (brand) => brand.status === "inactive",
  ).length;
  const publishedBrands = normalizedBrands.filter(
    (brand) => brand.publishedCount > 0,
  ).length;
  const withoutProductsCount = normalizedBrands.filter(
    (brand) => brand.productCount === 0,
  ).length;
  const now = new Date();
  const newThisMonthCount = normalizedBrands.filter((brand) => {
    const createdAt = new Date(brand.created_at);
    return (
      !Number.isNaN(createdAt.getTime()) &&
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    );
  }).length;

  const topBrands = useMemo(
    () =>
      [...normalizedBrands]
        .sort(
          (a, b) =>
            b.productCount - a.productCount || a.name.localeCompare(b.name),
        )
        .slice(0, 5),
    [normalizedBrands],
  );

  const maxTopCount = Math.max(
    ...topBrands.map((brand) => brand.productCount),
    1,
  );
  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * PAGE_SIZE;
  const paginatedBrands = filteredBrands.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const visibleBrandIds = paginatedBrands.map((brand) => brand.id);
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

  const clearFilters = () => {
    setSearchTerm("");
    setActiveFilter("all");
    setCategoryFilter("all");
    setSortBy("name");
  };

  const statCards = [
    {
      label: "Total Brands",
      value: totalBrands,
      helper: "All brands currently available in the platform.",
      icon: FaStore,
      tone: "violet",
    },
    {
      label: "Active Brands",
      value: activeBrands,
      helper: "Visible and ready across publishing flows.",
      icon: FaEye,
      tone: "emerald",
    },
    {
      label: "Published Brands",
      value: publishedBrands,
      helper: "At least one published product is live.",
      icon: FaCheckCircle,
      tone: "blue",
    },
    {
      label: "New This Month",
      value: newThisMonthCount,
      helper: "Brands created during the current month.",
      icon: FaPlus,
      tone: "amber",
    },
    {
      label: "Without Products",
      value: withoutProductsCount,
      helper: "Brands that are not linked to any products yet.",
      icon: FaExclamationCircle,
      tone: "rose",
    },
  ];

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).slice(
    Math.max(0, currentPageSafe - 2),
    Math.max(0, currentPageSafe - 2) + 5,
  );

  const foundedYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1950 + 1 }, (_, index) =>
      String(currentYear - index),
    );
  }, []);

  const assignedProductsPublishedCount = useMemo(
    () => assignedProducts.filter((product) => product.isPublished).length,
    [assignedProducts],
  );

  const assignedProductsTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          assignedProducts
            .map((product) => product.productType)
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [assignedProducts],
  );

  const filteredAssignedProducts = useMemo(() => {
    const query = assignedProductsSearch.trim().toLowerCase();
    return assignedProducts.filter((product) => {
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.model.toLowerCase().includes(query) ||
        product.productTypeLabel.toLowerCase().includes(query);

      const matchesType =
        assignedProductsTypeFilter === "all" ||
        product.productType === assignedProductsTypeFilter;

      const matchesStatus =
        assignedProductsStatusFilter === "all" ||
        (assignedProductsStatusFilter === "published"
          ? product.isPublished
          : !product.isPublished);

      return matchesQuery && matchesType && matchesStatus;
    });
  }, [
    assignedProducts,
    assignedProductsSearch,
    assignedProductsStatusFilter,
    assignedProductsTypeFilter,
  ]);

  const assignedProductsTotalPages = Math.max(
    1,
    Math.ceil(filteredAssignedProducts.length / BRAND_PRODUCT_PAGE_SIZE),
  );
  const assignedProductsPageSafe = Math.min(
    assignedProductsPage,
    assignedProductsTotalPages,
  );
  const assignedProductsStartIndex =
    (assignedProductsPageSafe - 1) * BRAND_PRODUCT_PAGE_SIZE;
  const paginatedAssignedProducts = filteredAssignedProducts.slice(
    assignedProductsStartIndex,
    assignedProductsStartIndex + BRAND_PRODUCT_PAGE_SIZE,
  );
  const visibleAssignedProductIds = paginatedAssignedProducts
    .map((product) => Number(product?.id))
    .filter((productId) => Number.isInteger(productId) && productId > 0);
  const allVisibleAssignedProductsSelected =
    visibleAssignedProductIds.length > 0 &&
    visibleAssignedProductIds.every((productId) =>
      selectedAssignedProductIds.includes(productId),
    );
  const toggleSelectAllVisibleAssignedProducts = () => {
    setSelectedAssignedProductIds((prev) => {
      if (!visibleAssignedProductIds.length) return prev;
      const allSelected = visibleAssignedProductIds.every((productId) =>
        prev.includes(productId),
      );
      if (allSelected) {
        return prev.filter((id) => !visibleAssignedProductIds.includes(id));
      }
      return Array.from(new Set([...prev, ...visibleAssignedProductIds]));
    });
  };

  const editorTitle = isEditing ? "Edit Brand" : "Add New Brand";
  const editorDescription = isEditing
    ? "Update brand information and manage settings."
    : "Create a new brand and add its details.";
  const publicBrandUrl = `${BRAND_PUBLIC_BASE_URL}/${
    formData.slug.trim() || slugifyValue(formData.name)
  }`;
  const editorWebsiteHref = buildWebsiteHref(formData.website);
  const previewLinkHref = formData.website.trim()
    ? editorWebsiteHref
    : publicBrandUrl;

  if (showEditor) {
    return (
      <div className={PAGE_CLASS}>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>Dashboard</span>
          <span>&gt;</span>
          <span>Master Data</span>
          <span>&gt;</span>
          <span>Brands</span>
          <span>&gt;</span>
          <span className="font-medium text-slate-700">{editorTitle}</span>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <FaExclamationCircle className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-rose-400 transition hover:text-rose-600"
            >
              <FaTimes />
            </button>
          </div>
        ) : null}

        {success ? (
          <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <FaCheckCircle className="mt-0.5 shrink-0" />
            <span className="flex-1">{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-emerald-400 transition hover:text-emerald-600"
            >
              <FaTimes />
            </button>
          </div>
        ) : null}

        <section className={CARD_CLASS}>
          <div className={SECTION_HEADER_CLASS}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {editorTitle}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {editorDescription}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeEditor}
                  className={GHOST_BUTTON_CLASS}
                >
                  <FaChevronLeft className="text-sm" />
                  <span>Back to Brands</span>
                </button>

                {isEditing ? (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        previewLinkHref,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className={GHOST_BUTTON_CLASS}
                  >
                    <FaEye className="text-sm" />
                    <span>View Brand</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
            <section className="px-4 py-6 sm:px-5">
              <h2 className="text-lg font-semibold text-slate-950">
                Basic Information
              </h2>
              <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Brand Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter brand name"
                        className={FIELD_CLASS}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Slug <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="Enter brand slug"
                        className={FIELD_CLASS}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        URL:{" "}
                        <span className="text-[#4C35F2]">{publicBrandUrl}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Marketing Name{" "}
                      <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="marketingName"
                      value={formData.marketingName}
                      onChange={handleChange}
                      placeholder="Enter marketing name"
                      className={FIELD_CLASS}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Brand Logo <span className="text-rose-500">*</span>
                    </label>
                    <div className="overflow-hidden rounded-md border border-slate-200">
                      <div className="relative flex min-h-[152px] items-center justify-center bg-white px-4 py-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              setError(
                                "File size too large. Maximum 2MB allowed.",
                              );
                              return;
                            }
                            handleLogoUpload(file);
                            event.target.value = "";
                          }}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        />

                        {formData.logo ? (
                          <img
                            src={formData.logo}
                            alt="Brand logo"
                            className="max-h-24 max-w-full object-contain"
                            onError={(event) => {
                              event.target.onerror = null;
                              event.target.src =
                                "https://via.placeholder.com/160?text=Logo";
                            }}
                          />
                        ) : (
                          <div className="pointer-events-none">
                            {isUploading ? (
                              <FaSpinner className="mx-auto mb-2 animate-spin text-xl text-blue-500" />
                            ) : (
                              <FaUpload className="mx-auto mb-2 text-xl text-slate-400" />
                            )}
                            <p className="text-sm font-medium text-slate-700">
                              {isUploading
                                ? "Uploading logo..."
                                : "Upload logo"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              PNG, JPG or SVG (Max. 2MB)
                            </p>
                          </div>
                        )}
                      </div>
                      {formData.logo ? (
                        <div className="border-t border-slate-200 px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, logo: "" }))
                            }
                            className="text-sm font-semibold text-[#4C35F2]"
                          >
                            Change Logo
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Brand Banner{" "}
                      <span className="text-slate-400">(Optional)</span>
                    </label>
                    <div className="overflow-hidden rounded-md border border-slate-200">
                      <div className="relative flex min-h-[112px] items-center justify-center bg-white px-4 py-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              setError(
                                "Banner size too large. Maximum 5MB allowed.",
                              );
                              return;
                            }
                            handleBannerUpload(file);
                            event.target.value = "";
                          }}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        />

                        {formData.banner ? (
                          <img
                            src={formData.banner}
                            alt="Brand banner"
                            className="max-h-24 w-full object-cover"
                            onError={(event) => {
                              event.target.onerror = null;
                              event.target.src =
                                "https://via.placeholder.com/480x112?text=Banner";
                            }}
                          />
                        ) : (
                          <div className="pointer-events-none">
                            {isUploading ? (
                              <FaSpinner className="mx-auto mb-2 animate-spin text-xl text-blue-500" />
                            ) : (
                              <FaUpload className="mx-auto mb-2 text-xl text-slate-400" />
                            )}
                            <p className="text-sm font-medium text-slate-700">
                              {isUploading
                                ? "Uploading banner..."
                                : "Upload banner"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              PNG, JPG or SVG (Max. 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                      {formData.banner ? (
                        <div className="border-t border-slate-200 px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, banner: "" }))
                            }
                            className="text-sm font-semibold text-[#4C35F2]"
                          >
                            Change Banner
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="px-4 py-6 sm:px-5">
              <h2 className="text-lg font-semibold text-slate-950">
                Additional Details
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Origin Country <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="originCountry"
                    value={formData.originCountry}
                    onChange={handleChange}
                    className={FIELD_CLASS}
                  >
                    <option value="">Select country</option>
                    {originCountryOptions.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Founded Year{" "}
                    <span className="text-slate-400">(Optional)</span>
                  </label>
                  <select
                    name="foundedYear"
                    value={formData.foundedYear}
                    onChange={handleChange}
                    className={FIELD_CLASS}
                  >
                    <option value="">Select year</option>
                    {foundedYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Website <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className={FIELD_CLASS}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Short Description{" "}
                  <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={200}
                  placeholder="Enter short description about the brand..."
                  className={TEXTAREA_CLASS}
                />
                <div className="mt-2 text-right text-xs text-slate-400">
                  {formData.description.length} / 200
                </div>
              </div>
            </section>

            <section className="px-4 py-6 sm:px-5">
              <h2 className="text-lg font-semibold text-slate-950">Settings</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={FIELD_CLASS}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Featured Brand
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        featured: !prev.featured,
                      }))
                    }
                    className="flex h-11 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-left"
                  >
                    <span className="text-sm text-slate-600">
                      Display on homepage featured section
                    </span>
                    <span
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        formData.featured ? "bg-[#4C35F2]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          formData.featured ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </span>
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Sort Order <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    className={FIELD_CLASS}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Lower numbers appear first.
                  </p>
                </div>
              </div>
            </section>

            <section className="px-4 py-6 sm:px-5">
              <h2 className="text-lg font-semibold text-slate-950">
                Meta Information{" "}
                <span className="text-slate-400">(Optional)</span>
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleChange}
                    maxLength={60}
                    placeholder="Enter meta title"
                    className={FIELD_CLASS}
                  />
                  <div className="mt-2 text-right text-xs text-slate-400">
                    {formData.metaTitle.length} / 60
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    rows={3}
                    maxLength={160}
                    placeholder="Enter meta description"
                    className={TEXTAREA_CLASS}
                  />
                  <div className="mt-2 text-right text-xs text-slate-400">
                    {formData.metaDescription.length} / 160
                  </div>
                </div>
              </div>
            </section>

            {isEditing ? (
              <section className="px-4 py-6 sm:px-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Assigned Products
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Review the products already mapped to this brand while you
                      edit its details.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Total Mapped
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {assignedProducts.length}
                      </p>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-600">
                        Published
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-700">
                        {assignedProductsPublishedCount}
                      </p>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50/60 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-600">
                        Draft
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-amber-700">
                        {Math.max(
                          0,
                          assignedProducts.length - assignedProductsPublishedCount,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
                  <div className="relative min-w-0">
                    <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={assignedProductsSearch}
                      onChange={(event) =>
                        setAssignedProductsSearch(event.target.value)
                      }
                      placeholder="Search assigned products..."
                      className={`${FIELD_CLASS} pl-10`}
                    />
                  </div>

                  <select
                    value={assignedProductsTypeFilter}
                    onChange={(event) =>
                      setAssignedProductsTypeFilter(event.target.value)
                    }
                    className={FIELD_CLASS}
                  >
                    <option value="all">All Types</option>
                    {assignedProductsTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {formatProductTypeLabel(type)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={assignedProductsStatusFilter}
                    onChange={(event) =>
                      setAssignedProductsStatusFilter(event.target.value)
                    }
                    className={FIELD_CLASS}
                  >
                    <option value="all">All Publish Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => fetchAssignedProducts(editingId)}
                    disabled={assignedProductsLoading || !editingId}
                    className={GHOST_BUTTON_CLASS}
                  >
                    {assignedProductsLoading ? (
                      <FaSpinner className="animate-spin text-sm" />
                    ) : (
                      <FaUpload className="text-sm" />
                    )}
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>
                    Selected products:{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedAssignedProductIds.length}
                    </span>
                  </span>
                  {selectedAssignedProductIds.length ? (
                    <button
                      type="button"
                      onClick={() => setSelectedAssignedProductIds([])}
                      className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Clear Selection
                    </button>
                  ) : null}
                </div>

                {assignedProductsError ? (
                  <div className="mt-4 flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <FaExclamationCircle className="mt-0.5 shrink-0" />
                    <span className="flex-1">{assignedProductsError}</span>
                  </div>
                ) : null}

                <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="min-w-full text-sm text-slate-700">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">
                            <input
                              type="checkbox"
                              checked={allVisibleAssignedProductsSelected}
                              onChange={toggleSelectAllVisibleAssignedProducts}
                              className="h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                              aria-label="Select all visible assigned products"
                            />
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Model / Series
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Release Year
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Publish
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Added On
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {assignedProductsLoading ? (
                          <tr>
                            <td colSpan="9" className="px-4 py-12 text-center">
                              <FaSpinner className="mx-auto animate-spin text-2xl text-[#4C35F2]" />
                            </td>
                          </tr>
                        ) : paginatedAssignedProducts.length ? (
                          paginatedAssignedProducts.map((product) => {
                            const editPath = getProductEditRoute(
                              product.productType,
                              product.id,
                            );
                            const isSelected =
                              selectedAssignedProductIds.includes(product.id);

                            return (
                            <tr
                              key={product.id}
                              className={
                                isSelected
                                  ? "bg-violet-50/50 hover:bg-violet-50/60"
                                  : "hover:bg-slate-50/70"
                              }
                            >
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleAssignedProductSelection(product.id)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                                  aria-label={`Select ${product.name}`}
                                />
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex min-w-[240px] items-center gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                                    {product.imageUrl ? (
                                      <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                        onError={(event) => {
                                          event.target.onerror = null;
                                          event.target.src =
                                            "https://via.placeholder.com/72?text=Product";
                                        }}
                                      />
                                    ) : (
                                      <span className="text-xs font-semibold uppercase text-slate-500">
                                        {product.name.slice(0, 2)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">
                                      {product.name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Product ID: {product.id || "Not set"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <EditorStatusChip
                                  label={product.productTypeLabel}
                                  tone="info"
                                  className="rounded-md"
                                />
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {product.category}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {product.model}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {product.releaseYear || "Not set"}
                              </td>
                              <td className="px-4 py-4">
                                <EditorStatusChip
                                  label={
                                    product.isPublished ? "Published" : "Draft"
                                  }
                                  tone={
                                    product.isPublished ? "success" : "warning"
                                  }
                                  className="rounded-md"
                                />
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatDate(product.createdAt)}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => handleEditAssignedProduct(product)}
                                  disabled={!editPath}
                                  className={`${
                                    editPath
                                      ? TABLE_ICON_BUTTON_CLASS
                                      : "flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-300 shadow-none"
                                  }`}
                                  title={
                                    editPath
                                      ? "Edit product"
                                      : "Edit route not available for this product type"
                                  }
                                >
                                  <FaEdit />
                                </button>
                              </td>
                            </tr>
                          );
                          })
                        ) : (
                          <tr>
                            <td colSpan="9" className="px-4 py-12 text-center">
                              <div className="mx-auto max-w-md">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white">
                                  <FaStore className="text-xl text-slate-400" />
                                </div>
                                <p className="mt-4 text-base font-semibold text-slate-900">
                                  No assigned products found
                                </p>
                                <p className="mt-2 text-sm text-slate-500">
                                  {assignedProducts.length
                                    ? "Try adjusting the search or filters."
                                    : "Products mapped to this brand will appear here."}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-slate-200 lg:hidden">
                    {assignedProductsLoading ? (
                      <div className="px-4 py-10 text-center">
                        <FaSpinner className="mx-auto animate-spin text-2xl text-[#4C35F2]" />
                      </div>
                    ) : paginatedAssignedProducts.length ? (
                      paginatedAssignedProducts.map((product) => {
                        const editPath = getProductEditRoute(
                          product.productType,
                          product.id,
                        );
                        const isSelected =
                          selectedAssignedProductIds.includes(product.id);

                        return (
                        <article
                          key={`mobile-product-${product.id}`}
                          className={`space-y-3 px-4 py-4 ${
                            isSelected ? "bg-violet-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleAssignedProductSelection(product.id)
                              }
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                              aria-label={`Select ${product.name}`}
                            />
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(event) => {
                                    event.target.onerror = null;
                                    event.target.src =
                                      "https://via.placeholder.com/72?text=Product";
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-semibold uppercase text-slate-500">
                                  {product.name.slice(0, 2)}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-base font-semibold text-slate-900">
                                {product.name}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                Product ID: {product.id || "Not set"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <EditorStatusChip
                              label={product.productTypeLabel}
                              tone="info"
                              className="rounded-md"
                            />
                            <EditorStatusChip
                              label={product.isPublished ? "Published" : "Draft"}
                              tone={product.isPublished ? "success" : "warning"}
                              className="rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => handleEditAssignedProduct(product)}
                              disabled={!editPath}
                              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                                editPath
                                  ? "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                  : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                              }`}
                            >
                              <FaEdit className="text-xs" />
                              <span>Edit</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                                Category
                              </p>
                              <p className="mt-1 text-slate-700">
                                {product.category}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                                Release Year
                              </p>
                              <p className="mt-1 text-slate-700">
                                {product.releaseYear || "Not set"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                                Model / Series
                              </p>
                              <p className="mt-1 text-slate-700">
                                {product.model}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                                Added On
                              </p>
                              <p className="mt-1 text-slate-700">
                                {formatDate(product.createdAt)}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                      })
                    ) : (
                      <div className="px-4 py-10 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white">
                          <FaStore className="text-xl text-slate-400" />
                        </div>
                        <p className="mt-4 text-base font-semibold text-slate-900">
                          No assigned products found
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {assignedProducts.length
                            ? "Try adjusting the search or filters."
                            : "Products mapped to this brand will appear here."}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-900">
                        {filteredAssignedProducts.length
                          ? assignedProductsStartIndex + 1
                          : 0}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-900">
                        {Math.min(
                          assignedProductsStartIndex + BRAND_PRODUCT_PAGE_SIZE,
                          filteredAssignedProducts.length,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-900">
                        {filteredAssignedProducts.length}
                      </span>{" "}
                      mapped products
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="hidden h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 sm:flex">
                        {BRAND_PRODUCT_PAGE_SIZE} per page
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAssignedProductsPage((prev) =>
                            Math.max(prev - 1, 1),
                          )
                        }
                        disabled={assignedProductsPageSafe === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaChevronLeft />
                      </button>
                      <div className="flex h-10 min-w-[96px] items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                        Page {assignedProductsPageSafe} /{" "}
                        {assignedProductsTotalPages}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAssignedProductsPage((prev) =>
                            Math.min(prev + 1, assignedProductsTotalPages),
                          )
                        }
                        disabled={
                          assignedProductsPageSafe === assignedProductsTotalPages
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <button
                type="button"
                onClick={closeEditor}
                className={GHOST_BUTTON_CLASS}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isLoading || isUploading || !formData.name || !formData.logo
                }
                className={PRIMARY_BUTTON_CLASS}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin text-sm" />
                ) : isEditing ? (
                  <FaSave className="text-sm" />
                ) : (
                  <FaPlus className="text-sm" />
                )}
                <span>{isEditing ? "Save Changes" : "Create Brand"}</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className={PAGE_CLASS}>
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Brands
              </h1>
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-600 shadow-none">
                <FaStore className="text-base" />
              </div>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Manage all brands available on your platform, update their
              details, and control visibility in editor flows.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={fetchBrands}
              disabled={isLoading}
              className={GHOST_BUTTON_CLASS}
            >
              {isLoading ? (
                <FaSpinner className="animate-spin text-sm" />
              ) : (
                <FaUpload className="text-sm" />
              )}
              <span>Refresh Brands</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className={PRIMARY_BUTTON_CLASS}
            >
              <FaPlus className="text-sm" />
              <span>Add New Brand</span>
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-none">
          <FaExclamationCircle className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-rose-400 transition hover:text-rose-600"
          >
            <FaTimes />
          </button>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-none">
          <FaCheckCircle className="mt-0.5 shrink-0" />
          <span className="flex-1">{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-emerald-400 transition hover:text-emerald-600"
          >
            <FaTimes />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <section className={CARD_CLASS}>
            <div className="border-b border-slate-200 px-2 py-3 sm:px-3 lg:px-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative min-w-0 flex-1">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search brands by name, slug, category, or website..."
                    className={`${FIELD_CLASS} pl-10`}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_210px_180px_auto]">
                  <select
                    value={activeFilter}
                    onChange={(event) => setActiveFilter(event.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className={FIELD_CLASS}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="name">Name A-Z</option>
                    <option value="products">Most Products</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>

                  <div className="flex gap-2">
                    <div className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-[#4C35F2] shadow-none">
                      <FaFilter className="text-sm" />
                      <span>Filters</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className={GHOST_BUTTON_CLASS}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="bg-white text-xs uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                        aria-label="Select all visible brands"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Brand</th>
                    <th className="px-4 py-3 text-left font-semibold">Slug</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Products
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Website
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Sort Order
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center">
                        <FaSpinner className="mx-auto animate-spin text-2xl text-[#4C35F2]" />
                      </td>
                    </tr>
                  ) : paginatedBrands.length ? (
                    paginatedBrands.map((brand, index) => {
                      const isActive = brand.status === "active";
                      const isSelected = selectedBrandIds.includes(brand.id);

                      return (
                        <tr
                          key={brand.id}
                          className={
                            isSelected
                              ? "bg-violet-50/50"
                              : "hover:bg-slate-50/70"
                          }
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectBrand(brand.id)}
                              className="h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                              aria-label={`Select ${brand.name}`}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex min-w-[220px] items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-none">
                                {brand.logo ? (
                                  <img
                                    src={brand.logo}
                                    alt={brand.name}
                                    className="h-full w-full object-contain p-2"
                                    onError={(event) => {
                                      event.target.onerror = null;
                                      event.target.src =
                                        "https://via.placeholder.com/64?text=Logo";
                                    }}
                                  />
                                ) : (
                                  <span className="text-sm font-semibold uppercase text-slate-500">
                                    {brand.name.slice(0, 1)}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {brand.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Created {formatDate(brand.created_at)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-500">
                            {brand.slug}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {brand.category || "Unassigned"}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-semibold text-[#4C35F2]">
                            <CountUp end={brand.productCount} duration={0.5} />
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => toggleStatus(brand)}
                              disabled={statusUpdatingId === brand.id}
                              className={`inline-flex min-w-[94px] items-center justify-center rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                                isActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-rose-200 bg-rose-50 text-rose-700"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {statusUpdatingId === brand.id ? (
                                <FaSpinner className="animate-spin text-[11px]" />
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
                          <td className="px-4 py-4">
                            {brand.websiteHref ? (
                              <a
                                href={brand.websiteHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-slate-600 transition hover:text-[#4C35F2]"
                              >
                                <FaGlobe className="text-sm" />
                                <span>{brand.websiteLabel}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">Not set</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className={ORDER_BADGE_CLASS}>
                              {startIndex + index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(brand)}
                                className={TABLE_ICON_BUTTON_CLASS}
                                title="Edit brand"
                              >
                                <FaEdit />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(brand)}
                                disabled={brand.productCount > 0}
                                className={`${
                                  brand.productCount > 0
                                    ? "flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-300 shadow-none"
                                    : TABLE_DANGER_BUTTON_CLASS
                                }`}
                                title={
                                  brand.productCount > 0
                                    ? "Cannot delete a brand with products"
                                    : "Delete brand"
                                }
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-none">
                            <FaStore className="text-2xl text-slate-400" />
                          </div>
                          <p className="mt-4 text-base font-semibold text-slate-900">
                            No brands found
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Try adjusting your filters or add a new brand.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 lg:hidden">
              {isLoading ? (
                <div className="px-2 py-10 text-center sm:px-3">
                  <FaSpinner className="mx-auto animate-spin text-2xl text-[#4C35F2]" />
                </div>
              ) : paginatedBrands.length ? (
                paginatedBrands.map((brand, index) => {
                  const isActive = brand.status === "active";
                  const isSelected = selectedBrandIds.includes(brand.id);

                  return (
                    <article
                      key={`mobile-${brand.id}`}
                      className={`space-y-3 px-2 py-4 sm:px-3 ${
                        isSelected ? "bg-violet-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectBrand(brand.id)}
                            className="mt-2 h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                            aria-label={`Select ${brand.name}`}
                          />

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-none">
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="h-full w-full object-contain p-2"
                                onError={(event) => {
                                  event.target.onerror = null;
                                  event.target.src =
                                    "https://via.placeholder.com/64?text=Logo";
                                }}
                              />
                            ) : (
                              <span className="text-sm font-semibold uppercase text-slate-500">
                                {brand.name.slice(0, 1)}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                              {brand.name}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {brand.slug}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStatus(brand)}
                          disabled={statusUpdatingId === brand.id}
                          className={`inline-flex min-w-[84px] items-center justify-center rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                            isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {statusUpdatingId === brand.id ? (
                            <FaSpinner className="animate-spin text-[11px]" />
                          ) : isActive ? (
                            "Active"
                          ) : (
                            "Inactive"
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                            Category
                          </p>
                          <p className="mt-1 text-slate-700">
                            {brand.category || "Unassigned"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                            Products
                          </p>
                          <p className="mt-1 font-semibold text-[#4C35F2]">
                            {brand.productCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                            Website
                          </p>
                          <p className="mt-1 text-slate-700">
                            {brand.websiteLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                            Sort Order
                          </p>
                          <p className="mt-1 text-slate-700">
                            {startIndex + index + 1}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(brand)}
                          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(brand)}
                          disabled={brand.productCount > 0}
                          className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                            brand.productCount > 0
                              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                              : "border-slate-200 bg-white text-slate-700 shadow-none hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="px-2 py-10 text-center sm:px-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-none">
                    <FaStore className="text-2xl text-slate-400" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900">
                    No brands found
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Try adjusting your filters or add a new brand.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-2 py-3 sm:px-3 lg:px-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredBrands.length ? startIndex + 1 : 0}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-900">
                    {Math.min(startIndex + PAGE_SIZE, filteredBrands.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredBrands.length}
                  </span>{" "}
                  results
                </p>

                <div className="flex items-center gap-2">
                  <div className="hidden h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-none sm:flex">
                    {PAGE_SIZE} per page
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPageSafe === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-none transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaChevronLeft />
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold shadow-none transition ${
                        currentPageSafe === page
                          ? "border-[#4C35F2] bg-[#4C35F2] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPageSafe === totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-none transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className={CARD_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <h2 className="text-lg font-semibold text-slate-950">
                Brand Overview
              </h2>
            </div>
            <div className="px-3 py-4 sm:px-4">
              <BrandOverviewRing
                activeCount={activeBrands}
                inactiveCount={inactiveBrands}
                total={totalBrands}
              />
            </div>
          </section>

          <section className={CARD_CLASS}>
            <div
              className={`${SECTION_HEADER_CLASS} flex items-center justify-between`}
            >
              <h2 className="text-lg font-semibold text-slate-950">
                Top Brands by Products
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSortBy("products");
                  setCurrentPage(1);
                }}
                className="text-sm font-semibold text-[#4C35F2] transition hover:text-[#3d2bd0]"
              >
                View All
              </button>
            </div>
            <div className="space-y-4 px-3 py-4 sm:px-4">
              {topBrands.length ? (
                topBrands.map((brand, index) => (
                  <div
                    key={`top-${brand.id}`}
                    className="grid grid-cols-[18px_minmax(0,1fr)_54px] items-center gap-3"
                  >
                    <span className="text-sm font-medium text-slate-500">
                      {index + 1}.
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {brand.name}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-[#4C35F2] to-[#7C5CFF]"
                          style={{
                            width: `${Math.max(
                              20,
                              (brand.productCount / maxTopCount) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-right text-sm font-semibold text-slate-700">
                      {brand.productCount}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No product-linked brands are available yet.
                </p>
              )}
            </div>
          </section>

          <section className={CARD_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <h2 className="text-lg font-semibold text-slate-950">
                Quick Actions
              </h2>
            </div>
            <div className="space-y-2 px-3 py-4 sm:px-4">
              <button
                type="button"
                onClick={handleCreateNew}
                className={`${GHOST_BUTTON_CLASS} w-full justify-start`}
              >
                <FaPlus className="text-sm text-[#4C35F2]" />
                <span>Add New Brand</span>
              </button>

              <button
                type="button"
                onClick={fetchBrands}
                className={`${GHOST_BUTTON_CLASS} w-full justify-start`}
              >
                <FaUpload className="text-sm text-[#4C35F2]" />
                <span>Refresh Brand List</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveFilter("active");
                  setCurrentPage(1);
                }}
                className={`${GHOST_BUTTON_CLASS} w-full justify-start`}
              >
                <FaEye className="text-sm text-[#4C35F2]" />
                <span>Show Active Brands</span>
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className={`${GHOST_BUTTON_CLASS} w-full justify-start`}
              >
                <FaSearch className="text-sm text-[#4C35F2]" />
                <span>Clear Filters</span>
              </button>
            </div>
          </section>

          <section className={CARD_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <h2 className="text-lg font-semibold text-slate-950">
                Need Help?
              </h2>
            </div>
            <div className="space-y-3 px-3 py-4 text-sm text-slate-500 sm:px-4">
              <p>
                Brands created here feed the selection lists used across create
                and edit product flows in the admin app.
              </p>
              <p>
                Selected brands:{" "}
                <span className="font-semibold text-slate-700">
                  {selectedBrandIds.length}
                </span>
              </p>
              <p>
                Last refreshed:{" "}
                <span className="font-semibold text-slate-700">
                  {formatDate(new Date())}
                </span>
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Brand;
