/**
 * Responsive Dashboard Layout & Components
 * Provides responsive containers and utilities for dashboard pages
 */

import React from 'react';
import { ResponsiveContainer } from './ResponsiveComponents';

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
    <div className="py-6 md:py-8 border-b border-gray-200 bg-white">
      <ResponsiveContainer>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {backButton && (
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium mb-2">
                {backButton}
              </button>
            )}
            <h1 className="text-responsive-h1 text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
export const ResponsiveDashboardContent = ({ children, className = '' }) => {
  return (
    <div className={`py-6 md:py-8 ${className}`}>
      <ResponsiveContainer>
        {children}
      </ResponsiveContainer>
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
  const colClasses = `
    grid gap-4 md:gap-6
    grid-cols-${cols.mobile}
    sm:grid-cols-${cols.sm}
    md:grid-cols-${cols.md}
    lg:grid-cols-${cols.lg}
  `;

  return (
    <div className={colClasses}>
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="
            bg-white rounded-lg border border-gray-200
            p-4 md:p-6
            hover:shadow-md transition-shadow
          "
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {stat.value}
              </p>
              {stat.change && (
                <p className={`text-sm mt-2 ${
                  stat.change.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change.positive ? '↑' : '↓'} {stat.change.value}
                </p>
              )}
            </div>
            {stat.icon && (
              <div className="flex-shrink-0 text-3xl text-purple-100">
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
    <div className="
      bg-white rounded-lg border border-gray-200
      overflow-hidden
    ">
      {/* Header */}
      {(title || actions) && (
        <div className="
          px-4 md:px-6 py-4 md:py-6
          border-b border-gray-200
          flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
        ">
          <div className="flex-1 min-w-0">
            {title && <h2 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}

      {/* Content */}
      <div className="px-4 md:px-6 py-4 md:py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin">⟳</div>
              <p className="mt-2 text-gray-600">Loading...</p>
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
  return (
    <div className="space-y-6">
      {title && (
        <h3 className="text-responsive-h3 text-gray-900">{title}</h3>
      )}
      <div className={`
        grid gap-4 md:gap-6
        grid-cols-${cols.mobile}
        sm:grid-cols-${cols.sm}
        md:grid-cols-${cols.md}
      `}>
        {children}
      </div>
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      {(title || actions) && (
        <div className="
          px-4 md:px-6 py-4 md:py-6
          border-b border-gray-200
          flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
        ">
          <div className="flex-1 min-w-0">
            {title && <h2 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
};

/**
 * Responsive Sidebar (for dashboard layouts)
 */
export const ResponsiveDashboardSidebar = ({ children }) => {
  return (
    <aside className="
      hidden lg:block
      w-80 bg-white rounded-lg border border-gray-200
      p-6 space-y-6
      sticky top-24 max-h-[calc(100vh-120px)]
      overflow-y-auto
    ">
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 space-y-6">
        {children}
      </div>
      <div>
        {sidebar}
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      {children}
    </div>
  );

  return spacing ? (
    <ResponsiveDashboardContent>
      {layout}
    </ResponsiveDashboardContent>
  ) : (
    layout
  );
};

/**
 * Responsive Action Bar
 */
export const ResponsiveActionBar = ({ children }) => {
  return (
    <div className="
      flex flex-col sm:flex-row gap-3
      p-4 md:p-6
      bg-gray-50 border border-gray-200 rounded-lg
    ">
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
