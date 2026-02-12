import React, { useMemo, useState } from "react";
import { FaChevronDown, FaChevronRight, FaPlus, FaTrash } from "react-icons/fa";

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const ACRONYM_MAP = {
  ai: "AI",
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  rom: "ROM",
  os: "OS",
  ui: "UI",
  nfc: "NFC",
  usb: "USB",
  ufs: "UFS",
  fps: "FPS",
  hz: "Hz",
  ppi: "PPI",
  hdr: "HDR",
  ois: "OIS",
  eis: "EIS",
  fov: "FOV",
  sim: "SIM",
  esim: "eSIM",
  ip: "IP",
  lcd: "LCD",
  oled: "OLED",
  amoled: "AMOLED",
  ltpo: "LTPO",
  lte: "LTE",
  wifi: "Wi-Fi",
  "5g": "5G",
  "4g": "4G",
  "3g": "3G",
  "2g": "2G",
  mah: "mAh",
  ghz: "GHz",
  mhz: "MHz",
  khz: "kHz",
  gb: "GB",
  tb: "TB",
  kb: "KB",
  mb: "MB",
  qhd: "QHD",
  fhd: "FHD",
  uhd: "UHD",
  hd: "HD",
  vooc: "VOOC",
  supervooc: "SUPERVOOC",
};

const formatToken = (token) => {
  if (!token) return "";
  const lower = token.toLowerCase();
  if (ACRONYM_MAP[lower]) return ACRONYM_MAP[lower];
  if (/^\d+g$/i.test(token)) return `${token.slice(0, -1)}G`;
  if (/^\d+(?:\.\d+)?$/.test(token)) return token;
  if (/[0-9]/.test(token)) return token.toUpperCase();
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
};

const formatLabel = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(" ")
    .filter(Boolean)
    .map(formatToken)
    .join(" ");
};

const createDefaultValue = (type) => {
  switch (type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "object":
      return {};
    case "array":
      return [];
    case "null":
      return null;
    case "string":
    default:
      return "";
  }
};

const inferType = (value) => {
  if (Array.isArray(value)) return "array";
  if (isPlainObject(value)) return "object";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (value === null) return "null";
  return "string";
};

const isPrimitiveValue = (value) => {
  const t = inferType(value);
  return t === "string" || t === "number" || t === "boolean" || t === "null";
};

const PrimitiveEditor = ({ value, onChange, placeholder }) => {
  const type = inferType(value);

  if (type === "boolean") {
    return (
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(!!e.target.checked)}
          title="Toggle true/false"
          aria-label="Toggle true/false"
          className="h-4 w-4"
        />
        <span>{value ? "True" : "False"}</span>
      </label>
    );
  }

  if (type === "number") {
    return (
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "") {
            onChange(null);
            return;
          }
          const n = Number(next);
          onChange(Number.isFinite(n) ? n : null);
        }}
        placeholder={placeholder}
        title={placeholder || "Enter a number"}
        aria-label={placeholder || "Enter a number"}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    );
  }

  return (
    <input
      type="text"
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  );
};

