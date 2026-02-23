// components/Dashboard.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import CountUp from "react-countup";
import Cookies from "js-cookie";
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
  const [searchQuery, setSearchQuery] = useState("");

  const [trendingType, setTrendingType] = useState("smartphone");
  const [trendingSnapshot, setTrendingSnapshot] = useState({
    updated_at: null,
    results: [],
  });
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState(null);

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
    ],
    [],
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

  // Get color classes with gradients
  const getColorClasses = useCallback((color) => {
    const colors = {
      blue: {
        bg: "bg-gradient-to-br from-blue-50 to-blue-100",
        lightBg: "bg-gradient-to-br from-blue-100 to-blue-200",
        text: "text-blue-600",
        border: "border-blue-200",
        hover: "hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200",
        gradient: "from-blue-500 to-blue-600",
      },
      emerald: {
        bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
        lightBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
        text: "text-emerald-600",
        border: "border-emerald-200",
        hover:
          "hover:bg-gradient-to-br hover:from-emerald-100 hover:to-emerald-200",
        gradient: "from-emerald-500 to-emerald-600",
      },
      purple: {
        bg: "bg-gradient-to-br from-purple-50 to-purple-100",
        lightBg: "bg-gradient-to-br from-purple-100 to-purple-200",
        text: "text-purple-600",
        border: "border-purple-200",
        hover:
          "hover:bg-gradient-to-br hover:from-purple-100 hover:to-purple-200",
        gradient: "from-purple-500 to-purple-600",
      },
      orange: {
        bg: "bg-gradient-to-br from-orange-50 to-orange-100",
        lightBg: "bg-gradient-to-br from-orange-100 to-orange-200",
        text: "text-orange-600",
        border: "border-orange-200",
        hover:
          "hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-200",
        gradient: "from-orange-500 to-orange-600",
      },
      indigo: {
        bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
        lightBg: "bg-gradient-to-br from-indigo-100 to-indigo-200",
        text: "text-indigo-600",
        border: "border-indigo-200",
        hover:
          "hover:bg-gradient-to-br hover:from-indigo-100 hover:to-indigo-200",
        gradient: "from-indigo-500 to-indigo-600",
      },
      pink: {
        bg: "bg-gradient-to-br from-pink-50 to-pink-100",
        lightBg: "bg-gradient-to-br from-pink-100 to-pink-200",
        text: "text-pink-600",
        border: "border-pink-200",
        hover: "hover:bg-gradient-to-br hover:from-pink-100 hover:to-pink-200",
        gradient: "from-pink-500 to-pink-600",
      },
      gray: {
        bg: "bg-gradient-to-br from-gray-50 to-gray-100",
        lightBg: "bg-gradient-to-br from-gray-100 to-gray-200",
        text: "text-gray-600",
        border: "border-gray-200",
        hover: "hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200",
        gradient: "from-gray-500 to-gray-600",
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
    const bgColor = action === "created" ? "bg-green-50" : "bg-blue-50";
    const textColor = action === "created" ? "text-green-700" : "text-blue-700";

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
    <div className="min-h-full bg-white p-1 sm:p-2 md:p-2">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg w-fit">
                <FaHome className="text-xl sm:text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Dashboard
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Welcome back! Here's your inventory overview
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-3 sm:mt-4">
              <div
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                role="button"
                tabIndex={0}
              >
                <FaUserCircle className="text-gray-400" />
                <span>Admin Dashboard</span>
              </div>
            </div>
          </div>

          {/* header actions placeholder */}
          <div className="flex items-center gap-3" />
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">
          <div className="bg-white shadow-md rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Products
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">
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
              <FaShoppingBag className="text-blue-500 text-lg sm:text-xl flex-shrink-0" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Published</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 mt-1">
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
              <FaCheckCircle className="text-emerald-500 text-lg sm:text-xl flex-shrink-0" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Publish Rate</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mt-1">
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
              <FaChartLine className="text-purple-500 text-lg sm:text-xl flex-shrink-0" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Categories</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mt-1">
                  <CountUp end={counts.categories} duration={1.5} />
                </p>
              </div>
              <FaFolderOpen className="text-orange-500 text-lg sm:text-xl flex-shrink-0" />
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
                      bg-white rounded-lg shadow-md 
                      p-3 sm:p-4 hover:shadow-lg transition-all duration-300 
                      hover:-translate-y-1 cursor-pointer group
                      ${stat.path ? "hover:border-blue-300" : ""}
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

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs sm:text-sm text-gray-600">
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
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  Recent Activity
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  Latest updates across your inventory
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <div className="flex bg-gray-100 rounded-lg p-1 whitespace-nowrap">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setTimeFilter(filter.id)}
                      className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
                        timeFilter === filter.id
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
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
                    className="flex items-start gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${config.bgColor}`}
                    >
                      <IconComponent
                        className={`text-sm sm:text-lg ${config.color}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                        <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                              item.status === "Published"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatRelativeTime(time)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                        <span className={config.textColor}>
                          {item.action === "created" ? "Added" : "Updated"}{" "}
                          {item.typeLabel}
                        </span>
                        <span className="text-gray-400 hidden sm:inline">
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

                    <FaChevronRight className="text-gray-300 group-hover:text-gray-400 transition-colors text-xs sm:text-sm" />
                  </div>
                );
              })}
            </div>

            {recentItems.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <FaClock className="text-lg sm:text-2xl text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium text-sm sm:text-base">
                  No recent activity
                </p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  Activity will appear here as you add products
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Insights */}
        <div className="space-y-4 sm:space-y-6">
          {/* Trending Snapshot */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaChartLine className="text-blue-600" />
                  Trending Snapshot
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    7d momentum
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                    Top 5
                  </span>
                  {trendingSnapshot.updated_at && (
                    <span
                      className="text-[11px] text-gray-500"
                      title={`Updated at ${formatDateTime(trendingSnapshot.updated_at)}`}
                    >
                      Updated {formatRelativeTime(trendingSnapshot.updated_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={trendingType}
                  onChange={(e) => setTrendingType(e.target.value)}
                  className="flex-1 md:flex-none px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors disabled:opacity-60"
                  disabled={trendingLoading}
                  title="Refresh trending snapshot"
                >
                  {trendingLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {trendingError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {trendingError}
              </div>
            )}

            {trendingLoading && trendingSnapshot.results.length === 0 ? (
              <div className="text-sm text-gray-600 py-6 text-center">
                Loading trending...
              </div>
            ) : trendingSnapshot.results.length === 0 ? (
              <div className="text-sm text-gray-600">
                <p>No trending data yet.</p>
                <button
                  onClick={() => navigate("/reports/trending")}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
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
                        className="p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {r.name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 min-w-0">
                              <p className="text-xs text-gray-600 truncate">
                                {r.brand || "Unknown brand"}
                              </p>
                              {r.manual_boost && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap">
                                  Manual
                                </span>
                              )}
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                                  UV7d
                                </span>
                                <span className="text-xs font-bold text-blue-900">
                                  {Number(r.views_7d ?? 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="px-2 py-1.5 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide">
                                  Cmp7d
                                </span>
                                <span className="text-xs font-bold text-purple-900">
                                  {Number(r.compares_7d ?? 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                                  Total UV
                                </span>
                                <span className="text-xs font-bold text-gray-900">
                                  {Number(
                                    r.unique_visitors_total ?? 0,
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                                  Total Cmp
                                </span>
                                <span className="text-xs font-bold text-gray-900">
                                  {Number(
                                    r.compares_total ?? 0,
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${trendPill}`}
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
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Manage Trending <FaArrowRight />
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Quick Actions
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  Frequently used actions
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                <FaBolt className="text-blue-500 text-lg sm:text-xl" />
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
                      p-3 sm:p-4 rounded-lg border border-gray-200 
                      hover:shadow-md transition-all duration-200 
                      active:scale-[0.98] group
                      flex flex-col items-center justify-center text-center
                      min-h-[110px] sm:min-h-[120px] ${colors.bg}
                    `}
                  >
                    <div
                      className={`p-2 rounded-lg mb-2 sm:mb-3 ${colors.lightBg}`}
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
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
              Performance Insights
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-2 sm:p-3 bg-white/50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <FaTrophy className="text-blue-600 text-sm sm:text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-900">
                      Top Category
                    </p>
                    <p className="text-xs text-gray-600">Smartphones</p>
                  </div>
                </div>
                <span className="text-lg sm:text-2xl font-bold text-blue-600 flex-shrink-0 ml-2">
                  {counts.mobiles}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-3 bg-white/50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                    <FaStar className="text-emerald-600 text-sm sm:text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-900">
                      Publish Rate
                    </p>
                    <p className="text-xs text-gray-600">Overall success</p>
                  </div>
                </div>
                <span className="text-lg sm:text-2xl font-bold text-emerald-600 flex-shrink-0 ml-2">
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

              <div className="flex items-center justify-between p-2 sm:p-3 bg-white/50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <FaChartLine className="text-purple-600 text-sm sm:text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-900">
                      Growth
                    </p>
                    <p className="text-xs text-gray-600">This month</p>
                  </div>
                </div>
                <span className="text-lg sm:text-2xl font-bold text-purple-600 flex-shrink-0 ml-2">
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
          className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95"
          aria-label="Quick add product"
        >
          <FaPlus className="text-lg sm:text-2xl" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center px-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium text-sm sm:text-base">
              Loading dashboard...
            </p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Fetching the latest data
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="fixed inset-0 bg-red-50/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-red-200 p-4 sm:p-6 max-w-md">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <FaExclamationCircle className="text-red-600 text-lg sm:text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Error Loading Data
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm sm:text-base rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
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
