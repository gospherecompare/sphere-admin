// App.js
import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Breadcrumbs from "./components/Breadcrumbs";
import Dashboard from "./components/Dashboard";
import CreateMobile from "./components/CreateMobile";
import SmartphonePreview from "./components/SmartphonePreview";
import ViewMobiles from "./components/ViewMobiles";
import ViewUpcomingMobiles from "./components/ViewUpcomingMobiles";
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
import LaunchTimingReport from "./components/Reports/LaunchTimingReport";
import PublishedByUserReport from "./components/Reports/PublishUser";
import RecentPublishActivity from "./components/Reports/RecentPublish";
import TrendingManager from "./components/Reports/TrendingManager";
import HookScoreReport from "./components/Reports/HookScoreReport";
import FeatureClicksReport from "./components/Reports/FeatureClicksReport";
import SearchPopularityReport from "./components/Reports/SearchPopularityReport";
import CareerApplications from "./components/Reports/CareerApplications";
import ContactSubmissions from "./components/Reports/ContactSubmissions";
import BannerManager from "./components/BannerManager";
import AffiliatePlacementManager from "./components/AffiliatePlacementManager";
import EditLaptop from "./components/EditLaptop";
import EditHomeAppliance from "./components/EditAppliance";
import CompareScoring from "./components/Settings/CompareScoring";
import ComparePages from "./components/Settings/ComparePages";
import DeviceFieldProfiles from "./components/Settings/DeviceFieldProfiles";
import BlogEditor from "./components/Content/BlogEditor";
import RouteAccessGate from "./components/RouteAccessGate";
import Cookies from "js-cookie";
import GlobalSearchResults from "./components/GlobalSearchResults";
import LoginStatusPoster from "./components/LoginStatusPoster";
import { buildUrl, getAuthToken } from "./api";
import { createMobileReminderItems } from "./utils/mobileReminders";
import { buildDocumentTitle } from "./utils/pageTitles";

const AUTH_NOTICE_STORAGE_KEY = "hooksAdminAuthNotice";
const POST_LOGIN_REDIRECT_KEY = "hooksAdminPostLoginRedirect";
const SESSION_TIMEOUT_NOTICE = "Session timed out. Please log in again.";
const POST_LOGIN_UPDATES_POSTER_KEY = "hooksAdminShowLoginUpdatesPoster";
const SESSION_USER_STORAGE_KEY = "hooksAdminSessionUser";

const extractSmartphoneRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.smartphones)) return payload.smartphones;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const parseTokenPayload = (token) => {
  try {
    if (!token) return null;
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
  } catch {
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

const storePostLoginRedirect = () => {
  if (typeof window === "undefined") return;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (!currentPath || currentPath.startsWith("/login")) return;
  try {
    window.sessionStorage.setItem(
      POST_LOGIN_REDIRECT_KEY,
      JSON.stringify({ path: currentPath, savedAt: Date.now() }),
    );
  } catch {
    // Ignore storage failures.
  }
};

const storeAuthNotice = (message) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, message);
  } catch {
    // Ignore storage failures.
  }
};

const RouteDocumentTitle = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = buildDocumentTitle(location);
  }, [location]);

  return null;
};

