import React, { useState, useEffect, useMemo } from "react";
import CountUp from "react-countup";
import {
  FaChartBar,
  FaMobileAlt,
  FaLaptop,
  FaHome,
  FaNetworkWired,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimes,
  FaSyncAlt,
  FaChevronRight,
  FaStar,
  FaSortAmountDown,
  FaFilter,
} from "react-icons/fa";
import Cookies from "js-cookie";

const ProductCategoryReport = () => {
  const [reportData, setReportData] = useState({
    categories: [],
    totals: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sortBy, setSortBy] = useState("count"); // 'count', 'name'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'

  // Fetch report data
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(
        "http://localhost:5000/api/reports/products-by-category",
        {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const normalizedData = {
        categories: Array.isArray(data.categories) ? data.categories : [],
        totals: Array.isArray(data.totals) ? data.totals : [],
      };

      setReportData(normalizedData);
      showToast("Success", "Category report loaded successfully", "success");
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError(err.message || "Failed to load report data");
      showToast("Error", "Failed to load category report", "error");
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
  const getProductTypeIcon = (type, size = "text-xl") => {
    switch (type?.toLowerCase()) {
      case "smartphone":
        return <FaMobileAlt className={`text-blue-500 ${size}`} />;
      case "laptop":
        return <FaLaptop className={`text-purple-500 ${size}`} />;
      case "home_appliance":
        return <FaHome className={`text-green-500 ${size}`} />;
      case "networking":
        return <FaNetworkWired className={`text-orange-500 ${size}`} />;
      default:
        return <FaChartBar className={`text-gray-500 ${size}`} />;
    }
  };

  // Helper function to format product type name
  const formatProductType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Calculate statistics
  const { totalProducts, topCategory, topProductType } = useMemo(() => {
    const totalProducts = reportData.totals.reduce(
      (sum, item) => sum + parseInt(item.count || 0),
      0
    );

    const topCategory =
      reportData.categories.length > 0
        ? [...reportData.categories].sort((a, b) => b.count - a.count)[0]
        : null;

    const topProductType =
      reportData.totals.length > 0
        ? [...reportData.totals].sort((a, b) => b.count - a.count)[0]
        : null;

    return { totalProducts, topCategory, topProductType };
  }, [reportData]);

  // Sort and filter data
  const sortedCategories = useMemo(() => {
    const sorted = [...reportData.categories];
    sorted.sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      } else {
        return sortOrder === "asc"
          ? parseInt(a.count) - parseInt(b.count)
          : parseInt(b.count) - parseInt(a.count);
      }
    });
    return sorted;
  }, [reportData.categories, sortBy, sortOrder]);

  const sortedProductTypes = useMemo(() => {
    const sorted = [...reportData.totals];
    sorted.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = formatProductType(a.product_type);
        const nameB = formatProductType(b.product_type);
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else {
        return sortOrder === "asc"
          ? parseInt(a.count) - parseInt(b.count)
          : parseInt(b.count) - parseInt(a.count);
      }
    });
    return sorted;
  }, [reportData.totals, sortBy, sortOrder]);

  // Calculate percentage for progress bars
  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((parseInt(value) / total) * 100);
  };

  // Get color based on count
  const getCountColor = (count, maxCount) => {
    const percentage = calculatePercentage(count, maxCount);
    if (percentage >= 70) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 40) return "text-blue-600 bg-blue-50 border-blue-200";
    if (percentage >= 20)
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
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
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Product Category Report
            </h1>
            <p className="text-gray-600 mt-2">
              Overview of products grouped by category and type
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-1 bg-white">
              <button
                onClick={() => setSortBy("count")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  sortBy === "count"
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaSortAmountDown className="inline mr-2" />
                Count
              </button>
              <button
                onClick={() => setSortBy("name")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  sortBy === "name"
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaFilter className="inline mr-2" />
                Name
              </button>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-1.5 rounded text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
              </button>
            </div>
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow"
            >
              <FaSyncAlt className={`${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  <CountUp end={totalProducts} duration={1.5} />
                </p>
                <p className="text-sm text-gray-500">
                  Across all categories & types
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <FaChartBar className="text-xl text-blue-500" />
              </div>
            </div>
          </div>

          {/* Categories Count */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Categories
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  <CountUp end={reportData.categories.length} duration={1.5} />
                </p>
                <p className="text-sm text-gray-500">Smartphone categories</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
                <FaMobileAlt className="text-xl text-green-500" />
              </div>
            </div>
          </div>

          {/* Product Types */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Product Types
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  <CountUp end={reportData.totals.length} duration={1.5} />
                </p>
                <p className="text-sm text-gray-500">Different types</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                <FaChartBar className="text-xl text-purple-500" />
              </div>
            </div>
          </div>

          {/* Top Performing */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Top Category
                </p>
                <p className="text-xl font-bold text-gray-900 mb-1 truncate">
                  {topCategory?.category || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  {topCategory ? `${topCategory.count} products` : "No data"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                <FaStar className="text-xl text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
          <FaExclamationCircle className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-6 p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="flex flex-col items-center justify-center">
            <FaSpinner className="animate-spin text-3xl text-blue-500 mb-4" />
            <p className="text-gray-700 font-medium">
              Loading category report...
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Fetching the latest data
            </p>
          </div>
        </div>
      )}

      {/* Report Data */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Smartphone Categories */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <FaMobileAlt className="text-blue-500" />
                    Smartphone Categories
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Distribution of smartphones by category
                  </p>
                </div>
                <span className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                  {reportData.categories.length} categories
                </span>
              </div>
            </div>

            <div className="p-6">
              {sortedCategories.length > 0 ? (
                <div className="space-y-4">
                  {sortedCategories.map((category, index) => {
                    const percentage = calculatePercentage(
                      category.count,
                      topCategory?.count || 1
                    );
                    const colorClass = getCountColor(
                      category.count,
                      topCategory?.count || 1
                    );

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <FaMobileAlt className="text-xl text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {category.category}
                            </p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-sm text-gray-500">
                                Smartphone
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}
                              >
                                {percentage}% of top
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            <CountUp
                              end={parseInt(category.count)}
                              duration={1.2}
                            />
                          </p>
                          <p className="text-xs text-gray-500 mt-1">devices</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                    <FaMobileAlt className="text-2xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    No smartphone categories found
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Add smartphone categories to see data here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product Types */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <FaChartBar className="text-purple-500" />
                    Products by Type
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Product distribution across different types
                  </p>
                </div>
                <span className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                  {reportData.totals.length} types
                </span>
              </div>
            </div>

            <div className="p-6">
              {sortedProductTypes.length > 0 ? (
                <div className="space-y-4">
                  {sortedProductTypes.map((productType, index) => {
                    const percentage = calculatePercentage(
                      productType.count,
                      topProductType?.count || 1
                    );
                    const colorClass = getCountColor(
                      productType.count,
                      topProductType?.count || 1
                    );

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
                            {getProductTypeIcon(
                              productType.product_type,
                              "text-xl"
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {formatProductType(productType.product_type)}
                            </p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-sm text-gray-500">
                                Product Type
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}
                              >
                                {percentage}% of top
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            <CountUp
                              end={parseInt(productType.count)}
                              duration={1.2}
                            />
                          </p>
                          <p className="text-xs text-gray-500 mt-1">products</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                    <FaChartBar className="text-2xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    No product type data found
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Add products to see data here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary & Insights */}
      {!loading &&
        (reportData.totals.length > 0 || reportData.categories.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Top Performers */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h4 className="font-bold text-gray-900 mb-4">Top Performers</h4>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        Top Category
                      </p>
                      <p className="font-bold text-blue-900 text-lg">
                        {topCategory?.category || "N/A"}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaMobileAlt className="text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      <CountUp
                        end={parseInt(topCategory?.count || 0)}
                        duration={1.2}
                      />{" "}
                      devices
                    </span>
                    <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      #1
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100/30 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-800 font-medium mb-1">
                        Top Product Type
                      </p>
                      <p className="font-bold text-purple-900 text-lg">
                        {topProductType
                          ? formatProductType(topProductType.product_type)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      {getProductTypeIcon(
                        topProductType?.product_type,
                        "text-lg"
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-purple-700">
                      <CountUp
                        end={parseInt(topProductType?.count || 0)}
                        duration={1.2}
                      />{" "}
                      products
                    </span>
                    <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      #1
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h4 className="font-bold text-gray-900 mb-4">Distribution</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Smartphone Categories
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {reportData.categories.length}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          (reportData.categories.length / 10) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Product Types</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reportData.totals.length}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          (reportData.totals.length / 10) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-3 border border-gray-100 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {reportData.categories.length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      Categories
                    </p>
                  </div>
                  <div className="text-center p-3 border border-gray-100 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {reportData.totals.length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Types</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Help & Tips */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h4 className="font-bold text-gray-900 mb-4">How This Works</h4>
              <p className="text-gray-700 text-sm mb-3">
                This report shows the distribution of products across different
                categories and types. Smartphone categories represent specific
                models or series, while product types indicate the broader
                product category.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <span>
                    Use sort buttons to organize data by count or name
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <span>
                    Percentage shows relative size compared to top performer
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <span>
                    Refresh to get the latest product distribution data
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

      {/* Last Updated */}
      {!loading && (
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            Report last updated: {new Date().toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductCategoryReport;
