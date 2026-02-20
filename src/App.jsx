// App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Breadcrumbs from "./components/Breadcrumbs";
import Dashboard from "./components/Dashboard";
import CreateMobile from "./components/CreateMobile";
import ViewMobiles from "./components/ViewMobiles";
import Login from "./components/Login";
import EditMobile from "./components/EditMobile";
import ApiTester from "./components/ApiTester";
import UserManagement from "./components/Usermanagment";
import PermissionManagement from "./components/Permissionmangement";
import SpecificationsManager from "./components/SpecMangement";
import MobileRatingCard from "./components/Rating";
import ChangePasswordModal from "./components/Changepassword";
import AccountManagement from "./components/AccountManagement";
import CreateLaptop from "./components/CreateLaptop";
import CreateHomeAppliance from "./components/CreateAppliance";
import ViewLaptops from "./components/ViewLaptop";
import ViewTVs from "./components/ViewAppliance";
import ViewCustomers from "./components/ViewCustomers";
import RamStorageConfig from "./components/Ramstorage";
import Brand from "./components/Brand";
import CategoryManagement from "./components/Category";
import OnlineStoreManagement from "./components/Store";
import ProductCategoryReport from "./components/Reports/ProductCategory";
import ProductPublishStatusReport from "./components/Reports/ProductPublish";
import PublishedByUserReport from "./components/Reports/PublishUser";
import RecentPublishActivity from "./components/Reports/RecentPublish";
import TrendingManager from "./components/Reports/TrendingManager";
import HookScoreReport from "./components/Reports/HookScoreReport";
import FeatureClicksReport from "./components/Reports/FeatureClicksReport";
import EditLaptop from "./components/EditLaptop";
import EditHomeAppliance from "./components/EditAppliance";
import CompareScoring from "./components/Settings/CompareScoring";
import Cookies from "js-cookie";

const AUTH_NOTICE_STORAGE_KEY = "hooksAdminAuthNotice";
const POST_LOGIN_REDIRECT_KEY = "hooksAdminPostLoginRedirect";
const SESSION_TIMEOUT_NOTICE = "Session timed out. Please log in again.";

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

  const parseTokenPayload = (token) => {
    try {
      if (!token) return null;
      // simple parse - decode payload
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(payload.replace(/=+$/, ""));
      return JSON.parse(
        decodeURIComponent(
          decoded
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
        ),
      );
    } catch (err) {
      return null;
    }
  };

  const getTokenExpiryMs = (token) => {
    const payload = parseTokenPayload(token);
    if (!payload || !payload.exp) return null;
    return payload.exp * 1000;
  };

  const isTokenValid = (token = Cookies.get("authToken")) => {
    const expMs = getTokenExpiryMs(token);
    if (!expMs) return false;
    return expMs > Date.now();
  };

  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid());
  const [authReason, setAuthReason] = useState("");

  const storePostLoginRedirect = () => {
    if (typeof window === "undefined") return;
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!currentPath || currentPath.startsWith("/login")) return;
    try {
      window.sessionStorage.setItem(
        POST_LOGIN_REDIRECT_KEY,
        JSON.stringify({ path: currentPath, savedAt: Date.now() }),
      );
    } catch (error) {
      // Ignore storage failures.
    }
  };

  const storeAuthNotice = (message) => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, message);
    } catch (error) {
      // Ignore storage failures.
    }
  };

  const clearAuth = (reason = "logout") => {
    if (reason === "session_expired") {
      storeAuthNotice(SESSION_TIMEOUT_NOTICE);
    }
    storePostLoginRedirect();
    setAuthReason(reason);
    Cookies.remove("authToken");
    Cookies.remove("user");
    Cookies.remove("username");
    Cookies.remove("role");
    Cookies.remove("loginAt");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token && !isTokenValid(token)) {
      clearAuth("session_expired");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const token = Cookies.get("authToken");
    const expMs = getTokenExpiryMs(token);
    const now = Date.now();

    if (!token || !expMs || expMs <= now) {
      clearAuth("session_expired");
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      clearAuth("session_expired");
    }, expMs - now);

    const intervalId = setInterval(() => {
      const currentToken = Cookies.get("authToken");
      if (!currentToken || !isTokenValid(currentToken)) {
        clearAuth("session_expired");
      }
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  // Close sidebar when route changes (mobile)
  const handleRouteChange = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    if (!isAuthenticated) {
      const from = `${location.pathname}${location.search}${location.hash}`;
      return (
        <Navigate
          to="/login"
          replace
          state={{
            from,
            reason: authReason || undefined,
          }}
        />
      );
    }
    return children;
  };

  // Main Layout Component for authenticated routes
  const MainLayout = () => {
    return (
      <div className="flex h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar with mobile styles (Sidebar handles mobile translate) */}
        <div
          className={`
            ${isMobile ? "fixed" : "relative"}
            lg:translate-x-0 lg:static
            z-40 transform transition-transform duration-300 ease-in-out
            h-full
          `}
        >
          <Sidebar
            collapsed={isMobile ? false : sidebarCollapsed} // Always expanded on mobile when open
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
            onLogout={() => clearAuth("logout")}
          />
          <main
            className="flex-1 overflow-auto p-2 md:p-6"
            onClick={
              isMobile && sidebarOpen ? () => setSidebarOpen(false) : undefined
            }
          >
            <div className="mx-auto w-full sm:px-6">
              <Breadcrumbs />
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
                  path="/products/laptops/:id/edit"
                  element={<EditLaptop />}
                />
                <Route
                  path="/products/homeappliances/:id/edit"
                  element={<EditHomeAppliance />}
                />
                <Route
                  path="/products/tvs/:id/edit"
                  element={<EditHomeAppliance />}
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
                  element={<ViewTVs />}
                />
                <Route
                  path="/products/tvs/inventory"
                  element={<ViewTVs />}
                />
                <Route
                  path="/products/laptops/create"
                  element={<CreateLaptop />}
                />
                <Route
                  path="/products/appliances/create"
                  element={<CreateHomeAppliance />}
                />
                <Route
                  path="/create-home-appliance"
                  element={<CreateHomeAppliance />}
                />
                <Route
                  path="/products/tvs/create"
                  element={<CreateHomeAppliance />}
                />
                <Route path="/edit-mobile/:id" element={<EditMobile />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route
                  path="/customer-management"
                  element={<ViewCustomers />}
                />
                <Route
                  path="/account-management"
                  element={<AccountManagement />}
                />
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
                <Route
                  path="/smartphonesrating"
                  element={<MobileRatingCard />}
                />
                <Route
                  path="/change-password"
                  element={<ChangePasswordModal />}
                />
                <Route path="/api-tester" element={<ApiTester />} />
                <Route
                  path="/settings/compare-scoring"
                  element={<CompareScoring />}
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
                <Route path="/reports/trending" element={<TrendingManager />} />
                <Route
                  path="/reports/hook-score"
                  element={<HookScoreReport />}
                />
                <Route
                  path="/reports/feature-clicks"
                  element={<FeatureClicksReport />}
                />
              </Routes>
              <footer className="mt-8 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Hook. All rights reserved.
              </footer>
            </div>
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
              <Login
                onLogin={() => {
                  setIsAuthenticated(true);
                  setAuthReason("");
                }}
              />
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
