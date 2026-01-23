// components/EditLaptop.js
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";
import {
  FaLaptop,
  FaSave,
  FaTimes,
  FaUpload,
  FaPlus,
  FaSpinner,
  FaCamera,
  FaMicrochip,
  FaDesktop,
  FaWifi,
  FaTrash,
  FaPalette,
  FaBoxOpen,
  FaCog,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronRight,
  FaStar,
  FaBatteryFull,
  FaWeightHanging,
  FaMemory,
  FaHdd,
  FaPlug,
  FaCode,
  FaShieldAlt,
  FaSearch,
  FaCalendar,
  FaTag,
  FaPercent,
  FaEdit,
  FaHistory,
  FaCopy,
  FaEye,
} from "react-icons/fa";

const EditLaptop = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    product: {
      name: "",
      brand_id: "",
    },
    laptop: {
      category: "",
      brand: "",
      model: "",
      launch_date: "",
      colors: [],
      cpu: {},
      display: {},
      memory: {},
      storage: {},
      battery: {},
      connectivity: {},
      physical: {},
      software: {},
      features: [],
      warranty: {},
    },
    images: [],
    variants: [],
  });

  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // UI-only mode: no API fetching
  const [isFetching, setIsFetching] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState("cpu");
  const [customJsonFields, setCustomJsonFields] = useState({});
  const [brandsList, setBrandsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [memoryOptions, setMemoryOptions] = useState({
    rams: [],
    storages: [],
  });
  const [publishEnabled, setPublishEnabled] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    images: true,
    colors: true,
    features: true,
    variants: true,
    specs: true,
    warranty: true,
  });

  // Custom dropdown states
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

  // Date picker states
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    day: new Date().getDate(),
  });

  // Refs for dropdown closing
  const brandDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const datePickerRef = useRef(null);
  const modelRef = useRef(null);

  // Filter categories based on search
  const filteredCategories = (categoriesList || []).filter((category) =>
    (category.label || "").toLowerCase().includes(categorySearch.toLowerCase()),
  );

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

  // Fetch laptop data
  const fetchLaptopData = useCallback(async () => {
    try {
      setIsFetching(true);
      const token = Cookies.get("authToken");
<<<<<<< HEAD
      const res = await fetch(buildUrl(`/api/laptops/${id}`), {
=======
      const res = await fetch(`http://apishpere.duckdns.org/api/laptops/${id}`, {
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        if (res.status === 404) {
          showToast("Not Found", "Laptop not found", "error");
        }
        throw new Error("Failed to fetch laptop data");
      }

      const data = await res.json();
      setOriginalData(data);

      // Transform data to match form structure
      const transformedData = {
        product: {
          name: data.product?.name || "",
          brand_id: data.product?.brand_id || "",
        },
        laptop: {
          category: data.laptop?.category || "",
          brand: data.laptop?.brand || "",
          model: data.laptop?.model || "",
          launch_date: data.laptop?.launch_date || "",
          colors: data.laptop?.colors || [],
          cpu: data.laptop?.cpu || {},
          display: data.laptop?.display || {},
          memory: data.laptop?.memory || {},
          storage: data.laptop?.storage || {},
          battery: data.laptop?.battery || {},
          connectivity: data.laptop?.connectivity || {},
          physical: data.laptop?.physical || {},
          software: data.laptop?.software || {},
          features: data.laptop?.features || [],
          warranty: data.laptop?.warranty || {},
        },
        images: data.images || [],
        variants: data.variants || [],
      };

      setFormData(transformedData);
      setPublishEnabled(data.published || false);

      // Set date picker if launch date exists
      if (data.laptop?.launch_date) {
        const date = new Date(data.laptop.launch_date);
        setSelectedDate({
          year: date.getFullYear(),
          month: date.getMonth(),
          day: date.getDate(),
        });
      }

      // Extract custom JSON fields
      const customFields = {};
      const jsonFields = [
        "cpu",
        "display",
        "memory",
        "storage",
        "battery",
        "connectivity",
        "physical",
        "software",
        "warranty",
      ];
      jsonFields.forEach((field) => {
        if (data.laptop?.[field]) {
          const defaultFields = getDefaultFields(field);
          const existingKeys = Object.keys(data.laptop[field] || {});
          const customKeys = existingKeys.filter(
            (key) => !defaultFields.includes(key),
          );
          if (customKeys.length > 0) {
            customFields[field] = customKeys;
          }
        }
      });
      setCustomJsonFields(customFields);
    } catch (error) {
      console.error("Error fetching laptop:", error);
      showToast("Error", "Failed to load laptop data", "error");
    } finally {
      setIsFetching(false);
    }
  }, [id]);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
<<<<<<< HEAD
        const res = await fetch(buildUrl("/api/brands"));
=======
        const res = await fetch("http://apishpere.duckdns.org/api/brands");
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897
        if (!res.ok) return;
        const data = await res.json();
        const brandsArray = data.brands || data || [];
        // normalize brands into { id, name }
        const normalized = (brandsArray || [])
          .map((b, idx) => {
            if (!b) return null;
            if (typeof b === "string") return { id: String(b), name: b };
            const id = b.id ?? b._id ?? b.value ?? b.name ?? String(idx);
            const name = b.name ?? b.label ?? b.value ?? String(id);
            return { id: String(id), name };
          })
          .filter(Boolean);
        setBrandsList(normalized);
      } catch (err) {
        console.error("Failed to fetch brands:", err);
      }
    };
    fetchBrands();
  }, []);

  // Fetch online stores and ram/storage options for dropdowns
  useEffect(() => {
    const fetchAuxiliary = async () => {
      try {
        const token = Cookies.get("authToken");
        const storesEndpoint = token
<<<<<<< HEAD
          ? buildUrl("/api/online-stores")
          : buildUrl("/api/public/online-stores");
=======
          ? "http://apishpere.duckdns.org/api/online-stores"
          : "http://apishpere.duckdns.org/api/public/online-stores";
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897
        const storesRes = await fetch(storesEndpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (storesRes.ok) {
          const data = await storesRes.json();
          const rows = (data && (data.data || data.rows || data)) || [];
          const opts = (rows || []).map((r) => ({ id: r.id, name: r.name }));
          setStoresList(opts);
        }

<<<<<<< HEAD
        const ramRes = await fetch(buildUrl("/api/ram-storage-config"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
=======
        const ramRes = await fetch(
          "http://apishpere.duckdns.org/api/ram-storage-config",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897
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
    fetchAuxiliary();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = Cookies.get("authToken");
<<<<<<< HEAD
        const res = await fetch(buildUrl("/api/categories"), {
=======
        const res = await fetch("http://apishpere.duckdns.org/api/categories", {
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();

        let rows = [];
        if (Array.isArray(data)) rows = data;
        else if (data && Array.isArray(data.categories)) rows = data.categories;
        else if (data && Array.isArray(data.data)) rows = data.data;
        else rows = data || [];

        const laptopCats = rows
          .map((r) => ({
            value: r.name || r.title || `cat_${r.id}`,
            label: r.name || r.title || `Category ${r.id}`,
          }))
          .filter((c) => c.label);

        setCategoriesList(laptopCats);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategoriesList([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch laptop data on mount
  useEffect(() => {
    if (id) {
      fetchLaptopData();
    }
  }, [id, fetchLaptopData]);

  // Check for changes
  useEffect(() => {
    if (originalData) {
      const originalComparable = {
        product: {
          name: originalData.product?.name || "",
          brand_id: originalData.product?.brand_id || "",
        },
        laptop: {
          category: originalData.laptop?.category || "",
          brand: originalData.laptop?.brand || "",
          model: originalData.laptop?.model || "",
          launch_date: originalData.laptop?.launch_date || "",
          colors: originalData.laptop?.colors || [],
          cpu: originalData.laptop?.cpu || {},
          display: originalData.laptop?.display || {},
          memory: originalData.laptop?.memory || {},
          storage: originalData.laptop?.storage || {},
          battery: originalData.laptop?.battery || {},
          connectivity: originalData.laptop?.connectivity || {},
          physical: originalData.laptop?.physical || {},
          software: originalData.laptop?.software || {},
          features: originalData.laptop?.features || [],
          warranty: originalData.laptop?.warranty || {},
        },
        images: originalData.images || [],
        variants: originalData.variants || [],
      };

      setHasChanges(!deepEqual(formData, originalComparable));
    }
  }, [formData, originalData]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter brands based on search (safe for strings or objects)
  const filteredBrands = (brandsList || []).filter((brand) => {
    const name =
      typeof brand === "string"
        ? brand
        : brand?.name || brand?.label || brand?.value || "";
    return name.toLowerCase().includes((brandSearch || "").toLowerCase());
  });

  // Deep equality for change detection
  const deepEqual = (a, b) => {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a && b && typeof a === "object") {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++)
          if (!deepEqual(a[i], b[i])) return false;
        return true;
      }
      const aKeys = Object.keys(a).sort();
      const bKeys = Object.keys(b).sort();
      if (aKeys.length !== bKeys.length) return false;
      for (let k of aKeys) {
        if (!bKeys.includes(k)) return false;
        if (!deepEqual(a[k], b[k])) return false;
      }
      return true;
    }
    return false;
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

  // Handle basic input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        [name]: value,
      },
    }));
  };

  // Handle laptop field changes
  const handleLaptopChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      laptop: {
        ...prev.laptop,
        [name]: value,
      },
    }));
  };

  // Handle brand selection (support multiple brand shapes)
  const handleBrandSelect = (brand) => {
    const id =
      brand && (brand.id ?? brand._id ?? brand.value ?? brand.name ?? brand);
    const name =
      brand && (brand.name ?? brand.label ?? brand.value ?? String(brand));
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        brand_id: id !== undefined && id !== null ? String(id) : "",
      },
      laptop: {
        ...prev.laptop,
        brand: name || "",
      },
    }));
    setShowBrandDropdown(false);
    setBrandSearch("");
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    const value = category?.value ? category.value : category;
    setFormData((prev) => ({
      ...prev,
      laptop: {
        ...prev.laptop,
        category: value,
      },
    }));
    setShowCategoryDropdown(false);
    setCategorySearch("");
  };

  // Handle date selection
  const handleDateSelect = () => {
    const dateStr = `${selectedDate.year}-${(selectedDate.month + 1)
      .toString()
      .padStart(2, "0")}-${selectedDate.day.toString().padStart(2, "0")}`;
    setFormData((prev) => ({
      ...prev,
      laptop: {
        ...prev.laptop,
        launch_date: dateStr,
      },
    }));
    setShowDatePicker(false);
  };

  // Handle JSONB object changes
  const handleJsonbChange = (field, key, value) => {
    setFormData((prev) => {
      const prevField = prev.laptop?.[field] || {};
      return {
        ...prev,
        laptop: {
          ...prev.laptop,
          [field]: {
            ...prevField,
            [key]: value,
          },
        },
      };
    });
  };

  // Add color with name and code
  const addColor = () => {
    setFormData((prev) => ({
      ...prev,
      laptop: {
        ...prev.laptop,
        colors: [...prev.laptop.colors, { name: "", code: "#cccccc" }],
      },
    }));
    showToast("Color Added", "New color option added", "success");
  };

  // Add feature
  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      laptop: {
        ...prev.laptop,
        features: [...prev.laptop.features, ""],
      },
    }));
    showToast("Feature Added", "New feature added", "success");
  };

  // Add variant
  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          ram: "",
          storage: "",
          base_price: "",
          stores: [],
        },
      ],
    }));
    showToast("Variant Added", "New variant added", "success");
  };

  // Add store to variant
  const addStoreToVariant = (variantIndex) => {
    setFormData((prev) => {
      const updatedVariants = (prev.variants || []).map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              stores: [
                ...(v?.stores || []),
                {
                  store_name: "",
                  price: "",
                  url: "",
                  offer_text: "",
                  discount: "",
                  offers: "",
                },
              ],
            }
          : v,
      );
      return { ...prev, variants: updatedVariants };
    });
    showToast("Store Added", "New store added to variant", "success");
  };

  // Old inline upload handler removed; using centralized uploadToCloudinary below

  // Handle image upload (use shared utility)
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setIsLoading(true);

    try {
      const uploadedImages = [];
      for (const file of fileList) {
        const data = await uploadToCloudinary(file, "laptops");
        if (data && data.secure_url) uploadedImages.push(data.secure_url);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
    } catch (error) {
      console.error("Image upload error:", error);
      showToast(
        "Upload Failed",
        error.message || "Error uploading images",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedBrandName = () => {
    const selectedBrand = brandsList.find(
      (brand) => brand.id === Number(formData.product.brand_id),
    );
    return selectedBrand ? selectedBrand.name : "Select Brand";
  };

  // Get default fields for each specification category
  const getDefaultFields = (category) => {
    const defaults = {
      cpu: [
        "brand",
        "model",
        "cores",
        "threads",
        "base_clock",
        "max_clock",
        "cache",
        "generation",
      ],
      display: [
        "size",
        "type",
        "resolution",
        "refresh_rate",
        "brightness",
        "color_gamut",
        "aspect_ratio",
        "touch_support",
      ],
      memory: [
        "type",
        "capacity",
        "speed",
        "slots",
        "max_capacity",
        "configurable",
      ],
      storage: [
        "type",
        "capacity",
        "interface",
        "read_speed",
        "write_speed",
        "extra_slot",
      ],
      battery: [
        "capacity",
        "type",
        "backup_time",
        "fast_charging",
        "wireless_charging",
        "replaceable",
      ],
      connectivity: [
        "wifi",
        "bluetooth",
        "ethernet",
        "hdmi",
        "usb_ports",
        "thunderbolt",
        "audio_jack",
        "card_reader",
      ],
      physical: [
        "weight",
        "height",
        "width",
        "depth",
        "material",
        "color",
        "keyboard",
        "touchpad",
      ],
      software: [
        "os",
        "os_version",
        "preinstalled_software",
        "bios",
        "recovery",
      ],
      warranty: [
        "years",
        "type",
        "onsite_service",
        "international_warranty",
        "extendable",
      ],
    };
    return defaults[category] || [];
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
      setFormData((prev) => ({
        ...prev,
        laptop: {
          ...prev.laptop,
          [field]: {
            ...prev.laptop[field],
            [cleanFieldName]: "",
          },
        },
      }));
      showToast(
        "Field Added",
        `Custom field "${cleanFieldName}" added`,
        "success",
      );
    }
  };

  // Remove custom field
  const removeCustomJsonField = (field, fieldName) => {
    setCustomJsonFields((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((name) => name !== fieldName),
    }));
    setFormData((prev) => {
      const updatedField = { ...prev.laptop[field] };
      delete updatedField[fieldName];
      return {
        ...prev,
        laptop: {
          ...prev.laptop,
          [field]: updatedField,
        },
      };
    });
    showToast("Field Removed", `Custom field "${fieldName}" removed`, "info");
  };

  // Save as draft
  const saveAsDraft = async () => {
    if (!hasChanges) {
      showToast("No Changes", "No changes to save", "info");
      return;
    }
    setIsSavingDraft(true);
    try {
      await handleSubmit(false);
      showToast("Draft Saved", "Changes saved as draft", "success");
    } catch (error) {
      showToast("Save Failed", "Failed to save draft", "error");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Reset to original data
  const resetForm = () => {
    if (
      originalData &&
      window.confirm("Are you sure you want to discard all changes?")
    ) {
      // UI-only: reset to the stored originalData (if any) or clear
      if (originalData) {
        const transformed = {
          product: {
            name: originalData.product?.name || "",
            brand_id: originalData.product?.brand_id || "",
          },
          laptop: {
            category: originalData.laptop?.category || "",
            brand: originalData.laptop?.brand || "",
            model: originalData.laptop?.model || "",
            launch_date: originalData.laptop?.launch_date || "",
            colors: originalData.laptop?.colors || [],
            cpu: originalData.laptop?.cpu || {},
            display: originalData.laptop?.display || {},
            memory: originalData.laptop?.memory || {},
            storage: originalData.laptop?.storage || {},
            battery: originalData.laptop?.battery || {},
            connectivity: originalData.laptop?.connectivity || {},
            physical: originalData.laptop?.physical || {},
            software: originalData.laptop?.software || {},
            features: originalData.laptop?.features || [],
            warranty: originalData.laptop?.warranty || {},
          },
          images: originalData.images || [],
          variants: originalData.variants || [],
        };
        setFormData(transformed);
      } else {
        setFormData({
          product: { name: "", brand_id: "" },
          laptop: {
            category: "",
            brand: "",
            model: "",
            launch_date: "",
            colors: [],
            cpu: {},
            display: {},
            memory: {},
            storage: {},
            battery: {},
            connectivity: {},
            physical: {},
            software: {},
            features: [],
            warranty: {},
          },
          images: [],
          variants: [],
        });
      }
      setHasChanges(false);
      showToast("Form Reset", "All changes discarded", "info");
    }
  };

  // Form submit handler
  const handleSubmit = async (publish = publishEnabled) => {
    setIsLoading(true);

    // Read live DOM fallback via ref for fields that may be edited but not flushed to state yet
    const domModel = modelRef.current?.value;
    const modelValue =
      (domModel !== undefined && domModel !== null
        ? domModel
        : formData.laptop.model) || "";
    console.debug(
      "Model values -> domModel:",
      domModel,
      "stateModel:",
      formData.laptop.model,
    );
    const productName = (formData.product.name || "").trim();
    const brandId = formData.product.brand_id;
    console.debug(
      "brandId (before validation):",
      brandId,
      "formData.product.brand_id:",
      formData.product.brand_id,
    );

    // Basic validation (use DOM fallback for model)
    if (!productName) {
      console.debug(
        "Validation failed: product.name empty",
        formData.product.name,
      );
      showToast("Validation Error", "Laptop name is required", "error");
      setIsLoading(false);
      return;
    }

    if (!brandId) {
      console.debug(
        "Validation failed: brand_id empty",
        formData.product.brand_id,
      );
      showToast("Validation Error", "Brand is required", "error");
      setIsLoading(false);
      return;
    }

    if (!modelValue.trim()) {
      console.debug("Validation failed: model empty", modelValue);
      showToast("Validation Error", "Input model is required", "error");
      // Focus and highlight the model input so user sees the failure immediately
      if (modelRef && modelRef.current) {
        try {
          modelRef.current.focus();
          modelRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          modelRef.current.classList.add("ring-2", "ring-red-500");
          setTimeout(() => {
            modelRef.current &&
              modelRef.current.classList.remove("ring-2", "ring-red-500");
          }, 1600);
        } catch (err) {
          console.debug("Focus highlight failed:", err);
        }
      } else {
        console.debug("modelRef not available at validation time", modelRef);
      }
      setIsLoading(false);
      return;
    }

    try {
      // Build a submit copy using live model value (to avoid stale state race)
      const effectiveForm = {
        ...formData,
        laptop: { ...formData.laptop, model: modelValue },
      };
      console.debug("Submitting effectiveForm:", effectiveForm);
      const token = Cookies.get("authToken");
      const submitData = {
        product: {
          name: effectiveForm.product.name,
          brand_id: Number(effectiveForm.product.brand_id),
        },
        laptop: {
          category: effectiveForm.laptop.category,
          brand: effectiveForm.laptop.brand,
          model: effectiveForm.laptop.model,
          launch_date: effectiveForm.laptop.launch_date || null,
          colors: (effectiveForm.laptop.colors || []).filter(
            (color) => color?.name && color?.code,
          ),
          cpu: effectiveForm.laptop.cpu,
          display: effectiveForm.laptop.display,
          memory: effectiveForm.laptop.memory,
          storage: effectiveForm.laptop.storage,
          battery: effectiveForm.laptop.battery,
          connectivity: effectiveForm.laptop.connectivity,
          physical: effectiveForm.laptop.physical,
          software: effectiveForm.laptop.software,
          features: (effectiveForm.laptop.features || []).filter(Boolean),
          warranty: effectiveForm.laptop.warranty,
        },
        images: formData.images,
        variants: (formData.variants || []).map((v) => ({
          ram: v.ram || null,
          storage: v.storage || null,
          base_price: v.base_price ? Number(v.base_price) : null,
          stores: (v.stores || []).map((s) => ({
            store_name: s.store_name || null,
            price: s.price ? Number(s.price) : null,
            url: s.url || null,
            offer_text: s.offer_text || null,
            // map frontend 'offers' / 'discount' into delivery_info so DB persists
            delivery_info: s.offers || s.delivery_info || null,
            // keep discount as-is in payload (DB doesn't have discount column for variant_store_prices)
            discount: s.discount || null,
          })),
        })),
        published: publish,
      };

<<<<<<< HEAD
      const res = await fetch(buildUrl(`/api/laptops/${id}`), {
=======
      const res = await fetch(`http://apishpere.duckdns.org/api/laptops/${id}`, {
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update laptop");
      }
      await res.json();
      // After successful update, re-fetch the persisted laptop to sync state
      await fetchLaptopData();
      setHasChanges(false);
      showToast(
        "Success",
        `Laptop "${formData.product.name}" updated ${
          publish ? "and published" : "successfully"
        }!`,
        "success",
      );
    } catch (error) {
      console.error("Update laptop error:", error);
      showToast(
        "Update Failed",
        `Error updating laptop: ${error.message}`,
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Laptop specification tabs
  const specTabs = [
    { id: "cpu", label: "Processor", icon: FaMicrochip },
    { id: "display", label: "Display", icon: FaDesktop },
    { id: "memory", label: "Memory", icon: FaMemory },
    { id: "storage", label: "Storage", icon: FaHdd },
    { id: "battery", label: "Battery", icon: FaBatteryFull },
    { id: "connectivity", label: "Connectivity", icon: FaWifi },
    { id: "physical", label: "Physical", icon: FaWeightHanging },
    { id: "software", label: "Software", icon: FaCode },
    { id: "warranty", label: "Warranty", icon: FaShieldAlt },
  ];

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

  // Custom Dropdown Component
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
  }) => {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setSearchValue("");
          }}
          className={`w-full px-3 py-2 border ${
            value ? "border-blue-300" : "border-gray-300"
          } rounded-md bg-white text-left flex items-center justify-between hover:border-blue-400 transition-colors`}
        >
          <span
            className={`${value ? "text-gray-900" : "text-gray-500"} truncate`}
          >
            {selectedLabel || placeholder}
          </span>
          <FaChevronDown
            className={`text-gray-400 ${
              isOpen ? "transform rotate-180" : ""
            } transition-transform`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="sticky top-0 bg-white p-2 border-b">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Search ${
                    type === "brand" ? "brands" : "categories"
                  }...`}
                  autoFocus
                />
              </div>
            </div>

            <div className="py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => {
                  const optId = option?.id ?? option?.value ?? String(idx);
                  const optLabel =
                    option?.name ??
                    option?.label ??
                    option?.value ??
                    String(option);
                  const isSelected =
                    String(optId) === String(value) ||
                    String(optLabel) === String(value);
                  return (
                    <button
                      key={optId}
                      type="button"
                      onClick={() => onSelect(option)}
                      className={`w-full text-left px-3 py-2 hover:bg-blue-50 ${
                        isSelected
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {optLabel}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  {type === "brand" ? "No brands found" : "No categories found"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Custom Date Picker Component
  const DatePicker = () => {
    const daysInMonth = getDaysInMonth(selectedDate.year, selectedDate.month);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const yearsArray = generateYears();

    return (
      <div className="relative" ref={datePickerRef}>
        <button
          type="button"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`w-full px-3 py-2 border ${
            formData.laptop.launch_date ? "border-blue-300" : "border-gray-300"
          } rounded-md bg-white text-left flex items-center justify-between hover:border-blue-400 transition-colors`}
        >
          <div className="flex items-center space-x-2">
            <FaCalendar className="text-gray-400" />
            <span
              className={`${
                formData.laptop.launch_date ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {formData.laptop.launch_date
                ? new Date(formData.laptop.launch_date).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    },
                  )
                : "Select Launch Date"}
            </span>
          </div>
          <FaChevronDown
            className={`text-gray-400 ${
              showDatePicker ? "transform rotate-180" : ""
            } transition-transform`}
          />
        </button>

        {showDatePicker && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Select Date</h3>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Year
                </label>
                <div className="max-h-40 overflow-y-auto border rounded">
                  {yearsArray.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() =>
                        setSelectedDate((prev) => ({ ...prev, year }))
                      }
                      className={`w-full text-center py-1 text-sm ${
                        year === selectedDate.year
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Month
                </label>
                <div className="max-h-40 overflow-y-auto border rounded">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() =>
                        setSelectedDate((prev) => ({ ...prev, month: index }))
                      }
                      className={`w-full text-center py-1 text-sm ${
                        index === selectedDate.month
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {month.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Day
                </label>
                <div className="max-h-40 overflow-y-auto border rounded">
                  {daysArray.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setSelectedDate((prev) => ({ ...prev, day }))
                      }
                      className={`w-full text-center py-1 text-sm ${
                        day === selectedDate.day
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Selected: {selectedDate.day} {months[selectedDate.month]}{" "}
                {selectedDate.year}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDateSelect}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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

  // Show loading state while fetching
  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading laptop data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Edit Laptop
              </h1>
              {hasChanges && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              Editing: {originalData?.product?.name || "Laptop"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasChanges && (
              <>
                <button
                  onClick={resetForm}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                >
                  <FaHistory />
                  Discard Changes
                </button>
                <button
                  onClick={saveAsDraft}
                  disabled={isSavingDraft}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingDraft ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaSave />
                  )}
                  {isSavingDraft ? "Saving..." : "Save Draft"}
                </button>
              </>
            )}
            <button
              onClick={() => navigate(`/laptops/${id}`)}
              className="px-3 py-2 border border-blue-300 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-50 flex items-center gap-2"
            >
              <FaEye />
              View
            </button>
            <button
              onClick={() => navigate("/laptops")}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || !hasChanges}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {isLoading ? "Updating..." : "Update Laptop"}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500">Images</div>
            <div className="text-lg font-semibold text-gray-800">
              {formData.images.length}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500">Variants</div>
            <div className="text-lg font-semibold text-gray-800">
              {formData.variants.length}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500">Colors</div>
            <div className="text-lg font-semibold text-gray-800">
              {formData.laptop.colors.length}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500">Status</div>
            <div
              className={`text-lg font-semibold ${
                publishEnabled ? "text-green-600" : "text-gray-600"
              }`}
            >
              {publishEnabled ? "Published" : "Draft"}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Basic Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => toggleSection("basic")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaLaptop className="text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">
                  Basic Information
                </h2>
                <p className="text-sm text-gray-600">
                  Name, brand, model and category
                </p>
              </div>
            </div>
            {expandedSections.basic ? <FaChevronDown /> : <FaChevronRight />}
          </button>

          {expandedSections.basic && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Laptop Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.product.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., HP Pavilion 13"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <CustomDropdown
                    value={formData.product.brand_id}
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    id="laptop-model-input"
                    name="model"
                    ref={modelRef}
                    value={formData.laptop.model}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        laptop: { ...prev.laptop, model: v },
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 14-dv2056TU"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <CustomDropdown
                    value={formData.laptop.category}
                    placeholder="Select Category"
                    isOpen={showCategoryDropdown}
                    setIsOpen={setShowCategoryDropdown}
                    searchValue={categorySearch}
                    setSearchValue={setCategorySearch}
                    filteredOptions={filteredCategories}
                    onSelect={handleCategorySelect}
                    selectedLabel={(() => {
                      const sel = categoriesList.find(
                        (c) => c.value === formData.laptop.category,
                      );
                      return sel ? sel.label : formData.laptop.category;
                    })()}
                    dropdownRef={categoryDropdownRef}
                    type="category"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Launch Date
                  </label>
                  <DatePicker />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Images Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => toggleSection("images")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaCamera className="text-purple-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">Images</h2>
                <p className="text-sm text-gray-600">
                  {formData.images.length} images uploaded
                </p>
              </div>
            </div>
            {expandedSections.images ? <FaChevronDown /> : <FaChevronRight />}
          </button>

          {expandedSections.images && (
            <div className="p-4">
              {formData.images.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((src, idx) => (
                      <div key={idx} className="relative">
                        <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded-md overflow-hidden">
                          <img
                            src={src}
                            alt={`img-${idx}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs"
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
                  <FaCamera className="text-gray-400 text-xl mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {isLoading ? "Uploading..." : "Click to upload images"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colors Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => toggleSection("colors")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                <FaPalette className="text-pink-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">Colors</h2>
                <p className="text-sm text-gray-600">
                  {formData.laptop.colors.length} colors added
                </p>
              </div>
            </div>
            {expandedSections.colors ? <FaChevronDown /> : <FaChevronRight />}
          </button>

          {expandedSections.colors && (
            <div className="p-4 space-y-3">
              <button
                onClick={addColor}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <FaPlus className="text-sm" />
                <span>Add Color</span>
              </button>

              {formData.laptop.colors.map((color, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">
                      Color #{index + 1}
                    </h4>
                    <button
                      onClick={() => {
                        setFormData((prev) => {
                          const newColors = (prev.laptop.colors || []).filter(
                            (_, i) => i !== index,
                          );
                          return {
                            ...prev,
                            laptop: { ...prev.laptop, colors: newColors },
                          };
                        });
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Color Name
                      </label>
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData((prev) => {
                            const newColors = (prev.laptop.colors || []).map(
                              (c, i) => (i === index ? { ...c, name: v } : c),
                            );
                            return {
                              ...prev,
                              laptop: { ...prev.laptop, colors: newColors },
                            };
                          });
                        }}
                        placeholder="e.g., Natural Silver, Space Gray"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
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
                            const v = e.target.value;
                            setFormData((prev) => {
                              const newColors = (prev.laptop.colors || []).map(
                                (c, i) => (i === index ? { ...c, code: v } : c),
                              );
                              return {
                                ...prev,
                                laptop: { ...prev.laptop, colors: newColors },
                              };
                            });
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

        {/* Features Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => toggleSection("features")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FaStar className="text-green-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">Features</h2>
                <p className="text-sm text-gray-600">
                  {formData.laptop.features.length} features added
                </p>
              </div>
            </div>
            {expandedSections.features ? <FaChevronDown /> : <FaChevronRight />}
          </button>

          {expandedSections.features && (
            <div className="p-4 space-y-3">
              <button
                onClick={addFeature}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <FaPlus className="text-sm" />
                <span>Add Feature</span>
              </button>

              {formData.laptop.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((prev) => {
                        const newFeatures = (prev.laptop.features || []).map(
                          (f, i) => (i === index ? v : f),
                        );
                        return {
                          ...prev,
                          laptop: { ...prev.laptop, features: newFeatures },
                        };
                      });
                    }}
                    placeholder="e.g., Backlit Keyboard"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      setFormData((prev) => {
                        const newFeatures = (prev.laptop.features || []).filter(
                          (_, i) => i !== index,
                        );
                        return {
                          ...prev,
                          laptop: { ...prev.laptop, features: newFeatures },
                        };
                      });
                    }}
                    className="ml-3 text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants & Stores Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => toggleSection("variants")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaBoxOpen className="text-orange-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">
                  Variants & Stores
                </h2>
                <p className="text-sm text-gray-600">
                  {formData.variants.length} variants added
                </p>
              </div>
            </div>
            {expandedSections.variants ? <FaChevronDown /> : <FaChevronRight />}
          </button>

          {expandedSections.variants && (
            <div className="p-4 space-y-4">
              <button
                onClick={addVariant}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <FaPlus className="text-sm" />
                <span>Add Variant</span>
              </button>

              {formData.variants.map((variant, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800">
                      Variant #{index + 1}
                    </h3>
                    <button
                      onClick={() => {
                        setFormData((prev) => {
                          const newVariants = (prev.variants || []).filter(
                            (_, i) => i !== index,
                          );
                          return { ...prev, variants: newVariants };
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        RAM
                      </label>
                      <CustomDropdown
                        value={variant.ram || ""}
                        placeholder="Select RAM"
                        isOpen={showRamDropdown[index] || false}
                        setIsOpen={(val) =>
                          setShowRamDropdown((prev) => ({
                            ...prev,
                            [index]: val,
                          }))
                        }
                        searchValue={ramSearch[index] || ""}
                        setSearchValue={(val) =>
                          setRamSearch((prev) => ({ ...prev, [index]: val }))
                        }
                        filteredOptions={(memoryOptions.rams || []).filter(
                          (opt) =>
                            opt.name
                              .toLowerCase()
                              .includes((ramSearch[index] || "").toLowerCase()),
                        )}
                        onSelect={(opt) => {
                          const v = opt.name;
                          setFormData((prev) => {
                            const newVariants = (prev.variants || []).map(
                              (vt, i) => (i === index ? { ...vt, ram: v } : vt),
                            );
                            return { ...prev, variants: newVariants };
                          });
                          setShowRamDropdown((prev) => ({
                            ...prev,
                            [index]: false,
                          }));
                        }}
                        selectedLabel={
                          memoryOptions.rams?.find(
                            (r) => r.name === variant.ram,
                          )?.name || ""
                        }
                        dropdownRef={
                          ramDropdownRefs.current[index] ||
                          (ramDropdownRefs.current[index] = createRef())
                        }
                        type="memory"
                        showSearch={true}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Storage
                      </label>
                      <CustomDropdown
                        value={variant.storage || ""}
                        placeholder="Select Storage"
                        isOpen={showStorageDropdown[index] || false}
                        setIsOpen={(val) =>
                          setShowStorageDropdown((prev) => ({
                            ...prev,
                            [index]: val,
                          }))
                        }
                        searchValue={storageSearch[index] || ""}
                        setSearchValue={(val) =>
                          setStorageSearch((prev) => ({
                            ...prev,
                            [index]: val,
                          }))
                        }
                        filteredOptions={(memoryOptions.storages || []).filter(
                          (opt) =>
                            opt.name
                              .toLowerCase()
                              .includes(
                                (storageSearch[index] || "").toLowerCase(),
                              ),
                        )}
                        onSelect={(opt) => {
                          const v = opt.name;
                          setFormData((prev) => {
                            const newVariants = (prev.variants || []).map(
                              (vt, i) =>
                                i === index ? { ...vt, storage: v } : vt,
                            );
                            return { ...prev, variants: newVariants };
                          });
                          setShowStorageDropdown((prev) => ({
                            ...prev,
                            [index]: false,
                          }));
                        }}
                        selectedLabel={
                          memoryOptions.storages?.find(
                            (s) => s.name === variant.storage,
                          )?.name || ""
                        }
                        dropdownRef={
                          storageDropdownRefs.current[index] ||
                          (storageDropdownRefs.current[index] = createRef())
                        }
                        type="memory"
                        showSearch={true}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Base Price (₹)
                      </label>
                      <input
                        type="number"
                        value={variant.base_price}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData((prev) => {
                            const newVariants = (prev.variants || []).map(
                              (vt, i) =>
                                i === index ? { ...vt, base_price: v } : vt,
                            );
                            return { ...prev, variants: newVariants };
                          });
                        }}
                        placeholder="e.g., 65999"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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

                    {variant.stores.map((store, storeIndex) => (
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
                                const v = opt.name;
                                setFormData((prev) => {
                                  const newVariants = (prev.variants || []).map(
                                    (vt, vi) =>
                                      vi === index
                                        ? {
                                            ...vt,
                                            stores: (vt.stores || []).map(
                                              (st, si) =>
                                                si === storeIndex
                                                  ? { ...st, store_name: v }
                                                  : st,
                                            ),
                                          }
                                        : vt,
                                  );
                                  return { ...prev, variants: newVariants };
                                });
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
                              value={store.price}
                              onChange={(e) => {
                                const v = e.target.value;
                                setFormData((prev) => {
                                  const newVariants = (prev.variants || []).map(
                                    (vt, vi) =>
                                      vi === index
                                        ? {
                                            ...vt,
                                            stores: (vt.stores || []).map(
                                              (st, si) =>
                                                si === storeIndex
                                                  ? { ...st, price: v }
                                                  : st,
                                            ),
                                          }
                                        : vt,
                                  );
                                  return { ...prev, variants: newVariants };
                                });
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
                              value={store.discount}
                              onChange={(e) => {
                                const v = e.target.value;
                                setFormData((prev) => {
                                  const newVariants = (prev.variants || []).map(
                                    (vt, vi) =>
                                      vi === index
                                        ? {
                                            ...vt,
                                            stores: (vt.stores || []).map(
                                              (st, si) =>
                                                si === storeIndex
                                                  ? { ...st, discount: v }
                                                  : st,
                                            ),
                                          }
                                        : vt,
                                  );
                                  return { ...prev, variants: newVariants };
                                });
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
                              value={store.offers}
                              onChange={(e) => {
                                const v = e.target.value;
                                setFormData((prev) => {
                                  const newVariants = (prev.variants || []).map(
                                    (vt, vi) =>
                                      vi === index
                                        ? {
                                            ...vt,
                                            stores: (vt.stores || []).map(
                                              (st, si) =>
                                                si === storeIndex
                                                  ? { ...st, offers: v }
                                                  : st,
                                            ),
                                          }
                                        : vt,
                                  );
                                  return { ...prev, variants: newVariants };
                                });
                              }}
                              placeholder="e.g., Bank Offer, Exchange Bonus"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Product URL
                            </label>
                            <input
                              type="url"
                              value={store.url}
                              onChange={(e) => {
                                const v = e.target.value;
                                setFormData((prev) => {
                                  const newVariants = (prev.variants || []).map(
                                    (vt, vi) =>
                                      vi === index
                                        ? {
                                            ...vt,
                                            stores: (vt.stores || []).map(
                                              (st, si) =>
                                                si === storeIndex
                                                  ? { ...st, url: v }
                                                  : st,
                                            ),
                                          }
                                        : vt,
                                  );
                                  return { ...prev, variants: newVariants };
                                });
                              }}
                              placeholder="https://store.com/product"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Offer Text
                            </label>
                            <input
                              type="text"
                              value={store.offer_text}
                              onChange={(e) => {
                                const v = e.target.value;
                                setFormData((prev) => {
                                  const newVariants = (prev.variants || []).map(
                                    (vt, vi) =>
                                      vi === index
                                        ? {
                                            ...vt,
                                            stores: (vt.stores || []).map(
                                              (st, si) =>
                                                si === storeIndex
                                                  ? { ...st, offer_text: v }
                                                  : st,
                                            ),
                                          }
                                        : vt,
                                  );
                                  return { ...prev, variants: newVariants };
                                });
                              }}
                              placeholder="e.g., Limited time offer"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
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

        {/* Specifications Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => toggleSection("specs")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FaMicrochip className="text-indigo-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">
                  Technical Specifications
                </h2>
                <p className="text-sm text-gray-600">
                  Configure all technical details
                </p>
              </div>
            </div>
            {expandedSections.specs ? <FaChevronDown /> : <FaChevronRight />}
          </button>

          {expandedSections.specs && (
            <div className="p-4">
              <div className="mb-4">
                <div className="flex overflow-x-auto pb-2 scrollbar-hide">
                  {specTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSpecTab(tab.id)}
                        className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium mx-1 ${
                          activeSpecTab === tab.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="text-sm" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getDefaultFields(activeSpecTab).map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                        {field.replace(/_/g, " ")}
                      </label>
                      <input
                        type="text"
                        value={formData.laptop[activeSpecTab]?.[field] || ""}
                        onChange={(e) =>
                          handleJsonbChange(
                            activeSpecTab,
                            field,
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder={`Enter ${field.replace(/_/g, " ")}`}
                      />
                    </div>
                  ))}

                  {(customJsonFields[activeSpecTab] || []).map(
                    (customField) => (
                      <div key={customField} className="relative">
                        <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                          {customField.replace(/_/g, " ")}
                        </label>
                        <input
                          type="text"
                          value={
                            formData.laptop[activeSpecTab]?.[customField] || ""
                          }
                          onChange={(e) =>
                            handleJsonbChange(
                              activeSpecTab,
                              customField,
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          placeholder={`Enter ${customField.replace(
                            /_/g,
                            " ",
                          )}`}
                        />
                        <button
                          onClick={() =>
                            removeCustomJsonField(activeSpecTab, customField)
                          }
                          className="absolute right-2 top-7 text-red-500 hover:text-red-700"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    ),
                  )}
                </div>

                <button
                  onClick={() => addCustomJsonField(activeSpecTab)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <FaPlus className="text-xs" />
                  <span>Add Custom Field</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Warranty Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => toggleSection("warranty")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <FaShieldAlt className="text-teal-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">
                  Warranty Details
                </h2>
                <p className="text-sm text-gray-600">
                  Warranty information and support
                </p>
              </div>
            </div>
            {expandedSections.warranty ? <FaChevronDown /> : <FaChevronRight />}
          </button>

          {expandedSections.warranty && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Warranty Years
                  </label>
                  <input
                    type="text"
                    value={formData.laptop.warranty.years || ""}
                    onChange={(e) =>
                      handleJsonbChange("warranty", "years", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    placeholder="e.g., 1 year"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Warranty Type
                  </label>
                  <input
                    type="text"
                    value={formData.laptop.warranty.type || ""}
                    onChange={(e) =>
                      handleJsonbChange("warranty", "type", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Onsite, Carry-in"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Onsite Service
                  </label>
                  <select
                    value={formData.laptop.warranty.onsite_service || ""}
                    onChange={(e) =>
                      handleJsonbChange(
                        "warranty",
                        "onsite_service",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    International Warranty
                  </label>
                  <select
                    value={
                      formData.laptop.warranty.international_warranty || ""
                    }
                    onChange={(e) =>
                      handleJsonbChange(
                        "warranty",
                        "international_warranty",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Extendable
                  </label>
                  <select
                    value={formData.laptop.warranty.extendable || ""}
                    onChange={(e) =>
                      handleJsonbChange(
                        "warranty",
                        "extendable",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Publish & Actions Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    publishEnabled ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <FaStar
                    className={
                      publishEnabled ? "text-green-600" : "text-gray-600"
                    }
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    Publish Status
                  </div>
                  <div className="text-sm text-gray-600">
                    {publishEnabled
                      ? "Laptop is published and visible to users"
                      : "Laptop is saved as draft"}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPublishEnabled(!publishEnabled)}
                  className={`px-4 py-2 rounded-md font-medium ${
                    publishEnabled
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {publishEnabled ? "Published" : "Draft"}
                </button>

                <button
                  onClick={() => {
                    if (window.confirm("Duplicate this laptop?")) {
                      navigate(`/laptops/create?duplicate=${id}`);
                    }
                  }}
                  className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md font-medium hover:bg-blue-50 flex items-center gap-2"
                >
                  <FaCopy />
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Final Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || !hasChanges}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Update Laptop</span>
              </>
            )}
          </button>

          <button
            onClick={() => navigate("/laptops")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLaptop;
