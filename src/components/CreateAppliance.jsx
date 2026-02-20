// components/CreateHomeAppliance.js
import React, { useState, useEffect, useRef, createRef } from "react";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";
import useFormDraft from "../hooks/useFormDraft";
import {
  FaSave,
  FaTimes,
  FaUpload,
  FaPlus,
  FaSpinner,
  FaCamera,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronRight,
  FaStar,
  FaHome,
  FaTv,
  FaSnowflake,
  FaTemperatureHigh,
  FaBlender,
  FaFan,
  FaWater,
  FaBox,
  FaShieldAlt,
  FaBolt,
  FaWeightHanging,
  FaRuler,
  FaTag,
  FaIndustry,
  FaSearch,
  FaCalendar,
} from "react-icons/fa";

const createInitialApplianceFormData = () => ({
  product: {
    name: "",
    brand_id: "",
  },
  home_appliance: {
    appliance_type: "",
    model_number: "",
    release_year: new Date().getFullYear(),
    release_date: "",
    country_of_origin: "",
    specifications: {},
    features: [],
    performance: {},
    physical_details: {},
    warranty: {},
  },
  images: [],
  variants: [],
});

const CreateHomeAppliance = () => {
  const [formData, setFormData] = useState(createInitialApplianceFormData);

  const [isLoading, setIsLoading] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState("specifications");
  const [customJsonFields, setCustomJsonFields] = useState({});
  const [brandsList, setBrandsList] = useState([]);
  const [applianceOptions, setApplianceOptions] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [memoryOptions, setMemoryOptions] = useState({
    rams: [],
    storages: [],
  });
  const [publishEnabled, setPublishEnabled] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    images: true,
    features: true,
    variants: true,
    specs: true,
    performance: true,
    physical: true,
    warranty: true,
  });

  // Custom dropdown states
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showApplianceDropdown, setShowApplianceDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [applianceSearch, setApplianceSearch] = useState("");

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

  // Date picker state for year selection
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: 0,
    day: 1,
  });

  // Refs for dropdown closing
  const brandDropdownRef = useRef(null);
  const applianceDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);

  const { clearDraft } = useFormDraft({
    draftKey: "hooks-admin:create-tv:draft",
    value: formData,
    setValue: setFormData,
  });

  // Appliance types with icons
  const applianceTypes = [
    { value: "washing_machine", label: "Washing Machine", icon: FaWater },
    { value: "refrigerator", label: "Refrigerator", icon: FaSnowflake },
    { value: "air_conditioner", label: "Air Conditioner", icon: FaFan },
    { value: "television", label: "Television", icon: FaTv },
    { value: "microwave", label: "Microwave Oven", icon: FaTemperatureHigh },
    { value: "oven", label: "Oven", icon: FaTemperatureHigh },
    { value: "dishwasher", label: "Dishwasher", icon: FaWater },
    { value: "vacuum_cleaner", label: "Vacuum Cleaner", icon: FaFan },
    { value: "blender", label: "Blender/Mixer", icon: FaBlender },
    { value: "water_purifier", label: "Water Purifier", icon: FaWater },
    { value: "air_purifier", label: "Air Purifier", icon: FaFan },
    { value: "iron", label: "Iron", icon: FaTemperatureHigh },
    { value: "water_heater", label: "Water Heater", icon: FaTemperatureHigh },
    { value: "chimney", label: "Chimney", icon: FaFan },
    { value: "induction_cooktop", label: "Induction Cooktop", icon: FaBolt },
    { value: "other", label: "Other Appliance", icon: FaHome },
  ];

  // Generate years for dropdown (2000 to current year + 1)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2000; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.reverse();
  };

  const yearsList = generateYears();

  // Helper function to get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

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

  // Fetch online stores and ram/storage options for dropdowns
  useEffect(() => {
    const fetchAuxiliary = async () => {
      try {
        const token = Cookies.get("authToken");
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
    fetchAuxiliary();
  }, []);

  // Close dropdowns when clicking outside
  // Initialize date from form data
  useEffect(() => {
    if (formData.home_appliance.release_date) {
      const d = new Date(formData.home_appliance.release_date);
      setSelectedDate({
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
      });
    }
  }, [formData.home_appliance.release_date]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(event.target)
      ) {
        setShowBrandDropdown(false);
      }
      if (
        applianceDropdownRef.current &&
        !applianceDropdownRef.current.contains(event.target)
      ) {
        setShowApplianceDropdown(false);
      }
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target)
      ) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter brands based on search
  const filteredBrands = brandsList.filter((brand) =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  // Filter appliance types based on search (use API-backed options when available)
  const filteredApplianceTypes = (
    applianceOptions && applianceOptions.length
      ? applianceOptions
      : applianceTypes.map((a) => ({
          value: a.value,
          label: a.label,
          icon: a.icon,
        }))
  ).filter((appliance) =>
    appliance.label.toLowerCase().includes(applianceSearch.toLowerCase()),
  );

  // Fetch appliance categories from API (use auth token)
  useEffect(() => {
    const fetchApplianceCategories = async () => {
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
              pt === "tv" ||
              pt === "television" ||
              pt === "appliance" ||
              pt === "home_appliance" ||
              pt === "home-appliance" ||
              pt.includes("appliance")
            );
          })
          .map((r) => ({
            value: r.name || r.value || `cat_${r.id}`,
            label: r.name || r.title || r.value || `TV ${r.id}`,
          }));

        if (opts.length) setApplianceOptions(opts);
      } catch (err) {
        console.error("Failed to fetch appliance categories:", err);
      }
    };
    fetchApplianceCategories();
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

  // Handle home appliance field changes
  const handleApplianceChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      home_appliance: {
        ...prev.home_appliance,
        [name]: value,
      },
    }));
  };

  // Handle brand selection
  const handleBrandSelect = (brand) => {
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        brand_id: brand.id,
      },
      home_appliance: {
        ...prev.home_appliance,
        brand: brand.name,
      },
    }));
    setShowBrandDropdown(false);
    setBrandSearch("");
  };

  // Handle appliance type selection
  const handleApplianceSelect = (appliance) => {
    setFormData((prev) => ({
      ...prev,
      home_appliance: {
        ...prev.home_appliance,
        appliance_type: appliance.value,
      },
    }));
    setShowApplianceDropdown(false);
    setApplianceSearch("");
  };

  // Handle JSONB object changes
  const handleJsonbChange = (field, key, value) => {
    setFormData((prev) => ({
      ...prev,
      home_appliance: {
        ...prev.home_appliance,
        [field]: {
          ...prev.home_appliance[field],
          [key]: value,
        },
      },
    }));
  };

  // Add feature
  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      home_appliance: {
        ...prev.home_appliance,
        features: [...prev.home_appliance.features, ""],
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
          variant_key: "",
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
    setIsLoading(true);

    try {
      const uploadedImages = [];
      for (const file of fileList) {
        const data = await uploadToCloudinary(file, "appliances");
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
      setIsLoading(false);
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

  // Get appliance icon based on type
  const getApplianceIcon = (type) => {
    const appliance = applianceTypes.find((app) => app.value === type);
    return appliance ? appliance.icon : FaHome;
  };

  // Get selected brand name
  const getSelectedBrandName = () => {
    const selectedBrand = brandsList.find(
      (brand) => brand.id === Number(formData.product.brand_id),
    );
    return selectedBrand ? selectedBrand.name : "";
  };

  // Get selected appliance label
  const getSelectedApplianceLabel = () => {
    const selectedAppliance = applianceTypes.find(
      (app) => app.value === formData.home_appliance.appliance_type,
    );
    return selectedAppliance ? selectedAppliance.label : "";
  };

  // Specification tabs for home appliances
  const specTabs = [
    { id: "specifications", label: "Specifications", icon: FaBox },
    { id: "performance", label: "Performance", icon: FaBolt },
    { id: "physical_details", label: "Physical Details", icon: FaRuler },
    { id: "warranty", label: "Warranty", icon: FaShieldAlt },
  ];

  // Get default fields for each specification category based on appliance type
  const getDefaultFields = (category) => {
    const { appliance_type } = formData.home_appliance;

    // Common fields for all appliances
    const commonSpecs = [
      "capacity",
      "type",
      "color",
      "material",
      "control_type",
    ];
    const commonPerformance = [
      "energy_rating",
      "power_consumption",
      "noise_level",
    ];
    const commonPhysical = [
      "width",
      "height",
      "depth",
      "weight",
      "installation_type",
    ];
    const commonWarranty = ["product", "installation", "extended_warranty"];

    // Appliance-specific fields
    const applianceSpecificFields = {
      washing_machine: {
        specifications: [
          ...commonSpecs,
          "wash_programs",
          "motor_type",
          "spin_speed",
          "water_level",
        ],
        performance: [
          ...commonPerformance,
          "water_consumption",
          "wash_technology",
          "dry_function",
        ],
      },
      refrigerator: {
        specifications: [
          ...commonSpecs,
          "cooling_system",
          "star_rating",
          "defrost_system",
          "shelves",
        ],
        performance: [
          ...commonPerformance,
          "refrigerant_type",
          "temperature_range",
          "fast_cooling",
        ],
      },
      air_conditioner: {
        specifications: [
          ...commonSpecs,
          "tonnage",
          "cooling_capacity",
          "type",
          "remote_control",
        ],
        performance: [
          ...commonPerformance,
          "iseer_rating",
          "cooling_power",
          "air_flow",
        ],
      },
      television: {
        specifications: [
          ...commonSpecs,
          "screen_size",
          "resolution",
          "smart_tv",
          "hdr_support",
        ],
        performance: [
          ...commonPerformance,
          "refresh_rate",
          "sound_output",
          "connectivity",
        ],
      },
      microwave: {
        specifications: [
          ...commonSpecs,
          "capacity_liters",
          "power_watts",
          "cooking_modes",
        ],
        performance: [
          ...commonPerformance,
          "heating_time",
          "preset_programs",
          "safety_features",
        ],
      },
      dishwasher: {
        specifications: [
          ...commonSpecs,
          "place_settings",
          "wash_programs",
          "drying_system",
        ],
        performance: [
          ...commonPerformance,
          "water_consumption",
          "energy_consumption",
          "noise_level",
        ],
      },
    };

    // Get fields based on appliance type, fallback to common
    const specificFields = applianceSpecificFields[appliance_type] || {};

    const defaults = {
      specifications: specificFields.specifications || commonSpecs,
      performance: specificFields.performance || commonPerformance,
      physical_details: commonPhysical,
      warranty: commonWarranty,
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
        home_appliance: {
          ...prev.home_appliance,
          [field]: {
            ...prev.home_appliance[field],
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
      const updatedField = { ...prev.home_appliance[field] };
      delete updatedField[fieldName];
      return {
        ...prev,
        home_appliance: {
          ...prev.home_appliance,
          [field]: updatedField,
        },
      };
    });
    showToast("Field Removed", `Custom field "${fieldName}" removed`, "info");
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.product.name.trim()) {
      showToast("Validation Error", "Appliance name is required", "error");
      setIsLoading(false);
      return;
    }

    if (!formData.product.brand_id) {
      showToast("Validation Error", "Brand is required", "error");
      setIsLoading(false);
      return;
    }

    if (!formData.home_appliance.appliance_type) {
      showToast("Validation Error", "Appliance type is required", "error");
      setIsLoading(false);
      return;
    }

    if (!formData.home_appliance.model_number.trim()) {
      showToast("Validation Error", "Model number is required", "error");
      setIsLoading(false);
      return;
    }

    try {
      const token = Cookies.get("authToken");
      const submitData = {
        product: {
          name: formData.product.name,
          brand_id: Number(formData.product.brand_id),
        },
        home_appliance: {
          appliance_type: formData.home_appliance.appliance_type,
          model_number: formData.home_appliance.model_number,
          release_year: formData.home_appliance.release_year
            ? Number(formData.home_appliance.release_year)
            : new Date().getFullYear(),
          country_of_origin: formData.home_appliance.country_of_origin || null,
          specifications: formData.home_appliance.specifications,
          features: formData.home_appliance.features.filter(Boolean),
          performance: formData.home_appliance.performance,
          physical_details: formData.home_appliance.physical_details,
          warranty: formData.home_appliance.warranty,
        },
        images: formData.images,
        variants: formData.variants.map((v) => ({
          variant_key: v.variant_key || null,
          base_price: v.base_price ? Number(v.base_price) : null,
          stores: v.stores.map((s) => ({
            store_name: s.store_name || null,
            price: s.price ? Number(s.price) : null,
            url: s.url || null,
            offer_text: s.offer_text || null,
          })),
        })),
        published: publishEnabled,
      };

      const res = await fetch(buildUrl("/api/tvs"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create appliance");
      }

      showToast(
        "Success",
        `"${formData.product.name}" created ${
          publishEnabled ? "and published" : "as draft"
        } successfully!`,
        "success",
      );

      // Reset form
      clearDraft();
      setFormData(createInitialApplianceFormData());
      setCustomJsonFields({});
      setPublishEnabled(false);
    } catch (error) {
      console.error("Create appliance error:", error);
      showToast(
        "Creation Failed",
        `Error creating appliance: ${error.message}`,
        "error",
      );
    } finally {
      setIsLoading(false);
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
            if (type === "brand") setSearchValue("");
            if (type === "appliance") setSearchValue("");
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
            {/* Search input */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-white p-3 border-b-2 border-blue-100">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder={`Search ${
                    type === "brand" ? "brands" : "appliances"
                  }...`}
                  autoFocus
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={type === "brand" ? option.id : option.value}
                      type="button"
                      onClick={() => onSelect(option)}
                      className={`w-full text-left px-4 py-3 transition-colors flex items-center space-x-3 ${
                        (
                          type === "brand"
                            ? option.id === value
                            : option.value === value
                        )
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-md"
                          : idx % 2 === 0
                            ? "hover:bg-blue-50 text-gray-700"
                            : "hover:bg-blue-100 text-gray-700"
                      } ${idx !== filteredOptions.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      {type === "appliance" && Icon && (
                        <Icon
                          className={`text-lg flex-shrink-0 ${
                            (
                              type === "brand"
                                ? option.id === value
                                : option.value === value
                            )
                              ? "text-white"
                              : "text-gray-400"
                          }`}
                        />
                      )}
                      <span className="flex-1 truncate text-sm">
                        {type === "brand" ? option.name : option.label}
                      </span>
                      {(type === "brand"
                        ? option.id === value
                        : option.value === value) && (
                        <span className="flex-shrink-0">
                          <FaCheckCircle className="text-lg" />
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  <p>No {type === "brand" ? "brands" : "appliances"} found</p>
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

  // Custom Date Picker Component (Calendar) for Release Year
  const YearDropdown = () => {
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
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }
    // Add days of current month
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

    const handleApply = () => {
      const date = new Date(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
      );

      setFormData((prev) => ({
        ...prev,
        home_appliance: {
          ...prev.home_appliance,
          release_year: date.getFullYear(),
          release_date: date.toISOString().split("T")[0],
        },
      }));

      setShowYearDropdown(false);
    };

    return (
      <div className="relative" ref={yearDropdownRef}>
        <button
          type="button"
          onClick={() => setShowYearDropdown(!showYearDropdown)}
          className={`w-full px-4 py-2.5 border-2 transition-all rounded-lg bg-white text-left flex items-center justify-between ${
            formData.home_appliance.release_year
              ? "border-blue-400 shadow-sm"
              : "border-gray-300 hover:border-gray-400"
          } hover:shadow-md`}
        >
          <div className="flex items-center space-x-3">
            <FaCalendar
              className={`text-lg ${formData.home_appliance.release_year ? "text-blue-500" : "text-gray-400"}`}
            />
            <div>
              <span
                className={`block font-medium ${
                  formData.home_appliance.release_date
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {formData.home_appliance.release_date
                  ? new Date(
                      formData.home_appliance.release_date,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Select Release Date"}
              </span>
              {formData.home_appliance.release_date && (
                <span className="text-xs text-gray-500">
                  {new Date(
                    formData.home_appliance.release_date,
                  ).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </span>
              )}
            </div>
          </div>
          <FaChevronDown
            className={`text-gray-400 text-lg ${
              showYearDropdown ? "transform rotate-180" : ""
            } transition-transform duration-300`}
          />
        </button>

        {showYearDropdown && (
          <div className="absolute z-50 mt-2 w-96 bg-white border-2 border-blue-200 rounded-xl shadow-2xl p-5 backdrop-blur-sm bg-opacity-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-4 mb-4 text-white">
              <h3 className="text-lg font-bold text-center">
                {months[selectedDate.month]} {selectedDate.year}
              </h3>
              <p className="text-center text-blue-100 text-sm mt-1">
                Release Year: {selectedDate.year}
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
                  {yearsList.map((year) => (
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
                  onClick={() => setShowYearDropdown(false)}
                  className="px-4 py-1.5 text-sm font-semibold border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
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

  return (
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Create Home Appliance
            </h1>
            <p className="text-gray-600 mt-1">
              Add a new home appliance to your inventory
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {isLoading ? "Creating..." : "Create Appliance"}
            </button>
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
                <FaHome className="text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">
                  Basic Information
                </h2>
                <p className="text-sm text-gray-600">
                  Name, brand, model and appliance details
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
                    Appliance Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.product.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., LG 9kg Top Load Washing Machine"
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
                    Appliance Type *
                  </label>
                  <CustomDropdown
                    value={formData.home_appliance.appliance_type}
                    placeholder="Select Appliance Type"
                    isOpen={showApplianceDropdown}
                    setIsOpen={setShowApplianceDropdown}
                    searchValue={applianceSearch}
                    setSearchValue={setApplianceSearch}
                    filteredOptions={filteredApplianceTypes}
                    onSelect={handleApplianceSelect}
                    selectedLabel={getSelectedApplianceLabel()}
                    dropdownRef={applianceDropdownRef}
                    type="appliance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Number *
                  </label>
                  <input
                    type="text"
                    name="model_number"
                    value={formData.home_appliance.model_number}
                    onChange={handleApplianceChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., FHM1207"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Release Year
                  </label>
                  <YearDropdown />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    name="country_of_origin"
                    value={formData.home_appliance.country_of_origin}
                    onChange={handleApplianceChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., India"
                  />
                </div>
              </div>

              {formData.home_appliance.appliance_type && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {React.createElement(
                        getApplianceIcon(
                          formData.home_appliance.appliance_type,
                        ),
                        { className: "text-blue-600 text-lg" },
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {getSelectedApplianceLabel()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formData.home_appliance.appliance_type ===
                        "washing_machine"
                          ? "Enter capacity, wash programs, spin speed, etc."
                          : formData.home_appliance.appliance_type ===
                              "refrigerator"
                            ? "Enter capacity, star rating, cooling system, etc."
                            : formData.home_appliance.appliance_type ===
                                "air_conditioner"
                              ? "Enter tonnage, cooling capacity, ISEER rating, etc."
                              : "Enter relevant specifications for this appliance"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                  {formData.home_appliance.features.length} features added
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

              {formData.home_appliance.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...formData.home_appliance.features];
                      newFeatures[index] = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        home_appliance: {
                          ...prev.home_appliance,
                          features: newFeatures,
                        },
                      }));
                    }}
                    placeholder="e.g., Steam Wash, Child Lock, Smart Diagnosis"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      const newFeatures =
                        formData.home_appliance.features.filter(
                          (_, i) => i !== index,
                        );
                      setFormData((prev) => ({
                        ...prev,
                        home_appliance: {
                          ...prev.home_appliance,
                          features: newFeatures,
                        },
                      }));
                    }}
                    className="ml-3 text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                Tip: Add key features like "Steam Wash", "Child Lock", "Energy
                Saving Mode", "Auto Clean", etc.
              </p>
            </div>
          )}
        </div>

        {/* Variants Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => toggleSection("variants")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaTag className="text-orange-600" />
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
                        const newVariants = formData.variants.filter(
                          (_, i) => i !== index,
                        );
                        setFormData((prev) => ({
                          ...prev,
                          variants: newVariants,
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Variant Key
                      </label>
                      <input
                        type="text"
                        value={variant.variant_key}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index] = {
                            ...newVariants[index],
                            variant_key: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            variants: newVariants,
                          }));
                        }}
                        placeholder="e.g., 7kg, 500L, 1.5 Ton"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                          const newVariants = [...formData.variants];
                          newVariants[index] = {
                            ...newVariants[index],
                            base_price: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            variants: newVariants,
                          }));
                        }}
                        placeholder="e.g., 28999"
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
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + Add Store
                      </button>
                    </div>

                    {variant.stores.map((store, storeIndex) => (
                      <div
                        key={storeIndex}
                        className="p-3 bg-gray-50 rounded-md mb-2"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
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
                            filteredOptions={(storesList || []).filter((opt) =>
                              opt.name
                                .toLowerCase()
                                .includes(
                                  (
                                    storeSearch[`${index}-${storeIndex}`] || ""
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
                          <input
                            type="number"
                            value={store.price}
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
                            placeholder="Price"
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="url"
                            value={store.url}
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
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            value={store.offer_text}
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
                            placeholder="Offer text"
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
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
                <FaBox className="text-indigo-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">Specifications</h2>
                <p className="text-sm text-gray-600">
                  Configure all technical specifications
                </p>
              </div>
            </div>
            {expandedSections.specs ? <FaChevronDown /> : <FaChevronRight />}
          </button>

          {expandedSections.specs && (
            <div className="p-4">
              {/* Specification Tabs */}
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

              {/* Specification Fields */}
              <div className="space-y-4">
                <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <FaInfoCircle className="text-blue-500" />
                    <span className="text-sm text-blue-700">
                      {activeSpecTab === "specifications" &&
                        "Enter key specifications like capacity, type, motor, etc."}
                      {activeSpecTab === "performance" &&
                        "Enter performance metrics like energy rating, power consumption, etc."}
                      {activeSpecTab === "physical_details" &&
                        "Enter physical dimensions and weight"}
                      {activeSpecTab === "warranty" &&
                        "Enter warranty details for product and components"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getDefaultFields(activeSpecTab).map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                        {field.replace(/_/g, " ")}
                      </label>
                      <input
                        type="text"
                        value={
                          formData.home_appliance[activeSpecTab]?.[field] || ""
                        }
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
                            formData.home_appliance[activeSpecTab]?.[
                              customField
                            ] || ""
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

        {/* Publish Toggle */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
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
                      ? "Appliance will be published immediately"
                      : "Save as draft"}
                  </div>
                </div>
              </div>

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
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Create Appliance</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateHomeAppliance;


