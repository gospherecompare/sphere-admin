import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaSave,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const DEVICE_TYPES = ["smartphone", "laptop", "tv"];

const DEFAULT_PROFILES = {
  smartphone: { mandatory: {}, display: {} },
  laptop: { mandatory: {}, display: {} },
  tv: { mandatory: {}, display: {} },
};

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const normalizePathList = (value) => {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 30);
};

const normalizeFieldMap = (value) => {
  const source = isPlainObject(value) ? value : {};
  const output = {};
  Object.entries(source).forEach(([key, paths]) => {
    const normalized = normalizePathList(paths);
    if (normalized.length) output[key] = normalized;
  });
  return output;
};

const normalizeProfiles = (value) => {
  const source = isPlainObject(value) ? value : {};
  const out = {};
  DEVICE_TYPES.forEach((type) => {
    const profile = isPlainObject(source[type]) ? source[type] : {};
    out[type] = {
      mandatory: normalizeFieldMap(profile.mandatory),
      display: normalizeFieldMap(profile.display),
    };
  });
  return out;
};

const makeEditorsFromProfiles = (profiles) => {
  const normalized = normalizeProfiles(profiles);
  const editors = {};
  DEVICE_TYPES.forEach((type) => {
    editors[type] = {
      mandatory: JSON.stringify(normalized[type].mandatory, null, 2),
      display: JSON.stringify(normalized[type].display, null, 2),
    };
  });
  return editors;
};

const parseEditorSection = (raw, type, section) => {
  if (!String(raw || "").trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      throw new Error("JSON must be an object");
    }
    return normalizeFieldMap(parsed);
  } catch (error) {
    throw new Error(
      `${type} ${section} must be valid JSON object: ${error.message}`,
    );
  }
};

const DeviceFieldProfiles = () => {
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [editors, setEditors] = useState(makeEditorsFromProfiles(DEFAULT_PROFILES));
  const [activeType, setActiveType] = useState("smartphone");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const authHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildUrl("/api/admin/device-field-profiles"), {
        method: "GET",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const normalized = normalizeProfiles(data?.profiles || DEFAULT_PROFILES);
      setProfiles(normalized);
      setEditors(makeEditorsFromProfiles(normalized));
    } catch (err) {
      setError("Failed to load device field profiles");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const activeEditor = editors[activeType] || { mandatory: "{}", display: "{}" };

  const summary = useMemo(() => {
    const current = profiles[activeType] || { mandatory: {}, display: {} };
    return {
      mandatoryCount: Object.keys(current.mandatory || {}).length,
      displayCount: Object.keys(current.display || {}).length,
    };
  }, [activeType, profiles]);

  const setEditorValue = (section, value) => {
    setEditors((prev) => ({
      ...prev,
      [activeType]: {
        ...(prev[activeType] || {}),
        [section]: value,
      },
    }));
  };

  const saveProfiles = async () => {
    setSaving(true);
    setError("");

    try {
      const nextProfiles = {};
      DEVICE_TYPES.forEach((type) => {
        const draft = editors[type] || { mandatory: "{}", display: "{}" };
        nextProfiles[type] = {
          mandatory: parseEditorSection(draft.mandatory, type, "mandatory"),
          display: parseEditorSection(draft.display, type, "display"),
        };
      });

      const response = await fetch(buildUrl("/api/admin/device-field-profiles"), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ profiles: nextProfiles }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const normalized = normalizeProfiles(data?.profiles || nextProfiles);
      setProfiles(normalized);
      setEditors(makeEditorsFromProfiles(normalized));
      showToast("Saved", "Device field profiles updated", "success");
    } catch (err) {
      const message = err?.message || "Failed to save device field profiles";
      setError(message);
      showToast("Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-white rounded-lg shadow-lg border p-4 max-w-sm w-full flex items-start space-x-3 ${
              toast.type === "success"
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            {toast.type === "success" ? (
              <FaCheckCircle className="text-green-500 mt-0.5" />
            ) : (
              <FaExclamationCircle className="text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== toast.id))
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Device Field Profiles
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage mandatory and display field paths for smartphone, laptop, and
            TV JSON payloads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProfiles}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={saveProfiles}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            Save
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {DEVICE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium ${
              activeType === type
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {type === "tv" ? "TV" : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="text-gray-500">Mandatory fields</span>
            <div className="text-lg font-semibold text-gray-900">
              {summary.mandatoryCount}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="text-gray-500">Display fields</span>
            <div className="text-lg font-semibold text-gray-900">
              {summary.displayCount}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Mandatory Paths ({activeType})
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            JSON object where each key maps to an array of fallback paths.
          </p>
          <textarea
            value={activeEditor.mandatory}
            onChange={(event) => setEditorValue("mandatory", event.target.value)}
            className="w-full min-h-[360px] rounded-lg border border-gray-300 p-3 text-xs font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Display Paths ({activeType})
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            JSON object for UI display extraction fallback paths.
          </p>
          <textarea
            value={activeEditor.display}
            onChange={(event) => setEditorValue("display", event.target.value)}
            className="w-full min-h-[360px] rounded-lg border border-gray-300 p-3 text-xs font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
    </div>
  );
};

export default DeviceFieldProfiles;
