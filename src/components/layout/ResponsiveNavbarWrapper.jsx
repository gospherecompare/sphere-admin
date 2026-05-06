/**
 * Responsive Navbar Wrapper
 * Wraps existing Navbar component with responsive styling
 * Usage: <ResponsiveNavbarWrapper><ExistingNavbar /></ResponsiveNavbarWrapper>
 */

import React from 'react';

export const ResponsiveNavbarWrapper = ({ children, logo, rightSection }) => {
  return (
    <header className="
      w-full bg-white border-b border-gray-200
      sticky top-0 z-50
      px-4 md:px-6 lg:px-8
      py-3
      shadow-sm
    ">
      <div className="flex items-center justify-between gap-4">
        {/* Logo/Brand - Hidden on very small screens */}
        {logo && (
          <div className="flex-shrink-0 hidden sm:block">
            {logo}
          </div>
        )}

        {/* Main navbar content - Responsive */}
        <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
          {children}
          
          {/* Right section (user menu, notifications, etc) */}
          {rightSection && (
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {rightSection}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * Responsive Search Bar
 */
export const ResponsiveSearchBar = ({ 
  placeholder = 'Search...', 
  onSearch, 
  className = '' 
}) => {
  return (
    <div className={`relative flex-1 min-w-0 max-w-md ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => onSearch?.(e.target.value)}
        className="
          w-full px-4 py-2
          bg-gray-100 rounded-lg
          text-sm focus-ring
          placeholder-gray-500
          hidden sm:block
        "
      />
    </div>
  );
};

/**
 * Responsive Nav Button (for mobile menu, user profile, etc)
 */
export const ResponsiveNavButton = ({
  icon,
  label,
  badge,
  onClick,
  variant = 'ghost',
}) => {
  const variants = {
    ghost: 'text-gray-700 hover:bg-gray-100',
    primary: 'text-purple-700 hover:bg-purple-50',
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg
        flex items-center gap-2
        transition-colors
        ${variants[variant]}
        touch-target
      `}
      title={label}
    >
      {icon}
      {label && <span className="hidden md:inline text-sm">{label}</span>}
      {badge && (
        <span className="
          absolute top-0 right-0
          bg-red-500 text-white
          text-xs font-bold
          w-5 h-5 rounded-full
          flex items-center justify-center
        ">
          {badge}
        </span>
      )}
    </button>
  );
};

/**
 * Responsive Navbar Divider
 */
export const ResponsiveNavDivider = () => {
  return <div className="hidden md:block w-px h-6 bg-gray-200" />;
};

export default {
  ResponsiveNavbarWrapper,
  ResponsiveSearchBar,
  ResponsiveNavButton,
  ResponsiveNavDivider,
};
