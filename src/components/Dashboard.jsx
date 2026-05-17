import React from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaArrowUp,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaChevronDown,
  FaDollarSign,
  FaEllipsisH,
  FaEye,
  FaFire,
  FaImage,
  FaInfoCircle,
  FaListAlt,
  FaPenNib,
  FaPlus,
  FaShoppingBag,
  FaUpload,
  FaUsers,
} from "react-icons/fa";

const DESKTOP_DATE_RANGE = "May 12 - May 18, 2024";
const MOBILE_DATE_RANGE = "May 14, 2024 - May 20, 2024";

const DESKTOP_SUMMARY_CARDS = [
  {
    title: "Total Published Products",
    value: "4,812",
    delta: "12.5%",
    icon: FaShoppingBag,
    iconWrapClass: "bg-blue-50 text-blue-600",
  },
  {
    title: "Upcoming Launches",
    value: "157",
    delta: "8.7%",
    icon: FaCalendarAlt,
    iconWrapClass: "bg-violet-50 text-violet-600",
  },
  {
    title: "Trending Products",
    value: "326",
    delta: "15.3%",
    icon: FaFire,
    iconWrapClass: "bg-orange-50 text-orange-500",
  },
  {
    title: "Compare Page Views",
    value: "2.45M",
    delta: "18.6%",
    icon: FaEye,
    iconWrapClass: "bg-blue-50 text-blue-600",
  },
  {
    title: "Avg. Hook Score",
    value: "78.6",
    delta: "6.4%",
    icon: FaChartLine,
    iconWrapClass: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "SEO Health Score",
    value: "88%",
    delta: "9.2%",
    icon: FaCheckCircle,
    iconWrapClass: "bg-emerald-50 text-emerald-600",
  },
];

const PERFORMANCE_METRICS = [
  { label: "Total Page Views", value: "8.62M", delta: "12.3%" },
  { label: "Unique Visitors", value: "3.25M", delta: "18.7%" },
  { label: "Search Impressions", value: "6.31M", delta: "16.2%" },
  { label: "Affiliate Revenue", value: "$48,650", delta: "14.8%" },
];

const PERFORMANCE_LABELS = ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"];
const PAGE_VIEW_SERIES = [980, 1000, 1420, 1040, 1330, 1190, 1840];
const VISITOR_SERIES = [560, 690, 840, 600, 860, 790, 1270];

const TOP_SEARCH_DEVICES = [
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    subtitle: "135K searches",
    pct: 12.4,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    subtitle: "109K searches",
    pct: 9.8,
    color: "from-orange-400 to-rose-500",
  },
  {
    id: "oneplus-12",
    name: "OnePlus 12",
    subtitle: "87K searches",
    pct: 7.6,
    color: "from-red-400 to-pink-500",
  },
  {
    id: "pixel-8",
    name: "Google Pixel 8",
    subtitle: "63K searches",
    pct: 5.4,
    color: "from-indigo-400 to-violet-500",
  },
  {
    id: "nothing-2",
    name: "Nothing Phone (2)",
    subtitle: "48K searches",
    pct: 4.1,
    color: "from-slate-400 to-slate-500",
  },
];

const DESKTOP_QUICK_ACTIONS = [
  { label: "Add New Product", icon: FaPlus, path: "/products/smartphones/create" },
  { label: "Add Blog / Article", icon: FaPenNib, path: "/content/news-articles" },
  { label: "Create Compare Page", icon: FaChartLine, path: "/settings/compare-pages" },
  { label: "Upload Banner", icon: FaImage, path: "/marketing/banners" },
  { label: "Import Products", icon: FaUpload, path: "/products/smartphones/inventory" },
  { label: "View All Drafts", icon: FaListAlt, path: "/reports/productpublishstatus" },
];

