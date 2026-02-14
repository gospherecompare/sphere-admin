import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaPlus,
  FaSave,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const DEFAULT_WEIGHTS = {
  performance: 36,
  display: 20,
  camera: 20,
  battery: 14,
  priceValue: 10,
};

const WEIGHT_FIELDS = [
  { key: "performance", label: "Performance" },
  { key: "display", label: "Display" },
  { key: "camera", label: "Camera" },
  { key: "battery", label: "Battery" },
  { key: "priceValue", label: "Value for Money" },
];

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeWeights = (weights) => {
  const source = weights && typeof weights === "object" ? weights : {};
  return {
    performance: toNumber(source.performance, DEFAULT_WEIGHTS.performance),
    display: toNumber(source.display, DEFAULT_WEIGHTS.display),
    camera: toNumber(source.camera, DEFAULT_WEIGHTS.camera),
    battery: toNumber(source.battery, DEFAULT_WEIGHTS.battery),
    priceValue: toNumber(
      source.priceValue ?? source.price_value,
      DEFAULT_WEIGHTS.priceValue,
    ),
  };
};

const normalizeRules = (rules) => {
  if (!Array.isArray(rules)) return [];
  return rules.map((rule) => ({
    keyword: String(rule?.keyword ?? rule?.match ?? "").trim(),
    score: toNumber(rule?.score, 60),
  }));
};

export default function CompareScoring() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [chipsetRules, setChipsetRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const authHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildUrl("/api/admin/compare-scoring"), {
        method: "GET",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setWeights(normalizeWeights(data?.weights));
      setChipsetRules(normalizeRules(data?.chipset_rules));
    } catch (err) {
      setError("Failed to load compare scoring settings");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const totalWeight = useMemo(
    () =>
      WEIGHT_FIELDS.reduce(
        (sum, field) => sum + toNumber(weights[field.key], 0),
        0,
      ),
    [weights],
  );

  const setWeight = (key, value) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const setRule = (index, patch) => {
    setChipsetRules((prev) =>
      prev.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...patch } : rule,
      ),
    );
  };

  const addRule = () => {
    setChipsetRules((prev) => [...prev, { keyword: "", score: 60 }]);
  };

  const deleteRule = (index) => {
    setChipsetRules((prev) => prev.filter((_, ruleIndex) => ruleIndex !== index));
  };

  const saveConfig = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        weights: {
          performance: toNumber(weights.performance, DEFAULT_WEIGHTS.performance),
          display: toNumber(weights.display, DEFAULT_WEIGHTS.display),
          camera: toNumber(weights.camera, DEFAULT_WEIGHTS.camera),
          battery: toNumber(weights.battery, DEFAULT_WEIGHTS.battery),
          priceValue: toNumber(weights.priceValue, DEFAULT_WEIGHTS.priceValue),
        },
        chipset_rules: chipsetRules
          .map((rule) => ({
            keyword: String(rule.keyword || "").trim(),
            score: toNumber(rule.score, 60),
          }))
          .filter((rule) => rule.keyword),
      };

      const response = await fetch(buildUrl("/api/admin/compare-scoring"), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setWeights(normalizeWeights(data?.weights));
      setChipsetRules(normalizeRules(data?.chipset_rules));
      showToast("Saved", "Compare scoring settings updated", "success");
    } catch (err) {
      setError("Failed to save compare scoring settings");
      showToast("Error", "Unable to save compare scoring settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
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
              onClick={() =>
                setToasts((prev) =>
                  prev.filter((item) => item.id !== toast.id),
                )
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
            Compare Scoring
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage compare score weights and chipset scoring rules from admin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadConfig}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={saveConfig}
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

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Weights (%)</h2>
          <span
            className={`text-sm font-medium ${
              Math.abs(totalWeight - 100) <= 0.1
                ? "text-green-600"
                : "text-amber-600"
            }`}
          >
            Total: {totalWeight.toFixed(1)}%
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {WEIGHT_FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="text-sm font-medium text-gray-700">
                {field.label}
              </span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={weights[field.key]}
                onChange={(event) => setWeight(field.key, event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Chipset Rules</h2>
          <button
            onClick={addRule}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <FaPlus />
            Add Rule
          </button>
        </div>
        <div className="space-y-3">
          {chipsetRules.map((rule, index) => (
            <div
              key={`chipset-rule-${index}`}
              className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_130px_auto]"
            >
              <input
                type="text"
                value={rule.keyword}
                onChange={(event) =>
                  setRule(index, { keyword: event.target.value })
                }
                placeholder="Keyword (for example: snapdragon 8 gen 3)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={rule.score}
                onChange={(event) =>
                  setRule(index, { score: event.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={() => deleteRule(index)}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
              >
                <FaTrash />
              </button>
            </div>
          ))}
          {!chipsetRules.length ? (
            <p className="text-sm text-gray-500">No custom rules found.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
