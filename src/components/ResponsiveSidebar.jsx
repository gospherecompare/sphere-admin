/**
 * Professional Responsive Sidebar Component
 * Mobile-optimized navigation menu with smooth animations
 */
import React, { useCallback, useMemo, useState } from "react";
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
    submenu: [
      { label: "Users", path: "/user-management" },
      { label: "Customers", path: "/customer-management" },
      { label: "Permissions", path: "/permission-management" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <FaCog />,
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
  },
];

const ResponsiveSidebar = ({
  collapsed = false,
  setCollapsed = () => {},
  isMobile = false,
  onClose = () => {},
  mobileOpen = false,
  setMobileOpen = () => {},
}) => {
  const [expandedItems, setExpandedItems] = useState({});
  const location = useLocation();

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

  const renderMenuItems = useMemo(
    () =>
      MENU_ITEMS.map((item) => (
        <div key={item.id}>
          {item.submenu ? (
            <>
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
                  {item.submenu.map((subitem) => (
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
            </>
          ) : (
            <Link
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
          )}
        </div>
      )),
    [collapsed, expandedItems, isActive, isMobile, onClose, toggleSubmenu],
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
  setCollapsed: PropTypes.func,
  isMobile: PropTypes.bool,
  onClose: PropTypes.func,
  mobileOpen: PropTypes.bool,
  setMobileOpen: PropTypes.func,
};

export default ResponsiveSidebar;
