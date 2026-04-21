// components/Dashboard.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import CountUp from "react-countup";
import Cookies from "js-cookie";
import { hasBlogAccess } from "../utils/access";
import {
  FaHome,
  FaMobileAlt,
  FaGlobe,
  FaLaptop,
  FaFolderOpen,
  FaPlus,
  FaListAlt,
  FaEdit,
  FaChartLine,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaShoppingBag,
  FaUsers,
  FaCog,
  FaBell,
  FaSearch,
  FaDownload,
  FaCalendarAlt,
  FaFilter,
  FaChevronRight,
  FaChevronUp,
  FaTrophy,
  FaStar,
  FaCheckCircle,
  FaClock,
  FaUserCircle,
  FaQuestionCircle,
  FaBolt, // Added FaBolt
  FaExclamationCircle, // Already imported but confirming
  FaMinus,
  FaNewspaper,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { buildUrl } from "../api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    mobiles: 0,
    mobiles_published: 0,
    laptops: 0,
    laptops_published: 0,
    appliances: 0,
    appliances_published: 0,
    networking: 0,
    networking_published: 0,
    categories: 0,
    brands: 0,
  });
  const [recentItems, setRecentItems] = useState([]);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState("today");

  const [trendingType, setTrendingType] = useState("smartphone");
  const [trendingSnapshot, setTrendingSnapshot] = useState({
    updated_at: null,
    results: [],
  });
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState(null);
  const currentRole = String(Cookies.get("role") || "").trim().toLowerCase();

  // Enhanced stats with more data
  const stats = useMemo(
    () => [
      {
        title: "Smartphones",
        value: counts.mobiles.toLocaleString(),
        valueNum: counts.mobiles,
        subtitle: `${counts.mobiles_published} published`,
        subtitleNum: counts.mobiles_published,
        icon: FaMobileAlt,
        color: "blue",
        path: "/view-mobiles",
        trend: "+12%",
        trendDirection: "up",
        percentage:
          counts.mobiles > 0
            ? Math.round((counts.mobiles_published / counts.mobiles) * 100)
            : 0,
      },
      {
        title: "Laptops",
        value: counts.laptops.toLocaleString(),
        valueNum: counts.laptops,
        subtitle: `${counts.laptops_published} published`,
        subtitleNum: counts.laptops_published,
        icon: FaLaptop,
        color: "purple",
        path: "/laptop",
        trend: "+8%",
        trendDirection: "up",
        percentage:
          counts.laptops > 0
            ? Math.round((counts.laptops_published / counts.laptops) * 100)
            : 0,
      },
      {
        title: "Appliances",
        value: counts.appliances.toLocaleString(),
        valueNum: counts.appliances,
        subtitle: `${counts.appliances_published} published`,
        subtitleNum: counts.appliances_published,
        icon: FaGlobe,
        color: "emerald",
        path: "/home-appliance",
        trend: "+15%",
        trendDirection: "up",
        percentage:
          counts.appliances > 0
            ? Math.round(
                (counts.appliances_published / counts.appliances) * 100,
              )
            : 0,
      },
      {
        title: "Networking",
        value: counts.networking.toLocaleString(),
        valueNum: counts.networking,
        subtitle: `${counts.networking_published} published`,
        subtitleNum: counts.networking_published,
        icon: FaGlobe,
        color: "orange",
        path: "/network",
        trend: "+5%",
        trendDirection: "up",
        percentage:
          counts.networking > 0
            ? Math.round(
                (counts.networking_published / counts.networking) * 100,
              )
            : 0,
      },
      {
        title: "Categories",
        value: counts.categories.toLocaleString(),
        valueNum: counts.categories,
        icon: FaFolderOpen,
        color: "indigo",
        path: "/category",
        trend: "+3",
        trendDirection: "neutral",
      },
      {
        title: "Brands",
        value: counts.brands.toLocaleString(),
        valueNum: counts.brands,
        icon: FaShoppingBag,
        color: "pink",
        path: "/brands",
        trend: "+2",
        trendDirection: "neutral",
      },
    ],
    [counts],
  );

  // Enhanced quick actions
  const quickActions = useMemo(
    () => [
      {
        icon: FaPlus,
        label: "Add Mobile",
        color: "blue",
        path: "/products/smartphones/create",
        description: "Create a new smartphone",
      },
      {
        icon: FaListAlt,
        label: "View All",
        color: "emerald",
        path: "/products",
        description: "Browse all product inventory",
      },
      {
        icon: FaMobileAlt,
        label: "View Inventory",
        color: "emerald",
        path: "/products/smartphones/inventory",
        description: "Browse smartphones",
      },
      {
        icon: FaEdit,
        label: "Manage Categories",
        color: "purple",
        path: "/specifications/categories/create",
        description: "Organize categories",
      },
      {
        icon: FaUsers,
        label: "Users",
        color: "orange",
        path: "/user-management",
        description: "Manage users",
      },
      {
        icon: FaChartLine,
        label: "Reports",
        color: "indigo",
        path: "/reports/productpublishstatus",
        description: "View reports",
      },
      ...(hasBlogAccess(currentRole)
        ? [
            {
              icon: FaNewspaper,
              label: "News Desk",
              color: "gray",
              path: "/content/news-articles",
              description: "Manage articles",
            },
          ]
        : []),
    ],
    [currentRole],
  );

  // Time filters for activity
  const timeFilters = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "all", label: "All Time" },
  ];

  const trendingTypeOptions = useMemo(
    () => [
      { value: "smartphone", label: "Smartphones" },
      { value: "laptop", label: "Laptops" },
      { value: "tv", label: "TVs" },
      { value: "networking", label: "Networking" },
      { value: "accessories", label: "Accessories" },
    ],
    [],
  );

  const fetchTrendingSnapshot = useCallback(async () => {
    setTrendingLoading(true);
    setTrendingError(null);

    try {
      const token = Cookies.get("authToken");
      const headers = token
        ? {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        : { "Content-Type": "application/json" };

      const qs = new URLSearchParams();
      qs.set("type", trendingType);
      qs.set("limit", "5");

      const res = await fetch(buildUrl(`/api/admin/trending?${qs}`), {
        method: "GET",
        headers,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setTrendingSnapshot({
        updated_at: data.updated_at || null,
        results: Array.isArray(data.results) ? data.results : [],
      });
    } catch (err) {
      console.error("Dashboard trending fetch error:", err);
      setTrendingError(err.message || "Failed to load trending snapshot");
    } finally {
      setTrendingLoading(false);
    }
  }, [trendingType]);

  // Get color classes with softer panel fills
  const getColorClasses = useCallback((color) => {
    const colors = {
      blue: {
        bg: "bg-blue-50 border border-blue-100",
        lightBg: "bg-blue-100 border border-blue-200",
        text: "text-blue-700",
        border: "border-blue-200",
        hover: "hover:bg-blue-50",
        gradient: "from-blue-500 to-blue-600",
      },
      emerald: {
        bg: "bg-emerald-50 border border-emerald-100",
        lightBg: "bg-emerald-100 border border-emerald-200",
        text: "text-emerald-700",
        border: "border-emerald-200",
        hover: "hover:bg-emerald-50",
        gradient: "from-emerald-500 to-emerald-600",
      },
      purple: {
        bg: "bg-purple-50 border border-purple-100",
        lightBg: "bg-purple-100 border border-purple-200",
        text: "text-purple-700",
        border: "border-purple-200",
        hover: "hover:bg-purple-50",
        gradient: "from-purple-500 to-purple-600",
      },
      orange: {
        bg: "bg-orange-50 border border-orange-100",
        lightBg: "bg-orange-100 border border-orange-200",
        text: "text-orange-700",
        border: "border-orange-200",
        hover: "hover:bg-orange-50",
        gradient: "from-orange-500 to-orange-600",
      },
      indigo: {
        bg: "bg-indigo-50 border border-indigo-100",
        lightBg: "bg-indigo-100 border border-indigo-200",
        text: "text-indigo-700",
        border: "border-indigo-200",
        hover: "hover:bg-indigo-50",
        gradient: "from-indigo-500 to-indigo-600",
      },
      pink: {
        bg: "bg-pink-50 border border-pink-100",
        lightBg: "bg-pink-100 border border-pink-200",
        text: "text-pink-700",
        border: "border-pink-200",
        hover: "hover:bg-pink-50",
        gradient: "from-pink-500 to-pink-600",
      },
      gray: {
        bg: "bg-slate-50 border border-slate-200",
        lightBg: "bg-slate-100 border border-slate-200",
        text: "text-slate-700",
        border: "border-slate-200",
        hover: "hover:bg-slate-50",
        gradient: "from-slate-500 to-slate-600",
      },
    };
    return colors[color] || colors.blue;
  }, []);

  // Get activity icon and color
  const getActivityConfig = useCallback((type, action) => {
    const configs = {
      mobile: { icon: FaMobileAlt, color: "text-blue-500" },
      laptop: { icon: FaLaptop, color: "text-purple-500" },
      appliance: { icon: FaGlobe, color: "text-emerald-500" },
      networking: { icon: FaGlobe, color: "text-orange-500" },
      default: { icon: FaFolderOpen, color: "text-gray-500" },
    };

    const config = configs[type] || configs.default;
    const bgColor =
      action === "created"
        ? "bg-blue-50 border border-blue-100"
        : "bg-slate-50 border border-slate-200";
    const textColor = action === "created" ? "text-blue-700" : "text-slate-700";

    return { ...config, bgColor, textColor };
  }, []);

  // Handle navigation
  const handleActionClick = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate],
  );

  const handleStatClick = useCallback(
    (path) => {
      if (path) navigate(path);
    },
    [navigate],
  );

  // Fetch data
  useEffect(() => {
    let mounted = true;
    const token = Cookies.get("authToken");

    const headers = token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [
          catsRes,
          brandsRes,
          mobilesRes,
          laptopsRes,
          appliancesRes,
          networkingRes,
        ] = await Promise.all([
          fetch(buildUrl("/api/categories"), { headers }),
          fetch(buildUrl("/api/brands"), { headers }),
          fetch(buildUrl("/api/smartphone"), { headers }),
          fetch(buildUrl("/api/laptop"), { headers }),
          fetch(buildUrl("/api/tv"), { headers }),
          fetch(buildUrl("/api/networking"), { headers }),
        ]);

        const [
          catsData,
          brandsData,
          mobilesData,
          laptopsData,
          appliancesData,
          networkingData,
        ] = await Promise.all([
          catsRes.ok ? catsRes.json() : { data: [] },
          brandsRes.ok ? brandsRes.json() : { brands: [] },
          mobilesRes.ok ? mobilesRes.json() : { smartphones: [] },
          laptopsRes.ok ? laptopsRes.json() : { laptops: [] },
          appliancesRes.ok ? appliancesRes.json() : { tvs: [] },
          networkingRes.ok ? networkingRes.json() : { networking: [] },
        ]);

        if (!mounted) return;

        const mobiles = mobilesData.smartphones || [];
        const laptops = laptopsData.laptops || [];
        const appliances = appliancesData.tvs || [];
        const networking = networkingData.networking || [];

        setCounts({
          mobiles: mobiles.length,
          mobiles_published: mobiles.filter((m) => m.is_published).length || 0,
          laptops: laptops.length,
          laptops_published: laptops.filter((l) => l.is_published).length || 0,
          appliances: appliances.length,
          appliances_published:
            appliances.filter((a) => a.is_published).length || 0,
          networking: networking.length,
          networking_published:
            networking.filter((n) => n.is_published).length || 0,
          categories: (catsData.data || []).length,
          brands: (brandsData.brands || []).length,
        });

        // Build recent items
        const combined = [];
        mobiles.forEach((m) =>
          combined.push({
            type: "mobile",
            name: m.name,
            created_at: m.created_at,
            updated_at: m.updated_at,
            action: "created",
            typeLabel: "Smartphone",
            status: m.is_published ? "Published" : "Draft",
          }),
        );
        laptops.forEach((l) =>
          combined.push({
            type: "laptop",
            name: l.name,
            created_at: l.created_at,
            updated_at: l.updated_at,
            action: "created",
            typeLabel: "Laptop",
            status: l.is_published ? "Published" : "Draft",
          }),
        );
        appliances.forEach((a) =>
          combined.push({
            type: "appliance",
            name: a.name,
            created_at: a.created_at,
            updated_at: a.updated_at,
            action: "created",
            typeLabel: "Appliance",
            status: a.is_published ? "Published" : "Draft",
          }),
        );

        combined.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
        setRecentItems(combined.slice(0, 8));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchTrendingSnapshot();
  }, [fetchTrendingSnapshot]);

  // Format date to relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(d);
  };

  return (
    <div className="dashboard-root space-y-6 rounded-lg bg-white p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6 rounded-lg bg-white p-4 sm:mb-8 sm:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:gap-6 lg:flex-row lg:items-center sm:mb-8">
          <div>
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 sm:mb-2">
              <div className="flex w-fit items-center justify-center rounded-2xl border border-slate-200 bg-sky-50 p-2">
                <FaHome className="text-xl text-sky-600 sm:text-2xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-600 sm:text-base">
                  Welcome back! Here's your inventory overview
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center sm:mt-4">
              <div
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 sm:text-sm"
                role="button"
                tabIndex={0}
              >
                <FaUserCircle className="text-slate-400" />
                <span>Admin Dashboard</span>
              </div>
            </div>
          </div>

          {/* header actions placeholder */}
          <div className="flex items-center gap-3" />
        </div>

        {/* Stats Summary Bar */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 sm:text-sm">
                  Total Products
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">
                  <CountUp
                    end={
                      counts.mobiles +
                      counts.laptops +
                      counts.appliances +
                      counts.networking
                    }
                    duration={1.5}
                  />
                </p>
              </div>
              <FaShoppingBag className="flex-shrink-0 text-lg text-blue-500 sm:text-xl" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 sm:text-sm">Published</p>
                <p className="mt-1 text-lg font-bold text-emerald-600 sm:text-xl md:text-2xl">
                  <CountUp
                    end={
                      counts.mobiles_published +
                      counts.laptops_published +
                      counts.appliances_published +
                      counts.networking_published
                    }
                    duration={1.5}
                  />
                </p>
              </div>
              <FaCheckCircle className="flex-shrink-0 text-lg text-emerald-500 sm:text-xl" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 sm:text-sm">Publish Rate</p>
                <p className="mt-1 text-lg font-bold text-purple-600 sm:text-xl md:text-2xl">
                  <CountUp
                    end={
                      counts.mobiles +
                        counts.laptops +
                        counts.appliances +
                        counts.networking >
                      0
                        ? Math.round(
                            ((counts.mobiles_published +
                              counts.laptops_published +
                              counts.appliances_published +
                              counts.networking_published) /
                              (counts.mobiles +
                                counts.laptops +
                                counts.appliances +
                                counts.networking)) *
                              100,
                          )
                        : 0
                    }
                    duration={1.5}
                    suffix="%"
                  />
                </p>
              </div>
              <FaChartLine className="flex-shrink-0 text-lg text-purple-500 sm:text-xl" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 sm:text-sm">Categories</p>
                <p className="mt-1 text-lg font-bold text-orange-600 sm:text-xl md:text-2xl">
                  <CountUp end={counts.categories} duration={1.5} />
                </p>
              </div>
              <FaFolderOpen className="flex-shrink-0 text-lg text-orange-500 sm:text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Detailed Stats */}
        <div className="lg:col-span-2">
          {/* Stats Grid */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Product Overview
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
                <span className="text-gray-600">Sorted by:</span>
                <select className="text-xs sm:text-sm border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 bg-white">
                  <option>Most Products</option>
                  <option>Highest Publish Rate</option>
                  <option>Recently Added</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                const colors = getColorClasses(stat.color);
                return (
                  <div
                    key={index}
                    onClick={() => handleStatClick(stat.path)}
                    className={`
                      rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 
                      cursor-pointer group transition-colors
                      hover:border-slate-300 hover:bg-slate-50/60
                    `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <IconComponent
                          className={`text-lg sm:text-xl ${colors.text}`}
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        {stat.trendDirection === "up" && (
                          <FaArrowUp className="text-emerald-500 text-xs sm:text-sm" />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            stat.trendDirection === "up"
                              ? "text-emerald-600"
                              : "text-gray-600"
                          }`}
                        >
                          {stat.trend}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {typeof stat.valueNum === "number" ? (
                          <CountUp end={stat.valueNum} duration={1.2} />
                        ) : (
                          stat.value
                        )}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        {stat.title}
                      </p>
                    </div>

                    {stat.percentage !== undefined && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span className="text-gray-600">Publish Rate</span>
                          <span className="font-semibold">
                            {stat.percentage}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-xs text-slate-600 sm:text-sm">
                        {stat.subtitle}
                      </span>
                      {stat.path && (
                        <FaChevronRight
                          className={`${colors.text} opacity-0 group-hover:opacity-100 transition-opacity text-xs sm:text-sm`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity with Filters */}
          <div className="rounded-lg bg-white p-4 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:gap-4 sm:mb-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="mb-1 text-lg font-bold text-slate-900 sm:text-xl">
                  Recent Activity
                </h2>
                <p className="text-xs text-slate-600 sm:text-sm">
                  Latest updates across your inventory
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <div className="flex whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 p-1">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setTimeFilter(filter.id)}
                      className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
                        timeFilter === filter.id
                          ? "border border-slate-200 bg-white text-slate-900"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {recentItems.map((item, index) => {
                const config = getActivityConfig(item.type, item.action);
                const IconComponent = config.icon;
                const time = item.updated_at || item.created_at;

                return (
                  <div
                    key={index}
                    className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:gap-4 sm:p-3"
                  >
                    <div
                      className={`flex-shrink-0 rounded-lg p-2 ${config.bgColor}`}
                    >
                      <IconComponent
                        className={`text-sm sm:text-lg ${config.color}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                        <p className="truncate text-sm font-medium text-slate-900 sm:text-base">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                              item.status === "Published"
                                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                                : "border border-amber-100 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="whitespace-nowrap text-xs text-slate-500">
                            {formatRelativeTime(time)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                        <span className={config.textColor}>
                          {item.action === "created" ? "Added" : "Updated"}{" "}
                          {item.typeLabel}
                        </span>
                        <span className="hidden text-slate-300 sm:inline">
                          •
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock className="text-xs flex-shrink-0" />
                          {new Date(time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <FaChevronRight className="text-slate-300 transition-colors group-hover:text-slate-500 text-xs sm:text-sm" />
                  </div>
                );
              })}
            </div>

            {recentItems.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 sm:mb-3 sm:h-16 sm:w-16">
                  <FaClock className="text-lg text-slate-400 sm:text-2xl" />
                </div>
                <p className="text-sm font-medium text-slate-700 sm:text-base">
                  No recent activity
                </p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Activity will appear here as you add products
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Insights */}
        <div className="space-y-4 sm:space-y-6">
          {/* Trending Snapshot */}
          <div className="rounded-lg bg-white p-4 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl">
                  <FaChartLine className="text-blue-600" />
                  Trending Snapshot
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                    7d momentum
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
                    Top 5
                  </span>
                  {trendingSnapshot.updated_at && (
                    <span
                      className="text-[11px] text-slate-500"
                      title={`Updated at ${formatDateTime(trendingSnapshot.updated_at)}`}
                    >
                      Updated {formatRelativeTime(trendingSnapshot.updated_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex w-full items-center gap-2 md:w-auto">
                <select
                  value={trendingType}
                  onChange={(e) => setTrendingType(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100 md:flex-none sm:text-sm"
                  aria-label="Trending type"
                >
                  {trendingTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchTrendingSnapshot}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-white disabled:opacity-60 sm:text-sm"
                  disabled={trendingLoading}
                  title="Refresh trending snapshot"
                >
                  {trendingLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {trendingError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {trendingError}
              </div>
            )}

            {trendingLoading && trendingSnapshot.results.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-600">
                Loading trending...
              </div>
            ) : trendingSnapshot.results.length === 0 ? (
              <div className="text-sm text-slate-600">
                <p>No trending data yet.</p>
                <button
                  onClick={() => navigate("/reports/trending")}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Open Trending Manager <FaArrowRight />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const maxScore = Math.max(
                    ...trendingSnapshot.results.map((r) =>
                      Number.isFinite(Number(r.trending_score))
                        ? Number(r.trending_score)
                        : 0,
                    ),
                    0,
                  );

                  return trendingSnapshot.results.map((r) => {
                    const current = Number(r.views_7d ?? 0);
                    const prev = Number(r.views_prev_7d ?? 0);
                    const delta = current - prev;

                    const trendPill =
                      delta > 0
                        ? "bg-green-50 text-green-700 border-green-200"
                        : delta < 0
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-50 text-gray-600 border-gray-200";

                    const score = Number(r.trending_score ?? 0);
                    const pct =
                      maxScore > 0 && Number.isFinite(score)
                        ? Math.min(100, Math.max(0, (score / maxScore) * 100))
                        : 0;

                    return (
                      <div
                        key={r.product_id}
                        className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {r.name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 min-w-0">
                              <p className="truncate text-xs text-slate-600">
                                {r.brand || "Unknown brand"}
                              </p>
                              {r.manual_boost && (
                                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                                  Manual
                                </span>
                              )}
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                                  UV7d
                                </span>
                                <span className="text-xs font-bold text-blue-900">
                                  {Number(r.views_7d ?? 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50 px-2 py-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-700">
                                  Cmp7d
                                </span>
                                <span className="text-xs font-bold text-purple-900">
                                  {Number(r.compares_7d ?? 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                                  Total UV
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {Number(
                                    r.unique_visitors_total ?? 0,
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                                  Total Cmp
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {Number(
                                    r.compares_total ?? 0,
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${trendPill}`}
                            title="Change vs previous 7 days"
                          >
                            {delta > 0 ? (
                              <FaArrowUp />
                            ) : delta < 0 ? (
                              <FaArrowDown />
                            ) : (
                              <FaMinus />
                            )}
                            {delta > 0 ? `+${delta}` : `${delta}`}
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}

                <button
                  onClick={() => navigate("/reports/trending")}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Manage Trending <FaArrowRight />
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between sm:mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Quick Actions
                </h2>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                  Frequently used actions
                </p>
              </div>
              <div className="flex-shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <FaBolt className="text-lg text-blue-500 sm:text-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                const colors = getColorClasses(action.color);
                return (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action.path)}
                    className={`
                      group flex min-h-[110px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-center transition-colors hover:border-slate-300 hover:bg-slate-50/60 sm:min-h-[120px]
                    `}
                  >
                    <div
                      className={`mb-2 rounded-2xl p-2 sm:mb-3 ${colors.lightBg}`}
                    >
                      <IconComponent
                        className={`text-lg sm:text-xl ${colors.text}`}
                      />
                    </div>
                    <span
                      className={`font-semibold text-xs sm:text-sm ${colors.text} mb-1`}
                    >
                      {action.label}
                    </span>
                    <p className="line-clamp-2 text-xs text-slate-600">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="rounded-lg bg-white p-4 sm:p-6">
            <h3 className="mb-4 text-base font-bold text-slate-900 sm:text-lg">
              Performance Insights
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex-shrink-0 rounded-lg border border-blue-100 bg-blue-50 p-2">
                    <FaTrophy className="text-blue-600 text-sm sm:text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 sm:text-sm">
                      Top Category
                    </p>
                    <p className="text-xs text-slate-600">Smartphones</p>
                  </div>
                </div>
                <span className="ml-2 flex-shrink-0 text-lg font-bold text-blue-600 sm:text-2xl">
                  {counts.mobiles}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex-shrink-0 rounded-lg border border-emerald-100 bg-emerald-50 p-2">
                    <FaStar className="text-emerald-600 text-sm sm:text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 sm:text-sm">
                      Publish Rate
                    </p>
                    <p className="text-xs text-slate-600">Overall success</p>
                  </div>
                </div>
                <span className="ml-2 flex-shrink-0 text-lg font-bold text-emerald-600 sm:text-2xl">
                  <CountUp
                    end={
                      counts.mobiles +
                        counts.laptops +
                        counts.appliances +
                        counts.networking >
                      0
                        ? Math.round(
                            ((counts.mobiles_published +
                              counts.laptops_published +
                              counts.appliances_published +
                              counts.networking_published) /
                              (counts.mobiles +
                                counts.laptops +
                                counts.appliances +
                                counts.networking)) *
                              100,
                          )
                        : 0
                    }
                    duration={1.5}
                    suffix="%"
                  />
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex-shrink-0 rounded-lg border border-purple-100 bg-purple-50 p-2">
                    <FaChartLine className="text-purple-600 text-sm sm:text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 sm:text-sm">
                      Growth
                    </p>
                    <p className="text-xs text-slate-600">This month</p>
                  </div>
                </div>
                <span className="ml-2 flex-shrink-0 text-lg font-bold text-purple-600 sm:text-2xl">
                  +24%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-10">
        <button
          onClick={() => navigate("/products/smartphones/create")}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 transition-colors active:scale-95 sm:h-16 sm:w-16 hover:border-blue-200 hover:bg-blue-50"
          aria-label="Quick add product"
        >
          <FaPlus className="text-lg sm:text-2xl" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="text-center px-4">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 sm:h-16 sm:w-16"></div>
            <p className="text-sm font-medium text-slate-700 sm:text-base">
              Loading dashboard...
            </p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Fetching the latest data
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/90 backdrop-blur-sm p-4">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="flex-shrink-0 rounded-lg border border-red-100 bg-red-50 p-2">
                <FaExclamationCircle className="text-red-600 text-lg sm:text-xl" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Error Loading Data
                </h3>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl border border-red-200 bg-white py-2 text-sm text-red-700 transition-colors hover:bg-red-50 sm:py-3 sm:text-base"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
