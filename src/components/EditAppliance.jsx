// components/EditHomeAppliance.js
import React, { useState, useEffect, useRef, createRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";
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
  FaEdit,
  FaEye,
} from "react-icons/fa";

const EditHomeAppliance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    product: {
      name: "",
      brand_id: "",
    },
    home_appliance: {
      appliance_type: "",
      model_number: "",
      release_year: new Date().getFullYear(),
      country_of_origin: "",
      specifications: {},
      features: [],
      performance: {},
      physical_details: {},
      warranty: {},
    },
    images: [],
    variants: [],
    published: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [activeSpecTab, setActiveSpecTab] = useState("specifications");
  const [customJsonFields, setCustomJsonFields] = useState({});
  const [brandsList, setBrandsList] = useState([]);
  const [applianceOptions, setApplianceOptions] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [memoryOptions, setMemoryOptions] = useState({
    rams: [],
    storages: [],
  });
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
  const [showStorageDropdown, setShowStorageDropdown] = useState({});
  const [showStoreDropdown, setShowStoreDropdown] = useState({});
  const [brandSearch, setBrandSearch] = useState("");
  const [applianceSearch, setApplianceSearch] = useState("");
  const [storageSearch, setStorageSearch] = useState({});
  const [storeSearch, setStoreSearch] = useState({});

  // Refs for dropdown closing
  const brandDropdownRef = useRef(null);
  const applianceDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);
  const storageDropdownRefs = useRef({});
  const storeDropdownRefs = useRef({});

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

  // Fetch appliance data by ID
  useEffect(() => {
    const fetchApplianceData = async () => {
      try {
        setIsFetching(true);
        const token = Cookies.get("authToken");
        const res = await fetch(buildUrl(`/api/home-appliances/${id}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          if (res.status === 404) {
            showToast("Not Found", "Appliance not found", "error");
            setIsFetching(false);
            return;
          }
          const errText = await res.text().catch(() => "");
          throw new Error(
            errText || `Failed to fetch appliance data (${res.status})`,
          );
        }

        const data = await res.json();

        // Support both old and new response shapes: prefer data.home_appliance when present
        const ha = data.home_appliance || data;

        // Transform API response to match form structure
        setFormData({
          product: {
            name: data.product?.name || ha.name || "",
            brand_id: data.product?.brand_id ?? ha.brand_id ?? "",
          },
          home_appliance: {
            appliance_type: ha.appliance_type || ha.applianceType || "",
            model_number: ha.model_number || ha.modelNumber || "",
            release_year:
              ha.release_year || ha.releaseYear || new Date().getFullYear(),
            country_of_origin: ha.country_of_origin || ha.countryOfOrigin || "",
            specifications: ha.specifications || {},
            features: ha.features || [],
            performance: ha.performance || {},
            physical_details: ha.physical_details || {},
            warranty: ha.warranty || {},
          },
          images: data.images || [],
          variants: data.variants || [],
          published: data.published ?? data.is_published ?? false,
        });

        // Extract custom JSON fields
        const customFields = {};
        [
          "specifications",
          "performance",
          "physical_details",
          "warranty",
        ].forEach((field) => {
          const fieldData = ha[field] || {};
          const defaultFields = getDefaultFields(
            field,
            ha.appliance_type || ha.applianceType,
          );
          const custom = Object.keys(fieldData).filter(
            (key) => !defaultFields.includes(key),
          );
          if (custom.length) {
            customFields[field] = custom;
          }
        });
        setCustomJsonFields(customFields);
      } catch (error) {
        console.error("Error fetching appliance:", error);
        showToast("Error", "Failed to load appliance data", "error");
      } finally {
        setIsFetching(false);
      }
    };

    if (id) {
      fetchApplianceData();
    }
    // Fetch auxiliary data (stores & ram/storage options)
    const fetchAux = async () => {
      try {
        const token = Cookies.get("authToken");
        const storesEndpoint = token
          ? buildUrl("/api/online-stores")
          : buildUrl("/api/public/online-stores");
        const storesRes = await fetch(storesEndpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (storesRes.ok) {
          const d = await storesRes.json();
          const rows = (d && (d.data || d.rows || d)) || [];
          setStoresList((rows || []).map((r) => ({ id: r.id, name: r.name })));
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
    fetchAux();
  }, [id]);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(buildUrl("/api/brands"));
        if (!res.ok) return;
        const data = await res.json();
        const brandsArray = data.brands || data || [];
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

  // Fetch appliance categories from API
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
              pt === "appliance" ||
              pt === "home_appliance" ||
              pt === "home-appliance" ||
              pt.includes("appliance")
            );
          })
          .map((r) => ({
            value: r.name || r.value || `cat_${r.id}`,
            label: r.name || r.title || r.value || `Appliance ${r.id}`,
          }));

        if (opts.length) setApplianceOptions(opts);
      } catch (err) {
        console.error("Failed to fetch appliance categories:", err);
      }
    };
    fetchApplianceCategories();
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
  const filteredBrands = (brandsList || []).filter((brand) => {
    const name =
      typeof brand === "string"
        ? brand
        : brand?.name || brand?.label || brand?.value || "";
    return name.toLowerCase().includes((brandSearch || "").toLowerCase());
  });

  // Filter appliance types based on search
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

  // Handle image upload (centralized utility)
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

  const handleYearSelect = (year) => {
    setFormData((prev) => ({
      ...prev,
      home_appliance: {
        ...prev.home_appliance,
        release_year: year,
      },
    }));
    setShowYearDropdown(false);
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

  // Duplicate handler removed; using centralized uploadToCloudinary above

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
    if (!formData?.product?.brand_id) return "";
    const bid = String(formData.product.brand_id);
    const selectedBrand = (brandsList || []).find((brand) => {
      if (!brand) return false;
      if (typeof brand === "string") return String(brand) === bid;
      return (
        String(brand.id) === bid ||
        String(brand._id) === bid ||
        String(brand.value) === bid ||
        String(brand.name) === bid
      );
    });
    if (selectedBrand)
      return typeof selectedBrand === "string"
        ? selectedBrand
        : selectedBrand.name ||
            selectedBrand.label ||
            selectedBrand.value ||
            "";
    const byName = (brandsList || []).find((b) => {
      const n = typeof b === "string" ? b : b?.name || b?.label || "";
      return n === formData.product.brand_id;
    });
    return byName ? (typeof byName === "string" ? byName : byName.name) : "";
  };

  // Get selected appliance label
  const getSelectedApplianceLabel = () => {
    const selectedAppliance = applianceTypes.find(
      (app) => app.value === formData.home_appliance.appliance_type,
    );
    return selectedAppliance ? selectedAppliance.label : "";
  };

  // Get default fields for each specification category based on appliance type
  const getDefaultFields = (category, applianceType) => {
    const type = applianceType || formData.home_appliance.appliance_type;

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
    const specificFields = applianceSpecificFields[type] || {};

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

  // Form submit handler for update
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
        published: formData.published,
      };

      const res = await fetch(buildUrl(`/api/home-appliances/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update appliance");
      }

      const result = await res.json();

      showToast(
        "Success",
        `"${formData.product.name}" updated ${
          formData.published ? "and published" : "successfully"
        }!`,
        "success",
      );

      // Redirect after success to the appliances inventory view
      setTimeout(() => {
        navigate("/products/homeappliances/inventory");
      }, 1500);
    } catch (error) {
      console.error("Update appliance error:", error);
      showToast(
        "Update Failed",
        `Error updating appliance: ${error.message}`,
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle publish status
  const togglePublish = () => {
    setFormData((prev) => ({
      ...prev,
      published: !prev.published,
    }));
    showToast(
      "Status Changed",
      `Appliance set to ${!formData.published ? "published" : "draft"}`,
      "info",
    );
  };

  // Specification tabs for home appliances
  const specTabs = [
    { id: "specifications", label: "Specifications", icon: FaBox },
    { id: "performance", label: "Performance", icon: FaBolt },
    { id: "physical_details", label: "Physical Details", icon: FaRuler },
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
            if (type === "brand") setSearchValue("");
            if (type === "appliance") setSearchValue("");
          }}
          className={`w-full px-3 py-2 border ${
            value ? "border-blue-300" : "border-gray-300"
          } rounded-md bg-white text-left flex items-center justify-between hover:border-blue-400 transition-colors`}
        >
          <span className={`${value ? "text-gray-900" : "text-gray-500"}`}>
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
            {/* Search input */}
            <div className="sticky top-0 bg-white p-2 border-b">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Search ${
                    type === "brand" ? "brands" : "appliances"
                  }...`}
                  autoFocus
                />
              </div>
            </div>

            {/* Options list */}
            <div className="py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => {
                  const Icon = option.icon;
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
                      className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center space-x-3 ${
                        isSelected
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
                      {type === "appliance" && Icon && (
                        <Icon className="text-gray-400" />
                      )}
                      <span>{optLabel}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  No {type === "brand" ? "brands" : "appliances"} found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Custom Year Dropdown Component
  const YearDropdown = () => {
    return (
      <div className="relative" ref={yearDropdownRef}>
        <button
          type="button"
          onClick={() => setShowYearDropdown(!showYearDropdown)}
          className={`w-full px-3 py-2 border ${
            formData.home_appliance.release_year
              ? "border-blue-300"
              : "border-gray-300"
          } rounded-md bg-white text-left flex items-center justify-between hover:border-blue-400 transition-colors`}
        >
          <div className="flex items-center space-x-2">
            <FaCalendar className="text-gray-400" />
            <span
              className={`${
                formData.home_appliance.release_year
                  ? "text-gray-900"
                  : "text-gray-500"
              }`}
            >
              {formData.home_appliance.release_year || "Select Year"}
            </span>
          </div>
          <FaChevronDown
            className={`text-gray-400 ${
              showYearDropdown ? "transform rotate-180" : ""
            } transition-transform`}
          />
        </button>

        {showYearDropdown && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="py-2">
              {yearsList.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleYearSelect(year)}
                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 ${
                    year === formData.home_appliance.release_year
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Show loading state while fetching
  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-blue-600 text-4xl animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading appliance data...</p>
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
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaEdit className="text-blue-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Edit Home Appliance
              </h1>
            </div>
            <p className="text-gray-600 mt-1">
              Update appliance details for{" "}
              <span className="font-medium">{formData.product.name}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
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
              {isLoading ? "Updating..." : "Update Appliance"}
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
                            placeholder="Product URL"
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
                    formData.published ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  {formData.published ? (
                    <FaEye className="text-green-600" />
                  ) : (
                    <FaStar className="text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    Publish Status
                  </div>
                  <div className="text-sm text-gray-600">
                    {formData.published
                      ? "Appliance is currently published"
                      : "Appliance is saved as draft"}
                  </div>
                </div>
              </div>

              <button
                onClick={togglePublish}
                className={`px-4 py-2 rounded-md font-medium ${
                  formData.published
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                {formData.published ? "Published" : "Draft"}
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
                <span>Updating...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Update Appliance</span>
              </>
            )}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={() => navigate("/products/homeappliances/inventory")}
            className="px-6 py-3 border border-blue-300 text-blue-600 rounded-md font-medium hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <FaEye />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditHomeAppliance;