const GlobalLoadingExperience = () => {
  const location = useLocation();
  const [routePulse, setRoutePulse] = useState(false);
  const [activeRequests, setActiveRequests] = useState(() =>
    typeof window !== "undefined"
      ? window.__HOOKS_ADMIN_NETWORK_IN_FLIGHT__ || 0
      : 0,
  );
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    setRoutePulse(true);
    const timeout = window.setTimeout(() => setRoutePulse(false), 520);
    return () => window.clearTimeout(timeout);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onActivity = (event) => {
      const nextCount = Number(event?.detail?.count ?? 0);
      setActiveRequests(
        Number.isFinite(nextCount) ? Math.max(0, nextCount) : 0,
      );
    };

    window.addEventListener("hooks-admin:network-activity", onActivity);
    return () =>
      window.removeEventListener("hooks-admin:network-activity", onActivity);
  }, []);

  const hasNetworkWork = activeRequests > 0;

  useEffect(() => {
    if (hasNetworkWork) {
      const timeout = window.setTimeout(() => setShowPanel(true), 260);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => setShowPanel(false), 180);
    return () => window.clearTimeout(timeout);
  }, [hasNetworkWork]);

  if (!routePulse && !hasNetworkWork && !showPanel) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[9998] h-1 overflow-hidden bg-indigo-50/70">
        <div className="hooks-admin-route-progress h-full rounded-r-full bg-gradient-to-r from-[#4C35F2] via-sky-400 to-emerald-400" />
      </div>

      {showPanel ? (
        <div
          role="status"
          aria-live="polite"
          className="hooks-admin-loader-panel pointer-events-none fixed bottom-5 left-4 right-4 z-[9997] mx-auto max-w-sm rounded-2xl border border-indigo-100/80 bg-white/95 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur-md sm:left-auto sm:right-6 sm:mx-0"
        >
          <div className="flex items-center gap-3">
            <div
              className="hooks-admin-loader-bot relative h-12 w-12 shrink-0"
              aria-hidden="true"
            >
              <span className="hooks-admin-loader-bot-antenna" />
              <span className="hooks-admin-loader-bot-face">
                <span className="hooks-admin-loader-bot-eyes">
                  <span />
                  <span />
                </span>
                <span className="hooks-admin-loader-bot-mouth" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">
                Syncing workspace data
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Fetching the latest products, reports, and publishing signals.
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className="hooks-admin-loader-pill h-1.5 rounded-full bg-indigo-100"
                style={{ animationDelay: `${index * 120}ms` }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

const ProtectedRoute = ({ children, isAuthenticated, authReason }) => {
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

const MainLayout = ({
  isMobile,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarOpen,
  setSidebarOpen,
  clearAuth,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loginPosterOpen, setLoginPosterOpen] = useState(false);
  const [loginPosterLoading, setLoginPosterLoading] = useState(false);
  const [loginPosterError, setLoginPosterError] = useState("");
  const [loginPosterReminders, setLoginPosterReminders] = useState([]);

  const fetchTodayLoginReminders = useCallback(async () => {
    const token = getAuthToken();
    const res = await fetch(buildUrl("/api/smartphone"), {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    return createMobileReminderItems(extractSmartphoneRows(data)).filter(
      (item) => item.group === "today",
    );
  }, []);

  const showLoginPosterIfNeeded = useCallback(async () => {
    let shouldShowPoster = false;

    try {
      shouldShowPoster =
        sessionStorage.getItem(POST_LOGIN_UPDATES_POSTER_KEY) === "1";
      sessionStorage.removeItem(POST_LOGIN_UPDATES_POSTER_KEY);
    } catch {
      shouldShowPoster = false;
    }

    if (!shouldShowPoster) return;

    setLoginPosterLoading(true);
    setLoginPosterError("");

    try {
      const items = await fetchTodayLoginReminders();
      setLoginPosterReminders(items);
      setLoginPosterOpen(items.length > 0);
    } catch (err) {
      console.error("Login poster reminder error:", err);
      setLoginPosterError(
        err?.message || "Unable to load today's mobile updates.",
      );
      setLoginPosterOpen(false);
    } finally {
      setLoginPosterLoading(false);
    }
  }, [fetchTodayLoginReminders]);

  const refreshLoginPoster = useCallback(async () => {
    setLoginPosterLoading(true);
    setLoginPosterError("");

    try {
      const items = await fetchTodayLoginReminders();
      setLoginPosterReminders(items);
    } catch (err) {
      console.error("Login poster refresh error:", err);
      setLoginPosterError(
        err?.message || "Unable to refresh today's mobile updates.",
      );
    } finally {
      setLoginPosterLoading(false);
    }
  }, [fetchTodayLoginReminders]);

  const handleOpenLoginPosterReminder = useCallback(
    (item) => {
      setLoginPosterOpen(false);

      if (item?.productId) {
        navigate(`/edit-mobile/${item.productId}`);
        return;
      }

      navigate("/products/smartphones/inventory", {
        state: { searchTerm: item?.productName || "" },
      });
    },
    [navigate],
  );

  useEffect(() => {
    showLoginPosterIfNeeded();
  }, [showLoginPosterIfNeeded]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [
    isMobile,
    location.hash,
    location.pathname,
    location.search,
    setSidebarOpen,
  ]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((previous) => !previous);
      return;
    }

    setSidebarCollapsed((previous) => !previous);
  }, [isMobile, setSidebarCollapsed, setSidebarOpen]);

  const isApiTesterWorkspace =
    location.pathname === "/api-tester" ||
    location.pathname.startsWith("/api-tester/");

  if (isApiTesterWorkspace) {
    return (
      <div className="relative isolate min-h-screen bg-[#F5F7FF]">
        {isMobile ? (
          <Sidebar
            collapsed={false}
            isMobile
            mobileOpen={sidebarOpen}
            setMobileOpen={setSidebarOpen}
            onLogout={() => clearAuth("logout")}
          />
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-col bg-[#F5F7FF]">
          <Navbar
            onToggleSidebar={isMobile ? toggleSidebar : () => {}}
            sidebarOpen={sidebarOpen}
            isMobile={isMobile}
            onLogout={() => clearAuth("logout")}
          />

          <LoginStatusPoster
            open={loginPosterOpen}
            loading={loginPosterLoading}
            error={loginPosterError}
            reminders={loginPosterReminders}
            onDismiss={() => setLoginPosterOpen(false)}
            onRefresh={refreshLoginPoster}
            onOpenReminder={handleOpenLoginPosterReminder}
          />

          <div
            key={`${location.pathname}${location.search}${location.hash}`}
            className="min-h-0 flex-1"
          >
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate flex h-screen overflow-hidden bg-[#F6F8FF]">
      <Sidebar
        collapsed={sidebarCollapsed}
        isMobile={isMobile}
        mobileOpen={sidebarOpen}
        setMobileOpen={setSidebarOpen}
        onLogout={() => clearAuth("logout")}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-[#F6F8FF]">
        <Navbar
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
          onLogout={() => clearAuth("logout")}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F6F8FF] p-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
          <LoginStatusPoster
            open={loginPosterOpen}
            loading={loginPosterLoading}
            error={loginPosterError}
            reminders={loginPosterReminders}
            onDismiss={() => setLoginPosterOpen(false)}
            onRefresh={refreshLoginPoster}
            onOpenReminder={handleOpenLoginPosterReminder}
          />

          <div
            className={`mx-auto flex w-full max-w-[1720px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-6 lg:py-6 ${
              isMobile ? "gap-3 px-2 py-3 sm:px-2 sm:py-3" : ""
            }`}
          >
            {isMobile ? null : <Breadcrumbs />}
            <div key={`${location.pathname}${location.search}${location.hash}`}>
              <Outlet />
            </div>
            <footer className="mt-8 border-t border-slate-200 py-4 text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Hook. All rights reserved.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobileViewport = window.innerWidth < 1024;
      setIsMobile((previous) => {
        if (previous && !mobileViewport) {
          setSidebarOpen(false);
        }
        return mobileViewport;
      });
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid());
  const [authReason, setAuthReason] = useState("");

  const clearAuth = useCallback((reason = "logout") => {
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
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem(SESSION_USER_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token && !isTokenValid(token)) {
      clearAuth("session_expired");
    }
  }, [clearAuth]);

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
  }, [isAuthenticated, clearAuth]);

  return (
    <Router>
      <RouteDocumentTitle />
      <GlobalLoadingExperience />
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
          path="/"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              authReason={authReason}
            >
              <MainLayout
                isMobile={isMobile}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                clearAuth={clearAuth}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <RouteAccessGate path="/dashboard">
                <Dashboard isMobile={isMobile} />
              </RouteAccessGate>
            }
          />
          <Route
            path="search"
            element={
              <RouteAccessGate path="/search">
                <GlobalSearchResults />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/laptops/:id/edit"
            element={
              <RouteAccessGate path="/products/laptops/:id/edit">
                <EditLaptop />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/homeappliances/:id/edit"
            element={
              <RouteAccessGate path="/products/homeappliances/:id/edit">
                <EditHomeAppliance />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/tvs/:id/edit"
            element={
              <RouteAccessGate path="/products/tvs/:id/edit">
                <EditHomeAppliance />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/smartphones/create"
            element={
              <RouteAccessGate path="/products/smartphones/create">
                <CreateMobile />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/smartphones/preview"
            element={
              <RouteAccessGate path="/products/smartphones/preview">
                <SmartphonePreview />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/smartphones/preview/:slug"
            element={
              <RouteAccessGate path="/products/smartphones/preview/:slug">
                <SmartphonePreview />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/smartphones/inventory"
            element={
              <RouteAccessGate path="/products/smartphones/inventory">
                <ViewMobiles />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/smartphones/upcoming"
            element={
              <RouteAccessGate path="/products/smartphones/upcoming">
                <ViewUpcomingMobiles />
              </RouteAccessGate>
            }
          />
          <Route
            path="products"
            element={<Navigate to="/products/smartphones/inventory" replace />}
          />
          <Route
            path="products/laptops/inventory"
            element={
              <RouteAccessGate path="/products/laptops/inventory">
                <ViewLaptops />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/homeappliances/inventory"
            element={
              <RouteAccessGate path="/products/homeappliances/inventory">
                <ViewTVs />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/tvs/inventory"
            element={
              <RouteAccessGate path="/products/tvs/inventory">
                <ViewTVs />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/laptops/create"
            element={
              <RouteAccessGate path="/products/laptops/create">
                <CreateLaptop />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/appliances/create"
            element={
              <RouteAccessGate path="/products/appliances/create">
                <CreateHomeAppliance />
              </RouteAccessGate>
            }
          />
          <Route
            path="create-home-appliance"
            element={
              <RouteAccessGate path="/create-home-appliance">
                <CreateHomeAppliance />
              </RouteAccessGate>
            }
          />
          <Route
            path="products/tvs/create"
            element={
              <RouteAccessGate path="/products/tvs/create">
                <CreateHomeAppliance />
              </RouteAccessGate>
            }
          />
          <Route
            path="edit-mobile/:id"
            element={
              <RouteAccessGate path="/edit-mobile/:id">
                <EditMobile />
              </RouteAccessGate>
            }
          />
          <Route
            path="users"
            element={<Navigate to="/user-management" replace />}
          />
          <Route
            path="roles"
            element={<Navigate to="/permission-management" replace />}
          />
          <Route
            path="user-management"
            element={
              <RouteAccessGate
                path="/user-management"
                title="User management access required"
                message="Your account needs user-management permissions to open this workspace."
              >
                <UserManagement />
              </RouteAccessGate>
            }
          />
          <Route
            path="customer-management"
            element={
              <RouteAccessGate
                path="/customer-management"
                title="Customer management access required"
                message="This screen is available to roles that can manage customers or users."
              >
                <ViewCustomers />
              </RouteAccessGate>
            }
          />
          <Route
            path="account-management"
            element={
              <RouteAccessGate path="/account-management">
                <AccountManagement />
              </RouteAccessGate>
            }
          />
          <Route
            path="specifications-manager"
            element={
              <RouteAccessGate
                path="/specifications-manager"
                title="Specifications access required"
                message="This section is available to product and settings roles."
              >
                <SpecificationsManager />
              </RouteAccessGate>
            }
          />
          <Route
            path="specifications/memory-storage/configurations"
            element={
              <RouteAccessGate path="/specifications/memory-storage/configurations">
                <RamStorageConfig />
              </RouteAccessGate>
            }
          />
          <Route
            path="specifications/categories"
            element={
              <RouteAccessGate
                path="/specifications/categories"
                title="Category management access required"
                message="This screen is limited to product and settings roles."
              >
                <CategoryManagement mode="list" />
              </RouteAccessGate>
            }
          />
          <Route
            path="specifications/categories/create"
            element={
              <RouteAccessGate
                path="/specifications/categories/create"
                title="Category management access required"
                message="This screen is limited to product and settings roles."
              >
                <CategoryManagement mode="create" />
              </RouteAccessGate>
            }
          />
          <Route
            path="specifications/categories/edit/:categoryId"
            element={
              <RouteAccessGate
                path="/specifications/categories/edit/:categoryId"
                title="Category management access required"
                message="This screen is limited to product and settings roles."
              >
                <CategoryManagement mode="edit" />
              </RouteAccessGate>
            }
          />
          <Route
            path="specifications/brands"
            element={
              <RouteAccessGate
                path="/specifications/brands"
                title="Brand management access required"
                message="This screen is limited to product and settings roles."
              >
                <Brand />
              </RouteAccessGate>
            }
          />
          <Route
            path="permission-management"
            element={
              <RouteAccessGate
                path="/permission-management"
                title="Permission management is restricted"
                message="Your account needs role or permission management access to open this workspace."
              >
                <PermissionManagement />
              </RouteAccessGate>
            }
          />
          <Route
            path="smartphonesrating"
            element={
              <RouteAccessGate path="/smartphonesrating">
                <MobileRatingCard />
              </RouteAccessGate>
            }
          />
          <Route
            path="change-password"
            element={
              <RouteAccessGate path="/change-password">
                <ChangePasswordModal />
              </RouteAccessGate>
            }
          />
          <Route
            path="api-tester"
            element={
              <RouteAccessGate
                path="/api-tester"
                title="API tester access required"
                message="You need settings access to open the API tester."
              >
                <ApiTester />
              </RouteAccessGate>
            }
          />
          <Route
            path="settings/compare-pages"
            element={
              <RouteAccessGate
                path="/settings/compare-pages"
                title="Settings access required"
                message="You need settings access to open this page."
              >
                <ComparePages />
              </RouteAccessGate>
            }
          />
          <Route
            path="settings/compare-scoring"
            element={
              <RouteAccessGate
                path="/settings/compare-scoring"
                title="Settings access required"
                message="You need settings access to open this page."
              >
                <CompareScoring />
              </RouteAccessGate>
            }
          />
          <Route
            path="settings/device-field-profiles"
            element={
              <RouteAccessGate
                path="/settings/device-field-profiles"
                title="Settings access required"
                message="You need settings access to open this page."
              >
                <DeviceFieldProfiles />
              </RouteAccessGate>
            }
          />
          <Route
            path="content/news-articles"
            element={
              <RouteAccessGate
                path="/content/news-articles"
                title="News & Articles access required"
                message="This newsroom studio is available to roles with News & Articles permissions."
              >
                <BlogEditor />
              </RouteAccessGate>
            }
          />
          <Route
            path="content/blogs"
            element={<Navigate to="/content/news-articles" replace />}
          />
          <Route
            path="specifications/store"
            element={
              <RouteAccessGate
                path="/specifications/store"
                title="Store management access required"
                message="You need product or settings access to open this page."
              >
                <OnlineStoreManagement />
              </RouteAccessGate>
            }
          />
          <Route
            path="marketing/banners"
            element={
              <RouteAccessGate
                path="/marketing/banners"
                title="Marketing access required"
                message="You need marketing access to open this page."
              >
                <BannerManager />
              </RouteAccessGate>
            }
          />
          <Route
            path="marketing/affiliate-links"
            element={
              <RouteAccessGate
                path="/marketing/affiliate-links"
                title="Marketing access required"
                message="You need marketing access to open affiliate link controls."
              >
                <AffiliatePlacementManager />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/productcategories"
            element={
              <RouteAccessGate
                path="/reports/productcategories"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <ProductCategoryReport />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/productpublishstatus"
            element={
              <RouteAccessGate
                path="/reports/productpublishstatus"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <ProductPublishStatusReport />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/launch-timing"
            element={
              <RouteAccessGate
                path="/reports/launch-timing"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <LaunchTimingReport />
              </RouteAccessGate>
            }
          />
          <Route
            path="analytics"
            element={<Navigate to="/reports/useractivity" replace />}
          />
          <Route
            path="reports/useractivity"
            element={
              <RouteAccessGate
                path="/reports/useractivity"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <PublishedByUserReport />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/recentactivity"
            element={
              <RouteAccessGate
                path="/reports/recentactivity"
                title="Recent activity access required"
                message="You need activity access to open this page."
              >
                <RecentPublishActivity />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/trending"
            element={
              <RouteAccessGate
                path="/reports/trending"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <TrendingManager />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/hook-score"
            element={
              <RouteAccessGate
                path="/reports/hook-score"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <HookScoreReport />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/feature-clicks"
            element={
              <RouteAccessGate
                path="/reports/feature-clicks"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <FeatureClicksReport />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/search-popularity"
            element={
              <RouteAccessGate
                path="/reports/search-popularity"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <SearchPopularityReport />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/career-applications"
            element={
              <RouteAccessGate
                path="/reports/career-applications"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <CareerApplications />
              </RouteAccessGate>
            }
          />
          <Route
            path="reports/contact-submissions"
            element={
              <RouteAccessGate
                path="/reports/contact-submissions"
                title="Reports access required"
                message="You need report access to open this page."
              >
                <ContactSubmissions />
              </RouteAccessGate>
            }
          />
          <Route
            path="specifications"
            element={<Navigate to="/specifications/brands" replace />}
          />
          <Route
            path="settings"
            element={<Navigate to="/settings/compare-pages" replace />}
          />
          <Route
            path="content"
            element={<Navigate to="/content/news-articles" replace />}
          />
          <Route
            path="marketing"
            element={<Navigate to="/marketing/banners" replace />}
          />
          <Route
            path="reports"
            element={<Navigate to="/reports/useractivity" replace />}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
