/**
 * Professional Responsive Sidebar Component
 * Mobile-optimized navigation menu with smooth animations
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaBox,
  FaUsers,
  FaCog,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
} from "react-icons/fa";
import PropTypes from "prop-types";
import {
  canAccessModule,
  getCurrentPermissions,
  getCurrentRole,
  hasAnyPermissions,
  hasAllPermissions,
} from "../utils/access";

const MENU_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <FaChartLine />,
    path: "/dashboard",
  },
  {
    id: "products",
    label: "Products",
    icon: <FaBox />,
    requiredAnyPermissions: ["products.view"],
    submenu: [
      { label: "Smartphones", path: "/products/smartphones/inventory" },
      { label: "Laptops", path: "/products/laptops/inventory" },
      { label: "TVs", path: "/products/tvs/inventory" },
    ],
  },
  {
    id: "users",
    label: "Management",
    icon: <FaUsers />,
    requiredAnyPermissions: [
      "users.view",
      "roles.view",
      "permissions.view",
      "activity.view",
    ],
    submenu: [
      { label: "Users", path: "/user-management", requiredAnyPermissions: ["users.view"] },
      { label: "Customers", path: "/customer-management" },
      { label: "Permissions", path: "/permission-management" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <FaCog />,
    requiredAnyPermissions: ["settings.view"],
    submenu: [
      { label: "Specifications", path: "/specifications-manager" },
      { label: "Brands", path: "/specifications/brands" },
      { label: "Categories", path: "/specifications/categories/create" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FaFileAlt />,
    path: "/reports/productpublishstatus",
    requiredAnyPermissions: ["reports.view", "activity.view"],
  },
];

const ResponsiveSidebar = ({
  collapsed = false,
  isMobile = false,
  onClose = () => {},
  mobileOpen = false,
}) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [authSnapshot, setAuthSnapshot] = useState(() => ({
    role: getCurrentRole(),
    permissions: getCurrentPermissions(),
  }));
  const location = useLocation();
  const role = authSnapshot.role;
  const permissions = authSnapshot.permissions;

  useEffect(() => {
    const syncAuthSnapshot = () => {
      setAuthSnapshot({
        role: getCurrentRole(),
        permissions: getCurrentPermissions(),
      });
    };

    syncAuthSnapshot();
    window.addEventListener("storage", syncAuthSnapshot);
    window.addEventListener("hooks-rbac-updated", syncAuthSnapshot);
    return () => {
      window.removeEventListener("storage", syncAuthSnapshot);
      window.removeEventListener("hooks-rbac-updated", syncAuthSnapshot);
    };
  }, []);

  const toggleSubmenu = useCallback((itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  const isActive = useCallback(
    (path) => Boolean(path) && (location.pathname === path || location.pathname.startsWith(path)),
    [location.pathname],
  );

  const canSeeMenuItem = useCallback(
    (item) => {
      if (!item) return false;

      if (Array.isArray(item.requiredRoles) && item.requiredRoles.length) {
        const normalizedRole = String(role || "").trim().toLowerCase();
        const allowedRoles = item.requiredRoles.map((value) =>
          String(value || "").trim().toLowerCase(),
        );
        if (!allowedRoles.includes(normalizedRole)) return false;
      }

      if (
        Array.isArray(item.requiredPermissions) &&
        item.requiredPermissions.length &&
        !hasAllPermissions(item.requiredPermissions, permissions)
      ) {
        return false;
      }

      if (
        Array.isArray(item.requiredAnyPermissions) &&
        item.requiredAnyPermissions.length &&
        !hasAnyPermissions(item.requiredAnyPermissions, permissions)
      ) {
        return false;
      }

      if (item.moduleKey) {
        return canAccessModule(item.moduleKey, item.action || "view", permissions);
      }

      if (item.id === "users" && !hasAnyPermissions(["users.view", "roles.view", "permissions.view", "activity.view"], permissions)) {
        return false;
      }

      if (item.id === "settings" && !hasAnyPermissions(["settings.view"], permissions)) {
        return false;
      }

      if (item.id === "products" && !hasAnyPermissions(["products.view"], permissions)) {
        return false;
      }

      if (item.id === "reports" && !hasAnyPermissions(["reports.view", "activity.view"], permissions)) {
        return false;
      }

      return true;
    },
    [permissions, role],
  );

  const renderMenuItems = useMemo(
    () =>
      MENU_ITEMS.filter((item) => canSeeMenuItem(item)).map((item) => {
        if (item.submenu) {
          const visibleSubitems = item.submenu.filter((subitem) =>
            canSeeMenuItem(subitem),
          );

          if (!visibleSubitems.length) return null;

          return (
            <div key={item.id}>
              <button
                onClick={() => toggleSubmenu(item.id)}
                className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors ${
                  expandedItems[item.id]
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="text-lg text-slate-500 transition group-hover:text-blue-600">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="truncate text-sm font-medium">{item.label}</span>
                  )}
                </span>
                {!collapsed && (
                  <span className="text-xs text-slate-400">
                    {expandedItems[item.id] ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                )}
              </button>

              {expandedItems[item.id] && !collapsed && (
                <div className="ml-8 mt-2 space-y-1">
                  {visibleSubitems.map((subitem) => (
                    <Link
                      key={subitem.path}
                      to={subitem.path}
                      onClick={() => isMobile && onClose()}
                      className={`block rounded-xl px-4 py-2 text-sm transition-colors ${
                        isActive(subitem.path)
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                      }`}
                    >
                      {subitem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => isMobile && onClose()}
            className={`group mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
              isActive(item.path)
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-700 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <span
              className={`text-lg ${
                isActive(item.path)
                  ? "text-white"
                  : "text-slate-500 transition group-hover:text-blue-600"
              }`}
            >
              {item.icon}
            </span>
            {!collapsed && (
              <span className="truncate text-sm font-medium">{item.label}</span>
            )}
          </Link>
        );
      }),
    [
      canSeeMenuItem,
      collapsed,
      expandedItems,
      isActive,
      isMobile,
      onClose,
      toggleSubmenu,
    ],
  );

  return (
    <aside
      className={`flex h-full w-full flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border border-slate-200/80 bg-white/88 shadow-[0_30px_100px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 ${
        collapsed ? "md:w-20" : "md:w-64"
      } ${isMobile && !mobileOpen ? "-translate-x-full md:translate-x-0" : "translate-x-0"}`}
    >
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200/80 px-4 py-4 md:py-6">
        <div className={`flex items-center gap-2 ${collapsed && !isMobile ? "justify-center" : ""}`}>
          {(!collapsed || isMobile) && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <span className="font-bold">H</span>
              </div>
              {!collapsed && <span className="text-xl font-bold tracking-tight text-slate-900">Hook</span>}
            </div>
          )}

          {isMobile && (
            <button
              onClick={onClose}
              className="soft-pill"
              aria-label="Close sidebar"
            >
              <FaTimes className="text-sm text-slate-700" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-2 py-4 md:px-3">{renderMenuItems}</nav>

      <div className="flex-shrink-0 border-t border-slate-200/80 px-4 py-4">
        <div className={`flex items-center gap-3 ${collapsed && !isMobile ? "justify-center" : ""}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">Admin</p>
              <p className="truncate text-xs text-emerald-600">Online</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

ResponsiveSidebar.propTypes = {
  collapsed: PropTypes.bool,
  isMobile: PropTypes.bool,
  onClose: PropTypes.func,
  mobileOpen: PropTypes.bool,
};

export default ResponsiveSidebar;
