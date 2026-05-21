import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaExclamationCircle,
  FaFilter,
  FaHome,
  FaLaptop,
  FaLayerGroup,
  FaMobile,
  FaNetworkWired,
  FaPlus,
  FaSave,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import CountUp from "react-countup";
import { buildUrl } from "../api";

const EMPTY_FORM = {
  name: "",
  type: "smartphone",
  description: "",
};

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

const PRODUCT_TYPES = [
  { value: "smartphone", label: "Smartphone", icon: FaMobile },
  { value: "laptop", label: "Laptop", icon: FaLaptop },
  { value: "homeappliance", label: "Home Appliance", icon: FaHome },
  { value: "network", label: "Network", icon: FaNetworkWired },
];

const TYPE_META = {
  smartphone: {
    label: "Smartphone",
    Icon: FaMobile,
    statIconClassName: "bg-blue-50 text-blue-600",
    badgeClassName:
      "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100",
    dotClassName: "bg-blue-500",
  },
  laptop: {
    label: "Laptop",
    Icon: FaLaptop,
    statIconClassName: "bg-violet-50 text-violet-600",
    badgeClassName:
      "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100",
    dotClassName: "bg-violet-500",
  },
  homeappliance: {
    label: "Home Appliance",
    Icon: FaHome,
    statIconClassName: "bg-emerald-50 text-emerald-600",
    badgeClassName:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
    dotClassName: "bg-emerald-500",
  },
  network: {
    label: "Network",
    Icon: FaNetworkWired,
    statIconClassName: "bg-amber-50 text-amber-600",
    badgeClassName:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
    dotClassName: "bg-amber-500",
  },
  default: {
    label: "Category",
    Icon: FaLayerGroup,
    statIconClassName: "bg-violet-50 text-violet-600",
    badgeClassName:
      "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
    dotClassName: "bg-slate-500",
  },
};

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 sm:px-3 md:px-4";

const CARD_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";

const SECTION_HEADER_CLASS = "border-b border-slate-200 bg-white px-3 py-4 sm:px-4";

const flatFieldClassName =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4C35F2] focus:bg-white focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50";

const secondaryButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white transition hover:bg-[#3E29DE] disabled:cursor-not-allowed disabled:opacity-60";

const rowActionButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

const dangerActionButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-none transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60";

const normalizeText = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const getCategoryId = (category = {}) =>
  normalizeText(
    category.id ||
      category._id ||
      category.category_id ||
      category.categoryId ||
      category.slug,
  );

const normalizeCategory = (category = {}) => {
  const type = normalizeText(category.product_type || category.type) || "smartphone";

  return {
    ...category,
    id:
      getCategoryId(category) ||
      `${type}-${normalizeText(category.name).toLowerCase().replace(/\s+/g, "-")}`,
    name: normalizeText(category.name) || "Untitled Category",
    type,
    description: normalizeText(category.description),
    created_at:
      category.created_at ||
      category.createdAt ||
      category.updated_at ||
      category.updatedAt ||
      "",
  };
};

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, 4, 5];
  if (currentPage >= totalPages - 2) {
    return Array.from({ length: 5 }, (_, index) => totalPages - 4 + index);
  }

  return Array.from({ length: 5 }, (_, index) => currentPage - 2 + index);
};

const getTypeMeta = (type) => TYPE_META[type] || TYPE_META.default;

const FormFields = ({ formData, onChange, disabled = false }) => (
  <div className="grid gap-4 xl:grid-cols-[1.1fr,1fr,1.1fr]">
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Category Name <span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={onChange}
        disabled={disabled}
        placeholder="Enter category name"
        className={`${flatFieldClassName} text-slate-900 placeholder:text-slate-400`}
      />
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Product Type <span className="text-rose-500">*</span>
      </label>
      <select
        name="type"
        value={formData.type}
        onChange={onChange}
        disabled={disabled}
        className={`${flatFieldClassName} text-slate-900`}
      >
        {PRODUCT_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Description
      </label>
      <textarea
        name="description"
        value={formData.description}
        onChange={onChange}
        disabled={disabled}
        placeholder="Enter description (optional)"
        rows={3}
        className="min-h-[68px] w-full border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </div>
  </div>
);

const Toasts = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100vw-1rem)] max-w-md -translate-x-1/2 space-y-2 sm:w-full">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`flex items-start gap-3 border px-4 py-3 ${
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50"
            : "border-rose-200 bg-rose-50"
        }`}
      >
        <div
          className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${
            toast.type === "success"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-rose-100 text-rose-600"
          }`}
        >
          {toast.type === "success" ? (
            <FaCheckCircle className="text-sm" />
          ) : (
            <FaExclamationCircle className="text-sm" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
          <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 transition hover:text-slate-700"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
    ))}
  </div>
);

