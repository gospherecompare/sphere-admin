// components/Sidebar.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import {
  FaChartLine,
  FaNetworkWired,
  FaLaptopCode,
  FaDatabase,
  FaCog,
  FaMobileAlt,
  FaTags,
  FaPlus,
  FaBox,
  FaMemory,
  FaSitemap,
  FaUsers,
  FaShieldAlt,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaUser,
  FaBars,
  FaTimes,
  FaStar,
  FaCocktail,
  FaCogs,
  FaShopify,
  FaUpload,
  FaDownload,
  FaTv,
  FaBullhorn,
  FaCalendarAlt,
} from "react-icons/fa";
import HookLogo from "./Ui/hooklogo";

// Menu configuration moved to separate object
const MENU_CONFIG = {
  items: [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <FaChartLine />,
      path: "/dashboard",
      type: "item",
    },
    {
      id: "products",
      label: "Products",
      icon: <FaBox />,
      type: "submenu",
      children: [
        {
          id: "smartphones",
          label: "Smartphones",
          icon: <FaMobileAlt />,
          type: "submenu",
          children: [
            {
              id: "sp-create",
              label: "Create Product",
              icon: <FaPlus />,
              path: "/products/smartphones/create",
            },
            {
              id: "sp-inventory",
              label: "Inventory",
              icon: <FaBox />,
              path: "/products/smartphones/inventory",
            },
            {
              id: "sp-upcoming",
              label: "Upcoming Mobiles",
              icon: <FaCalendarAlt />,
              path: "/products/smartphones/upcoming",
            },
          ],
        },
        {
          id: "laptops",
          label: "Laptops",
          icon: <FaLaptopCode />,
          type: "submenu",
          children: [
            {
              id: "lp-create",
              label: "Create Product",
              icon: <FaPlus />,
              path: "/products/laptops/create",
            },
            {
              id: "lp-inventory",
              label: "Inventory",
              icon: <FaBox />,
              path: "/products/laptops/inventory",
            },
          ],
        },
        {
          id: "networking",
          label: "Networking",
          icon: <FaNetworkWired />,
          type: "submenu",
          children: [
            {
              id: "net-routers",
              label: "Routers",
              icon: <FaNetworkWired />,
              path: "/products/networking/routers",
            },
            {
              id: "net-modems",
              label: "Modems",
              icon: <FaNetworkWired />,
              path: "/products/networking/modems",
            },
            {
              id: "net-switches",
              label: "Switches",
              icon: <FaSitemap />,
              path: "/products/networking/switches",
            },
            {
              id: "net-inventory",
              label: "Inventory",
              icon: <FaBox />,
              path: "/products/networking/inventory",
            },
          ],
        },
        {
          id: "tvs",
          label: "TVs",
          icon: <FaTv />,
          type: "submenu",
          children: [
            {
              id: "tv-create",
              label: "Create TV",
              icon: <FaPlus />,
              path: "/products/tvs/create",
            },
            {
              id: "tv-inventory",
              label: "Inventory",
              icon: <FaBox />,
              path: "/products/tvs/inventory",
            },
          ],
        },
      ],
    },
    {
      id: "specifications",
      label: "Specifications",
      icon: <FaDatabase />,
      type: "submenu",
      children: [
        {
          id: "sp-brands",
          label: "Brands",
          icon: <FaTags />,
          path: "/specifications/brands",
        },
        {
          id: "spec-ram",
          label: "Memory & Storage",
          icon: <FaMemory />,
          type: "submenu",
          children: [
            {
              id: "spec-memory-config",
              label: "Memory Configurations",
              icon: <FaCog />,
              path: "/specifications/memory-storage/configurations",
            },
          ],
        },
        {
          id: "spec-categories",
          label: "Categories",
          icon: <FaSitemap />,
          type: "submenu",
          children: [
            {
              id: "spec-cat-smartphones",
              label: "Configure",
              icon: <FaCogs />,
              path: "/specifications/categories/create",
            },
          ],
        },
        {
          id: "spec-store",
          label: "Store",
          icon: <FaShopify />,
          path: "/specifications/store",
        },
        {
          id: "spec-ratings",
          label: "Ratings",
          icon: <FaStar />,
          path: "/specifications/ratings",
        },
      ],
    },
    {
      id: "users",
      label: "Users & Access",
      icon: <FaUsers />,
      type: "submenu",
      children: [
        { id: "ua-users", label: "Users", icon: <FaUser />, path: "/users" },
        {
          id: "ua-customers",
          label: "Customers",
          icon: <FaUsers />,
          path: "/customer-management",
        },
        {
          id: "ua-account",
          label: "My Account",
          icon: <FaUser />,
          path: "/account-management",
        },
        {
          id: "ua-roles",
          label: "Roles",
          icon: <FaShieldAlt />,
          path: "/roles",
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: <FaCog />,
      type: "submenu",
      children: [
        {
          id: "set-compare-scoring",
          label: "Compare Scoring",
          icon: <FaChartLine />,
          path: "/settings/compare-scoring",
        },
        {
          id: "set-device-field-profiles",
          label: "Device Field Profiles",
          icon: <FaDatabase />,
          path: "/settings/device-field-profiles",
        },
        {
          id: "set-api-tester",
          label: "API Tester",
          icon: <FaCogs />,
          path: "/api-tester",
        },
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: <FaBullhorn />,
      type: "submenu",
      children: [
        {
          id: "marketing-banners",
          label: "Banners",
          icon: <FaBullhorn />,
          path: "/marketing/banners",
        },
      ],
    },
    {
      id: "content",
      label: "Content",
      icon: <FaDatabase />,
      type: "submenu",
      children: [
        {
          id: "content-blog-studio",
          label: "News & Articles",
          icon: <FaChartLine />,
          path: "/content/news-articles",
        },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FaChartLine />,
      type: "submenu",
      children: [
        {
          id: "product-cat-rep",
          label: "Product Categories",
          icon: <FaChartLine />,
          path: "/reports/productcategories",
        },
        {
          id: "product-pub-rep",
          label: "Publish Status",
          icon: <FaCocktail />,
          path: "/reports/productpublishstatus",
        },
        {
          id: "user-activity-rep",
          label: "User Activity",
          icon: <FaUsers />,
          path: "/reports/useractivity",
        },
        {
          id: "recent-activity-rep",
          label: "Recent Activity",
          icon: <FaStar />,
          path: "/reports/recentactivity",
        },
        {
          id: "trending-manager-rep",
          label: "Trending Manager",
          icon: <FaChartLine />,
          path: "/reports/trending",
        },
        {
          id: "hook-score-rep",
          label: "Hook Score Report",
          icon: <FaChartLine />,
          path: "/reports/hook-score",
        },
        {
          id: "search-popularity-rep",
          label: "Search Popularity",
          icon: <FaChartLine />,
          path: "/reports/search-popularity",
        },
        {
          id: "feature-click-rep",
          label: "Feature Clicks",
          icon: <FaChartLine />,
          path: "/reports/feature-clicks",
        },
        {
          id: "career-applications-rep",
          label: "Career Applications",
          icon: <FaUsers />,
          path: "/reports/career-applications",
        },
        {
          id: "import-rep",
          label: "Import",
          icon: <FaUpload />,
          path: "/reports/import",
        },
        {
          id: "export-rep",
          label: "Export",
          icon: <FaDownload />,
          path: "/reports/export",
        },
      ],
    },
  ],
};

// Sub-components
const MenuItem = ({
  item,
  collapsed,
  isActive,
  hoveredItem,
  onMouseEnter,
  onMouseLeave,
  onLinkClick,
}) => {
  if (item.type === "item") {
    return (
      <Link
        to={item.path}
        className={`
          flex items-center rounded-xl border transition-all duration-200 group
          ${collapsed ? "justify-center p-4" : "px-4 py-3"}
          ${
            isActive
              ? "border-blue-200 bg-blue-50/70 text-blue-700"
              : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          }
        `}
        onMouseEnter={() => onMouseEnter(item.id)}
        onMouseLeave={() => onMouseLeave()}
        onClick={onLinkClick}
      >
        <div
          className={`
          transition-colors duration-200
          ${
            isActive
              ? "text-blue-600"
              : "text-slate-500 group-hover:text-slate-700"
          }
          text-xl
        `}
        >
          {item.icon}
        </div>

        {!collapsed && (
          <span className="ml-4 font-semibold flex-1 transition-all duration-200 text-sm">
            {item.label}
          </span>
        )}

        {collapsed && hoveredItem === item.id && (
          <div className="absolute left-full ml-3 rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-sm text-white whitespace-nowrap">
            {item.label}
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900"></div>
          </div>
        )}
      </Link>
    );
  }
  return null;
};

const SubMenuItem = ({
  item,
  collapsed,
  isActive,
  submenuOpen,
  openSubmenus,
  hoveredItem,
  onMouseEnter,
  onMouseLeave,
  onToggle,
  onLinkClick,
  location,
}) => {
  const renderChildItem = (child, depth = 0) => {
    const childOpen =
      child.type === "submenu" &&
      (openSubmenus ? openSubmenus[child.id] : false);

    if (child.type === "submenu") {
      return (
        <div key={child.id} className="mb-2">
          <div
            className={`flex items-center rounded-lg border p-3 cursor-pointer transition-all duration-200 group ${
              (child.children || []).some((c) => c.path === location.pathname)
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
            }`}
            onClick={() => onToggle(child.id)}
          >
            <div className={`transition-colors duration-200 text-lg`}>
              {child.icon}
            </div>
            <span className="ml-3 font-medium flex-1 text-sm">
              {child.label}
            </span>
            <span className="text-gray-400">
              {childOpen ? (
                <FaChevronUp className="text-sm" />
              ) : (
                <FaChevronDown className="text-sm" />
              )}
            </span>
          </div>

          {childOpen && (
            <div className="ml-4 mt-2 space-y-1">
              {child.children.map((c) => (
                <Link
                  key={c.id}
                  to={c.path}
                  className={`flex items-center rounded-lg border p-3 cursor-pointer transition-all duration-200 group ${
                    location.pathname === c.path
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                  onClick={onLinkClick}
                >
                  <div className={`transition-colors duration-200 text-lg`}>
                    {c.icon}
                  </div>
                  <span className="ml-3 font-medium text-sm">{c.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={child.id}
        to={child.path}
        className={`flex items-center rounded-lg border p-3 cursor-pointer transition-all duration-200 group ${
          location.pathname === child.path
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
        }`}
        onClick={onLinkClick}
      >
        <div className={`transition-colors duration-200 text-lg`}>
          {child.icon}
        </div>
        <span className="ml-3 font-medium text-sm">{child.label}</span>
      </Link>
    );
  };

  return (
    <div key={item.id} className="mb-2">
      <div
        className={`
          flex items-center rounded-xl border transition-all duration-200 group
          ${collapsed ? "justify-center p-4" : "px-4 py-3"}
          ${
            isActive
              ? "border-blue-200 bg-blue-50/70 text-blue-700"
              : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          }
        `}
        onClick={() => onToggle(item.id)}
        onMouseEnter={() => onMouseEnter(item.id)}
        onMouseLeave={() => onMouseLeave()}
      >
        <div
          className={`transition-colors duration-200 ${
            isActive
              ? "text-blue-600"
              : "text-slate-500 group-hover:text-slate-700"
          } text-xl`}
        >
          {item.icon}
        </div>

        {!collapsed && (
          <>
            <span className="ml-4 font-semibold flex-1 transition-all duration-200 text-sm">
              {item.label}
            </span>
            <span className="text-gray-400 transition-transform duration-200">
              {submenuOpen ? (
                <FaChevronUp className="text-sm" />
              ) : (
                <FaChevronDown className="text-sm" />
              )}
            </span>
          </>
        )}
      </div>

      {submenuOpen && !collapsed && (
        <div className="ml-4 mt-2 space-y-1 border-l-2 border-slate-200 pl-4">
          {item.children.map((child) => renderChildItem(child))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({
  collapsed,
  setCollapsed,
  isMobile = false,
  mobileOpen = false,
  setMobileOpen,
  onClose,
}) => {
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const email = Cookies.get("username");
  const role = Cookies.get("role");

  // Initialize open submenus based on current route
  useEffect(() => {
    const initialOpenSubmenus = {};

    const checkItems = (items) => {
      items.forEach((item) => {
        if (item.type === "submenu" && item.children) {
          const isActive = item.children.some((child) => {
            if (child.type === "submenu") {
              return (child.children || []).some(
                (c) => c.path === location.pathname,
              );
            }
            return child.path === location.pathname;
          });
          if (isActive) {
            initialOpenSubmenus[item.id] = true;
          }
        }
      });
    };

    checkItems(MENU_CONFIG.items);
    setOpenSubmenus(initialOpenSubmenus);
  }, [location.pathname]);

  const toggleSubmenu = useCallback((id) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const isSubmenuOpen = useCallback(
    (id) => {
      return openSubmenus[id] || false;
    },
    [openSubmenus],
  );

  const isItemActive = useCallback(
    (item) => {
      if (item.type === "submenu") {
        return item.children.some((child) => child.path === location.pathname);
      }
      return item.path === location.pathname;
    },
    [location.pathname],
  );

  const menuItems = useMemo(() => MENU_CONFIG.items, []);

  // Compute sidebar position and width classes (handle mobile translate)
  const widthClass = collapsed ? "w-20" : "w-64";
  const mobileTranslateClass = isMobile
    ? mobileOpen
      ? "translate-x-0"
      : "-translate-x-full"
    : "translate-x-0";
  const positionClass = isMobile ? "fixed inset-y-0 left-0 z-40" : "relative";

  const sidebarPositionClasses = `${positionClass} ${mobileTranslateClass} ${widthClass}`;

  const handleLinkClick = useCallback(() => {
    if (isMobile) {
      if (setMobileOpen) setMobileOpen(false);
      if (onClose) onClose();
    }
  }, [isMobile, setMobileOpen, onClose]);

  const renderMenuItem = useCallback(
    (item) => {
      const isActive = isItemActive(item);
      const submenuOpen = isSubmenuOpen(item.id);

      if (item.type === "item") {
        return (
          <MenuItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={isActive}
            hoveredItem={hoveredItem}
            onMouseEnter={setHoveredItem}
            onMouseLeave={() => setHoveredItem(null)}
            onLinkClick={handleLinkClick}
          />
        );
      } else if (item.type === "submenu") {
        return (
          <SubMenuItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={isActive}
            submenuOpen={submenuOpen}
            openSubmenus={openSubmenus}
            hoveredItem={hoveredItem}
            onMouseEnter={setHoveredItem}
            onMouseLeave={() => setHoveredItem(null)}
            onToggle={toggleSubmenu}
            onLinkClick={handleLinkClick}
            location={location}
          />
        );
      }
      return null;
    },
    [
      collapsed,
      isItemActive,
      isSubmenuOpen,
      openSubmenus,
      hoveredItem,
      handleLinkClick,
      toggleSubmenu,
      location,
    ],
  );

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={
          sidebarPositionClasses +
          " transform transition-all duration-300 ease-in-out h-full bg-white border-r border-slate-200 flex flex-col overflow-y-auto"
        }
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b border-slate-200 ${collapsed ? "p-3" : "p-4 sm:p-6"}`}
        >
          {!collapsed ? (
            <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
              <HookLogo className="h-9 w-auto max-w-[170px] sm:h-10 sm:max-w-[190px]" />
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="mx-auto hover:scale-110 transition-transform flex-shrink-0"
            >
              <div className="h-8 w-8 overflow-hidden rounded-lg sm:h-10 sm:w-10">
                <HookLogo
                  showText={false}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                />
              </div>
            </Link>
          )}
          <button
            onClick={() => {
              if (isMobile) {
                if (setMobileOpen) setMobileOpen(!mobileOpen);
                if (!mobileOpen && setCollapsed) setCollapsed(false);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className="flex-shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50"
            aria-label={
              isMobile
                ? mobileOpen
                  ? "Close sidebar"
                  : "Open sidebar"
                : collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
          >
            {isMobile ? (
              mobileOpen ? (
                <FaTimes className="text-lg" />
              ) : (
                <FaBars className="text-lg" />
              )
            ) : collapsed ? (
              <FaChevronRight className="text-lg" />
            ) : (
              <FaChevronLeft className="text-lg" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
        {/* Footer */}
        <div className="border-t border-slate-200 bg-white p-6">
          <div className="flex items-center space-x-4">
            <Link
              to="/account-management"
              className="flex items-center space-x-4 hover:opacity-90 transition-opacity w-full"
              onClick={handleLinkClick}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-base font-semibold text-white">
                <FaUser className="text-lg" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {email || "User Account"}
                  </p>
                  <p className="truncate text-xs capitalize text-slate-500">
                    {role || "Administrator"}
                  </p>
                  {!collapsed && (
                    <p className="mt-1 text-xs font-medium text-blue-600 hover:underline">
                      Manage Account →
                    </p>
                  )}
                </div>
              )}
            </Link>
          </div>

          {/* mobile-only close removed */}
        </div>
      </div>
      {/* no mobile padding */}
    </>
  );
};

export default Sidebar;
