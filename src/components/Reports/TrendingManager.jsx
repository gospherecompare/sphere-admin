import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaArrowUp,
  FaCalendarAlt,
  FaChartLine,
  FaChevronDown,
  FaCog,
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
  FaSlidersH,
} from "react-icons/fa";

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
  history: {
    title: "Boost History",
    subtitle:
      "Audit scheduled, expired and manual boost activity from one place.",
  },
};

const SUMMARY_CARDS = [
  {
    label: "Trending Now",
    value: "126",
    delta: "15.3%",
    icon: FaFire,
    iconClassName: "bg-violet-50 text-violet-600",
  },
  {
    label: "Total Impressions",
    value: "8.62M",
    delta: "18.6%",
    icon: FaEye,
    iconClassName: "bg-blue-50 text-[#345CFF]",
  },
  {
    label: "Total Clicks",
    value: "1.26M",
    delta: "12.7%",
    icon: FaMousePointer,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "CTR",
    value: "14.62%",
    delta: "2.3%",
    icon: FaChartLine,
    iconClassName: "bg-amber-50 text-amber-500",
  },
  {
    label: "Boosted Products",
    value: "54",
    delta: "8.0%",
    icon: FaRocket,
    iconClassName: "bg-rose-50 text-rose-500",
  },
];

const TAB_ITEMS = [
  { value: "all", label: "All Trending", count: 126 },
  { value: "active", label: "Active Boosts", count: 54 },
  { value: "scheduled", label: "Scheduled", count: 12 },
  { value: "expired", label: "Expired", count: 18 },
];

const TABLE_ROWS = [
  {
    rank: 1,
    badgeClassName: "bg-amber-500",
    thumbClassName: "from-slate-900 via-slate-700 to-slate-500",
    thumbLabel: "IP",
    name: "iPhone 15 Pro Max",
    subtitle: "256GB",
    brand: "Apple",
    category: "Smartphones",
    deviceType: "Smartphone",
    hookScore: 92,
    trendingScore: 98,
    trendDirection: "up",
    impressions: "845.2K",
    ctr: "16.8%",
    boostStatus: "Active",
    boostType: "Manual Boost",
    boostUntil: "May 25, 2024",
    boostMeta: "7 days left",
  },
  {
    rank: 2,
    badgeClassName: "bg-slate-400",
    thumbClassName: "from-slate-700 via-slate-500 to-slate-300",
    thumbLabel: "SG",
    name: "Samsung Galaxy S24 Ultra",
    subtitle: "256GB",
    brand: "Samsung",
    category: "Smartphones",
    deviceType: "Smartphone",
    hookScore: 90,
    trendingScore: 95,
    trendDirection: "up",
    impressions: "712.4K",
    ctr: "15.3%",
    boostStatus: "Active",
    boostType: "Trending Rule",
    boostUntil: "May 22, 2024",
    boostMeta: "4 days left",
  },
  {
    rank: 3,
    badgeClassName: "bg-orange-500",
    thumbClassName: "from-emerald-700 via-slate-800 to-slate-500",
    thumbLabel: "OP",
    name: "OnePlus 12",
    subtitle: "12GB RAM",
    brand: "OnePlus",
    category: "Smartphones",
    deviceType: "Smartphone",
    hookScore: 88,
    trendingScore: 91,
    trendDirection: "up",
    impressions: "512.6K",
    ctr: "14.6%",
    boostStatus: "Active",
    boostType: "Manual Boost",
    boostUntil: "May 24, 2024",
    boostMeta: "6 days left",
  },
  {
    rank: 4,
    badgeClassName: "bg-violet-500",
    thumbClassName: "from-slate-100 via-slate-200 to-slate-400",
    thumbLabel: "NP",
    name: "Nothing Phone (2)",
    subtitle: "12GB RAM",
    brand: "Nothing",
    category: "Smartphones",
    deviceType: "Smartphone",
    hookScore: 85,
    trendingScore: 85,
    trendDirection: "up",
    impressions: "421.8K",
    ctr: "13.2%",
    boostStatus: "Active",
    boostType: "Trending Rule",
    boostUntil: "May 20, 2024",
    boostMeta: "2 days left",
  },
  {
    rank: 5,
    badgeClassName: "bg-indigo-500",
    thumbClassName: "from-[#F59E0B] via-[#1F2937] to-[#0F172A]",
    thumbLabel: "PX",
    name: "POCO X6 Pro 5G",
    subtitle: "8GB RAM",
    brand: "POCO",
    category: "Smartphones",
    deviceType: "Smartphone",
    hookScore: 82,
    trendingScore: 83,
    trendDirection: "up",
    impressions: "388.7K",
    ctr: "12.9%",
    boostStatus: "Scheduled",
    boostType: "Manual Boost",
    boostUntil: "May 19, 2024",
    boostMeta: "Starts in 1 day",
  },
  {
    rank: 6,
    badgeClassName: "bg-sky-500",
    thumbClassName: "from-slate-800 via-blue-700 to-slate-950",
    thumbLabel: "MB",
    name: "MacBook Air M3",
    subtitle: "13-inch",
    brand: "Apple",
    category: "Laptops",
    deviceType: "Laptop",
    hookScore: 91,
    trendingScore: 81,
    trendDirection: "down",
    impressions: "312.4K",
    ctr: "11.8%",
    boostStatus: "Active",
    boostType: "Trending Rule",
    boostUntil: "May 21, 2024",
    boostMeta: "3 days left",
  },
  {
    rank: 7,
    badgeClassName: "bg-slate-500",
    thumbClassName: "from-slate-300 via-slate-500 to-slate-700",
    thumbLabel: "SW",
    name: "Sony WH-1000XM5",
    subtitle: "Wireless",
    brand: "Sony",
    category: "Audio",
    deviceType: "Audio",
    hookScore: 86,
    trendingScore: 79,
    trendDirection: "down",
    impressions: "285.9K",
    ctr: "10.6%",
    boostStatus: "Scheduled",
    boostType: "Manual Boost",
    boostUntil: "May 20, 2024",
    boostMeta: "2 days left",
  },
  {
    rank: 8,
    badgeClassName: "bg-fuchsia-500",
    thumbClassName: "from-red-500 via-white to-slate-700",
    thumbLabel: "IQ",
    name: "iQOO Neo 9 Pro 5G",
    subtitle: "256GB",
    brand: "iQOO",
    category: "Smartphones",
    deviceType: "Smartphone",
    hookScore: 80,
    trendingScore: 76,
    trendDirection: "up",
    impressions: "248.1K",
    ctr: "10.3%",
    boostStatus: "Expired",
    boostType: "Manual Boost",
    boostUntil: "May 11, 2024",
    boostMeta: "Expired",
  },
];

