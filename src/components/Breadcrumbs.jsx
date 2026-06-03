import React, { useMemo } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

const DASHBOARD_CRUMB = { label: "Dashboard", to: "/dashboard" };

const ROUTE_TRAILS = [
  {
    path: "/dashboard",
    trail: [DASHBOARD_CRUMB, { label: "Overview" }],
  },

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
    path: "/products/smartphones/preview",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Smartphones", to: "/products/smartphones/inventory" },
      { label: "Preview" },
    ],
  },
  {
    path: "/products/smartphones/preview/:slug",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Smartphones", to: "/products/smartphones/inventory" },
      { label: "Preview" },
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
      { label: "Television", to: "/products/tvs/inventory" },
      { label: "Create Television" },
    ],
  },
  {
    path: "/products/tvs/create",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Television", to: "/products/tvs/inventory" },
      { label: "Create Television" },
    ],
  },
  {
    path: "/products/homeappliances/:id/edit",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Television", to: "/products/tvs/inventory" },
      { label: "Edit Television" },
    ],
  },
  {
    path: "/products/tvs/:id/edit",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Products", to: "/products" },
      { label: "Television", to: "/products/tvs/inventory" },
      { label: "Edit Television" },
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
    path: "/specifications/categories",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Specifications", to: "/specifications/brands" },
      { label: "Categories" },
    ],
  },
  {
    path: "/specifications/categories/create",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Specifications", to: "/specifications/brands" },
      { label: "Categories", to: "/specifications/categories" },
      { label: "Create Category" },
    ],
  },
  {
    path: "/specifications/categories/edit/:categoryId",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Specifications", to: "/specifications/brands" },
      { label: "Categories", to: "/specifications/categories" },
      { label: "Edit Category" },
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
    path: "/settings/compare-pages",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Settings", to: "/settings/compare-pages" },
      { label: "Compare Pages" },
    ],
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
    path: "/content/news-articles",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Blog", to: "/content/news-articles" },
      { label: "All Posts" },
    ],
  },
  {
    path: "/content/blogs",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Blog", to: "/content/news-articles" },
      { label: "All Posts" },
    ],
  },
  {
    path: "/marketing/affiliate-links",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Marketing", to: "/marketing/banners" },
      { label: "Affiliate Links" },
    ],
  },

  {
    path: "/reports/productcategories",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "Product Categories" },
    ],
  },
  {
    path: "/reports/productpublishstatus",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "Product Publish Status" },
    ],
  },
  {
    path: "/reports/launch-timing",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "Launch Timing" },
    ],
  },
  {
    path: "/reports/useractivity",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "User Activity" },
    ],
  },
  {
    path: "/reports/recentactivity",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "Recent Publish Activity" },
    ],
  },
  {
    path: "/reports/trending",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "Trending Manager" },
    ],
  },
  {
    path: "/reports/hook-score",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "Hook Score Report" },
    ],
  },
  {
    path: "/reports/feature-clicks",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Feature Clicks", to: "/reports/feature-clicks" },
      { label: "Reports" },
    ],
  },
  {
    path: "/reports/search-popularity",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "Search Popularity Report" },
    ],
  },
  {
    path: "/reports/career-applications",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "Career Applications" },
    ],
  },
  {
    path: "/reports/contact-submissions",
    trail: [
      DASHBOARD_CRUMB,
      { label: "Reports", to: "/reports/useractivity" },
      { label: "Contact Inbox" },
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
    if (pathname === "/reports/trending") {
      const params = new URLSearchParams(location.search || "");
      const section = params.get("section") || "manager";
      const sectionLabel =
        section === "rules"
          ? "Trending Rules"
          : section === "history"
            ? "Boost History"
            : "Trending Manager";

      return [
        DASHBOARD_CRUMB,
        { label: "Trending", to: "/reports/trending" },
        { label: sectionLabel },
      ];
    }

    const matched = ROUTE_TRAILS.find((route) =>
      matchPath({ path: route.path, end: true }, pathname),
    );
    return matched ? matched.trail : buildFallbackTrail(pathname);
  }, [location.pathname, location.search]);

  if (!trail || trail.length === 0) return null;

  return (
    <div className="hidden lg:block">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-y-1 text-slate-500">
          {trail.map((item, idx) => {
            const isLast = idx === trail.length - 1;
            const key = `${item.label}-${idx}`;

            return (
              <li key={key} className="inline-flex items-center">
                {isLast || !item.to ? (
                  <span className="font-medium text-slate-400">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.to}
                    className="font-medium text-slate-600 transition-colors hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                )}

                {!isLast && (
                  <span className="mx-2 text-slate-300" aria-hidden="true">
                    <FaChevronRight className="text-[9px]" />
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

