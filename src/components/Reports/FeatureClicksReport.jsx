import React, { useMemo } from "react";
import {
  FaArrowRight,
  FaArrowUp,
  FaBullseye,
  FaCalendarAlt,
  FaChartLine,
  FaChevronDown,
  FaDownload,
  FaEye,
  FaFilter,
  FaHeart,
  FaInfoCircle,
  FaMousePointer,
  FaSearch,
  FaShareAlt,
  FaShoppingCart,
  FaThLarge,
  FaUsers,
  FaWindowRestore,
} from "react-icons/fa";

const PANEL_CLASS = "overflow-hidden rounded-md border border-slate-200 bg-white";
const ACTION_BUTTON_CLASS =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto";
const TEXT_LINK_CLASS =
  "inline-flex items-center gap-2 text-sm font-semibold text-[#4D39FF] transition hover:text-[#3B2AE6]";

const SUMMARY_CARDS = [
  {
    label: "Total Clicks",
    value: "128,742",
    delta: "18.6%",
    icon: FaMousePointer,
    iconClassName: "bg-violet-50 text-violet-600",
  },
  {
    label: "Unique Users",
    value: "45,321",
    delta: "14.2%",
    icon: FaUsers,
    iconClassName: "bg-blue-50 text-[#345CFF]",
  },
  {
    label: "Avg. Clicks per User",
    value: "2.84",
    delta: "8.7%",
    icon: FaChartLine,
    iconClassName: "bg-amber-50 text-amber-500",
  },
  {
    label: "Features Clicked",
    value: "87",
    delta: "7.4%",
    icon: FaThLarge,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Click Through Rate",
    value: "21.63%",
    delta: "9.3%",
    icon: FaBullseye,
    iconClassName: "bg-rose-50 text-rose-500",
  },
  {
    label: "Total Sessions",
    value: "59,423",
    delta: "16.8%",
    icon: FaWindowRestore,
    iconClassName: "bg-indigo-50 text-indigo-600",
  },
];

const LINE_CHART_LABELS = [
  "May 14",
  "May 15",
  "May 16",
  "May 17",
  "May 18",
  "May 19",
  "May 20",
];
const LINE_CHART_VALUES = [19.0, 24.0, 18.1, 20.5, 16.0, 25.4, 22.8];
const Y_AXIS_TICKS = [40, 30, 20, 10, 0];

const PLATFORM_ITEMS = [
  { label: "Web", value: "68,742", percent: "53.4%", color: "#6D35FF" },
  { label: "Android", value: "32,156", percent: "24.9%", color: "#5B83F6" },
  { label: "iOS", value: "21,845", percent: "16.9%", color: "#FF9A2D" },
  { label: "Other", value: "6,999", percent: "5.4%", color: "#F15167" },
];

const FEATURE_ROWS = [
  {
    rank: 1,
    icon: FaHeart,
    feature: "Add to Wishlist",
    category: "Engagement",
    clicks: "25,842",
    users: "18,932",
    ctr: "32.42%",
    change: "12.4%",
  },
  {
    rank: 2,
    icon: FaShoppingCart,
    feature: "Add to Cart",
    category: "Purchase",
    clicks: "22,714",
    users: "16,453",
    ctr: "28.18%",
    change: "8.7%",
  },
  {
    rank: 3,
    icon: FaSearch,
    feature: "Search",
    category: "Discovery",
    clicks: "18,623",
    users: "14,231",
    ctr: "24.63%",
    change: "15.2%",
  },
  {
    rank: 4,
    icon: FaShareAlt,
    feature: "Share",
    category: "Engagement",
    clicks: "12,456",
    users: "9,876",
    ctr: "19.47%",
    change: "11.1%",
  },
  {
    rank: 5,
    icon: FaFilter,
    feature: "Filter",
    category: "Discovery",
    clicks: "9,842",
    users: "7,231",
    ctr: "17.09%",
    change: "6.3%",
  },
];

const CATEGORY_BREAKDOWN = [
  { label: "Engagement", clicks: "38,298", percent: "29.7%", width: 76 },
  { label: "Purchase", clicks: "28,156", percent: "21.9%", width: 56 },
  { label: "Discovery", clicks: "25,123", percent: "19.5%", width: 48 },
  { label: "Product Info", clicks: "18,642", percent: "14.5%", width: 36 },
  { label: "Communication", clicks: "8,523", percent: "6.6%", width: 18 },
  { label: "Other", clicks: "10,000", percent: "7.8%", width: 22 },
];

const chartPoints = (values, width, height, padding, minValue = 0, maxValue = 40) => {
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  return values.map((value, index) => {
    const x =
      padding.left +
      (values.length === 1
        ? usableWidth / 2
        : (usableWidth / (values.length - 1)) * index);
    const normalized = (value - minValue) / (maxValue - minValue || 1);
    const y = height - padding.bottom - normalized * usableHeight;
    return { x, y };
  });
};

