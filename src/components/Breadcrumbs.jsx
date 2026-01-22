import React from "react";
import useBreadcrumbs from "use-react-router-breadcrumbs";
import { Link } from "react-router-dom";

const isIdValue = (v) => {
  if (v == null) return false;
  const s = String(v);
  if (!s) return false;
  // numeric ids
  if (/^\d+$/.test(s)) return true;
  // uuid-like or long hex with dashes
  if (/^[0-9a-fA-F-]{8,}$/.test(s)) return true;
  return false;
};

const Breadcrumbs = () => {
  const breadcrumbs = useBreadcrumbs();

  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  // filter out crumbs that are empty, undefined, or just numeric/ID params
  const visible = breadcrumbs.filter((crumb) => {
    const label =
      typeof crumb.breadcrumb === "string"
        ? crumb.breadcrumb
        : crumb.breadcrumb;
    if (!label || label === "undefined" || label === "null") return false;

    const params = crumb.match?.params || {};
    const paramValues = Object.values(params);
    if (paramValues.length > 0 && paramValues.every(isIdValue)) return false;

    return true;
  });

  if (visible.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
      {visible.map((crumb, idx) => {
        const isLast = idx === visible.length - 1;
        const to = crumb.match?.pathname || crumb.pathname || "/";
        const label =
          typeof crumb.breadcrumb === "string"
            ? crumb.breadcrumb
            : crumb.breadcrumb;

        return (
          <span key={(to || "") + idx} className="inline-flex items-center">
            {isLast ? (
              <span className="text-gray-800 font-medium">{label}</span>
            ) : (
              <Link to={to} className="text-gray-600 hover:underline">
                {label}
              </Link>
            )}
            {!isLast && <span className="mx-2">/</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
