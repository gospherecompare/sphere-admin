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

const ResponsiveBreadcrumbs = ({ maxItemsOnMobile = 2 }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  if (pathnames.length === 0) return null;

  const getVisibleBreadcrumbs = () => {
    if (pathnames.length <= maxItemsOnMobile) {
      return pathnames.map((name, index) => ({
        name,
        label: formatLabel(name),
        path: `/${pathnames.slice(0, index + 1).join("/")}`,
        index,
      }));
    }

    return [
      {
        name: pathnames[0],
        label: formatLabel(pathnames[0]),
        path: `/${pathnames[0]}`,
        index: 0,
      },
      {
        name: "ellipsis",
        label: "...",
        path: "#",
        isEllipsis: true,
      },
      {
        name: pathnames[pathnames.length - 1],
        label: formatLabel(pathnames[pathnames.length - 1]),
        path: `/${pathnames.join("/")}`,
        index: pathnames.length - 1,
      },
    ];
  };

  const breadcrumbs = getVisibleBreadcrumbs();

  return (
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