const linePath = (points) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

const areaPath = (points, height, padding) => {
  if (!points.length) return "";
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const baseline = height - padding.bottom;
  return `${linePath(points)} L ${lastPoint.x.toFixed(2)} ${baseline.toFixed(2)} L ${firstPoint.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
};

const tickY = (tick, chartHeight, padding) => {
  const usableHeight = chartHeight - padding.top - padding.bottom;
  const normalized = tick / 40;
  return chartHeight - padding.bottom - normalized * usableHeight;
};

const SummaryCard = ({ icon: Icon, iconClassName, label, value, delta }) => (
  <div className={`${PANEL_CLASS} h-full px-4 py-4`}>
    <div className="flex items-start gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${iconClassName}`}>
        <Icon className="text-lg" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-[2rem] font-bold leading-none tracking-tight text-slate-950">
          {value}
        </p>
        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <FaArrowUp className="text-[10px] text-emerald-500" />
          <span className="font-semibold text-emerald-600">{delta}</span>
          <span>vs May 7 - May 13</span>
        </p>
      </div>
    </div>
  </div>
);

const MobileFeatureCard = ({ row }) => {
  const Icon = row.icon;

  return (
    <article className="border-b border-slate-200 px-4 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F3F1FF] text-[#5A35FF]">
            <Icon className="text-sm" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              #{row.rank}
            </p>
            <h3 className="mt-1 truncate text-sm font-semibold text-slate-900">
              {row.feature}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{row.category}</p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <FaEye className="text-xs" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Clicks
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{row.clicks}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Users
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{row.users}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            CTR
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{row.ctr}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Change
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
            <FaArrowUp className="text-[10px]" />
            {row.change}
          </p>
        </div>
      </div>
    </article>
  );
};

