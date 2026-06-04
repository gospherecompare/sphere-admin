import React, { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE, buildUrl, getAuthToken } from "../api";
import {
  FaBook,
  FaChevronDown,
  FaChevronLeft,
  FaCode,
  FaCog,
  FaCopy,
  FaDownload,
  FaEdit,
  FaEllipsisH,
  FaGlobe,
  FaHistory,
  FaKey,
  FaPlay,
  FaPlus,
  FaSave,
  FaSearch,
  FaTimesCircle,
  FaTrash,
  FaUpload,
} from "react-icons/fa";

const METHOD_STYLES = {
  GET: {
    pill: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "bg-emerald-500",
  },
  POST: {
    pill: "border border-violet-200 bg-violet-50 text-violet-700",
    accent: "bg-violet-500",
  },
  PUT: {
    pill: "border border-amber-200 bg-amber-50 text-amber-700",
    accent: "bg-amber-500",
  },
  PATCH: {
    pill: "border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    accent: "bg-fuchsia-500",
  },
  DELETE: {
    pill: "border border-rose-200 bg-rose-50 text-rose-700",
    accent: "bg-rose-500",
  },
  OPTIONS: {
    pill: "border border-slate-200 bg-slate-50 text-slate-700",
    accent: "bg-slate-500",
  },
  HEAD: {
    pill: "border border-indigo-200 bg-indigo-50 text-indigo-700",
    accent: "bg-indigo-500",
  },
};

const getUserInitials = (value) =>
  String(value || "AU")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const INITIAL_HEADERS = [
  { key: "Content-Type", value: "application/json", enabled: true },
  { key: "Accept", value: "application/json", enabled: true },
];

const INITIAL_QUERY_PARAMS = [{ key: "", value: "", enabled: true, description: "" }];

const STORAGE_KEYS = {
  presets: "apiTester.presets",
  history: "apiTester.history",
  collections: "apiTester.collections",
};

const REQUEST_TABS = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "authorization", label: "Authorization" },
  { id: "tests", label: "Tests" },
  { id: "settings", label: "Settings" },
];

const BODY_MODE_OPTIONS = [
  { id: "none", label: "none" },
  { id: "form-data", label: "form-data" },
  { id: "x-www-form-urlencoded", label: "x-www-form-urlencoded" },
  { id: "raw", label: "raw" },
];

const FIXED_COLLECTIONS = [
  { id: "mobile", label: "Mobile APIs" },
  { id: "brand", label: "Brand APIs" },
  { id: "compare", label: "Compare APIs" },
  { id: "blog", label: "Blog APIs" },
  { id: "search", label: "Search APIs" },
  { id: "user", label: "User APIs" },
  { id: "review", label: "Review APIs" },
  { id: "other", label: "Other APIs" },
];

