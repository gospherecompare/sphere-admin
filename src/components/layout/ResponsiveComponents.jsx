import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

const gridCols = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const smGridCols = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
};

const mdGridCols = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

const lgGridCols = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

const xlGridCols = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
};

const flexDirections = {
  row: "flex-row",
  col: "flex-col",
  "row-reverse": "flex-row-reverse",
  "col-reverse": "flex-col-reverse",
};

const mdFlexDirections = {
  row: "md:flex-row",
  col: "md:flex-col",
  "row-reverse": "md:flex-row-reverse",
  "col-reverse": "md:flex-col-reverse",
};

const maxWidthMap = {
  "max-w-sm": "max-w-sm",
  "max-w-md": "max-w-md",
  "max-w-lg": "max-w-lg",
  "max-w-xl": "max-w-xl",
  "max-w-2xl": "max-w-2xl",
  "max-w-3xl": "max-w-3xl",
  "max-w-4xl": "max-w-4xl",
  "max-w-5xl": "max-w-5xl",
  "max-w-6xl": "max-w-6xl",
  "max-w-7xl": "max-w-7xl",
};

const cardShell =
  "rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm";

/**
 * ResponsiveLayout Component
 * Provides a mobile-first responsive layout wrapper for the entire app
 */
export const ResponsiveLayout = ({
  children,
  sidebar,
  navbar,
  showSidebar = true,
  sidebarPosition = "left",
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const sidebarDock =
    sidebarPosition === "right" ? "right-0 lg:order-2" : "left-0 lg:order-1";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)]">
      {navbar && (
        <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1720px] items-center gap-4 px-4 sm:px-6 lg:px-8">
            {showSidebar && (
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-slate-300 hover:bg-white lg:hidden"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
              </button>
            )}
            <div className="min-w-0 flex-1">{navbar}</div>
          </div>
        </div>
      )}

      <div className="relative mx-auto flex w-full max-w-[1720px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        {showSidebar && sidebar && (
          <>
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
                onClick={closeSidebar}
                aria-hidden="true"
              />
            )}
            <div
              className={`fixed bottom-0 top-16 z-50 w-[min(320px,100vw)] transition-transform duration-300 lg:sticky lg:top-24 lg:z-10 lg:block lg:w-72 ${sidebarDock} ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
              }`}
            >
              <div className={`${cardShell} h-full overflow-y-auto p-2 lg:h-auto`}>
                {sidebar}
              </div>
            </div>
          </>
        )}

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
};

/**
 * ResponsiveContainer Component
 * Wrapper for content with responsive padding and max-width
 */
export const ResponsiveContainer = ({
  children,
  maxWidth = "max-w-6xl",
  className = "",
  as: Component = "div",
}) => {
  const maxWidthClass = maxWidthMap[maxWidth] || "max-w-6xl";

  return (
    <Component
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWidthClass} ${className}`.trim()}
    >
      {children}
    </Component>
  );
};

/**
 * ResponsiveGrid Component
 * Mobile-first responsive grid system
 */
export const ResponsiveGrid = ({
  children,
  cols = {
    mobile: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  },
  gap = "gap-4",
  className = "",
}) => {
  const colsClass = [
    gridCols[cols.mobile] || "grid-cols-1",
    smGridCols[cols.sm] || "sm:grid-cols-2",
    mdGridCols[cols.md] || "md:grid-cols-3",
    lgGridCols[cols.lg] || "lg:grid-cols-4",
    xlGridCols[cols.xl] || "xl:grid-cols-5",
  ].join(" ");

  return <div className={`grid ${colsClass} ${gap} ${className}`}>{children}</div>;
};

/**
 * ResponsiveFlex Component
 * Flex layout that stacks on mobile
 */
export const ResponsiveFlex = ({
  children,
  direction = "col",
  directionDesktop = "row",
  gap = "gap-4",
  items = "items-center",
  justify = "justify-between",
  className = "",
}) => {
  const mobileDirection = flexDirections[direction] || "flex-col";
  const desktopDirection =
    mdFlexDirections[directionDesktop] || "md:flex-row";

  return (
    <div
      className={`flex ${mobileDirection} ${desktopDirection} ${gap} ${items} ${justify} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveCard Component
 * Card that's responsive with adaptive padding
 */
export const ResponsiveCard = ({
  children,
  className = "",
  hover = true,
  clickable = false,
  onClick = null,
}) => {
  const hoverClass = hover
    ? "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
    : "";
  const clickableClass = clickable ? "cursor-pointer" : "";

  return (
    <div
      className={`${cardShell} p-4 md:p-6 ${hoverClass} ${clickableClass} ${className}`.trim()}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveSection Component
 * Section with responsive padding
 */
export const ResponsiveSection = ({
  children,
  title = null,
  subtitle = null,
  className = "",
  backgroundVariant = "white",
}) => {
  const bgClass =
    {
      white: "bg-white/80",
      gray: "bg-slate-50/90",
      light: "bg-slate-100/90",
    }[backgroundVariant] || "bg-white/80";

  return (
    <section className={`py-6 sm:py-8 lg:py-10 ${className}`.trim()}>
      <ResponsiveContainer>
        <div className={`${cardShell} ${bgClass} p-5 sm:p-6 lg:p-8`}>
          {(title || subtitle) && (
            <div className="mb-6 sm:mb-8">
              {title && (
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </ResponsiveContainer>
    </section>
  );
};

/**
 * ResponsiveTable Component
 * Mobile-responsive table with card view on small screens
 */
export const ResponsiveTable = ({ headers, rows, className = "" }) => {
  return (
    <div className={`overflow-hidden ${className}`.trim()}>
      <div className="space-y-3 sm:hidden">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`${cardShell} space-y-3 p-4`}
          >
            {row.map((cell, cellIdx) => (
              <div
                key={cellIdx}
                className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {headers[cellIdx]}
                </span>
                <div className="min-w-0 text-right text-sm text-slate-800">
                  {cell}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={`${cardShell} hidden overflow-x-auto sm:block`}>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/60">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 text-sm text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * ResponsiveModal Component
 * Mobile-responsive modal
 */
export const ResponsiveModal = ({
  isOpen,
  onClose,
  title,
  children,
  actions = null,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizeClass =
    {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
    }[size] || "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className={`${cardShell} w-full ${sizeClass} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 md:px-6">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 md:text-xl">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-800"
              aria-label="Close modal"
            >
              <FaTimes size={16} />
            </button>
          </div>
        )}

        <div className="px-5 py-4 md:px-6 md:py-6">{children}</div>

        {actions && (
          <div className="flex flex-wrap gap-3 border-t border-slate-200 px-5 py-4 md:px-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  ResponsiveLayout,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveFlex,
  ResponsiveCard,
  ResponsiveSection,
  ResponsiveTable,
  ResponsiveModal,
};
