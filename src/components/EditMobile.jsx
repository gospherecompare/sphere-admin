// components/EditMobile.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
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
  FaChevronUp,
  FaExclamationTriangle,
  FaPalette,
  FaTags,
  FaBoxOpen,
  FaCog,
} from "react-icons/fa";

const EditMobile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState("build_design");
  const [publishEnabled, setPublishEnabled] = useState(false);
  const [showSaveOverlay, setShowSaveOverlay] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandOther, setBrandOther] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [customJsonFields, setCustomJsonFields] = useState({});
  const [activeSection, setActiveSection] = useState("basic");
  const formRef = useRef(null);

  // Default form structure (same as CreateMobile)
  const defaultFormData = {
    name: "",
    category: "Smart Phone",
    brand: "",
    model: "",
    rating: "",
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
    connectivity_network: {},
    sensors: "",
    ports: {},
    audio: {},
    multimedia: {},
  };

  // Form state - initialized with defaults
  const [formData, setFormData] = useState(defaultFormData);

  // Specification tabs configuration (same as CreateMobile)
  const specTabs = [
    { id: "build_design", label: "Build & Design", icon: FaMobile },
    { id: "display", label: "Display", icon: FaDesktop },
    { id: "performance", label: "Performance", icon: FaMicrochip },
    { id: "camera", label: "Camera", icon: FaCamera },
    { id: "battery", label: "Battery", icon: FaBatteryFull },
    { id: "connectivity_network", label: "Connectivity", icon: FaWifi },
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
        const res = await fetch("http://localhost:5000/api/categories");
        if (!res.ok) return;
        const data = await res.json();
        const names = Array.isArray(data)
          ? data.map((c) => c.name).filter(Boolean)
          : [];
        setCategoriesList(names);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
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
        console.log(`Fetching mobile data for ID: ${id}`);

        const response = await fetch(
          `http://localhost:5000/api/smartphone/${id}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(`Failed to load mobile (${response.status})`);
        }

        const responseData = await response.json();
        console.log("Full API response:", responseData);

        // Extract data from the response structure
        const apiData = responseData?.data || responseData;

        console.log("Extracted mobile data:", apiData);

        if (!apiData || Object.keys(apiData).length === 0) {
          throw new Error("Empty response from server");
        }

        // helper to safely parse JSON strings returned by the server
        const safeParse = (val, fallback) => {
          if (val === undefined || val === null) return fallback;
          if (Array.isArray(val) || typeof val === "object") return val;
          if (typeof val === "string") {
            try {
              const parsed = JSON.parse(val);
              return parsed;
            } catch (e) {
              // not JSON, return original string
              return val;
            }
          }
          return val;
        };

        // Normalize variants and extract nested store prices
        const rawVariants = Array.isArray(apiData?.variants)
          ? apiData.variants
          : [];
        const variants = rawVariants.map((v) => ({
          id: v?.id,
          ram: v?.ram || "",
          storage: v?.storage || v?.storage_size || "",
          base_price:
            v?.base_price !== undefined && v?.base_price !== null
              ? String(v.base_price)
              : "",
          color_name: v?.color_name || v?.color || "",
          color_code: v?.color_code || v?.colorCode || "",
          custom_properties: v?.custom_properties || {},
          store_prices: Array.isArray(v?.store_prices)
            ? v.store_prices
            : safeParse(v?.store_prices, []),
        }));

        // Build variant_store_prices flat array by iterating variants' store_prices
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
                // ✅ existing variant → real DB id
                payload.variant_id = v.id;
              } else {
                // ✅ new variant → index-based mapping
                payload.variant_index = idx;
              }

              variant_store_prices.push(payload);
            });
          }
        });

        // Transform API data to match our form structure, parsing JSON-like fields when needed
        const transformedData = {
          name: apiData?.name || "",
          category: apiData?.category || "Smart Phone",
          brand: apiData?.brand || "",
          model: apiData?.model || "",
          rating:
            apiData?.rating !== undefined && apiData.rating !== null
              ? String(apiData.rating)
              : "",
          launch_date: apiData?.launch_date
            ? new Date(apiData.launch_date).toISOString().split("T")[0]
            : "",
          images: Array.isArray(safeParse(apiData?.images, []))
            ? safeParse(apiData?.images, [])
            : [],

          // Colors - prefer explicit colors array, otherwise derive from variants
          colors:
            Array.isArray(safeParse(apiData?.colors, [])) &&
            safeParse(apiData?.colors, []).length > 0
              ? safeParse(apiData?.colors, []).map((c) => ({
                  id: c?.id || Date.now() + Math.random(),
                  name: c?.name || "",
                  code: c?.code || "#000000",
                }))
              : extractColorsFromData({ variants }),

          // Variants array normalized
          variants: variants.map((v) => ({
            id: v.id,
            ram: v.ram || "",
            storage: v.storage || "",
            base_price: v.base_price || "",
            custom_properties: v.custom_properties || {},
          })),

          // Flattened store prices (local variant index references)
          variant_store_prices: variant_store_prices,

          // JSONB fields (parse stringified JSON when necessary)
          build_design: safeParse(apiData?.build_design, {}),
          display: safeParse(apiData?.display, {}),
          performance: safeParse(apiData?.performance, {}),
          camera: safeParse(apiData?.camera, {}),
          battery: safeParse(apiData?.battery, {}),
          connectivity_network: safeParse(apiData?.connectivity_network, {}),
          sensors:
            typeof apiData?.sensors === "string"
              ? apiData.sensors
              : safeParse(apiData?.sensors, ""),
          ports: safeParse(apiData?.ports, {}),
          audio: safeParse(apiData?.audio, {}),
          multimedia: safeParse(apiData?.multimedia, {}),
        };

        console.log("Transformed form data:", transformedData);

        // Attempt to infer performance ram/storage types from variants when not set
        try {
          const inferred = inferTypesFromVariants(
            transformedData.variants || []
          );
          transformedData.performance = transformedData.performance || {};
          if (
            (!transformedData.performance.ram_type ||
              transformedData.performance.ram_type === "") &&
            inferred.ram_type
          ) {
            transformedData.performance.ram_type = inferred.ram_type;
          }
          if (
            (!transformedData.performance.storage_type ||
              transformedData.performance.storage_type === "") &&
            inferred.storage_type
          ) {
            transformedData.performance.storage_type = inferred.storage_type;
          }
        } catch (e) {
          console.warn("Could not infer performance types:", e);
        }

        // Set form data
        setFormData(transformedData);

        // Check if brand is in categories list
        if (apiData.brand && categoriesList.length > 0) {
          setBrandOther(!categoriesList.includes(apiData.brand));
        }

        // Set publish status
        if (apiData.published !== undefined) {
          setPublishEnabled(apiData.published);
        }

        setDataLoaded(true);
      } catch (err) {
        console.error("Error loading mobile data:", err);
        setError(err.message || "Failed to load mobile data");
      } finally {
        setIsLoading(false);
      }
    };

    loadMobileData();
  }, [id]);

  // Helper function to extract colors from API data
  const extractColorsFromData = (apiData) => {
    const colors = new Map();

    // Check if colors array exists
    if (Array.isArray(apiData.colors) && apiData.colors.length > 0) {
      return apiData.colors.map((c) => ({
        id: c?.id || Date.now() + Math.random(),
        name: c?.name || "",
        code: c?.code || "#000000",
      }));
    }

    // Fallback: Extract colors from variants
    if (Array.isArray(apiData.variants)) {
      apiData.variants.forEach((variant) => {
        if (variant.color_name) {
          const key = `${variant.color_name}-${
            variant.color_code || "#000000"
          }`;
          if (!colors.has(key)) {
            colors.set(key, {
              id: Date.now() + Math.random(),
              name: variant.color_name,
              code: variant.color_code || "#000000",
            });
          }
        }
      });
    }

    return Array.from(colors.values());
  };

  // Infer ram_type and storage_type from variants (collect parts split by '/')
  const inferTypesFromVariants = (variants) => {
    if (!Array.isArray(variants) || variants.length === 0)
      return { ram_type: "", storage_type: "" };

    // Single variant: return raw values (trimmed)
    if (variants.length === 1) {
      const v = variants[0] || {};
      return {
        ram_type: v.ram && typeof v.ram === "string" ? v.ram.trim() : "",
        storage_type:
          v.storage && typeof v.storage === "string" ? v.storage.trim() : "",
      };
    }

    // Multiple variants: collect unique parts from '/'-separated values
    const ramSet = new Set();
    const storageSet = new Set();

    variants.forEach((variant) => {
      if (variant.ram && typeof variant.ram === "string") {
        variant.ram
          .split("/")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((part) => ramSet.add(part));
      }

      if (variant.storage && typeof variant.storage === "string") {
        variant.storage
          .split("/")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((part) => storageSet.add(part));
      }
    });

    return {
      ram_type: Array.from(ramSet).join("/"),
      storage_type: Array.from(storageSet).join("/"),
    };
  };

  // Handle basic input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle JSONB object changes
  const handleJsonbChange = (field, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value,
      },
    }));
  };

  // Handle array field changes
  const handleArrayFieldChange = (field, index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === index ? { ...item, [key]: value } : item
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
      const updated = { ...prev, [field]: newArr };

      // If removing a variant, recompute performance types
      if (field === "variants") {
        const inferred = inferTypesFromVariants(newArr || []);
        const updatedPerformance = { ...(prev.performance || {}) };

        if (!Array.isArray(newArr) || newArr.length === 0) {
          updatedPerformance.ram_type = "";
          updatedPerformance.storage_type = "";
        } else if (newArr.length === 1) {
          const single = newArr[0] || {};
          updatedPerformance.ram_type =
            single.ram && typeof single.ram === "string"
              ? single.ram.trim()
              : "";
          updatedPerformance.storage_type =
            single.storage && typeof single.storage === "string"
              ? single.storage.trim()
              : "";
        } else {
          updatedPerformance.ram_type = inferred.ram_type || "";
          updatedPerformance.storage_type = inferred.storage_type || "";
        }

        updated.performance = updatedPerformance;
      }

      return updated;
    });
  };

  // Delete a color on the server (by index) and update local state
  const handleDeleteColor = async (index) => {
    if (!id) {
      removeArrayFieldItem("colors", index);
      return;
    }

    if (!confirm("Delete this color?")) return;

    try {
      const token = Cookies.get("authToken");
      const res = await fetch(
        `http://localhost:5000/api/smartphone/${id}/color/${index}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Server responded ${res.status}`);
      }
      const data = await res.json();
      setFormData((prev) => ({ ...prev, colors: data.colors || [] }));
    } catch (err) {
      console.error("Delete color failed:", err);
      alert("Failed to delete color: " + (err.message || ""));
    }
  };

  // Delete a variant (call API if persisted) and update local state including related store prices
  const handleDeleteVariant = async (index) => {
    const variant = formData.variants && formData.variants[index];
    if (!variant) return;

    if (!confirm("Delete this variant?")) return;

    // If persisted variant (has id), call server
    if (variant.id) {
      try {
        const token = Cookies.get("authToken");
        const res = await fetch(
          `http://localhost:5000/api/variant/${variant.id}`,
          {
            method: "DELETE",
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Server responded ${res.status}`);
        }

        // remove variant locally and also remove any store prices with variant_id matching
        setFormData((prev) => {
          const newVariants = prev.variants.filter((_, i) => i !== index);
          const newPrices = (prev.variant_store_prices || []).filter((sp) => {
            if (sp.variant_id !== undefined && sp.variant_id !== null) {
              return sp.variant_id !== variant.id;
            }
            // variant_index references local indices — remove those referencing this index
            if (sp.variant_index !== undefined && sp.variant_index !== null) {
              return sp.variant_index !== index;
            }
            return true;
          });

          // Also adjust any variant_index values greater than removed index
          const adjustedPrices = newPrices.map((sp) => {
            if (sp.variant_index !== undefined && sp.variant_index !== null) {
              if (sp.variant_index > index)
                return { ...sp, variant_index: sp.variant_index - 1 };
            }
            return sp;
          });

          const inferred = inferTypesFromVariants(newVariants || []);
          const updatedPerformance = {};
          if (!newVariants || newVariants.length === 0) {
            updatedPerformance.ram_type = "";
            updatedPerformance.storage_type = "";
          } else if (newVariants.length === 1) {
            updatedPerformance.ram_type = newVariants[0].ram || "";
            updatedPerformance.storage_type = newVariants[0].storage || "";
          } else {
            updatedPerformance.ram_type = inferred.ram_type || "";
            updatedPerformance.storage_type = inferred.storage_type || "";
          }

          return {
            ...prev,
            variants: newVariants,
            variant_store_prices: adjustedPrices,
            performance: { ...(prev.performance || {}), ...updatedPerformance },
          };
        });
      } catch (err) {
        console.error("Delete variant failed:", err);
        alert("Failed to delete variant: " + (err.message || ""));
      }
    } else {
      // Not persisted: remove locally and adjust indices on store prices
      setFormData((prev) => {
        const newVariants = prev.variants.filter((_, i) => i !== index);
        let newPrices = (prev.variant_store_prices || []).filter((sp) => {
          if (sp.variant_index !== undefined && sp.variant_index !== null) {
            return sp.variant_index !== index; // remove ones that targeted removed variant
          }
          return true;
        });

        // decrement variant_index values greater than removed index
        newPrices = newPrices.map((sp) => {
          if (sp.variant_index !== undefined && sp.variant_index !== null) {
            if (sp.variant_index > index)
              return { ...sp, variant_index: sp.variant_index - 1 };
          }
          return sp;
        });

        const inferred = inferTypesFromVariants(newVariants || []);
        const updatedPerformance = {};
        if (!newVariants || newVariants.length === 0) {
          updatedPerformance.ram_type = "";
          updatedPerformance.storage_type = "";
        } else if (newVariants.length === 1) {
          updatedPerformance.ram_type = newVariants[0].ram || "";
          updatedPerformance.storage_type = newVariants[0].storage || "";
        } else {
          updatedPerformance.ram_type = inferred.ram_type || "";
          updatedPerformance.storage_type = inferred.storage_type || "";
        }

        return {
          ...prev,
          variants: newVariants,
          variant_store_prices: newPrices,
          performance: { ...(prev.performance || {}), ...updatedPerformance },
        };
      });
    }
  };

  // Delete a store price (call API if persisted)
  const handleDeleteStorePrice = async (index) => {
    const sp =
      formData.variant_store_prices && formData.variant_store_prices[index];
    if (!sp) return;
    if (!confirm("Delete this store price?")) return;

    if (sp.id) {
      try {
        const token = Cookies.get("authToken");
        const res = await fetch(
          `http://localhost:5000/api/storeprice/${sp.id}`,
          {
            method: "DELETE",
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Server responded ${res.status}`);
        }
        // remove locally
        removeArrayFieldItem("variant_store_prices", index);
      } catch (err) {
        console.error("Delete store price failed:", err);
        alert("Failed to delete store price: " + (err.message || ""));
      }
    } else {
      removeArrayFieldItem("variant_store_prices", index);
    }
  };

  // Add custom field to JSONB object
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
        [field]: {
          ...prev[field],
          [cleanFieldName]: "",
        },
      }));
    }
  };

  // Remove custom field from JSONB object
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
  };

  // Add color
  const addColor = () => {
    addArrayFieldItem("colors", {
      name: "",
      code: "#000000",
    });
  };

  // Add variant
  const addVariant = () => {
    addArrayFieldItem("variants", {
      ram: "",
      storage: "",
      base_price: "",
      custom_properties: {},
    });
  };

  // Add store price
  const addStorePrice = () => {
    // Default to first variant's real id if exists, otherwise use variant_index 0
    const firstVariant =
      formData.variants && formData.variants.length > 0
        ? formData.variants[0]
        : null;
    const defaultItem = {
      store_name: "",
      price: "",
      url: "",
      custom_properties: {},
    };
    if (
      firstVariant &&
      firstVariant.id !== undefined &&
      firstVariant.id !== null
    ) {
      defaultItem.variant_id = firstVariant.id;
    } else if (formData.variants && formData.variants.length > 0) {
      defaultItem.variant_index = 0;
    } else {
      defaultItem.variant_id = null;
    }

    addArrayFieldItem("variant_store_prices", defaultItem);
  };

  // Handle color change
  const handleColorChange = (index, key, value) => {
    handleArrayFieldChange("colors", index, key, value);
  };

  // Handle variant change
  const handleVariantChange = (index, key, value) => {
    // Update variants and try to infer performance types atomically
    setFormData((prev) => {
      const updatedVariants = prev.variants.map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      );

      const inferred = inferTypesFromVariants(updatedVariants || []);

      const updatedPerformance = { ...(prev.performance || {}) };

      if (updatedVariants.length === 1) {
        const single = updatedVariants[0] || {};
        if (single.ram && typeof single.ram === "string") {
          updatedPerformance.ram_type = single.ram.trim();
        }
        if (single.storage && typeof single.storage === "string") {
          updatedPerformance.storage_type = single.storage.trim();
        }
      } else {
        if (inferred.ram_type) updatedPerformance.ram_type = inferred.ram_type;
        if (inferred.storage_type)
          updatedPerformance.storage_type = inferred.storage_type;
      }

      return {
        ...prev,
        variants: updatedVariants,
        performance: updatedPerformance,
      };
    });
  };

  // Handle store price change
  const handleStorePriceChange = (index, key, value) => {
    // Ensure variant_id stored as number (select returns string)
    if (key === "variant_id") {
      const numeric = value === "" || value === null ? null : Number(value);
      handleArrayFieldChange("variant_store_prices", index, key, numeric);
      return;
    }

    handleArrayFieldChange("variant_store_prices", index, key, value);
  };

  // Add custom property to variant
  const addVariantCustomProperty = (index) => {
    const propertyName = prompt("Enter custom property name:");
    if (propertyName && propertyName.trim()) {
      const cleanName = propertyName.trim();
      setFormData((prev) => {
        const updatedVariants = [...prev.variants];
        updatedVariants[index] = {
          ...updatedVariants[index],
          custom_properties: {
            ...updatedVariants[index].custom_properties,
            [cleanName]: "",
          },
        };
        return { ...prev, variants: updatedVariants };
      });
    }
  };

  // Add custom property to store price
  const addStorePriceCustomProperty = (index) => {
    const propertyName = prompt("Enter custom property name:");
    if (propertyName && propertyName.trim()) {
      const cleanName = propertyName.trim();
      setFormData((prev) => {
        const updatedStorePrices = [...prev.variant_store_prices];
        updatedStorePrices[index] = {
          ...updatedStorePrices[index],
          custom_properties: {
            ...updatedStorePrices[index].custom_properties,
            [cleanName]: "",
          },
        };
        return { ...prev, variant_store_prices: updatedStorePrices };
      });
    }
  };

  // Remove custom property
  const removeCustomProperty = (field, index, propertyName) => {
    setFormData((prev) => {
      const updatedArray = [...prev[field]];
      const updatedItem = { ...updatedArray[index] };
      delete updatedItem.custom_properties[propertyName];
      updatedArray[index] = updatedItem;
      return { ...prev, [field]: updatedArray };
    });
  };

  // Get variant display name
  const getVariantDisplayName = (variantId) => {
    if (variantId === undefined || variantId === null || variantId === "")
      return "Select Variant";

    // Prefer matching by backend id first (ids may be numeric or string)
    const byId = formData.variants.find(
      (v) =>
        v.id !== undefined &&
        v.id !== null &&
        String(v.id) === String(variantId)
    );
    if (byId) {
      return `${byId.ram} ${byId.storage} - ₹${byId.base_price || "N/A"}`;
    }

    // Fallback: treat as local index
    const idx = Number(variantId);
    if (!isNaN(idx) && formData.variants[idx]) {
      const v = formData.variants[idx];
      return `${v.ram} ${v.storage} - ₹${v.base_price || "N/A"}`;
    }

    return "Select Variant";
  };

  // Image upload handler
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setUploading(true);
    try {
      const uploadedImages = [];

      const cloudName =
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "damoxc2du";
      const uploadPreset =
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "Mobile image";

      for (const file of fileList) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("upload_preset", uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: uploadData,
          }
        );

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          console.error("Cloudinary upload error", res.status, errBody);
          throw new Error(`Upload failed with status ${res.status}`);
        }

        const data = await res.json();
        if (data?.secure_url) {
          uploadedImages.push(data.secure_url);
        } else {
          console.error("Cloudinary upload failed:", data);
          throw new Error("Upload failed");
        }
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Error uploading images. Please try again.");
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
  };

  // Get default fields for each specification category (same as CreateMobile)
  const getDefaultFields = (category) => {
    const defaults = {
      build_design: {
        height: "",
        width: "",
        thickness: "",
        weight: "",
        material: "",
        body_type: "",
        frame_material: "",
        back_material: "",
        build_features: "",
        ip_rating: "",
      },
      display: {
        size: "",
        resolution: "",
        type: "",
        refresh_rate: "",
        protection: "",
        brightness: "",
        color_gamut: "",
        hdr_support: "",
        pixel_density: "",
        aspect_ratio: "",
        screen_to_body_ratio: "",
        notch_type: "",
      },
      performance: {
        processor: "",
        cpu_cores: "",
        process_node: "",
        gpu: "",
        cpu_speed: "",
        ram_type: "",
        storage_type: "",
        expandable_storage: "",
        os: "",
        os_version: "",
        ui: "",
        chipset: "",
        antutu_score: "",
        geekbench_score: "",
      },
      camera: {
        rear_camera_setup: "",
        main_camera: "",
        ultra_wide_camera: "",
        telephoto_camera: "",
        macro_camera: "",
        depth_sensor: "",
        front_camera: "",
        video_recording: "",
        camera_features: "",
        flash: "",
      },
      battery: {
        capacity: "",
        type: "",
        charging: "",
        fast_charging: "",
        wireless_charging: "",
        reverse_charging: "",
        charger_included: "",
        battery_life: "",
      },
      connectivity_network: {
        network_types: "",
        _5g_support: "",
        wifi: "",
        bluetooth: "",
        nfc: "",
        usb: "",
        gps: "",
        radio: "",
        infrared: "",
        sim_type: "",
      },
      ports: {
        usb_type: "",
        headphone_jack: "",
        charging_port: "",
        other_ports: "",
      },
      audio: {
        speakers: "",
        audio_jack: "",
        microphone: "",
        audio_features: "",
      },
      multimedia: {
        video_formats: "",
        audio_formats: "",
        fm_radio: "",
        other_features: "",
      },
    };

    return defaults[category] || {};
  };

  // Normalize string booleans
  const normalizeBooleans = (value) => {
    if (typeof value === "string") {
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    }
    if (Array.isArray(value)) return value.map((v) => normalizeBooleans(v));
    if (value && typeof value === "object") {
      const out = {};
      Object.keys(value).forEach((k) => {
        out[k] = normalizeBooleans(value[k]);
      });
      return out;
    }
    return value;
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting form with data:", formData);
    setShowSaveOverlay(true);
  };

  // Submit to server (PUT request)
  const submitToServer = async (publish) => {
    setShowSaveOverlay(false);
    setShowPublishConfirm(false);
    setIsSaving(true);

    try {
      const submitData = {
        id, // Ensure the id is sent for update
        name: formData.name || "",
        category: formData.category || "",
        brand: formData.brand || "",
        model: formData.model || "",
        rating: formData.rating ? parseFloat(formData.rating) : null,
        launch_date: formData.launch_date || null,
        images: formData.images || [],

        // Colors structure
        colors: formData.colors.map((c) => ({
          name: c.name || null,
          code: c.code || null,
        })),

        // Variants structure
        variants: formData.variants.map((v) => ({
          id: v.id !== undefined ? v.id : undefined,
          ram: v.ram || null,
          storage: v.storage || null,
          base_price:
            v.base_price !== undefined && v.base_price !== ""
              ? Number(v.base_price)
              : null,
          custom_properties: v.custom_properties || {},
        })),

        // Store prices structure - use real variant_id for existing variants or variant_index for new ones
        variant_store_prices: formData.variant_store_prices.map((sp) => {
          const item = {
            id: sp?.id !== undefined ? sp.id : undefined,
            store_name: sp.store_name || null,
            price:
              sp.price !== undefined && sp.price !== ""
                ? Number(sp.price)
                : null,
            url: sp.url || null,
            custom_properties: sp.custom_properties || {},
          };

          if (
            sp.variant_id !== undefined &&
            sp.variant_id !== null &&
            sp.variant_id !== ""
          ) {
            item.variant_id = Number(sp.variant_id);
          } else if (
            sp.variant_index !== undefined &&
            sp.variant_index !== null &&
            sp.variant_index !== ""
          ) {
            item.variant_index = Number(sp.variant_index);
          } else {
            item.variant_id = null;
          }

          return item;
        }),

        // JSONB fields
        build_design: formData.build_design,
        display: formData.display,
        performance: formData.performance,
        camera: formData.camera,
        battery: formData.battery,
        connectivity_network: formData.connectivity_network,
        sensors: formData.sensors || null,
        ports: formData.ports,
        audio: formData.audio,
        multimedia: formData.multimedia,
        published: publish,
      };

      console.log("Sending update data:", submitData);

      const token = Cookies.get("authToken");
      const res = await fetch(`http://localhost:5000/api/smartphone/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(normalizeBooleans(submitData)),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error:", errorText);
        let err = {};
        try {
          err = JSON.parse(errorText);
        } catch (e) {
          console.log("Could not parse error response");
        }
        throw new Error(err?.message || `Server responded ${res.status}`);
      }

      const responseData = await res.json();
      console.log("Update successful:", responseData);
      alert("Mobile updated successfully!");

      navigate(-1);
    } catch (error) {
      console.error("Update mobile error:", error);
      alert(`Error updating mobile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Render specification fields with grid layout (same as CreateMobile)
  const renderSpecFields = () => {
    const defaultFields = getDefaultFields(activeSpecTab);
    const currentData = formData[activeSpecTab] || {};
    const customFields = customJsonFields[activeSpecTab] || [];

    // Get tab info for styling
    const tabInfo = specTabs.find((tab) => tab.id === activeSpecTab);
    const TabIcon = tabInfo?.icon || FaCog;
    const tabLabel = tabInfo?.label || activeSpecTab.replace(/_/g, " ");

    // Color mapping for tabs
    const tabColors = {
      build_design: {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-800",
        focus: "ring-gray-500",
      },
      display: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        focus: "ring-blue-500",
      },
      performance: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
        focus: "ring-green-500",
      },
      camera: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
        focus: "ring-purple-500",
      },
      battery: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-800",
        focus: "ring-yellow-500",
      },
      connectivity_network: {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        text: "text-indigo-800",
        focus: "ring-indigo-500",
      },
      ports: {
        bg: "bg-pink-50",
        border: "border-pink-200",
        text: "text-pink-800",
        focus: "ring-pink-500",
      },
      audio: {
        bg: "bg-teal-50",
        border: "border-teal-200",
        text: "text-teal-800",
        focus: "ring-teal-500",
      },
      multimedia: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
        focus: "ring-orange-500",
      },
    };

    const colors = tabColors[activeSpecTab] || tabColors.build_design;

    return (
      <div className="space-y-6">
        {/* Default Specification Fields in Grid Layout */}
        <div
          className={`${colors.bg} p-4 md:p-6 rounded-lg border ${colors.border}`}
        >
          <h5
            className={`text-lg font-bold ${colors.text} mb-6 flex items-center`}
          >
            <TabIcon className="mr-2" />
            {tabLabel} Specifications
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Object.keys(defaultFields).map((key) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/_/g, " ")}
                </label>
                <input
                  type="text"
                  value={currentData[key] || ""}
                  onChange={(e) =>
                    handleJsonbChange(activeSpecTab, key, e.target.value)
                  }
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:${colors.focus} bg-white transition-colors`}
                  placeholder={`Enter ${key.replace(/_/g, " ")}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <h5 className="text-lg font-bold text-gray-800 mb-4">
              Custom Fields
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {customFields.map((customField) => (
                <div key={customField} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {customField.replace(/_/g, " ")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentData[customField] || ""}
                      onChange={(e) =>
                        handleJsonbChange(
                          activeSpecTab,
                          customField,
                          e.target.value
                        )
                      }
                      className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:${colors.focus} bg-white`}
                      placeholder={`Enter ${customField.replace(/_/g, " ")}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        removeCustomJsonField(activeSpecTab, customField)
                      }
                      className="px-4 py-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                      title="Remove field"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Field Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => addCustomJsonField(activeSpecTab)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200"
          >
            <FaPlus className="text-sm" />
            <span>Add Custom Field</span>
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
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
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 md:p-8 text-center">
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

  // Check if data is loaded but empty
  if (!isLoading && !formData?.name && !error) {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-6 md:p-8 text-center">
          <FaExclamationTriangle className="text-5xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Data Not Loaded Properly
          </h2>
          <p className="text-gray-600 mb-6">
            Mobile data could not be loaded or the form appears to be empty.
          </p>
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
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto" ref={formRef}>
      {/* Mobile Navigation Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex items-center justify-between w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm mobile-nav-toggle"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <FaMobile className="text-lg" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-bold text-gray-900">
                Edit Mobile - {formData?.name || "Loading..."}
              </h2>
              <p className="text-xs text-gray-600">Tap to navigate sections</p>
            </div>
          </div>
          {mobileNavOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {/* Mobile Navigation Menu */}
        {mobileNavOpen && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg mobile-nav">
            <div className="p-3 space-y-2">
              {[
                "basic",
                "images",
                "colors",
                "variants",
                "store-prices",
                "specs",
                "sensors",
              ].map((section) => (
                <button
                  key={section}
                  onClick={() => {
                    const element = document.querySelector(
                      `[data-section="${section}"]`
                    );
                    element?.scrollIntoView({ behavior: "smooth" });
                    setMobileNavOpen(false);
                    setActiveSection(section);
                  }}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    activeSection === section
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="capitalize">
                    {section.replace("-", " ")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="hidden lg:flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
            <FaMobile className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Edit Mobile - {formData?.name || "Loading..."}
            </h1>
            <p className="text-gray-600 text-base md:text-lg font-medium mt-1">
              Update smartphone details
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 md:px-8 py-4 md:py-6 border-b border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            Edit Mobile Specifications
          </h2>
          <p className="text-gray-600 font-medium text-sm md:text-base">
            Update all fields according to the database schema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 lg:p-8">
          {/* Images Upload */}
          <div className="mb-8 md:mb-12" data-section="images">
            <div className="flex items-center space-x-3 mb-4 md:mb-6">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <FaCamera className="text-lg" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">
                Images ({(formData?.images || []).length})
              </h3>
            </div>

            <div className="mb-4">
              {(formData?.images || []).length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <FaCamera className="text-4xl text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No images added</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(formData?.images || []).map((src, idx) => (
                    <div key={idx} className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
                        <img
                          src={src}
                          alt={`img-${idx}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error(`Image ${idx} failed to load:`, src);
                            e.target.src =
                              "https://via.placeholder.com/100x100?text=Image+Error";
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative inline-block w-full sm:w-auto">
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
                <button
                  type="button"
                  disabled={uploading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-bold text-sm md:text-base disabled:opacity-50"
                >
                  {uploading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCloudUploadAlt />
                  )}
                  <span>{uploading ? "Uploading..." : "Upload Images"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="mb-8 md:mb-12" data-section="basic">
            <div className="flex items-center space-x-3 mb-4 md:mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <FaMobile className="text-lg" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">
                Basic Information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mobile Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData?.name || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
                  placeholder="e.g., iPhone 15 Pro Max"
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData?.category || "Smart Phone"}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium bg-white"
                >
                  <option value="">Select Category</option>
                  <option value="Smart Phone">Smart Phone</option>
                  <option value="Feature Phone">Feature Phone</option>
                  <option value="Gaming Phone">Gaming Phone</option>
                  <option value="Budget Phone">Budget Phone</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Brand *
                </label>
                {categoriesList && categoriesList.length > 0 ? (
                  <>
                    <select
                      value={brandOther ? "__other" : formData?.brand}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__other") {
                          setBrandOther(true);
                          setFormData((prev) => ({ ...prev, brand: "" }));
                        } else {
                          setBrandOther(false);
                          setFormData((prev) => ({ ...prev, brand: val }));
                        }
                      }}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium bg-white"
                    >
                      <option value="">Select Brand</option>
                      {categoriesList.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value="__other">Other</option>
                    </select>

                    {brandOther && (
                      <input
                        type="text"
                        name="brand"
                        value={formData?.brand || ""}
                        onChange={handleChange}
                        required
                        className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
                        placeholder="Enter custom brand"
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    name="brand"
                    value={formData?.brand || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
                    placeholder="e.g., Apple"
                  />
                )}
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData?.model || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
                  placeholder="e.g., A3103"
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Rating
                </label>
                <input
                  type="number"
                  name="rating"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData?.rating || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
                  placeholder="e.g., 4.5"
                />
              </div>

              <div className="flex flex-col sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Launch Date
                </label>
                <input
                  type="date"
                  name="launch_date"
                  value={formData?.launch_date || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="mb-8 md:mb-12" data-section="colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center text-white">
                  <FaPalette className="text-lg" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">
                  Colors ({(formData?.colors || []).length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addColor}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-4 py-3 rounded-lg font-bold transition-all duration-200 text-sm md:text-base"
                >
                  <FaPlus className="text-sm" />
                  <span>Add Color</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {(formData?.colors || []).length === 0 && (
                <div className="text-center py-8 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                  <FaPalette className="text-4xl text-pink-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    No colors added yet
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Add colors for your mobile device
                  </p>
                </div>
              )}

              {(formData?.colors || []).map((color, index) => (
                <div
                  key={index}
                  className="p-4 border border-pink-200 rounded-lg bg-white"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={color.code || "#000000"}
                        onChange={(e) =>
                          handleColorChange(index, "code", e.target.value)
                        }
                        className="w-10 h-10 p-0 border-0 rounded-lg cursor-pointer shadow-sm"
                        title="Select color"
                      />
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          Color #{index + 1}
                        </div>
                        <div className="text-xs text-gray-500">ID: {index}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteColor(index)}
                      className="text-red-600 hover:text-red-700 p-2 bg-red-50 rounded-lg"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Color Name *
                      </label>
                      <input
                        type="text"
                        value={color.name || ""}
                        onChange={(e) =>
                          handleColorChange(index, "name", e.target.value)
                        }
                        placeholder="e.g., Midnight Black"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variants Section - NO COLOR FIELD */}
          <div className="mb-8 md:mb-12" data-section="variants">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white">
                  <FaBoxOpen className="text-lg" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">
                  Variants ({(formData?.variants || []).length})
                </h3>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-3 rounded-lg font-bold transition-all duration-200 text-sm md:text-base"
              >
                <FaPlus className="text-sm" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="space-y-4">
              {(formData?.variants || []).length === 0 && (
                <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <FaBoxOpen className="text-4xl text-blue-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    No variants added yet
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Click "Add Variant" to get started
                  </p>
                </div>
              )}

              {(formData?.variants || []).map((variant, index) => (
                <div
                  key={index}
                  className="p-4 border border-blue-200 rounded-lg bg-white"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center">
                        <FaBoxOpen className="text-blue-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          Variant #{index + 1}
                        </div>
                        <div className="text-xs text-gray-500">ID: {index}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => addVariantCustomProperty(index)}
                        className="text-green-600 hover:text-green-700 p-2 bg-green-50 rounded-lg"
                        title="Add custom property"
                      >
                        <FaPlus className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(index)}
                        className="text-red-600 hover:text-red-700 p-2 bg-red-50 rounded-lg"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        RAM *
                      </label>
                      <input
                        type="text"
                        value={variant.ram || ""}
                        onChange={(e) =>
                          handleVariantChange(index, "ram", e.target.value)
                        }
                        placeholder="e.g., 8GB"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Storage *
                      </label>
                      <input
                        type="text"
                        value={variant.storage || ""}
                        onChange={(e) =>
                          handleVariantChange(index, "storage", e.target.value)
                        }
                        placeholder="e.g., 128GB"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Base Price *
                      </label>
                      <input
                        type="number"
                        value={variant.base_price || ""}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "base_price",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 59999"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Color Name
                      </label>
                      <input
                        type="text"
                        value={variant.color_name || ""}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "color_name",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Midnight Black"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Color Code
                      </label>
                      <input
                        type="color"
                        value={variant.color_code || "#000000"}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "color_code",
                            e.target.value
                          )
                        }
                        className="w-16 h-10 p-0 border-0 rounded-lg cursor-pointer"
                        title="Select color"
                      />
                    </div>
                  </div>

                  {/* Variant Custom Properties */}
                  {variant.custom_properties &&
                    Object.keys(variant.custom_properties).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-100">
                        <h5 className="text-sm font-bold text-gray-700 mb-3">
                          Custom Properties
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(variant.custom_properties).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center space-x-2"
                              >
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                                    {key.replace(/_/g, " ")}
                                  </label>
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => {
                                      setFormData((prev) => {
                                        const updatedVariants = [
                                          ...prev.variants,
                                        ];
                                        updatedVariants[index] = {
                                          ...updatedVariants[index],
                                          custom_properties: {
                                            ...updatedVariants[index]
                                              .custom_properties,
                                            [key]: e.target.value,
                                          },
                                        };
                                        return {
                                          ...prev,
                                          variants: updatedVariants,
                                        };
                                      });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeCustomProperty("variants", index, key)
                                  }
                                  className="text-red-500 hover:text-red-700 mt-5"
                                  title="Remove property"
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Store Prices Section */}
          <div className="mb-8 md:mb-12" data-section="store-prices">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <FaTags className="text-lg" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">
                  Store Prices ({(formData?.variant_store_prices || []).length})
                </h3>
              </div>
              <button
                type="button"
                onClick={addStorePrice}
                disabled={formData.variants.length === 0}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-bold transition-all duration-200 w-full sm:w-auto text-sm md:text-base ${
                  formData.variants.length === 0
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                }`}
              >
                <FaPlus className="text-sm" />
                <span>Add Store Price</span>
              </button>
            </div>

            {formData.variants.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-sm">
                  <span className="font-bold">Note:</span> You need to add at
                  least one variant in the Variants section before creating
                  store prices.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {(formData?.variant_store_prices || []).length === 0 && (
                <div className="text-center py-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <FaTags className="text-4xl text-purple-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    No store prices added yet
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Click "Add Store Price" to get started
                  </p>
                </div>
              )}

              {(formData?.variant_store_prices || []).map((store, index) => (
                <div
                  key={index}
                  className="p-4 border border-purple-200 rounded-lg bg-white"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900">
                      Store Price #{index + 1}
                    </h4>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => addStorePriceCustomProperty(index)}
                        className="text-green-600 hover:text-green-700 p-2 bg-green-50 rounded-lg"
                        title="Add custom property"
                      >
                        <FaPlus className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStorePrice(index)}
                        className="text-red-600 hover:text-red-700 p-2 bg-red-50 rounded-lg"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Variant *
                      </label>
                      <select
                        value={
                          store.variant_id !== undefined &&
                          store.variant_id !== null
                            ? String(store.variant_id)
                            : store.variant_index !== undefined &&
                              store.variant_index !== null
                            ? String(store.variant_index)
                            : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => {
                            const updatedStorePrices = [
                              ...prev.variant_store_prices,
                            ];
                            const updated = {
                              ...(updatedStorePrices[index] || {}),
                            };

                            if (val === "") {
                              updated.variant_id = null;
                              updated.variant_index = null;
                            } else {
                              // If selected value matches a real variant id, use variant_id
                              const matchedById = prev.variants.find(
                                (v) =>
                                  v.id !== undefined &&
                                  v.id !== null &&
                                  String(v.id) === val
                              );
                              if (matchedById) {
                                updated.variant_id = Number(val);
                                delete updated.variant_index;
                              } else {
                                // otherwise treat as local variant index
                                updated.variant_index = Number(val);
                                delete updated.variant_id;
                              }
                            }

                            updatedStorePrices[index] = updated;
                            return {
                              ...prev,
                              variant_store_prices: updatedStorePrices,
                            };
                          });
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        required
                      >
                        <option value="">Select Variant</option>
                        {formData.variants.map((variant, vIndex) => (
                          <option
                            key={vIndex}
                            value={
                              variant.id !== undefined && variant.id !== null
                                ? String(variant.id)
                                : String(vIndex)
                            }
                          >
                            {getVariantDisplayName(
                              variant.id !== undefined && variant.id !== null
                                ? variant.id
                                : vIndex
                            )}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Store Name *
                      </label>
                      <input
                        type="text"
                        value={store.store_name || ""}
                        onChange={(e) =>
                          handleStorePriceChange(
                            index,
                            "store_name",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Amazon, Flipkart, Official Store"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Price *
                      </label>
                      <input
                        type="number"
                        value={store.price || ""}
                        onChange={(e) =>
                          handleStorePriceChange(index, "price", e.target.value)
                        }
                        placeholder="e.g., 59999"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Store URL
                      </label>
                      <input
                        type="url"
                        value={store.url || ""}
                        onChange={(e) =>
                          handleStorePriceChange(index, "url", e.target.value)
                        }
                        placeholder="https://example.com/product"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Offer Text
                      </label>
                      <input
                        type="text"
                        value={store.offer_text || ""}
                        onChange={(e) =>
                          handleStorePriceChange(
                            index,
                            "offer_text",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 10% off, Free shipping"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Shipping Info
                      </label>
                      <input
                        type="text"
                        value={store.shipping_info || ""}
                        onChange={(e) =>
                          handleStorePriceChange(
                            index,
                            "shipping_info",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Free delivery, 2-3 days"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex flex-col sm:col-span-2 lg:col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Warranty
                      </label>
                      <input
                        type="text"
                        value={store.warranty || ""}
                        onChange={(e) =>
                          handleStorePriceChange(
                            index,
                            "warranty",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 1 year manufacturer warranty"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Store Price Custom Properties */}
                  {store.custom_properties &&
                    Object.keys(store.custom_properties).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-purple-100">
                        <h5 className="text-sm font-bold text-gray-700 mb-3">
                          Custom Properties
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(store.custom_properties).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center space-x-2"
                              >
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                                    {key.replace(/_/g, " ")}
                                  </label>
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => {
                                      setFormData((prev) => {
                                        const updatedStorePrices = [
                                          ...prev.variant_store_prices,
                                        ];
                                        updatedStorePrices[index] = {
                                          ...updatedStorePrices[index],
                                          custom_properties: {
                                            ...updatedStorePrices[index]
                                              .custom_properties,
                                            [key]: e.target.value,
                                          },
                                        };
                                        return {
                                          ...prev,
                                          variant_store_prices:
                                            updatedStorePrices,
                                        };
                                      });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeCustomProperty(
                                      "variant_store_prices",
                                      index,
                                      key
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700 mt-5"
                                  title="Remove property"
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specifications with Tabs */}
          <div className="mb-8 md:mb-12" data-section="specs">
            <div className="flex items-center space-x-3 mb-4 md:mb-6">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                <FaMicrochip className="text-lg" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">
                Technical Specifications
              </h3>
            </div>

            {/* Specification Tabs */}
            <div className="mb-6">
              <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                {specTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSpecTab(tab.id)}
                      className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 mx-1 ${
                        activeSpecTab === tab.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <IconComponent className="text-sm" />
                      <span className="text-sm whitespace-nowrap">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specification Fields with Grid Layout */}
            <div className="p-4 md:p-6 border border-gray-200 rounded-lg bg-white">
              <div className="space-y-4 md:space-y-6">{renderSpecFields()}</div>
            </div>
          </div>

          {/* Sensors */}
          <div className="mb-8 md:mb-12" data-section="sensors">
            <div className="flex items-center space-x-3 mb-4 md:mb-6">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                <FaMicrochip className="text-lg" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">
                Sensors
              </h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Sensors (comma-separated or JSON array)
                </label>
                <textarea
                  name="sensors"
                  value={formData?.sensors || ""}
                  onChange={handleChange}
                  placeholder='e.g., ["Fingerprint (under display)", "Accelerometer", "Gyro", "Compass", "Barometer"]'
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter sensors as a comma-separated list or JSON array.
                </p>
              </div>
            </div>
          </div>

          {/* Publish Toggle */}
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                <FaUpload className="text-lg" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800">Publish</div>
                <div className="text-sm text-gray-600">
                  {publishEnabled
                    ? "Mobile will be published immediately"
                    : "Save as draft (not visible to users)"}
                </div>
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setPublishEnabled((p) => !p)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 w-full sm:w-auto ${
                  publishEnabled
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                }`}
              >
                {publishEnabled ? "Publish Now" : "Save as Draft"}
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin text-lg" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <FaSave className="text-lg" />
                  <span>Update Mobile</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to cancel? All unsaved changes will be lost."
                  )
                ) {
                  navigate(-1);
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-gray-500 hover:bg-gray-600 text-white px-6 py-4 rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FaTimes className="text-lg" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>

      {/* Save Overlay */}
      {showSaveOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">Save Changes</h3>
            <p className="text-sm text-gray-600 mb-4">
              Do you want to save the changes to this mobile?
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="button"
                onClick={() => setShowSaveOverlay(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (publishEnabled) {
                    setShowSaveOverlay(false);
                    setShowPublishConfirm(true);
                  } else {
                    submitToServer(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">Update Publish Status</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to{" "}
              {publishEnabled ? "publish" : "unpublish"} this mobile?
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submitToServer(publishEnabled)}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                {publishEnabled ? "Publish" : "Unpublish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-10">
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          disabled={isSaving}
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95"
          aria-label="Save mobile"
        >
          {isSaving ? (
            <FaSpinner className="animate-spin text-xl" />
          ) : (
            <FaSave className="text-xl" />
          )}
        </button>
      </div>
    </div>
  );
};

export default EditMobile;