const CATEGORY_BREAKDOWN = [
  { label: "Smartphones", value: "8.62M", delta: "18.6%", width: 78 },
  { label: "Laptops", value: "1.24M", delta: "10.3%", width: 34 },
  { label: "Audio", value: "945K", delta: "7.2%", width: 26 },
  { label: "Wearables", value: "642K", delta: "5.6%", width: 18 },
  { label: "Tablets", value: "318K", delta: "3.1%", width: 10 },
];

const HEALTH_ITEMS = [
  { label: "Active", value: 54, percent: "42.9%", color: "#4CB663" },
  { label: "Scheduled", value: 12, percent: "9.5%", color: "#FFAC14" },
  { label: "Expired", value: 18, percent: "14.3%", color: "#F97316" },
  { label: "Others", value: 42, percent: "33.3%", color: "#CBD5E1" },
];

const QUICK_ACTIONS = [
  { label: "Create Boost", icon: FaRocket },
  { label: "Trending Rules", icon: FaSlidersH },
  { label: "Boost History", icon: FaRedo },
  { label: "Settings", icon: FaCog },
];

const CHART_LABELS = ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"];
const CHART_VALUES = [2.4, 3.8, 3.5, 6.4, 5.9, 8.2, 8.7];

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-700",
  Scheduled: "bg-amber-50 text-amber-700",
  Expired: "bg-slate-100 text-slate-600",
};

const BOOST_TYPE_STYLES = {
  "Manual Boost": "bg-violet-50 text-violet-700",
  "Trending Rule": "bg-blue-50 text-[#345CFF]",
};

const chartPoints = (values, width, height, padding) => {
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return values.map((value, index) => {
    const x =
      padding + (values.length === 1 ? usableWidth / 2 : (usableWidth / (values.length - 1)) * index);
    const normalized = (value - minValue) / (maxValue - minValue || 1);
    const y = height - padding - normalized * usableHeight;
    return { x, y };
  });
};

const linePath = (points) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

const areaPath = (points, height, padding) => {
  if (!points.length) return "";

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  return `${linePath(points)} L ${lastPoint.x.toFixed(2)} ${(height - padding).toFixed(2)} L ${firstPoint.x.toFixed(2)} ${(height - padding).toFixed(2)} Z`;
};

const SelectField = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={onChange}
    className={`h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#5A49FF] focus:ring-4 focus:ring-[#5A49FF]/10 ${className}`}
  >
    {children}
  </select>
);

