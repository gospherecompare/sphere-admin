import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaKey, FaSave } from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import {
  editorCardClassName,
  editorFieldClassName,
  editorGhostButtonClassName,
  editorPrimaryButtonClassName,
  editorSectionBodyClassName,
  editorSectionButtonClassName,
  editorSelectClassName,
} from "../MobileEditorUi";

const authHeaders = () => {
  const token = getAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

export default function GeminiProviderSettings() {
  const [configured, setConfigured] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [preview, setPreview] = useState("••••••••••••••••••");
  const [model, setModel] = useState("gemini-3.6-flash");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(buildUrl("/api/admin/ai/gemini-config"), {
          headers: authHeaders(),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load provider settings");
        }

        setConfigured(Boolean(data.configured));
        setModel(data.model || "gemini-3.6-flash");
        setPreview(data.apiKeyPreview || "••••••••••••••••••");
      } catch (error) {
        console.error("Failed to load provider config", error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(buildUrl("/api/admin/ai/gemini-config"), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          apiKey,
          model,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save provider settings");
      }
      setConfigured(true);
      setApiKey("");
      setPreview(data.apiKeyPreview || "••••••••••••••••••");
      window.alert("Provider configuration saved.");
    } catch (error) {
      window.alert(error.message || "Failed to save provider settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-0 pb-8">
      <div className="space-y-5">
        <div className={editorCardClassName}>
          <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <Link to="/settings/gemini" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900">
              <FaArrowLeft className="text-xs" />
              Back to generations
            </Link>
            <span className={`inline-flex items-center border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${configured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
              {configured ? "Connected" : "Not connected"}
            </span>
          </div>

          <div className="px-3 py-4 sm:px-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Provider setup
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-950">
              Gemini provider
            </h1>
          </div>
        </div>

        {loading ? (
          <div className={editorCardClassName}>
            <div className="px-4 py-6 text-sm font-medium text-slate-600">Loading provider configuration...</div>
          </div>
        ) : (
          <form onSubmit={saveSettings} className="space-y-5">
            <div className={editorCardClassName}>
              <button type="button" className={editorSectionButtonClassName}>
                <span className="text-sm font-semibold text-slate-900">Connection settings</span>
              </button>
              <div className={`${editorSectionBodyClassName} grid gap-4 xl:grid-cols-2`}>
                <label className="block xl:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">API key</span>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={preview}
                    className={editorFieldClassName}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Active model</span>
                  <select value={model} onChange={(event) => setModel(event.target.value)} className={editorSelectClassName}>
                    <option value="gemini-3.6-flash">gemini-3.6-flash</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                  </select>
                </label>

                <div className="border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <FaKey className="text-xs" />
                    Key preview
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">{preview}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" className={editorGhostButtonClassName}>
                Test connection
              </button>
              <button type="submit" disabled={saving} className={editorPrimaryButtonClassName}>
                <FaSave className="text-sm" />
                {saving ? "Saving..." : "Save configuration"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