const RECENT_ACTIVITY = [
  { id: "a1", title: "iPhone 15 Pro Max published", subtitle: "by Mike Johnson", time: "2m ago", accent: "bg-violet-500" },
  { id: "a2", title: "Samsung Galaxy S24 FE added", subtitle: "by Sarah Wilson", time: "15m ago", accent: "bg-blue-500" },
  { id: "a3", title: "OnePlus 12 review published", subtitle: "by David Lee", time: "45m ago", accent: "bg-indigo-500" },
  { id: "a4", title: "New compare page created", subtitle: "iPhone 15 vs Galaxy S24", time: "1h ago", accent: "bg-pink-500" },
  { id: "a5", title: "SEO update for Pixel 8a", subtitle: "by Lisa Brown", time: "2h ago", accent: "bg-orange-500" },
];

const TRENDING_WEEK = [
  { id: "t1", name: "iPhone 15 Pro Max", score: 92, color: "from-amber-400 to-orange-500" },
  { id: "t2", name: "Samsung Galaxy S24 Ultra", score: 90, color: "from-orange-400 to-rose-500" },
  { id: "t3", name: "OnePlus 12", score: 88, color: "from-red-400 to-pink-500" },
  { id: "t4", name: "Nothing Phone (2a)", score: 83, color: "from-indigo-400 to-violet-500" },
  { id: "t5", name: "POCO X6 Pro 5G", score: 81, color: "from-sky-500 to-blue-500" },
];

const FEATURE_CLICKS = [
  { label: "Camera", value: 28.6 },
  { label: "Performance", value: 23.4 },
  { label: "Battery", value: 18.7 },
  { label: "Display", value: 12.9 },
  { label: "Price", value: 9.1 },
  { label: "Design", value: 7.3 },
];

const UPCOMING_LAUNCHES = [
  { name: "Nothing Phone (3)", date: "Jul 01, 2024", left: "23 days left", accent: "from-slate-900 to-slate-700" },
  { name: "Samsung Galaxy Z Fold 6", date: "Jul 10, 2024", left: "32 days left", accent: "from-slate-300 to-slate-500" },
  { name: "Pixel 9 Pro", date: "Aug 01, 2024", left: "54 days left", accent: "from-zinc-900 to-zinc-700" },
  { name: "iPhone 16 Series", date: "Sep 10, 2024", left: "94 days left", accent: "from-blue-900 to-indigo-700" },
  { name: "OnePlus 13", date: "Oct 15, 2024", left: "129 days left", accent: "from-sky-700 to-blue-500" },
];

const MOBILE_OVERVIEW_CARDS = [
  {
    label: "Total Sales",
    value: "$128,742",
    delta: "18.6%",
    compareLabel: "vs May 7 - May 13",
    icon: FaDollarSign,
    iconWrapClass: "bg-violet-50 text-violet-600",
  },
  {
    label: "Orders",
    value: "2,543",
    delta: "14.2%",
    compareLabel: "vs May 7 - May 13",
    icon: FaShoppingBag,
    iconWrapClass: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Customers",
    value: "1,789",
    delta: "8.7%",
    compareLabel: "vs May 7 - May 13",
    icon: FaUsers,
    iconWrapClass: "bg-indigo-50 text-indigo-600",
  },
  {
    label: "Conversion Rate",
    value: "3.24%",
    delta: "7.4%",
    compareLabel: "vs May 7 - May 13",
    icon: FaChartLine,
    iconWrapClass: "bg-amber-50 text-amber-500",
  },
];

const MOBILE_CHART_LABELS = ["May 14", "May 15", "May 16", "May 17", "May 18", "May 19", "May 20"];
const MOBILE_CHART_SERIES = [42000, 56000, 43000, 57000, 48000, 61000, 52000];

const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const buildLinePath = (values, width, height, padding) => {
  if (!Array.isArray(values) || values.length === 0) return "";

  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x =
        padding +
        (values.length === 1 ? usableWidth / 2 : (usableWidth / (values.length - 1)) * index);
      const normalized = (value - minValue) / (maxValue - minValue || 1);
      const y = height - padding - normalized * usableHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const deltaLabel = (value) => `${"\u2191"} ${value}`;

const SectionCard = ({ className = "", children }) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-5 ${className}`}
  >
    {children}
  </div>
);

const SummaryCard = ({ icon: Icon, iconWrapClass, title, value, delta }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
    <div className="flex items-start gap-3">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconWrapClass}`}>
        <Icon className="text-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-[1.7rem] font-bold tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-slate-500">
          <span className="font-semibold text-emerald-600">{deltaLabel(delta)}</span> vs last 7 days
        </p>
      </div>
    </div>
  </div>
);

