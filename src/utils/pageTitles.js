import { matchPath } from "react-router-dom";

const APP_NAME = "Hooks Enterprise Cloud";

const routeMeta = (path, page, workspace) => ({
  path,
  page,
  workspace,
});

const TITLE_ROUTES = [
  routeMeta("/login", "Secure Sign-In Workspace", "Identity Access Cloud"),
  routeMeta("/dashboard", "Executive Operations Dashboard", "Enterprise Control Center"),
  routeMeta("/search", "Global Discovery Workspace", "Catalog Intelligence Cloud"),

  routeMeta("/products", "Mobile Inventory Workspace", "Product Catalog Hub"),
  routeMeta("/products/smartphones/create", "Smartphone Creation Studio", "Product Catalog Hub"),
  routeMeta("/products/smartphones/preview/:slug", "Smartphone Preview Console", "Product Experience Suite"),
  routeMeta("/products/smartphones/preview", "Smartphone Preview Console", "Product Experience Suite"),
  routeMeta("/products/smartphones/inventory", "Mobile Inventory Workspace", "Product Catalog Hub"),
  routeMeta("/products/smartphones/upcoming", "Upcoming Launch Pipeline", "Launch Intelligence Desk"),
  routeMeta("/edit-mobile/:id", "Smartphone Editing Studio", "Product Experience Suite"),

  routeMeta("/products/laptops/create", "Laptop Creation Studio", "Product Catalog Hub"),
  routeMeta("/products/laptops/inventory", "Laptop Inventory Workspace", "Product Catalog Hub"),
  routeMeta("/products/laptops/:id/edit", "Laptop Editing Studio", "Product Experience Suite"),

  routeMeta("/products/appliances/create", "Appliance Creation Studio", "Product Catalog Hub"),
  routeMeta("/create-home-appliance", "Appliance Creation Studio", "Product Catalog Hub"),
  routeMeta("/products/tvs/create", "TV Creation Studio", "Product Catalog Hub"),
  routeMeta("/products/homeappliances/inventory", "Appliance Inventory Workspace", "Product Catalog Hub"),
  routeMeta("/products/tvs/inventory", "TV Inventory Workspace", "Product Catalog Hub"),
  routeMeta("/products/homeappliances/:id/edit", "Appliance Editing Studio", "Product Experience Suite"),
  routeMeta("/products/tvs/:id/edit", "TV Editing Studio", "Product Experience Suite"),

  routeMeta("/users", "User Management Workspace", "Identity Governance"),
  routeMeta("/roles", "Role Management Workspace", "Identity Governance"),
  routeMeta("/user-management", "User Management Workspace", "Identity Governance"),
  routeMeta("/customer-management", "Customer Directory Workspace", "CRM Operations Hub"),
  routeMeta("/account-management", "Account Settings Workspace", "System Administration"),
  routeMeta("/change-password", "Credential Security Settings", "System Administration"),
  routeMeta("/permission-management", "Roles and Permissions Matrix", "Identity Governance"),

  routeMeta("/specifications", "Brand Master Workspace", "Master Data Operations"),
  routeMeta("/specifications-manager", "Specifications Governance Console", "Master Data Operations"),
  routeMeta(
    "/specifications/memory-storage/configurations",
    "RAM and Storage Configuration Hub",
    "Master Data Operations",
  ),
  routeMeta("/specifications/categories/create", "Category Governance Workspace", "Master Data Operations"),
  routeMeta("/specifications/brands", "Brand Master Workspace", "Master Data Operations"),
  routeMeta("/specifications/store", "Store Management Workspace", "Master Data Operations"),
  routeMeta("/smartphonesrating", "Ratings Intelligence Console", "Engagement Analytics Desk"),

  routeMeta("/settings", "Compare Pages Studio", "Compare Intelligence Engine"),
  routeMeta("/settings/compare-pages", "Compare Pages Studio", "Compare Intelligence Engine"),
  routeMeta("/settings/compare-scoring", "Compare Scoring Studio", "Compare Intelligence Engine"),
  routeMeta("/settings/device-field-profiles", "Device Field Profiles", "Compare Intelligence Engine"),

  routeMeta("/content", "Newsroom Publishing Studio", "Content Operations Cloud"),
  routeMeta("/content/news-articles", "Newsroom Publishing Studio", "Content Operations Cloud"),
  routeMeta("/content/blogs", "Newsroom Publishing Studio", "Content Operations Cloud"),

  routeMeta("/marketing", "Banner Campaign Studio", "Marketing Operations Cloud"),
  routeMeta("/marketing/banners", "Banner Campaign Studio", "Marketing Operations Cloud"),

  routeMeta("/reports", "Reporting Command Center", "Analytics Operations Cloud"),
  routeMeta("/analytics", "Publishing by User Analytics", "Analytics Operations Cloud"),
  routeMeta("/reports/productcategories", "Product Category Insights", "Analytics Operations Cloud"),
  routeMeta("/reports/productpublishstatus", "Publish Status Analytics", "Analytics Operations Cloud"),
  routeMeta("/reports/launch-timing", "Launch Timing Intelligence", "Analytics Operations Cloud"),
  routeMeta("/reports/useractivity", "Publishing by User Analytics", "Analytics Operations Cloud"),
  routeMeta("/reports/recentactivity", "Recent Publish Activity Monitor", "Analytics Operations Cloud"),
  routeMeta("/reports/trending", "Trending Command Center", "Trend Intelligence Cloud"),
  routeMeta("/reports/hook-score", "Hook Score Analytics", "Analytics Operations Cloud"),
  routeMeta("/reports/feature-clicks", "Feature Clicks Analytics", "Analytics Operations Cloud"),
  routeMeta("/reports/search-popularity", "Search Popularity Analytics", "Analytics Operations Cloud"),
  routeMeta("/reports/career-applications", "Career Applications Console", "Analytics Operations Cloud"),

  routeMeta("/api-tester", "API Testing Console", "Developer Operations Cloud"),
];