const PANEL_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";
const PANEL_HEADER_CLASS = "border-b border-slate-200 px-3 py-3 sm:px-4";
const INPUT_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4C35F2] focus:ring-0";
const TEXTAREA_CLASS =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-3 font-mono text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4C35F2] focus:ring-0";
const GHOST_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white transition hover:bg-[#3d2be3] disabled:cursor-not-allowed disabled:opacity-60";
const ICON_BUTTON_CLASS =
  "inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50";
const TAB_BUTTON_BASE =
  "inline-flex items-center border-b-2 px-1 py-3 text-sm font-semibold transition";

const presetEndpoints = [
  { name: "Get All Mobiles", method: "GET", url: "/api/smartphones" },
  { name: "Get Mobile by ID", method: "GET", url: "/api/smartphone/:id" },
  {
    name: "Create Mobile",
    method: "POST",
    url: "/api/smartphones/req",
  },
  { name: "Update Mobile", method: "PUT", url: "/api/smartphone/:id" },
  { name: "Delete Mobile", method: "DELETE", url: "/api/smartphone/:id" },
  { name: "Get Categories", method: "GET", url: "/api/categories" },
  { name: "Get Brands", method: "GET", url: "/api/brands" },
  { name: "Create Laptop", method: "POST", url: "/api/laptops" },
  { name: "Get TVs", method: "GET", url: "/api/tvs" },
  {
    name: "Create TV",
    method: "POST",
    url: "/api/tvs",
    body: {
      product_name: "Samsung Neo QLED 55",
      brand_name: "Samsung",
      category: "television",
      model: "QN90D",
      publish: false,
      key_specs_json: {
        resolution: "4K UHD",
        screen_size: "55 inch",
        panel_type: "QLED",
      },
      basic_info_json: {
        title: "Samsung Neo QLED 55",
        model_number: "QN90D",
      },
      smart_tv_json: {
        os: "Tizen",
        smart_features: ["Netflix", "YouTube", "Prime Video"],
      },
      images_json: ["https://example.com/tv-front.jpg"],
      variants_json: [
        {
          variant_key: "55-inch",
          screen_size: "55 inch",
          base_price: 1499,
          store_prices: [
            {
              store_name: "Amazon",
              price: 1499,
              url: "https://example.com/samsung-neo-qled-55",
            },
          ],
        },
      ],
    },
  },
  { name: "Update TV", method: "PUT", url: "/api/tvs/:id" },
  { name: "Get Network Devices", method: "GET", url: "/api/networking" },
  {
    name: "Track Feature Click",
    method: "POST",
    url: "/api/public/feature-click",
    body: {
      device_type: "laptop",
      feature_id: "battery-life",
    },
  },
  {
    name: "Popular Features",
    method: "GET",
    url: "/api/public/popular-features?deviceType=laptop&days=7&limit=20",
  },
];

const readStoredArray = (key) => {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredArray = (key, value) => {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

const normalizeDisplayUrl = (value) => {
  if (!value) return "";
  const text = String(value).trim();
  try {
    if (/^https?:\/\//i.test(text)) {
      const parsed = new URL(text);
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Keep raw text.
  }
  return text;
};

const normalizeComparableUrl = (value) =>
  normalizeDisplayUrl(value)
    .replace(/\/+$/, "")
    .toLowerCase();

const toTitleCase = (value) =>
  String(value || "")
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const inferEnvironmentLabel = (apiBase) => {
  try {
    const host = new URL(apiBase).hostname.toLowerCase();
    if (
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      host.includes("dev")
    ) {
      return "Development";
    }
    if (host.includes("staging") || host.includes("stage")) {
      return "Staging";
    }
    return "Production";
  } catch {
    return "Connected";
  }
};

const deriveCollectionId = (item) => {
  const value = `${item?.name || ""} ${item?.url || ""}`.toLowerCase();
  if (
    value.includes("smartphone") ||
    value.includes("mobile") ||
    value.includes("laptop") ||
    value.includes("/api/tvs") ||
    value.includes("network")
  ) {
    return "mobile";
  }
  if (value.includes("brand")) return "brand";
  if (value.includes("compare") || value.includes("feature-click")) {
    return "compare";
  }
  if (value.includes("blog") || value.includes("article") || value.includes("content")) {
    return "blog";
  }
  if (value.includes("search") || value.includes("popular-features")) {
    return "search";
  }
  if (
    value.includes("user") ||
    value.includes("auth") ||
    value.includes("permission") ||
    value.includes("customer")
  ) {
    return "user";
  }
  if (value.includes("review") || value.includes("rating")) return "review";
  return "other";
};

const buildRequestTitle = (method, url, knownItems = []) => {
  const exact = knownItems.find((item) =>
    item.method === method &&
    normalizeComparableUrl(item.url) === normalizeComparableUrl(url),
  );
  if (exact?.name) return exact.name;

  const normalized = normalizeDisplayUrl(url)
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/api\/?/i, "");
  const parts = normalized.split("?")[0].split("/").filter(Boolean);
  const filtered = parts.filter((part) => part !== ":id" && !/^\d+$/.test(part));
  const resource = toTitleCase(filtered[filtered.length - 1] || filtered[0] || "Request");
  const action =
    {
      GET: "Fetch",
      POST: "Create",
      PUT: "Update",
      PATCH: "Patch",
      DELETE: "Delete",
      OPTIONS: "Inspect",
      HEAD: "Inspect",
    }[method] || method;
  return `${action} ${resource}`.trim();
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatPreviewValue = (value) => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return `${value.length} item(s)`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const buildInitialBody = () =>
  JSON.stringify(
    {
      name: "iPhone 15 Pro",
      brand_id: 1,
      category_id: 1,
      price: 999.99,
      is_published: true,
      specifications: {
        display: "6.1-inch Super Retina XDR",
        processor: "A17 Pro",
        ram: "8GB",
        storage: "256GB",
      },
    },
    null,
    2,
  );

export default function ApiTester() {
  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("/api/smartphones/req");
  const [token, setToken] = useState(
    getAuthToken() || Cookies.get("authToken") || "",
  );
  const [body, setBody] = useState(buildInitialBody);
  const [headers, setHeaders] = useState(INITIAL_HEADERS);
  const [queryParams, setQueryParams] = useState(INITIAL_QUERY_PARAMS);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => readStoredArray(STORAGE_KEYS.history));
  const [activeTab, setActiveTab] = useState("body");
  const [bodyFormat, setBodyFormat] = useState("json");
  const [bodyMode, setBodyMode] = useState("raw");
  const [collections, setCollections] = useState(() =>
    readStoredArray(STORAGE_KEYS.collections),
  );
  const [userPresets, setUserPresets] = useState(() =>
    readStoredArray(STORAGE_KEYS.presets),
  );
  const [importText, setImportText] = useState("");
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [postResponsePath, setPostResponsePath] = useState("/api/smartphones/req");
  const [postResponseLoading, setPostResponseLoading] = useState(false);
  const [smartphoneOptions, setSmartphoneOptions] = useState([]);
  const [smartphoneLoading, setSmartphoneLoading] = useState(false);
  const [smartphoneError, setSmartphoneError] = useState(null);
  const [selectedSmartphoneId, setSelectedSmartphoneId] = useState("");
  const [smartphoneQuery, setSmartphoneQuery] = useState("");
  const [smartphoneDropdownOpen, setSmartphoneDropdownOpen] = useState(false);
  const [responseView, setResponseView] = useState("pretty");
  const [isXlViewport, setIsXlViewport] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1280,
  );
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState({
    mobile: true,
    brand: true,
    compare: true,
    blog: false,
    search: true,
    user: false,
    review: false,
    other: true,
    saved: true,
    custom: true,
  });

  const smartphoneDropdownRef = useRef(null);
  const historyPanelRef = useRef(null);
  const paramsSectionRef = useRef(null);
  const headersSectionRef = useRef(null);

  const showSmartphoneSelector =
    /\/api\/smartphones?/i.test(url) && url.includes(":id");
  const environmentLabel = useMemo(() => inferEnvironmentLabel(API_BASE), []);

  const filteredSmartphoneOptions = smartphoneQuery.trim()
    ? smartphoneOptions.filter((option) => {
        const query = smartphoneQuery.trim().toLowerCase();
        return (
          option.name.toLowerCase().includes(query) ||
          String(option.model || "").toLowerCase().includes(query)
        );
      })
    : smartphoneOptions;

  const selectedSmartphoneOption = smartphoneOptions.find(
    (option) => option.id === selectedSmartphoneId,
  );
  const selectedSmartphoneLabel = selectedSmartphoneOption
    ? selectedSmartphoneOption.name
    : "Select smartphone...";

  const allKnownRequests = useMemo(
    () => [...presetEndpoints, ...userPresets],
    [userPresets],
  );

  const currentRequestTitle = useMemo(
    () => buildRequestTitle(method, url, allKnownRequests),
    [allKnownRequests, method, url],
  );

  const collectionSections = useMemo(() => {
    const grouped = FIXED_COLLECTIONS.map((section) => ({
      ...section,
      items: [],
    }));
    const groupedById = Object.fromEntries(
      grouped.map((section) => [section.id, section]),
    );

    presetEndpoints.forEach((item, index) => {
      const bucket = groupedById[deriveCollectionId(item)] || groupedById.other;
      bucket.items.push({
        ...item,
        requestKey: `preset-${index}`,
        source: "preset",
      });
    });

    userPresets.forEach((item, index) => {
      const bucket = groupedById[deriveCollectionId(item)] || groupedById.other;
      bucket.items.push({
        ...item,
        requestKey: `user-${index}`,
        source: "user",
        userPresetIndex: index,
      });
    });

    return grouped;
  }, [userPresets]);

  const previewEntries = useMemo(() => {
    if (!response) return [];
    const payload = response.body;
    if (Array.isArray(payload)) {
      return payload.slice(0, 8).map((item, index) => ({
        key: `Item ${index + 1}`,
        value: item,
      }));
    }
    if (payload && typeof payload === "object") {
      return Object.entries(payload).slice(0, 10).map(([key, value]) => ({
        key,
        value,
      }));
    }
    return [{ key: "Value", value: payload }];
  }, [response]);

  const responseHeaders = useMemo(
    () => Object.entries(response?.headers || {}),
    [response],
  );

  const responseText = useMemo(() => {
    if (!response) return "";
    if (typeof response.body === "string") return response.body;
    return JSON.stringify(response.body, null, 2);
  }, [response]);

  const responseFormatLabel = useMemo(() => {
    const contentType = response?.headers?.["content-type"] || "";
    if (contentType.includes("json")) return "JSON";
    if (contentType.includes("html")) return "HTML";
    if (contentType.includes("xml")) return "XML";
    if (contentType.includes("text")) return "TEXT";
    return "AUTO";
  }, [response]);

  useEffect(() => {
    writeStoredArray(STORAGE_KEYS.presets, userPresets);
  }, [userPresets]);

  useEffect(() => {
    writeStoredArray(STORAGE_KEYS.history, history);
  }, [history]);

  useEffect(() => {
    writeStoredArray(STORAGE_KEYS.collections, collections);
  }, [collections]);

  useEffect(() => {
    if (!smartphoneDropdownOpen) return undefined;
    const handleClickOutside = (event) => {
      if (
        smartphoneDropdownRef.current &&
        !smartphoneDropdownRef.current.contains(event.target)
      ) {
        setSmartphoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [smartphoneDropdownOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setIsXlViewport(window.innerWidth >= 1280);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isXlViewport) {
      setMobileCollectionsOpen(false);
    }
  }, [isXlViewport]);

  const toObject = (value) =>
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  const resolveRequestUrl = (input, queryString = "") => {
    const inputUrl =
      input && String(input).trim() ? String(input).trim() : "/api/smartphone";
    const resolvedUrl =
      inputUrl.includes(":id") && selectedSmartphoneId
        ? inputUrl.replace(":id", String(selectedSmartphoneId))
        : inputUrl;

    if (/^https?:\/\//i.test(resolvedUrl)) {
      return resolvedUrl + (queryString ? `?${queryString}` : "");
    }

    const path = resolvedUrl.startsWith("/") ? resolvedUrl : `/${resolvedUrl}`;
    return buildUrl(path) + (queryString ? `?${queryString}` : "");
  };

  const normalizeSmartphoneOption = (row) => {
    if (!row) return null;
    const id =
      row.product_id ??
      row.productId ??
      row.id ??
      row.smartphone_id ??
      row.smartphoneId ??
      null;
    const name =
      row.name || row.product_name || row.productName || row.model || "";
    const brand = row.brand_name || row.brand || row.brandName || "";
    if (!id || !name) return null;
    return {
      id: String(id),
      name: String(name),
      model: row.model || "",
      brand: String(brand || ""),
    };
  };

  const loadSmartphones = async () => {
    setSmartphoneLoading(true);
    setSmartphoneError(null);
    try {
      const authToken = getAuthToken() || Cookies.get("authToken");
      const nextHeaders = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        nextHeaders.Authorization = `Bearer ${authToken}`;
      }

      const res = await fetch(buildUrl("/api/smartphone"), {
        method: "GET",
        headers: nextHeaders,
      });

      if (!res.ok) throw new Error("Failed to fetch smartphones list");

      const data = await res.json();
      const rows = Array.isArray(data?.smartphones)
        ? data.smartphones
        : Array.isArray(data)
          ? data
          : [];

      const options = rows
        .map(normalizeSmartphoneOption)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      setSmartphoneOptions(options);
    } catch (err) {
      setSmartphoneError(err.message || "Failed to load smartphones");
      setSmartphoneOptions([]);
    } finally {
      setSmartphoneLoading(false);
    }
  };

  useEffect(() => {
    loadSmartphones();
  }, []);

  const applySmartphoneSelection = (option) => {
    if (!option?.id) return;
    setSelectedSmartphoneId(option.id);
    setUrl((prev) => {
      const template = String(prev || "/api/smartphone/:id");
      if (template.includes(":id")) {
        return template.replace(":id", option.id);
      }
      return `/api/smartphone/${option.id}`;
    });

    try {
      const currentBody = body && body.trim() ? JSON.parse(body) : {};
      const nextBody = { ...currentBody };
      if (!nextBody.name && !nextBody.product_name) {
        nextBody.name = option.name;
      }
      if (!nextBody.product_name) {
        nextBody.product_name = option.name;
      }
      if (option.model && !nextBody.model) {
        nextBody.model = option.model;
      }
      setBody(JSON.stringify(nextBody, null, 2));
    } catch {
      setBody(
        JSON.stringify(
          {
            name: option.name,
            product_name: option.name,
            model: option.model || "",
          },
          null,
          2,
        ),
      );
    }
  };

  const normalizeDirectPostPayload = (targetPath, payload) => {
    const target = String(targetPath || "").toLowerCase();
    let source = payload;

    if (Array.isArray(source)) {
      if (source.length === 1) source = source[0];
      else {
        return {
          payload: source,
          error:
            "Response contains an array. Pick a single object response before direct POST.",
        };
      }
    }

    const sourceObj = toObject(source);
    if (Object.keys(sourceObj).length && sourceObj.data) {
      const dataObj = sourceObj.data;
      if (Array.isArray(dataObj)) {
        if (dataObj.length === 1) source = dataObj[0];
      } else if (dataObj && typeof dataObj === "object") {
        source = dataObj;
      }
    }

    if (target.includes("/api/laptops")) {
      const raw = toObject(source);

      if (Array.isArray(raw.laptops)) {
        if (raw.laptops.length === 1) {
          source = raw.laptops[0];
        } else {
          return {
            payload: raw,
            error:
              "The response has multiple laptops. Open one item first, then use direct POST.",
          };
        }
      }

      const row = toObject(source);
      const product = toObject(row.product);
      const laptop = toObject(row.laptop);
      const rowSections = toObject(row.spec_sections);
      const laptopSections = toObject(laptop.spec_sections);
      const canonicalBasicInfo = toObject(row.basic_info);
      const canonicalMetadata = toObject(row.metadata);
      const basicInfo = toObject(
        laptop.basic_info_json || row.basic_info_json || canonicalBasicInfo,
      );

      const inferredName =
        product.name ||
        row.name ||
        row.product_name ||
        canonicalBasicInfo.product_name ||
        canonicalBasicInfo.title ||
        basicInfo.title ||
        basicInfo.model_name ||
        laptop.model ||
        row.model ||
        canonicalBasicInfo.model ||
        null;

      const inferredBrandId = product.brand_id ?? row.brand_id ?? null;

      const topLevelLaptopKeys = [
        "category",
        "brand",
        "model",
        "launch_date",
        "colors",
        "cpu",
        "display",
        "memory",
        "storage",
        "battery",
        "connectivity",
        "ports",
        "multimedia",
        "security",
        "camera",
        "physical",
        "software",
        "features",
        "warranty",
        "basic_info_json",
        "build_design_json",
        "performance_json",
        "memory_json",
        "storage_json",
        "display_json",
        "battery_json",
        "connectivity_json",
        "ports_json",
        "multimedia_json",
        "software_json",
        "security_json",
        "camera_json",
        "physical_json",
        "warranty_json",
        "environmental_json",
        "in_the_box_json",
        "import_details_json",
      ];

      const mergedLaptop = {
        ...rowSections,
        ...laptopSections,
        ...laptop,
      };
      delete mergedLaptop.spec_sections;

      const canonicalSectionMap = [
        ["basic_info", "basic_info"],
        ["performance", "performance"],
        ["display", "display"],
        ["memory", "memory"],
        ["storage", "storage"],
        ["battery", "battery"],
        ["multimedia", "multimedia"],
        ["ports", "ports"],
        ["camera", "camera"],
        ["security", "security"],
        ["physical", "physical"],
        ["software", "software"],
        ["metadata", "metadata"],
      ];

      canonicalSectionMap.forEach(([sourceKey, targetKey]) => {
        if (
          row[sourceKey] !== undefined &&
          mergedLaptop[targetKey] === undefined
        ) {
          mergedLaptop[targetKey] = row[sourceKey];
        }
      });

      topLevelLaptopKeys.forEach((key) => {
        if (row[key] !== undefined && mergedLaptop[key] === undefined) {
          mergedLaptop[key] = row[key];
        }
      });

      return {
        payload: {
          product: {
            ...product,
            name: inferredName,
            brand_id: inferredBrandId,
          },
          laptop: mergedLaptop,
          images: Array.isArray(row.images)
            ? row.images
            : Array.isArray(canonicalMetadata.images)
              ? canonicalMetadata.images
              : [],
          variants: Array.isArray(row.variants)
            ? row.variants
            : Array.isArray(canonicalMetadata.variants)
              ? canonicalMetadata.variants
              : [],
          published:
            typeof row.published === "boolean"
              ? row.published
              : !!row.is_published,
        },
        error: null,
      };
    }

    if (target.includes("/api/smartphones/req")) {
      const raw = toObject(source);
      if (Array.isArray(raw.smartphones)) {
        if (raw.smartphones.length === 1) {
          source = raw.smartphones[0];
        } else {
          return {
            payload: raw,
            error:
              "The response has multiple smartphones. Open one item first, then use direct POST.",
          };
        }
      }

      const row = toObject(source);
      const product = toObject(row.product);
      const basicInfo = toObject(row.basic_info_json);
      const buildDesign = toObject(row.build_design ?? row.build_design_json);
      const normalized = {
        name:
          row.product_name ||
          row.name ||
          product.name ||
          basicInfo.model_name ||
          null,
        brand_name:
          row.brand_name || row.brand || product.brand || row.brand_name || null,
        model: row.model || basicInfo.model || basicInfo.model_number || null,
        category: row.category ?? undefined,
        launch_date: row.launch_date ?? undefined,
        official_preorder_url:
          row.official_preorder_url ?? row.officialPreorderUrl ?? undefined,
        launch_status: row.launch_status ?? row.launchStatus ?? undefined,
        colors:
          Array.isArray(row.colors) && row.colors.length
            ? row.colors
            : Array.isArray(buildDesign.colors)
              ? buildDesign.colors
              : undefined,
        build_design: row.build_design ?? row.build_design_json ?? undefined,
        display: row.display ?? row.display_json ?? undefined,
        performance: row.performance ?? row.performance_json ?? undefined,
        camera: row.camera ?? row.camera_json ?? undefined,
        battery: row.battery ?? row.battery_json ?? undefined,
        connectivity: row.connectivity ?? row.connectivity_json ?? undefined,
        network: row.network ?? row.network_json ?? undefined,
        ports: row.ports ?? row.ports_json ?? row.port_json ?? undefined,
        audio: row.audio ?? row.audio_json ?? undefined,
        multimedia: row.multimedia ?? row.multimedia_json ?? undefined,
        sensors: row.sensors ?? row.sensors_json ?? undefined,
        images: Array.isArray(row.images)
          ? row.images
          : Array.isArray(row.images_json)
            ? row.images_json
            : [],
        variants: Array.isArray(row.variants)
          ? row.variants
          : Array.isArray(row.variants_json)
            ? row.variants_json
            : [],
        published:
          typeof row.published === "boolean"
            ? row.published
            : typeof row.is_published === "boolean"
              ? row.is_published
              : undefined,
      };
      return { payload: normalized, error: null };
    }

    if (target.includes("/api/tvs")) {
      const raw = toObject(source);

      if (Array.isArray(raw.tvs)) {
        if (raw.tvs.length === 1) {
          source = raw.tvs[0];
        } else {
          return {
            payload: raw,
            error:
              "The response has multiple TVs. Open one item first, then use direct POST.",
          };
        }
      }

      const row = toObject(source);
      const product = toObject(row.product);
      const tv = toObject(row.tv);
      const payloadSource = Object.keys(tv).length > 0 ? tv : row;
      const basicInfo = toObject(
        payloadSource.basic_info_json || row.basic_info_json,
      );

      const productName =
        row.product_name ||
        row.name ||
        payloadSource.product_name ||
        product.name ||
        basicInfo.title ||
        payloadSource.model ||
        row.model ||
        null;

      const normalized = {
        product_name: productName,
        brand_id:
          product.brand_id ??
          row.brand_id ??
          payloadSource.brand_id ??
          undefined,
        brand_name:
          row.brand_name ||
          row.brand ||
          payloadSource.brand_name ||
          product.brand ||
          undefined,
        category: payloadSource.category ?? row.category ?? undefined,
        model: payloadSource.model ?? row.model ?? undefined,
        key_specs_json:
          payloadSource.key_specs_json ?? row.key_specs_json ?? undefined,
        basic_info_json:
          payloadSource.basic_info_json ?? row.basic_info_json ?? undefined,
        display_json: payloadSource.display_json ?? row.display_json ?? undefined,
        video_engine_json:
          payloadSource.video_engine_json ?? row.video_engine_json ?? undefined,
        audio_json: payloadSource.audio_json ?? row.audio_json ?? undefined,
        smart_tv_json:
          payloadSource.smart_tv_json ?? row.smart_tv_json ?? undefined,
        gaming_json: payloadSource.gaming_json ?? row.gaming_json ?? undefined,
        ports_json: payloadSource.ports_json ?? row.ports_json ?? undefined,
        connectivity_json:
          payloadSource.connectivity_json ?? row.connectivity_json ?? undefined,
        power_json: payloadSource.power_json ?? row.power_json ?? undefined,
        physical_json:
          payloadSource.physical_json ?? row.physical_json ?? undefined,
        product_details_json:
          payloadSource.product_details_json ??
          row.product_details_json ??
          undefined,
        in_the_box_json:
          payloadSource.in_the_box_json ?? row.in_the_box_json ?? undefined,
        warranty_json:
          payloadSource.warranty_json ?? row.warranty_json ?? undefined,
        images_json: Array.isArray(row.images_json)
          ? row.images_json
          : Array.isArray(row.images)
            ? row.images
            : Array.isArray(payloadSource.images_json)
              ? payloadSource.images_json
              : Array.isArray(payloadSource.images)
                ? payloadSource.images
                : [],
        variants_json: Array.isArray(row.variants_json)
          ? row.variants_json
          : Array.isArray(row.variants)
            ? row.variants
            : Array.isArray(payloadSource.variants_json)
              ? payloadSource.variants_json
              : Array.isArray(payloadSource.variants)
                ? payloadSource.variants
                : [],
      };

      const publishValue =
        row.publish ??
        row.published ??
        row.is_published ??
        payloadSource.publish ??
        payloadSource.published ??
        payloadSource.is_published;

      if (typeof publishValue === "boolean") {
        normalized.publish = publishValue;
      }

      Object.keys(normalized).forEach((key) => {
        if (normalized[key] === undefined) {
          delete normalized[key];
        }
      });

      return { payload: normalized, error: null };
    }

    return { payload: source, error: null };
  };

  const updateHeaderAt = (index, key, value) => {
    setHeaders((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  };

  const updateQueryParamAt = (index, key, value) => {
    setQueryParams((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  };

  const addHeader = () => {
    setHeaders((prev) => [...prev, { key: "", value: "", enabled: true }]);
  };

  const removeHeader = (index) => {
    setHeaders((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const addQueryParam = () => {
    setQueryParams((prev) => [
      ...prev,
      { key: "", value: "", enabled: true, description: "" },
    ]);
  };

  const removeQueryParam = (index) => {
    setQueryParams((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const buildHeadersObject = () => {
    const nextHeaders = {};
    headers
      .filter((header) => header.enabled && header.key.trim())
      .forEach((header) => {
        nextHeaders[header.key] = header.value;
      });

    if (token && token.trim()) {
      nextHeaders.Authorization = `Bearer ${token}`;
    }

    return nextHeaders;
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    queryParams
      .filter((param) => param.enabled && param.key.trim())
      .forEach((param) => {
        params.append(param.key, param.value);
      });
    return params.toString();
  };

  const buildRequestBody = (headersObject) => {
    const rawBody = String(body || "").trim();
    if (!rawBody || bodyMode === "none" || /^(GET|HEAD)$/i.test(method)) {
      return { body: null, headersObject };
    }

    const contentTypeKey = Object.keys(headersObject).find(
      (key) => key.toLowerCase() === "content-type",
    );

    if (bodyMode === "form-data") {
      let parsed;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        throw new Error("Form-data body must be valid JSON.");
      }

      const formData = new FormData();
      Object.entries(toObject(parsed)).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((item) =>
            formData.append(
              key,
              typeof item === "object" ? JSON.stringify(item) : String(item),
            ),
          );
          return;
        }
        formData.append(
          key,
          typeof value === "object" ? JSON.stringify(value) : String(value),
        );
      });

      if (contentTypeKey) {
        delete headersObject[contentTypeKey];
      }

      return { body: formData, headersObject };
    }

    if (bodyMode === "x-www-form-urlencoded") {
      let encoded = rawBody;
      try {
        const parsed = JSON.parse(rawBody);
        const params = new URLSearchParams();
        Object.entries(toObject(parsed)).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (Array.isArray(value)) {
            value.forEach((item) => params.append(key, String(item)));
          } else {
            params.append(
              key,
              typeof value === "object" ? JSON.stringify(value) : String(value),
            );
          }
        });
        encoded = params.toString();
      } catch {
        // Keep raw string input.
      }

      if (!contentTypeKey) {
        headersObject["Content-Type"] = "application/x-www-form-urlencoded";
      }

      return { body: encoded, headersObject };
    }

    if (bodyFormat === "json") {
      try {
        const parsed = JSON.parse(rawBody);
        return { body: JSON.stringify(parsed), headersObject };
      } catch {
        throw new Error("Invalid JSON body.");
      }
    }

    if (!contentTypeKey) {
      headersObject["Content-Type"] =
        bodyFormat === "xml" ? "application/xml" : "text/plain";
    }

    return { body: rawBody, headersObject };
  };

  const appendHistoryEntry = (entry) => {
    setHistory((prev) => [entry, ...prev].slice(0, 20));
  };

  const sendRequest = async () => {
    const startTime = Date.now();
    setLoading(true);
    setResponse(null);
    setError(null);

    const headersObject = buildHeadersObject();
    const queryString = buildQueryString();
    const fullUrl = resolveRequestUrl(url, queryString);

    let requestBody = null;

    try {
      const prepared = buildRequestBody(headersObject);
      requestBody = prepared.body;

      const fetchOptions = {
        method,
        headers: prepared.headersObject,
      };

      if (requestBody && !/^(GET|HEAD)$/i.test(method)) {
        fetchOptions.body = requestBody;
      }

      const res = await fetch(fullUrl, fetchOptions);
      const endTime = Date.now();
      const text = await res.text();

      let parsedResponse = null;
      try {
        parsedResponse = JSON.parse(text);
      } catch {
        parsedResponse = text;
      }

      const responseData = {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries()),
        body: parsedResponse,
        size: text.length,
        time: endTime - startTime,
      };

      setResponse(responseData);
      setResponseTime(endTime - startTime);

      appendHistoryEntry({
        method,
        url: fullUrl,
        status: res.status,
        ok: res.ok,
        timestamp: new Date().toISOString(),
        time: endTime - startTime,
      });
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const postJsonResponseDirectly = async () => {
    if (!response || response.body === undefined || response.body === null) {
      setError("No response JSON available to post.");
      return;
    }

    let payload = response.body;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        setError("Response is not valid JSON. Cannot post directly.");
        return;
      }
    }

    const target = postResponsePath && String(postResponsePath).trim();
    if (!target) {
      setError("API Path is required for posting response JSON.");
      return;
    }

    const normalized = normalizeDirectPostPayload(target, payload);
    if (normalized.error) {
      setError(normalized.error);
      return;
    }

    payload = normalized.payload;
    const targetLower = target.toLowerCase();

    if (targetLower.includes("/api/laptops")) {
      const nextPayload = toObject(payload);
      if (!toObject(nextPayload.product).name) {
        setError(
          "Missing required field: product.name. Open a single laptop response or set body manually.",
        );
        return;
      }
    }

    if (targetLower.includes("/api/smartphones/req")) {
      const nextPayload = toObject(payload);
      const productName = nextPayload.name || nextPayload.product_name;
      const brandName = nextPayload.brand_name || nextPayload.brand;
      if (!productName || !brandName || !nextPayload.model) {
        setError(
          "Missing required fields for smartphone create: name, brand_name, model.",
        );
        return;
      }
    }

    if (targetLower.includes("/api/tvs")) {
      const nextPayload = toObject(payload);
      const product = toObject(nextPayload.product);
      const basicInfo = toObject(nextPayload.basic_info_json);
      const productName =
        nextPayload.product_name ||
        nextPayload.name ||
        product.name ||
        basicInfo.title ||
        nextPayload.model;
      if (!productName) {
        setError(
          "Missing required field for TV create: product_name (or product.name / basic_info_json.title / model).",
        );
        return;
      }
    }

    const startTime = Date.now();
    setPostResponseLoading(true);
    setError(null);

    try {
      const headersObject = { "Content-Type": "application/json" };
      if (token && token.trim()) {
        headersObject.Authorization = `Bearer ${token}`;
      }

      const fullUrl = resolveRequestUrl(target);
      const res = await fetch(fullUrl, {
        method: "POST",
        headers: headersObject,
        body: JSON.stringify(payload),
      });

      const endTime = Date.now();
      const text = await res.text();

      let parsedResponse = null;
      try {
        parsedResponse = JSON.parse(text);
      } catch {
        parsedResponse = text;
      }

      const responseData = {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries()),
        body: parsedResponse,
        size: text.length,
        time: endTime - startTime,
      };

      setResponse(responseData);
      setResponseTime(endTime - startTime);
      setMethod("POST");
      setUrl(target);
      setActiveTab("body");

      appendHistoryEntry({
        method: "POST",
        url: fullUrl,
        status: res.status,
        ok: res.ok,
        timestamp: new Date().toISOString(),
        time: endTime - startTime,
      });
    } catch (err) {
      setError(err.message || "Direct response post failed");
    } finally {
      setPostResponseLoading(false);
    }
  };

  const fillTokenFromCookies = () => {
    const authToken = getAuthToken() || Cookies.get("authToken");
    if (authToken) {
      setToken(authToken);
    }
  };

  const captureCurrentRequest = () => ({
    name: currentRequestTitle,
    method,
    url,
    body,
    headers: headers.map((row) => ({ ...row })),
    queryParams: queryParams.map((row) => ({ ...row })),
    token,
  });

  const savePreset = () => {
    setUserPresets((prev) => [captureCurrentRequest(), ...prev].slice(0, 50));
  };

  const createCollectionFromCurrentRequest = () => {
    setCollections((prev) => [
      {
        name: `Collection ${prev.length + 1}`,
        requests: [captureCurrentRequest()],
      },
      ...prev,
    ].slice(0, 15));
  };

  const deletePreset = (index) => {
    setUserPresets((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const importPresets = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        throw new Error("Import must be a JSON array");
      }

      const normalized = parsed.map((item) => ({
        name: item.name || `${item.method || "GET"} ${item.url || ""}`,
        method: item.method || "GET",
        url: item.url || "",
        body: item.body || "",
        headers: Array.isArray(item.headers) ? item.headers : [],
        queryParams: Array.isArray(item.queryParams) ? item.queryParams : [],
        token: item.token || "",
      }));

      setUserPresets((prev) => [...normalized, ...prev].slice(0, 100));
      setImportText("");
      setShowImportPanel(false);
      setError(null);
    } catch {
      setError("Import failed: invalid JSON format.");
    }
  };

  const copyResponse = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(responseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const downloadResponse = () => {
    if (!response) return;
    const isJson = typeof response.body !== "string";
    const blob = new Blob([responseText], {
      type: isJson ? "application/json" : "text/plain",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `api-response-${Date.now()}.${isJson ? "json" : "txt"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const clearAll = () => {
    setBody("");
    setResponse(null);
    setError(null);
    setHeaders(INITIAL_HEADERS);
    setQueryParams(INITIAL_QUERY_PARAMS);
    setBodyMode("raw");
    setBodyFormat("json");
    setSelectedSmartphoneId("");
    setSmartphoneQuery("");
  };

  const startNewRequest = () => {
    setMethod("GET");
    setUrl("/api/smartphones");
    setBody("");
    setHeaders(INITIAL_HEADERS);
    setQueryParams(INITIAL_QUERY_PARAMS);
    setResponse(null);
    setError(null);
    setActiveTab("body");
    setBodyMode("none");
    setBodyFormat("json");
    setSelectedSmartphoneId("");
    setSmartphoneQuery("");
    setSmartphoneDropdownOpen(false);
  };

  const loadPreset = (preset) => {
    setMethod(preset.method || "GET");
    setUrl(preset.url || "");
    setBody(
      preset.body === undefined
        ? ""
        : typeof preset.body === "string"
          ? preset.body
          : JSON.stringify(preset.body, null, 2),
    );
    setHeaders(
      Array.isArray(preset.headers) && preset.headers.length
        ? preset.headers.map((row) => ({ enabled: true, ...row }))
        : INITIAL_HEADERS,
    );
    setQueryParams(
      Array.isArray(preset.queryParams) && preset.queryParams.length
        ? preset.queryParams.map((row) => ({
            enabled: true,
            description: "",
            ...row,
          }))
        : INITIAL_QUERY_PARAMS,
    );
    if (preset.token) {
      setToken(preset.token);
    }

    const normalizedUrl = normalizeDisplayUrl(preset.url || "");
    const match = normalizedUrl.match(/\/api\/smartphones?\/(\d+)/i);
    setSelectedSmartphoneId(match?.[1] || "");
    setActiveTab("body");
    setBodyMode(preset.body ? "raw" : "none");
    setBodyFormat("json");
    setError(null);
  };

  const loadPresetFromCollections = (preset) => {
    loadPreset(preset);
    if (!isXlViewport) {
      setMobileCollectionsOpen(false);
    }
  };

  const beautifyJson = () => {
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
    } catch {
      // Ignore invalid JSON during beautify.
    }
  };

  const openDocs = () => {
    if (typeof window === "undefined") return;
    window.open(API_BASE, "_blank", "noopener,noreferrer");
  };

  const scrollToHistory = () => {
    historyPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const toggleCollection = (id) => {
    setExpandedCollections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "params") {
      paramsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    if (tabId === "headers") {
      headersSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const activeMethodStyle = METHOD_STYLES[method] || METHOD_STYLES.GET;
  const currentUserName =
    Cookies.get("username") || Cookies.get("user") || "Admin User";
  const currentUserRole = Cookies.get("role") || "Super Admin";
  const totalCollectionItems =
    collectionSections.reduce((sum, section) => sum + section.items.length, 0) +
    userPresets.length;

  const renderCollectionsNavigation = ({
    contentClassName,
    showFooter = false,
  }) => (
    <>
      <div className={contentClassName}>
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            API Collections
          </p>
          <button
            type="button"
            onClick={createCollectionFromCurrentRequest}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
            title="Create collection from current request"
          >
            <FaPlus className="text-xs" />
          </button>
        </div>

        <div className="space-y-1">
          {collectionSections.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleCollection(section.id)}
                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 text-left"
              >
                <p className="truncate text-sm font-semibold text-slate-800">
                  {section.label}
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
                    {section.items.length}
                  </span>
                  <FaChevronDown
                    className={`text-xs text-slate-400 transition ${
                      expandedCollections[section.id] ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {expandedCollections[section.id] ? (
                <div className="space-y-1 pb-2 pl-1">
                  {section.items.length ? (
                    section.items.map((item) => {
                      const isActive =
                        item.method === method &&
                        normalizeComparableUrl(item.url) ===
                          normalizeComparableUrl(url);
                      const methodStyle =
                        METHOD_STYLES[item.method] || METHOD_STYLES.GET;

                      return (
                        <button
                          key={item.requestKey}
                          type="button"
                          onClick={() => loadPresetFromCollections(item)}
                          className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${
                            isActive
                              ? "bg-violet-50 text-violet-700"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`inline-flex min-w-[42px] items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold uppercase ${methodStyle.pill}`}
                          >
                            {item.method}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {item.name}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-400">
                      No requests yet.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => toggleCollection("saved")}
            className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 text-left"
          >
            <p className="truncate text-sm font-semibold text-slate-800">
              Saved Requests
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
                {userPresets.length}
              </span>
              <FaChevronDown
                className={`text-xs text-slate-400 transition ${
                  expandedCollections.saved ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {expandedCollections.saved ? (
            <div className="space-y-1 pb-2 pl-1">
              {userPresets.length ? (
                userPresets.map((preset, index) => {
                  const methodStyle =
                    METHOD_STYLES[preset.method] || METHOD_STYLES.GET;
                  const isActive =
                    preset.method === method &&
                    normalizeComparableUrl(preset.url) ===
                      normalizeComparableUrl(url);
                  return (
                    <div
                      key={`saved-${index}`}
                      className={`flex items-center gap-2 rounded-md px-2 py-2 ${
                        isActive ? "bg-violet-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => loadPresetFromCollections(preset)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span
                          className={`inline-flex min-w-[42px] items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold uppercase ${methodStyle.pill}`}
                        >
                          {preset.method}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-700">
                          {preset.name || preset.url}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePreset(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-400">
                  Save the current request to reuse it later.
                </div>
              )}
            </div>
          ) : null}
        </div>

        {collections.length ? (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => toggleCollection("custom")}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 text-left"
            >
              <p className="truncate text-sm font-semibold text-slate-800">
                Custom Collections
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
                  {collections.length}
                </span>
                <FaChevronDown
                  className={`text-xs text-slate-400 transition ${
                    expandedCollections.custom ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {expandedCollections.custom ? (
              <div className="space-y-2 pl-1">
                {collections.map((collection, collectionIndex) => (
                  <div
                    key={`collection-${collectionIndex}`}
                    className="rounded-md border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {collection.name || `Collection ${collectionIndex + 1}`}
                      </p>
                      <span className="text-xs text-slate-500">
                        {Array.isArray(collection.requests)
                          ? collection.requests.length
                          : 0}
                      </span>
                    </div>
                    {Array.isArray(collection.requests) &&
                    collection.requests.length ? (
                      <div className="mt-2 space-y-1">
                        {collection.requests.map((request, requestIndex) => {
                          const methodStyle =
                            METHOD_STYLES[request.method] || METHOD_STYLES.GET;
                          return (
                            <button
                              key={`collection-${collectionIndex}-${requestIndex}`}
                              type="button"
                              onClick={() => loadPresetFromCollections(request)}
                              className="flex w-full items-center gap-2 rounded-md bg-white px-2 py-2 text-left transition hover:bg-slate-50"
                            >
                              <span
                                className={`inline-flex min-w-[42px] items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold uppercase ${methodStyle.pill}`}
                              >
                                {request.method}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                                {request.name || request.url}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {showFooter ? (
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5e67ff_0%,#8c42ff_100%)] text-sm font-semibold text-white">
                {getUserInitials(currentUserName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {currentUserName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {currentUserRole}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTabSelect("settings")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            >
              <FaCog className="text-sm" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );

  const renderResponsePanel = () => (
    <section className={PANEL_CLASS}>
      <div className={`${PANEL_HEADER_CLASS} flex items-center justify-between`}>
        <h2 className="text-lg font-semibold text-slate-950">Response</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyResponse}
            className={ICON_BUTTON_CLASS}
            title="Copy response"
          >
            <FaCopy className="text-sm" />
          </button>
          <button
            type="button"
            onClick={downloadResponse}
            className={ICON_BUTTON_CLASS}
            title="Download response"
          >
            <FaDownload className="text-sm" />
          </button>
        </div>
      </div>

      {response ? (
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-md border px-3 py-1 text-sm font-semibold ${
                  response.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {response.status}{" "}
                {response.statusText || (response.ok ? "Created" : "Error")}
              </span>
              <span className="text-sm text-slate-500">{response.time} ms</span>
              <span className="text-sm text-slate-500">
                {formatSize(response.size)}
              </span>
            </div>
            <button
              type="button"
              onClick={downloadResponse}
              className="text-sm font-semibold text-[#4C35F2]"
            >
              Save Response
            </button>
          </div>
        </div>
      ) : null}

      <div className="border-b border-slate-200 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0">
            {[
              { id: "pretty", label: "Pretty" },
              { id: "raw", label: "Raw" },
              { id: "preview", label: "Preview" },
              {
                id: "headers",
                label: `Headers (${responseHeaders.length})`,
              },
            ].map((tab) => {
              const active = responseView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setResponseView(tab.id)}
                  className={`${TAB_BUTTON_BASE} shrink-0 ${
                    active
                      ? "border-[#4C35F2] text-[#4C35F2]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="pb-2 sm:pb-0">
            <span className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
              {responseFormatLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#4C35F2] border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500">Sending request...</p>
          </div>
        ) : error && !response ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
              <FaTimesCircle />
              <span>Error</span>
            </div>
            <pre className="mt-3 whitespace-pre-wrap break-words text-sm text-rose-600">
              {error}
            </pre>
          </div>
        ) : response ? (
          <div className="space-y-4">
            {responseView === "headers" ? (
              <div className="rounded-md border border-slate-200 bg-slate-50">
                <div className="max-h-[420px] overflow-auto">
                  {responseHeaders.length ? (
                    <div className="divide-y divide-slate-200">
                      {responseHeaders.map(([key, value]) => (
                        <div
                          key={key}
                          className="grid gap-2 px-4 py-3 sm:grid-cols-[140px_minmax(0,1fr)]"
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                            {key}
                          </span>
                          <span className="break-all text-sm text-slate-700">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-sm text-slate-400">
                      No headers were returned.
                    </div>
                  )}
                </div>
              </div>
            ) : responseView === "preview" ? (
              <div className="space-y-3">
                {previewEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                      {entry.key}
                    </p>
                    <p className="mt-2 break-words text-sm text-slate-700">
                      {formatPreviewValue(entry.value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-slate-200">
                <pre className="max-h-[460px] overflow-auto bg-slate-50 px-4 py-4 text-[13px] leading-6 text-slate-700">
                  {responseText}
                </pre>
              </div>
            )}

            {copied ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Response copied to clipboard.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-slate-400">
            <FaCode className="mx-auto text-3xl" />
            <p className="mt-3 text-base font-medium text-slate-500">
              Response will appear here
            </p>
            <p className="mt-1 text-sm">
              Send a request to inspect payload, headers, and timing.
            </p>
          </div>
        )}
      </div>

      {responseHeaders.length ? (
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Response Headers ({responseHeaders.length})
            </h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {responseHeaders.slice(0, 6).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
              >
                {key}: {String(value).slice(0, 32)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );

  const renderHistoryPanel = () => (
    <section ref={historyPanelRef} className={PANEL_CLASS}>
      <div className={`${PANEL_HEADER_CLASS} flex items-center justify-between`}>
        <h2 className="text-lg font-semibold text-slate-950">Request History</h2>
        <button
          type="button"
          className="text-sm font-semibold text-[#4C35F2]"
        >
          View All History
        </button>
      </div>
      <div className="divide-y divide-slate-200">
        {history.length ? (
          history.map((item, index) => {
            const methodStyle = METHOD_STYLES[item.method] || METHOD_STYLES.GET;
            return (
              <button
                key={`history-${index}`}
                type="button"
                onClick={() => {
                  setMethod(item.method);
                  setUrl(normalizeDisplayUrl(item.url));
                }}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex min-w-[42px] items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold uppercase ${methodStyle.pill}`}
                    >
                      {item.method}
                    </span>
                    <span className="truncate text-sm font-medium text-slate-700">
                      {normalizeDisplayUrl(item.url)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{item.time} ms</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <span
                  className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    item.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {item.status}
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-8 text-sm text-slate-400">
            No requests have been sent in this workspace yet.
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FF]">
      {showImportPanel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Import Requests
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Paste a JSON array of saved request definitions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportPanel(false)}
                className={ICON_BUTTON_CLASS}
              >
                <FaTimesCircle className="text-sm" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                rows={12}
                className={TEXTAREA_CLASS}
                placeholder='[{"name":"Create Mobile","method":"POST","url":"/api/smartphones/req"}]'
              />
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportPanel(false)}
                  className={GHOST_BUTTON_CLASS}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={importPresets}
                  className={PRIMARY_BUTTON_CLASS}
                >
                  <FaUpload className="text-sm" />
                  <span>Import</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="min-h-screen bg-white">
        <div
          className={`grid min-h-screen ${
            isXlViewport ? "xl:grid-cols-[280px_minmax(0,1fr)]" : ""
          }`}
        >
          {isXlViewport ? (
            <aside className="flex min-h-screen flex-col border-r border-slate-200 bg-white">
              {renderCollectionsNavigation({
                contentClassName:
                  "min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0",
                showFooter: true,
              })}
            </aside>
          ) : null}

          <div className="min-w-0 flex min-h-screen flex-col">
            <header className="border-b border-slate-200 px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <FaChevronLeft className="text-sm text-slate-400" />
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                    API Tester
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
                    <div className="leading-tight">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Environment
                      </div>
                      <div className="mt-1 flex items-center gap-2 font-semibold text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {environmentLabel}
                      </div>
                    </div>
                    <FaChevronDown className="text-xs text-slate-400" />
                  </div>

                  <button type="button" onClick={openDocs} className={GHOST_BUTTON_CLASS}>
                    <FaBook className="text-sm" />
                    <span>Docs</span>
                  </button>

                  <button
                    type="button"
                    onClick={scrollToHistory}
                    className={GHOST_BUTTON_CLASS}
                  >
                    <FaHistory className="text-sm" />
                    <span>History</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowImportPanel(true)}
                    className={GHOST_BUTTON_CLASS}
                  >
                    <FaUpload className="text-sm" />
                    <span>Import</span>
                  </button>

                  <button
                    type="button"
                    onClick={startNewRequest}
                    className={PRIMARY_BUTTON_CLASS}
                  >
                    <FaPlus className="text-sm" />
                    <span>New Request</span>
                  </button>
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <main className="min-w-0 space-y-4">
                  {!isXlViewport ? (
                    <section className={PANEL_CLASS}>
                      <button
                        type="button"
                        onClick={() =>
                          setMobileCollectionsOpen((prev) => !prev)
                        }
                        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            API Collections
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            Browse saved endpoints and quick requests
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
                            {totalCollectionItems}
                          </span>
                          <FaChevronDown
                            className={`text-xs text-slate-400 transition ${
                              mobileCollectionsOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {mobileCollectionsOpen ? (
                        <div className="border-t border-slate-200">
                          {renderCollectionsNavigation({
                            contentClassName:
                              "max-h-[55vh] overflow-y-auto px-3 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0",
                            showFooter: false,
                          })}
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  <section className={PANEL_CLASS}>
                    <div className={`${PANEL_HEADER_CLASS} flex flex-col gap-4`}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase ${activeMethodStyle.pill}`}
                          >
                            {method}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h2 className="truncate text-lg font-semibold text-slate-950">
                                {currentRequestTitle}
                              </h2>
                              <span className="h-2 w-2 rounded-full bg-violet-500" />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={savePreset}
                            className={ICON_BUTTON_CLASS}
                            title="Save current request"
                          >
                            <FaPlus className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={createCollectionFromCurrentRequest}
                            className={ICON_BUTTON_CLASS}
                            title="Create collection"
                          >
                            <FaEllipsisH className="text-sm" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
                          <select
                            value={method}
                            onChange={(event) => setMethod(event.target.value)}
                            className="h-11 min-w-[130px] rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#4C35F2]"
                          >
                            {Object.keys(METHOD_STYLES).map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>

                          <div className="relative min-w-0 flex-1">
                            <input
                              type="text"
                              value={url}
                              onChange={(event) => setUrl(event.target.value)}
                              placeholder="Enter API path or full URL"
                              className={`${INPUT_CLASS} pr-11`}
                            />
                            <FaGlobe className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={sendRequest}
                          disabled={loading}
                          className={`${PRIMARY_BUTTON_CLASS} min-w-[120px]`}
                        >
                          <FaPlay className="text-sm" />
                          <span>{loading ? "Sending..." : "Send"}</span>
                        </button>
                      </div>
                    </div>

                    {showSmartphoneSelector ? (
                      <div className="border-b border-slate-200 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Select Mobile Record
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Pick a mobile ID to fill this request path.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={loadSmartphones}
                            disabled={smartphoneLoading}
                            className={GHOST_BUTTON_CLASS}
                          >
                            {smartphoneLoading ? "Loading..." : "Refresh list"}
                          </button>
                        </div>

                        <div className="relative mt-3" ref={smartphoneDropdownRef}>
                          <button
                            type="button"
                            onClick={() =>
                              setSmartphoneDropdownOpen((prev) => !prev)
                            }
                            className="flex h-11 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
                          >
                            <span className="truncate">{selectedSmartphoneLabel}</span>
                            <FaChevronDown
                              className={`text-xs text-slate-400 transition ${
                                smartphoneDropdownOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {smartphoneDropdownOpen ? (
                            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-slate-200 bg-white">
                              <div className="border-b border-slate-200 p-3">
                                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                  <FaSearch className="text-slate-400" />
                                  <input
                                    type="text"
                                    value={smartphoneQuery}
                                    onChange={(event) =>
                                      setSmartphoneQuery(event.target.value)
                                    }
                                    placeholder="Search by name or model"
                                    className="flex-1 bg-transparent outline-none"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {filteredSmartphoneOptions.length ? (
                                  filteredSmartphoneOptions.map((option) => (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => {
                                        applySmartphoneSelection(option);
                                        setSmartphoneDropdownOpen(false);
                                        setSmartphoneQuery("");
                                      }}
                                      className={`flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition ${
                                        option.id === selectedSmartphoneId
                                          ? "bg-violet-50"
                                          : "hover:bg-slate-50"
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                          {option.name}
                                        </p>
                                        {option.model ? (
                                          <p className="mt-1 text-xs text-slate-500">
                                            {option.model}
                                          </p>
                                        ) : null}
                                      </div>
                                      <div className="text-right">
                                        {option.brand ? (
                                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                                            {option.brand}
                                          </p>
                                        ) : null}
                                        <span className="mt-1 inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
                                          {option.id}
                                        </span>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-4 text-sm text-slate-400">
                                    No matches found.
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {smartphoneError ? (
                          <p className="mt-2 text-xs text-rose-600">
                            {smartphoneError}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="border-b border-slate-200 px-4">
                      <div className="flex flex-wrap gap-5">
                        {REQUEST_TABS.map((tab) => {
                          const active = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => handleTabSelect(tab.id)}
                              className={`${TAB_BUTTON_BASE} ${
                                active
                                  ? "border-[#4C35F2] text-[#4C35F2]"
                                  : "border-transparent text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {tab.label}
                              {tab.id === "body" ? (
                                <span className="ml-2 h-2 w-2 rounded-full bg-emerald-500" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      {error ? (
                        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          <div className="flex items-center gap-2 font-semibold">
                            <FaTimesCircle />
                            <span>Request error</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap break-words">
                            {error}
                          </p>
                        </div>
                      ) : null}

                      {activeTab === "body" ? (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                              {BODY_MODE_OPTIONS.map((option) => (
                                <label
                                  key={option.id}
                                  className="inline-flex items-center gap-2"
                                >
                                  <input
                                    type="radio"
                                    name="bodyMode"
                                    value={option.id}
                                    checked={bodyMode === option.id}
                                    onChange={(event) =>
                                      setBodyMode(event.target.value)
                                    }
                                    className="h-4 w-4 border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                                  />
                                  <span>{option.label}</span>
                                </label>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {bodyMode === "raw" ? (
                                <>
                                  <select
                                    value={bodyFormat}
                                    onChange={(event) =>
                                      setBodyFormat(event.target.value)
                                    }
                                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#4C35F2]"
                                  >
                                    <option value="json">JSON</option>
                                    <option value="text">Text</option>
                                    <option value="xml">XML</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={beautifyJson}
                                    className="text-sm font-semibold text-[#4C35F2]"
                                  >
                                    Beautify
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </div>

                          <textarea
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            rows={14}
                            className={`${TEXTAREA_CLASS} min-h-[320px]`}
                            placeholder='{"key":"value"}'
                          />
                        </div>
                      ) : null}

                      {activeTab === "authorization" ? (
                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                              Bearer token
                            </label>
                            <div className="flex flex-col gap-3 md:flex-row">
                              <input
                                type="text"
                                value={token}
                                onChange={(event) => setToken(event.target.value)}
                                placeholder="Bearer token"
                                className={INPUT_CLASS}
                              />
                              <button
                                type="button"
                                onClick={fillTokenFromCookies}
                                className={GHOST_BUTTON_CLASS}
                              >
                                <FaKey className="text-sm" />
                                <span>Fill from Cookies</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {activeTab === "tests" ? (
                        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
                          <h3 className="text-sm font-semibold text-slate-900">
                            Response checks
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            Use the response panel to validate status, payload shape,
                            and headers after each send.
                          </p>
                        </div>
                      ) : null}

                      {activeTab === "settings" ? (
                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                            <h3 className="text-sm font-semibold text-slate-900">
                              Request tools
                            </h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={savePreset}
                                className={GHOST_BUTTON_CLASS}
                              >
                                <FaSave className="text-sm" />
                                <span>Save preset</span>
                              </button>
                              <button
                                type="button"
                                onClick={createCollectionFromCurrentRequest}
                                className={GHOST_BUTTON_CLASS}
                              >
                                <FaPlus className="text-sm" />
                                <span>Add to collection</span>
                              </button>
                              <button
                                type="button"
                                onClick={clearAll}
                                className={GHOST_BUTTON_CLASS}
                              >
                                <FaTrash className="text-sm" />
                                <span>Clear request</span>
                              </button>
                            </div>
                          </div>

                          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                            <h3 className="text-sm font-semibold text-slate-900">
                              Reuse response JSON
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                              Post the latest response body directly into another endpoint.
                            </p>
                            <div className="mt-3 flex flex-col gap-3">
                              <input
                                type="text"
                                value={postResponsePath}
                                onChange={(event) =>
                                  setPostResponsePath(event.target.value)
                                }
                                className={INPUT_CLASS}
                                placeholder="/api/target-endpoint"
                              />
                              <button
                                type="button"
                                onClick={postJsonResponseDirectly}
                                disabled={postResponseLoading}
                                className={PRIMARY_BUTTON_CLASS}
                              >
                                <FaUpload className="text-sm" />
                                <span>
                                  {postResponseLoading
                                    ? "Posting..."
                                    : "Post Response JSON"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {activeTab === "params" ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                          Query parameters are configured in the section below.
                        </div>
                      ) : null}

                      {activeTab === "headers" ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                          Request headers are configured in the section below.
                        </div>
                      ) : null}
                    </div>
                  </section>

                  {!isXlViewport ? (
                    <>
                      {renderResponsePanel()}
                      {renderHistoryPanel()}
                    </>
                  ) : null}

                  <section ref={paramsSectionRef} className={PANEL_CLASS}>
                    <div className={`${PANEL_HEADER_CLASS} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <FaChevronDown className="text-xs text-slate-400" />
                        <h2 className="text-sm font-semibold text-slate-900">
                          Query Parameters
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={addQueryParam}
                        className={ICON_BUTTON_CLASS}
                      >
                        <FaPlus className="text-xs" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-slate-700">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="w-14 px-3 py-3 text-left font-semibold">
                              On
                            </th>
                            <th className="px-3 py-3 text-left font-semibold">
                              Key
                            </th>
                            <th className="px-3 py-3 text-left font-semibold">
                              Value
                            </th>
                            <th className="px-3 py-3 text-left font-semibold">
                              Description
                            </th>
                            <th className="w-14 px-3 py-3 text-left font-semibold" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {queryParams.map((param, index) => (
                            <tr key={`param-${index}`}>
                              <td className="px-3 py-3">
                                <input
                                  type="checkbox"
                                  checked={!!param.enabled}
                                  onChange={(event) =>
                                    updateQueryParamAt(
                                      index,
                                      "enabled",
                                      event.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="text"
                                  value={param.key}
                                  onChange={(event) =>
                                    updateQueryParamAt(
                                      index,
                                      "key",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Key"
                                  className={INPUT_CLASS}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(event) =>
                                    updateQueryParamAt(
                                      index,
                                      "value",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Value"
                                  className={INPUT_CLASS}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="text"
                                  value={param.description || ""}
                                  onChange={(event) =>
                                    updateQueryParamAt(
                                      index,
                                      "description",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Description"
                                  className={INPUT_CLASS}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() => removeQueryParam(index)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section ref={headersSectionRef} className={PANEL_CLASS}>
                    <div className={`${PANEL_HEADER_CLASS} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <FaChevronDown className="text-xs text-slate-400" />
                        <h2 className="text-sm font-semibold text-slate-900">
                          Headers
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={addHeader}
                        className={ICON_BUTTON_CLASS}
                      >
                        <FaPlus className="text-xs" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-slate-700">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="w-14 px-3 py-3 text-left font-semibold">
                              On
                            </th>
                            <th className="px-3 py-3 text-left font-semibold">
                              Key
                            </th>
                            <th className="px-3 py-3 text-left font-semibold">
                              Value
                            </th>
                            <th className="w-14 px-3 py-3 text-left font-semibold" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {headers.map((header, index) => (
                            <tr key={`header-${index}`}>
                              <td className="px-3 py-3">
                                <input
                                  type="checkbox"
                                  checked={!!header.enabled}
                                  onChange={(event) =>
                                    updateHeaderAt(
                                      index,
                                      "enabled",
                                      event.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="text"
                                  value={header.key}
                                  onChange={(event) =>
                                    updateHeaderAt(
                                      index,
                                      "key",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Header name"
                                  className={INPUT_CLASS}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="text"
                                  value={header.value}
                                  onChange={(event) =>
                                    updateHeaderAt(
                                      index,
                                      "value",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Value"
                                  className={INPUT_CLASS}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() => removeHeader(index)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </main>

                {isXlViewport ? (
                  <aside className="space-y-4">
                    {renderResponsePanel()}
                    {renderHistoryPanel()}
                  </aside>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
