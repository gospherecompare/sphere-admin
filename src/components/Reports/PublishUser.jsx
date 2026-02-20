import React, { useState, useEffect, useMemo, useCallback } from "react";
import CountUp from "react-countup";
import {
  FaUser,
  FaEnvelope,
  FaChartBar,
  FaSyncAlt,
  FaSpinner,
  FaQuestionCircle,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimes,
  FaEye,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCrown,
  FaMedal,
  FaAward,
  FaTrophy,
  FaUsers,
  FaCheckSquare,
  FaPercentage,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../../api";

const PublishedByUserReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "published_count",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch report data
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl("/api/reports/published-by-user"), {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Normalize the response structure
      const normalizedData = Array.isArray(data.published_by_user)
        ? data.published_by_user
        : [];

      setReportData(normalizedData);
      showToast("Success", "User report loaded successfully", "success");
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError(err.message || "Failed to load user report data");
      showToast("Error", "Failed to load user report", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Toast system
  const showToast = useCallback((title, message, type = "success") => {
    const id = Date.now();
    const newToast = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Sorting functionality
  const handleSort = useCallback((key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "desc" };
    });
  }, []);

  // Get sorted and filtered data
  const sortedData = useMemo(() => {
    let filteredData = reportData.filter(
      (user) =>
        user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return filteredData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle numeric comparison for counts
      if (sortConfig.key.includes("count")) {
        const aNum = parseInt(aValue) || 0;
        const bNum = parseInt(bValue) || 0;
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }

      // String comparison for other fields
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [reportData, searchTerm, sortConfig]);

  // Calculate total published products
  const totalPublished = useMemo(() => {
    return reportData.reduce(
      (total, user) => total + parseInt(user.published_count || 0),
      0,
    );
  }, [reportData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reportData.length;
    const average = total > 0 ? Math.round(totalPublished / total) : 0;
    const topPerformer = sortedData[0];

    // Calculate contribution percentages
    const usersWithPercentage = sortedData.map((user) => ({
      ...user,
      percentage:
        totalPublished > 0
          ? Math.round((parseInt(user.published_count) / totalPublished) * 100)
          : 0,
    }));

    return {
      totalUsers: total,
      averagePublished: average,
      topPerformer,
      usersWithPercentage,
    };
  }, [reportData, totalPublished, sortedData]);

  // Get rank badge based on position
  const getRankBadge = useCallback((index) => {
    switch (index) {
      case 0:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full flex items-center gap-1">
            <FaCrown className="text-yellow-600" /> #1
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full flex items-center gap-1">
            <FaMedal className="text-gray-600" /> #2
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full flex items-center gap-1">
            <FaAward className="text-orange-600" /> #3
          </span>
        );
      default:
        if (index < 10) {
          return (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
              #{index + 1}
            </span>
          );
        }
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            #{index + 1}
          </span>
        );
    }
  }, []);

  // Get user avatar color based on name
  const getUserAvatarColor = useCallback((name) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-green-100 text-green-700",
      "bg-yellow-100 text-yellow-700",
      "bg-red-100 text-red-700",
      "bg-indigo-100 text-indigo-700",
      "bg-pink-100 text-pink-700",
      "bg-teal-100 text-teal-700",
    ];
    const index = name?.length % colors.length || 0;
    return colors[index];
  }, []);

  // Get sort icon
  const getSortIcon = useCallback(
    (key) => {
      if (sortConfig.key !== key) {
        return <FaSort className="ml-1 text-gray-300" />;
      }
      return sortConfig.direction === "asc" ? (
        <FaSortUp className="ml-1 text-blue-600" />
      ) : (
        <FaSortDown className="ml-1 text-blue-600" />
      );
    },
    [sortConfig],
  );

  // Handle search input change with debounce
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Get user initials
  const getUserInitials = useCallback((name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  }, []);

  return (
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2 overflow-x-hidden">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-white rounded-lg shadow-lg border p-4 max-w-sm w-full flex items-start space-x-3 ${
              toast.type === "success"
                ? "border-green-200"
                : toast.type === "error"
                  ? "border-red-200"
                  : "border-blue-200"
            }`}
          >
            {toast.type === "success" && (
              <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
            )}
            {toast.type === "error" && (
              <FaExclamationCircle className="text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {toast.title}
              </p>
              <p className="text-sm text-gray-600 mt-0.5 break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Close notification"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              User Publication Report
            </h1>
            <p className="text-gray-600 mt-2">
              Track and analyze publication contributions across your team
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="font-semibold">
                <CountUp end={sortedData.length} duration={0.8} />
              </span>{" "}
              of{" "}
              <span className="font-semibold">
                <CountUp end={reportData.length} duration={0.8} />
              </span>{" "}
              users
            </div>
            <button
              onClick={fetchReportData}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-2 text-sm font-medium shadow-sm"
              disabled={loading}
            >
              <FaSyncAlt className={`${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Published */}
          <div className="bg-white rounded-xl shadow p-6 text-gray-900 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Published
                </p>
                <p className="text-4xl font-bold mb-2">
                  <CountUp end={totalPublished} duration={1.2} />
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <FaCheckSquare className="mr-2" />
                  <span>Across all users</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaEye className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Publishers */}
          <div className="bg-white rounded-xl shadow p-6 text-gray-900 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Active Publishers
                </p>
                <p className="text-4xl font-bold mb-2">
                  <CountUp end={reportData.length} duration={1.2} />
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <FaUsers className="mr-2" />
                  <span>With published content</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <FaUser className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>

          {/* Average Per User */}
          <div className="bg-white rounded-xl shadow p-6 text-gray-900 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Average Per User
                </p>
                <p className="text-4xl font-bold mb-2">
                  <CountUp end={stats.averagePublished} duration={1.0} />
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <FaChartBar className="mr-2" />
                  <span>Published products</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <FaPercentage className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          {/* Top Performer */}
          <div className="bg-white rounded-xl shadow p-6 text-gray-900 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Top Performer
                </p>
                <p className="text-2xl font-bold mb-2 truncate">
                  {stats.topPerformer ? stats.topPerformer.user_name : "N/A"}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <FaTrophy className="mr-2 text-amber-500" />
                  <span>
                    {stats.topPerformer ? (
                      <>
                        <CountUp
                          end={parseInt(
                            stats.topPerformer.published_count || 0,
                          )}
                          duration={1.0}
                        />{" "}
                        products
                      </>
                    ) : (
                      "No data"
                    )}
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center">
                <FaCrown className="text-2xl text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
          <FaExclamationCircle className="text-red-500 flex-shrink-0 text-xl" />
          <div className="flex-1">
            <span className="font-medium text-red-800">
              Error loading report
            </span>
            <p className="text-red-700 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-6 p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="flex flex-col items-center justify-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
            <p className="text-gray-700 font-medium">Loading user report...</p>
            <p className="text-gray-500 text-sm mt-1">
              Fetching the latest publication data
            </p>
          </div>
        </div>
      )}

      {/* Report Data */}
      {!loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
          {/* Table Header with Search */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FaChartBar className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Publication Leaderboard
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Ranked by published products
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search users by name or email..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Cards for Mobile */}
          <div className="md:hidden p-6">
            {sortedData.length > 0 ? (
              <div className="space-y-4">
                {sortedData.map((user, index) => (
                  <div
                    key={user.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getUserAvatarColor(
                              user.user_name,
                            )}`}
                          >
                            <span className="font-bold text-lg">
                              {getUserInitials(user.user_name)}
                            </span>
                          </div>
                          <div className="absolute -top-2 -right-2">
                            {getRankBadge(index)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">
                            {user.user_name}
                          </h4>
                          <p className="text-gray-600 text-sm mt-0.5 truncate max-w-[200px]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-700">
                          <CountUp
                            end={parseInt(user.published_count || 0)}
                            duration={1.0}
                          />
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          PUBLISHED
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">User ID:</span>{" "}
                          {user.id}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                            {stats.usersWithPercentage[index]?.percentage || 0}%
                            of total
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                            <FaEye />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUser className="text-3xl text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium text-lg mb-2">
                  {searchTerm ? "No users found" : "No publication data"}
                </p>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Try a different search term"
                    : "Users will appear here once they publish products"}
                </p>
              </div>
            )}
          </div>

          {/* Table for Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center">
                      Rank
                      {getSortIcon("id")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    User Profile
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("user_name")}
                  >
                    <div className="flex items-center">
                      Username
                      {getSortIcon("user_name")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center">
                      Email
                      {getSortIcon("email")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("published_count")}
                  >
                    <div className="flex items-center">
                      Published Count
                      {getSortIcon("published_count")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    Contribution
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedData.length > 0 ? (
                  sortedData.map((user, index) => {
                    const percentage =
                      stats.usersWithPercentage[index]?.percentage || 0;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex justify-center">
                            {getRankBadge(index)}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getUserAvatarColor(
                                user.user_name,
                              )}`}
                            >
                              <span className="font-bold">
                                {getUserInitials(user.user_name)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-gray-900 text-lg">
                            {user.user_name}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-gray-900 font-medium">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">Contact</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <FaEye className="text-blue-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-3xl font-bold text-gray-900">
                                <CountUp
                                  end={parseInt(user.published_count || 0)}
                                  duration={1.0}
                                />
                              </div>
                              <div className="text-sm text-gray-500 font-medium">
                                PRODUCTS
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="w-48">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-gray-700">
                                {percentage}%
                              </span>
                              <span className="text-gray-500">of total</span>
                            </div>
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${Math.min(percentage, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-8 py-12">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaUsers className="text-3xl text-gray-400" />
                        </div>
                        <p className="text-gray-700 font-medium text-lg mb-2">
                          {searchTerm
                            ? "No matching users"
                            : "No publication data"}
                        </p>
                        <p className="text-gray-500 max-w-md mx-auto">
                          {searchTerm
                            ? "Try adjusting your search terms or filters"
                            : "Start by publishing products to see user contributions here"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          {sortedData.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                <div className="text-gray-700">
                  Showing <span className="font-bold">{sortedData.length}</span>{" "}
                  of <span className="font-bold">{reportData.length}</span>{" "}
                  users
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <FaCheckSquare className="text-green-500" />
                    <span className="font-medium text-gray-700">Total: </span>
                    <span className="font-bold text-blue-600">
                      {totalPublished}
                    </span>
                    <span className="text-gray-500">products</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaChartBar className="text-green-500" />
                    <span className="font-medium text-gray-700">Avg: </span>
                    <span className="font-bold text-green-600">
                      {stats.averagePublished}
                    </span>
                    <span className="text-gray-500">per user</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend & Help */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Legend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <FaTrophy className="text-amber-500" />
            Ranking Legend
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <FaCrown className="text-yellow-600" />
                <span className="font-medium text-gray-900">Top Performer</span>
              </div>
              <span className="font-bold text-yellow-700">#1</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <FaMedal className="text-gray-600" />
                <span className="font-medium text-gray-900">Runner-up</span>
              </div>
              <span className="font-bold text-gray-700">#2</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <FaAward className="text-orange-600" />
                <span className="font-medium text-gray-900">Third Place</span>
              </div>
              <span className="font-bold text-orange-700">#3</span>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-white rounded-xl border border-blue-200 p-6">
          <h4 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <FaChartBar className="text-blue-600" />
            Report Summary
          </h4>
          <ul className="space-y-3">
            <li className="flex items-center text-sm text-gray-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span>
                <strong>Total Published:</strong> {totalPublished} products
                across all users
              </span>
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span>
                <strong>Active Publishers:</strong> {reportData.length} users
                with published content
              </span>
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span>
                <strong>Average Per User:</strong> {stats.averagePublished}{" "}
                products per publisher
              </span>
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
              <span>
                <strong>Top Performer:</strong>{" "}
                {stats.topPerformer?.user_name || "N/A"} with{" "}
                {stats.topPerformer?.published_count || 0} products
              </span>
            </li>
          </ul>
        </div>

        {/* Help Text */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <FaQuestionCircle className="text-gray-600" />
            How to Use
          </h4>
          <p className="text-gray-700 text-sm mb-3">
            This leaderboard ranks users by their publication count. Use it to:
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <span>Identify top contributors and recognize their efforts</span>
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <span>Track publication trends and team performance</span>
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <span>Search for specific users by name or email</span>
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <span>Sort by any column to analyze data differently</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Report updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default PublishedByUserReport;