const ROOT_WORKSPACES = {
  dashboard: "Enterprise Control Center",
  search: "Catalog Intelligence Cloud",
  products: "Product Catalog Hub",
  settings: "Compare Intelligence Engine",
  specifications: "Master Data Operations",
  content: "Content Operations Cloud",
  marketing: "Marketing Operations Cloud",
  reports: "Analytics Operations Cloud",
  analytics: "Analytics Operations Cloud",
  users: "Identity Governance",
  roles: "Identity Governance",
};

const toTitleCase = (value) =>
  String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

const inferPageFromPath = (pathname = "") => {
  const segments = String(pathname || "/")
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\d+$/.test(segment));

  if (!segments.length) return "Workspace";

  const lastSegment = segments[segments.length - 1];

  if (lastSegment === "edit" && segments.length >= 2) {
    return `${toTitleCase(segments[segments.length - 2])} Editing Studio`;
  }

  return `${toTitleCase(lastSegment)} Workspace`;
};

const inferWorkspaceFromPath = (pathname = "") => {
  const segments = String(pathname || "/").split("/").filter(Boolean);
  const firstSegment = segments[0] || "";

  if (pathname.startsWith("/edit-mobile/")) return "Product Experience Suite";
  if (pathname.startsWith("/user-management")) return "Identity Governance";
  if (pathname.startsWith("/permission-management")) return "Identity Governance";
  if (pathname.startsWith("/customer-management")) return "CRM Operations Hub";
  if (pathname.startsWith("/account-management")) return "System Administration";
  if (pathname.startsWith("/change-password")) return "System Administration";
  if (pathname.startsWith("/smartphonesrating")) return "Engagement Analytics Desk";
  if (pathname.startsWith("/create-home-appliance")) return "Product Catalog Hub";

  return ROOT_WORKSPACES[firstSegment] || "Enterprise SaaS Workspace";
};

const resolveTrendingMeta = (search = "") => {
  const params = new URLSearchParams(search || "");
  const section = String(params.get("section") || "").trim().toLowerCase();

  if (section === "rules") {
    return {
      page: "Trending Rules Workspace",
      workspace: "Trend Intelligence Cloud",
    };
  }

  if (section === "history") {
    return {
      page: "Boost History Workspace",
      workspace: "Trend Intelligence Cloud",
    };
  }

  return {
    page: "Trending Command Center",
    workspace: "Trend Intelligence Cloud",
  };
};

const resolveTitleMeta = (locationLike = {}) => {
  const pathname = locationLike?.pathname || "/";
  const search = locationLike?.search || "";

  if (pathname === "/reports/trending") {
    return resolveTrendingMeta(search);
  }

  const exactMatch = TITLE_ROUTES.find((route) =>
    matchPath({ path: route.path, end: true }, pathname),
  );

  if (exactMatch) {
    return {
      page: exactMatch.page,
      workspace: exactMatch.workspace,
    };
  }

  return {
    page: inferPageFromPath(pathname),
    workspace: inferWorkspaceFromPath(pathname),
  };
};

export const resolvePageTitle = (locationLike = {}) =>
  resolveTitleMeta(locationLike).page;

export const buildDocumentTitle = (locationLike = {}) => {
  const { page, workspace } = resolveTitleMeta(locationLike);

  if (page && workspace && page !== workspace) {
    return `${page} | ${workspace} | ${APP_NAME}`;
  }

  if (page) {
    return `${page} | ${APP_NAME}`;
  }

  return APP_NAME;
};

export { APP_NAME };
