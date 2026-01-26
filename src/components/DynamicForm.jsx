import React, { useState } from "react";
import { FaPlus, FaTrash, FaChevronDown, FaChevronRight } from "react-icons/fa";

/**
 * DynamicForm - Reusable dynamic form renderer for nested JSON specifications
 *
 * Props:
 * - data: The JSON object to render (can have nested objects, arrays, primitives)
 * - onChange: Callback when data changes (receives updated data)
 * - onNestedChange: Callback for nested primitive updates (receives path array and value)
 * - fieldPath: Array representing the path to this field for nested tracking
 * - level: Current nesting level (for styling)
 * - showAddButton: Whether to show "Add custom field" button
 * - onAddField: Callback when adding a new field
 */
const DynamicForm = ({
  data = {},
  onChange,
  onNestedChange,
  fieldPath = [],
  level = 0,
  showAddButton = false,
  onAddField,
}) => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrimitiveChange = (key, value) => {
    const newData = { ...data, [key]: value };
    onChange(newData);
  };

  const handleNestedObjectChange = (key, nestedKey, value) => {
    const newData = { ...data };
    if (!newData[key] || typeof newData[key] !== "object") {
      newData[key] = {};
    }
    newData[key] = { ...newData[key], [nestedKey]: value };
    onChange(newData);

    // Also call onNestedChange if provided
    if (onNestedChange) {
      const path = [...fieldPath, key, nestedKey];
      onNestedChange(path, value);
    }
  };

  const handleArrayChange = (key, index, itemKey, value) => {
    const newData = { ...data };
    if (!Array.isArray(newData[key])) {
      newData[key] = [];
    }
    const newArray = [...newData[key]];
    newArray[index] = { ...newArray[index], [itemKey]: value };
    newData[key] = newArray;
    onChange(newData);
  };

  const addArrayItem = (key, template = {}) => {
    const newData = { ...data };
    if (!Array.isArray(newData[key])) {
      newData[key] = [];
    }
    newData[key] = [...newData[key], { ...template }];
    onChange(newData);
  };

  const removeArrayItem = (key, index) => {
    const newData = { ...data };
    if (Array.isArray(newData[key])) {
      newData[key] = newData[key].filter((_, i) => i !== index);
      onChange(newData);
    }
  };

  const handleJsonChange = (key, value) => {
    try {
      const parsed = JSON.parse(value);
      const newData = { ...data, [key]: parsed };
      onChange(newData);
    } catch (err) {
      // If not valid JSON, store as string
      const newData = { ...data, [key]: value };
      onChange(newData);
    }
  };

  const formatLabel = (key) => {
    return key
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const entries = Object.entries(data);

  return (
    <div
      className={`space-y-3 ${level > 0 ? "ml-2 pl-3 border-l-2 border-gray-200" : ""}`}
    >
      {entries.map(([key, value]) => {
        const isObject =
          value && typeof value === "object" && !Array.isArray(value);
        const isArray = Array.isArray(value);
        const isPrimitive = !isObject && !isArray;
        const isRatingObject =
          isObject &&
          typeof value === "object" &&
          ("score" in value || "images" in value || "description" in value);

        return (
          <div key={key} className="space-y-2">
            {/* Primitive Value */}
            {isPrimitive && (
              <div className="p-2.5 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <label className="block text-xs font-semibold text-gray-700 mb-2 capitalize">
                  {formatLabel(key)}
                </label>
                <input
                  type="text"
                  value={value !== undefined ? String(value) : ""}
                  onChange={(e) => handlePrimitiveChange(key, e.target.value)}
                  placeholder={`Enter ${formatLabel(key).toLowerCase()}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}

            {/* Nested Object */}
            {isObject && !isRatingObject && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(key)}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-150 flex items-center justify-between transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-gray-700 capitalize">
                    {formatLabel(key)}
                  </span>
                  {expandedSections[key] ? (
                    <FaChevronDown className="text-xs text-gray-500" />
                  ) : (
                    <FaChevronRight className="text-xs text-gray-500" />
                  )}
                </button>

                {expandedSections[key] && (
                  <div className="p-3 bg-white space-y-3">
                    {Object.entries(value).map(([nestedKey, nestedValue]) => {
                      const nestedIsObject =
                        nestedValue &&
                        typeof nestedValue === "object" &&
                        !Array.isArray(nestedValue);
                      const nestedIsArray = Array.isArray(nestedValue);
                      const nestedIsPrimitive =
                        !nestedIsObject && !nestedIsArray;

                      if (nestedIsPrimitive) {
                        return (
                          <div
                            key={nestedKey}
                            className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <label className="block text-xs font-semibold text-gray-600 mb-1 capitalize">
                              {formatLabel(nestedKey)}
                            </label>
                            <input
                              type="text"
                              value={
                                nestedValue !== undefined
                                  ? String(nestedValue)
                                  : ""
                              }
                              onChange={(e) =>
                                handleNestedObjectChange(
                                  key,
                                  nestedKey,
                                  e.target.value,
                                )
                              }
                              placeholder={`Enter ${formatLabel(nestedKey).toLowerCase()}`}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </div>
                        );
                      }

                      if (nestedIsArray) {
                        return (
                          <ArrayField
                            key={nestedKey}
                            fieldKey={key}
                            nestedKey={nestedKey}
                            items={nestedValue}
                            onItemChange={(index, itemKey, value) =>
                              handleArrayChange(key, index, itemKey, value)
                            }
                            onAddItem={() => addArrayItem(key)}
                            onRemoveItem={(index) =>
                              removeArrayItem(key, index)
                            }
                          />
                        );
                      }

                      if (nestedIsObject) {
                        return (
                          <NestedObjectField
                            key={nestedKey}
                            fieldKey={key}
                            nestedKey={nestedKey}
                            value={nestedValue}
                            onChange={(updatedValue) =>
                              handleNestedObjectChange(
                                key,
                                nestedKey,
                                updatedValue,
                              )
                            }
                          />
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Rating Object (Special Case) */}
            {isRatingObject && (
              <RatingField
                fieldKey={key}
                value={value}
                onChange={(updatedValue) =>
                  handlePrimitiveChange(key, updatedValue)
                }
              />
            )}

            {/* Array */}
            {isArray && (
              <ArrayField
                fieldKey={key}
                nestedKey={null}
                items={value}
                onItemChange={(index, itemKey, val) =>
                  handleArrayChange(key, index, itemKey, val)
                }
                onAddItem={() => addArrayItem(key)}
                onRemoveItem={(index) => removeArrayItem(key, index)}
              />
            )}
          </div>
        );
      })}

      {/* Add Custom Field Button */}
      {showAddButton && onAddField && level === 0 && (
        <button
          type="button"
          onClick={() => onAddField()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mt-4 font-medium"
        >
          <FaPlus className="text-xs" />
          <span>Add Custom Field</span>
        </button>
      )}
    </div>
  );
};

/**
 * ArrayField - Renders array items with add/remove functionality
 */
const ArrayField = ({
  fieldKey,
  nestedKey,
  items,
  onItemChange,
  onAddItem,
  onRemoveItem,
}) => {
  const [expanded, setExpanded] = useState(true);

  const label = nestedKey ? formatLabel(nestedKey) : formatLabel(fieldKey);

  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-blue-100 hover:bg-blue-150 flex items-center justify-between transition-colors text-left"
      >
        <span className="text-sm font-semibold text-blue-800 capitalize">
          {label} ({items.length})
        </span>
        {expanded ? (
          <FaChevronDown className="text-xs text-blue-600" />
        ) : (
          <FaChevronRight className="text-xs text-blue-600" />
        )}
      </button>

      {expanded && (
        <div className="p-3 bg-white space-y-3">
          {items.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No items yet</p>
          ) : (
            items.map((item, index) => (
              <ArrayItem
                key={index}
                index={index}
                item={item}
                onItemChange={(itemKey, value) =>
                  onItemChange(index, itemKey, value)
                }
                onRemove={() => onRemoveItem(index)}
              />
            ))
          )}

          <button
            type="button"
            onClick={onAddItem}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-medium mt-2"
          >
            <FaPlus className="text-xs" />
            <span>Add {label} Item</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * ArrayItem - Renders individual array items
 */
const ArrayItem = ({ index, item, onItemChange, onRemove }) => {
  const [expanded, setExpanded] = useState(false);

  // Determine if item is object, primitive, or mixed
  const isPrimitive =
    typeof item !== "object" || Array.isArray(item) || item === null;
  const isObject = typeof item === "object" && !Array.isArray(item);

  if (isPrimitive) {
    return (
      <div className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center gap-2">
        <input
          type="text"
          value={item !== undefined ? String(item) : ""}
          onChange={(e) => onItemChange(null, e.target.value)}
          placeholder="Enter value"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
        >
          <FaTrash className="text-xs" />
        </button>
      </div>
    );
  }

  if (isObject) {
    return (
      <div className="p-2 bg-gray-50 rounded border border-gray-300">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-xs font-semibold text-gray-700">
            Item {index + 1}
          </span>
          <div className="flex items-center gap-2">
            {expanded ? (
              <FaChevronDown className="text-xs text-gray-500" />
            ) : (
              <FaChevronRight className="text-xs text-gray-500" />
            )}
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
            >
              <FaTrash className="text-xs" />
            </button>
          </div>
        </button>

        {expanded && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-300">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="text-xs">
                <label className="block font-medium text-gray-600 mb-1 capitalize">
                  {formatLabel(key)}
                </label>
                <input
                  type="text"
                  value={value !== undefined ? String(value) : ""}
                  onChange={(e) => onItemChange(key, e.target.value)}
                  placeholder={`Enter ${formatLabel(key).toLowerCase()}`}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

/**
 * NestedObjectField - Handles deeply nested objects
 */
const NestedObjectField = ({ fieldKey, nestedKey, value, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  const label = formatLabel(nestedKey);

  const handleJsonEdit = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      onChange(parsed);
    } catch (err) {
      // Keep as string if invalid JSON
      onChange(jsonString);
    }
  };

  return (
    <div className="border border-purple-200 rounded-lg overflow-hidden bg-purple-50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-purple-100 hover:bg-purple-150 flex items-center justify-between transition-colors text-left"
      >
        <span className="text-sm font-semibold text-purple-800 capitalize">
          {label} (nested)
        </span>
        {expanded ? (
          <FaChevronDown className="text-xs text-purple-600" />
        ) : (
          <FaChevronRight className="text-xs text-purple-600" />
        )}
      </button>

      {expanded && (
        <div className="p-3 bg-white">
          <label className="block text-xs text-gray-600 mb-2 font-medium">
            JSON Editor
          </label>
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => handleJsonEdit(e.target.value)}
            placeholder="Edit as JSON"
            className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
            rows={6}
          />
        </div>
      )}
    </div>
  );
};

/**
 * RatingField - Specialized field for sphere_rating objects
 */
const RatingField = ({ fieldKey, value, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  const handleScoreChange = (newScore) => {
    const updated = { ...value, score: newScore };
    onChange(updated);
  };

  const handleDescriptionChange = (newDesc) => {
    const updated = { ...value, description: newDesc };
    onChange(updated);
  };

  return (
    <div className="border border-yellow-300 rounded-lg overflow-hidden bg-yellow-50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-yellow-100 hover:bg-yellow-150 flex items-center justify-between transition-colors text-left"
      >
        <span className="text-sm font-semibold text-yellow-800 capitalize">
          {formatLabel(fieldKey)} Rating
        </span>
        {expanded ? (
          <FaChevronDown className="text-xs text-yellow-600" />
        ) : (
          <FaChevronRight className="text-xs text-yellow-600" />
        )}
      </button>

      {expanded && (
        <div className="p-3 bg-white space-y-3">
          {value.score !== undefined && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Score
              </label>
              <input
                type="number"
                value={value.score}
                onChange={(e) => handleScoreChange(Number(e.target.value))}
                min="0"
                max="100"
                placeholder="0-100"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          )}

          {value.description !== undefined && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={value.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Enter description"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                rows={4}
              />
            </div>
          )}

          {value.images && Array.isArray(value.images) && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Images
              </label>
              <p className="text-xs text-gray-500 italic">
                {value.images.length} image(s)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Helper function to format labels
 */
const formatLabel = (key) => {
  return key
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default DynamicForm;
