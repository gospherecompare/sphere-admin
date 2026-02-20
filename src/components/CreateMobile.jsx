import React, { useState, useEffect, useRef, createRef } from "react";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";
import DynamicForm from "./DynamicForm";
import useFormDraft from "../hooks/useFormDraft";
import {
  FaMobile,
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
  FaSearch,
  FaCalendar,
  FaTag,
  FaPercent,
  FaSimCard,
} from "react-icons/fa";

const createDefaultSmartphoneSpecs = () => ({
  build_design: {
    score: "",
    height: "",
    width: "",
    thickness: "",
    weight: "",
    material: "",
    ip_rating: "",
    colors: [],
    water_dust_resistance: "",
    durability: "",
    liquid_resistance: "",
    monsoon_ready: "",
    ai_features: [],
  },
  display: {
    score: "",
    size: "",
    resolution: "",
    type: "",
    panel: "",
    refresh_rate: "",
    touch_sampling_rate: "",
    screen_to_body_ratio: "",
    pixel_density: "",
    brightness: "",
    color_depth: "",
    protection: "",
    cover_glass: "",
    wet_touch: "",
    glove_mode: "",
    ai_features: [],
  },
  performance: {
    score: "",
    operating_system: "",
    os: "",
    processor: "",
    chipset: "",
    cpu: "",
    cpu_cores: "",
    gpu: "",
    benchmark_score: "",
    antutu_score: "",
    ram_boost: "",
    ram_type: "",
    storage: "",
    storage_type: "",
    network_boost: "",
    ai_features: [],
  },
  camera: {
    score: "",
    rear_camera: {},
    front_camera: {},
    underwater_photography: "",
    ai_features: [],
  },
  battery: {
    score: "",
    capacity: "",
    rated_capacity: "",
    type: "",
    charging: "",
    fast_charging: "",
    wireless_charging: "",
    ai_features: [],
  },
  connectivity: {
    score: "",
    wifi: [],
    bluetooth: "",
    usb: "",
    audio: "",
    nfc: "",
    sim_type: "",
    sim_slots: "",
    esim_support: "",
    dual_standby: "",
    ai_features: [],
  },
  network: {
    score: "",
    sim: "",
    "5g_bands": [],
    network_types: "",
    "5g_support": "",
    network_bands: "",
  },
  ports: {
    usb_type: "",
    headphone_jack: "",
    charging_port: "",
  },
  audio: {
    speakers: "",
    audio_jack: "",
    microphone: "",
    speaker_type: "",
    speaker_count: "",
    max_volume: "",
    microphone_count: "",
    microphone_features: "",
  },
  multimedia: {
    video_formats: "",
    audio_formats: "",
    fm_radio: "",
    rear_video: {},
    front_video: {},
    ai_features: [],
  },
});

const createInitialMobileFormData = () => ({
  product: {
    name: "",
    brand_id: "",
  },
  smartphone: {
    segment: "Smart Phone",
    brand: "",
    model: "",
    launch_date: "",
    colors: [],
    is_foldable: false,
    ...createDefaultSmartphoneSpecs(),
    sensors: "",
  },
  images: [],
  variants: [],
});

