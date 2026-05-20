import React, { useEffect, useMemo, useRef, useState } from "react";
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
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";
import {
  EditorStatusChip,
  editorFieldClassName,
  editorGhostButtonClassName,
  editorPrimaryButtonClassName,
} from "./MobileEditorUi";

const CARD_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-transparent shadow-none";
const PANEL_HEADER_CLASS = "border-b border-slate-200 px-3 py-4 sm:px-4";
const pageFieldClassName = `${editorFieldClassName} rounded-md border-slate-200 bg-transparent shadow-none`;
const pageGhostButtonClassName = `${editorGhostButtonClassName} rounded-md border-slate-200 bg-transparent px-4 shadow-none`;
const pagePrimaryButtonClassName = `${editorPrimaryButtonClassName} rounded-md px-4 shadow-none`;
const editorCardClassName =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_20px_45px_-38px_rgba(15,23,42,0.35)]";
const editorHeaderClassName =
  "border-b border-slate-200 bg-slate-50/70 px-3 py-4 sm:px-4";
const editorFieldClassNameLocal =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4C35F2] focus:ring-0";
const editorTextareaClassNameLocal =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4C35F2] focus:ring-0";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const STORE_EDITOR_URL_PREFIX = "https://www.hooks.in/stores/";
const STORE_TYPE_OPTIONS = [
  "Marketplace",
  "Retailer",
  "Brand Store",
  "Official Store",
  "Reseller",
];
const PRODUCT_CATEGORY_OPTIONS = [
  "All Categories",
  "Smartphones",
  "Laptops",
  "Home Appliances",
  "Tablets",
  "Wearables",
  "Audio",
];
const PAYMENT_METHOD_OPTIONS = [
  "Visa",
  "Mastercard",
  "American Express",
  "UPI",
  "PayPal",
  "Net Banking",
  "Cash on Delivery",
];
const COUNTRY_OPTIONS = [
  "United States",
  "India",
  "United Kingdom",
  "Canada",
  "Germany",
  "Australia",
  "France",
  "Japan",
];
const COUNTRY_STATE_MAP = {
  "United States": [
    "California",
    "Florida",
    "New York",
    "Texas",
    "Washington",
  ],
  India: ["Delhi", "Karnataka", "Maharashtra", "Tamil Nadu", "Telangana"],
  "United Kingdom": ["England", "Scotland", "Wales"],
  Canada: ["Alberta", "British Columbia", "Ontario", "Quebec"],
  Germany: ["Bavaria", "Berlin", "Hamburg", "Hesse"],
  Australia: ["New South Wales", "Queensland", "Victoria", "Western Australia"],
  France: ["Ile-de-France", "Nouvelle-Aquitaine", "Occitanie"],
  Japan: ["Aichi", "Osaka", "Tokyo"],
};
const COUNTRY_PHONE_CODES = {
  "United States": "+1",
  India: "+91",
  "United Kingdom": "+44",
  Canada: "+1",
  Germany: "+49",
  Australia: "+61",
  France: "+33",
  Japan: "+81",
};

const createEmptyFormData = () => ({
  name: "",
  slug: "",
  logo: "",
  banner: "",
  website: "",
  short_description: "",
  type: "",
  status: "active",
  owner_name: "",
  owner_email: "",
  owner_phone_code: "+1",
  owner_phone: "",
  country: "",
  state: "",
  city: "",
  address: "",
  postal_code: "",
  established_year: "",
  products_sold: "All Categories",
  payment_methods: [],
  shipping_available: true,
  verified: true,
});

const resolveText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
};

const slugifyValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const resolveLogo = (store) =>
  normalizeAssetUrl(
    resolveText(store?.logo, store?.image, store?.logo_url, store?.image_url),
  );

const resolveBanner = (store) =>
  normalizeAssetUrl(
    resolveText(
      store?.banner,
      store?.banner_url,
      store?.cover_image,
      store?.hero_image,
      store?.header_image,
    ),
  );

const resolveProductCount = (store) => {
  const raw =
    store?.products_count ??
    store?.product_count ??
    store?.products ??
    store?.linked_products ??
    store?.total_products ??
    0;

  if (Array.isArray(raw)) return raw.length;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
};

const resolveVerification = (store) => {
  if (typeof store?.verified === "boolean") return store.verified;
  if (typeof store?.is_verified === "boolean") return store.is_verified;
  if (typeof store?.verification_status === "string") {
    return store.verification_status.toLowerCase() === "verified";
  }
  return String(store?.status || "").toLowerCase() === "active";
};

const resolveOwner = (store) =>
  resolveText(
    store?.owner,
    store?.owner_name,
    store?.company,
    store?.company_name,
    store?.business_name,
    "Not set",
  );

const resolveCountry = (store) =>
  resolveText(
    store?.country,
    store?.country_name,
    store?.region,
    store?.location,
    "Not set",
  );

const resolveStoreType = (store) =>
  resolveText(store?.type, store?.store_type, store?.category, "Online Store");

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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => resolveText(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const resolveWebsite = (store) =>
  resolveText(store?.website, store?.store_url, store?.url, store?.site_url);

const resolveShortDescription = (store) =>
  resolveText(store?.short_description, store?.description, store?.about);

const resolveOwnerEmail = (store) =>
  resolveText(store?.owner_email, store?.email, store?.contact_email);

const resolveOwnerPhone = (store) =>
  resolveText(store?.owner_phone, store?.phone, store?.contact_phone);

const resolveOwnerPhoneCode = (store) =>
  resolveText(store?.owner_phone_code, store?.phone_code, store?.dial_code, "+1");

const resolveState = (store) =>
  resolveText(store?.state, store?.state_name, store?.province);

const resolveCity = (store) => resolveText(store?.city);

const resolveAddress = (store) =>
  resolveText(store?.address, store?.full_address, store?.street_address);

const resolvePostalCode = (store) =>
  resolveText(store?.postal_code, store?.zip_code, store?.zip);

const resolveEstablishedYear = (store) =>
  resolveText(store?.established_year, store?.founded_year, store?.launch_year);

const resolvePrimaryCategory = (store) =>
  resolveText(
    store?.products_sold,
    Array.isArray(store?.categories) ? store.categories[0] : "",
    store?.product_category,
    "All Categories",
  );

const resolvePaymentMethods = (store) =>
  normalizeStringArray(
    store?.payment_methods ?? store?.paymentMethods ?? store?.payment_options,
  );

const resolveShippingAvailability = (store) => {
  if (typeof store?.shipping_available === "boolean") {
    return store.shipping_available;
  }
  if (typeof store?.shippingAvailable === "boolean") {
    return store.shippingAvailable;
  }
  if (typeof store?.shipping_available === "string") {
    return store.shipping_available.toLowerCase() !== "no";
  }
  return true;
};

const resolveUpdatedBy = (store) =>
  resolveText(
    store?.updated_by,
    store?.updatedBy,
    store?.created_by,
    store?.createdBy,
    "Admin",
  );

const getCountryFlag = (country) => {
  const lookup = {
    "united states": "US",
    usa: "US",
    us: "US",
    india: "IN",
    uk: "GB",
    "united kingdom": "GB",
    canada: "CA",
    germany: "DE",
    australia: "AU",
    france: "FR",
    japan: "JP",
  };

  const normalized = String(country || "").trim().toLowerCase();
  const code = lookup[normalized] || normalized.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";

  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0)),
  );
};

