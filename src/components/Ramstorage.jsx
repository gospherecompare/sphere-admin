import React, { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaExclamationCircle,
  FaFilter,
  FaHdd,
  FaMemory,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { requestDeleteApproval } from "../utils/deleteApproval";
import {
  EditorStatusChip,
  editorFieldClassName,
  editorGhostButtonClassName,
  editorPrimaryButtonClassName,
} from "./MobileEditorUi";

const PRODUCT_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "smartphone", label: "Smartphone" },
  { value: "tablet", label: "Tablet" },
  { value: "desktop/laptop", label: "Desktop / Laptop" },
];

const UNIT_OPTIONS = ["GB", "TB"];

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
const editorFieldClassNameLocal = `${editorFieldClassName} rounded-md border-slate-200 bg-white shadow-none`;

const STAT_ICON_CLASSES = {
  violet: "border-violet-200 bg-transparent text-violet-600",
  emerald: "border-emerald-200 bg-transparent text-emerald-600",
  blue: "border-blue-200 bg-transparent text-blue-600",
  rose: "border-rose-200 bg-transparent text-rose-600",
};

const createEditorState = (optionType = "ram", overrides = {}) => ({
  optionType,
  capacity: "",
  unit: "GB",
  slug: "",
  displayName: "",
  status: "active",
  sortOrder: "0",
  assignMode: "all",
  metaTitle: "",
  metaDescription: "",
  ...overrides,
});

const slugifyValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildOptionValue = (capacity, unit) => {
  const normalizedCapacity = String(capacity || "").trim();
  if (!normalizedCapacity) return "";
  return `${normalizedCapacity} ${String(unit || "").trim().toUpperCase()}`.trim();
};

const parseOptionValue = (value) => {
  const text = String(value || "").trim();
  const match = text.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);
  if (!match) {
    return {
      capacity: text.replace(/[a-zA-Z]+$/g, "").trim(),
      unit: text.toLowerCase().includes("tb") ? "TB" : "GB",
    };
  }

  return {
    capacity: match[1] || "",
    unit: (match[2] || "GB").toUpperCase(),
  };
};

const parseMemoryRank = (value) => {
  const text = String(value || "").trim().toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return Number.MAX_SAFE_INTEGER;

  if (text.includes("tb")) return amount * 1024;
  if (text.includes("gb")) return amount;
  if (text.includes("mb")) return amount / 1024;
  if (text.includes("kb")) return amount / 1048576;
  return amount;
};

const formatProductTypeLabel = (value) => {
  if (!value) return "All Products";
  if (value === "desktop/laptop") return "Desktop / Laptop";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatDateTime = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const buildOptionSummary = (rows, key) => {
  const otherKey = key === "ram" ? "storage" : "ram";
  const map = new Map();

  rows.forEach((row) => {
    const value = String(row[key] || "").trim();
    if (!value) return;

    const existing = map.get(value) || {
      key: value,
      label: value,
      slug: row.slug || slugifyValue(value),
      type: key === "ram" ? "RAM" : "Storage",
      products: 0,
      productTypes: new Set(),
      pairings: new Set(),
      statuses: new Set(),
      sortOrders: [],
      items: [],
    };

    existing.products += 1;
    existing.items.push(row);
    if (row.product_type) {
      existing.productTypes.add(formatProductTypeLabel(row.product_type));
    }

    const pairingValue = String(row[otherKey] || "").trim();
    if (pairingValue) {
      existing.pairings.add(pairingValue);
    }

    existing.statuses.add(
      String(row.status || "active").toLowerCase() === "inactive"
        ? "inactive"
        : "active",
    );

    const numericSort =
      Number(row.sort_order ?? row.sortOrder ?? row.order ?? row.sequence) || 0;
    if (numericSort > 0) {
      existing.sortOrders.push(numericSort);
    }

    map.set(value, existing);
  });

  return Array.from(map.values())
    .sort(
      (a, b) =>
        parseMemoryRank(a.label) - parseMemoryRank(b.label) ||
        a.label.localeCompare(b.label),
    )
    .map((item, index) => ({
      ...item,
      status: item.statuses.has("active") ? "Active" : "Inactive",
      sortOrder:
        item.sortOrders.length > 0
          ? Math.min(...item.sortOrders)
          : index + 1,
      productTypes: Array.from(item.productTypes),
      pairings: Array.from(item.pairings),
    }));
};

function OverviewRing({ ramCount, storageCount, total }) {
  const ramPercent = total ? (ramCount / total) * 100 : 0;
  const ramDegrees = (ramPercent / 100) * 360;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-28 w-28 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#5B3DF5 0deg ${ramDegrees}deg, #7CB3FF ${ramDegrees}deg 360deg)`,
        }}
      >
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-3xl font-semibold text-slate-950">{total}</span>
          <span className="text-xs font-medium text-slate-500">Total</span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#5B3DF5]" />
            <span className="text-slate-600">RAM</span>
          </div>
          <span className="font-semibold text-slate-900">
            {ramCount} ({total ? ((ramCount / total) * 100).toFixed(1) : "0.0"}%)
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#7CB3FF]" />
            <span className="text-slate-600">Storage</span>
          </div>
          <span className="font-semibold text-slate-900">
            {storageCount} ({total ? ((storageCount / total) * 100).toFixed(1) : "0.0"}%)
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper, icon: Icon, tone = "violet" }) {
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
          className={`flex h-12 w-12 items-center justify-center rounded-md border ${STAT_ICON_CLASSES[tone]}`}
        >
          <Icon className="text-lg" />
        </div>
      </div>
    </div>
  );
}

const RamStorageConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [activeTab, setActiveTab] = useState("ram");
  const [searchTerm, setSearchTerm] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOptionKeys, setSelectedOptionKeys] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [editorState, setEditorState] = useState(createEditorState("ram"));

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

  const fetchConfigs = async (silent = false) => {
    setLoading(true);
    setError("");

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(buildUrl("/api/ram-storage-config"), {
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
      else if (data && Array.isArray(data.configs)) rows = data.configs;
      else if (data && Array.isArray(data.data)) rows = data.data;
      else if (data && Array.isArray(data.rows)) rows = data.rows;
      else rows = data?.ram_storage_long || [];

      setConfigs(rows);
      if (!rows.length) setShowForm(true);
      if (!silent) {
        showToast("Refreshed", "RAM / Storage options updated.", "success");
      }
    } catch (err) {
      console.error("Failed to fetch configurations:", err);
      setError(err.message || "Failed to load configurations");
      showToast("Error", "Failed to load RAM / Storage options.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, productTypeFilter]);

  const normalizedConfigs = useMemo(
    () =>
      configs.map((config) => ({
        ...config,
        ram: String(config.ram || "").trim(),
        storage: String(config.storage || "").trim(),
        product_type: config.product_type || config.long || "",
      })),
    [configs],
  );

  const ramOptions = useMemo(
    () => buildOptionSummary(normalizedConfigs, "ram"),
    [normalizedConfigs],
  );
  const storageOptions = useMemo(
    () => buildOptionSummary(normalizedConfigs, "storage"),
    [normalizedConfigs],
  );

  const totalOptions = ramOptions.length + storageOptions.length;
  const inactiveOptions =
    ramOptions.filter((option) => option.status === "Inactive").length +
    storageOptions.filter((option) => option.status === "Inactive").length;
  const activeOptionsCount = totalOptions - inactiveOptions;
  const activeTabLabel = activeTab === "ram" ? "RAM" : "Storage";
  const optionRows = activeTab === "ram" ? ramOptions : storageOptions;
  const getOptionSelectionKey = (option) => `${activeTab}:${option.label}`;
  const creationTargets = useMemo(() => {
    const counterpartKey = editorState.optionType === "ram" ? "storage" : "ram";
    const targets = new Map();

    normalizedConfigs.forEach((item) => {
      const counterpartValue = String(item[counterpartKey] || "").trim();
      if (!counterpartValue) return;

      const productType = String(item.product_type || "").trim();
      const targetKey = `${counterpartValue}::${productType || "all"}`;
      if (!targets.has(targetKey)) {
        targets.set(targetKey, { counterpartValue, productType });
      }
    });

    return Array.from(targets.values()).sort((a, b) => {
      const rankDifference =
        parseMemoryRank(a.counterpartValue) - parseMemoryRank(b.counterpartValue);
      if (rankDifference !== 0) return rankDifference;
      return a.counterpartValue.localeCompare(b.counterpartValue);
    });
  }, [editorState.optionType, normalizedConfigs]);

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return optionRows.filter((option) => {
      const queryMatch =
        !query ||
        option.label.toLowerCase().includes(query) ||
        option.slug.toLowerCase().includes(query) ||
        option.pairings.some((item) => item.toLowerCase().includes(query)) ||
        option.productTypes.some((item) => item.toLowerCase().includes(query));

      const typeMatch =
        productTypeFilter === "all" ||
        option.items.some((item) => item.product_type === productTypeFilter);

      return queryMatch && typeMatch;
    });
  }, [optionRows, productTypeFilter, searchTerm]);

  const topOptions = useMemo(
    () =>
      [...optionRows]
        .sort(
          (a, b) =>
            b.products - a.products ||
            parseMemoryRank(a.label) - parseMemoryRank(b.label),
        )
        .slice(0, 5),
    [optionRows],
  );

  const itemsPerPage = 8;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOptions.length / itemsPerPage),
  );
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * itemsPerPage;
  const paginatedOptions = filteredOptions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const paginatedOptionKeys = paginatedOptions.map((option) =>
    getOptionSelectionKey(option),
  );
  const selectedOnPageCount = paginatedOptionKeys.filter((key) =>
    selectedOptionKeys.includes(key),
  ).length;
  const allPageItemsSelected =
    paginatedOptionKeys.length > 0 &&
    paginatedOptionKeys.every((key) => selectedOptionKeys.includes(key));

  const toggleOptionSelection = (option) => {
    const key = getOptionSelectionKey(option);
    setSelectedOptionKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const toggleSelectAllOnPage = () => {
    setSelectedOptionKeys((prev) => {
      if (allPageItemsSelected) {
        return prev.filter((key) => !paginatedOptionKeys.includes(key));
      }

      const next = new Set(prev);
      paginatedOptionKeys.forEach((key) => next.add(key));
      return Array.from(next);
    });
  };

  const previewValue =
    editorState.displayName.trim() ||
    buildOptionValue(editorState.capacity, editorState.unit) ||
    `${editorState.optionType === "ram" ? "RAM" : "Storage"} Option`;
  const previewSuggestedSlug = slugifyValue(previewValue);
  const previewSlug = editorState.slug.trim() || previewSuggestedSlug;
  const previewStatusTone =
    editorState.status === "inactive" ? "danger" : "success";
  const previewTypeLabel = editorState.optionType === "ram" ? "RAM" : "Storage";
  const editorHeading = editingOption
    ? "Edit RAM / Storage Option"
    : "Add RAM / Storage Option";
  const editorDescription = editingOption
    ? "Update the selected RAM or Storage option."
    : "Create a new RAM or Storage option.";

  const resetForm = (optionType = activeTab) => {
    setEditingOption(null);
    setEditorState(
      createEditorState(optionType, {
        sortOrder: String(
          (optionType === "ram" ? ramOptions.length : storageOptions.length) + 1,
        ),
      }),
    );
  };

  const closeForm = () => {
    resetForm(activeTab);
    setShowForm(false);
  };

  const handleEditorChange = (field, value) => {
    setEditorState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddNew = (tab = activeTab) => {
    setActiveTab(tab);
    resetForm(tab);
    setShowForm(true);
  };

  const handleEditOption = (option) => {
    const optionType = option.type === "RAM" ? "ram" : "storage";
    const parsed = parseOptionValue(option.label);
    const sourceItem =
      option.items.find(
        (item) =>
          String(item.status || "active").toLowerCase() ===
          (option.status === "Inactive" ? "inactive" : "active"),
      ) || option.items[0] || {};

    setActiveTab(optionType);
    setEditingOption(option);
    setEditorState(
      createEditorState(optionType, {
        capacity: parsed.capacity,
        unit: parsed.unit || "GB",
        slug: sourceItem.slug || option.slug || slugifyValue(option.label),
        displayName: option.label,
        status: option.status === "Inactive" ? "inactive" : "active",
        sortOrder: String(
          sourceItem.sort_order ??
            sourceItem.sortOrder ??
            sourceItem.order ??
            option.sortOrder ??
            0,
        ),
        assignMode:
          sourceItem.assign_mode === "specific" ? "specific" : "all",
        metaTitle: String(
          sourceItem.meta_title || sourceItem.metaTitle || "",
        ),
        metaDescription: String(
          sourceItem.meta_description || sourceItem.metaDescription || "",
        ),
      }),
    );
    setShowForm(true);
  };

  const updateOptionRequest = async (item, token) => {
    const payload = {
      ram:
        editorState.optionType === "ram"
          ? previewValue
          : String(item.ram || "").trim(),
      storage:
        editorState.optionType === "storage"
          ? previewValue
          : String(item.storage || "").trim(),
      product_type: item.product_type || "",
      long: item.product_type || "",
      status: editorState.status,
      slug: previewSlug,
      display_name: previewValue,
      sort_order: Number(editorState.sortOrder) || 0,
      assign_mode: editorState.assignMode,
      meta_title: editorState.metaTitle.trim(),
      meta_description: editorState.metaDescription.trim(),
    };

    const response = await fetch(buildUrl(`/api/ram-storage-config/${item.id}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Save failed");
    }
  };

  const createOptionRequest = async (target, token) => {
    const payload = {
      ram:
        editorState.optionType === "ram"
          ? previewValue
          : target.counterpartValue,
      storage:
        editorState.optionType === "storage"
          ? previewValue
          : target.counterpartValue,
      product_type: target.productType || "",
      long: target.productType || "",
      status: editorState.status,
      slug: previewSlug,
      display_name: previewValue,
      sort_order: Number(editorState.sortOrder) || 0,
      assign_mode: editorState.assignMode,
      meta_title: editorState.metaTitle.trim(),
      meta_description: editorState.metaDescription.trim(),
    };

    const response = await fetch(buildUrl("/api/ram-storage-config"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Save failed");
    }
  };

  const handleSave = async () => {
    const normalizedValue = buildOptionValue(
      editorState.capacity,
      editorState.unit,
    );
    const finalLabel = editorState.displayName.trim() || normalizedValue;

    if (!editorState.capacity.trim()) {
      showToast("Validation", "Capacity is required.", "error");
      return;
    }

    if (!editorState.unit.trim()) {
      showToast("Validation", "Unit is required.", "error");
      return;
    }

    if (!finalLabel.trim()) {
      showToast("Validation", "Display name is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const token = Cookies.get("authToken");

      if (editingOption) {
        for (const item of editingOption.items) {
          await updateOptionRequest(item, token);
        }
      } else {
        if (!creationTargets.length) {
          showToast(
            "Validation",
            editorState.optionType === "ram"
              ? "Add at least one storage option before creating a RAM option."
              : "Add at least one RAM option before creating a storage option.",
            "error",
          );
          return;
        }

        for (const target of creationTargets) {
          await createOptionRequest(target, token);
        }
      }

      await fetchConfigs(true);
      showToast(
        "Saved",
        editingOption
          ? "Option updated successfully."
          : "Option created successfully.",
        "success",
      );
      closeForm();
    } catch (err) {
      console.error("Save error:", err);
      showToast("Error", "Failed to save option.", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteConfigRequest = async (id, token, deleteApproval) => {
    const response = await fetch(buildUrl(`/api/ram-storage-config/${id}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(deleteApproval),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || errorBody.error || "Delete failed");
    }
  };

  const handleDeleteOption = async (option) => {
    const ids = option.items
      .map((item) => item.id)
      .filter((id) => id !== undefined && id !== null);

    if (!ids.length) {
      showToast("Error", "No linked configurations were found.", "error");
      return;
    }

    const deleteApproval = requestDeleteApproval({
      itemName:
        ids.length > 1
          ? `${option.label} (${ids.length} configurations)`
          : option.label,
      itemLabel: "RAM/storage configuration",
    });
    if (!deleteApproval) return;
    if (deleteApproval.error) {
      showToast("Delete Blocked", deleteApproval.error, "error");
      return;
    }

    setSaving(true);
    try {
      const token = Cookies.get("authToken");
      for (const id of ids) {
        await deleteConfigRequest(id, token, deleteApproval);
      }

      await fetchConfigs(true);
      showToast(
        "Deleted",
        ids.length > 1
          ? `${option.label} and its linked configurations were removed.`
          : "Configuration deleted successfully.",
        "success",
      );
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error", "Failed to delete configuration.", "error");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setProductTypeFilter("all");
  };

  const statCards = [
    {
      label: "Total Options",
      value: totalOptions.toLocaleString(),
      helper: "Unique RAM + Storage values in current data.",
      icon: FaMemory,
      tone: "violet",
    },
    {
      label: "RAM Options",
      value: ramOptions.length.toLocaleString(),
      helper: "Unique RAM values available for editors.",
      icon: FaMemory,
      tone: "emerald",
    },
    {
      label: "Storage Options",
      value: storageOptions.length.toLocaleString(),
      helper: "Unique storage values available for editors.",
      icon: FaHdd,
      tone: "blue",
    },
    {
      label: "Active",
      value: activeOptionsCount.toLocaleString(),
      helper: "Options currently available in the dataset.",
      icon: FaCheckCircle,
      tone: "emerald",
    },
    {
      label: "Inactive",
      value: inactiveOptions.toLocaleString(),
      helper: "Hidden or inactive options detected in the data.",
      icon: FaExclamationCircle,
      tone: "rose",
    },
  ];

  const maxTopCount = Math.max(...topOptions.map((item) => item.products), 1);

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

        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="hidden flex-wrap items-center gap-2 text-sm text-slate-500 sm:flex">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>Master Data</span>
                <span>&gt;</span>
                <span>RAM / Storage</span>
                <span>&gt;</span>
                <span className="font-medium text-slate-700">
                  {editingOption ? "Edit Option" : "Add New Option"}
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:mt-4">
                {editorHeading}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{editorDescription}</p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className={`${pageGhostButtonClassName} w-full justify-center sm:w-auto`}
            >
              <FaChevronLeft className="text-sm" />
              <span>Back to RAM / Storage</span>
            </button>
          </div>
        </div>

        <section className={`xl:hidden ${editorCardClassName}`}>
          <div className={editorHeaderClassName}>
            <h2 className="text-lg font-semibold text-slate-950">
              Option Preview
            </h2>
          </div>
          <div className="space-y-3 px-3 py-4 sm:px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
                {editorState.optionType === "ram" ? (
                  <FaMemory className="text-2xl" />
                ) : (
                  <FaHdd className="text-2xl" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold text-slate-950">
                  {previewValue}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-md border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    {previewTypeLabel}
                  </span>
                  <EditorStatusChip
                    label={
                      editorState.status === "inactive" ? "Inactive" : "Active"
                    }
                    tone={previewStatusTone}
                    className="rounded-md"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2 rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Slug</span>
                <span className="truncate font-medium text-slate-900">
                  {previewSlug || "Will be generated"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Sort Order</span>
                <span className="font-medium text-slate-900">
                  {editorState.sortOrder || "0"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0 space-y-4">
            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Option Information
                </h2>
              </div>
              <div className="space-y-5 px-2 py-3 sm:px-4 sm:py-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_220px]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Option Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "ram", label: "RAM", icon: FaMemory },
                        { id: "storage", label: "Storage", icon: FaHdd },
                      ].map((option) => {
                        const active = editorState.optionType === option.id;
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={Boolean(editingOption)}
                            onClick={() => {
                              handleEditorChange("optionType", option.id);
                              setActiveTab(option.id);
                            }}
                            className={`flex h-12 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                              active
                                ? "border-[#4C35F2] bg-[#F6F3FF] text-[#4C35F2]"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <Icon className="text-sm" />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {editingOption ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Option type stays fixed while editing an existing value.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Capacity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editorState.capacity}
                      onChange={(event) =>
                        handleEditorChange("capacity", event.target.value)
                      }
                      placeholder="Enter capacity value"
                      className={editorFieldClassNameLocal}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Enter numeric value only. Example: 8
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Unit <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editorState.unit}
                      onChange={(event) =>
                        handleEditorChange("unit", event.target.value)
                      }
                      className={editorFieldClassNameLocal}
                    >
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-500">
                      Select GB or TB unit.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Slug <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editorState.slug}
                      onChange={(event) =>
                        handleEditorChange("slug", event.target.value)
                      }
                      placeholder="Enter slug"
                      className={editorFieldClassNameLocal}
                    />
                    <div className="mt-2 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>URL-friendly unique identifier. Example: 8gb</span>
                      {previewSuggestedSlug ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleEditorChange("slug", previewSuggestedSlug)
                          }
                          className="text-left font-semibold text-[#4C35F2] transition hover:text-[#3d2bd0] sm:text-right"
                        >
                          Use suggested: {previewSuggestedSlug}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Display Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editorState.displayName}
                      onChange={(event) =>
                        handleEditorChange("displayName", event.target.value)
                      }
                      placeholder="Enter display name"
                      className={editorFieldClassNameLocal}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      This name will be shown on the website. Example: 8 GB
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      {
                        id: "active",
                        title: "Active",
                        description: "Option will be visible and available.",
                      },
                      {
                        id: "inactive",
                        title: "Inactive",
                        description: "Option will be hidden and unavailable.",
                      },
                    ].map((status) => {
                      const active = editorState.status === status.id;
                      return (
                        <button
                          key={status.id}
                          type="button"
                          onClick={() =>
                            handleEditorChange("status", status.id)
                          }
                          className={`flex items-start gap-3 rounded-md border px-4 py-4 text-left transition ${
                            active
                              ? "border-[#4C35F2] bg-[#F6F3FF]"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                              active
                                ? "border-[#4C35F2] text-transparent"
                                : "border-slate-300 text-transparent"
                            }`}
                          >
                            •
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-900">
                              {status.title}
                            </span>
                            <span className="mt-1 block text-sm text-slate-500">
                              {status.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Option Settings
                </h2>
              </div>
              <div className="grid gap-5 px-2 py-3 sm:px-4 sm:py-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editorState.sortOrder}
                    onChange={(event) =>
                      handleEditorChange("sortOrder", event.target.value)
                    }
                    className={editorFieldClassNameLocal}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Lower numbers appear first in listings.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Assign to Products
                  </label>
                  <div className="space-y-3">
                    {[
                      {
                        id: "all",
                        title: "All Existing & Future Products",
                        description:
                          "This option will be available for all products.",
                      },
                      {
                        id: "specific",
                        title: "Select Specific Products",
                        description:
                          "You can select products after saving this option.",
                      },
                    ].map((assignment) => {
                      const active = editorState.assignMode === assignment.id;
                      return (
                        <button
                          key={assignment.id}
                          type="button"
                          onClick={() =>
                            handleEditorChange("assignMode", assignment.id)
                          }
                          className={`flex w-full items-start gap-3 rounded-md border px-4 py-4 text-left transition ${
                            active
                              ? "border-[#4C35F2] bg-[#F6F3FF]"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                              active
                                ? "border-[#4C35F2] text-transparent"
                                : "border-slate-300 text-transparent"
                            }`}
                          >
                            •
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-900">
                              {assignment.title}
                            </span>
                            <span className="mt-1 block text-sm text-slate-500">
                              {assignment.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  SEO Information{" "}
                  <span className="font-normal text-slate-400">(Optional)</span>
                </h2>
              </div>
              <div className="space-y-5 px-2 py-3 sm:px-4 sm:py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Meta Title
                      </label>
                      <span className="text-xs text-slate-400">
                        {editorState.metaTitle.length} / 60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editorState.metaTitle}
                      onChange={(event) =>
                        handleEditorChange(
                          "metaTitle",
                          event.target.value.slice(0, 60),
                        )
                      }
                      placeholder="Enter meta title"
                      className={editorFieldClassNameLocal}
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Meta Description
                      </label>
                      <span className="text-xs text-slate-400">
                        {editorState.metaDescription.length} / 160
                      </span>
                    </div>
                    <textarea
                      value={editorState.metaDescription}
                      onChange={(event) =>
                        handleEditorChange(
                          "metaDescription",
                          event.target.value.slice(0, 160),
                        )
                      }
                      placeholder="Enter meta description"
                      className={`${editorFieldClassNameLocal} min-h-[110px] resize-none py-3`}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={editorCardClassName}>
              <div className="flex flex-col gap-3 px-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
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
                  disabled={saving}
                  className={`${pagePrimaryButtonClassName} w-full justify-center sm:w-auto`}
                >
                  {saving ? (
                    <FaSpinner className="animate-spin text-sm" />
                  ) : editingOption ? (
                    <FaEdit className="text-sm" />
                  ) : (
                    <FaPlus className="text-sm" />
                  )}
                  <span>{editingOption ? "Save Changes" : "Create Option"}</span>
                </button>
              </div>
            </section>
          </div>

          <aside className="hidden space-y-4 xl:sticky xl:top-4 xl:block xl:self-start">
            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Option Preview
                </h2>
              </div>
              <div className="space-y-4 px-4 py-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                  {editorState.optionType === "ram" ? (
                    <FaMemory className="text-3xl" />
                  ) : (
                    <FaHdd className="text-3xl" />
                  )}
                </div>
                <div>
                  <h3 className="text-4xl font-semibold tracking-tight text-slate-950">
                    {previewValue}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex rounded-md border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {previewTypeLabel}
                    </span>
                    <EditorStatusChip
                      label={
                        editorState.status === "inactive" ? "Inactive" : "Active"
                      }
                      tone={previewStatusTone}
                      className="rounded-md"
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  This is how the option will appear.
                </p>
                <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-3 text-left text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Slug</span>
                    <span className="truncate font-medium text-slate-900">
                      {previewSlug || "Will be generated"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Sort Order</span>
                    <span className="font-medium text-slate-900">
                      {editorState.sortOrder || "0"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-slate-500">Assignment</span>
                    <span className="font-medium text-slate-900">
                      {editorState.assignMode === "specific"
                        ? "Specific Products"
                        : "All Products"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Guidelines
                </h2>
              </div>
              <div className="divide-y divide-slate-200 px-4 py-2 text-sm text-slate-600">
                {[
                  "Use standard capacity values.",
                  "For RAM: 2 GB, 4 GB, 8 GB, 16 GB, etc.",
                  "For Storage: 64 GB, 128 GB, 256 GB, etc.",
                  "Capacity must be a number.",
                  "Each option should have a unique slug.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 py-3">
                    <FaCheckCircle className="mt-0.5 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={editorCardClassName}>
              <div className={editorHeaderClassName}>
                <h2 className="text-lg font-semibold text-slate-950">
                  Need Help?
                </h2>
              </div>
              <div className="space-y-3 px-4 py-4 text-sm text-slate-500">
                <p>Learn how to manage RAM and storage options.</p>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 font-semibold text-[#4C35F2] transition hover:border-[#4C35F2]"
                >
                  View Documentation
                </button>
              </div>
            </section>
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
              RAM / Storage
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage RAM and storage options for product editors, listings, and
              inventory flows.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => fetchConfigs(false)}
              disabled={loading || saving}
              className={pageGhostButtonClassName}
            >
              {loading ? (
                <FaSpinner className="animate-spin text-sm" />
              ) : (
                <FaUpload className="text-sm" />
              )}
              <span>Import (RAM / Storage)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddNew(activeTab)}
              className={pagePrimaryButtonClassName}
            >
              <FaPlus className="text-sm" />
              <span>Add New Option</span>
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
          <section className={CARD_CLASS}>
            <div className="border-b border-slate-200">
              <div className="flex items-center gap-1 overflow-x-auto px-2 pt-2 sm:px-3">
                {[
                  { id: "ram", label: "RAM Options" },
                  { id: "storage", label: "Storage Options" },
                ].map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "text-[#4C35F2]"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab.label}
                      {active ? (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#4C35F2]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-slate-200 px-2 py-3 sm:px-3 lg:px-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={`Search ${activeTabLabel.toLowerCase()} options...`}
                    className={`${pageFieldClassName} pl-10`}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto_auto]">
                  <select
                    value={productTypeFilter}
                    onChange={(event) => setProductTypeFilter(event.target.value)}
                    className={pageFieldClassName}
                  >
                    {PRODUCT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button type="button" className={pageGhostButtonClassName}>
                    <FaFilter className="text-sm" />
                    <span>Filters</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className={pageGhostButtonClassName}
                  >
                    Clear
                  </button>
                </div>
              </div>
              {selectedOptionKeys.length ? (
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {selectedOnPageCount} selected on this page, {selectedOptionKeys.length} selected in the current view.
                </p>
              ) : null}
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
                        aria-label={`Select all ${activeTabLabel.toLowerCase()} options on this page`}
                        className="h-4 w-4 rounded-[3px] border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {activeTab === "ram" ? "RAM Capacity" : "Storage Capacity"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Slug</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Products
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Sort Order
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center">
                        <FaSpinner className="mx-auto animate-spin text-2xl text-[#4C35F2]" />
                      </td>
                    </tr>
                  ) : paginatedOptions.length ? (
                    paginatedOptions.map((option) => (
                      <tr
                        key={`${activeTab}-${option.label}`}
                        className="hover:bg-slate-50/40"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOptionKeys.includes(
                              getOptionSelectionKey(option),
                            )}
                            onChange={() => toggleOptionSelection(option)}
                            aria-label={`Select ${option.label}`}
                            className="h-4 w-4 rounded-[3px] border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {option.pairings.length
                                ? `${option.pairings.slice(0, 2).join(", ")}${option.pairings.length > 2 ? ` +${option.pairings.length - 2}` : ""}`
                                : "No linked pairings yet"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-500">{option.slug}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-md border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            {option.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <EditorStatusChip
                            label={option.status}
                            tone={option.status === "Inactive" ? "danger" : "success"}
                            className="rounded-md"
                          />
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#4C35F2]">
                          {option.products.toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex h-9 w-12 items-center justify-center rounded-md border border-slate-200 text-sm font-semibold text-slate-700">
                            {option.sortOrder}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditOption(option)}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                              title="Edit option"
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(option)}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-rose-200 hover:text-rose-700"
                              title="Delete option"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-slate-200">
                            {activeTab === "ram" ? (
                              <FaMemory className="text-2xl text-slate-400" />
                            ) : (
                              <FaHdd className="text-2xl text-slate-400" />
                            )}
                          </div>
                          <p className="mt-4 text-base font-semibold text-slate-900">
                            No {activeTabLabel.toLowerCase()} options found
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Try adjusting your filters or add a new configuration.
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
              ) : paginatedOptions.length ? (
                paginatedOptions.map((option) => (
                  <article
                    key={`${activeTab}-mobile-${option.label}`}
                    className="space-y-3 px-2 py-4 sm:px-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedOptionKeys.includes(
                            getOptionSelectionKey(option),
                          )}
                          onChange={() => toggleOptionSelection(option)}
                          aria-label={`Select ${option.label}`}
                          className="mt-1 h-4 w-4 flex-shrink-0 rounded-[3px] border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                        />
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-slate-900">
                            {option.label}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {option.slug}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex rounded-md border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        {option.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Status
                        </p>
                        <div className="mt-1">
                          <EditorStatusChip
                            label={option.status}
                            tone={option.status === "Inactive" ? "danger" : "success"}
                            className="rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Products
                        </p>
                        <p className="mt-1 font-semibold text-[#4C35F2]">
                          {option.products.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Pairings
                        </p>
                        <p className="mt-1 text-slate-700">
                          {option.pairings.length
                            ? option.pairings.slice(0, 2).join(", ")
                            : "None"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                          Sort Order
                        </p>
                        <p className="mt-1 text-slate-700">{option.sortOrder}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditOption(option)}
                        className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(option)}
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
                    {activeTab === "ram" ? (
                      <FaMemory className="text-2xl text-slate-400" />
                    ) : (
                      <FaHdd className="text-2xl text-slate-400" />
                    )}
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900">
                    No {activeTabLabel.toLowerCase()} options found
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Try adjusting your filters or add a new configuration.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-2 py-3 sm:px-3 lg:px-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredOptions.length ? startIndex + 1 : 0}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-900">
                    {Math.min(startIndex + itemsPerPage, filteredOptions.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredOptions.length}
                  </span>{" "}
                  {activeTabLabel.toLowerCase()} options
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
              <h2 className="text-lg font-semibold text-slate-950">Overview</h2>
            </div>
            <div className="px-3 py-4 sm:px-4">
              <OverviewRing
                ramCount={ramOptions.length}
                storageCount={storageOptions.length}
                total={totalOptions}
              />
            </div>
          </section>

          <section className={CARD_CLASS}>
            <div className={PANEL_HEADER_CLASS}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">
                  Top {activeTabLabel} Options
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
              {topOptions.length ? (
                topOptions.map((option, index) => (
                  <div
                    key={`top-${option.label}`}
                    className="grid grid-cols-[18px_minmax(0,1fr)_54px] items-center gap-3"
                  >
                    <span className="text-sm font-medium text-slate-500">
                      {index + 1}.
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {option.label}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-[#4C35F2] to-[#7C5CFF]"
                          style={{
                            width: `${Math.max(
                              20,
                              (option.products / maxTopCount) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-right text-sm font-semibold text-slate-700">
                      {option.products.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No usage data is available yet.
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
                onClick={() => handleAddNew("ram")}
                className={`${pageGhostButtonClassName} w-full justify-start`}
              >
                <FaPlus className="text-sm text-[#4C35F2]" />
                <span>Add New RAM Option</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddNew("storage")}
                className={`${pageGhostButtonClassName} w-full justify-start`}
              >
                <FaPlus className="text-sm text-[#4C35F2]" />
                <span>Add New Storage Option</span>
              </button>
              <button
                type="button"
                onClick={() => fetchConfigs(false)}
                className={`${pageGhostButtonClassName} w-full justify-start`}
              >
                <FaUpload className="text-sm text-[#4C35F2]" />
                <span>Import RAM / Storage</span>
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className={`${pageGhostButtonClassName} w-full justify-start`}
              >
                <FaSearch className="text-sm text-[#4C35F2]" />
                <span>Clear Filters</span>
              </button>
            </div>
          </section>

          <section className={CARD_CLASS}>
            <div className={PANEL_HEADER_CLASS}>
              <h2 className="text-lg font-semibold text-slate-950">Need Help?</h2>
            </div>
            <div className="space-y-3 px-3 py-4 sm:px-4 text-sm text-slate-500">
              <p>
                Each entry here feeds the RAM and Storage dropdowns used in
                create/edit product forms across the admin app.
              </p>
              <p>
                Last refreshed:{" "}
                <span className="font-semibold text-slate-700">
                  {formatDateTime(new Date())}
                </span>
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default RamStorageConfig;