const CreateMobile = () => {
  const [formData, setFormData] = useState(createInitialMobileFormData);

  const [isLoading, setIsLoading] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState("build_design");
  const [brandsList, setBrandsList] = useState([]);
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
    colors: true,
    variants: true,
    specs: true,
    sensors: true,
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

  // Categories for dropdown (fetched from API)
  const [categoriesList, setCategoriesList] = useState([]);

  const { clearDraft } = useFormDraft({
    draftKey: "hooks-admin:create-mobile:draft",
    value: formData,
    setValue: setFormData,
  });

  // Filter categories based on search
  const filteredCategories = categoriesList.filter((category) =>
    category.label.toLowerCase().includes(categorySearch.toLowerCase()),
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

  // Generate years for dropdown (2000 to current year + 2)
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

  // Fetch categories (use auth token when present)
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
            label: r.name || r.title || r.value || `Segment ${r.id}`,
          }));

        if (opts.length) setCategoriesList(opts);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch online stores and ram/storage options for dropdowns
  useEffect(() => {
    const fetchAuxiliary = async () => {
      try {
        const token = Cookies.get("authToken");

        // Online stores - prefer authenticated endpoint when token present
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
    fetchAuxiliary();
  }, []);

  // Initialize date from form data
  useEffect(() => {
    if (formData.smartphone.launch_date) {
      const date = new Date(formData.smartphone.launch_date);
      setSelectedDate({
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
      });
    }
  }, [formData.smartphone.launch_date]);

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

  // Filter brands based on search
  const filteredBrands = brandsList.filter((brand) =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase()),
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

  // Handle smartphone field changes
  const handleSmartphoneChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      smartphone: {
        ...prev.smartphone,
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
      smartphone: {
        ...prev.smartphone,
        brand: brand.name,
      },
    }));
    setShowBrandDropdown(false);
    setBrandSearch("");
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setFormData((prev) => ({
      ...prev,
      smartphone: {
        ...prev.smartphone,
        segment: category.value,
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
      smartphone: {
        ...prev.smartphone,
        launch_date: dateStr,
      },
    }));
    setShowDatePicker(false);
  };

  // Handle JSONB object changes
  const handleJsonbChange = (field, key, value, group = null) => {
    setFormData((prev) => {
      // If group provided (e.g., 'fold'|'flip'), write into nested object
      if (group) {
        return {
          ...prev,
          smartphone: {
            ...prev.smartphone,
            [field]: {
              ...((prev.smartphone && prev.smartphone[field]) || {}),
              [group]: {
                ...(((prev.smartphone || {})[field] || {})[group] || {}),
                [key]: value,
              },
            },
          },
        };
      }

      return {
        ...prev,
        smartphone: {
          ...prev.smartphone,
          [field]: {
            ...((prev.smartphone && prev.smartphone[field]) || {}),
            [key]: value,
          },
        },
      };
    });
  };

  const specEditorHiddenKeys = [
    "sphere_score",
    "sphere_description",
    "sphere_images",
  ];

  const setSpecSection = (specKey, nextValue) => {
    setFormData((prev) => ({
      ...prev,
      smartphone: {
        ...prev.smartphone,
        [specKey]: nextValue,
      },
    }));
  };

  const setFoldableSpecSectionSide = (specKey, side, nextValue) => {
    setFormData((prev) => {
      const current =
        prev.smartphone &&
        prev.smartphone[specKey] &&
        typeof prev.smartphone[specKey] === "object"
          ? prev.smartphone[specKey]
          : {};

      const foldValue =
        side === "fold"
          ? nextValue
          : current.fold && typeof current.fold === "object"
            ? current.fold
            : {};
      const flipValue =
        side === "flip"
          ? nextValue
          : current.flip && typeof current.flip === "object"
            ? current.flip
            : {};

      return {
        ...prev,
        smartphone: {
          ...prev.smartphone,
          [specKey]: {
            ...current,
            fold: foldValue,
            flip: flipValue,
          },
        },
      };
    });
  };

  // Add color with name and code
  const addColor = () => {
    setFormData((prev) => ({
      ...prev,
      smartphone: {
        ...prev.smartphone,
        colors: [...prev.smartphone.colors, { name: "", code: "#cccccc" }],
      },
    }));
    showToast("Color Added", "New color option added", "success");
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

  // Add store to variant with offers and discount
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

  // Handle image upload (uses central upload utility)

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  // Handle sphere images upload per spec tab (Cloudinary)
  const handleSphereImagesUpload = async (spec, files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setIsLoading(true);
    try {
      const uploaded = [];
      for (const file of fileList) {
        const data = await uploadToCloudinary(file, "smartphones");
        if (data && data.secure_url) uploaded.push(data.secure_url);
      }

      setFormData((prev) => ({
        ...prev,
        smartphone: {
          ...prev.smartphone,
          [spec]: {
            ...((prev.smartphone || {})[spec] || {}),
            sphere_images: [
              ...(((prev.smartphone || {})[spec] || {}).sphere_images || []),
              ...uploaded,
            ],
          },
        },
      }));

      showToast(
        "Upload Successful",
        `${uploaded.length} image(s) uploaded`,
        "success",
      );
    } catch (error) {
      console.error("Sphere image upload error:", error);
      showToast(
        "Upload Failed",
        error.message || "Error uploading images",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removeSphereImage = (spec, index) => {
    setFormData((prev) => ({
      ...prev,
      smartphone: {
        ...prev.smartphone,
        [spec]: {
          ...((prev.smartphone || {})[spec] || {}),
          sphere_images: ((prev.smartphone || {})[spec] || {}).sphere_images
            ? ((prev.smartphone || {})[spec] || {}).sphere_images.filter(
                (_, i) => i !== index,
              )
            : [],
        },
      },
    }));
    showToast("Image Removed", "Sphere image removed", "info");
  };

  // Remove image
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    showToast("Image Removed", "Image removed successfully", "info");
  };

  // Get selected brand name
  const getSelectedBrandName = () => {
    const selectedBrand = brandsList.find(
      (brand) => brand.id === Number(formData.product.brand_id),
    );
    return selectedBrand ? selectedBrand.name : "";
  };

  // Get selected category label
  const getSelectedCategoryLabel = () => {
    const selectedCategory = categoriesList.find(
      (cat) => cat.value === formData.smartphone.segment,
    );
    return selectedCategory ? selectedCategory.label : "";
  };

  // Specification tabs - updated with SIM icon for connectivity
  const specTabs = [
    { id: "build_design", label: "Build & Design", icon: FaMobile },
    { id: "display", label: "Display", icon: FaDesktop },
    { id: "performance", label: "Performance", icon: FaMicrochip },
    { id: "camera", label: "Camera", icon: FaCamera },
    { id: "battery", label: "Battery", icon: FaMicrochip },
    { id: "connectivity", label: "Connectivity", icon: FaSimCard },
    { id: "network", label: "Network", icon: FaWifi },
    { id: "ports", label: "Ports", icon: FaCog },
    { id: "audio", label: "Audio", icon: FaCog },
    { id: "multimedia", label: "Multimedia", icon: FaDesktop },
  ];

  const getSpecUiHints = (specId) => {
    const base = {
      labelOverrides: {
        ai_features: "AI Features",
        score: "Score",
        ip_rating: "IP Rating",
        water_dust_resistance: "Water/Dust Resistance",
        screen_to_body_ratio: "Screen-to-Body Ratio",
        touch_sampling_rate: "Touch Sampling Rate",
        pixel_density: "Pixel Density",
        rated_capacity: "Rated Capacity",
        fast_charging: "Fast Charging",
        wireless_charging: "Wireless Charging",
        fm_radio: "FM Radio",
        antutu_score: "AnTuTu Score",
        cpu_cores: "CPU Cores",
        "5g_bands": "5G Bands",
        "5g_support": "5G Support",
        esim_support: "eSIM Support",
      },
      helpText: {
        ai_features: "Add one feature per item (e.g., AI Unblur)",
      },
      placeholderOverrides: {},
      arrayItemPlaceholderOverrides: {
        ai_features: "e.g., AI Unblur",
      },
    };

    const perSpec = {
      build_design: {
        labelOverrides: {
          material: "Materials",
          colors: "Colors",
          durability: "Durability / Warranty",
        },
        helpText: {
          colors: "Add one color name per item (e.g., Black Velvet)",
          ip_rating: "Ingress protection rating (e.g., IP68)",
        },
        placeholderOverrides: {
          height: "e.g., 150.8 mm",
          width: "e.g., 71.7 mm",
          thickness: "e.g., 8.2 mm",
          weight: "e.g., 185 g",
          material: "e.g., Glass / Aluminum",
          ip_rating: "e.g., IP68",
          durability: "e.g., Gorilla Glass / Warranty details",
        },
        arrayItemPlaceholderOverrides: {
          colors: "e.g., Black Velvet",
        },
      },
      display: {
        labelOverrides: {
          size: "Display Size",
          resolution: "Display Resolution",
          type: "Display Type",
          panel: "Panel Type",
          refresh_rate: "Refresh Rate",
          brightness: "Brightness",
          color_depth: "Color Depth",
          cover_glass: "Cover Glass",
          wet_touch: "Wet Touch",
          glove_mode: "Glove Mode",
          protection: "Protection",
        },
        placeholderOverrides: {
          size: "e.g., 6.32 inch",
          resolution: "e.g., 2640 × 1216",
          panel: "e.g., LTPO AMOLED",
          refresh_rate: "e.g., 1–120 Hz",
          touch_sampling_rate: "e.g., 240 Hz",
          screen_to_body_ratio: "e.g., 93%",
          pixel_density: "e.g., 460 PPI",
          brightness: "e.g., 1600 nits (HBM)",
          color_depth: "e.g., 10-bit, 100% DCI-P3",
          cover_glass: "e.g., Gorilla Glass",
          protection: "e.g., Gorilla Glass Victus",
        },
      },
      performance: {
        labelOverrides: {
          operating_system: "OS (Android/iOS)",
          os: "UI / Skin",
          processor: "Processor",
          chipset: "Chipset",
          benchmark_score: "Benchmark Score",
          ram_boost: "RAM Boost",
          ram_type: "RAM Type",
          storage: "Storage",
          storage_type: "Storage Type",
          network_boost: "Network Boost / Gaming",
        },
        placeholderOverrides: {
          operating_system: "e.g., Android 15 (OxygenOS 15)",
          os: "e.g., OxygenOS / One UI / iOS",
          processor: "e.g., Snapdragon 8 Elite",
          chipset: "e.g., Snapdragon 8 Elite",
          cpu: "e.g., Oryon @ 4.32 GHz",
          gpu: "e.g., Adreno 830",
          benchmark_score: "e.g., 1,850,000",
          antutu_score: "e.g., 2,000,000",
          ram_type: "e.g., LPDDR5X",
          storage_type: "e.g., UFS 4.0",
          storage: "e.g., 256 GB / 512 GB",
        },
      },
      camera: {
        labelOverrides: {
          rear_camera: "Rear Camera System",
          front_camera: "Front (Selfie) Camera",
          ultra_wide: "Ultra Wide Lens",
          wide: "Wide Lens",
          telephoto: "Telephoto Lens",
          periscope: "Periscope Lens",
          macro: "Macro Lens",
          depth: "Depth Sensor",
          main: "Main Lens",
          sensor: "Sensor Model",
          resolution: "Resolution",
          aperture: "Aperture",
          focal_length: "Focal Length",
          optical_zoom: "Optical Zoom",
          digital_zoom: "Digital Zoom",
          ois: "Optical Stabilization (OIS)",
          eis: "Electronic Stabilization (EIS)",
          autofocus: "Autofocus",
          fov: "Field of View (FOV)",
          underwater_photography: "Underwater Mode",
        },
        helpText: {
          rear_camera:
            "Add lenses under this (main, telephoto, ultra wide, etc.)",
          front_camera: "Selfie camera details",
        },
        placeholderOverrides: {
          resolution: "e.g., 50 MP",
          sensor: "e.g., Sony LYT-700",
          aperture: "e.g., f/1.8",
          optical_zoom: "e.g., 2x",
          digital_zoom: "e.g., 10x",
          focal_length: "e.g., 24 mm",
          ois: "e.g., Supported / No",
          eis: "e.g., Supported / No",
          autofocus: "e.g., Supported / No",
          fov: "e.g., 90 deg",
        },
      },
      battery: {
        labelOverrides: {
          capacity: "Battery Capacity",
          type: "Battery Type",
          charging: "Charging Type",
        },
        placeholderOverrides: {
          capacity: "e.g., 5850 mAh",
          rated_capacity: "e.g., 5700 mAh",
          fast_charging: "e.g., 80W SUPERVOOC",
          wireless_charging: "e.g., 50W",
          charging: "e.g., USB Type-C",
          type: "e.g., Li-Po",
        },
      },
      connectivity: {
        labelOverrides: {
          audio: "Audio Technology",
          sim_type: "SIM Type",
          sim_slots: "SIM Slots",
          dual_standby: "Dual Standby",
        },
        helpText: {
          wifi: "Add supported Wi-Fi standards (Wi-Fi 7, Wi-Fi 6E, etc.)",
        },
        placeholderOverrides: {
          bluetooth: "e.g., Bluetooth 6.0",
          usb: "e.g., USB Type-C",
          audio: "e.g., Dolby Atmos / OReality Audio",
          nfc: "e.g., Yes / No",
          sim_type: "e.g., Dual Nano-SIM + eSIM",
          sim_slots: "e.g., 2",
          esim_support: "e.g., Yes / No",
          dual_standby: "e.g., Yes / No",
        },
        arrayItemPlaceholderOverrides: {
          wifi: "e.g., Wi-Fi 7",
        },
      },
      network: {
        labelOverrides: {
          sim: "SIM",
          network_types: "Network Types",
          network_bands: "Network Bands",
        },
        helpText: {
          "5g_bands": "Add one band per item (e.g., n78)",
        },
        placeholderOverrides: {
          sim: "e.g., Dual Nano-SIM + eSIM",
          network_types: "e.g., 2G / 3G / 4G / 5G",
          "5g_support": "e.g., Yes / No",
          network_bands: "e.g., SA/NSA, LTE bands, etc.",
        },
        arrayItemPlaceholderOverrides: {
          "5g_bands": "e.g., n78",
        },
      },
      ports: {
        labelOverrides: {
          usb_type: "USB Type",
          headphone_jack: "Headphone Jack",
          charging_port: "Charging Port",
        },
        placeholderOverrides: {
          usb_type: "e.g., USB-C (USB 3.1)",
          headphone_jack: "e.g., Yes / No",
          charging_port: "e.g., USB Type-C",
        },
      },
      audio: {
        labelOverrides: {
          speaker_type: "Speaker Type",
          speaker_count: "Speaker Count",
          max_volume: "Max Volume",
          microphone_count: "Microphone Count",
          microphone_features: "Microphone Features",
        },
        placeholderOverrides: {
          speakers: "e.g., Stereo speakers",
          speaker_type: "e.g., Dual speaker",
          speaker_count: "e.g., 2",
          max_volume: "e.g., 90 dB",
          microphone: "e.g., Dual mic",
          microphone_count: "e.g., 2",
          microphone_features: "e.g., Noise cancellation",
          audio_jack: "e.g., No",
        },
      },
      multimedia: {
        labelOverrides: {
          video_formats: "Video Formats",
          audio_formats: "Audio Formats",
          rear_video: "Rear Video",
          front_video: "Front Video",
          slow_motion: "Slow Motion",
        },
        helpText: {
          rear_video: "Add supported FPS per resolution (4K, 1080p, etc.)",
          front_video: "Selfie video recording options",
          slow_motion: "Add resolution + FPS pairs (e.g., 1080p 240fps)",
        },
        placeholderOverrides: {
          video_formats: "e.g., MP4, MKV",
          audio_formats: "e.g., AAC, FLAC",
          fm_radio: "e.g., Yes / No",
        },
        arrayItemPlaceholderOverrides: {
          "4k": "e.g., 60fps",
          "1080p": "e.g., 60fps",
          "720p": "e.g., 30fps",
          slow_motion: "e.g., 1080p 240fps",
        },
      },
    };

    const spec = perSpec[specId] || {};
    return {
      labelOverrides: {
        ...base.labelOverrides,
        ...(spec.labelOverrides || {}),
      },
      helpText: {
        ...base.helpText,
        ...(spec.helpText || {}),
      },
      placeholderOverrides: {
        ...base.placeholderOverrides,
        ...(spec.placeholderOverrides || {}),
      },
      arrayItemPlaceholderOverrides: {
        ...base.arrayItemPlaceholderOverrides,
        ...(spec.arrayItemPlaceholderOverrides || {}),
      },
    };
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.product.name.trim()) {
      showToast("Validation Error", "Mobile name is required", "error");
      setIsLoading(false);
      return;
    }

    if (!formData.product.brand_id) {
      showToast("Validation Error", "Brand is required", "error");
      setIsLoading(false);
      return;
    }

    if (!formData.smartphone.model.trim()) {
      showToast("Validation Error", "Model is required", "error");
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
          smartphone: {
            segment: formData.smartphone.segment,
            category: formData.smartphone.segment,
            brand: formData.smartphone.brand,
            model: formData.smartphone.model,
            launch_date: formData.smartphone.launch_date || null,
            colors: formData.smartphone.colors.filter(
            (color) => color.name && color.code,
          ),
          build_design: formData.smartphone.build_design,
          display: formData.smartphone.display,
          performance: formData.smartphone.performance,
          camera: formData.smartphone.camera,
          battery: formData.smartphone.battery,
          connectivity: formData.smartphone.connectivity,
          network: formData.smartphone.network,
          ports: formData.smartphone.ports,
          audio: formData.smartphone.audio,
          multimedia: formData.smartphone.multimedia,
          sensors: formData.smartphone.sensors || null,
        },
        images: formData.images,
        variants: formData.variants.map((v) => ({
          ram: v.ram || null,
          storage: v.storage || null,
          base_price: v.base_price ? Number(v.base_price) : null,
          stores: v.stores.map((s) => ({
            store_name: s.store_name || null,
            price: s.price ? Number(s.price) : null,
            url: s.url || null,
            offer_text: s.offer_text || null,
            discount: s.discount || null,
            offers: s.offers || null,
          })),
        })),
        published: publishEnabled,
        // Also include the "suffix json" payload shape for compatibility
        // with endpoints that expect flattened *_json fields.
        product_name: formData.product.name,
        product_type: "smartphone",
        brand_name: formData.smartphone.brand,
        category: formData.smartphone.segment,
        model: formData.smartphone.model,
        launch_date: formData.smartphone.launch_date || null,
        sensors: formData.smartphone.sensors || null,
        publish: publishEnabled,
        images_json: formData.images,
        build_design_json: formData.smartphone.build_design,
        display_json: formData.smartphone.display,
        performance_json: formData.smartphone.performance,
        camera_json: formData.smartphone.camera,
        battery_json: formData.smartphone.battery,
        connectivity_json: formData.smartphone.connectivity,
        network_json: formData.smartphone.network,
        ports_json: formData.smartphone.ports,
        audio_json: formData.smartphone.audio,
        multimedia_json: formData.smartphone.multimedia,
        variants_json: formData.variants.map((v) => ({
          ram: v.ram || null,
          storage: v.storage || null,
          base_price: v.base_price ? Number(v.base_price) : null,
          variant_id: null,
          store_prices: (v.stores || []).map((s) => ({
            store: s.store_name || null,
            store_name: s.store_name || null,
            price: s.price ? Number(s.price) : null,
            currency: s.currency || undefined,
            availability: s.availability || undefined,
            url: s.url || null,
            offer_text: s.offer_text || null,
            discount: s.discount || null,
            offers: s.offers || null,
          })),
        })),
      };

      const res = await fetch(buildUrl("/api/smartphones"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) throw new Error("Failed to create mobile");

      showToast(
        "Success",
        `Mobile "${formData.product.name}" created ${
          publishEnabled ? "and published" : "as draft"
        } successfully!`,
        "success",
      );

      // Reset form
      clearDraft();
      setFormData(createInitialMobileFormData());
      setPublishEnabled(false);
    } catch (error) {
      console.error("Create mobile error:", error);
      showToast(
        "Creation Failed",
        `Error creating mobile: ${error.message}`,
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

  const specUi = getSpecUiHints(activeSpecTab);

  // Custom Dropdown Component - FIXED VERSION
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
    // Get the appropriate label and value keys based on type
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
            {/* Search input */}
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

            {/* Options list */}
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

  // Custom Date Picker Component with Calendar Grid
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

    return (
      <div className="relative" ref={datePickerRef}>
        <button
          type="button"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`w-full px-4 py-2.5 border-2 transition-all rounded-lg bg-white text-left flex items-center justify-between ${
            formData.smartphone.launch_date
              ? "border-blue-400 shadow-sm"
              : "border-gray-300 hover:border-gray-400"
          } hover:shadow-md`}
        >
          <div className="flex items-center space-x-3">
            <FaCalendar
              className={`text-lg ${formData.smartphone.launch_date ? "text-blue-500" : "text-gray-400"}`}
            />
            <div>
              <span
                className={`block font-medium ${
                  formData.smartphone.launch_date
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {formData.smartphone.launch_date
                  ? new Date(
                      formData.smartphone.launch_date,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Select Launch Date"}
              </span>
              {formData.smartphone.launch_date && (
                <span className="text-xs text-gray-500">
                  {new Date(formData.smartphone.launch_date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                    },
                  )}
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
              Create New Mobile
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Add a new smartphone to your inventory
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => window.history.back()}
              className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium text-xs sm:text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin text-sm" />
              ) : (
                <FaSave className="text-sm" />
              )}
              <span className="hidden sm:inline">
                {isLoading ? "Creating..." : "Create Mobile"}
              </span>
              <span className="sm:hidden">{isLoading ? "..." : "Create"}</span>
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
                  Name, brand, model and segment
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
                    value={formData.product.name}
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
                    value={formData.smartphone.model}
                    onChange={handleSmartphoneChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., A3103"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Segment *
                  </label>
                  <CustomDropdown
                    value={formData.smartphone.segment}
                    placeholder="Select Segment"
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
                  title="Upload mobile images"
                  aria-label="Upload mobile images"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) handleImageUpload(files);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-400 transition-colors">
                  <FaCamera className="text-gray-400 text-lg sm:text-xl mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">
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

        {/* Colors Section with name and color picker */}
        <div className="bg-white  shadow-md">
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
                  {formData.smartphone.colors.length} colors added
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

              {formData.smartphone.colors.map((color, index) => (
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
                        const newColors = formData.smartphone.colors.filter(
                          (_, i) => i !== index,
                        );
                        setFormData((prev) => ({
                          ...prev,
                          smartphone: { ...prev.smartphone, colors: newColors },
                        }));
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
                          const newColors = [...formData.smartphone.colors];
                          newColors[index] = {
                            ...newColors[index],
                            name: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            smartphone: {
                              ...prev.smartphone,
                              colors: newColors,
                            },
                          }));
                        }}
                        placeholder="e.g., Midnight Black, Alpine Green"
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
                            const newColors = [...formData.smartphone.colors];
                            newColors[index] = {
                              ...newColors[index],
                              code: e.target.value,
                            };
                            setFormData((prev) => ({
                              ...prev,
                              smartphone: {
                                ...prev.smartphone,
                                colors: newColors,
                              },
                            }));
                          }}
                          title="Pick a color"
                          aria-label={`Color code${color.name ? ` for ${color.name}` : ""}`}
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
        <div className="bg-white shadow-md">
          <button
            onClick={() => toggleSection("variants")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FaBoxOpen className="text-green-600" />
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
                          const newVariants = [...formData.variants];
                          newVariants[index] = {
                            ...newVariants[index],
                            ram: opt.name,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            variants: newVariants,
                          }));
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
                          const newVariants = [...formData.variants];
                          newVariants[index] = {
                            ...newVariants[index],
                            storage: opt.name,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            variants: newVariants,
                          }));
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
                        placeholder="e.g., 59999"
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
                              value={store.offers}
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
        <div className="bg-white shadow-md">
          <button
            onClick={() => toggleSection("specs")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaMicrochip className="text-orange-600" />
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
                {/* Foldable toggle - device level */}
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!formData.smartphone.is_foldable}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setFormData((prev) => {
                          const cur = prev.smartphone || {};
                          const updated = { ...cur, is_foldable: enabled };
                          // If enabling, for current active tab, move current flat values into 'flip' group
                          if (
                            enabled &&
                            cur[activeSpecTab] &&
                            typeof cur[activeSpecTab] === "object"
                          ) {
                            const existing = cur[activeSpecTab];
                            // if already has fold/flip, keep as is
                            if (!existing.fold && !existing.flip) {
                              updated[activeSpecTab] = {
                                fold: {},
                                flip: { ...existing },
                              };
                            }
                          }
                          // If disabling, flatten current flip into plain object for active tab
                          if (
                            !enabled &&
                            cur[activeSpecTab] &&
                            cur[activeSpecTab].flip
                          ) {
                            updated[activeSpecTab] = {
                              ...cur[activeSpecTab].flip,
                            };
                          }
                          return { ...prev, smartphone: updated };
                        });
                      }}
                      title="Enable to edit Fold and Flip specs separately"
                      aria-label="Foldable device toggle"
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">
                      Foldable device
                    </span>
                  </label>
                </div>
                {activeSpecTab === "connectivity" && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                    <div className="flex items-center space-x-2">
                      <FaSimCard className="text-blue-500" />
                      <span className="text-sm text-blue-700">
                        Enter SIM details like SIM type, slots, eSIM support,
                        etc.
                      </span>
                    </div>
                  </div>
                )}

                {formData.smartphone.is_foldable ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Fold</h4>
                      <DynamicForm
                        data={formData.smartphone[activeSpecTab]?.fold || {}}
                        onChange={(next) =>
                          setFoldableSpecSectionSide(activeSpecTab, "fold", next)
                        }
                        hiddenKeys={specEditorHiddenKeys}
                        labelOverrides={specUi.labelOverrides}
                        helpText={specUi.helpText}
                        placeholderOverrides={specUi.placeholderOverrides}
                        arrayItemPlaceholderOverrides={
                          specUi.arrayItemPlaceholderOverrides
                        }
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2">Flip</h4>
                      <DynamicForm
                        data={formData.smartphone[activeSpecTab]?.flip || {}}
                        onChange={(next) =>
                          setFoldableSpecSectionSide(activeSpecTab, "flip", next)
                        }
                        hiddenKeys={specEditorHiddenKeys}
                        labelOverrides={specUi.labelOverrides}
                        helpText={specUi.helpText}
                        placeholderOverrides={specUi.placeholderOverrides}
                        arrayItemPlaceholderOverrides={
                          specUi.arrayItemPlaceholderOverrides
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <DynamicForm
                    data={formData.smartphone[activeSpecTab] || {}}
                    onChange={(next) => setSpecSection(activeSpecTab, next)}
                    hiddenKeys={specEditorHiddenKeys}
                    labelOverrides={specUi.labelOverrides}
                    helpText={specUi.helpText}
                    placeholderOverrides={specUi.placeholderOverrides}
                    arrayItemPlaceholderOverrides={
                      specUi.arrayItemPlaceholderOverrides
                    }
                  />
                )}

                {/* Sphere rating inputs for active spec tab */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3">Sphere Rating</h4>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="0-100"
                      title="Enter a score between 0 and 100"
                      aria-label="Sphere score (0 to 100)"
                      value={
                        formData.smartphone[activeSpecTab]?.sphere_score ?? ""
                      }
                      onChange={(e) =>
                        handleJsonbChange(
                          activeSpecTab,
                          "sphere_score",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <textarea
                      value={
                        formData.smartphone[activeSpecTab]?.sphere_description ||
                        ""
                      }
                      onChange={(e) =>
                        handleJsonbChange(
                          activeSpecTab,
                          "sphere_description",
                          e.target.value,
                        )
                      }
                      placeholder="Write a short summary for this section (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm h-20"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Images
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      title="Upload sphere rating images"
                      aria-label="Upload sphere rating images"
                      onChange={(e) =>
                        handleSphereImagesUpload(activeSpecTab, e.target.files)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload 1+ images for this section (optional).
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        formData.smartphone[activeSpecTab]?.sphere_images || []
                      ).map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20">
                          <img
                            src={url}
                            alt={`sphere-${idx}`}
                            className="w-20 h-20 object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://via.placeholder.com/80?text=Image";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeSphereImage(activeSpecTab, idx)}
                            className="absolute top-0 right-0 bg-white rounded-full p-1 text-red-500 border"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sensors Section */}
        <div className="bg-white  shadow-md">
          <button
            onClick={() => toggleSection("sensors")}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <FaMicrochip className="text-red-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-800">Sensors</h2>
                <p className="text-sm text-gray-600">Add sensor information</p>
              </div>
            </div>
            {expandedSections.sensors ? <FaChevronDown /> : <FaChevronRight />}
          </button>

          {expandedSections.sensors && (
            <div className="p-4">
              <textarea
                name="sensors"
                value={formData.smartphone.sensors}
                onChange={handleSmartphoneChange}
                placeholder="Enter sensors (comma-separated or JSON array)..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-2">
                Example: Fingerprint, Accelerometer, Gyroscope, Compass
              </p>
            </div>
          )}
        </div>

        {/* Publish Toggle */}
        <div className="bg-white  shadow-md">
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
                      ? "Mobile will be published immediately"
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
                <span>Create Mobile</span>
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

export default CreateMobile;
