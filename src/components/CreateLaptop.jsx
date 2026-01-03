// components/CreateLaptop.js
import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
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
} from "react-icons/fa";

const CreateLaptop = () => {
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

  const [isLoading, setIsLoading] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState("cpu");
  const [customJsonFields, setCustomJsonFields] = useState({});
  const [brandsList, setBrandsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [publishEnabled, setPublishEnabled] = useState(false);
  const [toasts, setToasts] = useState([]);
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

  // Filter categories based on search (use fetched categories only)
  const filteredCategories = (categoriesList || []).filter((category) =>
    (category.label || "").toLowerCase().includes(categorySearch.toLowerCase())
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
        const res = await fetch("http://localhost:5000/api/brands");
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

  // Fetch categories and map laptop categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = Cookies.get("authToken");
        const res = await fetch("http://localhost:5000/api/categories", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        let rows = [];
        if (Array.isArray(data)) rows = data;
        else if (data && Array.isArray(data.categories)) rows = data.categories;
        else if (data && Array.isArray(data.data)) rows = data.data;
        else rows = data || [];

        rows = rows.map((r) => ({
          ...r,
          type: r.product_type || r.type || "",
          name: r.name || r.title || "",
        }));

        const laptopCats = rows
          .filter((r) => r.type || "")
          .map((r) => ({
            value: r.name || r.value || `cat_${r.id}`,
            label: r.name || r.title || r.value || `Category ${r.id}`,
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

  // Initialize date from form data
  useEffect(() => {
    if (formData.laptop.launch_date) {
      const date = new Date(formData.laptop.launch_date);
      setSelectedDate({
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
      });
    }
  }, [formData.laptop.launch_date]);

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
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
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

  // Handle brand selection
  const handleBrandSelect = (brand) => {
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        brand_id: brand.id,
      },
      laptop: {
        ...prev.laptop,
        brand: brand.name,
      },
    }));
    setShowBrandDropdown(false);
    setBrandSearch("");
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    const value = category && category.value ? category.value : category;
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
    setFormData((prev) => ({
      ...prev,
      laptop: {
        ...prev.laptop,
        [field]: {
          ...prev.laptop[field],
          [key]: value,
        },
      },
    }));
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

  // Add variant with updated store fields
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

  // Handle image upload
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setIsLoading(true);

    try {
      const uploadedImages = [];
      const cloudName =
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "damoxc2du";
      const uploadPreset =
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "Laptop image";

      for (const file of fileList) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("upload_preset", uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: uploadData }
        );

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        if (data.secure_url) uploadedImages.push(data.secure_url);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));

      showToast(
        "Upload Successful",
        `${uploadedImages.length} image(s) uploaded`,
        "success"
      );
    } catch (error) {
      console.error("Image upload error:", error);
      showToast("Upload Failed", "Error uploading images", "error");
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

  // Get selected brand name
  const getSelectedBrandName = () => {
    const selectedBrand = brandsList.find(
      (brand) => brand.id === Number(formData.product.brand_id)
    );
    return selectedBrand ? selectedBrand.name : "";
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
        "success"
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

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.product.name.trim()) {
      showToast("Validation Error", "Laptop name is required", "error");
      setIsLoading(false);
      return;
    }

    if (!formData.product.brand_id) {
      showToast("Validation Error", "Brand is required", "error");
      setIsLoading(false);
      return;
    }

    if (!formData.laptop.model.trim()) {
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
        laptop: {
          category: formData.laptop.category,
          brand: formData.laptop.brand,
          model: formData.laptop.model,
          launch_date: formData.laptop.launch_date || null,
          colors: formData.laptop.colors.filter(
            (color) => color.name && color.code
          ),
          cpu: formData.laptop.cpu,
          display: formData.laptop.display,
          memory: formData.laptop.memory,
          storage: formData.laptop.storage,
          battery: formData.laptop.battery,
          connectivity: formData.laptop.connectivity,
          physical: formData.laptop.physical,
          software: formData.laptop.software,
          features: formData.laptop.features.filter(Boolean),
          warranty: formData.laptop.warranty,
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
      };

      const res = await fetch("http://localhost:5000/api/laptops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create laptop");
      }

      showToast(
        "Success",
        `Laptop "${formData.product.name}" created ${
          publishEnabled ? "and published" : "as draft"
        } successfully!`,
        "success"
      );

      // Reset form
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
      setCustomJsonFields({});
      setPublishEnabled(false);
    } catch (error) {
      console.error("Create laptop error:", error);
      showToast(
        "Creation Failed",
        `Error creating laptop: ${error.message}`,
        "error"
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
                    type === "brand" ? "brands" : "categories"
                  }...`}
                  autoFocus
                />
              </div>
            </div>

            {/* Options list */}
            <div className="py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={type === "brand" ? option.id : option.value}
                    type="button"
                    onClick={() => onSelect(option)}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 ${
                      (
                        type === "brand"
                          ? option.id === value
                          : option.value === value
                      )
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {type === "brand" ? option.name : option.label}
                  </button>
                ))
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
                    }
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
              {/* Year Selector */}
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

              {/* Month Selector */}
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

              {/* Day Selector */}
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Create New Laptop
            </h1>
            <p className="text-gray-600 mt-1">
              Add a new laptop to your inventory
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
              {isLoading ? "Creating..." : "Create Laptop"}
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
                    name="model"
                    value={formData.laptop.model}
                    onChange={handleLaptopChange}
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
                      const sel = (categoriesList || []).find(
                        (c) => (c.value || c) === formData.laptop.category
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

        {/* Colors Section with name and color picker */}
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
                        const newColors = formData.laptop.colors.filter(
                          (_, i) => i !== index
                        );
                        setFormData((prev) => ({
                          ...prev,
                          laptop: { ...prev.laptop, colors: newColors },
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
                          const newColors = [...formData.laptop.colors];
                          newColors[index] = {
                            ...newColors[index],
                            name: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            laptop: { ...prev.laptop, colors: newColors },
                          }));
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
                            const newColors = [...formData.laptop.colors];
                            newColors[index] = {
                              ...newColors[index],
                              code: e.target.value,
                            };
                            setFormData((prev) => ({
                              ...prev,
                              laptop: { ...prev.laptop, colors: newColors },
                            }));
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
                      const newFeatures = [...formData.laptop.features];
                      newFeatures[index] = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        laptop: { ...prev.laptop, features: newFeatures },
                      }));
                    }}
                    placeholder="e.g., Backlit Keyboard"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      const newFeatures = formData.laptop.features.filter(
                        (_, i) => i !== index
                      );
                      setFormData((prev) => ({
                        ...prev,
                        laptop: { ...prev.laptop, features: newFeatures },
                      }));
                    }}
                    className="ml-3 text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                Tip: Add features like "Fingerprint Sensor", "Backlit Keyboard",
                "Webcam", "Numeric Keypad", "HDMI Port", "USB-C", etc.
              </p>
            </div>
          )}
        </div>

        {/* Variants Section with updated store fields */}
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
                        const newVariants = formData.variants.filter(
                          (_, i) => i !== index
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
                      <input
                        type="text"
                        value={variant.ram}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index] = {
                            ...newVariants[index],
                            ram: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            variants: newVariants,
                          }));
                        }}
                        placeholder="e.g., 16GB"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Storage
                      </label>
                      <input
                        type="text"
                        value={variant.storage}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index] = {
                            ...newVariants[index],
                            storage: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            variants: newVariants,
                          }));
                        }}
                        placeholder="e.g., 512GB SSD"
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
                            <input
                              type="text"
                              value={store.store_name}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].stores[storeIndex] = {
                                  ...newVariants[index].stores[storeIndex],
                                  store_name: e.target.value,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: newVariants,
                                }));
                              }}
                              placeholder="e.g., Amazon, Flipkart"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
                              Product URL
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
                            e.target.value
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
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          placeholder={`Enter ${customField.replace(
                            /_/g,
                            " "
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
                    )
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

        {/* Warranty Section (expanded for easy access) */}
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
                        e.target.value
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
                        e.target.value
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
                        e.target.value
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
                      ? "Laptop will be published immediately"
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
                <span>Create Laptop</span>
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

export default CreateLaptop;
