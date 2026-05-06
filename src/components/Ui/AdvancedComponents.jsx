import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit2,
} from "react-icons/fa";

/**
 * Advanced Data Table Component
 * Feature-rich table with sorting, filtering, pagination
 */
export const AdvancedDataTable = ({
  columns,
  data = [],
  onRowClick = null,
  onEdit = null,
  onDelete = null,
  selectable = true,
  sortable = true,
  filterable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  title = "",
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState("");

  // Filter data
  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(filterText.toLowerCase()),
    ),
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate data
  const startIdx = (currentPage - 1) * pageSize;
  const displayedData = pagination
    ? sortedData.slice(startIdx, startIdx + pageSize)
    : sortedData;
  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === displayedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(displayedData.map((_, i) => startIdx + i)));
    }
  };

  const handleSelectRow = (idx) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedRows(newSelected);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || filterable || exportable) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {title && (
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          )}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {filterable && (
              <div className="relative flex-1 sm:flex-none">
                <Filter
                  className="absolute left-3 top-3 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Filter..."
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus-ring"
                />
              </div>
            )}
            {exportable && (
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download size={16} />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && selectedRows.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-blue-900 font-medium">
            {selectedRows.size} selected
          </p>
          <button className="text-red-600 hover:text-red-700 font-medium">
            Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.size === displayedData.length &&
                      displayedData.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-semibold text-gray-700 text-sm ${
                    sortable ? "cursor-pointer hover:bg-gray-100" : ""
                  }`}
                  onClick={() => sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortable &&
                      sortConfig.key === col.key &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayedData.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.has(startIdx + idx)}
                      onChange={() => handleSelectRow(startIdx + idx)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-900">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {startIdx + 1} to{" "}
            {Math.min(startIdx + pageSize, sortedData.length)} of{" "}
            {sortedData.length}
          </p>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  page === currentPage
                    ? "bg-purple-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Form Component
 */
export const Form = ({
  children,
  onSubmit,
  layout = "vertical",
  gap = "gap-6",
  className = "",
}) => {
  const layoutClass =
    layout === "horizontal"
      ? "flex flex-col md:flex-row md:items-end md:gap-4"
      : "flex flex-col";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={`${layoutClass} ${gap} ${className}`}
    >
      {children}
    </form>
  );
};

/**
 * Modal Component
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className = "",
}) => {
  if (!isOpen) return null;

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[size];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-xl shadow-xl ${sizeClass} w-full max-h-screen overflow-y-auto`}
      >
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className={`p-6 ${className}`}>{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Tabs Component
 */
export const Tabs = ({
  tabs = [],
  defaultTab = 0,
  onChange = null,
  variant = "default",
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleChange = (idx) => {
    setActiveTab(idx);
    onChange?.(idx);
  };

  const variantClass = {
    default: "border-b border-gray-200",
    pills: "bg-gray-100 rounded-lg p-1 w-fit",
  }[variant];

  return (
    <div className="w-full">
      {/* Tab buttons */}
      <div className={`flex gap-1 ${variantClass}`}>
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => handleChange(idx)}
            className={`px-4 py-2 font-medium text-sm transition-colors rounded-t-lg ${
              activeTab === idx
                ? variant === "pills"
                  ? "bg-white text-purple-600 shadow"
                  : "text-purple-600 border-b-2 border-purple-600"
                : variant === "pills"
                  ? "text-gray-600"
                  : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">{tabs[activeTab]?.content}</div>
    </div>
  );
};

/**
 * Accordion Component
 */
export const Accordion = ({ items = [], allowMultiple = false }) => {
  const [openItems, setOpenItems] = useState(new Set([0]));

  const toggleItem = (idx) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(idx)) {
      newOpen.delete(idx);
    } else {
      if (!allowMultiple) newOpen.clear();
      newOpen.add(idx);
    }
    setOpenItems(newOpen);
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleItem(idx)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">{item.title}</span>
            <ChevronDown
              size={20}
              className={`text-gray-500 transition-transform ${
                openItems.has(idx) ? "rotate-180" : ""
              }`}
            />
          </button>
          {openItems.has(idx) && (
            <div className="px-4 py-3 border-t border-gray-200 text-gray-700">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default {
  AdvancedDataTable,
  Form,
  Modal,
  Tabs,
  Accordion,
};
