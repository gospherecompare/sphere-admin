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
} from "react-icons/fa";
import logo from "../../assests/hook-512 (1).png";

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
              id: "sp-variants",
              label: "Variants & Pricing",
              icon: <FaTags />,
              path: "/products/smartphones/variants-pricing",
            },
            {
              id: "sp-reviews",
              label: "Ratings & Reviews",
              icon: <FaStar />,
              path: "/products/smartphones/ratings-reviews",
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
          id: "home-appliances",
          label: "Home Appliances",
          icon: <FaCog />,
          type: "submenu",
          children: [
            {
              id: "ha-create",
              label: "Create Product",
              icon: <FaPlus />,
              path: "/products/appliances/create",
            },
            {
              id: "ha-inventory",
              label: "Inventory",
              icon: <FaBox />,
              path: "/products/homeappliances/inventory",
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
          id: "set-general",
          label: "General",
          icon: <FaCog />,
          path: "/settings/general",
        },
        {
          id: "set-tax",
          label: "Tax & Pricing",
          icon: <FaTags />,
          path: "/settings/tax-pricing",
        },
        {
          id: "set-api",
          label: "API Settings",
          icon: <FaNetworkWired />,
          path: "/settings/api",
        },
        {
          id: "set-api-tester",
          label: "API Tester",
          icon: <FaNetworkWired />,
          path: "/api-tester",
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
          flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 group
          ${
            isActive
              ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-4 border-blue-600 shadow-md"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md"
          }
          ${collapsed ? "justify-center p-4" : "p-4"}
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
              : "text-gray-500 group-hover:text-gray-700"
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
          <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 whitespace-nowrap">
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
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
              (child.children || []).some((c) => c.path === location.pathname)
                ? "bg-blue-100 text-blue-600 shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-700 hover:shadow-sm"
            } p-3`}
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
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                    location.pathname === c.path
                      ? "bg-blue-100 text-blue-600 shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-700 hover:shadow-sm"
                  } p-3`}
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
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
          location.pathname === child.path
            ? "bg-blue-100 text-blue-600 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-700 hover:shadow-sm"
        } p-3`}
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
          flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 group
          ${
            isActive
              ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-4 border-blue-600 shadow-md"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md"
          }
          ${collapsed ? "justify-center p-4" : "p-4"}
        `}
        onClick={() => onToggle(item.id)}
        onMouseEnter={() => onMouseEnter(item.id)}
        onMouseLeave={() => onMouseLeave()}
      >
        <div
          className={`transition-colors duration-200 ${
            isActive
              ? "text-blue-600"
              : "text-gray-500 group-hover:text-gray-700"
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
        <div className="ml-4 mt-2 space-y-1 border-l-2 border-blue-100 pl-4">
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
          " transform transition-all duration-300 ease-in-out h-full bg-gradient-to-b from-white to-gray-50 shadow-none border-r border-gray-200 flex flex-col overflow-y-auto"
        }
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between ${collapsed ? "p-3" : "p-4 sm:p-6"}`}
        >
          {!collapsed ? (
            <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="logo-wrapper">
                  <h1 className="smartarena-logo">
                    <span className="logo-letter">H</span>
                    <span className="logo-eye"></span>
                    <span className="logo-eye"></span>
                    <span className="logo-letter">K</span>
                  </h1>

                  <h4 className="logo-tagline">Smart Tech. Smart Choice.</h4>
                </div>
              </div>
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="mx-auto hover:scale-110 transition-transform flex-shrink-0"
            >
              <img
                src={logo}
                alt="Hook Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 Hook-logo rounded-lg"
              />
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
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:shadow-sm flex-shrink-0"
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
        {/* Footer */}
        <div
          className={`border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white p-6`}
        >
          <div className="flex items-center space-x-4">
            <Link
              to="/account-management"
              className="flex items-center space-x-4 hover:opacity-90 transition-opacity w-full"
              onClick={handleLinkClick}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-base font-semibold flex-shrink-0">
                <FaUser className="text-lg" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {email || "User Account"}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {role || "Administrator"}
                  </p>
                  {!collapsed && (
                    <p className="text-xs text-blue-500 font-medium mt-1 hover:underline">
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
