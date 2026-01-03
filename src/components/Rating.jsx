import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  FaStar,
  FaEdit,
  FaTrash,
  FaSync,
  FaSearch,
  FaEye,
  FaChartBar,
  FaSort,
  FaFilter,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";

const AdminRatingManagement = () => {
  // State management
  const [smartphones, setSmartphones] = useState([]);
  const [selectedSmartphone, setSelectedSmartphone] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    display: 0,
    performance: 0,
    camera: 0,
    battery: 0,
    design: 0,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'details'

  // Toast notification system
  const showToast = (title, message, type = "success") => {
    const id = Date.now();
    const newToast = {
      id,
      title,
      message,
      type,
      show: true,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Fetch smartphones list
  useEffect(() => {
    fetchSmartphones();
  }, []);

  // Fetch ratings when smartphone is selected
  useEffect(() => {
    if (selectedSmartphone) {
      fetchRatings(selectedSmartphone.id);
      fetchAverageRating(selectedSmartphone.id);
    }
  }, [selectedSmartphone]);

  const fetchSmartphones = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch("http://localhost:5000/api/smartphones", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        // API may return either an array or an object like { smartphones: [...] }
        // Normalize to always set an array in state to avoid `.filter` errors.
        const phones = Array.isArray(data)
          ? data
          : Array.isArray(data?.smartphones)
          ? data.smartphones
          : [];
        setSmartphones(phones);
      } else {
        throw new Error("Failed to fetch smartphones");
      }
    } catch (error) {
      console.error("Error fetching smartphones:", error);
      showToast("Error", "Failed to load smartphones", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async (smartphoneId) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/public/smartphone/${smartphoneId}/rating`
      );

      if (res.ok) {
        const data = await res.json();
        // This endpoint returns average, but we need all ratings
        // Let's assume we have another endpoint for all ratings
        // For now, we'll use the average as a single rating
        setRatings([data]);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAverageRating = async (smartphoneId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/public/smartphone/${smartphoneId}/rating`
      );

      if (res.ok) {
        const data = await res.json();
        setAverageRating(data);
      }
    } catch (error) {
      console.error("Error fetching average rating:", error);
    }
  };

  const handleUpdateRating = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = Cookies.get("authToken");
      const res = await fetch(
        `http://localhost:5000/api/private/smartphone/${selectedSmartphone.id}/rating`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (res.ok) {
        const data = await res.json();
        showToast("Success", "Rating updated successfully", "success");
        setEditMode(false);
        fetchRatings(selectedSmartphone.id);
        fetchAverageRating(selectedSmartphone.id);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update rating");
      }
    } catch (error) {
      console.error("Error updating rating:", error);
      showToast("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllRatings = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(
        `http://localhost:5000/api/private/smartphone/${selectedSmartphone.id}/rating`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        showToast("Success", "All ratings deleted successfully", "success");
        setRatings([]);
        setAverageRating(null);
        setShowDeleteConfirm(false);
      } else {
        throw new Error("Failed to delete ratings");
      }
    } catch (error) {
      console.error("Error deleting ratings:", error);
      showToast("Error", "Failed to delete ratings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNewRating = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/public/smartphone/${selectedSmartphone.id}/rating`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        }
      );

      if (res.ok) {
        const data = await res.json();
        showToast("Success", "New rating submitted successfully", "success");
        setEditMode(false);
        fetchRatings(selectedSmartphone.id);
        fetchAverageRating(selectedSmartphone.id);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      showToast("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const phonesArray = Array.isArray(smartphones) ? smartphones : [];

  const filteredSmartphones = phonesArray.filter(
    (phone) =>
      (phone?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (phone?.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (phone?.model || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSmartphones = [...filteredSmartphones].sort((a, b) => {
    if (sortConfig.key === "name") {
      return sortConfig.direction === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortConfig.key === "brand") {
      return sortConfig.direction === "asc"
        ? a.brand.localeCompare(b.brand)
        : b.brand.localeCompare(a.brand);
    }
    return 0;
  });

  // Star Rating Component
  const StarRating = ({ rating, size = "md", editable = false, onChange }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const sizes = {
      sm: "text-lg",
      md: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
    };

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={editable ? "button" : undefined}
            onClick={editable ? () => onChange(star) : undefined}
            onMouseEnter={editable ? () => setHoverRating(star) : undefined}
            onMouseLeave={editable ? () => setHoverRating(0) : undefined}
            className={`${sizes[size]} ${
              star <= (hoverRating || rating)
                ? "text-yellow-400"
                : "text-gray-300"
            } transition-colors duration-200 ${
              editable ? "cursor-pointer hover:scale-110" : ""
            }`}
            disabled={!editable}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  // Rating Category Component
  const RatingCategory = ({ label, value, editable = false, onChange }) => {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-700">{label}</h4>
          <p className="text-sm text-gray-500">Rate from 0 to 5</p>
        </div>
        <div className="flex items-center space-x-4">
          <StarRating rating={value} editable={editable} onChange={onChange} />
          <span className="text-lg font-bold text-gray-800 min-w-[40px] text-right">
            {value.toFixed(1)}
          </span>
        </div>
      </div>
    );
  };

  // Toast Component
  const Toast = ({ toast }) => {
    const bgColor = {
      success: "bg-green-50 border-green-200",
      error: "bg-red-50 border-red-200",
      warning: "bg-yellow-50 border-yellow-200",
      info: "bg-blue-50 border-blue-200",
    };

    const iconColor = {
      success: "text-green-500",
      error: "text-red-500",
      warning: "text-yellow-500",
      info: "text-blue-500",
    };

    const icon = {
      success: <FaCheck className="text-green-500 text-xl" />,
      error: <FaExclamationTriangle className="text-red-500 text-xl" />,
      warning: <FaExclamationTriangle className="text-yellow-500 text-xl" />,
      info: <FaExclamationTriangle className="text-blue-500 text-xl" />,
    };

    return (
      <div
        className={`fixed right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border ${
          bgColor[toast.type]
        } overflow-hidden animate-slideIn mb-2`}
      >
        <div className="flex p-4">
          <div className="flex-shrink-0">{icon[toast.type]}</div>
          <div className="ml-3 flex-1">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
          </div>
        </div>
        <div className={`h-1 ${iconColor[toast.type]} animate-progress`} />
      </div>
    );
  };

  // Toast Container
  const ToastContainer = () => {
    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    );
  };

  // Overall Rating Stats Component
  const RatingStats = ({ averageRating }) => {
    if (!averageRating) return null;

    const categories = [
      { label: "Display", value: averageRating.display, color: "bg-blue-500" },
      {
        label: "Performance",
        value: averageRating.performance,
        color: "bg-green-500",
      },
      { label: "Camera", value: averageRating.camera, color: "bg-purple-500" },
      {
        label: "Battery",
        value: averageRating.battery,
        color: "bg-yellow-500",
      },
      { label: "Design", value: averageRating.design, color: "bg-pink-500" },
    ];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Rating Statistics
            </h3>
            <p className="text-sm text-gray-500">
              Average ratings for {selectedSmartphone?.name}
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {Number.isFinite(Number(averageRating?.averageRating))
                ? Number(averageRating.averageRating).toFixed(1)
                : "N/A"}
            </div>
            <div className="flex items-center justify-center mt-1">
              <StarRating rating={Number(averageRating?.averageRating) || 0} />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {averageRating.totalRatings || 0} total ratings
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {category.label}
                </span>
                <span className="font-bold text-gray-900">
                  {Number.isFinite(Number(category.value))
                    ? Number(category.value).toFixed(1)
                    : "0.0"}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${category.color} transition-all duration-500`}
                  style={{
                    width: `${
                      Number.isFinite(Number(category.value))
                        ? (Number(category.value) / 5) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Rating Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage user ratings for smartphones
            </p>
          </div>
          <button
            onClick={fetchSmartphones}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <FaSync className={`${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search smartphones by name, brand, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("details")}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === "details"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Details View
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Smartphones List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Smartphones</h2>
              <p className="text-sm text-gray-500">
                Select a smartphone to manage ratings
              </p>
            </div>

            <div className="overflow-y-auto max-h-[600px]">
              {loading ? (
                <div className="p-8 text-center">
                  <FaSpinner className="animate-spin text-3xl text-blue-500 mx-auto mb-3" />
                  <p className="text-gray-500">Loading smartphones...</p>
                </div>
              ) : sortedSmartphones.length === 0 ? (
                <div className="p-8 text-center">
                  <FaExclamationTriangle className="text-3xl text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No smartphones found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sortedSmartphones.map((phone) => (
                    <div
                      key={phone.id}
                      onClick={() => {
                        setSelectedSmartphone(phone);
                        setEditMode(false);
                      }}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedSmartphone?.id === phone.id
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {phone.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {phone.brand} • {phone.model}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            {phone.category}
                          </span>
                          <FaEye className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Rating Management */}
        <div className="lg:col-span-2">
          {selectedSmartphone ? (
            <div className="space-y-6">
              {/* Selected Smartphone Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedSmartphone.name}
                    </h2>
                    <p className="text-gray-500">
                      {selectedSmartphone.brand} {selectedSmartphone.model}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <FaEdit />
                      <span>{editMode ? "Cancel Edit" : "Edit Rating"}</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <FaTrash />
                      <span>Delete All</span>
                    </button>
                  </div>
                </div>

                {/* Rating Stats */}
                <RatingStats averageRating={averageRating} />
              </div>

              {/* Edit/Add Rating Form */}
              {editMode && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {ratings.length > 0 ? "Update Rating" : "Add New Rating"}
                  </h3>

                  <form
                    onSubmit={
                      ratings.length > 0
                        ? handleUpdateRating
                        : handleSubmitNewRating
                    }
                  >
                    <div className="space-y-4 mb-6">
                      <RatingCategory
                        label="Display Quality"
                        value={editForm.display}
                        editable={true}
                        onChange={(value) =>
                          setEditForm({ ...editForm, display: value })
                        }
                      />

                      <RatingCategory
                        label="Performance"
                        value={editForm.performance}
                        editable={true}
                        onChange={(value) =>
                          setEditForm({ ...editForm, performance: value })
                        }
                      />

                      <RatingCategory
                        label="Camera Quality"
                        value={editForm.camera}
                        editable={true}
                        onChange={(value) =>
                          setEditForm({ ...editForm, camera: value })
                        }
                      />

                      <RatingCategory
                        label="Battery Life"
                        value={editForm.battery}
                        editable={true}
                        onChange={(value) =>
                          setEditForm({ ...editForm, battery: value })
                        }
                      />

                      <RatingCategory
                        label="Design & Build"
                        value={editForm.design}
                        editable={true}
                        onChange={(value) =>
                          setEditForm({ ...editForm, design: value })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {(
                            (editForm.display +
                              editForm.performance +
                              editForm.camera +
                              editForm.battery +
                              editForm.design) /
                            5
                          ).toFixed(1)}
                        </div>
                        <p className="text-sm text-gray-500">Overall Rating</p>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {loading ? (
                            <FaSpinner className="animate-spin" />
                          ) : ratings.length > 0 ? (
                            "Update Rating"
                          ) : (
                            "Submit Rating"
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Individual Ratings List (if we had endpoint for all ratings) */}
              {viewMode === "list" && ratings.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">
                      All Ratings
                    </h3>
                    <p className="text-sm text-gray-500">
                      Individual user ratings
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {ratings.map((rating, index) => (
                      <div key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="font-bold text-blue-600">U</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                User Rating
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  rating.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {Number.isFinite(Number(rating?.overall_rating))
                                ? Number(rating.overall_rating).toFixed(1)
                                : "N/A"}
                            </div>
                            <StarRating
                              rating={Number(rating?.overall_rating) || 0}
                              size="sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
                          {[
                            { label: "Display", value: rating.display },
                            { label: "Performance", value: rating.performance },
                            { label: "Camera", value: rating.camera },
                            { label: "Battery", value: rating.battery },
                            { label: "Design", value: rating.design },
                          ].map((cat) => (
                            <div
                              key={cat.label}
                              className="text-center p-2 bg-gray-50 rounded"
                            >
                              <p className="text-xs text-gray-500">
                                {cat.label}
                              </p>
                              <p className="font-bold text-gray-900">
                                {Number.isFinite(Number(cat.value))
                                  ? Number(cat.value).toFixed(1)
                                  : "N/A"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FaStar className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Select a Smartphone
              </h3>
              <p className="text-gray-500">
                Choose a smartphone from the list to view and manage its ratings
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">
                Delete All Ratings
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete all ratings for{" "}
                <span className="font-bold">{selectedSmartphone?.name}</span>?
                This action cannot be undone.
              </p>

              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllRatings}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    "Delete All Ratings"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRatingManagement;
