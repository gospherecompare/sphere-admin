import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaEdit,
  FaKey,
  FaList,
  FaSave,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
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
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [editorItemId, setEditorItemId] = useState(null);
  const [editorModel, setEditorModel] = useState(DEFAULT_MODEL);
  const [editorTemperature, setEditorTemperature] = useState("0.2");
  const [editorInputText, setEditorInputText] = useState("");
  const [editorPromptText, setEditorPromptText] = useState("");
  const [editorOutputText, setEditorOutputText] = useState("");
  const [editorRevisionNotes, setEditorRevisionNotes] = useState("");
  const [updatingHistory, setUpdatingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("library");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [draftType, setDraftType] = useState("product");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSourceText, setDraftSourceText] = useState("");
  const [draftPromptText, setDraftPromptText] = useState("");
  const [draftOutputText, setDraftOutputText] = useState("");

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

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(buildUrl("/api/admin/ai/history?limit=100"), {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load AI history");
      const items = Array.isArray(data.items) ? data.items : [];
      setHistoryItems(items);
      if (items.length && !selectedHistoryIds.length) {
        setSelectedHistoryIds([items[0].id]);
        setEditorItemId(items[0].id);
        setEditorModel(items[0].model || DEFAULT_MODEL);
        setEditorTemperature(String(items[0].temperature ?? "0.2"));
        setEditorInputText(items[0].input_text || "");
        setEditorPromptText(items[0].prompt_text || "");
        setEditorOutputText(items[0].content || "");
      }
    } catch (historyError) {
      console.error("Failed to load Gemini AI history", historyError);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedHistoryIds.length]);

  const selectedModel =
    (model === CUSTOM_MODEL_VALUE ? customModel : model).trim() || "No model selected";

  const visibleSelectedIds = useMemo(
    () => new Set(selectedHistoryIds.map((id) => Number(id))),
    [selectedHistoryIds],
  );

  const activeHistoryItem = useMemo(
    () =>
      historyItems.find((item) => Number(item.id) === Number(editorItemId)) ||
      historyItems[0] ||
      null,
    [editorItemId, historyItems],
  );

  const filteredHistoryItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return historyItems.filter((item) => {
      const name = (item.entity_name || `${item.entity_type || "entry"} #${item.entity_id}` || "").toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        String(item.model || "").toLowerCase().includes(normalizedSearch) ||
        String(item.status || "").toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesEntity =
        entityFilter === "all" ||
        String(item.entity_type || "").toLowerCase() === entityFilter;

      return matchesSearch && matchesStatus && matchesEntity;
    });
  }, [entityFilter, historyItems, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHistoryItems.length / pageSize));
  const pageItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredHistoryItems.slice(start, start + pageSize);
  }, [filteredHistoryItems, page, pageSize, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, entityFilter, pageSize]);

  const toggleHistorySelection = (historyId) => {
    setSelectedHistoryIds((previous) => {
      const next = previous.includes(historyId)
        ? previous.filter((item) => item !== historyId)
        : [...previous, historyId];
      if (next.length === 0) {
        setEditorItemId(historyId);
      }
      return next;
    });
  };

  const selectHistoryItem = (item) => {
    const id = Number(item.id);
    setEditorItemId(id);
    setSelectedHistoryIds([id]);
    setEditorModel(item.model || DEFAULT_MODEL);
    setEditorTemperature(String(item.temperature ?? "0.2"));
    setEditorInputText(item.input_text || "");
    setEditorPromptText(item.prompt_text || "");
    setEditorOutputText(item.content || "");
    setEditorRevisionNotes(item.revision_notes || "");
  };

  const updateSelectedHistory = async () => {
    const targets = selectedHistoryIds.length
      ? selectedHistoryIds
      : editorItemId !== null
        ? [editorItemId]
        : [];

    if (!targets.length) {
      setError("Select at least one AI generation to edit.");
      return;
    }

    setUpdatingHistory(true);
    setError("");
    setMessage("");

    try {
      const updates = await Promise.all(
        targets.map(async (historyId) => {
          const response = await fetch(buildUrl(`/api/admin/ai/history/${historyId}`), {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({
              model: editorModel,
              temperature: editorTemperature,
              input_text: editorInputText,
              prompt_text: editorPromptText,
              content: editorOutputText,
              revision_notes: editorRevisionNotes,
            }),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.message || "Failed to update AI entry");
          }
          return data.item || null;
        }),
      );

      setMessage(
        updates.length > 1
          ? `Updated ${updates.length} Gemini entries.`
          : "Gemini AI entry updated.",
      );
      setSelectedHistoryIds([targets[0]]);
      setEditorItemId(targets[0]);
      await loadHistory();
    } catch (updateError) {
      setError(updateError.message || "Failed to update Gemini AI entry");
    } finally {
      setUpdatingHistory(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, [loadSettings, loadHistory]);

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
    <section className="mx-auto w-full max-w-7xl">
      <div className="space-y-6 bg-transparent">
        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-slate-900 text-lg text-white">
                <FaKey />
              </div>
              <div>
                <div className="inline-flex items-center border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  AI content desk
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 sm:text-4xl">
                  Gemini AI Studio
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Manage AI summaries, review generation history, and keep provider settings separate from editorial content workflows.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="border border-slate-200 bg-white px-3 py-2 text-left">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Provider
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  {configured ? "Connected" : "Not ready"}
                </div>
              </div>
              <div className="border border-slate-200 bg-white px-3 py-2 text-left">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Active model
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  {selectedModel}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {[
            { id: "library", label: "Generations" },
            { id: "create", label: "Create" },
            { id: "config", label: "Provider Configuration" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600">
            <FaSpinner className="animate-spin text-indigo-600" /> Loading AI settings...
          </div>
        ) : activeTab === "library" ? (
          <div className="space-y-6">
            <div className="bg-transparent">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Generation library
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">AI-generated content</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="border border-slate-200 bg-slate-50 px-2.5 py-1">{historyItems.length} total</span>
                  <span className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">{historyItems.filter((item) => item.status === "generated").length} completed</span>
                  <span className="border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">{historyItems.filter((item) => item.status === "failed").length} failed</span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search generations, entities, or models..."
                    className="h-11 w-full border border-slate-200 bg-white px-3 pl-10 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">All statuses</option>
                  <option value="generated">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  value={entityFilter}
                  onChange={(event) => setEntityFilter(event.target.value)}
                  className="h-11 border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">All entities</option>
                  <option value="smartphone">Smartphone</option>
                  <option value="blog">News</option>
                  <option value="product">Product</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
              <aside className="bg-transparent">
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Entries</h3>
                  <span className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                    {filteredHistoryItems.length}
                  </span>
                </div>

                {historyLoading ? (
                  <div className="flex items-center gap-2 border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600">
                    <FaSpinner className="animate-spin text-indigo-600" /> Loading...
                  </div>
                ) : pageItems.length === 0 ? (
                  <div className="border border-dashed border-slate-200 bg-white p-5 text-sm leading-6 text-slate-500">
                    No generation matches the current filters.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {pageItems.map((item) => {
                      const isSelected = visibleSelectedIds.has(Number(item.id));

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectHistoryItem(item)}
                          className={`w-full border-l-4 bg-white p-3 text-left transition ${
                            isSelected
                              ? "border-l-blue-600 bg-blue-50"
                              : "border-l-transparent hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleHistorySelection(Number(item.id))}
                              onClick={(event) => event.stopPropagation()}
                              className="mt-1 h-4 w-4 border-slate-300 text-indigo-600"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="truncate text-sm font-bold text-slate-800">
                                  {item.entity_name || `${item.entity_type || "entry"} #${item.entity_id}`}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                  {item.status}
                                </span>
                              </div>
                              <div className="mt-2 text-[11px] text-slate-500">
                                <span className="font-medium text-slate-600">{item.entity_type || "entry"}</span>
                                {item.model ? ` • ${item.model}` : ""}
                                {item.temperature !== null && item.temperature !== undefined ? ` • temp ${item.temperature}` : ""}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">
                                {item.generated_at ? new Date(item.generated_at).toLocaleString() : "No generation time"}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    className="border border-slate-200 bg-white px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span>
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                    className="border border-slate-200 bg-white px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </aside>

              <div className="bg-transparent">
                {activeHistoryItem ? (
                  <>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Edit generation
                        </p>
                        <h3 className="mt-1 text-xl font-bold text-slate-900">
                          {activeHistoryItem.entity_name || `${activeHistoryItem.entity_type || "entry"} #${activeHistoryItem.entity_id}`}
                        </h3>
                      </div>
                      <span className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                        {selectedHistoryIds.length || 1} selected
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          AI model
                        </span>
                        <input
                          value={editorModel}
                          onChange={(event) => setEditorModel(event.target.value)}
                          className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Temperature
                        </span>
                        <input
                          value={editorTemperature}
                          onChange={(event) => setEditorTemperature(event.target.value)}
                          className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>
                    </div>

                    <div className="mt-5 space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Source content
                        </span>
                        <textarea
                          value={editorInputText}
                          onChange={(event) => setEditorInputText(event.target.value)}
                          rows={7}
                          className="w-full border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Prompt setup
                        </span>
                        <textarea
                          value={editorPromptText}
                          onChange={(event) => setEditorPromptText(event.target.value)}
                          rows={7}
                          className="w-full border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Draft content
                        </span>
                        <textarea
                          value={editorOutputText}
                          onChange={(event) => setEditorOutputText(event.target.value)}
                          rows={9}
                          className="w-full border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Revision notes
                        </span>
                        <textarea
                          value={editorRevisionNotes}
                          onChange={(event) => setEditorRevisionNotes(event.target.value)}
                          rows={3}
                          placeholder="Add notes for final review"
                          className="w-full border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="border border-slate-200 bg-white p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Input tokens
                        </div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                          {activeHistoryItem.input_tokens ?? "n/a"}
                        </div>
                      </div>
                      <div className="border border-slate-200 bg-white p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Output tokens
                        </div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                          {activeHistoryItem.output_tokens ?? "n/a"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={updateSelectedHistory}
                        disabled={updatingHistory}
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingHistory ? <FaSpinner className="animate-spin" /> : <FaEdit />}
                        {updatingHistory
                          ? "Updating..."
                          : selectedHistoryIds.length > 1
                            ? "Update selected"
                            : "Save edited content"}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : activeTab === "create" ? (
          <div className="bg-transparent">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Create generation
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Generate new AI summary</h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Generation type</span>
                <select
                  value={draftType}
                  onChange={(event) => setDraftType(event.target.value)}
                  className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="product">Product summary</option>
                  <option value="news">News summary</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">{draftType === "product" ? "Product" : "Article"}</span>
                <input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder={draftType === "product" ? "Search product name..." : "Search article title..."}
                  className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Source content</span>
                <textarea
                  value={draftSourceText}
                  onChange={(event) => setDraftSourceText(event.target.value)}
                  rows={7}
                  placeholder="Paste the source article, product notes, or raw data to summarize..."
                  className="w-full border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Prompt</span>
                <textarea
                  value={draftPromptText}
                  onChange={(event) => setDraftPromptText(event.target.value)}
                  rows={5}
                  placeholder="Write the content instruction for Gemini..."
                  className="w-full border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Model</span>
                  <select
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    {GEMINI_MODEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Temperature</span>
                  <input
                    value={editorTemperature}
                    onChange={(event) => setEditorTemperature(event.target.value)}
                    className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Generate summary
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-transparent">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Provider configuration
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Gemini provider</h2>
            </div>

            <form className="space-y-5" onSubmit={saveSettings}>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  {configured ? <FaCheckCircle className="text-emerald-600" /> : <FaExclamationCircle className="text-amber-600" />}
                  {configured ? `Connection active: ${apiKeyPreview}` : "API key not configured"}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Secret settings stay isolated from the generation library and are only managed in the provider section.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">API key</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  autoComplete="new-password"
                  placeholder={configured ? "Enter a replacement key" : "Paste Gemini API key"}
                  className="h-12 w-full border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Model</span>
                <select
                  value={model}
                  onChange={(event) => {
                    const nextModel = event.target.value;
                    setModel(nextModel);
                    if (nextModel !== CUSTOM_MODEL_VALUE) setCustomModel("");
                  }}
                  required
                  className="h-12 w-full border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {GEMINI_MODEL_OPTIONS.map((modelOption) => (
                    <option key={modelOption} value={modelOption}>{modelOption}</option>
                  ))}
                  <option value={CUSTOM_MODEL_VALUE}>Other model...</option>
                </select>
              </label>

              {model === CUSTOM_MODEL_VALUE ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Custom model</span>
                  <input
                    type="text"
                    value={customModel}
                    onChange={(event) => setCustomModel(event.target.value)}
                    placeholder="Enter custom model name"
                    className="h-12 w-full border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              ) : null}

              {updatedAt ? (
                <p className="text-xs leading-5 text-slate-500">Last updated: {new Date(updatedAt).toLocaleString()}</p>
              ) : null}

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !(model === CUSTOM_MODEL_VALUE ? customModel : model).trim()}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {saving ? "Saving..." : "Save configuration"}
                </button>
                <button
                  type="button"
                  onClick={deleteApiKey}
                  disabled={deleting || saving || !configured}
                  className="inline-flex items-center justify-center gap-2 border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                  {deleting ? "Deleting..." : "Remove key"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
