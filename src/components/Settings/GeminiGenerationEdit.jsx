import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import {
  editorCardClassName,
  editorFieldClassName,
  editorGhostButtonClassName,
  editorPrimaryButtonClassName,
  editorSectionBodyClassName,
  editorSectionButtonClassName,
  editorSelectClassName,
  editorTextareaClassName,
} from "../MobileEditorUi";

const authHeaders = () => {
  const token = getAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

export default function GeminiGenerationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState(null);
  const [model, setModel] = useState("gemini-3.6-flash");
  const [temperature, setTemperature] = useState("0.20");
  const [sourceContent, setSourceContent] = useState("");
  const [promptSetup, setPromptSetup] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [storedGeneratedContent, setStoredGeneratedContent] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");

  useEffect(() => {
    const loadEntry = async () => {
      try {
        const response = await fetch(buildUrl(`/api/admin/ai/history/${id}`), {
          headers: authHeaders(),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load generation");
        }

        const item = data.item || data;
        setEntry(item);
        setModel(item.model || "gemini-3.6-flash");
        setTemperature(String(item.temperature ?? "0.20"));
        setSourceContent(item.input_text || "");
        setPromptSetup(item.prompt_text || "");
        setStoredGeneratedContent(item.content || "");
        setGeneratedContent(item.content || "");
        setRevisionNotes(item.revision_notes || "");
      } catch (error) {
        console.error("Failed to load generation entry", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadEntry();
  }, [id]);

  const title = useMemo(
    () => entry?.entity_name || entry?.entity_type || "Generated content",
    [entry],
  );

  const hasGeneratedChanges = storedGeneratedContent !== generatedContent;

  const saveChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch(buildUrl(`/api/admin/ai/history/${id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          model,
          temperature,
          input_text: sourceContent,
          prompt_text: promptSetup,
          content: generatedContent,
          revision_notes: revisionNotes,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to update generation");
      }

      navigate("/settings/gemini");
    } catch (error) {
      window.alert(error.message || "Failed to update generation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-0 pb-8">
      <div className="space-y-5">
        <div className={editorCardClassName}>
          <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <button
              type="button"
              onClick={() => navigate("/settings/gemini")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900"
            >
              <FaArrowLeft className="text-xs" />
              Back to generations
            </button>
            <span className="inline-flex items-center border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
              Edit generation
            </span>
          </div>

          <div className="px-3 py-4 sm:px-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Gemini AI
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-950">
              {title}
            </h1>
          </div>
        </div>

        {loading ? (
          <div className={editorCardClassName}>
            <div className="px-4 py-6 text-sm font-medium text-slate-600">Loading generation...</div>
          </div>
        ) : (
          <>
            <div className={editorCardClassName}>
              <button type="button" className={editorSectionButtonClassName}>
                <span className="text-sm font-semibold text-slate-900">Generation details</span>
              </button>
              <div className={`${editorSectionBodyClassName} grid gap-4 xl:grid-cols-2`}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">AI model</span>
                  <select value={model} onChange={(event) => setModel(event.target.value)} className={editorSelectClassName}>
                    <option value="gemini-3.6-flash">gemini-3.6-flash</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Temperature</span>
                  <input value={temperature} onChange={(event) => setTemperature(event.target.value)} className={editorFieldClassName} />
                </label>
              </div>
            </div>

            <div className={editorCardClassName}>
              <button type="button" className={editorSectionButtonClassName}>
                <span className="text-sm font-semibold text-slate-900">AI input and output</span>
              </button>
              <div className={`${editorSectionBodyClassName} space-y-4`}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Source content</span>
                  <textarea value={sourceContent} onChange={(event) => setSourceContent(event.target.value)} rows={7} className={editorTextareaClassName} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Prompt setup</span>
                  <textarea value={promptSetup} onChange={(event) => setPromptSetup(event.target.value)} rows={7} className={editorTextareaClassName} />
                </label>

                <div className="border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">Old vs new generated output</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          hasGeneratedChanges
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {hasGeneratedChanges ? "Changed" : "No change"}
                      </span>
                      {hasGeneratedChanges && (
                        <button
                          type="button"
                          onClick={() => setGeneratedContent(storedGeneratedContent)}
                          className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-300"
                        >
                          Revert
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Stored output</span>
                      <textarea value={storedGeneratedContent} rows={9} readOnly className={`${editorTextareaClassName} bg-slate-100 text-slate-600`} />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Editable output</span>
                      <textarea value={generatedContent} onChange={(event) => setGeneratedContent(event.target.value)} rows={9} className={editorTextareaClassName} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className={editorCardClassName}>
              <button type="button" className={editorSectionButtonClassName}>
                <span className="text-sm font-semibold text-slate-900">Metadata</span>
              </button>
              <div className={`${editorSectionBodyClassName} grid gap-4 xl:grid-cols-2`}>
                <div className="border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{entry?.status || "generated"}</p>
                </div>

                <div className="border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Generated</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {entry?.generated_at ? new Date(entry.generated_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className={editorCardClassName}>
              <button type="button" className={editorSectionButtonClassName}>
                <span className="text-sm font-semibold text-slate-900">Revision notes</span>
              </button>
              <div className={`${editorSectionBodyClassName}`}>
                <textarea value={revisionNotes} onChange={(event) => setRevisionNotes(event.target.value)} rows={4} className={editorTextareaClassName} />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => navigate("/settings/gemini")} className={editorGhostButtonClassName}>
                Cancel
              </button>
              <button type="button" onClick={saveChanges} disabled={saving} className={editorPrimaryButtonClassName}>
                <FaSave className="text-sm" />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
