import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Breadcrumbs from "./Breadcrumbs";
import ROUTE_CONFIG from "../config/routes";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import AccessGate from "./AccessGate";

/**
 * Main Layout Component for authenticated routes
 * Provides sidebar, navbar, breadcrumbs, and main content routing
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isMobile - Is mobile device
 * @param {boolean} props.sidebarCollapsed - Sidebar collapsed state
 * @param {Function} props.setSidebarCollapsed - Sidebar toggle handler
 * @param {boolean} props.sidebarOpen - Mobile sidebar open state
 * @param {Function} props.setSidebarOpen - Mobile sidebar toggle handler
 * @param {Function} props.onLogout - Logout handler
 * @returns {ReactNode} Main layout with routing
 */
const MainLayout = ({
  isMobile,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
}) => {
  /**
   * Close sidebar when route changes on mobile
   */
  const handleRouteChange = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile ? "fixed left-0 top-0 bottom-0" : "relative"}
          ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}
          md:translate-x-0 md:static
          z-40 transform transition-transform duration-300 ease-in-out
          h-full
          flex-shrink-0
        `}
      >
        <Sidebar
          collapsed={isMobile ? false : sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
          mobileOpen={sidebarOpen}
          setMobileOpen={setSidebarOpen}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`
          flex-1 flex flex-col w-full min-w-0 overflow-hidden
          transition-all duration-300
        `}
      >
        {/* Navbar */}
        <nav className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <Navbar
            onToggleSidebar={() => {
              if (isMobile) {
                setSidebarOpen(!sidebarOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            sidebarCollapsed={sidebarCollapsed}
            sidebarOpen={sidebarOpen}
            isMobile={isMobile}
            onLogout={onLogout}
          />
        </nav>

        {/* Main Content */}
        <main
          className="flex-1 overflow-auto p-0"
          onClick={
            isMobile && sidebarOpen ? () => setSidebarOpen(false) : undefined
          }
          role="main"
        >
          <div className="w-full h-full">
            <Breadcrumbs />

            {/* Routes with Suspense Boundary */}
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Dashboard */}
                <Route
                  path="/"
                  element={
                    <Navigate
                      to="/dashboard"
                      replace
                      onClick={handleRouteChange}
                    />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ROUTE_CONFIG.dashboard.component isMobile={isMobile} />
                  }
                />

                {/* Search */}
                <Route
                  path="/search"
                  element={<ROUTE_CONFIG.search.component />}
                />

                {/* Smartphones */}
                <Route
                  path="/products/smartphones/create"
                  element={<ROUTE_CONFIG.createSmartphone.component />}
                />
                <Route
                  path="/products/smartphones/preview"
                  element={<ROUTE_CONFIG.smartphonePreview.component />}
                />
                <Route
                  path="/products/smartphones/preview/:slug"
                  element={<ROUTE_CONFIG.smartphonePreviewWithSlug.component />}
                />
                <Route
                  path="/products/smartphones/inventory"
                  element={<ROUTE_CONFIG.smartphoneInventory.component />}
                />
                <Route
                  path="/products/smartphones/upcoming"
                  element={<ROUTE_CONFIG.upcomingSmartphones.component />}
                />
                <Route
                  path="/edit-mobile/:id"
                  element={<ROUTE_CONFIG.editSmartphone.component />}
                />

                {/* Laptops */}
                <Route
                  path="/products/laptops/create"
                  element={<ROUTE_CONFIG.createLaptop.component />}
                />
                <Route
                  path="/products/laptops/inventory"
                  element={<ROUTE_CONFIG.laptopInventory.component />}
                />
                <Route
                  path="/products/laptops/:id/edit"
                  element={<ROUTE_CONFIG.editLaptop.component />}
                />

                {/* Home Appliances & TVs */}
                <Route
                  path="/products/appliances/create"
                  element={<ROUTE_CONFIG.createAppliance.component />}
                />
                <Route
                  path="/create-home-appliance"
                  element={<ROUTE_CONFIG.createHomeAppliance.component />}
                />
                <Route
                  path="/products/tvs/create"
                  element={<ROUTE_CONFIG.createTV.component />}
                />
                <Route
                  path="/products/homeappliances/inventory"
                  element={<ROUTE_CONFIG.applianceInventory.component />}
                />
                <Route
                  path="/products/tvs/inventory"
                  element={<ROUTE_CONFIG.tvInventory.component />}
                />
                <Route
                  path="/products/homeappliances/:id/edit"
                  element={<ROUTE_CONFIG.editAppliance.component />}
                />
                <Route
                  path="/products/tvs/:id/edit"
                  element={<ROUTE_CONFIG.editTV.component />}
                />

                {/* Products Redirect */}
                <Route
                  path="/products"
                  element={
                    <Navigate to="/products/smartphones/inventory" replace />
                  }
                />

                {/* User Management */}
                <Route
                  path="/user-management"
                  element={<ROUTE_CONFIG.userManagement.component />}
                />
                <Route
                  path="/customer-management"
                  element={<ROUTE_CONFIG.customerManagement.component />}
                />

                {/* Account */}
                <Route
                  path="/account-management"
                  element={<ROUTE_CONFIG.accountManagement.component />}
                />
                <Route
                  path="/change-password"
                  element={<ROUTE_CONFIG.changePassword.component />}
                />

                {/* Specifications */}
                <Route
                  path="/specifications-manager"
                  element={<ROUTE_CONFIG.specificationsManager.component />}
                />
                <Route
                  path="/specifications/memory-storage/configurations"
                  element={<ROUTE_CONFIG.ramStorageConfig.component />}
                />
                <Route
                  path="/specifications/categories/create"
                  element={<ROUTE_CONFIG.categoryManagement.component />}
                />
                <Route
                  path="/specifications/brands"
                  element={<ROUTE_CONFIG.brandManagement.component />}
                />

                {/* Permissions & Ratings */}
                <Route
                  path="/permission-management"
                  element={
                    <AccessGate
                      requiredAnyPermissions={[
                        "roles.manage",
                        "permissions.manage",
                      ]}
                      title="Permission management is restricted"
                      message="Your account needs role or permission management access to open this workspace."
                    >
                      <ROUTE_CONFIG.permissionManagement.component />
                    </AccessGate>
                  }
                />
                <Route
                  path="/smartphonesrating"
                  element={<ROUTE_CONFIG.smartphoneRating.component />}
                />

                {/* Settings */}
                <Route
                  path="/settings/compare-scoring"
                  element={<ROUTE_CONFIG.compareScoring.component />}
                />
                <Route
                  path="/settings/device-field-profiles"
                  element={<ROUTE_CONFIG.deviceFieldProfiles.component />}
                />

                {/* Content */}
                <Route
                  path="/content/news-articles"
                  element={
                    <AccessGate
                      requiredPermissions={["content.news.view"]}
                      requiredAnyPermissions={[
                        "content.news.create",
                        "content.news.edit",
                        "content.news.publish",
                        "content.news.schedule",
                        "content.news.manage",
                      ]}
                      title="News & Articles access required"
                      message="This newsroom studio is available to roles with News & Articles permissions."
                    >
                      <ROUTE_CONFIG.newsArticles.component />
                    </AccessGate>
                  }
                />
                <Route
                  path="/content/blogs"
                  element={<Navigate to="/content/news-articles" replace />}
                />

                {/* Marketing */}
                <Route
                  path="/specifications/store"
                  element={<ROUTE_CONFIG.onlineStoreManagement.component />}
                />
                <Route
                  path="/marketing/banners"
                  element={<ROUTE_CONFIG.bannerManagement.component />}
                />

                {/* Reports & Analytics */}
                <Route
                  path="/reports/productcategories"
                  element={<ROUTE_CONFIG.productCategoryReport.component />}
                />
                <Route
                  path="/reports/productpublishstatus"
                  element={
                    <ROUTE_CONFIG.productPublishStatusReport.component />
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <Navigate to="/reports/productpublishstatus" replace />
                  }
                />
                <Route
                  path="/reports/useractivity"
                  element={<ROUTE_CONFIG.userActivityReport.component />}
                />
                <Route
                  path="/reports/recentactivity"
                  element={<ROUTE_CONFIG.recentActivityReport.component />}
                />
                <Route
                  path="/reports/trending"
                  element={<ROUTE_CONFIG.trendingReport.component />}
                />
                <Route
                  path="/reports/hook-score"
                  element={<ROUTE_CONFIG.hookScoreReport.component />}
                />
                <Route
                  path="/reports/feature-clicks"
                  element={<ROUTE_CONFIG.featureClicksReport.component />}
                />
                <Route
                  path="/reports/search-popularity"
                  element={<ROUTE_CONFIG.searchPopularityReport.component />}
                />
                <Route
                  path="/reports/career-applications"
                  element={<ROUTE_CONFIG.careerApplicationsReport.component />}
                />

                {/* Utilities */}
                <Route
                  path="/api-tester"
                  element={<ROUTE_CONFIG.apiTester.component />}
                />
              </Routes>
            </Suspense>

            {/* Footer */}
            <footer className="mt-8 md:mt-12 px-4 md:px-8 py-6 md:py-8 text-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()}{" "}
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  Hook
                </span>
                . All rights reserved. |{" "}
                <a
                  href="#"
                  className="hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Privacy
                </a>{" "}
                |{" "}
                <a
                  href="#"
                  className="hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Terms
                </a>
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

MainLayout.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  sidebarCollapsed: PropTypes.bool.isRequired,
  setSidebarCollapsed: PropTypes.func.isRequired,
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default MainLayout;
