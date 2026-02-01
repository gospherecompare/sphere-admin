// components/EditMobile.js - Updated with CreateMobile UI and dropdown logic
import React, { useState, useEffect, useRef, createRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";
import DynamicForm from "./DynamicForm";
import {
  FaMobile,
  FaSave,
  FaTimes,
  FaArrowLeft,
  FaUpload,
  FaCloudUploadAlt,
  FaPlus,
  FaSpinner,
  FaCamera,
  FaBatteryFull,
  FaMicrochip,
  FaDesktop,
  FaMemory,
  FaStar,
  FaWifi,
  FaEdit,
  FaTrash,
  FaLink,
  FaTint,
  FaBars,
  FaChevronDown,
  FaChevronRight,
  FaExclamationTriangle,
  FaPalette,
  FaTags,
  FaBoxOpen,
  FaCog,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaCalendar,
  FaSearch,
  FaTag,
  FaPercent,
  FaSimCard,
} from "react-icons/fa";

const EditMobile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState("build_design");
  const [publishEnabled, setPublishEnabled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandOther, setBrandOther] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [customJsonFields, setCustomJsonFields] = useState({});
  const formRef = useRef(null);

  // Custom dropdown and date picker states
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // Memory and store dropdown states
  const [showRamDropdown, setShowRamDropdown] = useState({});
  const [showStorageDropdown, setShowStorageDropdown] = useState({});
  const [showStoreDropdown, setShowStoreDropdown] = useState({});
  const [ramSearch, setRamSearch] = useState({});
  const [storageSearch, setStorageSearch] = useState({});
  const [storeSearch, setStoreSearch] = useState({});

  // Refs for variant dropdowns
  const ramDropdownRefs = useRef({});
  const storageDropdownRefs = useRef({});
  const storeDropdownRefs = useRef({});
  const [brandsList, setBrandsList] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [memoryOptions, setMemoryOptions] = useState({
    rams: [],
    storages: [],
  });
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    day: new Date().getDate(),
  });

  // Refs for dropdown closing
  const brandDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const datePickerRef = useRef(null);

  const [toasts, setToasts] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    images: true,
    colors: true,
    variants: true,
    specs: true,
    sensors: true,
  });

  // Default form structure
  const defaultFormData = {
    name: "",
    category: "Smart Phone",
    brand: "",
    model: "",
    launch_date: "",
    images: [],
    colors: [],
    variants: [],
    variant_store_prices: [],
    build_design: {},
    display: {},
    performance: {},
    camera: {},
    battery: {},
    connectivity: {},
    network: {},
    sensors: "",
    ports: {},
    audio: {},
    multimedia: {},
    is_foldable: false,
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Months array
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Generate years for dropdown
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2000; year <= currentYear + 2; year++) {
      years.push(year);
    }
    return years.reverse();
  };

  // Generate days based on selected month and year
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Filter brands based on search
  const filteredBrands = brandsList.filter((brand) =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  // Filter categories based on search
  const filteredCategories = categoriesList.filter((category) =>
    category.label.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  // Get selected brand name
  const getSelectedBrandName = () => {
    const selectedBrand = brandsList.find(
      (brand) => brand.name === formData?.brand,
    );
    return selectedBrand ? selectedBrand.name : formData?.brand || "";
  };

  // Get selected category label
  const getSelectedCategoryLabel = () => {
    const selectedCategory = categoriesList.find(
      (cat) => cat.value === formData?.category,
    );
    return selectedCategory ? selectedCategory.label : "";
  };

  // Handle date selection
  const handleDateSelect = () => {
    const dateStr = `${selectedDate.year}-${(selectedDate.month + 1)
      .toString()
      .padStart(2, "0")}-${selectedDate.day.toString().padStart(2, "0")}`;
    setFormData((prev) => ({
      ...prev,
      launch_date: dateStr,
    }));
    setShowDatePicker(false);
  };

  // Handle brand selection
  const handleBrandSelect = (brand) => {
    setFormData((prev) => ({
      ...prev,
      brand: brand.name,
    }));
    setShowBrandDropdown(false);
    setBrandSearch("");
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setFormData((prev) => ({
      ...prev,
      category: category.value,
    }));
    setShowCategoryDropdown(false);
    setCategorySearch("");
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

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Initialize date from form data
  useEffect(() => {
    if (formData?.launch_date) {
      const date = new Date(formData.launch_date);
      setSelectedDate({
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
      });
    }
  }, [formData?.launch_date]);

  const specTabs = [
    { id: "build_design", label: "Build & Design", icon: FaMobile },
    { id: "display", label: "Display", icon: FaDesktop },
    { id: "performance", label: "Performance", icon: FaMicrochip },
    { id: "camera", label: "Camera", icon: FaCamera },
    { id: "battery", label: "Battery", icon: FaBatteryFull },
    { id: "connectivity", label: "Connectivity", icon: FaWifi },
    { id: "network", label: "Network", icon: FaSimCard },
    { id: "ports", label: "Ports", icon: FaMicrochip },
    { id: "audio", label: "Audio", icon: FaMicrochip },
    { id: "multimedia", label: "Multimedia", icon: FaDesktop },
  ];

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = Cookies.get("authToken");
        const res = await fetch(buildUrl("/api/categories"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        let rows = [];
        if (Array.isArray(data)) rows = data;
        else if (data && Array.isArray(data.categories)) rows = data.categories;
        else if (data && Array.isArray(data.data)) rows = data.data;
        else rows = data || [];

        const opts = rows
          .filter((r) => {
            const pt = (r.product_type || r.type || "")
              .toString()
              .toLowerCase();
            return (
              pt === "smartphone" ||
              pt === "mobile" ||
              pt === "phone" ||
              pt.includes("phone")
            );
          })
          .map((r) => ({
            value: r.name || r.value || `cat_${r.id}`,
            label: r.name || r.title || r.value || `Category ${r.id}`,
          }));

        if (opts.length) setCategoriesList(opts);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(buildUrl("/api/brands"));
        if (!res.ok) return;
        const data = await res.json();
        const brandsArray = data.brands || data || [];
        setBrandsList(brandsArray);
      } catch (err) {
        console.error("Failed to fetch brands:", err);
      }
    };
    fetchBrands();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(event.target)
      ) {
        setShowBrandDropdown(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile nav when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileNavOpen &&
        !event.target.closest(".mobile-nav") &&
        !event.target.closest(".mobile-nav-toggle")
      ) {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileNavOpen]);

  // Load mobile data
  useEffect(() => {
    const loadMobileData = async () => {
      if (!id) {
        console.error("No ID provided");
        setError("No mobile ID provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setDataLoaded(false);
      setError(null);

      try {
        const token = Cookies.get("authToken");

        const response = await fetch(buildUrl(`/api/smartphone/${id}`), {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(`Failed to load mobile (${response.status})`);
        }

        const responseData = await response.json();
        const apiData = responseData?.data || responseData;

        if (!apiData || Object.keys(apiData).length === 0) {
          throw new Error("Empty response from server");
        }

        const safeParse = (val, fallback) => {
          if (val === undefined || val === null) return fallback;
          if (Array.isArray(val) || typeof val === "object") return val;
          if (typeof val === "string") {
            try {
              const parsed = JSON.parse(val);
              return parsed;
            } catch (e) {
              return val;
            }
          }
          return val;
        };

        // Normalize variants
        const rawVariants = Array.isArray(apiData?.variants)
          ? apiData.variants
          : [];
        const variants = rawVariants.map((v) => {
          const parsedStorePrices = Array.isArray(v?.store_prices)
            ? v.store_prices
            : safeParse(v?.store_prices, []);

          const stores = (parsedStorePrices || []).map((sp) => ({
            id: sp?.id,
            store_name: sp?.store_name || sp?.store || "",
            price:
              sp?.price !== undefined && sp?.price !== null
                ? String(sp.price)
                : "",
            url: sp?.url || "",
            offer_text: sp?.offer_text || "",
            discount: sp?.discount || "",
            offers: sp?.offers || "",
            custom_properties: sp?.custom_properties || {},
          }));

          return {
            id: v?.id || v?.variant_id || v?.variantId,
            ram: v?.ram || "",
            storage: v?.storage || v?.storage_size || "",
            base_price:
              v?.base_price !== undefined && v?.base_price !== null
                ? String(v.base_price)
                : "",
            color_name: v?.color_name || v?.color || "",
            color_code: v?.color_code || v?.colorCode || "",
            custom_properties: v?.custom_properties || {},
            store_prices: parsedStorePrices,
            stores,
          };
        });

        // Build variant_store_prices
        const variant_store_prices = [];
        variants.forEach((v, idx) => {
          if (Array.isArray(v.store_prices) && v.store_prices.length) {
            v.store_prices.forEach((sp) => {
              const payload = {
                id: sp?.id,
                store_name: sp?.store_name || sp?.store || "",
                price:
                  sp?.price !== undefined && sp?.price !== null
                    ? String(sp.price)
                    : "",
                url: sp?.url || "",
                custom_properties: sp?.custom_properties || {},
              };

              if (v.id) {
                payload.variant_id = v.id;
              } else {
                payload.variant_index = idx;
              }

              variant_store_prices.push(payload);
            });
          }
        });

        // Pre-normalize API JSONB-like sections
        const normalizeSafe = (val) => safeParse(val, {});

        // Merge connectivity/network/connectivity_network into a single object
        const connectivityObj = {
          ...normalizeSafe(apiData?.connectivity_network),
          ...normalizeSafe(apiData?.connectivity),
          ...normalizeSafe(apiData?.network),
        };

        // Helper: if a section contains nested `sphere_rating`, extract its fields
        const extractSphereRating = (section) => {
          try {
            const sec = normalizeSafe(section);
            if (sec && typeof sec === "object" && sec.sphere_rating) {
              const sr = sec.sphere_rating || {};
              const out = { ...sec };
              if (sr.score !== undefined) out.sphere_score = sr.score;
              if (Array.isArray(sr.images)) out.sphere_images = sr.images;
              if (sr.description !== undefined)
                out.sphere_description = sr.description;
              // remove nested key to avoid duplication
              delete out.sphere_rating;
              return out;
            }
            return sec;
          } catch (e) {
            return normalizeSafe(section);
          }
        };

        // Transform API data
        const transformedData = {
          name: apiData?.name || "",
          category: apiData?.category || "Smart Phone",
          brand:
            apiData?.brand || apiData?.brand_name || apiData?.brandName || "",
          model: apiData?.model || "",
          // rating removed
          launch_date: apiData?.launch_date
            ? new Date(apiData.launch_date).toISOString().split("T")[0]
            : "",
          images: Array.isArray(safeParse(apiData?.images, []))
            ? safeParse(apiData?.images, [])
            : [],
          colors:
            Array.isArray(safeParse(apiData?.colors, [])) &&
            safeParse(apiData?.colors, []).length > 0
              ? safeParse(apiData?.colors, []).map((c) => ({
                  id: c?.id || Date.now() + Math.random(),
                  name: c?.name || "",
                  code: c?.code || "#000000",
                }))
              : [],
          variants: variants.map((v) => ({
            id: v.id,
            ram: v.ram || "",
            storage: v.storage || "",
            base_price: v.base_price || "",
            custom_properties: v.custom_properties || {},
            stores: v.stores || [],
          })),
          variant_store_prices: variant_store_prices,
          build_design: extractSphereRating(apiData?.build_design),
          display: extractSphereRating(apiData?.display),
          performance: extractSphereRating(apiData?.performance),
          camera: extractSphereRating(apiData?.camera),
          battery: extractSphereRating(apiData?.battery),
          // populate connectivity and network separately (fallback to merged object)
          connectivity: (function () {
            const c = extractSphereRating(apiData?.connectivity);
            if (c && Object.keys(c).length) return c;
            return extractSphereRating(connectivityObj);
          })(),
          network: (function () {
            const n = extractSphereRating(apiData?.network);
            if (n && Object.keys(n).length) return n;
            return extractSphereRating(connectivityObj);
          })(),
          sensors:
            typeof apiData?.sensors === "string"
              ? apiData.sensors
              : safeParse(apiData?.sensors, ""),
          ports: safeParse(apiData?.ports, {}),
          audio: safeParse(apiData?.audio, {}),
          multimedia: safeParse(apiData?.multimedia, {}),
          is_foldable: apiData?.is_foldable || false,
        };

        // Deduplicate overlapping keys: prefer `connectivity` keys, remove them from `network`
        try {
          const connKeys = Object.keys(transformedData.connectivity || {});
          if (connKeys.length && transformedData.network) {
            connKeys.forEach((k) => {
              if (k in transformedData.network) {
                delete transformedData.network[k];
              }
            });
          }
        } catch (e) {
          // ignore
        }

        // Detect dynamic/custom keys in JSONB objects
        const jsonbFields = [
          "build_design",
          "display",
          "performance",
          "camera",
          "battery",
          "connectivity",
          "network",
          "ports",
          "audio",
          "multimedia",
        ];

        const normalizeKey = (k) =>
          String(k || "")
            .toLowerCase()
            .trim()
            .replace(/[_\s]+/g, "");

        jsonbFields.forEach((field) => {
          const serverObj = safeParse(transformedData[field], {});
          const defaults = getDefaultFields(field) || {};
          const defaultKeys = Object.keys(defaults || {});

          const defMap = {};
          defaultKeys.forEach((dk) => {
            defMap[normalizeKey(dk)] = dk;
          });

          const merged = { ...(defaults || {}) };
          const customKeys = [];

          if (serverObj && typeof serverObj === "object") {
            for (const sk of Object.keys(serverObj)) {
              const sval = serverObj[sk];
              const n = normalizeKey(sk);

              if (
                (sk === "fold" || sk === "flip") &&
                typeof sval === "object"
              ) {
                merged[sk] = { ...(defaults[sk] || {}) };
                const innerDef = defaults[sk] || {};
                const innerDefMap = {};
                Object.keys(innerDef).forEach((ik) => {
                  innerDefMap[normalizeKey(ik)] = ik;
                });
                for (const isk of Object.keys(sval)) {
                  const inv = sval[isk];
                  const inn = normalizeKey(isk);
                  if (innerDefMap[inn]) {
                    merged[sk][innerDefMap[inn]] = inv;
                  } else {
                    merged[sk][isk] = inv;
                    if (!customKeys.includes(isk)) customKeys.push(isk);
                  }
                }
                continue;
              }

              if (defMap[n]) {
                merged[defMap[n]] = sval;
              } else {
                merged[sk] = sval;
                if (!customKeys.includes(sk)) customKeys.push(sk);
              }
            }
          }

          transformedData[field] = merged;
        });

        setFormData(transformedData);

        if (apiData.published !== undefined) {
          setPublishEnabled(apiData.published);
        }

        setDataLoaded(true);
      } catch (err) {
        console.error("Error loading mobile data:", err);
        setError(err.message || "Failed to load mobile data");
        showToast(
          "Error",
          err.message || "Failed to load mobile data",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch auxiliary data
    const fetchAuxiliary = async () => {
      try {
        const token = Cookies.get("authToken");

        // Online stores
        const storesEndpoint = token
          ? buildUrl("/api/online-stores")
          : buildUrl("/api/public/online-stores");
        const storesRes = await fetch(storesEndpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (storesRes.ok) {
          const data = await storesRes.json();
          const rows = (data && (data.data || data.rows || data)) || [];
          const opts = (rows || []).map((r) => ({ id: r.id, name: r.name }));
          setStoresList(opts);
        }

        // RAM/storage options
        const ramRes = await fetch(buildUrl("/api/ram-storage-config"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (ramRes.ok) {
          const d = await ramRes.json();
          const rows = (d && (d.data || d.rows || d)) || [];
          const rams = Array.from(
            new Set(
              (rows || [])
                .map((r) => (r.ram ? String(r.ram).trim() : null))
                .filter(Boolean),
            ),
          ).map((v) => ({ id: v, name: v }));
          const storages = Array.from(
            new Set(
              (rows || [])
                .map((r) => (r.storage ? String(r.storage).trim() : null))
                .filter(Boolean),
            ),
          ).map((v) => ({ id: v, name: v }));
          setMemoryOptions({ rams, storages });
        }
      } catch (err) {
        console.error("Failed to fetch auxiliary data:", err);
      }
    };

    loadMobileData();
    fetchAuxiliary();
  }, [id]);

  // Handle basic input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle smartphone field changes (for consistency with CreateMobile)
  const handleSmartphoneChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle JSONB object changes
  const handleJsonbChange = (field, key, value, group = null) => {
    setFormData((prev) => {
      if (group) {
        return {
          ...prev,
          [field]: {
            ...((prev && prev[field]) || {}),
            [group]: {
              ...(((prev || {})[field] || {})[group] || {}),
              [key]: value,
            },
          },
        };
      }

      return {
        ...prev,
        [field]: {
          ...((prev && prev[field]) || {}),
          [key]: value,
        },
      };
    });
  };

  // Update nested object property (e.g., ports.usb -> { label, value })
  const handleNestedObjectFieldChange = (field, key, innerKey, prop, value) => {
    setFormData((prev) => {
      const section = { ...((prev || {})[field] || {}) };
      const objForKey =
        section[key] && typeof section[key] === "object"
          ? { ...section[key] }
          : {};
      const inner =
        objForKey[innerKey] && typeof objForKey[innerKey] === "object"
          ? { ...objForKey[innerKey] }
          : {};
      inner[prop] = value;
      objForKey[innerKey] = inner;
      section[key] = objForKey;
      return {
        ...prev,
        [field]: section,
      };
    });
  };

  // Update nested primitive value (e.g., camera.rear_camera.main = "50 MP")
  const handlePrimitiveNestedChange = (field, parentKey, innerKey, value) => {
    setFormData((prev) => {
      const section = { ...((prev || {})[field] || {}) };
      const parent =
        section[parentKey] && typeof section[parentKey] === "object"
          ? { ...section[parentKey] }
          : {};
      parent[innerKey] = value;
      section[parentKey] = parent;
      return {
        ...prev,
        [field]: section,
      };
    });
  };

  // Handle array field changes
  const handleArrayFieldChange = (field, index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  // Add new item to array field
  const addArrayFieldItem = (field, defaultItem) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev[field]) ? prev[field] : [];
      return {
        ...prev,
        [field]: [...arr, { ...defaultItem }],
      };
    });
  };

  // Remove item from array field
  const removeArrayFieldItem = (field, index) => {
    setFormData((prev) => {
      const newArr = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: newArr };
    });
  };

  // Clean payload by removing null/empty values and client-only keys
  const cleanPayload = (input) => {
    const clean = (val) => {
      if (val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const s = val.trim();
        return s === "" ? undefined : s;
      }
      if (Array.isArray(val)) {
        const a = val.map(clean).filter((v) => v !== undefined);
        return a.length ? a : undefined;
      }
      if (typeof val === "object") {
        const out = {};
        Object.keys(val).forEach((k) => {
          const v = clean(val[k]);
          if (v !== undefined) out[k] = v;
        });
        return Object.keys(out).length ? out : undefined;
      }
      return val;
    };

    const cleaned = clean(input) || {};

    // For variant_store_prices, drop variant_index when variant_id present
    if (Array.isArray(cleaned.variant_store_prices)) {
      cleaned.variant_store_prices = cleaned.variant_store_prices.map((sp) => {
        if (sp.variant_id) {
          const { variant_index, ...rest } = sp;
          return rest;
        }
        return sp;
      });
    }

    return cleaned;
  };

  // Add color
  const addColor = () => {
    addArrayFieldItem("colors", {
      name: "",
      code: "#cccccc",
    });
    showToast("Color Added", "New color option added", "success");
  };

  // Add variant
  const addVariant = () => {
    addArrayFieldItem("variants", {
      ram: "",
      storage: "",
      base_price: "",
      stores: [],
    });
    showToast("Variant Added", "New variant added", "success");
  };

  // Add store to variant
  const addStoreToVariant = (variantIndex) => {
    setFormData((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...updatedVariants[variantIndex],
        stores: [
          ...(updatedVariants[variantIndex].stores || []),
          {
            store_name: "",
            price: "",
            url: "",
            offer_text: "",
            discount: "",
            offers: "",
          },
        ],
      };
      return { ...prev, variants: updatedVariants };
    });
    showToast("Store Added", "New store added to variant", "success");
  };

  // Handle image upload
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setUploading(true);

    try {
      const uploadedImages = [];
      for (const file of fileList) {
        const data = await uploadToCloudinary(file, "smartphones");
        if (data && data.secure_url) uploadedImages.push(data.secure_url);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));

      showToast(
        "Upload Successful",
        `${uploadedImages.length} image(s) uploaded`,
        "success",
      );
    } catch (error) {
      console.error("Image upload error:", error);
      showToast(
        "Upload Failed",
        error.message || "Error uploading images",
        "error",
      );
    } finally {
      setUploading(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    showToast("Image Removed", "Image removed successfully", "info");
  };

  // Get default fields for each specification category from loaded `formData`
  // Previously this returned hardcoded lists. Now it derives the input keys
  // from the server response (i.e. the object's key/value pairs), so the UI
  // renders fields dynamically based on the data shape.
  const getDefaultFields = (category) => {
    if (!formData || typeof formData !== "object") return {};
    const value = formData[category];
    if (!value || typeof value !== "object") return {};
    // Exclude any custom fields that are rendered separately to avoid duplicates
    const allKeys = Object.keys(value);
    const customKeys = Array.isArray(customJsonFields[category])
      ? customJsonFields[category]
      : [];
    const res = {};
    allKeys.forEach((k) => {
      if (!customKeys.includes(k)) res[k] = value[k];
    });
    return res;
  };

  // Return an array of field descriptors [{ key, label, value }] for UI mapping
  const getDefaultFieldsArray = (category) => {
    const obj = getDefaultFields(category) || {};
    return Object.keys(obj).map((k) => ({
      key: k,
      label: String(k).replace(/_/g, " "),
      value: obj[k],
    }));
  };

  // Add custom field
  const addCustomJsonField = (field) => {
    const fieldName = prompt("Enter field name:");
    if (fieldName && fieldName.trim()) {
      const cleanFieldName = fieldName.trim();
      setCustomJsonFields((prev) => ({
        ...prev,
        [field]: [...(prev[field] || []), cleanFieldName],
      }));
      // initialize custom field as label/value object for consistency
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [cleanFieldName]: { label: cleanFieldName, value: "" },
        },
      }));
      showToast(
        "Field Added",
        `Custom field "${cleanFieldName}" added`,
        "success",
      );
    }
  };

  // Update a custom field's inner property (label or value)
  const handleCustomFieldChange = (field, key, prop, value) => {
    setFormData((prev) => {
      const section = { ...((prev || {})[field] || {}) };
      const item =
        section[key] && typeof section[key] === "object"
          ? { ...section[key] }
          : {};
      item[prop] = value;
      section[key] = item;
      return {
        ...prev,
        [field]: section,
      };
    });
  };

  // Remove custom field
  const removeCustomJsonField = (field, fieldName) => {
    setCustomJsonFields((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((name) => name !== fieldName),
    }));
    setFormData((prev) => {
      const updatedField = { ...prev[field] };
      delete updatedField[fieldName];
      return {
        ...prev,
        [field]: updatedField,
      };
    });
    showToast("Field Removed", `Custom field "${fieldName}" removed`, "info");
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Basic validation
    if (!formData.name.trim()) {
      showToast("Validation Error", "Mobile name is required", "error");
      setIsSaving(false);
      return;
    }

    if (!formData.brand) {
      showToast("Validation Error", "Brand is required", "error");
      setIsSaving(false);
      return;
    }

    if (!formData.model.trim()) {
      showToast("Validation Error", "Model is required", "error");
      setIsSaving(false);
      return;
    }

    try {
      const submitData = {
        id,
        name: formData.name || "",
        category: formData.category || "",
        brand: formData.brand || "",
        model: formData.model || "",
        launch_date: formData.launch_date || null,
        images: formData.images || [],
        colors: formData.colors.filter((color) => color.name && color.code),
        build_design: formData.build_design,
        display: formData.display,
        performance: formData.performance,
        camera: formData.camera,
        battery: formData.battery,
        connectivity: formData.connectivity,
        network: formData.network,
        sensors: formData.sensors || null,
        ports: formData.ports,
        audio: formData.audio,
        multimedia: formData.multimedia,
        is_foldable: formData.is_foldable || false,
        published: publishEnabled,
        // include variants and per-variant store prices so edits persist
        variants: (formData.variants || []).map((v) => ({
          id: v.id || null,
          ram: v.ram || null,
          storage: v.storage || null,
          base_price: v.base_price ? Number(v.base_price) : null,
          custom_properties: v.custom_properties || {},
        })),
        variant_store_prices: (function () {
          const out = [];
          (formData.variants || []).forEach((v, vi) => {
            const stores = Array.isArray(v.stores) ? v.stores : [];
            stores.forEach((s) => {
              out.push({
                id: s.id || null,
                variant_id: v.id || null,
                variant_index: v.id ? undefined : vi,
                store_name: s.store_name || null,
                price: s.price ? Number(s.price) : null,
                url: s.url || null,
                offer_text: s.offer_text || null,
                discount: s.discount || null,
                offers: s.offers || null,
                custom_properties: s.custom_properties || {},
              });
            });
          });
          return out;
        })(),
      };

      const token = Cookies.get("authToken");
      const cleaned = cleanPayload(submitData);
      const res = await fetch(buildUrl(`/api/smartphone/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(cleaned),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server responded ${res.status}`);
      }

      showToast(
        "Success",
        `Mobile "${formData.name}" updated ${
          publishEnabled ? "and published" : "successfully"
        }!`,
        "success",
      );

      // Navigate back after short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error("Update mobile error:", error);
      showToast(
        "Update Failed",
        `Error updating mobile: ${error.message}`,
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Toast Component
  const Toast = ({ toast }) => {
    const bgColor = {
      success: "bg-green-50 border-green-200",
      error: "bg-red-50 border-red-200",
      warning: "bg-yellow-50 border-yellow-200",
      info: "bg-blue-50 border-blue-200",
    };

    const icon = {
      success: <FaCheckCircle className="text-green-500 text-xl" />,
      error: <FaExclamationCircle className="text-red-500 text-xl" />,
      warning: <FaExclamationCircle className="text-yellow-500 text-xl" />,
      info: <FaInfoCircle className="text-blue-500 text-xl" />,
    };

    return (
      <div
        className={`bg-white rounded-lg shadow-lg border p-4 max-w-sm w-full flex items-start space-x-3 ${
          bgColor[toast.type]
        }`}
      >
        {icon[toast.type]}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{toast.title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="text-gray-400 hover:text-gray-600"
        >
          <FaTimesCircle className="text-sm" />
        </button>
      </div>
    );
  };

  // Custom Dropdown Component - Matching CreateMobile
  const CustomDropdown = ({
    value,
    placeholder,
    isOpen,
    setIsOpen,
    searchValue,
    setSearchValue,
    filteredOptions,
    onSelect,
    selectedLabel,
    dropdownRef,
    type = "brand",
    showSearch = true,
  }) => {
    const getKey = () => {
      if (type === "brand") {
        return { valueKey: "id", labelKey: "name" };
      } else if (type === "category") {
        return { valueKey: "value", labelKey: "label" };
      } else if (type === "memory" || type === "store") {
        return { valueKey: "id", labelKey: "name" };
      }
      return { valueKey: "id", labelKey: "name" };
    };

    const getSearchPlaceholder = () => {
      if (type === "memory") return "Search memory...";
      if (type === "store") return "Search stores...";
      if (type === "brand") return "Search brands...";
      return "Search...";
    };

    const { valueKey, labelKey } = getKey();

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setSearchValue("");
          }}
          className={`w-full px-4 py-2.5 border-2 transition-all rounded-lg bg-white text-left flex items-center justify-between ${
            value
              ? "border-blue-400 shadow-sm hover:shadow-md"
              : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
          }`}
        >
          <span
            className={`${
              value ? "text-gray-900 font-medium" : "text-gray-500"
            } truncate text-sm`}
          >
            {selectedLabel || placeholder}
          </span>
          <FaChevronDown
            className={`text-gray-400 text-sm flex-shrink-0 ml-2 ${
              isOpen ? "transform rotate-180" : ""
            } transition-transform duration-200`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white border-2 border-blue-200 rounded-lg shadow-xl overflow-hidden">
            {showSearch && (
              <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-white p-3 border-b-2 border-blue-100">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder={getSearchPlaceholder()}
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => (
                  <button
                    key={option[valueKey]}
                    type="button"
                    onClick={() => onSelect(option)}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-center space-x-3 ${
                      option[valueKey] === value
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-md"
                        : idx % 2 === 0
                          ? "hover:bg-blue-50 text-gray-700"
                          : "hover:bg-blue-100 text-gray-700"
                    } ${idx !== filteredOptions.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <span className="flex-1 truncate text-sm">
                      {option[labelKey]}
                    </span>
                    {option[valueKey] === value && (
                      <span className="flex-shrink-0">
                        <FaCheckCircle className="text-lg" />
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  <p>No {type === "brand" ? "brands" : "categories"} found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try different search term
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add custom fields UI to Camera tab
  const CameraCustomFields = () => {
    const list = customJsonFields.camera || [];
    if (!list.length)
      return (
        <div className="mt-3">
          <button
            onClick={() => addCustomJsonField("camera")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <FaPlus className="text-xs" />
            <span>Add Custom Camera Field</span>
          </button>
        </div>
      );

    return (
      <div className="space-y-3 mt-3">
        {list.map((customField) => {
          const val = formData.camera?.[customField];
          const isObj = val && typeof val === "object" && !Array.isArray(val);
          return (
            <div
              key={customField}
              className="relative p-3 bg-gray-50 rounded-md"
            >
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {String(customField).replace(/_/g, " ")}
              </label>
              {isObj ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={val.label || ""}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          "camera",
                          customField,
                          "label",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={val.value !== undefined ? String(val.value) : ""}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          "camera",
                          customField,
                          "value",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={val || ""}
                  onChange={(e) =>
                    handleJsonbChange("camera", customField, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              )}
              <button
                onClick={() => removeCustomJsonField("camera", customField)}
                className="absolute right-2 top-3 text-red-500 hover:text-red-700"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          );
        })}

        <div>
          <button
            onClick={() => addCustomJsonField("camera")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <FaPlus className="text-xs" />
            <span>Add Custom Camera Field</span>
          </button>
        </div>
      </div>
    );
  };

  // Camera Specs Input Component
  const CameraSpecsInput = () => {
    const cameraData = formData.camera || {};

    const cameraCategories = [
      { key: "rear_camera", label: "Rear Camera" },
      { key: "front_camera", label: "Front Camera" },
    ];

    const cameraProperties = [
      "main",
      "ultra_wide",
      "telephoto",
      "macro",
      "depth",
      "thermal",
      "periscope",
    ];

    const handleCameraChange = (category, property, value) => {
      const categoryData =
        (cameraData[category] && typeof cameraData[category] === "object"
          ? { ...cameraData[category] }
          : {}) || {};

      categoryData[property] = value || null;

      if (!categoryData[property]) {
        delete categoryData[property];
      }

      setFormData((prev) => ({
        ...prev,
        camera: {
          ...cameraData,
          [category]: Object.keys(categoryData).length ? categoryData : null,
        },
      }));
    };

    return (
      <div className="space-y-4">
        {cameraCategories.map((category) => (
          <div
            key={category.key}
            className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaCamera className="text-blue-600" />
              {category.label}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cameraProperties.map((prop) => (
                <div key={prop}>
                  <label className="block text-xs font-medium text-gray-600 mb-2 capitalize">
                    {prop.replace(/_/g, " ")}
                  </label>
                  <input
                    type="text"
                    value={
                      (cameraData[category.key] &&
                        cameraData[category.key][prop]) ||
                      ""
                    }
                    onChange={(e) =>
                      handleCameraChange(category.key, prop, e.target.value)
                    }
                    placeholder={`e.g., 50 MP, f/1.8`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              ))}

              {/* Other camera specs */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Video Recording
                </label>
                <input
                  type="text"
                  value={cameraData[category.key]?.video_recording || ""}
                  onChange={(e) =>
                    handleCameraChange(
                      category.key,
                      "video_recording",
                      e.target.value,
                    )
                  }
                  placeholder={`e.g., 8K@30fps, 4K@60fps`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Features
                </label>
                <input
                  type="text"
                  value={cameraData[category.key]?.features || ""}
                  onChange={(e) =>
                    handleCameraChange(category.key, "features", e.target.value)
                  }
                  placeholder={`e.g., OIS, HDR, Night mode`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Other camera properties */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white">
          <h3 className="font-semibold text-gray-800 mb-4">Camera Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                AI Features
              </label>
              <input
                type="text"
                value={cameraData.ai_features || ""}
                onChange={(e) =>
                  handleJsonbChange("camera", "ai_features", e.target.value)
                }
                placeholder={`e.g., Object detection, Scene recognition`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Slow Motion
              </label>
              <input
                type="text"
                value={cameraData.slow_motion || ""}
                onChange={(e) =>
                  handleJsonbChange("camera", "slow_motion", e.target.value)
                }
                placeholder={`e.g., 240fps @ 1080p, 960fps @ 720p`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Audio Specs Input Component
  const AudioSpecsInput = () => {
    const audioData = formData.audio || {};

    const handleAudioChange = (key, value) => {
      handleJsonbChange("audio", key, value);
    };

    return (
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-white">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaMicrochip className="text-green-600" />
            Speaker Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Speaker Type
              </label>
              <input
                type="text"
                value={audioData.speaker_type || ""}
                onChange={(e) =>
                  handleAudioChange("speaker_type", e.target.value)
                }
                placeholder={`e.g., Stereo, Mono, Quad speakers`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Speaker Count
              </label>
              <input
                type="text"
                value={audioData.speaker_count || ""}
                onChange={(e) =>
                  handleAudioChange("speaker_count", e.target.value)
                }
                placeholder={`e.g., Dual, Quad, Single`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Max Volume
              </label>
              <input
                type="text"
                value={audioData.max_volume || ""}
                onChange={(e) =>
                  handleAudioChange("max_volume", e.target.value)
                }
                placeholder={`e.g., 85 dB`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Audio Jack
              </label>
              <input
                type="text"
                value={audioData.audio_jack || ""}
                onChange={(e) =>
                  handleAudioChange("audio_jack", e.target.value)
                }
                placeholder={`e.g., 3.5mm, None`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-indigo-50 to-white">
          <h3 className="font-semibold text-gray-800 mb-4">Audio Features</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Audio Codecs
              </label>
              <input
                type="text"
                value={audioData.audio_codecs || ""}
                onChange={(e) =>
                  handleAudioChange("audio_codecs", e.target.value)
                }
                placeholder={`e.g., MP3, AAC, FLAC, Dolby Atmos`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Microphone Count
              </label>
              <input
                type="text"
                value={audioData.microphone_count || ""}
                onChange={(e) =>
                  handleAudioChange("microphone_count", e.target.value)
                }
                placeholder={`e.g., Dual, Quad, Single`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Microphone Features
              </label>
              <input
                type="text"
                value={audioData.microphone_features || ""}
                onChange={(e) =>
                  handleAudioChange("microphone_features", e.target.value)
                }
                placeholder={`e.g., Noise cancellation, Directional`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Surround Sound
              </label>
              <input
                type="text"
                value={audioData.surround_sound || ""}
                onChange={(e) =>
                  handleAudioChange("surround_sound", e.target.value)
                }
                placeholder={`e.g., Dolby Atmos, Spatial Audio`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add custom fields UI to Audio tab
  const AudioCustomFields = () => {
    const list = customJsonFields.audio || [];
    if (!list.length)
      return (
        <div className="mt-3">
          <button
            onClick={() => addCustomJsonField("audio")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <FaPlus className="text-xs" />
            <span>Add Custom Audio Field</span>
          </button>
        </div>
      );

    return (
      <div className="space-y-3 mt-3">
        {list.map((customField) => {
          const val = formData.audio?.[customField];
          const isObj = val && typeof val === "object" && !Array.isArray(val);
          return (
            <div
              key={customField}
              className="relative p-3 bg-gray-50 rounded-md"
            >
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {String(customField).replace(/_/g, " ")}
              </label>
              {isObj ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={val.label || ""}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          "audio",
                          customField,
                          "label",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={val.value !== undefined ? String(val.value) : ""}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          "audio",
                          customField,
                          "value",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={val || ""}
                  onChange={(e) =>
                    handleJsonbChange("audio", customField, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              )}
              <button
                onClick={() => removeCustomJsonField("audio", customField)}
                className="absolute right-2 top-3 text-red-500 hover:text-red-700"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          );
        })}

        <div>
          <button
            onClick={() => addCustomJsonField("audio")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <FaPlus className="text-xs" />
            <span>Add Custom Audio Field</span>
          </button>
        </div>
      </div>
    );
  };

  // Multimedia Specs Input Component
  const MultimediaSpecsInput = () => {
    const multimediaData = formData.multimedia || {};

    const handleMultimediaChange = (key, value) => {
      handleJsonbChange("multimedia", key, value);
    };

    return (
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-pink-50 to-white">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaDesktop className="text-pink-600" />
            Video Recording & Playback
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Max Recording Resolution
              </label>
              <input
                type="text"
                value={multimediaData.max_recording_resolution || ""}
                onChange={(e) =>
                  handleMultimediaChange(
                    "max_recording_resolution",
                    e.target.value,
                  )
                }
                placeholder={`e.g., 8K@30fps`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Video Codecs
              </label>
              <input
                type="text"
                value={multimediaData.video_codecs || ""}
                onChange={(e) =>
                  handleMultimediaChange("video_codecs", e.target.value)
                }
                placeholder={`e.g., H.264, H.265, VP9`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Video Stabilization
              </label>
              <input
                type="text"
                value={multimediaData.video_stabilization || ""}
                onChange={(e) =>
                  handleMultimediaChange("video_stabilization", e.target.value)
                }
                placeholder={`e.g., EIS, OIS, Both`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Max Playback Resolution
              </label>
              <input
                type="text"
                value={multimediaData.max_playback_resolution || ""}
                onChange={(e) =>
                  handleMultimediaChange(
                    "max_playback_resolution",
                    e.target.value,
                  )
                }
                placeholder={`e.g., 8K`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-cyan-50 to-white">
          <h3 className="font-semibold text-gray-800 mb-4">
            Media Formats & Features
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Supported Image Formats
              </label>
              <input
                type="text"
                value={multimediaData.image_formats || ""}
                onChange={(e) =>
                  handleMultimediaChange("image_formats", e.target.value)
                }
                placeholder={`e.g., JPEG, PNG, RAW, HEIF`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Supported Audio Formats
              </label>
              <input
                type="text"
                value={multimediaData.audio_formats || ""}
                onChange={(e) =>
                  handleMultimediaChange("audio_formats", e.target.value)
                }
                placeholder={`e.g., MP3, AAC, FLAC, WAV`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Supported Video Formats
              </label>
              <input
                type="text"
                value={multimediaData.video_formats || ""}
                onChange={(e) =>
                  handleMultimediaChange("video_formats", e.target.value)
                }
                placeholder={`e.g., MP4, WebM, MKV`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Streaming Apps
              </label>
              <input
                type="text"
                value={multimediaData.streaming_apps || ""}
                onChange={(e) =>
                  handleMultimediaChange("streaming_apps", e.target.value)
                }
                placeholder={`e.g., Netflix, Prime Video, YouTube`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Special Features
              </label>
              <input
                type="text"
                value={multimediaData.special_features || ""}
                onChange={(e) =>
                  handleMultimediaChange("special_features", e.target.value)
                }
                placeholder={`e.g., HDR10, Refresh rate support, Gaming mode`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add custom fields UI to Multimedia tab
  const MultimediaCustomFields = () => {
    const list = customJsonFields.multimedia || [];
    if (!list.length)
      return (
        <div className="mt-3">
          <button
            onClick={() => addCustomJsonField("multimedia")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <FaPlus className="text-xs" />
            <span>Add Custom Multimedia Field</span>
          </button>
        </div>
      );

    return (
      <div className="space-y-3 mt-3">
        {list.map((customField) => {
          const val = formData.multimedia?.[customField];
          const isObj = val && typeof val === "object" && !Array.isArray(val);
          return (
            <div
              key={customField}
              className="relative p-3 bg-gray-50 rounded-md"
            >
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {String(customField).replace(/_/g, " ")}
              </label>
              {isObj ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={val.label || ""}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          "multimedia",
                          customField,
                          "label",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={val.value !== undefined ? String(val.value) : ""}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          "multimedia",
                          customField,
                          "value",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={val || ""}
                  onChange={(e) =>
                    handleJsonbChange("multimedia", customField, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              )}
              <button
                onClick={() => removeCustomJsonField("multimedia", customField)}
                className="absolute right-2 top-3 text-red-500 hover:text-red-700"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          );
        })}

        <div>
          <button
            onClick={() => addCustomJsonField("multimedia")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <FaPlus className="text-xs" />
            <span>Add Custom Multimedia Field</span>
          </button>
        </div>
      </div>
    );
  };

  // Custom Date Picker Component with Calendar Grid - Matching CreateMobile
  const DatePicker = () => {
    const daysInMonth = getDaysInMonth(selectedDate.year, selectedDate.month);
    const firstDay = new Date(
      selectedDate.year,
      selectedDate.month,
      1,
    ).getDay();
    const today = new Date();
    const isToday = (day) =>
      day === today.getDate() &&
      selectedDate.month === today.getMonth() &&
      selectedDate.year === today.getFullYear();

    // Generate calendar days
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    const handlePrevMonth = () => {
      setSelectedDate((prev) => {
        if (prev.month === 0) {
          return { ...prev, month: 11, year: prev.year - 1 };
        }
        return { ...prev, month: prev.month - 1 };
      });
    };

    const handleNextMonth = () => {
      setSelectedDate((prev) => {
        if (prev.month === 11) {
          return { ...prev, month: 0, year: prev.year + 1 };
        }
        return { ...prev, month: prev.month + 1 };
      });
    };

    const handleDaySelect = (day) => {
      if (day) {
        setSelectedDate((prev) => ({ ...prev, day }));
      }
    };

    const handleToday = () => {
      setSelectedDate({
        year: today.getFullYear(),
        month: today.getMonth(),
        day: today.getDate(),
      });
    };

    return (
      <div className="relative" ref={datePickerRef}>
        <button
          type="button"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`w-full px-4 py-2.5 border-2 transition-all rounded-lg bg-white text-left flex items-center justify-between ${
            formData.launch_date
              ? "border-blue-400 shadow-sm"
              : "border-gray-300 hover:border-gray-400"
          } hover:shadow-md`}
        >
          <div className="flex items-center space-x-3">
            <FaCalendar
              className={`text-lg ${formData.launch_date ? "text-blue-500" : "text-gray-400"}`}
            />
            <div>
              <span
                className={`block font-medium ${
                  formData.launch_date ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {formData.launch_date
                  ? new Date(formData.launch_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Select Launch Date"}
              </span>
              {formData.launch_date && (
                <span className="text-xs text-gray-500">
                  {new Date(formData.launch_date).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </span>
              )}
            </div>
          </div>
          <FaChevronDown
            className={`text-gray-400 text-lg ${
              showDatePicker ? "transform rotate-180" : ""
            } transition-transform duration-300`}
          />
        </button>

        {showDatePicker && (
          <div className="absolute z-50 mt-2 w-96 bg-white border-2 border-blue-200 rounded-xl shadow-2xl p-5 backdrop-blur-sm bg-opacity-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-4 mb-4 text-white">
              <h3 className="text-lg font-bold text-center">
                {months[selectedDate.month]} {selectedDate.year}
              </h3>
              <p className="text-center text-blue-100 text-sm mt-1">
                {selectedDate.day
                  ? `${selectedDate.day} ${months[selectedDate.month]} ${selectedDate.year}`
                  : "Pick a date"}
              </p>
            </div>

            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-gray-700 font-bold"
              >
                <FaChevronDown className="transform rotate-90 text-lg" />
              </button>

              <div className="flex gap-3">
                <select
                  value={selectedDate.month}
                  onChange={(e) =>
                    setSelectedDate((prev) => ({
                      ...prev,
                      month: parseInt(e.target.value),
                    }))
                  }
                  className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500 bg-white hover:border-blue-400 transition-colors"
                >
                  {months.map((month, idx) => (
                    <option key={month} value={idx}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDate.year}
                  onChange={(e) =>
                    setSelectedDate((prev) => ({
                      ...prev,
                      year: parseInt(e.target.value),
                    }))
                  }
                  className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500 bg-white hover:border-blue-400 transition-colors"
                >
                  {generateYears().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-gray-700 font-bold"
              >
                <FaChevronDown className="transform -rotate-90 text-lg" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-bold text-gray-600 py-2 bg-gray-50 rounded-md"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-5">
              {calendarDays.map((day, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  disabled={!day}
                  className={`w-full aspect-square rounded-lg text-sm font-semibold transition-all transform ${
                    !day
                      ? "text-transparent cursor-default"
                      : isToday(day)
                        ? "bg-amber-100 text-amber-900 border-2 border-amber-400 shadow-md"
                        : day === selectedDate.day
                          ? "bg-blue-600 text-white shadow-lg scale-105"
                          : "text-gray-700 bg-gray-50 hover:bg-blue-50 hover:border-2 hover:border-blue-300 hover:scale-105"
                  } disabled:cursor-default`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Today & Action Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-300"
              >
                Today
              </button>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="px-4 py-1.5 text-sm font-semibold border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDateSelect}
                  className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <FaSpinner className="animate-spin text-6xl text-blue-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Loading Mobile Details...
            </h2>
            <p className="text-gray-600">Please wait while we fetch the data</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-md border border-red-200 p-6 md:p-8 text-center">
          <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Mobile
          </h2>
          <p className="text-gray-600 mb-2">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all duration-200"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition-all duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Edit Mobile
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Update {formData?.name || "smartphone"} details
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium text-xs sm:text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {isSaving ? (
                <FaSpinner className="animate-spin text-sm" />
              ) : (
                <FaSave className="text-sm" />
              )}
              <span className="hidden sm:inline">
                {isSaving ? "Updating..." : "Update Mobile"}
              </span>
              <span className="sm:hidden">{isSaving ? "..." : "Update"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Basic Information Section */}
        <div className="bg-white rounded-lg shadow-md">
          <button
            onClick={() => toggleSection("basic")}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaMobile className="text-blue-600 text-sm" />
              </div>
              <div className="text-left min-w-0">
                <h2 className="font-semibold text-sm sm:text-base text-gray-800">
                  Basic Information
                </h2>
                <p className="text-xs text-gray-600 hidden sm:block">
                  Name, brand, model and category
                </p>
              </div>
            </div>
            {expandedSections.basic ? (
              <FaChevronDown className="text-sm flex-shrink-0 ml-2" />
            ) : (
              <FaChevronRight className="text-sm flex-shrink-0 ml-2" />
            )}
          </button>

          {expandedSections.basic && (
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Mobile Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., iPhone 15 Pro Max"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <CustomDropdown
                    value={formData.brand}
                    placeholder="Select Brand"
                    isOpen={showBrandDropdown}
                    setIsOpen={setShowBrandDropdown}
                    searchValue={brandSearch}
                    setSearchValue={setBrandSearch}
                    filteredOptions={filteredBrands}
                    onSelect={handleBrandSelect}
                    selectedLabel={getSelectedBrandName()}
                    dropdownRef={brandDropdownRef}
                    type="brand"
                    showSearch={true}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., A3103"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <CustomDropdown
                    value={formData.category}
                    placeholder="Select Category"
                    isOpen={showCategoryDropdown}
                    setIsOpen={setShowCategoryDropdown}
                    searchValue={categorySearch}
                    setSearchValue={setCategorySearch}
                    filteredOptions={filteredCategories}
                    onSelect={handleCategorySelect}
                    selectedLabel={getSelectedCategoryLabel()}
                    dropdownRef={categoryDropdownRef}
                    type="category"
                    showSearch={true}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Launch Date
                  </label>
                  <DatePicker />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Images Section */}
        <div className="bg-white rounded-lg shadow-md">
          <button
            onClick={() => toggleSection("images")}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaCamera className="text-purple-600 text-sm" />
              </div>
              <div className="text-left min-w-0">
                <h2 className="font-semibold text-sm sm:text-base text-gray-800">
                  Images
                </h2>
                <p className="text-xs text-gray-600 hidden sm:block">
                  {formData.images.length} images uploaded
                </p>
              </div>
            </div>
            {expandedSections.images ? (
              <FaChevronDown className="text-sm flex-shrink-0 ml-2" />
            ) : (
              <FaChevronRight className="text-sm flex-shrink-0 ml-2" />
            )}
          </button>

          {expandedSections.images && (
            <div className="p-3 sm:p-4">
              {formData.images.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((src, idx) => (
                      <div key={idx} className="relative">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 border border-gray-200 rounded-md overflow-hidden">
                          <img
                            src={src}
                            alt={`img-${idx}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) handleImageUpload(files);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-400 transition-colors">
                  <FaCamera className="text-gray-400 text-lg sm:text-xl mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">
                    {uploading ? "Uploading..." : "Click to upload images"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colors Section with name and color picker */}
        <div className="bg-white rounded-lg shadow-md">
          <button
            onClick={() => toggleSection("colors")}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaPalette className="text-pink-600 text-sm" />
              </div>
              <div className="text-left min-w-0">
                <h2 className="font-semibold text-sm sm:text-base text-gray-800">
                  Colors
                </h2>
                <p className="text-xs text-gray-600 hidden sm:block">
                  {formData.colors.length} colors added
                </p>
              </div>
            </div>
            {expandedSections.colors ? (
              <FaChevronDown className="text-sm flex-shrink-0 ml-2" />
            ) : (
              <FaChevronRight className="text-sm flex-shrink-0 ml-2" />
            )}
          </button>

          {expandedSections.colors && (
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <button
                onClick={addColor}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <FaPlus className="text-sm" />
                <span>Add Color</span>
              </button>

              {formData.colors.map((color, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 bg-gray-50 rounded-md space-y-3 sm:space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">
                      Color #{index + 1}
                    </h4>
                    <button
                      onClick={() => removeArrayFieldItem("colors", index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Color Name
                      </label>
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => {
                          handleArrayFieldChange(
                            "colors",
                            index,
                            "name",
                            e.target.value,
                          );
                        }}
                        placeholder="e.g., Midnight Black, Alpine Green"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Color Code
                      </label>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: color.code }}
                        />
                        <input
                          type="color"
                          value={color.code}
                          onChange={(e) => {
                            handleArrayFieldChange(
                              "colors",
                              index,
                              "code",
                              e.target.value,
                            );
                          }}
                          className="flex-1 h-10 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants Section with updated store fields */}
        <div className="bg-white rounded-lg shadow-md">
          <button
            onClick={() => toggleSection("variants")}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaBoxOpen className="text-green-600 text-sm" />
              </div>
              <div className="text-left min-w-0">
                <h2 className="font-semibold text-sm sm:text-base text-gray-800">
                  Variants & Stores
                </h2>
                <p className="text-xs text-gray-600 hidden sm:block">
                  {formData.variants.length} variants added
                </p>
              </div>
            </div>
            {expandedSections.variants ? (
              <FaChevronDown className="text-sm flex-shrink-0 ml-2" />
            ) : (
              <FaChevronRight className="text-sm flex-shrink-0 ml-2" />
            )}
          </button>

          {expandedSections.variants && (
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <button
                onClick={addVariant}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <FaPlus className="text-sm" />
                <span>Add Variant</span>
              </button>

              {formData.variants.map((variant, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800 text-sm sm:text-base">
                      Variant #{index + 1}
                    </h3>
                    <button
                      onClick={() => removeArrayFieldItem("variants", index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        RAM
                      </label>
                      <input
                        type="text"
                        value={variant.ram || ""}
                        onChange={(e) => {
                          handleArrayFieldChange(
                            "variants",
                            index,
                            "ram",
                            e.target.value,
                          );
                        }}
                        placeholder="e.g., 8GB"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Storage
                      </label>
                      <input
                        type="text"
                        value={variant.storage || ""}
                        onChange={(e) => {
                          handleArrayFieldChange(
                            "variants",
                            index,
                            "storage",
                            e.target.value,
                          );
                        }}
                        placeholder="e.g., 128GB"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Base Price (₹)
                      </label>
                      <input
                        type="number"
                        value={variant.base_price ?? ""}
                        onChange={(e) => {
                          handleArrayFieldChange(
                            "variants",
                            index,
                            "base_price",
                            e.target.value,
                          );
                        }}
                        placeholder="e.g., 59999"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        Stores
                      </h4>
                      <button
                        onClick={() => addStoreToVariant(index)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <FaPlus className="text-xs" />
                        Add Store
                      </button>
                    </div>

                    {(variant.stores || []).map((store, storeIndex) => (
                      <div
                        key={storeIndex}
                        className="p-3 bg-gray-50 rounded-md mb-3"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Store Name
                            </label>
                            <CustomDropdown
                              value={store.store_name || ""}
                              placeholder="Select Store"
                              isOpen={
                                showStoreDropdown[`${index}-${storeIndex}`] ||
                                false
                              }
                              setIsOpen={(val) =>
                                setShowStoreDropdown((prev) => ({
                                  ...prev,
                                  [`${index}-${storeIndex}`]: val,
                                }))
                              }
                              searchValue={
                                storeSearch[`${index}-${storeIndex}`] || ""
                              }
                              setSearchValue={(val) =>
                                setStoreSearch((prev) => ({
                                  ...prev,
                                  [`${index}-${storeIndex}`]: val,
                                }))
                              }
                              filteredOptions={(storesList || []).filter(
                                (opt) =>
                                  opt.name
                                    .toLowerCase()
                                    .includes(
                                      (
                                        storeSearch[`${index}-${storeIndex}`] ||
                                        ""
                                      ).toLowerCase(),
                                    ),
                              )}
                              onSelect={(opt) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].stores[storeIndex] = {
                                  ...newVariants[index].stores[storeIndex],
                                  store_name: opt.name,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: newVariants,
                                }));
                                setShowStoreDropdown((prev) => ({
                                  ...prev,
                                  [`${index}-${storeIndex}`]: false,
                                }));
                              }}
                              selectedLabel={
                                storesList?.find(
                                  (s) => s.name === store.store_name,
                                )?.name || ""
                              }
                              dropdownRef={
                                storeDropdownRefs.current[
                                  `${index}-${storeIndex}`
                                ] ||
                                (storeDropdownRefs.current[
                                  `${index}-${storeIndex}`
                                ] = createRef())
                              }
                              type="store"
                              showSearch={true}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              value={store.price ?? ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].stores[storeIndex] = {
                                  ...newVariants[index].stores[storeIndex],
                                  price: e.target.value,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: newVariants,
                                }));
                              }}
                              placeholder="Actual price"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              <FaTag className="inline mr-1 text-gray-400" />
                              Discount (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={store.discount ?? ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].stores[storeIndex] = {
                                  ...newVariants[index].stores[storeIndex],
                                  discount: e.target.value,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: newVariants,
                                }));
                              }}
                              placeholder="e.g., 15"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              <FaPercent className="inline mr-1 text-gray-400" />
                              Special Offers
                            </label>
                            <input
                              type="text"
                              value={store.offers ?? ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].stores[storeIndex] = {
                                  ...newVariants[index].stores[storeIndex],
                                  offers: e.target.value,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: newVariants,
                                }));
                              }}
                              placeholder="e.g., Bank Offer, Exchange Bonus"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Affiliate URL
                            </label>
                            <input
                              type="url"
                              value={store.url ?? ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].stores[storeIndex] = {
                                  ...newVariants[index].stores[storeIndex],
                                  url: e.target.value,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: newVariants,
                                }));
                              }}
                              placeholder="https://affiliate-link.com/product"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Offer Text
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={store.offer_text ?? ""}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].stores[storeIndex] = {
                                    ...newVariants[index].stores[storeIndex],
                                    offer_text: e.target.value,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: newVariants,
                                  }));
                                }}
                                placeholder="e.g., Limited time offer"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <button
                                onClick={() => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].stores = newVariants[
                                    index
                                  ].stores.filter((_, i) => i !== storeIndex);
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: newVariants,
                                  }));
                                }}
                                className="text-red-500 hover:text-red-700 ml-2"
                                title="Remove store"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Specifications Section with updated connectivity fields */}
        <div className="bg-white rounded-lg shadow-md">
          <button
            onClick={() => toggleSection("specs")}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaMicrochip className="text-orange-600 text-sm" />
              </div>
              <div className="text-left min-w-0">
                <h2 className="font-semibold text-sm sm:text-base text-gray-800">
                  Technical Specifications
                </h2>
                <p className="text-xs text-gray-600 hidden sm:block">
                  Configure all technical details
                </p>
              </div>
            </div>
            {expandedSections.specs ? (
              <FaChevronDown className="text-sm flex-shrink-0 ml-2" />
            ) : (
              <FaChevronRight className="text-sm flex-shrink-0 ml-2" />
            )}
          </button>

          {expandedSections.specs && (
            <div className="p-3 sm:p-4">
              {/* Specification Tabs */}
              <div className="mb-4">
                <div className="flex overflow-x-auto pb-2 scrollbar-hide">
                  {specTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSpecTab(tab.id)}
                        className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded text-xs sm:text-sm font-medium mx-1 ${
                          activeSpecTab === tab.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="text-xs sm:text-sm" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specification Fields */}
              <div className="space-y-4">
                {/* Special handling for Camera, Audio, and Multimedia tabs */}
                {activeSpecTab === "camera" && (
                  <>
                    <CameraSpecsInput />
                    <CameraCustomFields />
                  </>
                )}

                {activeSpecTab === "audio" && (
                  <>
                    <AudioSpecsInput />
                    <AudioCustomFields />
                  </>
                )}

                {activeSpecTab === "multimedia" && (
                  <>
                    <MultimediaSpecsInput />
                    <MultimediaCustomFields />
                  </>
                )}

                {activeSpecTab !== "camera" &&
                  activeSpecTab !== "audio" &&
                  activeSpecTab !== "multimedia" && (
                    <>
                      {/* Foldable toggle */}
                      <div className="flex items-center gap-3 mb-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!!formData.is_foldable}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setFormData((prev) => {
                                const cur = prev || {};
                                const updated = {
                                  ...cur,
                                  is_foldable: enabled,
                                };
                                const existing = cur[activeSpecTab] || {};
                                if (enabled) {
                                  if (!existing.fold && !existing.flip) {
                                    updated[activeSpecTab] = {
                                      fold: {},
                                      flip: { ...existing },
                                    };
                                  }
                                } else {
                                  if (existing.flip) {
                                    updated[activeSpecTab] = {
                                      ...(existing.flip || {}),
                                    };
                                  }
                                }
                                return { ...updated };
                              });
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-700">
                            Foldable device
                          </span>
                        </label>
                      </div>

                      {activeSpecTab === "network" && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                          <div className="flex items-center space-x-2">
                            <FaSimCard className="text-blue-500" />
                            <span className="text-sm text-blue-700">
                              Enter SIM details like SIM type, slots, eSIM
                              support, etc.
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {formData.is_foldable ? (
                          <>
                            <div className="lg:col-span-1">
                              <h4 className="text-sm font-semibold mb-2">
                                Fold
                              </h4>
                              {getDefaultFieldsArray(activeSpecTab).map(
                                (field) => (
                                  <div
                                    key={"fold-" + field.key}
                                    className="mb-3"
                                  >
                                    <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                                      {field.label}
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        (formData[activeSpecTab] &&
                                          formData[activeSpecTab].fold &&
                                          formData[activeSpecTab].fold[
                                            field.key
                                          ]) ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleJsonbChange(
                                          activeSpecTab,
                                          field.key,
                                          e.target.value,
                                          "fold",
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                      placeholder={`Enter ${field.label}`}
                                    />
                                  </div>
                                ),
                              )}
                            </div>

                            <div className="lg:col-span-1">
                              <h4 className="text-sm font-semibold mb-2">
                                Flip
                              </h4>
                              {getDefaultFieldsArray(activeSpecTab).map(
                                (field) => (
                                  <div
                                    key={"flip-" + field.key}
                                    className="mb-3"
                                  >
                                    <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                                      {field.label}
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        (formData[activeSpecTab] &&
                                          formData[activeSpecTab].flip &&
                                          formData[activeSpecTab].flip[
                                            field.key
                                          ]) ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleJsonbChange(
                                          activeSpecTab,
                                          field.key,
                                          e.target.value,
                                          "flip",
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                      placeholder={`Enter ${field.label}`}
                                    />
                                  </div>
                                ),
                              )}
                            </div>
                          </>
                        ) : (
                          getDefaultFieldsArray(activeSpecTab).map((field) => {
                            const rawVal = field.value;
                            const isObj =
                              rawVal &&
                              typeof rawVal === "object" &&
                              !Array.isArray(rawVal);
                            return (
                              <div key={field.key}>
                                <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                                  {field.label}
                                </label>
                                {isObj ? (
                                  (() => {
                                    try {
                                      const obj = rawVal || {};
                                      const values = Object.values(obj || {});
                                      const isLabelValueMap =
                                        values.length > 0 &&
                                        values.every(
                                          (v) =>
                                            v &&
                                            typeof v === "object" &&
                                            ("label" in v || "value" in v),
                                        );

                                      const isPrimitiveMap =
                                        values.length > 0 &&
                                        values.every(
                                          (v) =>
                                            v === null ||
                                            (typeof v !== "object" &&
                                              !Array.isArray(v)),
                                        );

                                      if (isLabelValueMap) {
                                        return (
                                          <div className="space-y-3">
                                            {Object.keys(obj).map(
                                              (innerKey) => {
                                                const innerVal =
                                                  obj[innerKey] || {};
                                                return (
                                                  <div
                                                    key={innerKey}
                                                    className="p-2 bg-gray-50 rounded-md"
                                                  >
                                                    <div className="text-xs text-gray-600 mb-2 font-medium">
                                                      {innerKey.replace(
                                                        /_/g,
                                                        " ",
                                                      )}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                      <div>
                                                        <label className="block text-xs text-gray-500 mb-1">
                                                          Label
                                                        </label>
                                                        <input
                                                          type="text"
                                                          value={
                                                            innerVal.label || ""
                                                          }
                                                          onChange={(e) =>
                                                            handleNestedObjectFieldChange(
                                                              activeSpecTab,
                                                              field.key,
                                                              innerKey,
                                                              "label",
                                                              e.target.value,
                                                            )
                                                          }
                                                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                                          placeholder="Label"
                                                        />
                                                      </div>
                                                      <div>
                                                        <label className="block text-xs text-gray-500 mb-1">
                                                          Value
                                                        </label>
                                                        <input
                                                          type="text"
                                                          value={
                                                            innerVal.value !==
                                                            undefined
                                                              ? String(
                                                                  innerVal.value,
                                                                )
                                                              : innerVal.label ||
                                                                ""
                                                          }
                                                          onChange={(e) =>
                                                            handleNestedObjectFieldChange(
                                                              activeSpecTab,
                                                              field.key,
                                                              innerKey,
                                                              "value",
                                                              e.target.value,
                                                            )
                                                          }
                                                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                                          placeholder="Value"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              },
                                            )}
                                          </div>
                                        );
                                      }

                                      if (isPrimitiveMap) {
                                        return (
                                          <div className="space-y-3">
                                            {Object.keys(obj).map(
                                              (innerKey) => (
                                                <div
                                                  key={innerKey}
                                                  className="p-2 bg-gray-50 rounded-md"
                                                >
                                                  <div className="text-xs text-gray-600 mb-2 font-medium">
                                                    {innerKey.replace(
                                                      /_/g,
                                                      " ",
                                                    )}
                                                  </div>
                                                  <input
                                                    type="text"
                                                    value={
                                                      obj[innerKey] !==
                                                      undefined
                                                        ? String(obj[innerKey])
                                                        : ""
                                                    }
                                                    onChange={(e) =>
                                                      handlePrimitiveNestedChange(
                                                        activeSpecTab,
                                                        field.key,
                                                        innerKey,
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                                    placeholder={`Enter ${innerKey.replace(/_/g, " ")}`}
                                                  />
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        );
                                      }

                                      // Mixed object: render primitive entries as inputs and complex entries as JSON textarea
                                      const entries = Object.entries(obj || {});
                                      const primitiveEntries = entries.filter(
                                        ([k, v]) =>
                                          v === null ||
                                          (typeof v !== "object" &&
                                            !Array.isArray(v)),
                                      );
                                      const complexEntries = entries.filter(
                                        ([k, v]) =>
                                          v &&
                                          (typeof v === "object" ||
                                            Array.isArray(v)),
                                      );

                                      if (primitiveEntries.length > 0) {
                                        return (
                                          <div className="space-y-3">
                                            {primitiveEntries.map(
                                              ([innerKey, innerVal]) => (
                                                <div
                                                  key={innerKey}
                                                  className="p-2 bg-gray-50 rounded-md"
                                                >
                                                  <div className="text-xs text-gray-600 mb-2 font-medium">
                                                    {innerKey.replace(
                                                      /_/g,
                                                      " ",
                                                    )}
                                                  </div>
                                                  <input
                                                    type="text"
                                                    value={
                                                      innerVal !== undefined
                                                        ? String(innerVal)
                                                        : ""
                                                    }
                                                    onChange={(e) =>
                                                      handlePrimitiveNestedChange(
                                                        activeSpecTab,
                                                        field.key,
                                                        innerKey,
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                                    placeholder={`Enter ${innerKey.replace(/_/g, " ")}`}
                                                  />
                                                </div>
                                              ),
                                            )}

                                            {complexEntries.length > 0 && (
                                              <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                  Complex / structured keys
                                                  (JSON)
                                                </label>
                                                <textarea
                                                  value={(() => {
                                                    try {
                                                      const complexObj =
                                                        Object.fromEntries(
                                                          complexEntries,
                                                        );
                                                      return JSON.stringify(
                                                        complexObj,
                                                        null,
                                                        2,
                                                      );
                                                    } catch (e) {
                                                      return "";
                                                    }
                                                  })()}
                                                  onChange={(e) => {
                                                    const v = e.target.value;
                                                    try {
                                                      const parsed =
                                                        JSON.parse(v);
                                                      // merge parsed complex keys back into the full object
                                                      const newObj = {
                                                        ...obj,
                                                        ...parsed,
                                                      };
                                                      handleJsonbChange(
                                                        activeSpecTab,
                                                        field.key,
                                                        newObj,
                                                      );
                                                    } catch (err) {
                                                      // ignore parse errors for now
                                                    }
                                                  }}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-mono"
                                                  rows={6}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                    } catch (e) {
                                      // fallthrough to textarea fallback
                                    }

                                    return (
                                      <textarea
                                        value={(() => {
                                          try {
                                            return JSON.stringify(
                                              rawVal,
                                              null,
                                              2,
                                            );
                                          } catch (e) {
                                            return String(rawVal);
                                          }
                                        })()}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          try {
                                            const parsed = JSON.parse(v);
                                            handleJsonbChange(
                                              activeSpecTab,
                                              field.key,
                                              parsed,
                                            );
                                          } catch (err) {
                                            // fallback to raw string when not valid JSON
                                            handleJsonbChange(
                                              activeSpecTab,
                                              field.key,
                                              v,
                                            );
                                          }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-mono"
                                        rows={4}
                                        placeholder={`Enter JSON for ${field.label}`}
                                      />
                                    );
                                  })()
                                ) : (
                                  <input
                                    type="text"
                                    value={rawVal || ""}
                                    onChange={(e) =>
                                      handleJsonbChange(
                                        activeSpecTab,
                                        field.key,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder={`Enter ${field.label}`}
                                  />
                                )}
                              </div>
                            );
                          })
                        )}

                        {(customJsonFields[activeSpecTab] || []).map(
                          (customField) => {
                            const val = formData[activeSpecTab]?.[customField];
                            const isObj =
                              val &&
                              typeof val === "object" &&
                              !Array.isArray(val);
                            return (
                              <div key={customField} className="relative">
                                <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                                  {String(customField).replace(/_/g, " ")}
                                </label>
                                {isObj ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">
                                        Label
                                      </label>
                                      <input
                                        type="text"
                                        value={val.label || ""}
                                        onChange={(e) =>
                                          handleCustomFieldChange(
                                            activeSpecTab,
                                            customField,
                                            "label",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                        placeholder="Label"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">
                                        Value
                                      </label>
                                      <input
                                        type="text"
                                        value={
                                          val.value !== undefined
                                            ? String(val.value)
                                            : ""
                                        }
                                        onChange={(e) =>
                                          handleCustomFieldChange(
                                            activeSpecTab,
                                            customField,
                                            "value",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                        placeholder="Value"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={val || ""}
                                    onChange={(e) =>
                                      handleJsonbChange(
                                        activeSpecTab,
                                        customField,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder={`Enter ${String(customField).replace(/_/g, " ")}`}
                                  />
                                )}
                                <button
                                  onClick={() =>
                                    removeCustomJsonField(
                                      activeSpecTab,
                                      customField,
                                    )
                                  }
                                  className="absolute right-2 top-7 text-red-500 hover:text-red-700"
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              </div>
                            );
                          },
                        )}

                        <div className="lg:col-span-1 col-span-full">
                          <button
                            onClick={() => addCustomJsonField(activeSpecTab)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mt-4"
                          >
                            <FaPlus className="text-xs" />
                            <span>Add Custom Field</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Sensors Section */}
        <div className="bg-white rounded-lg shadow-md">
          <button
            onClick={() => toggleSection("sensors")}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaMicrochip className="text-red-600 text-sm" />
              </div>
              <div className="text-left min-w-0">
                <h2 className="font-semibold text-sm sm:text-base text-gray-800">
                  Sensors
                </h2>
                <p className="text-xs text-gray-600 hidden sm:block">
                  Add sensor information
                </p>
              </div>
            </div>
            {expandedSections.sensors ? (
              <FaChevronDown className="text-sm flex-shrink-0 ml-2" />
            ) : (
              <FaChevronRight className="text-sm flex-shrink-0 ml-2" />
            )}
          </button>

          {expandedSections.sensors && (
            <div className="p-3 sm:p-4">
              <textarea
                name="sensors"
                value={formData.sensors || ""}
                onChange={handleChange}
                placeholder="Enter sensors (comma-separated or JSON array)..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 text-sm"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-2">
                Example: Fingerprint, Accelerometer, Gyroscope, Compass
              </p>
            </div>
          )}
        </div>

        {/* Publish Toggle */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    publishEnabled ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <FaStar
                    className={
                      publishEnabled
                        ? "text-green-600 text-sm"
                        : "text-gray-600 text-sm"
                    }
                  />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base text-gray-800">
                    Publish Status
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {publishEnabled
                      ? "Mobile will be published immediately"
                      : "Save as draft"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPublishEnabled(!publishEnabled)}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap ${
                  publishEnabled
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                {publishEnabled ? "Published" : "Draft"}
              </button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Update Mobile</span>
              </>
            )}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMobile;
