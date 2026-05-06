/**
 * Responsive Sidebar Wrapper
 * Wraps existing Sidebar component with responsive styling
 * Usage: <ResponsiveSidebarWrapper><ExistingSidebar /></ResponsiveSidebarWrapper>
 */

import React from 'react';

export const ResponsiveSidebarWrapper = ({ children }) => {
  return (
    <aside className="
      w-64 bg-white border-r border-gray-200
      h-screen overflow-y-auto
      hidden lg:block
      scrollbar-thin
    ">
      <nav className="p-4 space-y-2">
        {children}
      </nav>
    </aside>
  );
};

/**
 * Responsive Sidebar Menu Item
 * Use for navigation items in sidebar
 */
export const ResponsiveSidebarItem = ({
  icon,
  label,
  badge,
  isActive,
  onClick,
  children,
  collapsed,
}) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div>
      <button
        onClick={onClick}
        className={`
          w-full px-4 py-3 rounded-lg
          flex items-center justify-between
          text-left transition-colors
          ${isActive
            ? 'bg-purple-100 text-purple-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
          }
          touch-target
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && <span className="flex-shrink-0 text-lg">{icon}</span>}
          <span className="truncate">{label}</span>
          {badge && (
            <span className="
              ml-auto flex-shrink-0
              bg-red-500 text-white
              text-xs font-semibold
              px-2 py-0.5 rounded-full
            ">
              {badge}
            </span>
          )}
        </div>
        {hasChildren && (
          <span className={`text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}>
            ▼
          </span>
        )}
      </button>

      {/* Submenu - Only show when not collapsed */}
      {hasChildren && !collapsed && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Responsive Sidebar Section
 * Group related sidebar items
 */
export const ResponsiveSidebarSection = ({ title, children }) => {
  return (
    <div className="my-6">
      {title && (
        <h3 className="
          px-4 py-2 text-xs font-semibold
          text-gray-500 uppercase tracking-wider
        ">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

export default {
  ResponsiveSidebarWrapper,
  ResponsiveSidebarItem,
  ResponsiveSidebarSection,
};