function StoresOverviewRing({ active, inactive, unverified }) {
  const total = active + inactive + unverified || 1;
  const activeDeg = (active / total) * 360;
  const inactiveDeg = ((active + inactive) / total) * 360;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-28 w-28 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#57B86A 0deg ${activeDeg}deg, #FF7A8B ${activeDeg}deg ${inactiveDeg}deg, #7CA3FF ${inactiveDeg}deg 360deg)`,
        }}
      >
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-3xl font-semibold text-slate-950">
            {active + inactive}
          </span>
          <span className="text-xs font-medium text-slate-500">Total</span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#57B86A]" />
            <span className="text-slate-600">Active</span>
          </div>
          <span className="font-semibold text-slate-900">
            {active} ({((active / total) * 100).toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#FF7A8B]" />
            <span className="text-slate-600">Inactive</span>
          </div>
          <span className="font-semibold text-slate-900">
            {inactive} ({((inactive / total) * 100).toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#7CA3FF]" />
            <span className="text-slate-600">Unverified</span>
          </div>
          <span className="font-semibold text-slate-900">
            {unverified} ({((unverified / total) * 100).toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper, icon: Icon, toneClass }) {
  return (
    <div className={`${CARD_CLASS} px-4 py-4 sm:px-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-md border ${toneClass}`}
        >
          <Icon className="text-lg" />
        </div>
      </div>
    </div>
  );
}

const OnlineStoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(createEmptyFormData());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [assetPreviews, setAssetPreviews] = useState({ logo: "", banner: "" });
  const [uploadingField, setUploadingField] = useState("");
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const itemsPerPage = 10;

  const showToast = (title, message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const fetchStores = async (silent = false) => {
    setLoading(true);
    setError("");

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(buildUrl("/api/online-stores"), {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      let rows = [];
      if (Array.isArray(data)) rows = data;
      else if (data && Array.isArray(data.stores)) rows = data.stores;
      else if (data && Array.isArray(data.data)) rows = data.data;
      else rows = data || [];

      setStores(rows);
      if (!rows.length) setShowForm(true);
      if (!silent) {
        showToast("Refreshed", "Store list updated successfully.", "success");
      }
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      setError(err.message || "Failed to load stores");
      showToast("Error", "Failed to load stores.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, countryFilter, typeFilter]);

  const normalizedStores = useMemo(
    () =>
      stores.map((store) => ({
        ...store,
        status:
          String(store?.status || "").toLowerCase() === "inactive"
            ? "inactive"
            : "active",
        displayName: resolveText(store?.name, "Untitled Store"),
        slug: resolveText(store?.slug, slugifyValue(store?.name)),
        ownerLabel: resolveOwner(store),
        ownerEmail: resolveOwnerEmail(store),
        ownerPhone: resolveOwnerPhone(store),
        ownerPhoneCode: resolveOwnerPhoneCode(store),
        countryLabel: resolveCountry(store),
        countryFlag: getCountryFlag(resolveCountry(store)),
        stateLabel: resolveState(store),
        cityLabel: resolveCity(store),
        addressLabel: resolveAddress(store),
        postalCodeLabel: resolvePostalCode(store),
        typeLabel: resolveStoreType(store),
        website: resolveWebsite(store),
        websiteHref: buildWebsiteHref(resolveWebsite(store)),
        websiteLabel: formatWebsiteLabel(resolveWebsite(store)),
        logoUrl: resolveLogo(store),
        bannerUrl: resolveBanner(store),
        shortDescription: resolveShortDescription(store),
        establishedYear: resolveEstablishedYear(store),
        primaryCategory: resolvePrimaryCategory(store),
        paymentMethods: resolvePaymentMethods(store),
        shippingAvailable: resolveShippingAvailability(store),
        productsCount: resolveProductCount(store),
        verified: resolveVerification(store),
        createdLabel: formatDate(store?.created_at || store?.createdAt),
        createdDetailedLabel: formatDateTime(
          store?.created_at || store?.createdAt,
        ),
        updatedDetailedLabel: formatDateTime(
          store?.updated_at ||
            store?.updatedAt ||
            store?.created_at ||
            store?.createdAt,
        ),
        updatedByLabel: resolveUpdatedBy(store),
      })),
    [stores],
  );

  const uniqueCountries = useMemo(
    () =>
      Array.from(
        new Set(
          normalizedStores
            .map((store) => store.countryLabel)
            .filter((value) => value && value !== "Not set"),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [normalizedStores],
  );

  const uniqueTypes = useMemo(
    () =>
      Array.from(
        new Set(
          normalizedStores
            .map((store) => store.typeLabel)
            .filter((value) => value && value !== "Online Store"),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [normalizedStores],
  );

  const editingStore = useMemo(
    () => normalizedStores.find((store) => store.id === editingId) || null,
    [normalizedStores, editingId],
  );

  const availableStoreTypes = useMemo(
    () =>
      Array.from(
        new Set([...STORE_TYPE_OPTIONS, ...uniqueTypes, formData.type].filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [formData.type, uniqueTypes],
  );

  const availableCountries = useMemo(
    () =>
      Array.from(
        new Set(
          [...COUNTRY_OPTIONS, ...uniqueCountries, formData.country].filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [formData.country, uniqueCountries],
  );

  const stateOptions = useMemo(() => {
    if (COUNTRY_STATE_MAP[formData.country]?.length) {
      return COUNTRY_STATE_MAP[formData.country];
    }
    return formData.state ? [formData.state] : [];
  }, [formData.country, formData.state]);

  const availableProductCategories = useMemo(
    () =>
      Array.from(
        new Set([...PRODUCT_CATEGORY_OPTIONS, formData.products_sold].filter(Boolean)),
      ),
    [formData.products_sold],
  );

  const availablePaymentMethods = useMemo(
    () =>
      Array.from(
        new Set([...PAYMENT_METHOD_OPTIONS, ...formData.payment_methods].filter(Boolean)),
      ),
    [formData.payment_methods],
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 36 }, (_, index) =>
      String(currentYear - index),
    );
    if (formData.established_year) {
      years.unshift(String(formData.established_year));
    }
    return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
  }, [formData.established_year]);

  const previewSlug = formData.slug.trim() || slugifyValue(formData.name);
  const previewStoreUrl = `${STORE_EDITOR_URL_PREFIX}${
    previewSlug || "enter-store-slug"
  }`;
  const previewWebsiteHref = buildWebsiteHref(formData.website);
  const previewWebsiteLabel = formatWebsiteLabel(formData.website);
  const previewStatusTone = formData.status === "active" ? "success" : "danger";
  const previewDescription =
    formData.short_description.trim() ||
    "Short description will appear here for this store.";
  const logoPreviewUrl = assetPreviews.logo || formData.logo;
  const bannerPreviewUrl = assetPreviews.banner || formData.banner;
  const isUploadingLogo = uploadingField === "logo";
  const isUploadingBanner = uploadingField === "banner";
  const editorTitle = editingId ? "Edit Store" : "Add New Store";
  const editorDescription = editingId
    ? "Update store information and manage settings."
    : "Create a new store and add its details.";

  const recentActivity = useMemo(() => {
    if (!editingStore) return [];

    const activity = [
      {
        title: "Store updated",
        detail: editingStore.updatedDetailedLabel,
        helper: `by ${editingStore.updatedByLabel}`,
        tone: "emerald",
      },
      editingStore.bannerUrl
        ? {
            title: "Banner updated",
            detail: editingStore.updatedDetailedLabel,
            helper: `by ${editingStore.updatedByLabel}`,
            tone: "blue",
          }
        : null,
      {
        title: "Store created",
        detail: editingStore.createdDetailedLabel,
        helper: `by ${editingStore.updatedByLabel}`,
        tone: "violet",
      },
    ];

    return activity.filter(Boolean);
  }, [editingStore]);

  const filteredStores = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return normalizedStores
      .filter((store) => {
        if (statusFilter !== "all" && store.status !== statusFilter) {
          return false;
        }
        if (countryFilter !== "all" && store.countryLabel !== countryFilter) {
          return false;
        }
        if (typeFilter !== "all" && store.typeLabel !== typeFilter) {
          return false;
        }
        if (!query) return true;

        return (
          store.displayName.toLowerCase().includes(query) ||
          store.slug.toLowerCase().includes(query) ||
          store.ownerLabel.toLowerCase().includes(query)
        );
      })
      .sort(
        (a, b) =>
          b.productsCount - a.productsCount ||
          new Date(b.created_at || 0) - new Date(a.created_at || 0) ||
          a.displayName.localeCompare(b.displayName),
      );
  }, [normalizedStores, searchTerm, statusFilter, countryFilter, typeFilter]);

  const totalStores = normalizedStores.length;
  const activeStores = normalizedStores.filter(
    (store) => store.status === "active",
  ).length;
  const inactiveStores = normalizedStores.filter(
    (store) => store.status === "inactive",
  ).length;
  const verifiedStores = normalizedStores.filter((store) => store.verified).length;
  const unverifiedStores = totalStores - verifiedStores;
  const topStores = filteredStores.slice(0, 5);
  const maxProducts = Math.max(...filteredStores.map((store) => store.productsCount), 1);

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / itemsPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * itemsPerPage;
  const paginatedStores = filteredStores.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const paginatedStoreIds = paginatedStores.map((store) => store.id);
  const allPageItemsSelected =
    paginatedStoreIds.length > 0 &&
    paginatedStoreIds.every((id) => selectedStoreIds.includes(id));

  const toggleStoreSelection = (id) => {
    setSelectedStoreIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllOnPage = () => {
    setSelectedStoreIds((prev) => {
      if (allPageItemsSelected) {
        return prev.filter((id) => !paginatedStoreIds.includes(id));
      }

      const next = new Set(prev);
      paginatedStoreIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const resetForm = () => {
    setFormData(createEmptyFormData());
    setAssetPreviews({ logo: "", banner: "" });
    setEditingId(null);
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "name") {
        const prevAutoSlug = !prev.slug || prev.slug === slugifyValue(prev.name);
        if (prevAutoSlug) {
          next.slug = slugifyValue(value);
        }
      }

      if (name === "short_description") {
        next.short_description = value.slice(0, 200);
      }

      if (name === "country") {
        const previousCountryCode = COUNTRY_PHONE_CODES[prev.country];
        if (
          !prev.owner_phone_code ||
          prev.owner_phone_code === previousCountryCode
        ) {
          next.owner_phone_code =
            COUNTRY_PHONE_CODES[value] || prev.owner_phone_code || "+1";
        }

        if (
          next.state &&
          COUNTRY_STATE_MAP[value]?.length &&
          !COUNTRY_STATE_MAP[value].includes(next.state)
        ) {
          next.state = "";
        }
      }

      return next;
    });
  };

  const togglePaymentMethod = (method) => {
    setFormData((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter((item) => item !== method)
        : [...prev.payment_methods, method],
    }));
  };

  const handleAssetUpload = (field) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        "Please upload a valid image (JPEG, PNG, SVG, WebP).",
        "error",
      );
      event.target.value = "";
      return;
    }

    const sizeLimitMb = field === "banner" ? 5 : 2;
    if (file.size > sizeLimitMb * 1024 * 1024) {
      showToast(
        "Error",
        `Image size should be less than ${sizeLimitMb}MB.`,
        "error",
      );
      event.target.value = "";
      return;
    }

    setUploadingField(field);

    try {
      const reader = new FileReader();
      reader.onloadend = () =>
        setAssetPreviews((prev) => ({ ...prev, [field]: reader.result }));
      reader.readAsDataURL(file);

      const data = await uploadToCloudinary(
        file,
        field === "banner" ? "banners" : "brands",
      );
      if (!data?.secure_url) {
        throw new Error("No secure_url returned from upload");
      }

      setFormData((prev) => ({
        ...prev,
        [field]: data.secure_url,
      }));
      setAssetPreviews((prev) => ({ ...prev, [field]: data.secure_url }));
      showToast(
        "Uploaded",
        field === "banner"
          ? "Store banner uploaded successfully."
          : "Store logo uploaded successfully.",
        "success",
      );
    } catch (err) {
      console.error("Image upload error:", err);
      showToast("Error", "Failed to upload image.", "error");
    } finally {
      setUploadingField("");
      event.target.value = "";
    }
  };

  const triggerAssetInput = (field) => {
    if (field === "banner") {
      bannerInputRef.current?.click();
      return;
    }
    logoInputRef.current?.click();
  };

  const clearAsset = (field) => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
    setAssetPreviews((prev) => ({ ...prev, [field]: "" }));
  };

  const handleEdit = (store) => {
    setFormData({
      name: store.displayName || "",
      slug: store.slug || slugifyValue(store.displayName),
      logo: store.logoUrl || "",
      banner: store.bannerUrl || "",
      website: store.website || "",
      short_description: store.shortDescription || "",
      type: store.typeLabel === "Online Store" ? "" : store.typeLabel,
      status: store.status || "active",
      owner_name: store.ownerLabel === "Not set" ? "" : store.ownerLabel,
      owner_email: store.ownerEmail || "",
      owner_phone_code: store.ownerPhoneCode || "+1",
      owner_phone: store.ownerPhone || "",
      country: store.countryLabel === "Not set" ? "" : store.countryLabel,
      state: store.stateLabel || "",
      city: store.cityLabel || "",
      address: store.addressLabel || "",
      postal_code: store.postalCodeLabel || "",
      established_year: store.establishedYear || "",
      products_sold: store.primaryCategory || "All Categories",
      payment_methods: store.paymentMethods || [],
      shipping_available: store.shippingAvailable,
      verified: store.verified,
    });
    setAssetPreviews({
      logo: store.logoUrl || "",
      banner: store.bannerUrl || "",
    });
    setEditingId(store.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    const trimmedName = formData.name.trim();
    const finalSlug = previewSlug.trim();
    const trimmedWebsite = formData.website.trim();
    const trimmedEmail = formData.owner_email.trim();
    const trimmedType = formData.type.trim();

    if (!trimmedName) {
      showToast("Validation", "Store name is required.", "error");
      return;
    }

    if (!finalSlug) {
      showToast("Validation", "Store slug is required.", "error");
      return;
    }

    if (!formData.logo.trim()) {
      showToast("Validation", "Store logo is required.", "error");
      return;
    }

    if (!trimmedType) {
      showToast("Validation", "Store type is required.", "error");
      return;
    }

    if (!trimmedWebsite) {
      showToast("Validation", "Website URL is required.", "error");
      return;
    }

    if (
      trimmedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      showToast("Validation", "Enter a valid owner email address.", "error");
      return;
    }

    setSaving(true);
    try {
      const token = Cookies.get("authToken");
      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId
        ? buildUrl(`/api/online-stores/${editingId}`)
        : buildUrl("/api/online-stores");
      const payload = {
        name: trimmedName,
        slug: finalSlug,
        logo: formData.logo.trim(),
        image: formData.logo.trim(),
        banner: formData.banner.trim(),
        banner_url: formData.banner.trim(),
        website: trimmedWebsite,
        url: trimmedWebsite,
        store_url: trimmedWebsite,
        short_description: formData.short_description.trim(),
        description: formData.short_description.trim(),
        type: trimmedType,
        store_type: trimmedType,
        status: formData.status,
        owner_name: formData.owner_name.trim(),
        owner_email: trimmedEmail,
        owner_phone_code: formData.owner_phone_code.trim(),
        owner_phone: formData.owner_phone.trim(),
        phone_code: formData.owner_phone_code.trim(),
        phone: formData.owner_phone.trim(),
        country: formData.country.trim(),
        state: formData.state.trim(),
        province: formData.state.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        full_address: formData.address.trim(),
        postal_code: formData.postal_code.trim(),
        zip_code: formData.postal_code.trim(),
        established_year: formData.established_year
          ? String(formData.established_year)
          : "",
        products_sold: formData.products_sold,
        categories: formData.products_sold ? [formData.products_sold] : [],
        product_category: formData.products_sold,
        payment_methods: formData.payment_methods,
        payment_options: formData.payment_methods.join(", "),
        shipping_available: formData.shipping_available,
        verified: formData.verified,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Save failed");
      }

      const data = await response.json();
      const apiStore = data.data || data;
      const savedStore = {
        ...payload,
        ...apiStore,
        id: apiStore?.id ?? editingId ?? Date.now(),
      };

      if (editingId) {
        setStores((prev) =>
          prev.map((store) => (store.id === editingId ? savedStore : store)),
        );
        showToast("Saved", "Store updated successfully.", "success");
      } else {
        setStores((prev) => [savedStore, ...prev]);
        showToast("Saved", "Store added successfully.", "success");
      }

      closeForm();
    } catch (err) {
      console.error("Save error:", err);
      showToast("Error", err.message || "Failed to save store.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (store) => {
    if (!window.confirm(`Are you sure you want to delete "${store.name}"?`)) {
      return;
    }

    setSaving(true);
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(buildUrl(`/api/online-stores/${store.id}`), {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setStores((prev) => prev.filter((item) => item.id !== store.id));
      showToast("Deleted", "Store removed successfully.", "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error", "Failed to delete store.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (store) => {
    setSaving(true);
    try {
      const token = Cookies.get("authToken");
      const newStatus = store.status === "active" ? "inactive" : "active";

      const response = await fetch(
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

      if (!response.ok) {
        throw new Error("Status update failed");
      }

      setStores((prev) =>
        prev.map((item) =>
          item.id === store.id ? { ...item, status: newStatus } : item,
        ),
      );
      showToast("Updated", `"${store.name}" marked as ${newStatus}.`, "success");
    } catch (err) {
      console.error("Status toggle error:", err);
      showToast("Error", "Failed to update status.", "error");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCountryFilter("all");
    setTypeFilter("all");
  };

  const statCards = [
    {
      label: "Total Stores",
      value: totalStores.toLocaleString(),
      helper: "All registered online stores in the current dataset.",
      icon: FaStore,
      toneClass: "border-violet-200 text-violet-600",
    },
    {
      label: "Active Stores",
      value: activeStores.toLocaleString(),
      helper: "Stores currently available for product mapping.",
      icon: FaEye,
      toneClass: "border-emerald-200 text-emerald-600",
    },
    {
      label: "Inactive Stores",
      value: inactiveStores.toLocaleString(),
      helper: "Stores that are disabled right now.",
      icon: FaEyeSlash,
      toneClass: "border-amber-200 text-amber-600",
    },
    {
      label: "Verified Stores",
      value: verifiedStores.toLocaleString(),
      helper: "Stores passing the current verification rule.",
      icon: FaCheckCircle,
      toneClass: "border-blue-200 text-blue-600",
    },
    {
      label: "Unverified Stores",
      value: unverifiedStores.toLocaleString(),
      helper: "Stores that still need verification.",
      icon: FaExclamationCircle,
      toneClass: "border-rose-200 text-rose-600",
    },
  ];

  if (showForm) {
    return (
      <div className="mx-auto w-full max-w-[1720px] space-y-5 bg-transparent px-2 py-3 sm:px-3 md:px-4">
        <div className="fixed right-4 top-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              {toast.type === "success" ? (
                <FaCheckCircle className="mt-0.5 text-emerald-600" />
              ) : (
                <FaExclamationCircle className="mt-0.5 text-rose-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {toast.title}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 transition hover:text-slate-600"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          ))}
        </div>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/svg+xml,image/webp"
          onChange={handleAssetUpload("logo")}
          className="hidden"
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/svg+xml,image/webp"
          onChange={handleAssetUpload("banner")}
          className="hidden"
        />

        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {editorTitle}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{editorDescription}</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={closeForm}
                className={`${pageGhostButtonClassName} w-full justify-center sm:w-auto`}
              >
                <FaChevronLeft className="text-sm" />
                <span>Back to Stores</span>
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || Boolean(uploadingField)}
                  className={`${pagePrimaryButtonClassName} w-full justify-center sm:w-auto`}
                >
                  {saving ? (
                    <FaSpinner className="animate-spin text-sm" />
                  ) : (
                    <FaSave className="text-sm" />
                  )}
                  <span>Save Changes</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <section className={`xl:hidden ${editorCardClassName}`}>
          <div className={editorHeaderClassName}>
            <h2 className="text-lg font-semibold text-slate-950">
              Store Preview
            </h2>
          </div>
          <div className="space-y-4 px-3 py-4 sm:px-4">
            {bannerPreviewUrl ? (
              <div className="h-24 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                <img
                  src={bannerPreviewUrl}
                  alt="Store banner preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt={formData.name || "Store preview"}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <FaStore className="text-2xl text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold text-slate-950">
                  {formData.name.trim() || "Store Name"}
                </p>
                <p className="mt-1 truncate text-sm text-[#4C35F2]">
                  {previewWebsiteLabel}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {formData.type ? (
                    <span className="inline-flex rounded-md border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {formData.type}
                    </span>
                  ) : null}
                  <EditorStatusChip
                    label={formData.status === "active" ? "Active" : "Inactive"}
                    tone={previewStatusTone}
                    className="rounded-md"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-600">
              <p>URL: {previewStoreUrl}</p>
              <p className="mt-2 line-clamp-3">{previewDescription}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0 space-y-4">
            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Basic Information
                </h2>
              </div>
              <div className="space-y-5 px-2 py-3 sm:px-4 sm:py-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_280px]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Store Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter store name"
                      className={editorFieldClassNameLocal}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Store Slug <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-[150px_minmax(0,1fr)] overflow-hidden rounded-md border border-slate-200">
                      <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                        hooks.in/stores/
                      </span>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="enter-store-slug"
                        className="h-11 min-w-0 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      URL: {previewStoreUrl}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Store Logo <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => triggerAssetInput("logo")}
                      className="flex min-h-[128px] w-full flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-4 py-4 text-center transition hover:border-[#4C35F2]"
                    >
                      {logoPreviewUrl ? (
                        <div className="relative flex h-full w-full items-center justify-center">
                          <img
                            src={logoPreviewUrl}
                            alt="Store logo preview"
                            className="max-h-[92px] max-w-full object-contain"
                          />
                          <span className="absolute right-0 top-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                            Change
                          </span>
                        </div>
                      ) : isUploadingLogo ? (
                        <>
                          <FaSpinner className="animate-spin text-2xl text-slate-400" />
                          <span className="mt-2 text-sm font-medium text-slate-700">
                            Uploading logo...
                          </span>
                        </>
                      ) : (
                        <>
                          <FaUpload className="text-xl text-slate-400" />
                          <span className="mt-2 text-sm font-medium text-slate-700">
                            Upload logo
                          </span>
                          <span className="mt-1 text-xs text-slate-500">
                            PNG, JPG or SVG up to 2MB
                          </span>
                        </>
                      )}
                    </button>
                    {logoPreviewUrl ? (
                      <button
                        type="button"
                        onClick={() => clearAsset("logo")}
                        className="mt-2 text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                      >
                        Remove logo
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Store Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className={editorFieldClassNameLocal}
                    >
                      <option value="">Select store type</option>
                      {availableStoreTypes.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Website URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://www.example.com"
                      className={editorFieldClassNameLocal}
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Short Description
                      </label>
                      <span className="text-xs text-slate-400">
                        {formData.short_description.length} / 200
                      </span>
                    </div>
                    <textarea
                      name="short_description"
                      value={formData.short_description}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Enter short description about the store..."
                      className={`${editorTextareaClassNameLocal} min-h-[96px] resize-none`}
                    />
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Store Banner
                    </label>
                    <button
                      type="button"
                      onClick={() => triggerAssetInput("banner")}
                      className="flex min-h-[120px] w-full flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-4 py-4 text-center transition hover:border-[#4C35F2]"
                    >
                      {bannerPreviewUrl ? (
                        <div className="relative h-full w-full overflow-hidden rounded-md border border-slate-200">
                          <img
                            src={bannerPreviewUrl}
                            alt="Store banner preview"
                            className="h-full max-h-[150px] w-full object-cover"
                          />
                          <span className="absolute right-2 top-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                            Change
                          </span>
                        </div>
                      ) : isUploadingBanner ? (
                        <>
                          <FaSpinner className="animate-spin text-2xl text-slate-400" />
                          <span className="mt-2 text-sm font-medium text-slate-700">
                            Uploading banner...
                          </span>
                        </>
                      ) : (
                        <>
                          <FaUpload className="text-xl text-slate-400" />
                          <span className="mt-2 text-sm font-medium text-slate-700">
                            Upload banner
                          </span>
                          <span className="mt-1 text-xs text-slate-500">
                            PNG, JPG or SVG up to 5MB
                          </span>
                        </>
                      )}
                    </button>
                    {bannerPreviewUrl ? (
                      <button
                        type="button"
                        onClick={() => clearAsset("banner")}
                        className="mt-2 text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                      >
                        Remove banner
                      </button>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Store Established Year
                    </label>
                    <select
                      name="established_year"
                      value={formData.established_year}
                      onChange={handleInputChange}
                      className={editorFieldClassNameLocal}
                    >
                      <option value="">Select year</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Owner Information
                </h2>
              </div>
              <div className="grid gap-4 px-2 py-3 sm:px-4 sm:py-4 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleInputChange}
                    placeholder="Enter owner / company name"
                    className={editorFieldClassNameLocal}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    name="owner_email"
                    value={formData.owner_email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className={editorFieldClassNameLocal}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Owner Phone
                  </label>
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
                    <input
                      type="text"
                      name="owner_phone_code"
                      value={formData.owner_phone_code}
                      onChange={handleInputChange}
                      placeholder="+1"
                      className={editorFieldClassNameLocal}
                    />
                    <input
                      type="text"
                      name="owner_phone"
                      value={formData.owner_phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className={editorFieldClassNameLocal}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Store Address
                </h2>
              </div>
              <div className="grid gap-4 px-2 py-3 sm:px-4 sm:py-4 xl:grid-cols-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Country
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={editorFieldClassNameLocal}
                  >
                    <option value="">Select country</option>
                    {availableCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    State / Province
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={editorFieldClassNameLocal}
                  >
                    <option value="">Select state / province</option>
                    {stateOptions.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    className={editorFieldClassNameLocal}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    className={editorFieldClassNameLocal}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Zip / Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    placeholder="Enter zip / postal code"
                    className={editorFieldClassNameLocal}
                  />
                </div>
              </div>
            </section>

            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Additional Information
                </h2>
              </div>
              <div className="space-y-5 px-2 py-3 sm:px-4 sm:py-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Products Sold
                    </label>
                    <select
                      name="products_sold"
                      value={formData.products_sold}
                      onChange={handleInputChange}
                      className={editorFieldClassNameLocal}
                    >
                      {availableProductCategories.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Payment Methods
                    </label>
                    <div className="flex min-h-[44px] flex-wrap gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                      {availablePaymentMethods.map((method) => {
                        const active = formData.payment_methods.includes(method);
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => togglePaymentMethod(method)}
                            className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                              active
                                ? "border-[#4C35F2] bg-[#F6F3FF] text-[#4C35F2]"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {method}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Shipping Available
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[true, false].map((value) => {
                        const active = formData.shipping_available === value;
                        return (
                          <button
                            key={String(value)}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                shipping_available: value,
                              }))
                            }
                            className={`h-11 rounded-md border text-sm font-semibold transition ${
                              active
                                ? "border-[#4C35F2] bg-[#F6F3FF] text-[#4C35F2]"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {value ? "Yes" : "No"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Store Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={editorFieldClassNameLocal}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className={editorCardClassName}>
              <div className="flex flex-col gap-3 px-2 py-4 sm:px-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {editingStore ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingStore)}
                      disabled={saving}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaTrash className="text-sm" />
                      <span>Delete Store</span>
                    </button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={closeForm}
                      className={`${pageGhostButtonClassName} w-full justify-center sm:w-auto`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || Boolean(uploadingField)}
                      className={`${pagePrimaryButtonClassName} w-full justify-center sm:w-auto`}
                    >
                      {saving ? (
                        <FaSpinner className="animate-spin text-sm" />
                      ) : editingId ? (
                        <FaSave className="text-sm" />
                      ) : (
                        <FaPlus className="text-sm" />
                      )}
                      <span>{editingId ? "Save Changes" : "Create Store"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className={`xl:hidden ${editorCardClassName}`}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editingId ? "Store Status" : "Store Tips"}
                </h2>
              </div>
              <div className="space-y-3 px-3 py-4 text-sm text-slate-600 sm:px-4">
                {editingId ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span>Status</span>
                      <EditorStatusChip
                        label={formData.status === "active" ? "Active" : "Inactive"}
                        tone={previewStatusTone}
                        className="rounded-md"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Verified</span>
                      <span className="font-medium text-slate-900">
                        {formData.verified ? "Yes" : "No"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Add an official logo and banner for better recognition.</p>
                    <p>Make sure the website URL is correct and accessible.</p>
                    <p>Choose the right store type to help users find it easily.</p>
                  </>
                )}
              </div>
            </section>
          </div>

          <aside className="hidden space-y-4 xl:block">
            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Store Preview
                </h2>
              </div>
              <div className="space-y-4 px-4 py-4 text-center">
                {bannerPreviewUrl ? (
                  <div className="h-24 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                    <img
                      src={bannerPreviewUrl}
                      alt="Store banner preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt={formData.name || "Store preview"}
                      className="h-full w-full object-contain p-3"
                    />
                  ) : (
                    <FaStore className="text-3xl text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-950">
                    {formData.name.trim() || "Store Name"}
                  </h3>
                  <p className="mt-2 text-sm text-[#4C35F2]">
                    {previewWebsiteLabel}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {formData.type ? (
                    <span className="inline-flex rounded-md border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {formData.type}
                    </span>
                  ) : null}
                  <EditorStatusChip
                    label={formData.status === "active" ? "Active" : "Inactive"}
                    tone={previewStatusTone}
                    className="rounded-md"
                  />
                </div>
                <p className="text-sm text-slate-500">{previewDescription}</p>
                {previewWebsiteHref ? (
                  <a
                    href={previewWebsiteHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-[#4C35F2] transition hover:border-[#4C35F2]"
                  >
                    Visit Store
                  </a>
                ) : null}
              </div>
            </section>

            {editingId ? (
              <>
                <section className={editorCardClassName}>
                  <div className={editorHeaderClassName}>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Store Status
                    </h2>
                  </div>
                  <div className="space-y-3 px-4 py-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <span>Status</span>
                      <EditorStatusChip
                        label={formData.status === "active" ? "Active" : "Inactive"}
                        tone={previewStatusTone}
                        className="rounded-md"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Verified</span>
                      <span className="font-medium text-slate-900">
                        {formData.verified ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Products</span>
                      <span className="font-medium text-slate-900">
                        {editingStore?.productsCount?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Joined On</span>
                      <span className="font-medium text-slate-900">
                        {editingStore?.createdLabel || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Last Updated</span>
                      <span className="font-medium text-slate-900">
                        {editingStore?.updatedDetailedLabel || "Not set"}
                      </span>
                    </div>
                  </div>
                </section>

                <section className={editorCardClassName}>
                  <div className={editorHeaderClassName}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-slate-950">
                        Recent Activity
                      </h2>
                      <span className="text-sm font-semibold text-[#4C35F2]">
                        View All
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    {recentActivity.map((item) => (
                      <div key={`${item.title}-${item.detail}`} className="grid grid-cols-[16px_minmax(0,1fr)] gap-3">
                        <span
                          className={`mt-1.5 h-3 w-3 rounded-full ${
                            item.tone === "emerald"
                              ? "bg-emerald-400"
                              : item.tone === "blue"
                                ? "bg-blue-400"
                                : "bg-violet-400"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.detail}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.helper}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className={editorCardClassName}>
                  <div className={editorHeaderClassName}>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Store Tips
                    </h2>
                  </div>
                  <div className="space-y-4 px-4 py-4 text-sm text-slate-600">
                    <p>Add an official logo and banner for better recognition.</p>
                    <p>Make sure the website URL is correct and accessible.</p>
                    <p>Choose the right store type to help users find it easily.</p>
                    <p>You can update all details anytime after creation.</p>
                  </div>
                </section>

                <section className={editorCardClassName}>
                  <div className={editorHeaderClassName}>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Need Help?
                    </h2>
                  </div>
                  <div className="space-y-3 px-4 py-4 text-sm text-slate-500">
                    <p>Learn how to manage stores effectively.</p>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 font-semibold text-[#4C35F2] transition hover:border-[#4C35F2]"
                    >
                      View Documentation
                    </button>
                  </div>
                </section>
              </>
            )}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1720px] space-y-4 bg-white px-2 py-3 sm:px-3 md:px-4">
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            {toast.type === "success" ? (
              <FaCheckCircle className="mt-0.5 text-emerald-600" />
            ) : (
              <FaExclamationCircle className="mt-0.5 text-rose-600" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 transition hover:text-slate-600"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Stores
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage all stores and their information.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => fetchStores(false)}
              disabled={loading || saving}
              className={pageGhostButtonClassName}
            >
              {loading ? (
                <FaSpinner className="animate-spin text-sm" />
              ) : (
                <FaUpload className="text-sm" />
              )}
              <span>Import Stores</span>
            </button>
            <button
              type="button"
              onClick={handleAddNew}
              className={pagePrimaryButtonClassName}
            >
              <FaPlus className="text-sm" />
              <span>Add New Store</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-md border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <FaExclamationCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {showForm ? (
            <section className={CARD_CLASS}>
              <div className={PANEL_HEADER_CLASS}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      {editingId ? "Edit Store" : "Add New Store"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Update the store name, logo, and live status used across
                      product mapping flows.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    className={pageGhostButtonClassName}
                  >
                    <FaTimes className="text-sm" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              <div className="px-2 py-3 sm:px-4 sm:py-4">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Store Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Amazon, Flipkart, Vijay Sales"
                        className={pageFieldClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className={pageFieldClassName}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Store Logo
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/png,image/jpg,image/svg+xml,image/webp"
                      className="hidden"
                    />

                    {imagePreview ? (
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="flex h-[210px] w-full items-center justify-center rounded-md border border-dashed border-slate-300 p-4 transition hover:border-[#4C35F2]"
                      >
                        <img
                          src={imagePreview}
                          alt="Store preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="flex h-[210px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-4 text-center transition hover:border-[#4C35F2]"
                      >
                        {uploadingImage ? (
                          <FaSpinner className="animate-spin text-2xl text-slate-400" />
                        ) : (
                          <FaImage className="text-2xl text-slate-400" />
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          Upload store logo
                        </span>
                        <span className="text-xs text-slate-500">
                          JPEG, PNG, SVG, WebP up to 5MB
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    className={pageGhostButtonClassName}
                  >
                    <FaTimes className="text-sm" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || uploadingImage}
                    className={pagePrimaryButtonClassName}
                  >
                    {saving || uploadingImage ? (
                      <FaSpinner className="animate-spin text-sm" />
                    ) : (
                      <FaSave className="text-sm" />
                    )}
                    <span>{editingId ? "Update Store" : "Save Store"}</span>
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <section className={CARD_CLASS}>
            <div className="border-b border-slate-200 px-2 py-3 sm:px-3 lg:px-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search stores by name or slug..."
                    className={`${pageFieldClassName} pl-10`}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className={pageFieldClassName}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={countryFilter}
                    onChange={(event) => setCountryFilter(event.target.value)}
                    className={pageFieldClassName}
                  >
                    <option value="all">All Countries</option>
                    {uniqueCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className={pageFieldClassName}
                  >
                    <option value="all">All Types</option>
                    {uniqueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <button type="button" className={pageGhostButtonClassName}>
                    <FaFilter className="text-sm" />
                    <span>Filters</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-slate-500">
                  {selectedStoreIds.length
                    ? `${selectedStoreIds.length} stores selected in the current view`
                    : "Select rows for bulk review or follow-up actions."}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-[#4C35F2] transition hover:text-[#3d2bd0]"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="text-xs uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left font-semibold">
                      <input
                        type="checkbox"
                        checked={allPageItemsSelected}
                        onChange={toggleSelectAllOnPage}
                        aria-label="Select all stores on this page"
                        className="h-4 w-4 rounded-[3px] border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Store</th>
                    <th className="px-4 py-3 text-left font-semibold">Slug</th>
                    <th className="px-4 py-3 text-left font-semibold">Owner</th>
                    <th className="px-4 py-3 text-left font-semibold">Country</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Products</th>
                    <th className="px-4 py-3 text-left font-semibold">Joined On</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="px-4 py-12 text-center">
                        <FaSpinner className="mx-auto animate-spin text-2xl text-[#4C35F2]" />
                      </td>
                    </tr>
                  ) : paginatedStores.length ? (
                    paginatedStores.map((store) => (
                      <tr key={store.id} className="hover:bg-slate-50/40">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStoreIds.includes(store.id)}
                            onChange={() => toggleStoreSelection(store.id)}
                            aria-label={`Select ${store.displayName}`}
                            className="h-4 w-4 rounded-[3px] border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-slate-200">
                              {store.logoUrl ? (
                                <img
                                  src={store.logoUrl}
                                  alt={store.displayName}
                                  className="h-8 w-8 object-contain"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      store.displayName,
                                    )}&background=4C35F2&color=fff&size=40`;
                                  }}
                                />
                              ) : (
                                <FaStore className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {store.displayName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {store.verified ? "Verified" : "Unverified"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-500">{store.slug}</td>
                        <td className="px-4 py-4">{store.ownerLabel}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span>{store.countryFlag || "•"}</span>
                            <span>{store.countryLabel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-md border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            {store.typeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => toggleStatus(store)}
                            className="text-left"
                          >
                            <EditorStatusChip
                              label={store.status === "active" ? "Active" : "Inactive"}
                              tone={store.status === "active" ? "success" : "danger"}
                              className="rounded-md"
                            />
                          </button>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#4C35F2]">
                          {store.productsCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {store.createdLabel}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(store)}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                              title="Edit store"
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(store)}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-rose-200 hover:text-rose-700"
                              title="Delete store"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-12 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-slate-200">
                            <FaStore className="text-2xl text-slate-400" />
                          </div>
                          <p className="mt-4 text-base font-semibold text-slate-900">
                            No stores found
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Try adjusting your search or add a new store.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 lg:hidden">
              {loading ? (
                <div className="px-2 py-10 text-center sm:px-3">
                  <FaSpinner className="mx-auto animate-spin text-2xl text-[#4C35F2]" />
                </div>
              ) : paginatedStores.length ? (
                paginatedStores.map((store) => (
                  <article
                    key={`mobile-${store.id}`}
                    className="space-y-3 px-2 py-4 sm:px-3"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStoreIds.includes(store.id)}
                        onChange={() => toggleStoreSelection(store.id)}
                        aria-label={`Select ${store.displayName}`}
                        className="mt-1 h-4 w-4 flex-shrink-0 rounded-[3px] border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                      />
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-slate-200">
                          {store.logoUrl ? (
                            <img
                              src={store.logoUrl}
                              alt={store.displayName}
                              className="h-8 w-8 object-contain"
                            />
                          ) : (
                            <FaStore className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-slate-900">
                            {store.displayName}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">{store.slug}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Owner
                        </p>
                        <p className="mt-1 text-slate-700">{store.ownerLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Country
                        </p>
                        <p className="mt-1 text-slate-700">
                          {store.countryFlag ? `${store.countryFlag} ` : ""}
                          {store.countryLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Type
                        </p>
                        <p className="mt-1 text-slate-700">{store.typeLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Products
                        </p>
                        <p className="mt-1 font-semibold text-[#4C35F2]">
                          {store.productsCount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Joined On
                        </p>
                        <p className="mt-1 text-slate-700">{store.createdLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Status
                        </p>
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => toggleStatus(store)}
                            className="text-left"
                          >
                            <EditorStatusChip
                              label={store.status === "active" ? "Active" : "Inactive"}
                              tone={store.status === "active" ? "success" : "danger"}
                              className="rounded-md"
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(store)}
                        className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(store)}
                        className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="px-2 py-10 text-center sm:px-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-slate-200">
                    <FaStore className="text-2xl text-slate-400" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900">
                    No stores found
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Try adjusting your search or add a new store.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-2 py-3 sm:px-3 lg:px-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredStores.length ? startIndex + 1 : 0}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-900">
                    {Math.min(startIndex + itemsPerPage, filteredStores.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredStores.length}
                  </span>{" "}
                  stores
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPageSafe === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaChevronLeft />
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .slice(
                      Math.max(0, currentPageSafe - 2),
                      Math.max(0, currentPageSafe - 2) + 5,
                    )
                    .map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition ${
                          currentPageSafe === page
                            ? "border-[#4C35F2] bg-[#4C35F2] text-white"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
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
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className={PANEL_HEADER_CLASS}>
              <h2 className="text-lg font-semibold text-slate-950">
                Stores Overview
              </h2>
            </div>
            <div className="px-3 py-4 sm:px-4">
              <StoresOverviewRing
                active={activeStores}
                inactive={inactiveStores}
                unverified={unverifiedStores}
              />
            </div>
          </section>

          <section className={CARD_CLASS}>
            <div className={PANEL_HEADER_CLASS}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">
                  Top Stores by Products
                </h2>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="text-sm font-semibold text-[#4C35F2] transition hover:text-[#3d2bd0]"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="space-y-4 px-3 py-4 sm:px-4">
              {topStores.length ? (
                topStores.map((store, index) => (
                  <div
                    key={`top-store-${store.id}`}
                    className="grid grid-cols-[18px_minmax(0,1fr)_58px] items-center gap-3"
                  >
                    <span className="text-sm font-medium text-slate-500">
                      {index + 1}.
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {store.displayName}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-[#4C35F2] to-[#7C5CFF]"
                          style={{
                            width: `${Math.max(
                              18,
                              (store.productsCount / maxProducts) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-right text-sm font-semibold text-slate-700">
                      {store.productsCount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No store usage data is available yet.
                </p>
              )}
            </div>
          </section>

          <section className={CARD_CLASS}>
            <div className={PANEL_HEADER_CLASS}>
              <h2 className="text-lg font-semibold text-slate-950">
                Quick Actions
              </h2>
            </div>
            <div className="space-y-2 px-3 py-4 sm:px-4">
              <button
                type="button"
                onClick={handleAddNew}
                className={`${pageGhostButtonClassName} w-full justify-start`}
              >
                <FaPlus className="text-sm text-[#4C35F2]" />
                <span>Add New Store</span>
              </button>
              <button
                type="button"
                onClick={() => fetchStores(false)}
                className={`${pageGhostButtonClassName} w-full justify-start`}
              >
                <FaUpload className="text-sm text-[#4C35F2]" />
                <span>Import Stores</span>
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className={`${pageGhostButtonClassName} w-full justify-start`}
              >
                <FaFilter className="text-sm text-[#4C35F2]" />
                <span>Reset Filters</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStoreIds([])}
                className={`${pageGhostButtonClassName} w-full justify-start`}
              >
                <FaGlobe className="text-sm text-[#4C35F2]" />
                <span>Clear Selection</span>
              </button>
            </div>
          </section>

          <section className={CARD_CLASS}>
            <div className={PANEL_HEADER_CLASS}>
              <h2 className="text-lg font-semibold text-slate-950">Need Help?</h2>
            </div>
            <div className="space-y-3 px-3 py-4 text-sm text-slate-500 sm:px-4">
              <p>
                Store records here are used in product variant mapping screens
                for mobiles, laptops, and appliances.
              </p>
              <p>
                Verified state is inferred from the existing verification fields
                when available, otherwise active stores are treated as verified
                for this overview.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default OnlineStoreManagement;
