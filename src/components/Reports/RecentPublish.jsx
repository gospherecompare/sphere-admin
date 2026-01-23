import React, { useState, useEffect } from "react";
import {
  FaHistory,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaMobileAlt,
  FaLaptop,
  FaHome,
  FaNetworkWired,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimes,
  FaFilter,
  FaCalendarAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaExternalLinkAlt,
  FaSyncAlt,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../../api";

const RecentPublishActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [filters, setFilters] = useState({
    status: "all", // all, published, drafts
    productType: "all", // all, smartphone, laptop, etc.
    user: "all", // all, specific user
  });
  const [sortConfig, setSortConfig] = useState({
    key: "updated_at",
    direction: "desc",
  });
  const [timeRange, setTimeRange] = useState("all"); // all, today, week, month

  // Fetch report data
  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(
<<<<<<< HEAD
        buildUrl("/api/reports/recent-publish-activity"),
=======
        "http://apishpere.duckdns.org/api/reports/recent-publish-activity",
>>>>>>> 19bfb6e009d7a2384778614e395e6e80be567897
        {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Normalize the response structure
      const normalizedData = Array.isArray(data.recent_publish_activity)
        ? data.recent_publish_activity
        : [];

      setActivities(normalizedData);
      showToast("Success", "Activity data loaded successfully", "success");
    } catch (err) {
      console.error("Failed to fetch activity:", err);
      setError(err.message || "Failed to load activity data");
      showToast("Error", "Failed to load activity data", "error");
    } finally {
      setLoading(false);
    }
  };

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

  // Helper function to get icon for product type
  const getProductTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "smartphone":
        return <FaMobileAlt className="text-blue-600" />;
      case "laptop":
        return <FaLaptop className="text-purple-600" />;
      case "home_appliance":
        return <FaHome className="text-green-600" />;
      case "networking":
        return <FaNetworkWired className="text-orange-600" />;
      default:
        return <FaHistory className="text-gray-600" />;
    }
  };

  // Helper function to format product type name
  const formatProductType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format date to relative time or specific format
  const formatDate = (dateString) => {
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

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get full date for tooltip
  const getFullDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter data based on selected filters
  const filterData = (data) => {
    return data.filter((activity) => {
      // Filter by status
      if (filters.status === "published" && !activity.is_published)
        return false;
      if (filters.status === "drafts" && activity.is_published) return false;

      // Filter by product type
      if (
        filters.productType !== "all" &&
        activity.product_type !== filters.productType
      )
        return false;

      // Filter by user
      if (filters.user !== "all") {
        if (filters.user === "assigned" && !activity.published_by) return false;
        if (filters.user === "unassigned" && activity.published_by)
          return false;
      }

      // Filter by time range
      if (timeRange !== "all") {
        const activityDate = new Date(activity.updated_at);
        const now = new Date();
        let diffDays = (now - activityDate) / (1000 * 60 * 60 * 24);

        switch (timeRange) {
          case "today":
            if (diffDays > 1) return false;
            break;
          case "week":
            if (diffDays > 7) return false;
            break;
          case "month":
            if (diffDays > 30) return false;
            break;
        }
      }

      return true;
    });
  };

  // Sort data
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date comparison
      if (sortConfig.key === "updated_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle numeric comparison for IDs
      if (sortConfig.key === "product_id") {
        aValue = parseInt(aValue);
        bValue = parseInt(bValue);
      }

      // Handle boolean comparison for is_published
      if (sortConfig.key === "is_published") {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get status badge
  const getStatusBadge = (isPublished) => {
    if (isPublished) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
          <FaEye className="text-xs" /> Published
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center gap-1">
        <FaEyeSlash className="text-xs" /> Draft
      </span>
    );
  };

  // Calculate statistics
  const calculateStats = () => {
    const total = activities.length;
    const published = activities.filter((a) => a.is_published).length;
    const drafts = total - published;
    const assigned = activities.filter((a) => a.published_by).length;
    const unassigned = total - assigned;

    // Count by product type
    const typeCounts = activities.reduce((acc, activity) => {
      acc[activity.product_type] = (acc[activity.product_type] || 0) + 1;
      return acc;
    }, {});

    // Most recent activity
    const mostRecent =
      activities.length > 0
        ? activities.reduce((latest, current) => {
            return new Date(current.updated_at) > new Date(latest.updated_at)
              ? current
              : latest;
          })
        : null;

    return {
      total,
      published,
      drafts,
      assigned,
      unassigned,
      typeCounts,
      mostRecent,
    };
  };

  // Get unique product types
  const uniqueProductTypes = [
    ...new Set(activities.map((a) => a.product_type)),
  ];
  const uniqueUsers = [
    ...new Set(activities.filter((a) => a.user_name).map((a) => a.user_name)),
  ];

  const stats = calculateStats();
  const filteredActivities = sortData(filterData(activities));

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-white rounded-lg shadow-lg border p-4 max-w-sm w-full flex items-start space-x-3 ${
              toast.type === "success"
                ? "border-green-200 bg-green-50"
                : toast.type === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            {toast.type === "success" && (
              <FaCheckCircle className="text-green-500 mt-0.5" />
            )}
            {toast.type === "error" && (
              <FaExclamationCircle className="text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Recent Publish Activity
            </h1>
            <p className="text-gray-600 mt-1">
              Track recent changes and publishing activities across all products
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchActivityData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <FaSyncAlt />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Total Activities */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">Recent updates</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaHistory className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          {/* Published vs Drafts */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Published vs Drafts</p>
                <div className="flex items-center space-x-4 mt-1">
                  <div>
                    <p className="text-xl font-bold text-green-600">
                      {stats.published}
                    </p>
                    <p className="text-xs text-green-600">Published</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200"></div>
                  <div>
                    <p className="text-xl font-bold text-yellow-600">
                      {stats.drafts}
                    </p>
                    <p className="text-xs text-yellow-600">Drafts</p>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaEye className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          {/* Assigned vs Unassigned */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Assigned vs Unassigned</p>
                <div className="flex items-center space-x-4 mt-1">
                  <div>
                    <p className="text-xl font-bold text-blue-600">
                      {stats.assigned}
                    </p>
                    <p className="text-xs text-blue-600">Assigned</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200"></div>
                  <div>
                    <p className="text-xl font-bold text-gray-600">
                      {stats.unassigned}
                    </p>
                    <p className="text-xs text-gray-600">Unassigned</p>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaUser className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          {/* Most Recent */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Most Recent</p>
                <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                  {stats.mostRecent ? stats.mostRecent.product_name : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.mostRecent
                    ? formatDate(stats.mostRecent.updated_at)
                    : "No activity"}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaCalendarAlt className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <FaExclamationCircle className="text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-6 p-8 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
          <div className="flex flex-col items-center justify-center">
            <FaSpinner className="animate-spin text-3xl text-blue-600 mb-4" />
            <p className="text-gray-600">Loading activity data...</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {!loading && activities.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published Only</option>
                  <option value="drafts">Drafts Only</option>
                </select>
              </div>

              {/* Product Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product Type
                </label>
                <select
                  value={filters.productType}
                  onChange={(e) =>
                    setFilters({ ...filters, productType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {uniqueProductTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatProductType(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Assignment
                </label>
                <select
                  value={filters.user}
                  onChange={(e) =>
                    setFilters({ ...filters, user: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="assigned">Assigned Only</option>
                  <option value="unassigned">Unassigned Only</option>
                </select>
              </div>

              {/* Time Range Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
          {/* Table Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-800">
                  Recent Activity Timeline
                </h3>
                <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                  {filteredActivities.length} Activities
                </span>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredActivities.length} of {activities.length}{" "}
                activities
              </div>
            </div>
          </div>

          {/* Activity Table */}
          {filteredActivities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("product_id")}
                    >
                      <div className="flex items-center">
                        Product ID
                        {sortConfig.key === "product_id" ? (
                          sortConfig.direction === "asc" ? (
                            <FaSortUp className="ml-1" />
                          ) : (
                            <FaSortDown className="ml-1" />
                          )
                        ) : (
                          <FaSort className="ml-1 text-gray-300" />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product Details
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("is_published")}
                    >
                      <div className="flex items-center">
                        Status
                        {sortConfig.key === "is_published" ? (
                          sortConfig.direction === "asc" ? (
                            <FaSortUp className="ml-1" />
                          ) : (
                            <FaSortDown className="ml-1" />
                          )
                        ) : (
                          <FaSort className="ml-1 text-gray-300" />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Updated By
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("updated_at")}
                    >
                      <div className="flex items-center">
                        Last Updated
                        {sortConfig.key === "updated_at" ? (
                          sortConfig.direction === "asc" ? (
                            <FaSortUp className="ml-1" />
                          ) : (
                            <FaSortDown className="ml-1" />
                          )
                        ) : (
                          <FaSort className="ml-1 text-gray-300" />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{activity.product_id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            {getProductTypeIcon(activity.product_type)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {activity.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatProductType(activity.product_type)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(activity.is_published)}
                      </td>
                      <td className="px-6 py-4">
                        {activity.user_name ? (
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <FaUser className="text-purple-600 text-sm" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {activity.user_name}
                                </div>
                                <div className="text-sm text-gray-500 truncate max-w-[150px]">
                                  {activity.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            Not assigned
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="text-sm text-gray-900"
                          title={getFullDate(activity.updated_at)}
                        >
                          {formatDate(activity.updated_at)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.updated_at).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
                            <FaEye className="text-sm" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50">
                            <FaExternalLinkAlt className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaHistory className="text-2xl text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                {activities.length === 0
                  ? "No activity data available"
                  : "No activities match your filters"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {activities.length === 0
                  ? "Activity will appear here when products are updated"
                  : "Try adjusting your filter criteria"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Timeline View (Mobile/Alternate) */}
      {!loading && filteredActivities.length > 0 && (
        <div className="lg:hidden">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-4">
            <h4 className="font-semibold text-gray-800 mb-4">
              Activity Timeline
            </h4>
            <div className="space-y-4">
              {filteredActivities.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="relative pl-8 pb-4 border-l border-gray-200 last:border-l-0 last:pb-0"
                >
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500"></div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getProductTypeIcon(activity.product_type)}
                        <span className="font-medium text-gray-900">
                          {activity.product_name}
                        </span>
                      </div>
                      {getStatusBadge(activity.is_published)}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {formatProductType(activity.product_type)} • #
                      {activity.product_id}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        {activity.user_name ? (
                          <span>By {activity.user_name}</span>
                        ) : (
                          <span className="italic">Not assigned</span>
                        )}
                      </div>
                      <span>{formatDate(activity.updated_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Type Distribution */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h4 className="font-semibold text-gray-800 mb-4">
              Activity by Product Type
            </h4>
            <div className="space-y-3">
              {Object.entries(stats.typeCounts).map(([type, count]) => {
                const percentage = Math.round((count / stats.total) * 100);
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getProductTypeIcon(type)}
                        <span className="text-sm font-medium text-gray-700">
                          {formatProductType(type)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {count} ({percentage}%)
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          type === "smartphone"
                            ? "bg-blue-500"
                            : type === "laptop"
                              ? "bg-purple-500"
                              : type === "home_appliance"
                                ? "bg-green-500"
                                : "bg-orange-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-3">
              Activity Summary
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              This report shows the most recent publishing activities across all
              product types. You can see who published what, when, and the
              current status of each product.
            </p>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start">
                <FaEye className="text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  <strong>Published</strong> products are live and visible to
                  customers
                </span>
              </li>
              <li className="flex items-start">
                <FaEyeSlash className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  <strong>Drafts</strong> are still in progress and not visible
                  to customers
                </span>
              </li>
              <li className="flex items-start">
                <FaUser className="text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  <strong>Assigned</strong> activities have a user who performed
                  the action
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <FaHistory className="text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-700">
              <strong>Tip:</strong> Use the filters to focus on specific types
              of activities. Click on column headers to sort the table. The
              timeline view provides a quick overview of recent changes in your
              product catalog.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentPublishActivity;
