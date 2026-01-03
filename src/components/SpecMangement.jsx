import React, { useState, useEffect } from "react";
import {
  FaCog,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaMicrochip,
  FaHdd,
  FaRulerCombined,
} from "react-icons/fa";
import Cookies from "js-cookie";

const SpecificationsManager = () => {
  // State management
  const [specs, setSpecs] = useState([]);
  const [filteredSpecs, setFilteredSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    ram: "",
    storage: "",
    long: "",
  });
  const [deleteId, setDeleteId] = useState(null);

  const itemsPerPage = 10;

  // Fetch specifications on component mount
  useEffect(() => {
    fetchSpecs();
  }, []);

  // Filter specs when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = specs.filter(
        (spec) =>
          (spec.ram && spec.ram.toString().includes(searchTerm)) ||
          (spec.storage && spec.storage.toString().includes(searchTerm)) ||
          (spec.long && spec.long.toString().includes(searchTerm)) ||
          spec.id.toString().includes(searchTerm)
      );
      setFilteredSpecs(filtered);
      setCurrentPage(1);
    } else {
      setFilteredSpecs(specs);
    }
  }, [searchTerm, specs]);

  // Calculate statistics
  const stats = {
    ramCount: specs.filter((spec) => spec.ram).length,
    storageCount: specs.filter((spec) => spec.storage).length,
    longCount: specs.filter((spec) => spec.long).length,
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredSpecs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredSpecs.length);
  const currentItems = filteredSpecs.slice(startIndex, endIndex);

  // API Functions
  const fetchSpecs = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/specs", {
        headers: {
          Authorization: `Bearer ${Cookies.get("authToken") || "demo-token"}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setSpecs(data.data || []);
      setFilteredSpecs(data.data || []);
      showToast("Success", "Specifications loaded successfully", "success");
    } catch (error) {
      console.error("Error fetching specs:", error);
      showToast("Error", "Failed to load specifications", "error");
    } finally {
      setLoading(false);
    }
  };

  const createSpec = async () => {
    const { ram, storage, long } = formData;

    if (!ram && !storage && !long) {
      showToast("Validation Error", "At least one field is required", "error");
      return;
    }

    const specData = {
      ram: ram || null,
      storage: storage || null,
      long: long || null,
    };

    try {
      const response = await fetch("http://localhost:5000/api/specs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Cookies.get("authToken") || "demo-token"}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(specData),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      showToast("Success", "Specification created successfully", "success");
      setShowModal(false);
      resetForm();
      fetchSpecs();
    } catch (error) {
      console.error("Error creating spec:", error);
      showToast("Error", "Failed to create specification", "error");
    }
  };

  const deleteSpec = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/specs/${deleteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${Cookies.get("authToken") || "demo-token"}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      showToast("Success", "Specification deleted successfully", "success");
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchSpecs();
    } catch (error) {
      console.error("Error deleting spec:", error);
      showToast("Error", "Failed to delete specification", "error");
    }
  };

  // Helper Functions
  const showToast = (title, message, type = "success") => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      id: "",
      ram: "",
      storage: "",
      long: "",
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (spec) => {
    setFormData({
      id: spec.id,
      ram: spec.ram || "",
      storage: spec.storage || "",
      long: spec.long || "",
    });
    setShowModal(true);
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Toast component
  const Toast = ({ toast }) => {
    if (!toast) return null;

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
      success: <FaCheckCircle className="text-green-500 text-xl" />,
      error: <FaExclamationTriangle className="text-red-500 text-xl" />,
      warning: <FaExclamationTriangle className="text-yellow-500 text-xl" />,
      info: <FaInfoCircle className="text-blue-500 text-xl" />,
    };

    return (
      <div
        className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border ${
          bgColor[toast.type]
        } overflow-hidden animate-slideIn`}
      >
        <div className="flex p-4">
          <div className="flex-shrink-0">{icon[toast.type]}</div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
          </div>
        </div>
        <div
          className={`h-1 ${
            toast.type === "success"
              ? "bg-green-500"
              : toast.type === "error"
              ? "bg-red-500"
              : toast.type === "warning"
              ? "bg-yellow-500"
              : "bg-blue-500"
          }`}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="pb-5 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                RAM/Storage Specifications
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage server specifications including RAM, Storage, and Long
                values
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm hover:from-blue-800 hover:to-blue-600"
              >
                <FaPlus className="mr-2" /> Add New Spec
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaMicrochip className="text-blue-500 text-2xl" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total RAM Entries
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.ramCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaHdd className="text-green-500 text-2xl" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Storage Entries
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.storageCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaRulerCombined className="text-purple-500 text-2xl" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Long Values
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.longCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">
                All Specifications
              </h3>
              <div className="flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search specs..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                  />
                  <div className="absolute left-3 top-2.5">
                    <FaSearch className="text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={fetchSpecs}
                  className="ml-3 p-2 text-gray-600 hover:text-blue-600"
                  disabled={loading}
                >
                  <FaSyncAlt className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-200 border-t-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading specifications...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredSpecs.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-gray-300 text-5xl mb-4">
                <FaHdd />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No specifications found
              </h3>
              <p className="mt-1 text-gray-600">
                Get started by creating a new specification entry.
              </p>
              <button
                onClick={openAddModal}
                className="mt-4 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-2 rounded-lg font-medium"
              >
                Add New Specification
              </button>
            </div>
          )}

          {/* Table */}
          {!loading && filteredSpecs.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RAM
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Storage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Long
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((spec) => (
                      <tr key={spec.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{spec.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {spec.ram ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {spec.ram} GB
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {spec.storage ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {spec.storage} GB
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {spec.long ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {spec.long}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openEditModal(spec)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => openDeleteModal(spec.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">{endIndex}</span> of{" "}
                      <span className="font-medium">
                        {filteredSpecs.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40"
              aria-hidden="true"
            />

            <div className="relative z-50 bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full w-full mx-2">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaCog className="text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {formData.id
                        ? "Edit Specification"
                        : "Add New Specification"}
                    </h3>
                    <div className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="ram"
                            className="block text-sm font-medium text-gray-700"
                          >
                            RAM (GB)
                          </label>
                          <input
                            type="number"
                            id="ram"
                            name="ram"
                            value={formData.ram}
                            onChange={handleFormChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Enter RAM in gigabytes
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor="storage"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Storage (GB)
                          </label>
                          <input
                            type="number"
                            id="storage"
                            name="storage"
                            value={formData.storage}
                            onChange={handleFormChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Enter storage capacity in gigabytes
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor="long"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Long Value
                          </label>
                          <input
                            type="number"
                            id="long"
                            name="long"
                            value={formData.long}
                            onChange={handleFormChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Enter the long measurement value
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={createSpec}
                  className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-2 rounded-lg font-medium sm:ml-3 sm:w-auto sm:text-sm hover:from-blue-800 hover:to-blue-600"
                >
                  {formData.id ? "Update Specification" : "Save Specification"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-3 sm:mt-0 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40"
              aria-hidden="true"
            />

            <div className="relative z-50 bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full w-full mx-2">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaExclamationTriangle className="text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Specification
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this specification? This
                        action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={deleteSpec}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 sm:mt-0 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationsManager;
