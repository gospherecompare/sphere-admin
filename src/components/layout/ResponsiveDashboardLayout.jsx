/**
 * Responsive Dashboard Layout & Components
 * Provides responsive containers and utilities for dashboard pages
 */

import React from "react";
import { ResponsiveContainer } from "./ResponsiveComponents";

const gridCols = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

const smGridCols = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

const mdGridCols = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

const lgGridCols = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

const shellClass =
  "rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm";

/**
 * Responsive Dashboard Header
 */
export const ResponsiveDashboardHeader = ({
  title,
  subtitle,
  actions,
  backButton,
}) => {
  return (
    <div className="border-b border-slate-200/80 bg-white/90 py-6 backdrop-blur md:py-8">
      <ResponsiveContainer>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            {backButton && (
              <button className="mb-2 text-sm font-semibold text-purple-600 transition hover:text-purple-700">
                {backButton}
              </button>
            )}
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              {actions}
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Responsive Page Content Wrapper
 */
export const ResponsiveDashboardContent = ({ children, className = "" }) => {
  return (
    <div className={`py-6 md:py-8 ${className}`.trim()}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  );
};

/**
 * Responsive Stat Grid
 * Shows stats in a responsive grid
 */
export const ResponsiveStatGrid = ({
  stats = [],
  cols = { mobile: 1, sm: 2, md: 3, lg: 4 },
}) => {
  const colClasses = [
    gridCols[cols.mobile] || "grid-cols-1",
    smGridCols[cols.sm] || "sm:grid-cols-2",
    mdGridCols[cols.md] || "md:grid-cols-3",
    lgGridCols[cols.lg] || "lg:grid-cols-4",
  ].join(" ");

  return (
    <div className={`grid gap-4 md:gap-6 ${colClasses}`}>
      {stats.map((stat, idx) => (
        <div key={idx} className={`${shellClass} p-4 md:p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950 md:text-3xl">
                {stat.value}
              </p>
              {stat.change && (
                <p
                  className={`mt-2 text-sm font-semibold ${
                    stat.change.positive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {stat.change.positive ? "+ " : "- "}
                  {stat.change.value}
                </p>
              )}
            </div>
            {stat.icon && (
              <div className="shrink-0 rounded-2xl bg-purple-50 p-3 text-2xl text-purple-600">
                {stat.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Responsive Content Card
 * Wrapper for major content sections
 */
export const ResponsiveContentCard = ({
  title,
  subtitle,
  actions,
  children,
  loading,
}) => {
  return (
    <div className={`${shellClass} overflow-hidden`}>
      {(title || actions) && (
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 md:px-6 md:py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 md:text-xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex gap-2 sm:flex-shrink-0">{actions}</div>}
        </div>
      )}

      <div className="px-4 py-4 md:px-6 md:py-6">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-flex flex-col items-center gap-3">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-r-transparent" />
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

/**
 * Responsive Form Section
 */
export const ResponsiveFormSection = ({
  title,
  children,
  cols = { mobile: 1, sm: 2, md: 2 },
}) => {
  const colClasses = [
    gridCols[cols.mobile] || "grid-cols-1",
    smGridCols[cols.sm] || "sm:grid-cols-2",
    mdGridCols[cols.md] || "md:grid-cols-2",
  ].join(" ");

  return (
    <div className="space-y-6">
      {title && (
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
          {title}
        </h3>
      )}
      <div className={`grid gap-4 md:gap-6 ${colClasses}`}>{children}</div>
    </div>
  );
};

/**
 * Responsive Table Section
 */
export const ResponsiveTableSection = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  return (
    <div className={`${shellClass} overflow-hidden`}>
      {(title || actions) && (
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 md:px-6 md:py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 md:text-xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex gap-2 sm:flex-shrink-0">{actions}</div>}
        </div>
      )}

      <div className="overflow-x-auto">{children}</div>
    </div>
  );
};

/**
 * Responsive Sidebar (for dashboard layouts)
 */
export const ResponsiveDashboardSidebar = ({ children }) => {
  return (
    <aside
      className={`sticky top-24 hidden max-h-[calc(100vh-120px)] w-80 space-y-6 overflow-y-auto p-6 lg:block ${shellClass}`}
    >
      {children}
    </aside>
  );
};

/**
 * Responsive Main Content Area
 */
export const ResponsiveDashboardMain = ({
  children,
  sidebar,
  spacing = true,
}) => {
  const layout = sidebar ? (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
      <div className="space-y-6 lg:col-span-2">{children}</div>
      <div>{sidebar}</div>
    </div>
  ) : (
    <div className="space-y-6">{children}</div>
  );

  return spacing ? (
    <ResponsiveDashboardContent>{layout}</ResponsiveDashboardContent>
  ) : (
    layout
  );
};

/**
 * Responsive Action Bar
 */
export const ResponsiveActionBar = ({ children }) => {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 sm:flex-row md:p-6">
      {children}
    </div>
  );
};

export default {
  ResponsiveDashboardHeader,
  ResponsiveDashboardContent,
  ResponsiveStatGrid,
  ResponsiveContentCard,
  ResponsiveFormSection,
  ResponsiveTableSection,
  ResponsiveDashboardSidebar,
  ResponsiveDashboardMain,
  ResponsiveActionBar,
};
