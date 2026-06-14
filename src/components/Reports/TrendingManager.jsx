import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaArrowUp,
  FaCalendarAlt,
  FaChartLine,
  FaCheck,
  FaChevronDown,
  FaEdit,
  FaEllipsisH,
  FaEye,
  FaFilter,
  FaFire,
  FaMousePointer,
  FaPlus,
  FaRedo,
  FaRocket,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const HEADER_COPY = {
  manager: {
    title: "Trending Manager",
    subtitle:
      "Boost the right products. Control trending rankings, badges and visibility across the platform.",
  },
  rules: {
    title: "Trending Rules",
    subtitle:
      "Review automatic ranking logic, active rules, and ranking boosts across the platform.",
  },
};

const QUICK_ACTIONS = [
  { label: "Create Boost", icon: FaRocket },
];

const SURFACE_CLASS = "border border-slate-200 bg-white";
const FIELD_CLASS =
  "h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#345CFF] focus:ring-0";
const SECONDARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 border border-[#345CFF] bg-[#345CFF] px-4 text-sm font-semibold text-white transition hover:bg-[#274eef] disabled:cursor-not-allowed disabled:border-[#9db3ff] disabled:bg-[#9db3ff]";

const STATUS_STYLES = {
  Manual: "bg-emerald-50 text-emerald-700",
  Auto: "bg-blue-50 text-[#345CFF]",
};

const TRENDING_ROW_LIMIT = 200;
const CUSTOM_BADGE_VALUE = "__custom_badge__";
const MANUAL_BADGE_OPTIONS = [
  "Editor Pick",
  "Brand Pick",
  "Sponsored Pick",
  "Launch Spotlight",
  "Deal Spotlight",
  "Best Value",
  "Top Seller",
  "Campaign Pick",
];
const MANUAL_BADGE_OPTION_SET = new Set(MANUAL_BADGE_OPTIONS);

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatProductType = (value) =>
  String(value || "Product")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatCompactNumber = (value) => {
  const number = toFiniteNumber(value, 0);
  if (number >= 10000000) return `${(number / 10000000).toFixed(1)}Cr`;
  if (number >= 100000) return `${(number / 100000).toFixed(1)}L`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return String(Math.round(number));
};

const formatScore = (value) => {
  const number = toFiniteNumber(value, 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
};

const formatUpdatedAt = (value) => {
  if (!value) return "Not calculated yet";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const normalizeTrendingRow = (row, index) => {
  const manualBoost = Boolean(row?.manual_boost);
  const manualPriority = Math.max(0, Math.floor(toFiniteNumber(row?.manual_priority, 0)));
  const trendingScore = toFiniteNumber(row?.trending_score, 0);
  const views7d = toFiniteNumber(row?.views_7d, 0);
  const viewsPrev7d = toFiniteNumber(row?.views_prev_7d, 0);
  const compares7d = toFiniteNumber(row?.compares_7d, 0);
  const ctr = views7d > 0 ? (compares7d / views7d) * 100 : 0;
  const productType = formatProductType(row?.product_type);
  const name = String(row?.name || "Unnamed product");
  const manualBadge = row?.manual_badge ? String(row.manual_badge).trim() : "";
  const autoBadge = row?.auto_badge ? String(row.auto_badge).trim() : "";
  const displayBadge = row?.display_badge
    ? String(row.display_badge).trim()
    : manualBadge || autoBadge;

  return {
    raw: row,
    productId: Number(row?.product_id),
    rank: index + 1,
    name,
    subtitle: "",
    brand: row?.brand || "Unknown",
    category: productType,
    deviceType: productType,
    hookScore: Math.round(toFiniteNumber(row?.hook_score, 0)),
    trendingScore: formatScore(trendingScore),
    trendDirection: views7d >= viewsPrev7d ? "up" : "down",
    impressions: formatCompactNumber(views7d),
    ctr: `${ctr.toFixed(1)}%`,
    boostStatus: manualBoost ? "Manual" : "Auto",
    boostType: manualBoost ? "Manual Boost" : "Auto Ranking",
    boostUntil: manualBoost ? `Priority ${manualPriority}` : "Auto ranked",
    boostMeta: manualBoost
      ? displayBadge || "Manual boost active"
      : displayBadge || `${formatCompactNumber(compares7d)} compares in 7d`,
    manualBoost,
    manualPriority,
    manualBadge,
    autoBadge,
    displayBadge,
    views7d,
    viewsPrev7d,
    compares7d,
    viewsTotal: toFiniteNumber(row?.views_total, 0),
    comparesTotal: toFiniteNumber(row?.compares_total, 0),
    calculatedAt: row?.calculated_at || null,
  };
};

const SelectField = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={onChange}
    className={`${FIELD_CLASS} ${className}`}
  >
    {children}
  </select>
);

const SummaryCard = ({ icon: Icon, iconClassName, label, value, delta }) => (
  <article className="bg-white px-4 py-4 lg:px-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-[1.8rem] font-bold leading-none tracking-tight text-slate-950">
          {value}
        </p>
        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500">
          <FaArrowUp className="text-[10px] text-emerald-500" />
          <span>{delta}</span>
        </p>
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${iconClassName}`}>
        <Icon className="text-lg" />
      </div>
    </div>
  </article>
);

const BadgeDropdown = ({ value, onSelect, open, onToggle, onClose }) => {
  const options = [
    { value: "", label: "Auto badge", meta: "Ranking based" },
    ...MANUAL_BADGE_OPTIONS.map((badge) => ({
      value: badge,
      label: badge,
      meta: "Manual badge",
    })),
    {
      value: CUSTOM_BADGE_VALUE,
      label: "Custom promotional badge",
      meta: "Business campaign",
    },
  ];
  const selected =
    options.find((option) => option.value === value) || options[0];

  return (
    <div className="relative mt-1">
      <button
        type="button"
        onClick={onToggle}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
            onClose();
          }
        }}
        className={`flex h-12 w-full items-center justify-between border bg-white px-4 text-left text-sm transition ${
          open
            ? "border-[#2563EB] bg-gradient-to-r from-white via-[#F3F7FF] to-[#EEF6FF] ring-4 ring-[#2563EB]/10"
            : "border-slate-200 hover:border-[#93C5FD] hover:bg-gradient-to-r hover:from-white hover:to-[#F8FBFF]"
        }`}
      >
        <span>
          <span className="block font-semibold text-slate-800">
            {selected.label}
          </span>
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {selected.meta}
          </span>
        </span>
        <FaChevronDown
          className={`text-xs text-slate-500 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          tabIndex={-1}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 border border-slate-200 bg-white p-1 shadow-[0_22px_55px_rgba(15,23,42,0.18)]"
        >
          <div className="max-h-72 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:#CBD5E1_transparent]">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value || "auto"}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(option.value)}
                  className={`flex w-full items-center justify-between px-3.5 py-3 text-left text-sm transition ${
                    active
                      ? "bg-gradient-to-r from-[#EAF2FF] via-[#EEF4FF] to-[#F4FAFF] text-[#0B66F6]"
                      : "text-slate-700 hover:bg-gradient-to-r hover:from-white hover:via-[#F8FBFF] hover:to-[#EEF6FF]"
                  }`}
                >
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    <span
                      className={`block text-[11px] font-medium uppercase tracking-[0.14em] ${
                        active ? "text-[#0B66F6]/70" : "text-slate-400"
                      }`}
                    >
                      {option.meta}
                    </span>
                  </span>
                  {active ? <FaCheck className="text-xs" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const TrendingManager = () => {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || "manager";
  const headerCopy = HEADER_COPY[section] || HEADER_COPY.manager;

  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [apiRows, setApiRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingBoost, setSavingBoost] = useState(false);
  const [error, setError] = useState("");
  const [boostDraft, setBoostDraft] = useState(null);
  const [badgeDropdownOpen, setBadgeDropdownOpen] = useState(false);

  const authHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  }, []);

  const fetchTrendingRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        buildUrl(`/api/admin/trending?limit=${TRENDING_ROW_LIMIT}`),
        {
          method: "GET",
          headers: authHeaders(),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      setApiRows(Array.isArray(payload?.results) ? payload.results : []);
      setUpdatedAt(payload?.updated_at || null);
    } catch (requestError) {
      setError("Failed to load live trending data from server.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const recomputeTrendingRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildUrl("/api/admin/trending/recompute"), {
        method: "POST",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await fetchTrendingRows();
    } catch (requestError) {
      setError("Failed to recompute trending scores.");
      setLoading(false);
    }
  }, [authHeaders, fetchTrendingRows]);

  const openBoostEditor = useCallback((row = null) => {
    const manualBadge = row?.manualBadge || "";
    setBadgeDropdownOpen(false);
    setBoostDraft({
      productId: row?.productId ? String(row.productId) : "",
      productName: row?.name || "",
      manualBoost: row ? Boolean(row.manualBoost) : true,
      manualPriority: row ? String(row.manualPriority || 0) : "1",
      manualBadge,
      manualBadgePreset: manualBadge
        ? MANUAL_BADGE_OPTION_SET.has(manualBadge)
          ? manualBadge
          : CUSTOM_BADGE_VALUE
        : "",
    });
  }, []);

  const saveBoostDraft = useCallback(async () => {
    if (!boostDraft) return;
    const productId = Number(boostDraft.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      setError("Enter a valid product id before saving boost.");
      return;
    }

    setSavingBoost(true);
    setError("");
    try {
      const manualBoost = Boolean(boostDraft.manualBoost);
      const response = await fetch(buildUrl("/api/admin/trending/boost"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          product_id: productId,
          manual_boost: manualBoost,
          manual_priority: manualBoost ? Number(boostDraft.manualPriority) || 0 : 0,
          manual_badge: manualBoost ? boostDraft.manualBadge || null : null,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setBadgeDropdownOpen(false);
      setBoostDraft(null);
      await fetchTrendingRows();
    } catch (requestError) {
      setError("Failed to save manual boost.");
    } finally {
      setSavingBoost(false);
    }
  }, [authHeaders, boostDraft, fetchTrendingRows]);

  const clearManualBoost = useCallback(
    async (row) => {
      if (!row?.productId) return;
      setSavingBoost(true);
      setError("");
      try {
        const response = await fetch(buildUrl("/api/admin/trending/boost"), {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            product_id: row.productId,
            manual_boost: false,
            manual_priority: 0,
            manual_badge: null,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await fetchTrendingRows();
      } catch (requestError) {
        setError("Failed to clear manual boost.");
      } finally {
        setSavingBoost(false);
      }
    },
    [authHeaders, fetchTrendingRows],
  );

  useEffect(() => {
    fetchTrendingRows();
  }, [fetchTrendingRows]);

  useEffect(() => {
    if (section === "rules") {
      setActiveTab("auto");
      return;
    }

    if (section === "history") {
      setActiveTab("manual");
      return;
    }

    setActiveTab("all");
  }, [section]);

  const normalizedRows = useMemo(
    () => apiRows.map((row, index) => normalizeTrendingRow(row, index)),
    [apiRows],
  );

  const tabItems = useMemo(() => {
    const manualRows = normalizedRows.filter((row) => row.manualBoost).length;
    const autoRows = normalizedRows.length - manualRows;
    return [
      { value: "all", label: "All Trending", count: normalizedRows.length },
      { value: "manual", label: "Manual Boosts", count: manualRows },
      { value: "auto", label: "Auto Ranked", count: autoRows },
    ];
  }, [normalizedRows]);

  const summaryCards = useMemo(() => {
    const totalViews = normalizedRows.reduce((sum, row) => sum + row.views7d, 0);
    const totalCompares = normalizedRows.reduce(
      (sum, row) => sum + row.compares7d,
      0,
    );
    const boosted = normalizedRows.filter((row) => row.manualBoost).length;
    const averageScore = normalizedRows.length
      ? normalizedRows.reduce(
          (sum, row) => sum + toFiniteNumber(row.raw?.trending_score, 0),
          0,
        ) / normalizedRows.length
      : 0;
    const compareRate = totalViews > 0 ? (totalCompares / totalViews) * 100 : 0;

    return [
      {
        label: "Trending Now",
        value: String(normalizedRows.length),
        delta: "Live",
        icon: FaFire,
        iconClassName: "bg-violet-50 text-violet-600",
      },
      {
        label: "7d Views",
        value: formatCompactNumber(totalViews),
        delta: "Live",
        icon: FaEye,
        iconClassName: "bg-blue-50 text-[#345CFF]",
      },
      {
        label: "7d Compares",
        value: formatCompactNumber(totalCompares),
        delta: "Live",
        icon: FaMousePointer,
        iconClassName: "bg-emerald-50 text-emerald-600",
      },
      {
        label: "Compare Rate",
        value: `${compareRate.toFixed(1)}%`,
        delta: `Avg ${averageScore.toFixed(1)}`,
        icon: FaChartLine,
        iconClassName: "bg-amber-50 text-amber-500",
      },
      {
        label: "Manual Boosts",
        value: String(boosted),
        delta: "Server",
        icon: FaRocket,
        iconClassName: "bg-rose-50 text-rose-500",
      },
    ];
  }, [normalizedRows]);

  const categories = useMemo(
    () => Array.from(new Set(normalizedRows.map((row) => row.category))).sort((left, right) => left.localeCompare(right)),
    [normalizedRows],
  );

  const brands = useMemo(
    () => Array.from(new Set(normalizedRows.map((row) => row.brand))).sort((left, right) => left.localeCompare(right)),
    [normalizedRows],
  );

  const deviceTypes = useMemo(
    () => Array.from(new Set(normalizedRows.map((row) => row.deviceType))).sort((left, right) => left.localeCompare(right)),
    [normalizedRows],
  );

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();

    return normalizedRows.filter((row) => {
      if (activeTab === "manual" && !row.manualBoost) return false;
      if (activeTab === "auto" && row.manualBoost) return false;
      if (
        statusFilter !== "all" &&
        row.boostStatus.toLowerCase() !== statusFilter
      ) {
        return false;
      }
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (brandFilter !== "all" && row.brand !== brandFilter) return false;
      if (deviceFilter !== "all" && row.deviceType !== deviceFilter) return false;

      if (!search) return true;

      return [row.name, row.brand, row.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [activeTab, brandFilter, categoryFilter, deviceFilter, normalizedRows, query, statusFilter]);

  const visibleRows = useMemo(() => filteredRows.slice(0, rowsPerPage), [filteredRows, rowsPerPage]);

  const categoryBreakdown = useMemo(() => {
    const totals = normalizedRows.reduce((acc, row) => {
      acc[row.category] = (acc[row.category] || 0) + row.views7d;
      return acc;
    }, {});
    const max = Math.max(...Object.values(totals), 1);

    return Object.entries(totals)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([label, value]) => ({
        label,
        value: formatCompactNumber(value),
        delta: `${normalizedRows.filter((row) => row.category === label).length} products`,
        width: Math.max(6, Math.round((value / max) * 100)),
      }));
  }, [normalizedRows]);

  const healthItems = useMemo(() => {
    const total = Math.max(normalizedRows.length, 1);
    const manual = normalizedRows.filter((row) => row.manualBoost).length;
    const auto = normalizedRows.length - manual;
    const items = [
      { label: "Manual", value: manual, color: "#4CB663" },
      { label: "Auto", value: auto, color: "#345CFF" },
    ];
    return items.map((item) => ({
      ...item,
      percent: `${Math.round((item.value / total) * 100)}%`,
    }));
  }, [normalizedRows]);

  return (
    <div className="min-h-full bg-[#F5F7FF] p-2 sm:p-3">
      <div className="mx-auto max-w-[1480px] space-y-4 sm:space-y-5">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-[2rem] font-bold tracking-tight text-slate-950 sm:text-[2.35rem]">
                {headerCopy.title}
              </h1>
              <p className="mt-2 max-w-[42rem] text-base text-slate-500">
                {headerCopy.subtitle}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={fetchTrendingRows}
                disabled={loading}
                className={`${SECONDARY_BUTTON_CLASS} w-full sm:w-auto`}
              >
                {loading ? (
                  <FaSpinner className="animate-spin text-sm" />
                ) : (
                  <FaCalendarAlt className="text-sm" />
                )}
                Updated: {formatUpdatedAt(updatedAt)}
              </button>

              <button
                type="button"
                onClick={() => openBoostEditor()}
                className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
              >
                <FaPlus className="text-sm" />
                Add Trending Boost
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </section>

        {error ? (
          <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <section className={`${SURFACE_CLASS} px-2 py-3 sm:px-3 lg:px-4`}>
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {tabItems.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-2 text-sm font-semibold transition ${
                  activeTab === tab.value
                    ? "bg-[#EEF3FF] text-[#345CFF]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-[1.35fr_repeat(4,minmax(0,0.82fr))]">
            <div className="col-span-2 xl:col-span-1">
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Search
              </label>
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search trending products..."
                  className={`${FIELD_CLASS} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Status
              </label>
              <SelectField value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All Status</option>
                <option value="manual">Manual</option>
                <option value="auto">Auto</option>
              </SelectField>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Category
              </label>
              <SelectField value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Brand
              </label>
              <SelectField value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                <option value="all">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Device
              </label>
              <SelectField value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)}>
                <option value="all">All Devices</option>
                {deviceTypes.map((deviceType) => (
                  <option key={deviceType} value={deviceType}>
                    {deviceType}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,0.92fr)_auto]">
            <div>
              <label className="mb-2 hidden text-sm font-semibold text-slate-700 sm:block">
                Rows
              </label>
              <SelectField value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value))}>
                {[10, 20, 30].map((option) => (
                  <option key={option} value={option}>
                    {option} per page
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="sm:self-end">
              <button
                type="button"
                onClick={recomputeTrendingRows}
                disabled={loading}
                className={`${SECONDARY_BUTTON_CLASS} w-full`}
              >
                {loading ? <FaSpinner className="animate-spin text-sm" /> : <FaFilter className="text-sm" />}
                Recompute
              </button>
            </div>

            <div className="sm:self-end">
              <button
                type="button"
                onClick={() => {
                  setActiveTab(section === "rules" ? "auto" : section === "history" ? "manual" : "all");
                  setQuery("");
                  setCategoryFilter("all");
                  setBrandFilter("all");
                  setDeviceFilter("all");
                  setStatusFilter("all");
                }}
                className={`${SECONDARY_BUTTON_CLASS} w-full xl:min-w-[144px]`}
              >
                <FaRedo className="text-sm" />
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm font-medium text-slate-600">
            Showing {visibleRows.length === 0 ? 0 : 1} to {visibleRows.length} of {filteredRows.length} trending products
          </div>
        </section>

        {loading ? (
          <div className={`${SURFACE_CLASS} px-4 py-5 text-sm font-medium text-[#345CFF]`}>
            <span className="inline-flex items-center gap-2">
              <FaSpinner className="animate-spin" />
              Loading live trending data...
            </span>
          </div>
        ) : null}

        {!loading && visibleRows.length === 0 ? (
          <div className={`${SURFACE_CLASS} px-4 py-8 text-center text-sm text-slate-500`}>
            No trending products match the current filters.
          </div>
        ) : null}

        {!loading && visibleRows.length > 0 ? (
          <>
            <section className={`${SURFACE_CLASS} overflow-hidden lg:hidden`}>
              {visibleRows.map((row) => (
                <article
                  key={`mobile-${row.productId}-${row.rank}`}
                  className="border-b border-slate-200 last:border-b-0"
                >
                  <div className="px-2 py-3 sm:px-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {row.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{row.brand}</span>
                          <span className="text-slate-300">/</span>
                          <span>{row.category}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[row.boostStatus]}`}>
                        {row.boostStatus}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Rank
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">#{row.rank}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Trending Score
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">{row.trendingScore}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Views
                        </p>
                        <p className="mt-1 font-medium text-slate-700">{row.impressions}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Boost
                        </p>
                        <p className="mt-1 font-medium text-slate-700">{row.boostUntil}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openBoostEditor(row)}
                        className="inline-flex h-9 items-center justify-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                      >
                        <FaEdit className="text-xs" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => clearManualBoost(row)}
                        disabled={!row.manualBoost || savingBoost}
                        className="inline-flex h-9 items-center justify-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FaEllipsisH className="text-xs" />
                        Clear
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className={`${SURFACE_CLASS} hidden overflow-hidden lg:block`}>
              <div className="border-b border-slate-200 px-4 py-3 lg:px-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Live Trending Rankings
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Manual boosts and automatic ranking signals from the server response
                    </p>
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Showing {filteredRows.length} visible products
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left lg:px-5">Rank</th>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Brand</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Hook</th>
                      <th className="px-4 py-3 text-left">Trending</th>
                      <th className="px-4 py-3 text-left">Views</th>
                      <th className="px-4 py-3 text-left">CTR</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Boost</th>
                      <th className="px-4 py-3 text-right lg:px-5">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {visibleRows.map((row) => (
                      <tr
                        key={`${row.productId}-${row.rank}`}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 align-top font-semibold text-slate-700 lg:px-5">
                          #{row.rank}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{row.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-medium text-slate-700">
                          {row.brand}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                          {row.category}
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-semibold text-emerald-700">
                          {row.hookScore}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <span>{row.trendingScore}</span>
                            <FaArrowUp
                              className={`text-[10px] ${
                                row.trendDirection === "down"
                                  ? "rotate-180 text-rose-500"
                                  : "text-emerald-500"
                              }`}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                          {row.impressions}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                          {row.ctr}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[row.boostStatus]}`}>
                            {row.boostStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-medium text-slate-700">{row.boostUntil}</p>
                          <p className="mt-1 text-xs text-slate-500">{row.boostMeta}</p>
                        </td>
                        <td className="px-4 py-4 text-right align-top lg:px-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openBoostEditor(row)}
                              className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                              title="Edit boost"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                            <button
                              type="button"
                              onClick={() => clearManualBoost(row)}
                              disabled={!row.manualBoost || savingBoost}
                              className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Clear manual boost"
                            >
                              <FaEllipsisH className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className={`${SURFACE_CLASS} px-4 py-4 lg:px-5`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Top Trending Categories
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Distribution by 7-day views from live ranking rows
                </p>
              </div>
              <div className="text-sm font-medium text-slate-500">
                {categoryBreakdown.length} groups
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {categoryBreakdown.length ? (
                categoryBreakdown.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-700">{item.label}</div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{item.value}</span>
                        <span className="flex items-center gap-1 text-emerald-600">
                          <FaArrowUp className="text-[10px]" />
                          {item.delta}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden bg-slate-100">
                      <div
                        className="h-full bg-[#345CFF]"
                        style={{ width: `${item.width}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No trending category data yet. Run a recompute to populate the live rankings.
                </div>
              )}
            </div>
          </section>

          <section className={`${SURFACE_CLASS} px-4 py-4 lg:px-5`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Trending Health
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Manual vs automatic ranking coverage
                </p>
              </div>
              <div className="text-sm font-medium text-slate-500">
                {normalizedRows.length} products
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {healthItems.map((item) => (
                <div key={item.label} className="border border-slate-200 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span className="h-3 w-3" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {item.percent}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.value} products</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                const handleQuickAction = () => {
                  if (action.label === "Create Boost") openBoostEditor();
                };
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={handleQuickAction}
                    className="border border-slate-200 bg-white px-3 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Icon className="text-[#345CFF]" />
                      {action.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </section>

      {boostDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Manual Trending Boost
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Save a server-side boost. The table refreshes from live API
                  data after saving.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBadgeDropdownOpen(false);
                  setBoostDraft(null);
                }}
                className="flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              {boostDraft.productName ? (
                <div className="bg-[#EEF1FF] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#345CFF]">
                    Selected product
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {boostDraft.productName}
                  </p>
                </div>
              ) : null}

              <label className="flex items-center gap-3 border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(boostDraft.manualBoost)}
                  onChange={(event) =>
                    setBoostDraft((previous) => ({
                      ...previous,
                      manualBoost: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 border-slate-300 text-[#345CFF] focus:ring-[#345CFF]"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Enable manual boost
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Priority
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={boostDraft.manualPriority}
                    onChange={(event) =>
                      setBoostDraft((previous) => ({
                        ...previous,
                        manualPriority: event.target.value,
                      }))
                    }
                    className="mt-1 h-11 w-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#5A49FF] focus:ring-4 focus:ring-[#5A49FF]/10"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Badge
                  </span>
                  <BadgeDropdown
                    value={boostDraft.manualBadgePreset || ""}
                    open={badgeDropdownOpen}
                    onToggle={() =>
                      setBadgeDropdownOpen((previous) => !previous)
                    }
                    onClose={() => setBadgeDropdownOpen(false)}
                    onSelect={(value) => {
                      setBoostDraft((previous) => {
                        return {
                          ...previous,
                          manualBadgePreset: value,
                          manualBadge:
                            value === CUSTOM_BADGE_VALUE
                              ? MANUAL_BADGE_OPTION_SET.has(previous.manualBadge)
                                ? ""
                                : previous.manualBadge
                              : value,
                        };
                      });
                      setBadgeDropdownOpen(false);
                    }}
                  />
                  {boostDraft.manualBadgePreset === CUSTOM_BADGE_VALUE ? (
                    <input
                      type="text"
                      value={boostDraft.manualBadge}
                      onChange={(event) =>
                        setBoostDraft((previous) => ({
                          ...previous,
                          manualBadge: event.target.value,
                        }))
                      }
                      className="mt-3 h-11 w-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#5A49FF] focus:ring-4 focus:ring-[#5A49FF]/10"
                      placeholder="Example: Partner Pick"
                    />
                  ) : null}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setBadgeDropdownOpen(false);
                  setBoostDraft(null);
                }}
                className="inline-flex h-11 items-center justify-center border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveBoostDraft}
                disabled={savingBoost}
                className="inline-flex h-11 items-center justify-center gap-2 bg-gradient-to-r from-[#345CFF] to-[#5C35FF] px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(92,76,255,0.22)] disabled:opacity-60"
              >
                {savingBoost ? <FaSpinner className="animate-spin" /> : <FaRocket />}
                Save Boost
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </div>
  );
};

export default TrendingManager;
