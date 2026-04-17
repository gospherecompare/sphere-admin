/**
 * Responsive Layout Components
 * Professional page layouts with mobile-first design
 */

/**
 * Page Container - Main wrapper for page content
 */
export const PageContainer = ({
  children,
  title,
  description,
  actions,
  className = "",
}) => (
  <div className={`page-shell page-stack ${className}`.trim()}>
    {/* Page Header */}
    {(title || description || actions) && (
      <div className="ui-form-shell p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            {title && (
              <h1 className="page-title text-2xl md:text-3xl">{title}</h1>
            )}
            {description && (
              <p className="page-copy mt-2 text-sm md:text-base">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="ui-toolbar-actions">{actions}</div>}
        </div>
      </div>
    )}

    {/* Page Content */}
    <main className="page-stack">{children}</main>
  </div>
);

/**
 * Content Section - For organizing page content
 */
export const ContentSection = ({
  title,
  subtitle,
  children,
  className = "",
}) => (
  <div className={`ui-form-shell p-4 md:p-6 ${className}`.trim()}>
    {title && (
      <div className="mb-6">
        <p className="page-kicker mb-1">Section</p>
        <h2 className="text-lg md:text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="page-copy mt-1 text-sm">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

/**
 * Two Column Layout
 */
export const TwoColumnLayout = ({
  left,
  right,
  leftClassName = "md:w-1/3",
  rightClassName = "md:w-2/3",
  gap = 6,
  className = "",
}) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-3 ${className}`.trim()}
    style={{ gap: `${gap * 0.25}rem` }}
  >
    <div className={leftClassName}>{left}</div>
    <div className={rightClassName}>{right}</div>
  </div>
);

/**
 * Three Column Layout
 */
export const ThreeColumnLayout = ({ columns, gap = 6, className = "" }) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}
    style={{ gap: `${gap * 0.25}rem` }}
  >
    {columns.map((col, idx) => (
      <div key={idx}>{col}</div>
    ))}
  </div>
);

/**
 * Stats Card Layout
 */
export const StatsGrid = ({ stats }) => (
  <div className="ui-stat-grid">
    {stats.map((stat, idx) => (
      <div key={idx} className="ui-stat-card transition-transform hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="page-kicker">{stat.label}</p>
            <p className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">
              {stat.value}
            </p>
            {stat.change && (
              <p
                className={`mt-2 text-xs md:text-sm font-medium ${
                  stat.change > 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {stat.change > 0 ? "+" : "-"} {Math.abs(stat.change)}%
              </p>
            )}
          </div>
          {stat.icon && (
            <div className="text-3xl md:text-4xl text-slate-300">{stat.icon}</div>
          )}
        </div>
      </div>
    ))}
  </div>
);

/**
 * Empty State
 */
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => (
  <div className={`ui-form-shell p-8 text-center md:p-12 ${className}`.trim()}>
    {icon && <div className="mb-4 text-4xl opacity-50 md:text-6xl">{icon}</div>}
    <h3 className="mb-2 text-lg font-semibold text-slate-900 md:text-xl">
      {title}
    </h3>
    {description && (
      <p className="page-copy mb-6 text-sm md:text-base">{description}</p>
    )}
    {action && <div>{action}</div>}
  </div>
);

/**
 * Loading Skeleton
 */
export const SkeletonBox = ({ count = 3, height = "h-12" }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`${height} animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-white to-slate-200`}
      />
    ))}
  </div>
);

/**
 * Tab Navigation
 */
export const TabNavigation = ({ tabs, activeTab, onTabChange }) => (
  <div className="ui-form-shell overflow-hidden">
    <div className="flex gap-1 overflow-x-auto p-2 md:gap-2 scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`whitespace-nowrap rounded-xl px-3 py-3 text-sm font-semibold transition-colors md:px-4 md:py-4 md:text-base ${
            activeTab === tab.id
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

export default {
  PageContainer,
  ContentSection,
  TwoColumnLayout,
  ThreeColumnLayout,
  StatsGrid,
  EmptyState,
  SkeletonBox,
  TabNavigation,
};
