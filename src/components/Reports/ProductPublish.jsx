import React, { useState, useEffect, useMemo, useCallback } from "react";
import CountUp from "react-countup";
import {
  FaChartPie,
  FaMobileAlt,
  FaLaptop,
  FaHome,
  FaNetworkWired,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimes,
  FaGlobe,
  FaEdit,
  FaSyncAlt,
  FaEye,
  FaEyeSlash,
  FaListUl,
  FaTable,
  FaQuestionCircle,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../../api";

const ProductPublishStatusReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [viewMode, setViewMode] = useState("cards");

  // Fetch report data
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl("/api/reports/publish-status"), {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const normalizedData = Array.isArray(data.publish_by_type)
        ? data.publish_by_type
        : [];

      setReportData(normalizedData);
      showToast("Success", "Publish status loaded successfully", "success");
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError(err.message || "Failed to load publish status data");
      showToast("Error", "Failed to load publish status", "error");
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

  // Helper functions
  const getProductTypeIcon = useCallback((type) => {
    switch (type?.toLowerCase()) {
      case "smartphone":
        return <FaMobileAlt className="text-blue-500" />;
      case "laptop":
        return <FaLaptop className="text-purple-500" />;
      case "tv":
      case "home_appliance":
        return <FaHome className="text-green-500" />;
      case "networking":
        return <FaNetworkWired className="text-orange-500" />;
      default:
        return <FaChartPie className="text-gray-500" />;
    }
  }, []);

  const formatProductType = useCallback((type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  // Calculate statistics
  const { totals, overallPublishPercentage } = useMemo(() => {
    const totals = reportData.reduce(
      (acc, item) => ({
        total: acc.total + parseInt(item.total || 0),
        published: acc.published + parseInt(item.published || 0),
        drafts: acc.drafts + parseInt(item.drafts || 0),
      }),
      { total: 0, published: 0, drafts: 0 },
    );

    const overallPublishPercentage =
      totals.total > 0
        ? Math.round((totals.published / totals.total) * 100)
        : 0;

    return { totals, overallPublishPercentage };
  }, [reportData]);

  const calculatePercentage = useCallback((part, total) => {
    if (total === 0) return 0;
    return Math.round((parseInt(part) / parseInt(total)) * 100);
  }, []);

  const getStatusConfig = useCallback(
    (published, total) => {
      const percentage = calculatePercentage(published, total);
      let colorClass = "";
      let bgClass = "";
      let text = "";

      if (percentage >= 75) {
        colorClass = "text-green-600";
        bgClass = "bg-green-50 border-green-200";
        text = "Excellent";
      } else if (percentage >= 50) {
        colorClass = "text-yellow-600";
        bgClass = "bg-yellow-50 border-yellow-200";
        text = "Good";
      } else if (percentage >= 25) {
        colorClass = "text-orange-600";
        bgClass = "bg-orange-50 border-orange-200";
        text = "Needs Work";
      } else {
        colorClass = "text-red-600";
        bgClass = "bg-red-50 border-red-200";
        text = "Critical";
      }

      return { percentage, colorClass, bgClass, text };
    },
    [calculatePercentage],
  );

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
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Product Publish Status
            </h1>
            <p className="text-gray-600 mt-2">
              Track publication status across all product types
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 border border-gray-200 rounded-lg p-1 bg-white">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-all ${
                  viewMode === "cards"
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaListUl className="text-sm" />
                Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-all ${
                  viewMode === "table"
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaTable className="text-sm" />
                Table
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
          {/* Overall Publish Rate */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Overall Publish Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  <CountUp
                    end={overallPublishPercentage}
                    duration={1.5}
                    suffix="%"
                  />
                </p>
                <p className="text-sm text-gray-500">
                  <CountUp end={totals.published} duration={1.5} /> of{" "}
                  <CountUp end={totals.total} duration={1.5} /> products
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <FaGlobe className="text-xl text-blue-500" />
              </div>
            </div>
          </div>

          {/* Published Products */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Published
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  <CountUp end={totals.published} duration={1.5} />
                </p>
                <p className="text-sm text-gray-500">Live products</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
                <FaEye className="text-xl text-green-500" />
              </div>
            </div>
          </div>

          {/* Draft Products */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Drafts</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  <CountUp end={totals.drafts} duration={1.5} />
                </p>
                <p className="text-sm text-gray-500">In progress</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center border border-yellow-100">
                <FaEdit className="text-xl text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  <CountUp end={totals.total} duration={1.5} />
                </p>
                <p className="text-sm text-gray-500">All product types</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                <FaChartPie className="text-xl text-purple-500" />
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
              Loading publish status...
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Fetching the latest data
            </p>
          </div>
        </div>
      )}

      {/* Report Data - Cards View */}
      {!loading && viewMode === "cards" && reportData.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Product Type Breakdown
            </h2>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {reportData.length} types
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportData.map((item, index) => {
              const publishPercentage = calculatePercentage(
                item.published,
                item.total,
              );
              const draftPercentage = calculatePercentage(
                item.drafts,
                item.total,
              );
              const status = getStatusConfig(item.published, item.total);

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="p-5">
                    {/* Header with Icon */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg border border-gray-100 flex items-center justify-center">
                          {getProductTypeIcon(item.product_type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {formatProductType(item.product_type)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            <CountUp
                              end={parseInt(item.total || 0)}
                              duration={1.2}
                            />{" "}
                            products
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border ${status.bgClass} ${status.colorClass}`}
                      >
                        <CountUp end={publishPercentage} duration={1.2} />%
                        Published
                      </span>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Published
                          </span>
                          <span className="font-medium text-gray-900">
                            <CountUp
                              end={parseInt(item.published || 0)}
                              duration={1.2}
                            />{" "}
                            <span className="text-gray-500">
                              ({publishPercentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-1000"
                            style={{ width: `${publishPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            Drafts
                          </span>
                          <span className="font-medium text-gray-900">
                            <CountUp
                              end={parseInt(item.drafts || 0)}
                              duration={1.2}
                            />{" "}
                            <span className="text-gray-500">
                              ({draftPercentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                            style={{ width: `${draftPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
                      <div className="text-center p-3 border border-gray-100 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          <CountUp
                            end={parseInt(item.published || 0)}
                            duration={1.2}
                          />
                        </p>
                        <p className="text-xs text-gray-600 font-medium">
                          Published
                        </p>
                      </div>
                      <div className="text-center p-3 border border-gray-100 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">
                          <CountUp
                            end={parseInt(item.drafts || 0)}
                            duration={1.2}
                          />
                        </p>
                        <p className="text-xs text-gray-600 font-medium">
                          Drafts
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table View */}
      {!loading && viewMode === "table" && reportData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Publish Status by Product Type
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Detailed breakdown of publication status
                </p>
              </div>
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                {reportData.length} types
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Product Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Drafts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Publish Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.map((item, index) => {
                  const status = getStatusConfig(item.published, item.total);
                  const publishPercentage = status.percentage;
                  const draftPercentage = calculatePercentage(
                    item.drafts,
                    item.total,
                  );

                  return (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg border border-gray-100 flex items-center justify-center">
                            {getProductTypeIcon(item.product_type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatProductType(item.product_type)}
                            </p>
                            <p className="text-sm text-gray-500">Type</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            <CountUp
                              end={parseInt(item.total || 0)}
                              duration={1.2}
                            />
                          </p>
                          <p className="text-sm text-gray-500">Products</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded bg-green-50 border border-green-100 flex items-center justify-center">
                            <FaEye className="text-green-500 text-sm" />
                          </div>
                          <div>
                            <p className="font-bold text-green-600 text-lg">
                              <CountUp
                                end={parseInt(item.published || 0)}
                                duration={1.2}
                              />
                            </p>
                            <p className="text-xs text-gray-500">Published</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded bg-yellow-50 border border-yellow-100 flex items-center justify-center">
                            <FaEdit className="text-yellow-500 text-sm" />
                          </div>
                          <div>
                            <p className="font-bold text-yellow-600 text-lg">
                              <CountUp
                                end={parseInt(item.drafts || 0)}
                                duration={1.2}
                              />
                            </p>
                            <p className="text-xs text-gray-500">Drafts</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-48">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700">
                              <CountUp end={publishPercentage} duration={1.2} />
                              %
                            </span>
                            <span className="text-gray-500">
                              <CountUp end={draftPercentage} duration={1.2} />%
                              drafts
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                publishPercentage >= 75
                                  ? "bg-green-500"
                                  : publishPercentage >= 50
                                    ? "bg-yellow-500"
                                    : publishPercentage >= 25
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                              }`}
                              style={{ width: `${publishPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${status.bgClass} ${status.colorClass}`}
                        >
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && reportData.length === 0 && (
        <div className="mb-8 p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
              <FaChartPie className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No Publish Status Data
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              There's no publish status data available at the moment. Publish
              some products to see the report here.
            </p>
            <button
              onClick={fetchReportData}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
            >
              <FaSyncAlt />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Summary & Help */}
      {!loading && reportData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Status Legend */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaQuestionCircle className="text-gray-500" />
              Status Legend
            </h4>
            <div className="space-y-3">
              {[
                { label: "Excellent", color: "green", threshold: "≥75%" },
                { label: "Good", color: "yellow", threshold: "50-74%" },
                { label: "Needs Work", color: "orange", threshold: "25-49%" },
                { label: "Critical", color: "red", threshold: "<25%" },
              ].map((item) => (
                <div
                  key={item.color}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full bg-${item.color}-500`}
                    ></div>
                    <span className="font-medium text-gray-900">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {item.threshold}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h4 className="font-bold text-gray-900 mb-4">Summary Statistics</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">
                    Publication Rate
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {overallPublishPercentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${overallPublishPercentage}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-gray-100 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {totals.published}
                  </p>
                  <p className="text-sm text-gray-600">Published Products</p>
                </div>
                <div className="p-3 border border-gray-100 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {totals.drafts}
                  </p>
                  <p className="text-sm text-gray-600">Draft Products</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h4 className="font-bold text-gray-900 mb-4">How This Works</h4>
            <p className="text-gray-700 text-sm mb-3">
              This report shows the publication status of products across
              different types. Published products are live and visible to
              customers, while drafts are still in progress.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span>
                  Use the toggle to switch between card and table views
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span>Status indicates publication completion percentage</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span>Refresh to get the latest data</span>
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

export default ProductPublishStatusReport;
