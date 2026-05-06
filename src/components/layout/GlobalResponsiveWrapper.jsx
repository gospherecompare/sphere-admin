/**
 * Global Responsive Component Wrapper
 * Use this to wrap existing component pages with responsive styles
 * 
 * Example:
 * <ResponsivePageWrapper title="Users" sidebar={<Sidebar />}>
 *   <YourExistingComponent />
 * </ResponsivePageWrapper>
 */

import React, { useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { Menu, X } from 'react-icons/fa';

export const ResponsivePageWrapper = ({
  title,
  subtitle,
  description,
  actions,
  children,
  sidebar,
  layout = 'default', // 'default' | 'sidebar' | 'full'
  headerVariant = 'default', // 'default' | 'gradient' | 'subtle'
  maxWidth = 'max-w-7xl',
}) => {
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const headerClasses = {
    default: 'bg-white border-b border-gray-200',
    gradient: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
    subtle: 'bg-gray-50',
  }[headerVariant];

  const headerTextColor = headerVariant === 'gradient' ? 'text-white' : 'text-gray-900';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {title && (
        <div className={`${headerClasses} sticky top-0 z-40 shadow-sm`}>
          <div className={`${maxWidth} mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className={`text-3xl md:text-4xl font-bold ${headerTextColor}`}>
                  {title}
                </h1>
                {subtitle && (
                  <p className={`mt-2 text-lg ${headerVariant === 'gradient' ? 'text-purple-100' : 'text-gray-600'}`}>
                    {subtitle}
                  </p>
                )}
                {description && (
                  <p className={`mt-3 ${headerVariant === 'gradient' ? 'text-purple-50' : 'text-gray-500'}`}>
                    {description}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto flex-shrink-0">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`${maxWidth} mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8`}>
        {layout === 'sidebar' && sidebar ? (
          // Sidebar Layout
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Mobile sidebar toggle */}
            {isMobile && (
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="
                    w-full px-4 py-2.5
                    bg-purple-600 hover:bg-purple-700
                    text-white rounded-lg font-medium
                    flex items-center justify-center gap-2
                    transition-colors
                  "
                >
                  <Menu size={18} />
                  {sidebarOpen ? 'Hide' : 'Show'} Sidebar
                </button>
              </div>
            )}

            {/* Sidebar */}
            {(sidebarOpen || !isMobile) && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-32">
                  {sidebar}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="lg:col-span-3">
              {children}
            </div>
          </div>
        ) : (
          // Full Width Layout
          children
        )}
      </div>
    </div>
  );
};

/**
 * Responsive Page Section
 * Use for major sections within a page
 */
export const ResponsivePageSection = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  variant = 'card', // 'card' | 'section' | 'bare'
  spacing = true,
}) => {
  const variants = {
    card: 'bg-white rounded-lg border border-gray-200 shadow-sm',
    section: 'border-t border-gray-200 pt-6',
    bare: '',
  };

  return (
    <div className={`${spacing ? 'my-6' : ''} ${variants[variant]}`}>
      {(title || actions) && (
        <div className={`${variant === 'card' ? 'px-6 py-4 border-b border-gray-200' : 'mb-6'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {icon && <span className="text-2xl text-purple-600 flex-shrink-0">{icon}</span>}
              <div className="flex-1 min-w-0">
                {title && (
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-gray-600 text-sm md:text-base mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      {children && (
        <div className={variant === 'card' ? 'p-6' : ''}>
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Responsive Two-Column Layout
 */
export const ResponsiveTwoColumn = ({
  left,
  right,
  ratio = '1:1', // '1:1' | '2:1' | '1:2'
}) => {
  const ratios = {
    '1:1': 'lg:grid-cols-2',
    '2:1': 'lg:grid-cols-3',
    '1:2': 'lg:grid-cols-3',
  };

  const leftColClass = ratio === '2:1' ? 'lg:col-span-2' : ratio === '1:2' ? 'lg:col-span-1' : '';
  const rightColClass = ratio === '2:1' ? 'lg:col-span-1' : ratio === '1:2' ? 'lg:col-span-2' : '';

  return (
    <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${ratios[ratio]}`}>
      <div className={leftColClass}>{left}</div>
      <div className={rightColClass}>{right}</div>
    </div>
  );
};

/**
 * Responsive Three-Column Layout
 */
export const ResponsiveThreeColumn = ({
  left,
  center,
  right,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      <div>{left}</div>
      <div>{center}</div>
      <div>{right}</div>
    </div>
  );
};

/**
 * Responsive Card Grid
 */
export const ResponsiveCardGrid = ({
  children,
  cols = { mobile: 1, sm: 2, md: 2, lg: 3 },
  gap = 'gap-6',
}) => {
  return (
    <div className={`
      grid
      grid-cols-${cols.mobile}
      sm:grid-cols-${cols.sm}
      md:grid-cols-${cols.md}
      lg:grid-cols-${cols.lg}
      ${gap}
    `}>
      {children}
    </div>
  );
};

/**
 * Responsive Item Card
 */
export const ResponsiveItemCard = ({
  title,
  subtitle,
  icon,
  image,
  badge,
  actions,
  onClick,
  children,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200
        overflow-hidden hover:shadow-lg transition-all
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Image/Icon */}
      {(image || icon) && (
        <div className="relative h-32 md:h-40 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center overflow-hidden">
          {image && <img src={image} alt={title} className="w-full h-full object-cover" />}
          {icon && <span className="text-5xl">{icon}</span>}
          {badge && (
            <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 md:p-6">
        {title && (
          <h3 className="text-lg font-bold text-gray-900 truncate">{title}</h3>
        )}
        {subtitle && (
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{subtitle}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>

      {/* Actions */}
      {actions && (
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-100 flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default {
  ResponsivePageWrapper,
  ResponsivePageSection,
  ResponsiveTwoColumn,
  ResponsiveThreeColumn,
  ResponsiveCardGrid,
  ResponsiveItemCard,
};
