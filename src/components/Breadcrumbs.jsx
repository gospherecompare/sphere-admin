import React from "react";
import useBreadcrumbs from "use-react-router-breadcrumbs";
import { Link } from "react-router-dom";

const Breadcrumbs = () => {
  const breadcrumbs = useBreadcrumbs();

  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        const to = crumb.match?.pathname || "/";
        const label =
          typeof crumb.breadcrumb === "string"
            ? crumb.breadcrumb
            : crumb.breadcrumb;

        return (
          <span key={to + idx} className="inline-flex items-center">
            <Link
              to={to}
              className={
                isLast
                  ? "text-gray-800 font-medium"
                  : "text-gray-600 hover:underline"
              }
            >
              {label}
            </Link>
            {!isLast && <span className="mx-2">/</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
