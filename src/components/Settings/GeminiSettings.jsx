import React, { useCallback, useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaKey, FaSave, FaSpinner, FaTrash } from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const DEFAULT_MODEL = "gemini-3.6-flash";
const GEMINI_MODEL_OPTIONS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];
const CUSTOM_MODEL_VALUE = "__custom__";

export default function GeminiSettings() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyPreview, setApiKeyPreview] = useState("");
  const [configured, setConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildUrl("/api/admin/ai/gemini-config"), {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load Gemini settings");
      const loadedModel = data.model || DEFAULT_MODEL;
      const isCustomModel = !GEMINI_MODEL_OPTIONS.includes(loadedModel);
      setConfigured(Boolean(data.configured));
      setApiKeyPreview(data.apiKeyPreview || "");
      setModel(isCustomModel ? CUSTOM_MODEL_VALUE : loadedModel);
      setCustomModel(isCustomModel ? loadedModel : "");
      setUpdatedAt(data.updated_at || null);
    } catch (loadError) {
      setError(loadError.message || "Failed to load Gemini settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedModel =
    (model === CUSTOM_MODEL_VALUE ? customModel : model).trim() || "No model selected";

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(buildUrl("/api/admin/ai/gemini-config"), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          apiKey,
          model: (model === CUSTOM_MODEL_VALUE ? customModel : model).trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save Gemini settings");
      setApiKey("");
      setMessage("Gemini settings saved.");
      await loadSettings();
    } catch (saveError) {
      setError(saveError.message || "Failed to save Gemini settings");
    } finally {
      setSaving(false);
    }
  };

  const deleteApiKey = async () => {
    if (!window.confirm("Delete the stored Gemini API key? AI summaries will stop until a new key is saved.")) return;

    setDeleting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(buildUrl("/api/admin/ai/gemini-config"), {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete Gemini API key");
      setConfigured(false);
      setApiKeyPreview("");
      setApiKey("");
      setMessage("Gemini API key deleted. AI generation is disabled until a new key is saved.");
      await loadSettings();
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete Gemini API key");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <FaKey />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gemini AI Settings</h1>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Manage the provider credentials used by product and news summaries.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <FaSpinner className="animate-spin" /> Loading settings...
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={saveSettings}>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                {configured ? <FaCheckCircle className="text-emerald-600" /> : <FaExclamationCircle className="text-amber-600" />}
                {configured ? `API key configured: ${apiKeyPreview}` : "API key not configured"}
              </div>
              <p className="mt-1 text-xs text-slate-500">Active model: {selectedModel}</p>
              <p className="mt-1 text-xs text-slate-500">The stored key is never displayed. Leave the key field blank to keep it.</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                {configured ? `Replace API key for ${selectedModel}` : `API key for ${selectedModel}`}
              </span>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                autoComplete="new-password"
                placeholder={configured ? "Enter a new key only when rotating" : "Enter the API key for this model"}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Gemini model</span>
              <select
                value={model}
                onChange={(event) => {
                  const nextModel = event.target.value;
                  setModel(nextModel);
                  if (nextModel !== CUSTOM_MODEL_VALUE) setCustomModel("");
                }}
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {GEMINI_MODEL_OPTIONS.map((modelOption) => (
                  <option key={modelOption} value={modelOption}>
                    {modelOption}
                  </option>
                ))}
                <option value={CUSTOM_MODEL_VALUE}>Other model...</option>
              </select>
            </label>

            {model === CUSTOM_MODEL_VALUE ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Custom model name</span>
                <input
                  type="text"
                  value={customModel}
                  onChange={(event) => setCustomModel(event.target.value)}
                  placeholder="Enter model name"
                  maxLength={120}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            ) : null}

            {updatedAt ? <p className="text-xs text-slate-500">Last updated: {new Date(updatedAt).toLocaleString()}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

            <button
              type="submit"
              disabled={saving || !(model === CUSTOM_MODEL_VALUE ? customModel : model).trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {saving ? "Saving..." : "Save Gemini settings"}
            </button>
            <button
              type="button"
              onClick={deleteApiKey}
              disabled={deleting || saving || !configured}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
              {deleting ? "Deleting..." : "Delete stored API key"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
