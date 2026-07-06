/**
 * Responsive Breadcrumbs Component
 * Mobile-optimized navigation breadcrumbs
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaChevronRight } from "react-icons/fa";
import PropTypes from "prop-types";

const formatLabel = (segment) =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
      <div className="bg-white">
        <div className="mx-auto w-full max-w-[1280px] px-4 pb-1 pt-3 sm:px-6 sm:pt-3 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[12px] text-[#7d8898]">
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="transition-colors duration-200 hover:text-[#2563eb] inline-flex items-center gap-2">
                <FaHome className="h-3.5 w-3.5 text-[#7d8898]" />
                <span className="text-[12px] text-[#7d8898] hidden sm:inline">Dashboard</span>
              </Link>
              <FaChevronRight className="h-2.5 w-2.5 text-[#b6c2cf]" />
            </div>

            {breadcrumbs.map((breadcrumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              if (breadcrumb.isEllipsis) {
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-[12px] text-[#7d8898]">{breadcrumb.label}</span>
                  </div>
                );
              }

              return (
                <div key={breadcrumb.index || index} className="flex items-center gap-2">
                  {!isLast ? (
                    <Link to={breadcrumb.path} className="transition-colors duration-200 hover:text-[#2563eb]">
                      <span className="text-[12px] text-[#7d8898] max-w-xs truncate">{breadcrumb.label}</span>
                    </Link>
                  ) : (
                    <span className="text-[12px] font-semibold text-[#1f2937] max-w-xs truncate">{breadcrumb.label}</span>
                  )}

                  {!isLast ? <FaChevronRight className="h-2.5 w-2.5 text-[#b6c2cf]" /> : null}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    );
    <nav
      className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm overflow-x-auto px-4 py-3 md:px-6 md:py-4"
      aria-label="Breadcrumb"
    >
      <ol className="flex min-w-max items-center gap-1 text-xs md:min-w-0 md:gap-2 md:text-sm">
        <li>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-2 font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 text-slate-600 transition hover:text-slate-900"
            title="Home"
          >
            <FaHome className="text-base md:text-lg" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </li>

        {breadcrumbs.map((breadcrumb, index) => (
          <li
            key={breadcrumb.index || index}
            className="flex items-center gap-1 md:gap-2"
          >
            <FaChevronRight className="flex-shrink-0 text-xs text-slate-400 md:text-sm" />

            {breadcrumb.isEllipsis ? (
              <span className="px-1 text-slate-400 md:px-2">{breadcrumb.label}</span>
            ) : index === breadcrumbs.length - 1 ? (
              <span className="max-w-xs truncate font-semibold text-slate-900 md:max-w-none">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                to={breadcrumb.path}
                className="max-w-xs truncate text-slate-600 transition hover:text-blue-600 md:max-w-none"
              >
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

ResponsiveBreadcrumbs.propTypes = {
  maxItemsOnMobile: PropTypes.number,
};

export default ResponsiveBreadcrumbs;

