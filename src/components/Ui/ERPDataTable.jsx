import React, { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  Trash2,
  Edit2,
  Share2,
  MoreVertical,
} from "react-icons/fa";

/**
 * Advanced ERP Data Table Component
 * Desktop: Full table | Mobile: Card layout
 * Features: Sorting, Filtering, Pagination, Selection, Actions
 */
export const ERPDataTable = ({
  columns = [],
  data = [],
  onRowClick,
  onEdit,
  onDelete,
  onShare,
  onExport,
  selectable = true,
  sortable = true,
  filterable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  title = "",
  description = "",
  actions = [],
  loading = false,
  emptyState,
  className = "",
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState("");
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // Filter data
  const filteredData = useMemo(
    () =>
      data.filter((row) =>
        columns.some((col) =>
          String(row[col.key] || "")
            .toLowerCase()
            .includes(filterText.toLowerCase()),
        ),
      ),
    [data, filterText, columns],
  );

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    if (!sortConfig.key) return sorted;

    return sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

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
    <div className={`w-full space-y-4 ${className}`}>
      {/* Header */}
      {(title ||
        description ||
        filterable ||
        exportable ||
        actions.length > 0) && (
        <div className="space-y-4">
          {(title || description) && (
            <div>
              {title && (
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              )}
              {description && (
                <p className="text-sm text-slate-600 mt-1">{description}</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {filterable && (
              <div className="relative w-full sm:w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50"
                />
              </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto">
              {exportable && onExport && (
                <button
                  onClick={onExport}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-all duration-200"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}

              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    action.variant === "danger"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : action.variant === "success"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {action.icon && <action.icon size={18} />}
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && selectedRows.size > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-blue-900 font-semibold">
            {selectedRows.size} selected
          </p>
          <button
            onClick={() => setSelectedRows(new Set())}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Clear
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin text-blue-600 text-3xl">⏳</div>
        </div>
      )}

      {/* Desktop Table */}
      {!loading && (
        <>
          <div className="hidden lg:block overflow-x-auto rounded-lg border-2 border-slate-200 bg-white">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  {selectable && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedRows.size === displayedData.length &&
                          displayedData.length > 0
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer"
                      />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-6 py-3 text-left font-semibold text-slate-900 text-sm ${
                        sortable ? "cursor-pointer hover:bg-slate-100" : ""
                      }`}
                      onClick={() => sortable && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        {sortable &&
                          sortConfig.key === col.key &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp size={16} className="text-blue-600" />
                          ) : (
                            <ChevronDown size={16} className="text-blue-600" />
                          ))}
                      </div>
                    </th>
                  ))}
                  {(onEdit || onDelete || onShare) && (
                    <th className="px-6 py-3 text-right font-semibold text-slate-900 text-sm">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRows.has(startIdx + idx)}
                          onChange={() => handleSelectRow(startIdx + idx)}
                          className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-6 py-4 text-sm text-slate-900"
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key]}
                      </td>
                    ))}
                    {(onEdit || onDelete || onShare) && (
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1 relative">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {onShare && (
                            <button
                              onClick={() => onShare(row)}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Share"
                            >
                              <Share2 size={18} />
                            </button>
                          )}

                          {onDelete && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenActionMenu(
                                    openActionMenu === idx ? null : idx,
                                  )
                                }
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="More"
                              >
                                <MoreVertical size={18} />
                              </button>

                              {openActionMenu === idx && (
                                <button
                                  onClick={() => {
                                    onDelete(row);
                                    setOpenActionMenu(null);
                                  }}
                                  className="absolute right-0 top-full mt-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap z-50"
                                >
                                  <Trash2 size={16} className="inline mr-2" />
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {displayedData.map((row, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-slate-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
              >
                {/* Card Header with Checkbox */}
                <div className="flex items-start justify-between gap-3">
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={selectedRows.has(startIdx + idx)}
                      onChange={() => handleSelectRow(startIdx + idx)}
                      className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {columns[0] && row[columns[0].key]}
                    </p>
                  </div>
                </div>

                {/* Card Content */}
                <div className="space-y-2 text-sm">
                  {columns.slice(1).map((col) => (
                    <div
                      key={col.key}
                      className="flex justify-between items-start gap-2"
                    >
                      <span className="text-slate-600 font-medium">
                        {col.label}:
                      </span>
                      <span className="text-slate-900 text-right">
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Card Actions */}
                {(onEdit || onDelete || onShare) && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} className="inline mr-1" />
                        Edit
                      </button>
                    )}
                    {onShare && (
                      <button
                        onClick={() => onShare(row)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                      >
                        <Share2 size={16} className="inline mr-1" />
                        Share
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="inline mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {displayedData.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-slate-200">
              {emptyState ? (
                emptyState
              ) : (
                <>
                  <p className="text-slate-600 font-medium">No records found</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Try adjusting your search or filters
                  </p>
                </>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-slate-600">
                Showing {startIdx + 1} to{" "}
                {Math.min(startIdx + pageSize, sortedData.length)} of{" "}
                {sortedData.length} records
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  ← Previous
                </button>

                <div className="flex gap-2 items-center">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          page === currentPage
                            ? "bg-blue-600 text-white"
                            : "border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ERPDataTable;