const SummaryCard = ({ icon: Icon, iconClassName, label, value, delta }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
    <div className="flex items-start gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${iconClassName}`}>
        <Icon className="text-lg" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-[2rem] font-bold leading-none tracking-tight text-slate-950">{value}</p>
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <FaArrowUp className="text-[10px] text-emerald-500" />
          <span className="font-semibold text-emerald-600">{delta}</span>
          <span>vs last 7 days</span>
        </p>
      </div>
    </div>
  </div>
);

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

  useEffect(() => {
    if (section === "rules") {
      setActiveTab("active");
      return;
    }

    if (section === "history") {
      setActiveTab("expired");
      return;
    }

    setActiveTab("all");
  }, [section]);

  const categories = useMemo(
    () => Array.from(new Set(TABLE_ROWS.map((row) => row.category))).sort((left, right) => left.localeCompare(right)),
    [],
  );

  const brands = useMemo(
    () => Array.from(new Set(TABLE_ROWS.map((row) => row.brand))).sort((left, right) => left.localeCompare(right)),
    [],
  );

  const deviceTypes = useMemo(
    () => Array.from(new Set(TABLE_ROWS.map((row) => row.deviceType))).sort((left, right) => left.localeCompare(right)),
    [],
  );

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();

    return TABLE_ROWS.filter((row) => {
      if (activeTab !== "all" && row.boostStatus.toLowerCase() !== activeTab) return false;
      if (statusFilter !== "all" && row.boostStatus.toLowerCase() !== statusFilter) return false;
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (brandFilter !== "all" && row.brand !== brandFilter) return false;
      if (deviceFilter !== "all" && row.deviceType !== deviceFilter) return false;

      if (!search) return true;

      return [row.name, row.subtitle, row.brand, row.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [activeTab, brandFilter, categoryFilter, deviceFilter, query, statusFilter]);

  const visibleRows = useMemo(() => filteredRows.slice(0, rowsPerPage), [filteredRows, rowsPerPage]);

  const overviewPoints = useMemo(() => chartPoints(CHART_VALUES, 420, 190, 18), []);
  const healthBackground = useMemo(() => {
    const total = HEALTH_ITEMS.reduce((sum, item) => sum + item.value, 0);
    let offset = 0;

    const segments = HEALTH_ITEMS.map((item) => {
      const start = offset;
      offset += (item.value / total) * 100;
      return `${item.color} ${start}% ${offset}%`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, []);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-[2.2rem] font-bold tracking-tight text-slate-950">
            {headerCopy.title}
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <FaChartLine className="text-lg" />
            </span>
          </h1>
          <p className="mt-2 max-w-3xl text-base text-slate-500">{headerCopy.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.04)]"
          >
            <FaCalendarAlt className="text-sm text-slate-500" />
            May 12 - May 18, 2024
            <FaChevronDown className="text-[10px] text-slate-400" />
          </button>

          <button
            type="button"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#345CFF] to-[#5C35FF] px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(92,76,255,0.25)]"
          >
            <FaPlus className="text-sm" />
            Add Trending Boost
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_360px]">
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
          <h2 className="text-[1.05rem] font-semibold text-slate-950">Trending Overview</h2>
          <p className="mt-1 text-sm text-slate-500">Last 7 days performance</p>

          <div className="mt-6">
            <svg viewBox="0 0 420 190" className="h-[190px] w-full">
              {[32, 68, 104, 140].map((y) => (
                <line key={y} x1="18" y1={y} x2="402" y2={y} stroke="#E7ECF5" strokeWidth="1" />
              ))}

              <path d={areaPath(overviewPoints, 190, 18)} fill="url(#trendingAreaGradient)" opacity="0.24" />
              <path d={linePath(overviewPoints)} fill="none" stroke="#6D35FF" strokeWidth="3.5" strokeLinecap="round" />

              {overviewPoints.map((point, index) => (
                <circle key={CHART_LABELS[index]} cx={point.x} cy={point.y} r="4.5" fill="#6D35FF" />
              ))}

              <defs>
                <linearGradient id="trendingAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
              {CHART_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_360px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      activeTab === tab.value
                        ? "bg-[#EEF1FF] text-[#345CFF]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SelectField value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-w-[150px]">
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </SelectField>

                <SelectField value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} className="min-w-[150px]">
                  <option value="all">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </SelectField>

                <SelectField value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)} className="min-w-[150px]">
                  <option value="all">All Devices</option>
                  {deviceTypes.map((deviceType) => (
                    <option key={deviceType} value={deviceType}>
                      {deviceType}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[20rem]">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search trending products..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#5A49FF] focus:ring-4 focus:ring-[#5A49FF]/10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SelectField value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-w-[120px]">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                </SelectField>

                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
                >
                  <FaFilter className="text-sm" />
                  Filters
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(section === "rules" ? "active" : section === "history" ? "expired" : "all");
                    setQuery("");
                    setCategoryFilter("all");
                    setBrandFilter("all");
                    setDeviceFilter("all");
                    setStatusFilter("all");
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#345CFF]"
                >
                  <FaRedo className="text-sm" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
            <table className="min-w-[1220px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-4 py-4 lg:px-5">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#345CFF] focus:ring-[#345CFF]" />
                  </th>
                  <th className="px-4 py-4 lg:px-5">Rank</th>
                  <th className="px-4 py-4">Device</th>
                  <th className="px-4 py-4">Brand</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Hook Score</th>
                  <th className="px-4 py-4">Trending Score</th>
                  <th className="px-4 py-4">Impressions</th>
                  <th className="px-4 py-4">CTR</th>
                  <th className="px-4 py-4">Boost Status</th>
                  <th className="px-4 py-4">Boost Type</th>
                  <th className="px-4 py-4">Boost Until</th>
                  <th className="px-4 py-4 text-right lg:px-5">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="px-4 py-16 text-center text-slate-500">
                      No trending products match the current filters.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr key={`${row.rank}-${row.name}`} className="border-b border-slate-100 transition hover:bg-slate-50/70">
                      <td className="px-4 py-4 lg:px-5">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#345CFF] focus:ring-[#345CFF]" />
                      </td>

                      <td className="px-4 py-4 lg:px-5">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold text-white ${row.badgeClassName}`}>
                          {row.rank}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-semibold text-white ${row.thumbClassName}`}>
                            {row.thumbLabel}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-950">{row.name}</p>
                            <p className="truncate text-xs text-slate-500">{row.subtitle}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700">{row.brand}</td>

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-[#EEF1FF] px-3 py-1 text-xs font-semibold text-[#5665FF]">
                          {row.category}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex min-w-[2.2rem] items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                          {row.hookScore}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-950">
                          <span>{row.trendingScore}</span>
                          <FaArrowUp
                            className={`text-[10px] ${row.trendDirection === "down" ? "rotate-180 text-rose-500" : "text-emerald-500"}`}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700">{row.impressions}</td>
                      <td className="px-4 py-4 text-slate-700">{row.ctr}</td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[row.boostStatus]}`}>
                          {row.boostStatus}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${BOOST_TYPE_STYLES[row.boostType]}`}>
                          {row.boostType}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-700">{row.boostUntil}</p>
                        <p
                          className={`mt-1 text-xs ${
                            row.boostStatus === "Expired"
                              ? "text-rose-500"
                              : row.boostStatus === "Scheduled"
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                        >
                          {row.boostMeta}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-right lg:px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            <FaEye className="text-xs" />
                          </button>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            <FaEllipsisH className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-slate-600">
                Showing {visibleRows.length === 0 ? 0 : 1} to {visibleRows.length} of 126 results
              </p>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <SelectField value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value))} className="h-10 min-w-[120px] px-3">
                  {[10, 20, 30].map((option) => (
                    <option key={option} value={option}>
                      {option} per page
                    </option>
                  ))}
                </SelectField>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400"
                  >
                    <FaChevronDown className="rotate-90 text-[10px]" />
                  </button>

                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                        page === 1
                          ? "bg-[#345CFF] text-white shadow-[0_12px_24px_rgba(52,92,255,0.28)]"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <span className="px-2 text-sm text-slate-400">...</span>

                  <button
                    type="button"
                    className="flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    13
                  </button>

                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    <FaChevronDown className="-rotate-90 text-[10px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Top Trending Categories</h2>
              <button type="button" className="text-sm font-medium text-[#345CFF]">
                View All
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {CATEGORY_BREAKDOWN.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-700">{item.value}</span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <FaArrowUp className="text-[10px]" />
                        {item.delta}
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#5A4BFF] to-[#A238FF]"
                      style={{ width: `${item.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-semibold text-slate-950">Trending Health</h2>

            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative h-36 w-36 rounded-full p-[12px]" style={{ background: healthBackground }}>
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
                  <p className="text-3xl font-bold text-slate-950">126</p>
                  <p className="mt-1 text-sm text-slate-500">Total</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 text-sm">
                {HEALTH_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 text-slate-600">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-medium text-slate-700">
                      {item.value} ({item.percent})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-4 text-center transition hover:bg-white"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F2FF] text-[#5A49FF]">
                      <Icon className="text-base" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">{action.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TrendingManager;
