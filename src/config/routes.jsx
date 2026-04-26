/**
 * Central route configuration for the admin application
 * Provides centralized route definitions for easier maintenance and updates
 */

import React, { lazy } from "react";

// Lazy load components for better performance
const Dashboard = lazy(() => import("../components/Dashboard"));
const CreateMobile = lazy(() => import("../components/CreateMobile"));
const SmartphonePreview = lazy(() => import("../components/SmartphonePreview"));
const ViewMobiles = lazy(() => import("../components/ViewMobiles"));
const ViewUpcomingMobiles = lazy(
  () => import("../components/ViewUpcomingMobiles"),
);
const EditMobile = lazy(() => import("../components/EditMobile"));
const ApiTester = lazy(() => import("../components/ApiTester"));
const UserManagement = lazy(() => import("../components/Usermanagment"));
const PermissionManagement = lazy(
  () => import("../components/Permissionmangement"),
);
const SpecificationsManager = lazy(() => import("../components/SpecMangement"));
const MobileRatingCard = lazy(() => import("../components/Rating"));
const ChangePasswordModal = lazy(() => import("../components/Changepassword"));
const AccountManagement = lazy(() => import("../components/AccountManagement"));
const CreateLaptop = lazy(() => import("../components/CreateLaptop"));
const CreateHomeAppliance = lazy(() => import("../components/CreateAppliance"));
const ViewLaptops = lazy(() => import("../components/ViewLaptop"));
const ViewTVs = lazy(() => import("../components/ViewAppliance"));
const ViewCustomers = lazy(() => import("../components/ViewCustomers"));
const RamStorageConfig = lazy(() => import("../components/Ramstorage"));
const Brand = lazy(() => import("../components/Brand"));
const CategoryManagement = lazy(() => import("../components/Category"));
const OnlineStoreManagement = lazy(() => import("../components/Store"));
const ProductCategoryReport = lazy(
  () => import("../components/Reports/ProductCategory"),
);
const ProductPublishStatusReport = lazy(
  () => import("../components/Reports/ProductPublish"),
);
const LaunchTimingReport = lazy(
  () => import("../components/Reports/LaunchTimingReport"),
);
const PublishedByUserReport = lazy(
  () => import("../components/Reports/PublishUser"),
);
const RecentPublishActivity = lazy(
  () => import("../components/Reports/RecentPublish"),
);
const TrendingManager = lazy(
  () => import("../components/Reports/TrendingManager"),
);
const HookScoreReport = lazy(
  () => import("../components/Reports/HookScoreReport"),
);
const FeatureClicksReport = lazy(
  () => import("../components/Reports/FeatureClicksReport"),
);
const SearchPopularityReport = lazy(
  () => import("../components/Reports/SearchPopularityReport"),
);
const CareerApplications = lazy(
  () => import("../components/Reports/CareerApplications"),
);
const BannerManager = lazy(() => import("../components/BannerManager"));
const EditLaptop = lazy(() => import("../components/EditLaptop"));
const EditHomeAppliance = lazy(() => import("../components/EditAppliance"));
const CompareScoring = lazy(
  () => import("../components/Settings/CompareScoring"),
);
const DeviceFieldProfiles = lazy(
  () => import("../components/Settings/DeviceFieldProfiles"),
);
const BlogEditor = lazy(() => import("../components/Content/BlogEditor"));
const GlobalSearchResults = lazy(
  () => import("../components/GlobalSearchResults"),
);

/**
 * Route configuration object
 * Centralized definition of all application routes
 */
