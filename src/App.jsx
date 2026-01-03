// App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Breadcrumbs from "./components/Breadcrumbs";
import Dashboard from "./components/Dashboard";
import CreateMobile from "./components/CreateMobile";
import ViewMobiles from "./components/ViewMobiles";
import Login from "./components/Login";
import EditMobile from "./components/EditMobile";
import UserManagement from "./components/Usermanagment";
import PermissionManagement from "./components/Permissionmangement";
import SpecificationsManager from "./components/SpecMangement";
import MobileRatingCard from "./components/Rating";
import ChangePasswordModal from "./components/Changepassword";
import CreateLaptop from "./components/CreateLaptop";
import CreateHomeAppliance from "./components/CreateAppliance";
import ViewLaptops from "./components/ViewLaptop";
import ViewHomeAppliances from "./components/ViewAppliance";
import RamStorageConfig from "./components/Ramstorage";
import Brand from "./components/Brand";
import CategoryManagement from "./components/Category";
import OnlineStoreManagement from "./components/Store";
import ProductCategoryReport from "./components/Reports/ProductCategory";
import ProductPublishStatusReport from "./components/Reports/ProductPublish";
import PublishedByUserReport from "./components/Reports/PublishUser";
import RecentPublishActivity from "./components/Reports/RecentPublish";
import Cookies from "js-cookie";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile sidebar state

  // Check if device is mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true); // Auto-collapse sidebar on mobile
      }
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isTokenValid = () => {
    try {
      const token = Cookies.get("authToken");
      if (!token) return false;
      // simple parse - decode payload
      const parts = token.split(".");
      if (parts.length !== 3) return false;
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(payload.replace(/=+$/, ""));
      const obj = JSON.parse(
        decodeURIComponent(
          decoded
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        )
      );
      if (!obj.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return obj.exp > now;
    } catch (err) {
      return false;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid());

  // Close sidebar when route changes (mobile)
  const handleRouteChange = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Main Layout Component for authenticated routes
  const MainLayout = () => {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar with mobile styles */}
        <div
          className={`
            ${isMobile ? "fixed" : "relative"}
            ${isMobile && sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:static
            z-40 transition-transform duration-300 ease-in-out
            h-full
          `}
        >
          <Sidebar
            collapsed={isMobile ? false : sidebarCollapsed} // Always expanded on mobile when open
            setCollapsed={setSidebarCollapsed}
            isMobile={isMobile}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main Content Area */}
        <div
          className={`
            flex-1 flex flex-col w-full min-w-0
            ${!isMobile && sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"}
            transition-all duration-300
          `}
        >
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
            onLogout={() => {
              // remove cookies and update auth state
              Cookies.remove("authToken");
              Cookies.remove("user");
              setIsAuthenticated(false);
            }}
          />
          <main
            className="flex-1 overflow-auto p-4 md:p-6"
            onClick={
              isMobile && sidebarOpen ? () => setSidebarOpen(false) : undefined
            }
          >
            <div className="mb-1">
              <Breadcrumbs />
            </div>
            <Routes>
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
                element={<Dashboard isMobile={isMobile} />}
              />
              <Route
                path="/products/smartphones/create"
                element={<CreateMobile />}
              />
              <Route
                path="/products/smartphones/inventory"
                element={<ViewMobiles />}
              />
              <Route
                path="/products"
                element={
                  <Navigate to="/products/smartphones/inventory" replace />
                }
              />
              <Route
                path="/products/laptops/inventory"
                element={<ViewLaptops />}
              />
              <Route
                path="/products/homeappliances/inventory"
                element={<ViewHomeAppliances />}
              />
              <Route
                path="/products/laptops/create"
                element={<CreateLaptop />}
              />
              <Route
                path="/products/appliances/create"
                element={<CreateHomeAppliance />}
              />
              <Route path="/edit-mobile/:id" element={<EditMobile />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route
                path="/specifications-manager"
                element={<SpecificationsManager />}
              />
              <Route
                path="/specifications/memory-storage/configurations"
                element={<RamStorageConfig />}
              />
              <Route
                path="/specifications/categories/create"
                element={<CategoryManagement />}
              />
              <Route path="/specifications/brands" element={<Brand />} />
              <Route
                path="/permission-management"
                element={<PermissionManagement />}
              />
              <Route path="/smartphonesrating" element={<MobileRatingCard />} />
              <Route
                path="/change-password"
                element={<ChangePasswordModal />}
              />
              <Route
                path="/specifications/store"
                element={<OnlineStoreManagement />}
              />
              <Route
                path="/reports/productcategories"
                element={<ProductCategoryReport />}
              />
              <Route
                path="/reports/productpublishstatus"
                element={<ProductPublishStatusReport />}
              />
              <Route
                path="/analytics"
                element={
                  <Navigate to="/reports/productpublishstatus" replace />
                }
              />
              <Route
                path="/reports/useractivity"
                element={<PublishedByUserReport />}
              />
              <Route
                path="/reports/recentactivity"
                element={<RecentPublishActivity />}
              />
            </Routes>
            <footer className="mt-8 text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Smart Arena. All rights
              reserved.
            </footer>
          </main>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