const MobileStatCard = ({ icon: Icon, iconWrapClass, label, value, delta, compareLabel }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
    <div className="flex items-start gap-3">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconWrapClass}`}>
        <Icon className="text-base" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-[1.75rem] font-bold leading-none tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-[11px] text-slate-500">
          <span className="font-semibold text-emerald-600">{deltaLabel(delta)}</span> {compareLabel}
        </p>
      </div>
    </div>
  </div>
);

const DesktopPerformanceChart = () => {
  const width = 760;
  const height = 250;
  const padding = 24;
  const pagePath = buildLinePath(PAGE_VIEW_SERIES, width, height, padding);
  const visitorPath = buildLinePath(VISITOR_SERIES, width, height, padding);
  const yLabels = ["0", "500K", "1M", "1.5M", "2M"];

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#345CFF]" />
          Page Views
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#9A46FF]" />
          Unique Visitors
        </span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
        >
          This Week <FaChevronDown className="text-[10px]" />
        </button>
      </div>

      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
        <div className="min-w-[620px]">
          <svg viewBox={`0 0 ${width} ${height + 34}`} className="h-[250px] w-full">
            {[0, 1, 2, 3, 4].map((row) => {
              const y = padding + ((height - padding * 2) / 4) * row;
              return (
                <g key={row}>
                  <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#E7EAF4" strokeWidth="1" />
                  <text x="0" y={y + 4} fontSize="11" fill="#94A3B8">
                    {yLabels[4 - row]}
                  </text>
                </g>
              );
            })}

            <path d={pagePath} fill="none" stroke="#345CFF" strokeWidth="3" strokeLinecap="round" />
            <path d={visitorPath} fill="none" stroke="#9A46FF" strokeWidth="3" strokeLinecap="round" />

            {PAGE_VIEW_SERIES.map((value, index) => {
              const usableWidth = width - padding * 2;
              const usableHeight = height - padding * 2;
              const maxPage = Math.max(...PAGE_VIEW_SERIES, 1);
              const maxVisitors = Math.max(...VISITOR_SERIES, 1);
              const x = padding + (usableWidth / (PAGE_VIEW_SERIES.length - 1)) * index;
              const pageY = height - padding - (value / maxPage) * usableHeight;
              const visitorY = height - padding - (VISITOR_SERIES[index] / maxVisitors) * usableHeight;

              return (
                <g key={PERFORMANCE_LABELS[index]}>
                  <circle cx={x} cy={pageY} r="4" fill="#345CFF" />
                  <circle cx={x} cy={visitorY} r="4" fill="#9A46FF" />
                  <text x={x} y={height + 20} textAnchor="middle" fontSize="11" fill="#64748B">
                    {PERFORMANCE_LABELS[index]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

const MobileSalesChart = () => {
  const width = 320;
  const height = 170;
  const padding = 18;
  const linePath = buildLinePath(MOBILE_CHART_SERIES, width, height, padding);
  const maxValue = Math.max(...MOBILE_CHART_SERIES, 1);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return (
    <SectionCard className="px-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-950">Sales Overview</h2>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
        >
          Daily <FaChevronDown className="text-[10px]" />
        </button>
      </div>

      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height + 28}`} className="h-[178px] w-full">
          {[0, 1, 2, 3].map((row) => {
            const y = padding + ((height - padding * 2) / 3) * row;
            return <line key={row} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#E7EAF4" strokeWidth="1" />;
          })}

          <path d={linePath} fill="none" stroke="#5A49FF" strokeWidth="3" strokeLinecap="round" />

          {MOBILE_CHART_SERIES.map((value, index) => {
            const x = padding + (usableWidth / (MOBILE_CHART_SERIES.length - 1)) * index;
            const y = height - padding - (value / maxValue) * usableHeight;

            return (
              <g key={MOBILE_CHART_LABELS[index]}>
                <circle cx={x} cy={y} r="3.5" fill="#5A49FF" />
                <text x={x} y={height + 18} textAnchor="middle" fontSize="10" fill="#94A3B8">
                  {MOBILE_CHART_LABELS[index]}
                </text>
              </g>
            );
          })}

          <line x1="157" x2="157" y1="30" y2="142" stroke="#D7DDF0" strokeDasharray="4 4" />
          <rect x="119" y="18" width="88" height="44" rx="10" fill="#FFFFFF" stroke="#E7EAF4" strokeWidth="1" />
          <text x="130" y="35" fontSize="10" fill="#64748B">
            May 17, 2024
          </text>
          <text x="130" y="51" fontSize="11" fontWeight="700" fill="#5A49FF">
            Sales: $74,625
          </text>
        </svg>
      </div>
    </SectionCard>
  );
};

