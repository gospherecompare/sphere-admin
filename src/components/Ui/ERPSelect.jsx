import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Search, Check } from "react-icons/fa";

/**
 * Advanced Multi-Select Dropdown Component
 * Features: Searchable, multi-select, icons, badges, keyboard navigation
 */
export const ERPMultiSelect = ({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select options...",
  searchable = true,
  disabled = false,
  error,
  maxSelected,
  showCount = true,
  groupBy,
  renderOption,
  icon: Icon,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Group options if groupBy provided
  const groupedOptions = groupBy
    ? options.reduce((acc, opt) => {
        const group = opt[groupBy];
        if (!acc[group]) acc[group] = [];
        acc[group].push(opt);
        return acc;
      }, {})
    : null;

  // Filter options by search term
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Check if option is selected
  const isSelected = (optionValue) =>
    selected.some((s) => s.value === optionValue);

  // Handle option click
  const handleSelectOption = (option) => {
    if (
      maxSelected &&
      selected.length >= maxSelected &&
      !isSelected(option.value)
    ) {
      return;
    }

    const newSelected = isSelected(option.value)
      ? selected.filter((s) => s.value !== option.value)
      : [...selected, option];

    onChange(newSelected);
  };

  // Handle remove tag
  const handleRemoveTag = (value, e) => {
    e.stopPropagation();
    const newSelected = selected.filter((s) => s.value !== value);
    onChange(newSelected);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " ") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) =>
          i < filteredOptions.length - 1 ? i + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) =>
          i > 0 ? i - 1 : filteredOptions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5
          border-2 border-slate-200
          rounded-lg
          bg-white text-left
          transition-all duration-200
          focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50
          hover:border-slate-300
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-50" : ""}
          ${isOpen ? "border-blue-600 ring-2 ring-blue-50" : ""}
        `}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {Icon && (
              <Icon className="text-slate-400 flex-shrink-0" size={18} />
            )}

            {selected.length === 0 ? (
              <span className="text-slate-400">{placeholder}</span>
            ) : (
              <div className="flex items-center flex-wrap gap-2">
                {selected.slice(0, 2).map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
                  >
                    {option.label}
                    <button
                      onClick={(e) => handleRemoveTag(option.value, e)}
                      className="hover:text-blue-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {selected.length > 2 && (
                  <span className="text-sm text-slate-600 font-medium">
                    +{selected.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>

          <ChevronDown
            size={18}
            className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Count Badge */}
      {showCount && selected.length > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
          {selected.length}
        </span>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-lg shadow-lg z-50 animate-slide-up">
          {/* Search Input */}
          {searchable && (
            <div className="p-3 border-b border-slate-100 sticky top-0 bg-white rounded-t-lg">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 text-sm"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                No options found
              </div>
            ) : groupedOptions ? (
              // Grouped Options
              Object.entries(
                filteredOptions.reduce((acc, opt) => {
                  const group = opt[groupBy];
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(opt);
                  return acc;
                }, {}),
              ).map(([group, groupItems]) => (
                <div key={group}>
                  {/* Group Header */}
                  <div className="px-4 py-2 bg-slate-50 font-semibold text-sm text-slate-700 border-b border-slate-100">
                    {group}
                  </div>

                  {/* Group Items */}
                  {groupItems.map((option, idx) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      className={`
                        w-full px-4 py-2.5 text-left flex items-center gap-3
                        transition-all duration-150
                        ${highlightedIndex === filteredOptions.indexOf(option) ? "bg-blue-50" : "hover:bg-slate-50"}
                        ${isSelected(option.value) ? "bg-blue-50 border-l-4 border-blue-600" : ""}
                      `}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected(option.value) ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}
                      >
                        {isSelected(option.value) && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>

                      {/* Option Content */}
                      <div className="flex-1 min-w-0">
                        {renderOption ? (
                          renderOption(option)
                        ) : (
                          <div className="flex items-center gap-2">
                            {option.icon && (
                              <span className="text-lg flex-shrink-0">
                                {option.icon}
                              </span>
                            )}
                            <div className="truncate">
                              <p className="font-medium text-slate-900 truncate">
                                {option.label}
                              </p>
                              {option.description && (
                                <p className="text-xs text-slate-500">
                                  {option.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Badge */}
                      {option.badge && (
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded flex-shrink-0">
                          {option.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              // Flat Options
              filteredOptions.map((option, idx) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={
                    maxSelected &&
                    selected.length >= maxSelected &&
                    !isSelected(option.value)
                  }
                  className={`
                    w-full px-4 py-2.5 text-left flex items-center gap-3
                    transition-all duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${highlightedIndex === idx ? "bg-blue-50" : "hover:bg-slate-50"}
                    ${isSelected(option.value) ? "bg-blue-50 border-l-4 border-blue-600" : ""}
                  `}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected(option.value) ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}
                  >
                    {isSelected(option.value) && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>

                  {/* Option Content */}
                  <div className="flex-1 min-w-0">
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <div className="flex items-center gap-2">
                        {option.icon && (
                          <span className="text-lg flex-shrink-0">
                            {option.icon}
                          </span>
                        )}
                        <div className="truncate">
                          <p className="font-medium text-slate-900 truncate">
                            {option.label}
                          </p>
                          {option.description && (
                            <p className="text-xs text-slate-500">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  {option.badge && (
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded flex-shrink-0">
                      {option.badge}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Max Selected Warning */}
          {maxSelected && selected.length >= maxSelected && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 font-medium">
              Maximum {maxSelected} items selected
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 mt-2 text-red-600">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Single Select Dropdown (Similar to Multi-Select but only one selection)
 */
export const ERPSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  searchable = true,
  disabled = false,
  error,
  icon: Icon,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelectOption = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " ") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) =>
          i < filteredOptions.length - 1 ? i + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) =>
          i > 0 ? i - 1 : filteredOptions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5
          border-2 border-slate-200
          rounded-lg
          bg-white text-left
          transition-all duration-200
          focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50
          hover:border-slate-300
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-50" : ""}
          ${isOpen ? "border-blue-600 ring-2 ring-blue-50" : ""}
        `}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {Icon && (
              <Icon className="text-slate-400 flex-shrink-0" size={18} />
            )}
            {selectedOption ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selectedOption.icon && (
                  <span className="text-lg flex-shrink-0">
                    {selectedOption.icon}
                  </span>
                )}
                <span className="text-slate-900 font-medium truncate">
                  {selectedOption.label}
                </span>
              </div>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            size={18}
            className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-lg shadow-lg z-50 animate-slide-up">
          {/* Search Input */}
          {searchable && (
            <div className="p-3 border-b border-slate-100 sticky top-0 bg-white rounded-t-lg">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 text-sm"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, idx) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`
                    w-full px-4 py-2.5 text-left flex items-center gap-3
                    transition-all duration-150
                    ${highlightedIndex === idx ? "bg-blue-50" : "hover:bg-slate-50"}
                    ${value === option.value ? "bg-blue-50 border-l-4 border-blue-600" : ""}
                  `}
                >
                  {/* Checkmark */}
                  {value === option.value && (
                    <Check size={18} className="text-blue-600 flex-shrink-0" />
                  )}

                  {/* Option Content */}
                  <div className="flex-1">
                    {option.icon && (
                      <span className="text-lg flex-shrink-0">
                        {option.icon}
                      </span>
                    )}
                    <p className="font-medium text-slate-900">{option.label}</p>
                    {option.description && (
                      <p className="text-xs text-slate-500">
                        {option.description}
                      </p>
                    )}
                  </div>

                  {/* Badge */}
                  {option.badge && (
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded flex-shrink-0">
                      {option.badge}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 mt-2 text-red-600">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export default { ERPMultiSelect, ERPSelect };
