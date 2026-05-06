import React, { useState } from "react";
import { Menu, X } from "react-icons/fa";

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

  return (
    <div className="layout-wrapper min-h-screen bg-gray-50">
      {/* Navbar */}
      {navbar && (
        <div className="header-responsive">
          {showSidebar && (
            <button
              className="menu-button-mobile"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          <div className="flex-1">{navbar}</div>
        </div>
      )}

      {/* Sidebar & Content Wrapper */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        {showSidebar && sidebar && (
          <>
            {/* Mobile backdrop */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-110 lg:hidden"
                onClick={closeSidebar}
                aria-hidden="true"
              />
            )}
            {/* Sidebar */}
            <div
              className={`sidebar-wrapper ${sidebarOpen ? "open" : ""}`}
              onClick={closeSidebar}
            >
              {sidebar}
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="layout-content">{children}</div>
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
  return (
    <Component className={`container-responsive ${maxWidth} ${className}`}>
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
  const colsClass = `
    grid-cols-${cols.mobile}
    sm:grid-cols-${cols.sm}
    md:grid-cols-${cols.md}
    lg:grid-cols-${cols.lg}
    xl:grid-cols-${cols.xl}
  `;

  return (
    <div className={`grid ${colsClass} ${gap} ${className}`}>{children}</div>
  );
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
  return (
    <div
      className={`flex flex-${direction} md:flex-${directionDesktop} ${gap} ${items} ${justify} ${className}`}
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
  const hoverClass = hover ? "hover:shadow-lg hover:-translate-y-0.5" : "";
  const clickableClass = clickable ? "cursor-pointer" : "";

  return (
    <div
      className={`card-responsive transition-all duration-200 ${hoverClass} ${clickableClass} ${className}`}
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
      white: "bg-white",
      gray: "bg-gray-50",
      light: "bg-gray-100",
    }[backgroundVariant] || "bg-white";

  return (
    <section className={`py-responsive ${bgClass} ${className}`}>
      <ResponsiveContainer>
        {(title || subtitle) && (
          <div className="mb-8 md:mb-12">
            {title && (
              <h2 className="text-responsive-h2 text-gray-900 mb-2">{title}</h2>
            )}
            {subtitle && <p className="text-gray-600 text-lg">{subtitle}</p>}
          </div>
        )}
        {children}
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
    <div className={`table-responsive ${className}`}>
      <table>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} data-label={headers[cellIdx]}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
    <div className="modal-responsive" onClick={onClose} aria-hidden="true">
      <div
        className={`modal-responsive-content ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-responsive-h3 text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-4 md:p-6">{children}</div>

        {/* Footer */}
        {actions && (
          <div className="flex gap-3 p-4 md:p-6 border-t border-gray-200">
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