const StatCard = ({ icon: Icon, label, value, helper, iconClassName, dotClassName }) => (
  <div className={CARD_CLASS}>
    <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          <CountUp end={value} duration={0.8} />
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span className={`h-2.5 w-2.5 rounded-full ${dotClassName}`} />
          <span>{helper}</span>
        </div>
      </div>

      <div className={`flex h-12 w-12 items-center justify-center rounded-md ${iconClassName}`}>
        <Icon className="text-lg" />
      </div>
    </div>
  </div>
);

const FormPage = ({
  title,
  description,
  formTitle,
  formDescription,
  formData,
  onChange,
  onSubmit,
  onBack,
  submitLabel,
  submitIcon,
  submitting,
  disabled = false,
  helperMessage = "",
}) => (
  <section className={CARD_CLASS}>
    <div className={SECTION_HEADER_CLASS}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>

      <button type="button" onClick={onBack} className={secondaryButtonClassName}>
        <FaChevronLeft className="text-xs" />
        Back to Categories
      </button>
      </div>
    </div>

    <div className="px-2 py-4 sm:px-3 lg:px-4">
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-slate-950">{formTitle}</h3>
        <p className="mt-1 text-sm text-slate-500">{formDescription}</p>
      </div>

      <FormFields formData={formData} onChange={onChange} disabled={disabled} />

      {helperMessage ? (
        <div className="mt-4 border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {helperMessage}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || disabled}
          className={primaryButtonClassName}
        >
          {submitting ? (
            <FaSpinner className="animate-spin text-sm" />
          ) : (
            submitIcon
          )}
          {submitLabel}
        </button>
        <button type="button" onClick={onBack} className={secondaryButtonClassName}>
          Cancel
        </button>
      </div>
    </div>
  </section>
);

const CategoryManagement = ({ mode = "list" }) => {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const isListMode = mode === "list";
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [hydratedEditId, setHydratedEditId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [toasts, setToasts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const showToast = useCallback((title, message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const resetCreateForm = useCallback(() => {
    setCreateForm(EMPTY_FORM);
  }, []);

  const backToCategories = useCallback(() => {
    navigate("/specifications/categories");
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setTypeFilter("all");
    setSortBy("newest");
  }, []);

  const fetchCategories = useCallback(
    async ({ showSuccessToast = false } = {}) => {
      if (loading || refreshing) return;

      if (categories.length > 0) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const token = Cookies.get("authToken");
        const res = await fetch(buildUrl("/api/categories"), {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        let rows = [];
        if (Array.isArray(data)) rows = data;
        else if (data && Array.isArray(data.categories)) rows = data.categories;
        else if (data && Array.isArray(data.data)) rows = data.data;
        else rows = Array.isArray(data?.rows) ? data.rows : [];

        setCategories(rows.map((row) => normalizeCategory(row)));

        if (showSuccessToast) {
          showToast("Success", "Categories refreshed successfully", "success");
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError(err.message || "Failed to load categories");
        showToast("Error", "Failed to load categories", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [categories.length, loading, refreshing, showToast],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, typeFilter, itemsPerPage]);

  const selectedCategory = useMemo(
    () =>
      categories.find((category) => getCategoryId(category) === String(categoryId || "")) ||
      null,
    [categories, categoryId],
  );

  useEffect(() => {
    if (!isEditMode) {
      setHydratedEditId("");
      setEditForm(EMPTY_FORM);
      return;
    }

    if (!selectedCategory || !categoryId) return;
    if (hydratedEditId === categoryId) return;

    setEditForm({
      name: selectedCategory.name,
      type: selectedCategory.type,
      description: selectedCategory.description,
    });
    setHydratedEditId(categoryId);
  }, [categoryId, hydratedEditId, isEditMode, selectedCategory]);

  const handleCreateInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleEditInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const filteredAndSortedCategories = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return categories
      .filter((category) => {
        if (typeFilter === "all") return true;
        return category.type === typeFilter;
      })
      .filter((category) => {
        if (!normalizedQuery) return true;
        return [category.name, category.description, category.type]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (sortBy === "name") return left.name.localeCompare(right.name);
        if (sortBy === "type") return left.type.localeCompare(right.type);

        const leftTime = new Date(left.created_at || 0).getTime();
        const rightTime = new Date(right.created_at || 0).getTime();

        if (sortBy === "oldest") return leftTime - rightTime;
        return rightTime - leftTime;
      });
  }, [categories, searchTerm, sortBy, typeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedCategories.length / itemsPerPage),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredAndSortedCategories.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const stats = useMemo(
    () => [
      {
        key: "total",
        label: "Total Categories",
        count: categories.length,
        subtitle: "All product types",
        Icon: FaLayerGroup,
        dotClassName: "bg-slate-500",
        statIconClassName:
          "bg-[linear-gradient(135deg,#1F5FFF_0%,#477DFF_100%)] text-white",
      },
      {
        key: "smartphone",
        label: "Smartphone Categories",
        count: categories.filter((category) => category.type === "smartphone").length,
        subtitle: "Smartphone",
        ...TYPE_META.smartphone,
      },
      {
        key: "laptop",
        label: "Laptop Categories",
        count: categories.filter((category) => category.type === "laptop").length,
        subtitle: "Laptop",
        ...TYPE_META.laptop,
      },
      {
        key: "homeappliance",
        label: "Home Appliance Categories",
        count: categories.filter((category) => category.type === "homeappliance").length,
        subtitle: "Home Appliance",
        ...TYPE_META.homeappliance,
      },
      {
        key: "network",
        label: "Network Categories",
        count: categories.filter((category) => category.type === "network").length,
        subtitle: "Network",
        ...TYPE_META.network,
      },
    ],
    [categories],
  );

  const handleCreateCategory = useCallback(async () => {
    if (!createForm.name.trim()) {
      showToast("Validation Error", "Category name is required", "error");
      return;
    }

    setSavingCreate(true);

    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl("/api/categories"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add category");
      }

      const data = await res.json();
      const normalizedCategory = normalizeCategory({
        ...(data.data || data),
        created_at: data?.data?.created_at || data?.created_at || new Date().toISOString(),
      });

      setCategories((prev) => [normalizedCategory, ...prev]);
      resetCreateForm();
      showToast("Success", "Category created successfully", "success");
    } catch (err) {
      console.error("Create category error:", err);
      showToast("Error", err.message || "Failed to add category", "error");
    } finally {
      setSavingCreate(false);
    }
  }, [createForm, resetCreateForm, showToast]);

  const handleUpdateCategory = useCallback(async () => {
    if (!categoryId) {
      showToast("Selection Required", "Choose a category to edit first", "error");
      return;
    }

    if (!editForm.name.trim()) {
      showToast("Validation Error", "Category name is required", "error");
      return;
    }

    setSavingEdit(true);

    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl(`/api/categories/${categoryId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update category");
      }

      const data = await res.json();
      const rawSavedCategory = data.data || data;

      setCategories((prev) =>
        prev.map((category) =>
          getCategoryId(category) === String(categoryId)
            ? normalizeCategory({ ...category, ...rawSavedCategory })
            : category,
        ),
      );

      showToast("Success", "Category updated successfully", "success");
    } catch (err) {
      console.error("Update category error:", err);
      showToast("Error", err.message || "Failed to update category", "error");
    } finally {
      setSavingEdit(false);
    }
  }, [categoryId, editForm, showToast]);

  const handleDelete = useCallback(
    async (targetCategoryId, categoryName) => {
      if (
        !window.confirm(
          `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
        )
      ) {
        return;
      }

      setDeletingId(targetCategoryId);

      try {
        const token = Cookies.get("authToken");
        const res = await fetch(buildUrl(`/api/categories/${targetCategoryId}`), {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!res.ok) throw new Error("Delete failed");

        setCategories((prev) =>
          prev.filter((category) => getCategoryId(category) !== targetCategoryId),
        );
        showToast("Success", "Category deleted successfully", "success");
      } catch (err) {
        console.error("Delete category error:", err);
        showToast("Error", "Failed to delete category", "error");
      } finally {
        setDeletingId("");
      }
    },
    [showToast],
  );

  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const showingFrom = filteredAndSortedCategories.length === 0 ? 0 : startIndex + 1;
  const showingTo =
    filteredAndSortedCategories.length === 0
      ? 0
      : Math.min(startIndex + itemsPerPage, filteredAndSortedCategories.length);

  const headerTitle = isCreateMode
    ? "Create Category"
    : isEditMode
      ? "Edit Category"
      : "Category Management";

  const headerDescription = isCreateMode
    ? "Add a new category and assign it to the right product type."
    : isEditMode
      ? "Update the selected category without mixing it with the registry."
      : "Create, organize and manage product categories across all product types.";

  return (
    <div className={PAGE_CLASS}>
        <Toasts toasts={toasts} onDismiss={removeToast} />

        <div className="border-b border-slate-200 pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {headerTitle}
                </h1>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-600 shadow-none">
                  <FaLayerGroup className="text-base" />
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-500">{headerDescription}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {isListMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => fetchCategories({ showSuccessToast: true })}
                    disabled={refreshing || loading}
                    className={secondaryButtonClassName}
                  >
                    {refreshing || loading ? (
                      <FaSpinner className="animate-spin text-sm" />
                    ) : (
                      <FaSyncAlt className="text-sm" />
                    )}
                    <span>Refresh Categories</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/specifications/categories/create")}
                    className={primaryButtonClassName}
                  >
                    <FaPlus className="text-sm" />
                    <span>Add New Category</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={backToCategories}
                  className={secondaryButtonClassName}
                >
                  <FaChevronLeft className="text-xs" />
                  <span>Back to Categories</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {isListMode ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => {
              return (
                <StatCard
                  key={stat.key}
                  icon={stat.Icon}
                  label={stat.label}
                  value={stat.count}
                  helper={stat.subtitle}
                  iconClassName={stat.statIconClassName}
                  dotClassName={stat.dotClassName}
                />
              );
            })}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-none">
            <FaExclamationCircle className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load categories</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        ) : null}

        {isCreateMode ? (
          <FormPage
            title="Create Category"
            description="Use this workspace to add a new product category without showing the registry table on the same screen."
            formTitle="New Category Details"
            formDescription="Fill in the basic details and save the new category."
            formData={createForm}
            onChange={handleCreateInputChange}
            onSubmit={handleCreateCategory}
            onBack={backToCategories}
            submitLabel="Add Category"
            submitIcon={<FaPlus className="text-sm" />}
            submitting={savingCreate}
          />
        ) : null}

        {isEditMode ? (
          <FormPage
            title="Edit Category"
            description="Update the selected category in its own focused screen."
            formTitle="Category Details"
            formDescription="Adjust the category fields and save your changes."
            formData={editForm}
            onChange={handleEditInputChange}
            onSubmit={handleUpdateCategory}
            onBack={backToCategories}
            submitLabel="Update Category"
            submitIcon={<FaSave className="text-sm" />}
            submitting={savingEdit}
            disabled={!selectedCategory && !loading}
            helperMessage={
              !loading && !selectedCategory
                ? "The selected category could not be found. Return to the registry and choose another category."
                : ""
            }
          />
        ) : null}

        {isListMode ? (
          <section className={CARD_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <div className="space-y-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-slate-950">
                    Category Registry
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Showing {showingFrom} to {showingTo} of{" "}
                    {filteredAndSortedCategories.length} categories
                  </p>
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative min-w-0 flex-1">
                    <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search categories..."
                      className={`${flatFieldClassName} pl-10 text-slate-900 placeholder:text-slate-400`}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_210px_auto_auto]">
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                      className={flatFieldClassName}
                    >
                      <option value="all">All Types</option>
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className={flatFieldClassName}
                    >
                      <option value="newest">Sort by: Newest First</option>
                      <option value="oldest">Sort by: Oldest First</option>
                      <option value="name">Sort by: Name A-Z</option>
                      <option value="type">Sort by: Type</option>
                    </select>

                    <div className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-[#4C35F2] shadow-none">
                      <FaFilter className="text-sm" />
                      <span>Filters</span>
                    </div>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className={secondaryButtonClassName}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2F63FF]">
                  <FaSpinner className="animate-spin text-xl" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-950">
                  Loading category registry
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Fetching categories and product-type data.
                </p>
              </div>
            ) : filteredAndSortedCategories.length === 0 ? (
              <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <FaLayerGroup className="text-2xl" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-950">
                  {searchTerm || typeFilter !== "all"
                    ? "No categories match the current filters"
                    : "No categories found"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {searchTerm || typeFilter !== "all"
                    ? "Try changing the search query or type filter to see more results."
                    : "Create your first category using the dedicated create page."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-full text-sm text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <th className="px-5 py-4">#</th>
                        <th className="px-5 py-4">Category Name</th>
                        <th className="px-5 py-4">Product Type</th>
                        <th className="px-5 py-4">Description</th>
                        <th className="px-5 py-4">Created At</th>
                        <th className="px-5 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCategories.map((category, index) => {
                        const typeMeta = getTypeMeta(category.type);
                        const TypeIcon = typeMeta.Icon;
                        const normalizedCategoryId = getCategoryId(category);

                        return (
                          <tr
                            key={normalizedCategoryId}
                            className="border-b border-slate-200 transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 text-sm font-medium text-slate-500">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-950">
                                {category.name}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${typeMeta.badgeClassName}`}
                              >
                                <TypeIcon className="text-[11px]" />
                                {typeMeta.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">
                              <div className="max-w-[26rem] leading-6">
                                {category.description || "No description provided"}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">
                              {formatDateTime(category.created_at)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/specifications/categories/edit/${normalizedCategoryId}`,
                                    )
                                  }
                                  className={rowActionButtonClassName}
                                >
                                  <FaEdit className="text-xs" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(normalizedCategoryId, category.name)
                                  }
                                  disabled={deletingId === normalizedCategoryId}
                                  className={dangerActionButtonClassName}
                                >
                                  {deletingId === normalizedCategoryId ? (
                                    <FaSpinner className="animate-spin text-xs" />
                                  ) : (
                                    <FaTrash className="text-xs" />
                                  )}
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="lg:hidden">
                  {paginatedCategories.map((category, index) => {
                    const typeMeta = getTypeMeta(category.type);
                    const TypeIcon = typeMeta.Icon;
                    const normalizedCategoryId = getCategoryId(category);

                    return (
                      <article
                        key={normalizedCategoryId}
                        className="border-b border-slate-200 last:border-b-0"
                      >
                        <div className="px-2 py-3 sm:px-3">
                          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Category #{startIndex + index + 1}
                              </p>
                              <h3 className="mt-1 text-base font-semibold text-slate-950">
                                {category.name}
                              </h3>
                            </div>
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold ${typeMeta.badgeClassName}`}
                            >
                              <TypeIcon className="text-[11px]" />
                              {typeMeta.label}
                            </span>
                          </div>

                          <div className="pt-3">
                            <div className="flex items-start justify-between gap-3 border-b border-slate-200 py-2">
                              <span className="text-sm text-slate-500">Description</span>
                              <span className="max-w-[65%] text-right text-sm text-slate-700">
                                {category.description || "No description provided"}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-3 py-2">
                              <span className="text-sm text-slate-500">Created At</span>
                              <span className="max-w-[65%] text-right text-sm text-slate-700">
                                {formatDateTime(category.created_at)}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 border-t border-slate-200 pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/specifications/categories/edit/${normalizedCategoryId}`,
                                )
                              }
                              className={`${rowActionButtonClassName} flex-1`}
                            >
                              <FaEdit className="text-xs" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(normalizedCategoryId, category.name)
                              }
                              disabled={deletingId === normalizedCategoryId}
                              className={`${dangerActionButtonClassName} flex-1`}
                            >
                              {deletingId === normalizedCategoryId ? (
                                <FaSpinner className="animate-spin text-xs" />
                              ) : (
                                <FaTrash className="text-xs" />
                              )}
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}

            {filteredAndSortedCategories.length > 0 ? (
              <div className="border-t border-slate-200 px-2 py-3 sm:px-3 lg:px-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span>Rows per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(event) =>
                        setItemsPerPage(Number(event.target.value))
                      }
                      className="h-10 border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#345CFF] focus:ring-0"
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaChevronLeft className="text-xs" />
                    </button>

                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`inline-flex h-10 w-10 items-center justify-center border text-sm font-semibold transition ${
                          currentPage === pageNumber
                            ? "border-[#2F63FF] bg-[#2F63FF] text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
    </div>
  );
};

export default CategoryManagement;