const KeyRow = ({
  name,
  value,
  onChange,
  onRemove,
  level,
  hiddenKeys,
  getLabel,
  getHelp,
  getPlaceholder,
  arrayItemPlaceholder,
  labelOverrides,
  helpText,
  placeholderOverrides,
  arrayItemPlaceholderOverrides,
}) => {
  const nested = isPlainObject(value) || Array.isArray(value);
  const [expanded, setExpanded] = useState(level <= 1);

  if (hiddenKeys.includes(name)) return null;
  const label = getLabel(name);
  const help = getHelp(name);
  const placeholder = getPlaceholder(name);
  const arrayItemPlaceholderForKey =
    arrayItemPlaceholder ||
    (arrayItemPlaceholderOverrides ? arrayItemPlaceholderOverrides[name] : "");

  if (!nested) {
    return (
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700">
              {label}
            </label>
            {help ? (
              <p className="text-[11px] text-gray-500 mt-1">{help}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-600 hover:text-red-700"
            title="Remove field"
          >
            <FaTrash className="text-xs" />
          </button>
        </div>
        <PrimitiveEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder || `Enter ${label}`}
        />
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-100">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-2 text-left min-w-0"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <FaChevronDown className="text-xs text-gray-500 flex-shrink-0" />
          ) : (
            <FaChevronRight className="text-xs text-gray-500 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-gray-700 truncate">
            {label}
          </span>
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-red-600 hover:text-red-700 flex-shrink-0"
          title="Remove field"
        >
          <FaTrash className="text-xs" />
        </button>
      </div>

      {expanded && (
        <div className="p-3">
          {help ? (
            <p className="text-xs text-gray-500 mb-3">{help}</p>
          ) : null}
          <DynamicForm
            data={value}
            onChange={onChange}
            level={level + 1}
            hiddenKeys={hiddenKeys}
            labelOverrides={labelOverrides}
            helpText={helpText}
            placeholderOverrides={placeholderOverrides}
            arrayItemPlaceholderOverrides={arrayItemPlaceholderOverrides}
            arrayItemPlaceholder={arrayItemPlaceholderForKey}
          />
        </div>
      )}
    </div>
  );
};

const ObjectEditor = ({
  data,
  onChange,
  level,
  hiddenKeys,
  labelOverrides,
  helpText,
  placeholderOverrides,
  arrayItemPlaceholderOverrides,
  arrayItemPlaceholder,
}) => {
  const keys = useMemo(() => {
    if (!isPlainObject(data)) return [];
    return Object.keys(data).filter((k) => !hiddenKeys.includes(k));
  }, [data, hiddenKeys]);

  const [newKey, setNewKey] = useState("");
  const [newType, setNewType] = useState("string");

  const addField = () => {
    const key = newKey.trim();
    if (!key) return;
    if (Object.prototype.hasOwnProperty.call(data, key)) return;
    const next = { ...data, [key]: createDefaultValue(newType) };
    onChange(next);
    setNewKey("");
    setNewType("string");
  };

  const removeField = (key) => {
    const next = { ...data };
    delete next[key];
    onChange(next);
  };

  const updateKey = (key, nextValue) => {
    onChange({ ...data, [key]: nextValue });
  };

  const getLabel = (key) =>
    (labelOverrides && labelOverrides[key]) || formatLabel(key);
  const getHelp = (key) => (helpText && helpText[key]) || "";
  const getPlaceholder = (key) =>
    (placeholderOverrides && placeholderOverrides[key]) || "";

  // Two-up layout on desktop, single column on mobile
  const gridMode = level <= 2;

  return (
    <div className={level > 0 ? "ml-2 pl-3 border-l-2 border-gray-200" : ""}>
      {keys.length === 0 ? (
        <div className="text-xs text-gray-500 italic mb-3">No fields yet</div>
      ) : (
        <div
          className={
            gridMode
              ? "grid grid-cols-1 md:grid-cols-2 gap-3"
              : "space-y-3"
          }
        >
          {keys.map((k) => {
            const value = data[k];
            const isComplex = isPlainObject(value) || Array.isArray(value);
            return (
              <div
                key={k}
                className={gridMode && isComplex ? "md:col-span-2" : ""}
              >
                <KeyRow
                  name={k}
                  value={value}
                  onChange={(v) => updateKey(k, v)}
                  onRemove={() => removeField(k)}
                  level={level}
                  hiddenKeys={hiddenKeys}
                  getLabel={getLabel}
                  getHelp={getHelp}
                  getPlaceholder={getPlaceholder}
                  labelOverrides={labelOverrides}
                  helpText={helpText}
                  placeholderOverrides={placeholderOverrides}
                  arrayItemPlaceholderOverrides={arrayItemPlaceholderOverrides}
                  arrayItemPlaceholder={arrayItemPlaceholder}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="border border-dashed border-gray-300 rounded-md p-3 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="New field name"
            className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
            <option value="null">Null</option>
          </select>
        </div>
        <button
          type="button"
          onClick={addField}
          className="mt-2 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <FaPlus className="text-xs" />
          <span>Add Field</span>
        </button>
      </div>
    </div>
  );
};

const ArrayEditor = ({
  data,
  onChange,
  level,
  hiddenKeys,
  labelOverrides,
  helpText,
  placeholderOverrides,
  arrayItemPlaceholder,
  arrayItemPlaceholderOverrides,
}) => {
  const [expanded, setExpanded] = useState(level <= 1);
  const [newType, setNewType] = useState("string");

  const inferredType = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return null;
    return inferType(data[0]);
  }, [data]);

  const addItem = () => {
    const type = inferredType || newType;
    const next = [...data, createDefaultValue(type)];
    onChange(next);
  };

  const updateItem = (index, nextValue) => {
    const next = data.map((v, i) => (i === index ? nextValue : v));
    onChange(next);
  };

  const removeItem = (index) => {
    const next = data.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div
      className={
        level > 0 ? "ml-2 pl-3 border-l-2 border-gray-200" : ""
      }
    >
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-2 text-left"
        >
          {expanded ? (
            <FaChevronDown className="text-xs text-blue-700" />
          ) : (
            <FaChevronRight className="text-xs text-blue-700" />
          )}
          <span className="text-sm font-semibold text-blue-900">
            Items ({Array.isArray(data) ? data.length : 0})
          </span>
        </button>

        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 text-sm font-medium"
        >
          <FaPlus className="text-xs" />
          <span>Add Item</span>
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2">
          {Array.isArray(data) && data.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-md p-3 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-xs text-gray-600 sm:col-span-2">
                  Choose the type for new items:
                </span>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Object</option>
                  <option value="array">Array</option>
                  <option value="null">Null</option>
                </select>
              </div>
            </div>
          )}

          {Array.isArray(data) &&
            data.map((item, index) => {
              const primitive = isPrimitiveValue(item);
              return (
                <div
                  key={`item-${index}`}
                  className="border border-gray-200 rounded-md p-3 bg-white"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-700">
                      Item {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Remove item"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>

                  {primitive ? (
                    <PrimitiveEditor
                      value={item}
                      onChange={(v) => updateItem(index, v)}
                      placeholder={arrayItemPlaceholder || "Enter value"}
                    />
                  ) : (
                    <DynamicForm
                      data={item}
                      onChange={(v) => updateItem(index, v)}
                      level={level + 1}
                      hiddenKeys={hiddenKeys}
                      labelOverrides={labelOverrides}
                      helpText={helpText}
                      placeholderOverrides={placeholderOverrides}
                      arrayItemPlaceholderOverrides={arrayItemPlaceholderOverrides}
                      arrayItemPlaceholder={arrayItemPlaceholder}
                    />
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

/**
 * DynamicForm - Reusable dynamic form renderer for nested JSON specifications.
 *
 * Supports:
 * - Primitive fields (string/number/boolean/null)
 * - Nested objects (recursively)
 * - Arrays of primitives/objects (recursively)
 */
const DynamicForm = ({
  data,
  onChange,
  level = 0,
  hiddenKeys = [],
  labelOverrides = {},
  helpText = {},
  placeholderOverrides = {},
  arrayItemPlaceholderOverrides = {},
  arrayItemPlaceholder = "",
}) => {
  if (Array.isArray(data)) {
    return (
      <ArrayEditor
        data={data}
        onChange={onChange}
        level={level}
        hiddenKeys={hiddenKeys}
        labelOverrides={labelOverrides}
        helpText={helpText}
        placeholderOverrides={placeholderOverrides}
        arrayItemPlaceholderOverrides={arrayItemPlaceholderOverrides}
        arrayItemPlaceholder={arrayItemPlaceholder}
      />
    );
  }

  if (isPlainObject(data)) {
    return (
      <ObjectEditor
        data={data}
        onChange={onChange}
        level={level}
        hiddenKeys={hiddenKeys}
        labelOverrides={labelOverrides}
        helpText={helpText}
        placeholderOverrides={placeholderOverrides}
        arrayItemPlaceholderOverrides={arrayItemPlaceholderOverrides}
        arrayItemPlaceholder={arrayItemPlaceholder}
      />
    );
  }

  return (
    <PrimitiveEditor
      value={data}
      onChange={onChange}
      placeholder={arrayItemPlaceholder}
    />
  );
};

export default DynamicForm;
