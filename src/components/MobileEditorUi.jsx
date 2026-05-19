import React from "react";

export const editorFieldClassName =
  "h-11 w-full border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:bg-white focus:ring-0";

export const editorTextareaClassName =
  "w-full border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:bg-white focus:ring-0";

export const editorSelectClassName = editorFieldClassName;

export const editorGhostButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

export const editorPrimaryButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 border border-[#345CFF] bg-[#345CFF] px-4 text-sm font-semibold text-white transition hover:bg-[#274eef] disabled:cursor-not-allowed disabled:opacity-60";

export const editorDangerButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60";

export const editorCardClassName = "border border-slate-200 bg-white";
export const editorSectionBodyClassName =
  "px-2 py-3 sm:px-3 sm:py-4 lg:px-4";
export const editorSectionButtonClassName =
  "w-full border-b border-slate-200 px-2 py-3 text-left transition hover:bg-slate-50 sm:px-3 lg:px-4";

const STATUS_TONE_CLASSES = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

const SCORE_TONE_CLASSES = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export const normalizeScoreValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

export const formatEditorDate = (value, includeTime = false) => {
  if (!value) return "Not set";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-IN", includeTime
    ? {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    : {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(date);
};

export const resolvePreviewImage = (images = []) => {
  const list = Array.isArray(images) ? images : [];
  for (const image of list) {
    if (!image) continue;
    if (typeof image === "string" && image.trim()) return image;
    if (typeof image === "object") {
      if (image.secure_url) return image.secure_url;
      if (image.url) return image.url;
      if (image.src) return image.src;
    }
  }
  return "";
};

export const summarizeVariants = (variants = []) => {
  const list = Array.isArray(variants) ? variants : [];
  const first = list[0] || {};
  const primaryBits = [first.ram, first.storage].filter(Boolean);
  const storeCount = list.reduce((count, variant) => {
    const stores = Array.isArray(variant?.stores)
      ? variant.stores
      : Array.isArray(variant?.store_prices)
        ? variant.store_prices
        : [];
    return count + stores.length;
  }, 0);

  return {
    primary: primaryBits.length ? primaryBits.join(" / ") : "No variant added",
    variantCount: list.length,
    storeCount,
  };
};

export function EditorStatusChip({ label, tone = "neutral", className = "" }) {
  const toneClass = STATUS_TONE_CLASSES[tone] || STATUS_TONE_CLASSES.neutral;
  return (
    <span className={`inline-flex items-center border px-2 py-1 text-xs font-semibold ${toneClass} ${className}`}>
      {label}
    </span>
  );
}

export function EditorTabBar({ tabs, activeTab, onSelect }) {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="grid grid-cols-2 gap-px bg-slate-200 sm:flex sm:overflow-x-auto sm:bg-transparent [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`inline-flex min-w-0 items-center justify-center gap-2 bg-white px-3 py-3 text-center text-sm font-semibold transition sm:min-w-max sm:justify-start sm:border-r sm:border-slate-200 sm:last:border-r-0 ${
                active
                  ? "bg-[#F4F7FF] text-[#345CFF]"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {Icon ? <Icon className="text-sm" /> : null}
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EditorSidebarCard({
  title,
  actionLabel,
  onAction,
  actionDisabled = false,
  children,
  footer,
}) {
  return (
    <section className={editorCardClassName}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-2 py-3 sm:px-3">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="text-xs font-semibold text-[#345CFF] transition hover:text-[#274eef] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="px-2 py-3 sm:px-3">{children}</div>
      {footer ? <div className="border-t border-slate-200 px-2 py-3 sm:px-3">{footer}</div> : null}
    </section>
  );
}

export function EditorSidebarRow({ label, value, valueClassName = "" }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 py-2 last:border-b-0">
      <p className="text-sm text-slate-500">{label}</p>
      <div className={`text-right text-sm font-medium text-slate-700 ${valueClassName}`}>{value}</div>
    </div>
  );
}

export function EditorScorePill({ label, value, tone = "slate" }) {
  const toneClass = SCORE_TONE_CLASSES[tone] || SCORE_TONE_CLASSES.slate;
  return (
    <div className="border border-slate-200 bg-white px-2 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <span className={`mt-2 inline-flex min-w-[2.5rem] items-center justify-center border px-2 py-1 text-sm font-semibold ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}
