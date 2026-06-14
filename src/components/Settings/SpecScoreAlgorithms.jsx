import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaClipboardList,
  FaExclamationCircle,
  FaInfoCircle,
  FaLaptop,
  FaMobileAlt,
  FaSpinner,
  FaSyncAlt,
  FaTv,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";

const SURFACE_CLASS = "border border-slate-200 bg-white";
const SECONDARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 border border-[#345CFF] bg-[#345CFF] px-4 text-sm font-semibold text-white transition hover:bg-[#274eef] disabled:cursor-not-allowed disabled:border-[#9db3ff] disabled:bg-[#9db3ff]";

const formatDateTime = (value) => {
  if (!value) return "Not tracked";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toRows = (rows) => (Array.isArray(rows) ? rows : []);

const getLearningLabel = (category) => {
  const learningRows = toRows(category?.learning);
  const disabled = learningRows.some(
    (row) =>
      String(row?.key || "") === "runtime_learning" &&
      String(row?.value || "").toLowerCase().includes("not enabled"),
  );
  if (disabled) return "No";
  return learningRows.length ? "Yes" : "No";
};

const getCategoryMeta = (category) => {
  switch (String(category?.id || "").toLowerCase()) {
    case "smartphone":
      return {
        icon: FaMobileAlt,
        iconClassName: "bg-[#EEF3FF] text-[#2F66F6]",
      };
    case "laptop":
      return {
        icon: FaLaptop,
        iconClassName: "bg-violet-50 text-violet-600",
      };
    case "tv":
      return {
        icon: FaTv,
        iconClassName: "bg-emerald-50 text-emerald-600",
      };
    default:
      return {
        icon: FaClipboardList,
        iconClassName: "bg-slate-100 text-slate-600",
      };
  }
};

const MetricCard = ({
  icon: Icon,
  iconClassName,
  label,
  value,
  supporting,
  secondary,
}) => (
  <article className="bg-white px-4 py-4 sm:px-5">
    <div className="flex items-start justify-between gap-3">
      <div
        className={`flex h-12 w-12 items-center justify-center border border-current/10 text-lg ${iconClassName}`}
      >
        <Icon />
      </div>
    </div>

    <div className="mt-4 space-y-1">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="text-[1.75rem] font-bold tracking-tight text-slate-900">
        {value}
      </div>
    </div>

    <div className="mt-2 min-h-[40px] space-y-1">
      {supporting ? (
        <p className="text-xs font-medium text-slate-500">{supporting}</p>
      ) : null}
      {secondary ? (
        <div className="text-xs font-semibold text-slate-700">{secondary}</div>
      ) : null}
    </div>
  </article>
);

const StateBanner = ({
  icon: Icon,
  iconClassName,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => (
  <section className={`border px-2 py-3 sm:px-3 ${className}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center ${iconClassName}`}
        >
          <Icon />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="border border-current px-4 py-2 text-sm font-semibold text-inherit transition hover:bg-white/70"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  </section>
);

const StatusBadge = ({ category }) => {
  const learningEnabled = getLearningLabel(category) === "Yes";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        learningEnabled
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
      }`}
    >
      {learningEnabled ? "Learning" : "Server score"}
    </span>
  );
};

const CategoryTabs = ({ categories, activeId, onChange }) => (
  <section className={`${SURFACE_CLASS} px-2 py-3 sm:px-3 lg:px-4`}>
    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-950">Category view</h2>
        <p className="text-sm text-slate-500">
          Select one scoring category to inspect. Only the active category is
          rendered below.
        </p>
      </div>
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {toRows(categories).length} categories
      </span>
    </div>

    <div className="grid gap-2 md:grid-cols-3">
      {toRows(categories).map((category) => {
        const active = category?.id === activeId;
        const meta = getCategoryMeta(category);
        const Icon = meta.icon;
        return (
          <button
            key={category?.id}
            type="button"
            onClick={() => onChange(category?.id)}
            className={`border px-3 py-3 text-left transition ${
              active
                ? "border-[#345CFF] bg-[#EEF3FF]"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center border border-current/10 ${meta.iconClassName}`}
              >
                <Icon />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-950">
                    {category?.label || "Category"}
                  </p>
                  <StatusBadge category={category} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                  {category?.model || "Spec score model"}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </section>
);

const DataTable = ({ title, rows, emptyText = "No rows available." }) => (
  <section className={`${SURFACE_CLASS} overflow-hidden`}>
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="border-b border-slate-200 bg-white">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Key
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Note / Purpose
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white text-sm">
          {toRows(rows).map((row, index) => (
            <tr key={`${title}-${row?.key || index}`} className="align-top">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                {row?.key || "-"}
              </td>
              <td className="min-w-[140px] px-4 py-3 font-semibold text-[#345CFF]">
                {row?.value || "-"}
              </td>
              <td className="min-w-[260px] px-4 py-3 leading-6 text-slate-600">
                {row?.note || "-"}
              </td>
            </tr>
          ))}
          {!toRows(rows).length ? (
            <tr>
              <td colSpan={3} className="px-4 py-5 text-center text-slate-500">
                {emptyText}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  </section>
);

const FieldTable = ({ title, rows }) => {
  if (!toRows(rows).length) return null;

  return (
    <section className={`${SURFACE_CLASS} overflow-hidden`}>
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Field
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Server Paths Checked
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Note
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm">
            {toRows(rows).map((row, index) => (
              <tr key={`${title}-${row?.key || index}`} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                  {row?.key || "-"}
                </td>
                <td className="min-w-[320px] px-4 py-3 font-mono text-xs leading-6 text-slate-600">
                  {row?.value || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {row?.note || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const SummaryTable = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  loading,
}) => (
  <section className={`${SURFACE_CLASS} overflow-hidden`}>
    <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-950">
          Algorithm summary
        </h2>
        <p className="text-sm text-slate-500">
          Click a row to open that category in the tab panel.
        </p>
      </div>
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        Live API metadata
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Model
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Display Band
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Mode
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white text-sm">
          {toRows(categories).map((category) => {
            const active = category?.id === activeCategoryId;
            const meta = getCategoryMeta(category);
            const Icon = meta.icon;
            return (
              <tr
                key={category.id}
                onClick={() => onSelectCategory(category?.id || "")}
                className={`cursor-pointer transition ${
                  active ? "bg-[#EEF3FF]" : "hover:bg-slate-50"
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center border border-current/10 ${meta.iconClassName}`}
                    >
                      <Icon />
                    </div>
                    <span className="font-bold text-slate-950">
                      {category.label}
                    </span>
                  </div>
                </td>
                <td className="min-w-[260px] px-4 py-3 text-slate-600">
                  {category.model}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#345CFF]">
                  {category.public_display_band}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge category={category} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {formatDateTime(category.updated_at)}
                </td>
              </tr>
            );
          })}
          {!toRows(categories).length && !loading ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                No spec score algorithm data found.
              </td>
            </tr>
          ) : null}
          {loading ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                Loading spec score algorithms...
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  </section>
);

const CategorySection = ({ category }) => {
  if (!category) return null;

  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  return (
    <section className="space-y-4">
      <section className={`${SURFACE_CLASS} px-4 py-4 lg:px-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center border border-current/10 text-lg ${meta.iconClassName}`}
            >
              <Icon />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  {category.label}
                </h2>
                <StatusBadge category={category} />
              </div>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
                {category.model}
              </p>
            </div>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-px border border-slate-200 bg-slate-200">
            <div className="bg-white px-3 py-3">
              <p className="text-xs font-medium text-slate-500">Public band</p>
              <p className="mt-1 text-base font-bold text-[#345CFF]">
                {category.public_display_band || "0-100"}
              </p>
            </div>
            <div className="bg-white px-3 py-3">
              <p className="text-xs font-medium text-slate-500">Updated</p>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                {formatDateTime(category.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <DataTable title="Score Outputs" rows={category.score_outputs} />
        <DataTable title="Weights" rows={category.weights} />
      </div>

      <DataTable title="Learning / Update Rules" rows={category.learning} />
      <FieldTable title="Mandatory Field Profile" rows={category.mandatory_fields} />
      <FieldTable title="Display Field Profile" rows={category.display_fields} />

      {toRows(category.notes).length ? (
        <StateBanner
          icon={FaInfoCircle}
          iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
          title="Notes"
          description={category.notes.join(" ")}
          className="border-[#DCE5FF] bg-white text-[#2F66F6]"
        />
      ) : null}
    </section>
  );
};

export default function SpecScoreAlgorithms() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const categories = useMemo(
    () => toRows(payload?.categories),
    [payload?.categories],
  );

  const activeCategory = useMemo(
    () =>
      categories.find((category) => category?.id === selectedCategoryId) ||
      categories[0] ||
      null,
    [categories, selectedCategoryId],
  );

  const learningCount = useMemo(
    () =>
      categories.filter((category) => getLearningLabel(category) === "Yes")
        .length,
    [categories],
  );

  const serverProfileCount = Math.max(0, categories.length - learningCount);

  const authHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  }, []);

  const loadAlgorithms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildUrl("/api/admin/spec-score-algorithms"), {
        method: "GET",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setPayload(data || {});
    } catch (err) {
      setError("Failed to load spec score algorithm details from server.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadAlgorithms();
  }, [loadAlgorithms]);

  useEffect(() => {
    if (!categories.length) return;
    const exists = categories.some(
      (category) => category?.id === selectedCategoryId,
    );
    if (!exists) setSelectedCategoryId(categories[0]?.id || "");
  }, [categories, selectedCategoryId]);

  return (
    <div className="min-h-full bg-[#F5F7FF] p-2 sm:p-3">
      <div className="mx-auto max-w-[1480px] space-y-4 sm:space-y-5">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-[2rem] font-bold tracking-tight text-slate-950 sm:text-[2.35rem]">
                Spec Score Algorithms
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Server-side scoring rules for smartphones, laptops, and TVs.
                The page is read-only and reflects the algorithm metadata
                returned by the API.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={loadAlgorithms}
                disabled={loading}
                className={PRIMARY_BUTTON_CLASS}
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryId("smartphone")}
                disabled={!categories.some((category) => category.id === "smartphone")}
                className={SECONDARY_BUTTON_CLASS}
              >
                Smartphone model
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={FaClipboardList}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            label="Categories"
            value={categories.length || "-"}
            supporting="Smartphone, laptop, and TV"
            secondary="One active tab renders at a time"
          />
          <MetricCard
            icon={FaChartLine}
            iconClassName="bg-emerald-50 text-emerald-600"
            label="Learning Enabled"
            value={learningCount}
            supporting="Runtime peer percentile learning"
            secondary="Currently smartphone-only"
          />
          <MetricCard
            icon={FaInfoCircle}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            label="Server Profile Scores"
            value={serverProfileCount}
            supporting="Spec score returned by server"
            secondary="Laptop and TV today"
          />
          <MetricCard
            icon={FaSyncAlt}
            iconClassName="bg-violet-50 text-violet-600"
            label="Last Fetched"
            value={payload?.generated_at ? "Live" : "-"}
            supporting={formatDateTime(payload?.generated_at)}
            secondary={`Algorithm: ${formatDateTime(payload?.updated_at)}`}
          />
        </section>

        {error ? (
          <StateBanner
            icon={FaExclamationCircle}
            iconClassName="bg-rose-100 text-rose-600"
            title="Unable to load algorithm details"
            description={error}
            actionLabel="Try again"
            onAction={loadAlgorithms}
            className="border-rose-200 bg-rose-50 text-rose-600"
          />
        ) : null}

        {loading ? (
          <StateBanner
            icon={FaSpinner}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            title="Loading spec score algorithms..."
            description="Fetching the active server-side scoring metadata."
            className="border-[#DCE5FF] bg-white text-[#2F66F6]"
          />
        ) : null}

        <CategoryTabs
          categories={categories}
          activeId={activeCategory?.id}
          onChange={setSelectedCategoryId}
        />

        <SummaryTable
          categories={categories}
          activeCategoryId={activeCategory?.id}
          onSelectCategory={setSelectedCategoryId}
          loading={loading}
        />

        {!loading && !categories.length ? (
          <StateBanner
            icon={FaInfoCircle}
            iconClassName="bg-[#EEF3FF] text-[#2F66F6]"
            title="No algorithm metadata found"
            description="The API returned an empty category list."
            actionLabel="Refresh"
            onAction={loadAlgorithms}
            className="border-[#DCE5FF] bg-white text-[#2F66F6]"
          />
        ) : null}

        {activeCategory ? <CategorySection category={activeCategory} /> : null}
      </div>
    </div>
  );
}