const FeatureClicksReport = () => {
  const chartWidth = 780;
  const chartHeight = 280;
  const chartPadding = useMemo(
    () => ({ top: 18, right: 22, bottom: 36, left: 22 }),
    [],
  );

  const points = useMemo(
    () =>
      chartPoints(
        LINE_CHART_VALUES,
        chartWidth,
        chartHeight,
        chartPadding,
        0,
        40,
      ),
    [chartPadding],
  );

  const highlightIndex = 3;

  const donutBackground = useMemo(() => {
    let offset = 0;
    const segments = PLATFORM_ITEMS.map((item) => {
      const start = offset;
      offset += Number(item.percent.replace("%", ""));
      return `${item.color} ${start}% ${offset}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, []);

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-[2rem] font-bold tracking-tight text-slate-950 sm:text-[2.2rem]">
            Feature Clicks Report
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Track user engagement by analyzing clicks on product features.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className={ACTION_BUTTON_CLASS}>
            <FaCalendarAlt className="text-sm text-slate-500" />
            <span>May 14, 2024 - May 20, 2024</span>
            <FaChevronDown className="text-[10px] text-slate-400" />
          </button>

          <button type="button" className={ACTION_BUTTON_CLASS}>
            <FaDownload className="text-sm text-slate-500" />
            <span>Export Report</span>
            <FaChevronDown className="text-[10px] text-slate-400" />
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {SUMMARY_CARDS.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_410px]">
        <div className={PANEL_CLASS}>
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">
                Feature Clicks Over Time
              </h2>
              <FaInfoCircle className="text-sm text-slate-300" />
            </div>

            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 self-start rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Daily
              <FaChevronDown className="text-[10px] text-slate-400" />
            </button>
          </div>

          <div className="px-2 py-3 sm:px-4 sm:py-4">
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
              <div className="min-w-[680px]">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-[280px] w-full"
                >
                  {Y_AXIS_TICKS.map((tick) => {
                    const y = tickY(tick, chartHeight, chartPadding);
                    return (
                      <g key={tick}>
                        <text
                          x="0"
                          y={y + 4}
                          fill="#94A3B8"
                          fontSize="11"
                          fontWeight="600"
                        >
                          {tick === 0 ? "0" : `${tick}K`}
                        </text>
                        <line
                          x1={chartPadding.left}
                          y1={y}
                          x2={chartWidth - chartPadding.right}
                          y2={y}
                          stroke="#E7EBF3"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}

                  <path
                    d={areaPath(points, chartHeight, chartPadding)}
                    fill="url(#feature-clicks-area)"
                    opacity="0.26"
                  />
                  <path
                    d={linePath(points)}
                    fill="none"
                    stroke="#5A35FF"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <line
                    x1={points[highlightIndex].x}
                    y1={chartPadding.top}
                    x2={points[highlightIndex].x}
                    y2={chartHeight - chartPadding.bottom}
                    stroke="#D8DEEA"
                    strokeDasharray="4 5"
                  />

                  {points.map((point, index) => (
                    <circle
                      key={LINE_CHART_LABELS[index]}
                      cx={point.x}
                      cy={point.y}
                      r="4.7"
                      fill="#5A35FF"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                    />
                  ))}

                  <foreignObject
                    x={points[highlightIndex].x - 56}
                    y={points[highlightIndex].y - 70}
                    width="132"
                    height="60"
                  >
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                      <p className="font-medium text-slate-500">May 17, 2024</p>
                      <p className="mt-1 font-semibold text-[#5A35FF]">
                        Clicks: 20,541
                      </p>
                    </div>
                  </foreignObject>

                  {LINE_CHART_LABELS.map((label, index) => (
                    <text
                      key={label}
                      x={points[index].x}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {label}
                    </text>
                  ))}

                  <defs>
                    <linearGradient
                      id="feature-clicks-area"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#6D35FF" />
                      <stop offset="100%" stopColor="#6D35FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className={PANEL_CLASS}>
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-semibold text-slate-950">
              Clicks by Platform
            </h2>
          </div>

          <div className="px-4 py-5">
            <div className="flex flex-col gap-6 md:flex-row md:items-center xl:flex-col xl:items-stretch">
              <div
                className="relative mx-auto h-44 w-44 rounded-full p-[15px]"
                style={{ background: donutBackground }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
                  <p className="text-[1.95rem] font-bold leading-none text-slate-950">
                    128,742
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Total Clicks</p>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                {PLATFORM_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="inline-flex items-center gap-3 text-slate-600">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {item.value}{" "}
                      <span className="text-slate-400">({item.percent})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" className={`${TEXT_LINK_CLASS} mt-6`}>
              View full platform report
              <FaArrowRight className="text-xs" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_430px]">
        <div className={PANEL_CLASS}>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">
                Top Features by Clicks
              </h2>
              <FaInfoCircle className="text-sm text-slate-300" />
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0">
              <table className="min-w-[920px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-4 py-4">#</th>
                    <th className="px-4 py-4">Feature</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Clicks</th>
                    <th className="px-4 py-4">Unique Users</th>
                    <th className="px-4 py-4">CTR</th>
                    <th className="px-4 py-4">Change</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {FEATURE_ROWS.map((row) => {
                    const Icon = row.icon;
                    return (
                      <tr
                        key={row.rank}
                        className="border-b border-slate-100 transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {row.rank}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F3F1FF] text-[#5A35FF]">
                              <Icon className="text-sm" />
                            </div>
                            <span className="font-medium text-slate-800">
                              {row.feature}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{row.category}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {row.clicks}
                        </td>
                        <td className="px-4 py-4 text-slate-700">{row.users}</td>
                        <td className="px-4 py-4 text-slate-700">{row.ctr}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <FaArrowUp className="text-[10px]" />
                            {row.change}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            <FaEye className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden">
            {FEATURE_ROWS.map((row) => (
              <MobileFeatureCard key={row.rank} row={row} />
            ))}
          </div>

          <div className="border-t border-slate-200 px-4 py-4 text-center">
            <button type="button" className={TEXT_LINK_CLASS}>
              View full feature report
              <FaArrowRight className="text-xs" />
            </button>
          </div>
        </div>

        <div className={PANEL_CLASS}>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">
                Top Features by Category
              </h2>
              <FaInfoCircle className="text-sm text-slate-300" />
            </div>
            <button type="button" className="text-sm font-semibold text-[#4D39FF]">
              View All
            </button>
          </div>

          <div className="px-4 py-5">
            <div className="mb-4 hidden grid-cols-[minmax(0,1fr)_86px_86px] gap-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:grid">
              <span>Category</span>
              <span className="text-right">Clicks</span>
              <span className="text-right">% of Total</span>
            </div>

            <div className="space-y-5">
              {CATEGORY_BREAKDOWN.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 grid grid-cols-[minmax(0,1fr)_76px_72px] items-center gap-3 text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-right font-semibold text-slate-700">
                      {item.clicks}
                    </span>
                    <span className="text-right text-slate-500">{item.percent}</span>
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
        </div>
      </section>

      <section className={`${PANEL_CLASS} px-4 py-4 sm:px-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
              <FaInfoCircle className="text-base" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                About Feature Clicks
              </h3>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
                Feature Clicks report helps you understand which features are
                getting the most attention and how users interact with key
                product features.
              </p>
            </div>
          </div>

          <button type="button" className={`${TEXT_LINK_CLASS} self-start lg:self-auto`}>
            Learn more about Feature Clicks
            <FaArrowRight className="text-xs" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default FeatureClicksReport;