export const ROUTE_CONFIG = {
  // Dashboard
  dashboard: {
    path: "/dashboard",
    component: Dashboard,
    label: "Dashboard",
  },

  // Search
  search: {
    path: "/search",
    component: GlobalSearchResults,
    label: "Search",
  },

  // Products - Smartphones
  createSmartphone: {
    path: "/products/smartphones/create",
    component: CreateMobile,
    label: "Create Smartphone",
  },
  smartphonePreview: {
    path: "/products/smartphones/preview",
    component: SmartphonePreview,
    label: "Preview Smartphone",
  },
  smartphonePreviewWithSlug: {
    path: "/products/smartphones/preview/:slug",
    component: SmartphonePreview,
    label: "Preview Smartphone",
  },
  smartphoneInventory: {
    path: "/products/smartphones/inventory",
    component: ViewMobiles,
    label: "Smartphone Inventory",
  },
  upcomingSmartphones: {
    path: "/products/smartphones/upcoming",
    component: ViewUpcomingMobiles,
    label: "Upcoming Smartphones",
  },
  editSmartphone: {
    path: "/edit-mobile/:id",
    component: EditMobile,
    label: "Edit Smartphone",
  },

  // Products - Laptops
  createLaptop: {
    path: "/products/laptops/create",
    component: CreateLaptop,
    label: "Create Laptop",
  },
  laptopInventory: {
    path: "/products/laptops/inventory",
    component: ViewLaptops,
    label: "Laptop Inventory",
  },
  editLaptop: {
    path: "/products/laptops/:id/edit",
    component: EditLaptop,
    label: "Edit Laptop",
  },

  // Products - Home Appliances & TVs
  createAppliance: {
    path: "/products/appliances/create",
    component: CreateHomeAppliance,
    label: "Create Appliance",
  },
  createHomeAppliance: {
    path: "/create-home-appliance",
    component: CreateHomeAppliance,
    label: "Create Home Appliance",
  },
  createTV: {
    path: "/products/tvs/create",
    component: CreateHomeAppliance,
    label: "Create TV",
  },
  applianceInventory: {
    path: "/products/homeappliances/inventory",
    component: ViewTVs,
    label: "Appliance Inventory",
  },
  tvInventory: {
    path: "/products/tvs/inventory",
    component: ViewTVs,
    label: "TV Inventory",
  },
  editAppliance: {
    path: "/products/homeappliances/:id/edit",
    component: EditHomeAppliance,
    label: "Edit Appliance",
  },
  editTV: {
    path: "/products/tvs/:id/edit",
    component: EditHomeAppliance,
    label: "Edit TV",
  },

  // User Management
  userManagement: {
    path: "/user-management",
    component: UserManagement,
    label: "User Management",
  },
  customerManagement: {
    path: "/customer-management",
    component: ViewCustomers,
    label: "Customer Management",
  },

  // Account
  accountManagement: {
    path: "/account-management",
    component: AccountManagement,
    label: "Account Management",
  },
  changePassword: {
    path: "/change-password",
    component: ChangePasswordModal,
    label: "Change Password",
  },

  // Specifications
  specificationsManager: {
    path: "/specifications-manager",
    component: SpecificationsManager,
    label: "Specifications Manager",
  },
  ramStorageConfig: {
    path: "/specifications/memory-storage/configurations",
    component: RamStorageConfig,
    label: "RAM/Storage Configurations",
  },
  categoryManagement: {
    path: "/specifications/categories/create",
    component: CategoryManagement,
    label: "Category Management",
  },
  brandManagement: {
    path: "/specifications/brands",
    component: Brand,
    label: "Brand Management",
  },

  // Permissions & Ratings
  permissionManagement: {
    path: "/permission-management",
    component: PermissionManagement,
    label: "Permission Management",
  },
  smartphoneRating: {
    path: "/smartphonesrating",
    component: MobileRatingCard,
    label: "Smartphone Rating",
  },

  // Settings
  compareScoring: {
    path: "/settings/compare-scoring",
    component: CompareScoring,
    label: "Compare Scoring",
  },
  deviceFieldProfiles: {
    path: "/settings/device-field-profiles",
    component: DeviceFieldProfiles,
    label: "Device Field Profiles",
  },

  // Content
  newsArticles: {
    path: "/content/news-articles",
    component: BlogEditor,
    label: "News Articles",
  },

  // Marketing
  onlineStoreManagement: {
    path: "/specifications/store",
    component: OnlineStoreManagement,
    label: "Online Store Management",
  },
  bannerManagement: {
    path: "/marketing/banners",
    component: BannerManager,
    label: "Banner Management",
  },

  // Reports & Analytics
  productCategoryReport: {
    path: "/reports/productcategories",
    component: ProductCategoryReport,
    label: "Product Category Report",
  },
  productPublishStatusReport: {
    path: "/reports/productpublishstatus",
    component: ProductPublishStatusReport,
    label: "Product Publish Status Report",
  },
  launchTimingReport: {
    path: "/reports/launch-timing",
    component: LaunchTimingReport,
    label: "Launch Timing Report",
  },
  userActivityReport: {
    path: "/reports/useractivity",
    component: PublishedByUserReport,
    label: "User Activity Report",
  },
  recentActivityReport: {
    path: "/reports/recentactivity",
    component: RecentPublishActivity,
    label: "Recent Activity Report",
  },
  trendingReport: {
    path: "/reports/trending",
    component: TrendingManager,
    label: "Trending Report",
  },
  hookScoreReport: {
    path: "/reports/hook-score",
    component: HookScoreReport,
    label: "Hook Score Report",
  },
  featureClicksReport: {
    path: "/reports/feature-clicks",
    component: FeatureClicksReport,
    label: "Feature Clicks Report",
  },
  searchPopularityReport: {
    path: "/reports/search-popularity",
    component: SearchPopularityReport,
    label: "Search Popularity Report",
  },
  careerApplicationsReport: {
    path: "/reports/career-applications",
    component: CareerApplications,
    label: "Career Applications Report",
  },

  // Utilities
  apiTester: {
    path: "/api-tester",
    component: ApiTester,
    label: "API Tester",
  },
};

/**
 * Get all route paths for navigation
 */
export const getAllRoutePaths = () => {
  return Object.values(ROUTE_CONFIG).map((route) => route.path);
};

/**
 * Get route by path
 */
export const getRouteByPath = (path) => {
  return Object.values(ROUTE_CONFIG).find((route) => route.path === path);
};

export default ROUTE_CONFIG;
