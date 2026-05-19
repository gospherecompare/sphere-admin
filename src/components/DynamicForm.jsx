import React, { useMemo, useState } from "react";
import { FaChevronDown, FaChevronRight, FaPlus, FaTrash } from "react-icons/fa";
import {
  editorFieldClassName,
  editorTextareaClassName,
  editorGhostButtonClassName,
} from "./MobileEditorUi";

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

const MULTILINE_FIELD_PATTERN =
  /(description|summary|details|notes|overview|highlights|content|body|pros|cons|story)/i;

const getTypeBadgeLabel = (value) => {
  const type = inferType(value);
  if (type === "null") return "Empty";
  if (type === "boolean") return "Toggle";
  if (type === "number") return "Number";
  if (type === "array") return "List";
  if (type === "object") return "Group";
  return "Text";
};

const getNestedSummary = (value) => {
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  if (isPlainObject(value)) {
    const count = Object.keys(value).length;
    return `${count} field${count === 1 ? "" : "s"}`;
  }
  return "";
};

const PrimitiveEditor = ({ value, onChange, placeholder, multiline = false }) => {
  const type = inferType(value);

  if (type === "boolean") {
    return (
      <label className="flex min-h-[44px] items-center justify-between gap-3 border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700">
            {value ? "Enabled" : "Disabled"}
          </p>
          <p className="text-xs text-slate-400">Toggle between true and false</p>
        </div>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(!!e.target.checked)}
          title="Toggle true/false"
          aria-label="Toggle true/false"
          className="h-4 w-4 rounded-none border-slate-300 text-[#345CFF] focus:ring-[#345CFF]"
        />
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
        className={editorFieldClassName}
      />
    );
  }

  if (multiline) {
    return (
      <textarea
        rows={4}
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${editorTextareaClassName} min-h-[120px] resize-y`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={editorFieldClassName}
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
  const typeBadge = getTypeBadgeLabel(value);
  const nestedSummary = getNestedSummary(value);
  const multiline = MULTILINE_FIELD_PATTERN.test(name);
  const arrayItemPlaceholderForKey =
    arrayItemPlaceholder ||
    (arrayItemPlaceholderOverrides ? arrayItemPlaceholderOverrides[name] : "");

  if (!nested) {
    return (
      <div className="border border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-2 py-2.5 sm:px-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                {label}
              </label>
              <span className="inline-flex items-center border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {typeBadge}
              </span>
            </div>
            {help ? (
              <p className="mt-1 text-[11px] leading-5 text-slate-500">{help}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center border border-slate-200 text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            title="Remove field"
          >
            <FaTrash className="text-xs" />
          </button>
        </div>
        <div className="px-2 py-3 sm:px-3">
          <PrimitiveEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder || `Enter ${label}`}
            multiline={multiline}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-2 py-2.5 sm:px-3">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex min-w-0 items-start gap-2 text-left"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <FaChevronDown className="mt-0.5 flex-shrink-0 text-xs text-slate-500" />
          ) : (
            <FaChevronRight className="mt-0.5 flex-shrink-0 text-xs text-slate-500" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-800">
                {label}
              </span>
              <span className="inline-flex items-center border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {typeBadge}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {nestedSummary}
              </span>
            </div>
            {help ? (
              <p className="mt-1 text-[11px] leading-5 text-slate-500">{help}</p>
            ) : null}
          </div>
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center border border-slate-200 text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          title="Remove field"
        >
          <FaTrash className="text-xs" />
        </button>
      </div>

      {expanded && (
        <div className="px-2 py-3 sm:px-3">
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
    <div className={`${level > 0 ? "border-l border-slate-200 pl-2 sm:pl-3" : ""} space-y-3`}>
      {keys.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-slate-50 px-2 py-4 text-xs italic text-slate-500 sm:px-3">
          No fields yet. Add one below.
        </div>
      ) : (
        <div
          className={
            gridMode
              ? "grid grid-cols-1 gap-3 md:grid-cols-2"
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

      <div className="border border-dashed border-slate-300 bg-slate-50">
        <div className="border-b border-slate-200 px-2 py-2 sm:px-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Add Custom Field
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            Extend this section with a new key, value type, and content.
          </p>
        </div>
        <div className="px-2 py-3 sm:px-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="New field name"
              className={`sm:col-span-2 ${editorFieldClassName}`}
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className={editorFieldClassName}
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
            className={`${editorGhostButtonClassName} mt-2 w-full sm:w-auto`}
          >
            <FaPlus className="text-xs" />
            <span>Add Field</span>
          </button>
        </div>
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
    <div className={`${level > 0 ? "border-l border-slate-200 pl-2 sm:pl-3" : ""} space-y-3`}>
      <div className="flex items-start justify-between gap-3 border border-slate-200 bg-slate-50 px-2 py-2.5 sm:px-3">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex min-w-0 items-start gap-2 text-left"
        >
          {expanded ? (
            <FaChevronDown className="mt-0.5 text-xs text-slate-500" />
          ) : (
            <FaChevronRight className="mt-0.5 text-xs text-slate-500" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Items</span>
              <span className="inline-flex items-center border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {Array.isArray(data) ? data.length : 0}
              </span>
              {inferredType ? (
                <span className="text-[11px] font-medium text-slate-400">
                  {formatLabel(inferredType)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Manage ordered values for this list.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={addItem}
          className="inline-flex h-8 flex-shrink-0 items-center gap-2 border border-slate-200 bg-white px-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#345CFF] transition hover:border-[#345CFF] hover:bg-[#F4F7FF]"
        >
          <FaPlus className="text-xs" />
          <span>Add Item</span>
        </button>
      </div>

      {expanded && (
        <div className="space-y-3">
          {Array.isArray(data) && data.length === 0 && (
            <div className="border border-dashed border-slate-300 bg-slate-50">
              <div className="border-b border-slate-200 px-2 py-2 sm:px-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  New Item Type
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Choose the structure for the first item in this list.
                </p>
              </div>
              <div className="grid grid-cols-1 items-center gap-2 px-2 py-3 sm:grid-cols-3 sm:px-3">
                <span className="text-xs text-slate-600 sm:col-span-2">
                  Choose the type for new items:
                </span>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className={editorFieldClassName}
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
                  className="border border-slate-200 bg-white"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-2 py-2.5 sm:px-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Item {index + 1}
                        </span>
                        <span className="inline-flex items-center border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          {getTypeBadgeLabel(item)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center border border-slate-200 text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      title="Remove item"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                  <div className="px-2 py-3 sm:px-3">
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
