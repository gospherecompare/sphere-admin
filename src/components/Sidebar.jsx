import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
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
import logo from "../../assests/smartarena.png";
import Cookies from "js-cookie";

const Sidebar = ({ collapsed, setCollapsed, isMobile, onClose }) => {
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const email = Cookies.get("username");
  const role = Cookies.get("role");

  // Menu items configuration (unified for desktop & mobile)
  const desktopMenuItems = [
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
      ],
    },
    {
      id: "Reports",
      label: "Reports",
      icon: <FaChartLine />,
      type: "submenu",
      children: [
        {
          id: "Product-cat-rep",
          label: "Product Categories",
          icon: <FaChartLine />,
          path: "/reports/productcategories",
        },
        {
          id: "Product-pub-rep",
          label: "Publish Status",
          icon: <FaCocktail />,
          path: "/reports/productpublishstatus",
        },
        {
          id: "User-activity-rep",
          label: "User Activity",
          icon: <FaUsers />,
          path: "/reports/useractivity",
        },
        {
          id: "Recent-activity-rep",
          label: "Recent Activity",
          icon: <FaStar />,
          path: "/reports/recentactivity",
        },
        {
          id: "Import-rep",
          label: "Import",
          icon: <FaUpload />,
          path: "/reports/import",
        },
        {
          id: "Export-rep",
          label: "Export",
          icon: <FaDownload />,
          path: "/reports/export",
        },
      ],
    },
  ];
  // Note: unified menu used for both desktop and mobile (no separate mobile-only items)

  // Initialize open submenus based on current route
  useEffect(() => {
    const initialOpenSubmenus = {};
    const currentItems = desktopMenuItems; // unified menu for all sizes
    currentItems.forEach((item) => {
      if (item.type === "submenu") {
        // if submenu has nested submenu children array, check recursively
        const children = item.children || [];
        const isActive = children.some((child) => {
          if (child.type === "submenu") {
            return (child.children || []).some(
              (c) => c.path === location.pathname
            );
          }
          return child.path === location.pathname;
        });
        if (isActive) {
          initialOpenSubmenus[item.id] = true;
        }
      }
    });
    setOpenSubmenus(initialOpenSubmenus);
  }, [location.pathname]);

  // Auto close on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    if (onClose && isMobile) onClose();
  }, [location.pathname, isMobile, onClose]);

  // Auto collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile, setCollapsed]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobile &&
        mobileMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".mobile-menu-toggle")
      ) {
        setMobileMenuOpen(false);
        if (onClose) onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, mobileMenuOpen, onClose]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobile, mobileMenuOpen]);

  const isItemActive = (item) => {
    if (item.type === "submenu") {
      return item.children.some((child) => child.path === location.pathname);
    }
    return item.path === location.pathname;
  };

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    if (isMobile && onClose && newState === false) {
      onClose();
    }
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
      if (onClose) onClose();
    }
  };

  const toggleSubmenu = (id) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isSubmenuOpen = (id) => {
    return openSubmenus[id] || false;
  };

  // Get menu items based on current view
  const getMenuItems = () => {
    return desktopMenuItems;
  };

  // Render a single menu item
  const renderMenuItem = (item) => {
    const isActive = isItemActive(item);
    const submenuOpen = isSubmenuOpen(item.id);

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
            ${collapsed && !isMobile ? "justify-center p-4" : "p-4"}
            ${isMobile ? "p-4" : ""}
          `}
          onMouseEnter={() => !isMobile && setHoveredItem(item.id)}
          onMouseLeave={() => !isMobile && setHoveredItem(null)}
          onClick={handleLinkClick}
        >
          <div
            className={`
              transition-colors duration-200
              ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-500 group-hover:text-gray-700"
              }
              ${isMobile ? "text-2xl" : "text-xl"}
            `}
          >
            {item.icon}
          </div>

          {(!collapsed || isMobile) && (
            <span className="ml-4 font-semibold flex-1 transition-all duration-200 text-sm">
              {item.label}
            </span>
          )}

          {/* Tooltip for collapsed desktop state */}
          {!isMobile && collapsed && hoveredItem === item.id && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 whitespace-nowrap">
              {item.label}
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900"></div>
            </div>
          )}
        </Link>
      );
    } else if (item.type === "submenu") {
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
              ${collapsed && !isMobile ? "justify-center p-4" : "p-4"}
              ${isMobile ? "p-4" : ""}
            `}
            onClick={() => toggleSubmenu(item.id)}
            onMouseEnter={() => !isMobile && setHoveredItem(item.id)}
            onMouseLeave={() => !isMobile && setHoveredItem(null)}
          >
            <div
              className={`
                transition-colors duration-200
                ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 group-hover:text-gray-700"
                }
                ${isMobile ? "text-2xl" : "text-xl"}
              `}
            >
              {item.icon}
            </div>

            {(!collapsed || isMobile) && (
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

          {/* Submenu Items */}
          {item.type === "submenu" &&
            submenuOpen &&
            (isMobile || !collapsed) && (
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-blue-100 pl-4">
                {item.children.map((child) => {
                  // Nested submenu (e.g., Products -> Smartphones -> Brands...)
                  if (child.type === "submenu") {
                    const childOpen = isSubmenuOpen(child.id);
                    return (
                      <div key={child.id} className="mb-2">
                        <div
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                            (child.children || []).some(
                              (c) => c.path === location.pathname
                            )
                              ? "bg-blue-100 text-blue-600 shadow-sm"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-700 hover:shadow-sm"
                          } ${isMobile ? "p-4" : "p-3"}`}
                          onClick={() => toggleSubmenu(child.id)}
                        >
                          <div
                            className={`transition-colors duration-200 ${
                              isMobile ? "text-xl" : "text-lg"
                            }`}
                          >
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
                            {(child.children || []).map((c) => (
                              <Link
                                key={c.id}
                                to={c.path}
                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                                  location.pathname === c.path
                                    ? "bg-blue-100 text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-700 hover:shadow-sm"
                                } ${isMobile ? "p-4" : "p-3"}`}
                                onClick={handleLinkClick}
                              >
                                <div
                                  className={`transition-colors duration-200 ${
                                    isMobile ? "text-xl" : "text-lg"
                                  }`}
                                >
                                  {c.icon}
                                </div>
                                <span className="ml-3 font-medium text-sm">
                                  {c.label}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Regular child link
                  return (
                    <Link
                      key={child.id}
                      to={child.path}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                        location.pathname === child.path
                          ? "bg-blue-100 text-blue-600 shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-700 hover:shadow-sm"
                      } ${isMobile ? "p-4" : "p-3"}`}
                      onClick={handleLinkClick}
                    >
                      <div
                        className={`transition-colors duration-200 ${
                          isMobile ? "text-xl" : "text-lg"
                        }`}
                      >
                        {child.icon}
                      </div>
                      <span className="ml-3 font-medium text-sm">
                        {child.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
        </div>
      );
    }
  };

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-lg z-40 border-b border-gray-200 mobile-header">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 mobile-menu-toggle"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <FaTimes className="text-xl" />
                ) : (
                  <FaBars className="text-xl" />
                )}
              </button>
              <Link
                to="/dashboard"
                className="flex items-center"
                onClick={handleLinkClick}
              >
                <img
                  src={logo}
                  alt="Smart Arena"
                  className="w-10 h-10 mr-3 object-cover rounded-lg shadow-sm"
                />
                <div className="flex flex-col">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent font-bold text-base">
                    Smart Arena
                  </span>
                </div>
              </Link>
            </div>

            {/* User profile in mobile header */}
            <Link to="/user-management" className="flex items-center space-x-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-800">
                  {email?.split("@")[0] || "User"}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {role || "Admin"}
                </span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                <FaUser className="text-base" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 lg:hidden backdrop-blur-sm"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          ${isMobile ? "fixed" : "relative"}
          ${isMobile && mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          ${!isMobile ? "translate-x-0" : ""}
          z-50 transition-all duration-300 ease-in-out
          h-full bg-gradient-to-b from-white to-gray-50 shadow-2xl border-r border-gray-200
          flex flex-col
          ${isMobile ? "w-72" : collapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <div className="flex items-center justify-between p-6">
            {!collapsed ? (
              <Link to="/dashboard" className="flex items-center">
                <img
                  src={logo}
                  alt="Smart Arena"
                  className="w-10 h-10 mr-3 object-cover rounded-lg shadow-sm"
                />
                <div className="flex flex-col">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent font-bold text-sm whitespace-nowrap">
                    Smart Arena
                  </span>
                  <span className="text-xs text-gray-500">Admin Panel</span>
                </div>
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="mx-auto hover:scale-110 transition-transform"
              >
                <img
                  src={logo}
                  alt="SA"
                  className="w-10 h-10 object-cover rounded-lg shadow-sm"
                />
              </Link>
            )}
            {!isMobile && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:shadow-sm"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <FaChevronRight className="text-lg" />
                ) : (
                  <FaChevronLeft className="text-lg" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Navigation Menu - DIFFERENT ORDER FOR MOBILE AND DESKTOP */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {getMenuItems().map((item) => (
            <div key={item.id}>{renderMenuItem(item)}</div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={`
          border-t border-gray-200 
          ${
            isMobile
              ? "bg-white p-6"
              : "bg-gradient-to-r from-gray-50 to-white p-6"
          }
        `}
        >
          <div className="flex items-center space-x-4">
            <Link
              to="/user-management"
              className="flex items-center space-x-4 hover:opacity-90 transition-opacity w-full"
              onClick={handleLinkClick}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-base font-semibold  flex-shrink-0">
                <FaUser className="text-lg" />
              </div>
              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {email || "User Account"}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {role || "Administrator"}
                  </p>
                  {!isMobile && (
                    <p className="text-xs text-blue-500 font-medium mt-1 hover:underline">
                      Manage Account →
                    </p>
                  )}
                </div>
              )}
            </Link>
          </div>

          {/* Version info */}

          {/* Mobile-only close button */}
          {isMobile && (
            <div className="mt-6">
              <button
                onClick={toggleMobileMenu}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <FaTimes className="mr-2" />
                Close Menu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add padding for mobile header */}
      {isMobile && <div className="lg:hidden h-20"></div>}
    </>
  );
};

export default Sidebar;
