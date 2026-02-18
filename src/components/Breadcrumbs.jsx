import React, { useMemo } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { FaChevronRight, FaHome } from "react-icons/fa";

const DASHBOARD_CRUMB = { label: "Dashboard", to: "/dashboard" };

const ROUTE_TRAILS = [
  { path: "/dashboard", trail: [{ label: "Dashboard" }] },

  {
    path: "/products/smartphones/inventory",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Smartphones", to: "/products/smartphones/inventory" },
      { label: "Inventory" },
    ],
  },
  {
    path: "/products/smartphones/create",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Smartphones", to: "/products/smartphones/inventory" },
      { label: "Create Product" },
    ],
  },
  {
    path: "/edit-mobile/:id",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Smartphones", to: "/products/smartphones/inventory" },
      { label: "Edit Product" },
    ],
  },

  {
    path: "/products/laptops/inventory",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Laptops", to: "/products/laptops/inventory" },
      { label: "Inventory" },
    ],
  },
  {
    path: "/products/laptops/create",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Laptops", to: "/products/laptops/inventory" },
      { label: "Create Product" },
    ],
  },
  {
    path: "/products/laptops/:id/edit",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Laptops", to: "/products/laptops/inventory" },
      { label: "Edit Product" },
    ],
  },

  {
    path: "/products/homeappliances/inventory",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "TVs", to: "/products/tvs/inventory" },
      { label: "Inventory" },
    ],
  },
  {
    path: "/products/tvs/inventory",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "TVs", to: "/products/tvs/inventory" },
      { label: "Inventory" },
    ],
  },
  {
    path: "/products/appliances/create",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "TVs", to: "/products/tvs/inventory" },
      { label: "Create TV" },
    ],
  },
  {
    path: "/products/tvs/create",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "TVs", to: "/products/tvs/inventory" },
      { label: "Create TV" },
    ],
  },
  {
    path: "/products/homeappliances/:id/edit",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "TVs", to: "/products/tvs/inventory" },
      { label: "Edit TV" },
    ],
  },
  {
    path: "/products/tvs/:id/edit",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "TVs", to: "/products/tvs/inventory" },
      { label: "Edit TV" },
    ],
  },

  {
    path: "/specifications/memory-storage/configurations",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Specifications", to: "/specifications/brands" },
      { label: "Memory & Storage" },
      { label: "Configurations" },
    ],
  },
  {
    path: "/specifications/categories/create",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Specifications", to: "/specifications/brands" },
      { label: "Categories" },
      { label: "Configure" },
    ],
  },
  {
    path: "/specifications/brands",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Specifications", to: "/specifications/brands" },
      { label: "Brands" },
    ],
  },
  {
    path: "/specifications/store",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Specifications", to: "/specifications/brands" },
      { label: "Store" },
    ],
  },
  {
    path: "/specifications-manager",
    trail: [DASHBOARD_CRUMB, { label: "Specifications Manager" }],
  },
  {
    path: "/smartphonesrating",
    trail: [DASHBOARD_CRUMB, { label: "Ratings & Reviews" }],
  },

  { path: "/user-management", trail: [DASHBOARD_CRUMB, { label: "Users" }] },
  {
    path: "/customer-management",
    trail: [DASHBOARD_CRUMB, { label: "Customers" }],
  },
  {
    path: "/account-management",
    trail: [DASHBOARD_CRUMB, { label: "My Account" }],
  },
  {
    path: "/permission-management",
    trail: [DASHBOARD_CRUMB, { label: "Roles & Permissions" }],
  },
  {
    path: "/change-password",
    trail: [DASHBOARD_CRUMB, { label: "Change Password" }],
  },

  {
    path: "/settings/compare-scoring",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Settings", to: "/api-tester" },
      { label: "Compare Scoring" },
    ],
  },
  {
    path: "/api-tester",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Settings", to: "/api-tester" },
      { label: "API Tester" },
    ],
  },

  {
    path: "/reports/productcategories",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/productpublishstatus" },
      { label: "Product Categories" },
    ],
  },
  {
    path: "/reports/productpublishstatus",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/productpublishstatus" },
      { label: "Publish Status" },
    ],
  },
  {
    path: "/reports/useractivity",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/productpublishstatus" },
      { label: "User Activity" },
    ],
  },
  {
    path: "/reports/recentactivity",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/productpublishstatus" },
      { label: "Recent Activity" },
    ],
  },
  {
    path: "/reports/trending",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/productpublishstatus" },
      { label: "Trending Manager" },
    ],
  },
  {
    path: "/reports/hook-score",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/productpublishstatus" },
      { label: "Hook Score Report" },
    ],
  },
  {
    path: "/reports/feature-clicks",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/productpublishstatus" },
      { label: "Feature Clicks" },
    ],
  },
];

const toTitle = (segment) =>
  String(segment || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const buildFallbackTrail = (pathname) => {
  const segments = String(pathname || "")
    .split("/")
    .filter(Boolean);

  if (!segments.length) return [{ label: "Dashboard", to: "/dashboard" }];

  const crumbs = [{ label: "Dashboard", to: "/dashboard" }];
  let acc = "";
  segments.forEach((seg, idx) => {
    acc += `/${seg}`;
    crumbs.push({
      label: toTitle(seg),
      to: idx === segments.length - 1 ? undefined : acc,
    });
  });

  return crumbs;
};

const Breadcrumbs = () => {
  const location = useLocation();

  const trail = useMemo(() => {
    const pathname = location.pathname || "/";
    const matched = ROUTE_TRAILS.find((route) =>
      matchPath({ path: route.path, end: true }, pathname),
    );
    return matched ? matched.trail : buildFallbackTrail(pathname);
  }, [location.pathname]);

  if (!trail || trail.length === 0) return null;

  return (
    <div className="border border-gray-100 rounded-xl px-3 py-2 sm:px-4 sm:py-3">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex items-center flex-wrap gap-y-1">
          {trail.map((item, idx) => {
            const isLast = idx === trail.length - 1;
            const key = `${item.label}-${idx}`;

            return (
              <li key={key} className="inline-flex items-center">
                {idx === 0 && (
                  <span className="mr-2 text-gray-400" aria-hidden="true">
                    <FaHome className="text-xs" />
                  </span>
                )}

                {isLast || !item.to ? (
                  <span className="text-gray-900 font-semibold">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.to}
                    className="text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    {item.label}
                  </Link>
                )}

                {!isLast && (
                  <span className="mx-2 text-gray-300" aria-hidden="true">
                    <FaChevronRight className="text-[10px]" />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumbs;
