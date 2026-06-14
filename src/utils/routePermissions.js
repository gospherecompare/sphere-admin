const normalizePath = (value = "") => {
  const path = String(value || "").trim();
  if (!path) return "/";
  return `/${path.replace(/^\/+/, "")}`.replace(/\/+$/, "") || "/";
};

const defaultMessage = "Your account does not have permission to open this section.";

export const ROUTE_ACCESS_RULES = [
  {
    pattern: "/dashboard",
    requiredAnyPermissions: ["dashboard.view"],
    title: "Dashboard access required",
  },
  {
    pattern: "/search",
    requiredAnyPermissions: ["search.view"],
    title: "Search access required",
  },
  {
    pattern: "/products/smartphones/create",
    requiredAnyPermissions: ["products.smartphones.create", "products.create", "products.manage"],
    title: "Smartphone create access required",
  },
  {
    pattern: "/edit-mobile/:id",
    requiredAnyPermissions: ["products.smartphones.edit", "products.edit", "products.manage"],
    title: "Smartphone edit access required",
  },
  {
    pattern: "/products/smartphones/preview",
    requiredAnyPermissions: ["products.smartphones.view", "products.view"],
    title: "Smartphone preview access required",
  },
  {
    pattern: "/products/smartphones/preview/:slug",
    requiredAnyPermissions: ["products.smartphones.view", "products.view"],
    title: "Smartphone preview access required",
  },
  {
    pattern: "/products/smartphones/upcoming",
    requiredAnyPermissions: ["products.smartphones.view", "products.view"],
    title: "Upcoming smartphone access required",
  },
  {
    pattern: "/products/smartphones/inventory",
    requiredAnyPermissions: ["products.smartphones.view", "products.view"],
    title: "Smartphone inventory access required",
  },
  {
    pattern: "/smartphonesrating",
    requiredAnyPermissions: ["products.smartphones.view", "products.view", "products.manage"],
    title: "Smartphone rating access required",
  },
  {
    pattern: "/products/laptops/create",
    requiredAnyPermissions: ["products.laptops.create", "products.create", "products.manage"],
    title: "Laptop create access required",
  },
  {
    pattern: "/products/laptops/:id/edit",
    requiredAnyPermissions: ["products.laptops.edit", "products.edit", "products.manage"],
    title: "Laptop edit access required",
  },
  {
    pattern: "/products/laptops/inventory",
    requiredAnyPermissions: ["products.laptops.view", "products.view"],
    title: "Laptop inventory access required",
  },
  {
    pattern: "/products/tvs/create",
    requiredAnyPermissions: ["products.tvs.create", "products.create", "products.manage"],
    title: "TV create access required",
  },
  {
    pattern: "/products/appliances/create",
    requiredAnyPermissions: ["products.tvs.create", "products.create", "products.manage"],
    title: "Appliance create access required",
  },
  {
    pattern: "/create-home-appliance",
    requiredAnyPermissions: ["products.tvs.create", "products.create", "products.manage"],
    title: "Appliance create access required",
  },
  {
    pattern: "/products/tvs/:id/edit",
    requiredAnyPermissions: ["products.tvs.edit", "products.edit", "products.manage"],
    title: "TV edit access required",
  },
  {
    pattern: "/products/homeappliances/:id/edit",
    requiredAnyPermissions: ["products.tvs.edit", "products.edit", "products.manage"],
    title: "Appliance edit access required",
  },
  {
    pattern: "/products/tvs/inventory",
    requiredAnyPermissions: ["products.tvs.view", "products.view"],
    title: "TV inventory access required",
  },
  {
    pattern: "/products/homeappliances/inventory",
    requiredAnyPermissions: ["products.tvs.view", "products.view"],
    title: "Appliance inventory access required",
  },
  {
    pattern: "/user-management",
    requiredAnyPermissions: ["users.view", "users.manage"],
    title: "User management access required",
  },
  {
    pattern: "/customer-management",
    requiredAnyPermissions: ["customers.view", "customers.manage", "users.view"],
    title: "Customer management access required",
  },
  {
    pattern: "/permission-management",
    requiredAnyPermissions: ["roles.manage", "permissions.manage", "roles.view", "permissions.view"],
    title: "Permission management is restricted",
  },
  {
    pattern: "/specifications-manager",
    requiredAnyPermissions: ["specifications.view", "specifications.manage", "settings.view", "products.view"],
    title: "Specifications access required",
  },
  {
    pattern: "/specifications/categories/create",
    requiredAnyPermissions: ["specifications.categories.create", "specifications.create", "specifications.manage"],
    title: "Category create access required",
  },
  {
    pattern: "/specifications/categories/edit/:categoryId",
    requiredAnyPermissions: ["specifications.categories.edit", "specifications.edit", "specifications.manage"],
    title: "Category edit access required",
  },
  {
    pattern: "/specifications/categories",
    requiredAnyPermissions: ["specifications.categories.view", "specifications.view", "settings.view", "products.view"],
    title: "Category management access required",
  },
  {
    pattern: "/specifications/brands",
    requiredAnyPermissions: ["specifications.brands.view", "specifications.view", "settings.view", "products.view"],
    title: "Brand management access required",
  },
  {
    pattern: "/specifications/store",
    requiredAnyPermissions: ["specifications.stores.view", "specifications.view", "settings.view", "products.view"],
    title: "Store management access required",
  },
  {
    pattern: "/specifications/memory-storage/configurations",
    requiredAnyPermissions: ["specifications.memory_storage.view", "specifications.view", "settings.view", "products.view"],
    title: "Memory and storage access required",
  },
  {
    pattern: "/content/news-articles",
    requiredPermissions: ["content.news.view"],
    requiredAnyPermissions: [
      "content.news.create",
      "content.news.edit",
      "content.news.delete",
      "content.news.publish",
      "content.news.schedule",
      "content.news.approve",
      "content.news.reject",
      "content.news.feature",
      "content.news.pin",
      "content.news.manage",
    ],
    title: "News & Articles access required",
    message: "This newsroom studio is available to roles with News & Articles permissions.",
  },
  {
    pattern: "/marketing/banners",
    requiredAnyPermissions: ["marketing.banners.view", "marketing.view", "marketing.manage"],
    title: "Banner access required",
  },
  {
    pattern: "/marketing/affiliate-links",
    requiredAnyPermissions: ["marketing.affiliate_links.view", "marketing.view", "marketing.manage"],
    title: "Affiliate link access required",
  },
  {
    pattern: "/reports/productcategories",
    requiredAnyPermissions: ["reports.product_categories.view", "reports.view"],
    title: "Product category report access required",
  },
  {
    pattern: "/reports/productpublishstatus",
    requiredAnyPermissions: ["reports.product_publish_status.view", "reports.view"],
    title: "Product publish report access required",
  },
  {
    pattern: "/reports/launch-timing",
    requiredAnyPermissions: ["reports.launch_timing.view", "reports.view"],
    title: "Launch timing report access required",
  },
  {
    pattern: "/reports/useractivity",
    requiredAnyPermissions: ["reports.user_activity.view", "reports.view"],
    title: "User publishing report access required",
  },
  {
    pattern: "/reports/recentactivity",
    requiredAnyPermissions: ["reports.recent_activity.view", "activity.view", "reports.view"],
    title: "Recent activity access required",
  },
  {
    pattern: "/reports/trending",
    requiredAnyPermissions: ["reports.trending.view", "reports.view"],
    title: "Trending report access required",
  },
  {
    pattern: "/reports/hook-score",
    requiredAnyPermissions: ["reports.hook_score.view", "reports.view"],
    title: "Hook score report access required",
  },
  {
    pattern: "/reports/feature-clicks",
    requiredAnyPermissions: ["reports.feature_clicks.view", "reports.view"],
    title: "Feature click report access required",
  },
  {
    pattern: "/reports/search-popularity",
    requiredAnyPermissions: ["reports.search_popularity.view", "reports.view"],
    title: "Search popularity report access required",
  },
  {
    pattern: "/reports/compare-analytics",
    requiredAnyPermissions: ["reports.compare_analytics.view", "reports.view"],
    title: "User compare manager access required",
  },
  {
    pattern: "/reports/career-applications",
    requiredAnyPermissions: ["reports.career_applications.view", "reports.view"],
    title: "Career applications access required",
  },
  {
    pattern: "/reports/contact-submissions",
    requiredAnyPermissions: ["reports.contact_submissions.view", "reports.view"],
    title: "Contact inbox access required",
  },
  {
    pattern: "/settings/compare-pages",
    requiredAnyPermissions: ["settings.compare_pages.view", "settings.view"],
    title: "Compare page access required",
  },
  {
    pattern: "/settings/compare-scoring",
    requiredAnyPermissions: ["settings.compare_scoring.view", "settings.view"],
    title: "Compare scoring access required",
  },
  {
    pattern: "/settings/spec-score-algorithms",
    requiredAnyPermissions: ["settings.spec_score_algorithms.view", "settings.view"],
    title: "Spec score algorithm access required",
  },
  {
    pattern: "/api-tester",
    requiredAnyPermissions: ["settings.api_tester.view", "settings.manage", "settings.view"],
    title: "API tester access required",
  },
  {
    pattern: "/account-management",
    requiredAnyPermissions: ["account.view", "settings.view"],
    title: "Account access required",
  },
  {
    pattern: "/change-password",
    requiredAnyPermissions: ["account.edit", "account.view"],
    title: "Account access required",
  },
];

const patternToRegex = (pattern) => {
  const escaped = normalizePath(pattern)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
};

const compiledRules = ROUTE_ACCESS_RULES.map((rule) => ({
  ...rule,
  normalizedPattern: normalizePath(rule.pattern),
  regex: patternToRegex(rule.pattern),
})).sort((a, b) => b.normalizedPattern.length - a.normalizedPattern.length);

export const getRouteAccessConfig = (path = "") => {
  const normalizedPath = normalizePath(path);
  const rule = compiledRules.find((entry) => entry.regex.test(normalizedPath));
  if (!rule) return null;
  const { pattern, normalizedPattern, regex, ...config } = rule;
  return {
    message: defaultMessage,
    ...config,
  };
};

export default ROUTE_ACCESS_RULES;
