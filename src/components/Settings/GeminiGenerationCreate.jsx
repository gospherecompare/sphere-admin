import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaMagic, FaSave } from "react-icons/fa";
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

const DEFAULT_MODEL = "gemini-3.6-flash";

export default function GeminiGenerationCreate() {
  const [contentType, setContentType] = useState("product");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [temperature, setTemperature] = useState("0.20");
  const [sourceContent, setSourceContent] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productLabel = useMemo(
    () => (contentType === "product" ? "Select Product" : "Select Article"),
    [contentType],
  );

  const submit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      const response = await fetch(buildUrl("/api/admin/ai/generate"), {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType,
          selectedProduct,
          model,
          temperature,
          sourceContent,
          prompt,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate summary");
      }

      window.alert("Summary generated successfully.");
      window.location.assign("/settings/gemini");
    } catch (error) {
      window.alert(error.message || "Failed to generate summary");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-0 pb-8">
      <div className="space-y-5">
        <div className={editorCardClassName}>
          <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3">
              <Link to="/settings/gemini" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900">
                <FaArrowLeft className="text-xs" />
                Back to generations
              </Link>
            </div>
            <span className="inline-flex items-center border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              New generation
            </span>
          </div>

          <div className="px-3 py-4 sm:px-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Gemini AI
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-950">
              Create AI generation
            </h1>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className={editorCardClassName}>
            <button type="button" className={editorSectionButtonClassName}>
              <span className="text-sm font-semibold text-slate-900">Generation settings</span>
            </button>
            <div className={`${editorSectionBodyClassName} grid gap-4 xl:grid-cols-2`}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Content type</span>
                <select
                  value={contentType}
                  onChange={(event) => setContentType(event.target.value)}
                  className={editorSelectClassName}
                >
                  <option value="product">Product Summary</option>
                  <option value="news">News Summary</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">{productLabel}</span>
                <input
                  value={selectedProduct}
                  onChange={(event) => setSelectedProduct(event.target.value)}
                  placeholder={contentType === "product" ? "Search product..." : "Search article..."}
                  className={editorFieldClassName}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">AI model</span>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className={editorSelectClassName}
                >
                  <option value="gemini-3.6-flash">gemini-3.6-flash</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Temperature</span>
                <input
                  value={temperature}
                  onChange={(event) => setTemperature(event.target.value)}
                  className={editorFieldClassName}
                />
              </label>
            </div>
          </div>

          <div className={editorCardClassName}>
            <button type="button" className={editorSectionButtonClassName}>
              <span className="text-sm font-semibold text-slate-900">AI input</span>
            </button>
            <div className={`${editorSectionBodyClassName} space-y-4`}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Source content</span>
                <textarea
                  value={sourceContent}
                  onChange={(event) => setSourceContent(event.target.value)}
                  rows={8}
                  className={editorTextareaClassName}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Prompt</span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={7}
                  className={editorTextareaClassName}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link to="/settings/gemini" className={editorGhostButtonClassName}>
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className={editorPrimaryButtonClassName}>
              <FaMagic className="text-sm" />
              {isSubmitting ? "Generating..." : "Generate summary"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
