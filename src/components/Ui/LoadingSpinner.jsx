import React from "react";

/**
 * Loading Spinner Component
 * Displays a spinning loader with optional message
 */
export const LoadingSpinner = ({ message = "Loading...", fullPage = true }) => {
  const containerClasses = fullPage
    ? "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-sm"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="surface-panel-strong flex max-w-sm flex-col items-center rounded-[28px] px-6 py-5 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-200/70" />
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-blue-600" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-800">{message}</p>
        <p className="mt-1 text-xs text-slate-500">
          Please wait while we prepare the workspace.
        </p>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader Component
 * Displays skeleton placeholders while content loads
 */
export const SkeletonLoader = ({ count = 3, height = "h-12" }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200`}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;