const MobileDashboard = ({ firstName }) => (
  <div className="space-y-4">
    <section>
      <h1 className="text-[2rem] font-bold tracking-tight text-slate-950">Dashboard</h1>
      <p className="mt-1 max-w-[16rem] text-sm leading-6 text-slate-500">
        Welcome back, {firstName}! Here&apos;s what&apos;s happening today.
      </p>
    </section>

    <section className="space-y-3">
      <button
        type="button"
        className="inline-flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_25px_rgba(15,23,42,0.04)]"
      >
        <span className="inline-flex items-center gap-2">
          <FaCalendarAlt className="text-slate-400" />
          {MOBILE_DATE_RANGE}
        </span>
        <FaChevronDown className="text-[11px] text-slate-400" />
      </button>

      <div className="space-y-3">
        {MOBILE_OVERVIEW_CARDS.map((card) => (
          <MobileStatCard key={card.label} {...card} />
        ))}
      </div>
    </section>

    <MobileSalesChart />
  </div>
);

const DesktopDashboard = ({ firstName, onQuickAction }) => {
  const publishHealth = 92;
  const publishRingStyle = {
    background: `conic-gradient(#ffffff 0deg ${publishHealth * 3.6}deg, rgba(255,255,255,0.28) ${publishHealth * 3.6}deg 360deg)`,
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[1.9rem] font-bold tracking-tight text-slate-950 sm:text-[2.2rem]">
            Welcome back, {firstName}! <span className="inline-block">{`\u{1F44B}`}</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Here&apos;s what&apos;s happening on your platform today.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
          >
            <FaCalendarAlt className="text-slate-500" />
            {DESKTOP_DATE_RANGE}
            <FaChevronDown className="text-[11px] text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => onQuickAction("/products/smartphones/create")}
            className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#345CFF] to-[#7A2CFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(92,76,255,0.25)]"
          >
            <FaPlus />
            Quick Action
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {DESKTOP_SUMMARY_CARDS.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.75fr_1.05fr_1.15fr]">
        <SectionCard>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">Performance Overview</h2>
            <FaInfoCircle className="text-sm text-slate-300" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PERFORMANCE_METRICS.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-[11px] font-medium text-slate-500">{metric.label}</p>
                <p className="mt-1 text-[1.15rem] font-bold text-slate-950">{metric.value}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-600">{deltaLabel(metric.delta)}</p>
              </div>
            ))}
          </div>

          <DesktopPerformanceChart />
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Top Search Devices</h2>
            <button type="button" className="text-sm font-medium text-[#345CFF]">
              View All
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {TOP_SEARCH_DEVICES.map((device, index) => (
              <div key={device.id} className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r text-xs font-semibold text-white ${device.color}`}
                >
                  {index + 1}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                  {getInitials(device.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{device.name}</p>
                  <p className="text-xs text-slate-500">{device.subtitle}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#345CFF] to-[#8A35FF]"
                      style={{ width: `${Math.min(device.pct * 7.2, 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-500">{device.pct}%</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-[#345CFF] via-[#6243FF] to-[#9431FF] p-5 text-white shadow-[0_18px_45px_rgba(97,75,255,0.26)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Today&apos;s Publish Health</h2>
                <p className="mt-1 text-sm text-white/75">Last synced recently</p>
              </div>
              <button type="button" className="text-white/70">
                <FaEllipsisH />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative mx-auto h-40 w-40 flex-shrink-0 rounded-full p-[14px]" style={publishRingStyle}>
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#456BFF] to-[#7B38FF] text-center">
                  <p className="text-4xl font-bold">92%</p>
                  <p className="mt-1 text-sm text-white/80">Overall Health</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-6">
                  <span className="inline-flex items-center gap-2 text-white/85">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                    Published
                  </span>
                  <span className="font-semibold">4,415 (92%)</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="inline-flex items-center gap-2 text-white/85">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    Draft
                  </span>
                  <span className="font-semibold">312 (6%)</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="inline-flex items-center gap-2 text-white/85">
                    <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-300" />
                    Scheduled
                  </span>
                  <span className="font-semibold">85 (2%)</span>
                </div>
              </div>
            </div>
          </div>

          <SectionCard>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
              <FaArrowRight className="text-sm text-slate-300" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {DESKTOP_QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => onQuickAction(action.path)}
                    className="group rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center transition hover:border-[#8A35FF]/25 hover:bg-white"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EFF3FF] to-[#F4ECFF] text-[#5A49FF]">
                      <Icon className="text-sm" />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-700">{action.label}</p>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Affiliate Insights</h2>
              <button type="button" className="text-sm font-medium text-[#345CFF]">
                View Report
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Clicks", value: "1.26M", delta: "15.6%" },
                { label: "Conversions", value: "18,650", delta: "11.3%" },
                { label: "Revenue", value: "$48,650", delta: "14.8%" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-[11px] text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{metric.value}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-600">{deltaLabel(metric.delta)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F3E6] text-xl font-bold text-slate-900">
                    a
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Top Performing Store</p>
                    <p className="text-sm font-semibold text-slate-950">Amazon</p>
                  </div>
                </div>
                <p className="text-right text-xl font-bold text-slate-950">
                  $22,450 <span className="text-sm font-medium text-slate-500">(46.1%)</span>
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1.2fr_1fr]">
        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
            <button type="button" className="text-sm font-medium text-[#345CFF]">
              View All
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3">
                <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-white ${item.accent}`}>
                  <FaCheckCircle className="text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>
                </div>
                <p className="text-xs text-slate-400">{item.time}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Top Trending This Week</h2>
            <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              Score <FaChevronDown className="text-[10px]" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {TRENDING_WEEK.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r text-[11px] font-semibold text-white ${item.color}`}
                >
                  {index + 1}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-700">
                  {getInitials(item.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">Smartphone</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-950">{item.score}</p>
                  <p className="text-xs font-semibold text-emerald-600">
                    <FaArrowUp className="inline-block" />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Most Clicked Features</h2>
            <button type="button" className="text-sm font-medium text-[#345CFF]">
              View All
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {FEATURE_CLICKS.map((feature) => (
              <div key={feature.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{feature.label}</span>
                  <span className="text-slate-500">{feature.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#5A4BFF] to-[#A238FF]"
                    style={{ width: `${feature.value * 2.7}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Upcoming Launches</h2>
          <button type="button" className="text-sm font-medium text-[#345CFF]">
            View All
          </button>
        </div>

        <div className="mt-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
          <div className="flex min-w-max gap-4">
            {UPCOMING_LAUNCHES.map((launch) => (
              <div
                key={launch.name}
                className="flex min-w-[250px] items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white ${launch.accent}`}
                >
                  {getInitials(launch.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{launch.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{launch.date}</p>
                  <span className="mt-2 inline-flex rounded-full bg-[#EFE9FF] px-3 py-1 text-[11px] font-semibold text-[#6A45FF]">
                    {launch.left}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

const Dashboard = ({ isMobile = false }) => {
  const navigate = useNavigate();
  const userName = Cookies.get("userName") || Cookies.get("username") || "John Doe";
  const firstName = String(userName).split(" ")[0] || "John";

  if (isMobile) {
    return <MobileDashboard firstName={firstName} />;
  }

  return <DesktopDashboard firstName={firstName} onQuickAction={(path) => navigate(path)} />;
};

export default Dashboard;
