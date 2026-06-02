import React, { useEffect, useState } from "react";
import Drawer from "@mui/material/Drawer";
import { Link, useLocation } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaChartBar,
  FaChartLine,
  FaChevronDown,
  FaClipboardList,
  FaCog,
  FaExchangeAlt,
  FaFileAlt,
  FaHeartbeat,
  FaHome,
  FaLaptopCode,
  FaLink,
  FaMemory,
  FaMobileAlt,
  FaNewspaper,
  FaRobot,
  FaSearch,
  FaSignal,
  FaStore,
  FaTags,
  FaTimes,
  FaTv,
  FaUserCog,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";

const HOOK_LOGO_URL = "/hook-logo.png";

const DESKTOP_SECTIONS = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        icon: FaHome,
        path: "/dashboard",
        prefixes: ["/dashboard"],
      },
      {
        label: "Smartphones",
        icon: FaMobileAlt,
        path: "/products/smartphones/inventory",
        prefixes: ["/products/smartphones"],
        chevron: true,
        children: [
          {
            label: "View Mobiles",
            path: "/products/smartphones/inventory",
            prefixes: ["/products/smartphones/inventory"],
          },
          {
            label: "Add New Mobile",
            path: "/products/smartphones/create",
            prefixes: ["/products/smartphones/create"],
          },
          {
            label: "Upcoming Mobiles",
            path: "/products/smartphones/upcoming",
            prefixes: ["/products/smartphones/upcoming"],
          },
        ],
      },
      {
        label: "Laptops",
        icon: FaLaptopCode,
        path: "/products/laptops/inventory",
        prefixes: ["/products/laptops"],
        chevron: true,
      },
      {
        label: "Television",
        icon: FaTv,
        path: "/products/tvs/inventory",
        prefixes: ["/products/tvs", "/products/homeappliances"],
        chevron: true,
      },
      {
        label: "Compare Engine",
        icon: FaExchangeAlt,
        path: "/settings/compare-pages",
        prefixes: [
          "/settings/compare-pages",
          "/settings/compare-scoring",
          "/settings/device-field-profiles",
        ],
        chevron: true,
        children: [
          {
            label: "Compare Pages",
            path: "/settings/compare-pages",
            prefixes: ["/settings/compare-pages"],
          },
          {
            label: "Compare Scoring",
            path: "/settings/compare-scoring",
            prefixes: ["/settings/compare-scoring"],
          },
          {
            label: "Device Profiles",
            path: "/settings/device-field-profiles",
            prefixes: ["/settings/device-field-profiles"],
          },
        ],
      },
      {
        label: "Trending",
        icon: FaSignal,
        path: "/reports/trending",
        prefixes: ["/reports/trending"],
        chevron: true,
        children: [
          {
            label: "Trending Manager",
            path: "/reports/trending",
            prefixes: ["/reports/trending"],
            searchParam: { key: "section", value: "manager", allowEmpty: true },
          },
          {
            label: "Trending Rules",
            path: "/reports/trending",
            prefixes: ["/reports/trending"],
            searchParam: { key: "section", value: "rules" },
          },
          {
            label: "Boost History",
            path: "/reports/trending",
            prefixes: ["/reports/trending"],
            searchParam: { key: "section", value: "history" },
          },
        ],
      },
    ],
  },
  {
    title: "MASTER DATA",
    items: [
      {
        label: "Brands",
        icon: FaTags,
        path: "/specifications/brands",
        prefixes: ["/specifications/brands"],
      },
      {
        label: "Categories",
        icon: FaClipboardList,
        path: "/specifications/categories",
        prefixes: ["/specifications/categories"],
      },
      {
        label: "Stores",
        icon: FaStore,
        path: "/specifications/store",
        prefixes: ["/specifications/store"],
      },
      {
        label: "RAM / Storage",
        icon: FaMemory,
        path: "/specifications/memory-storage/configurations",
        prefixes: ["/specifications/memory-storage"],
      },
    ],
  },
  {
    title: "CONTENT",
    items: [
      {
        label: "Newsroom CMS",
        icon: FaNewspaper,
        path: "/content/news-articles",
        prefixes: ["/content/news-articles"],
      },
      {
        label: "Banner Manager",
        icon: FaFileAlt,
        path: "/marketing/banners",
        prefixes: ["/marketing/banners"],
      },
      {
        label: "Affiliate Links",
        icon: FaLink,
        path: "/marketing/affiliate-links",
        prefixes: ["/marketing/affiliate-links"],
      },
    ],
  },
  {
    title: "REPORTS",
    items: [
      {
        label: "Published by User",
        icon: FaUserCog,
        path: "/reports/useractivity",
        prefixes: ["/reports/useractivity", "/analytics"],
      },
      {
        label: "Publish Status",
        icon: FaChartLine,
        path: "/reports/productpublishstatus",
        prefixes: ["/reports/productpublishstatus"],
      },
      {
        label: "Launch Timing",
        icon: FaChartBar,
        path: "/reports/launch-timing",
        prefixes: ["/reports/launch-timing"],
      },
      {
        label: "Recent Publish Activity",
        icon: FaUsers,
        path: "/reports/recentactivity",
        prefixes: ["/reports/recentactivity"],
      },
      {
        label: "Feature Clicks",
        icon: FaLink,
        path: "/reports/feature-clicks",
        prefixes: ["/reports/feature-clicks"],
      },
      {
        label: "Search Popularity",
        icon: FaSearch,
        path: "/reports/search-popularity",
        prefixes: ["/reports/search-popularity"],
      },
      {
        label: "Hook Score",
        icon: FaRobot,
        path: "/reports/hook-score",
        prefixes: ["/reports/hook-score"],
      },
      {
        label: "Career Applications",
        icon: FaHeartbeat,
        path: "/reports/career-applications",
        prefixes: ["/reports/career-applications"],
      },
      {
        label: "Product Categories",
        icon: FaClipboardList,
        path: "/reports/productcategories",
        prefixes: ["/reports/productcategories"],
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        label: "Users & Permissions",
        icon: FaUserCog,
        path: "/user-management",
        prefixes: ["/user-management"],
      },
      {
        label: "Roles",
        icon: FaUserShield,
        path: "/permission-management",
        prefixes: ["/permission-management"],
      },
      {
        label: "Customers",
        icon: FaUsers,
        path: "/customer-management",
        prefixes: ["/customer-management"],
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "API Tester",
        icon: FaBolt,
        path: "/api-tester",
        prefixes: ["/api-tester"],
      },
      {
        label: "Account Settings",
        icon: FaCog,
        path: "/account-management",
        prefixes: ["/account-management", "/change-password"],
      },
    ],
  },
];

const matchesPath = (pathname, item) =>
  (item.prefixes || []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const buildTo = (item) => {
  if (item?.searchParam?.key && item?.searchParam?.value) {
    return `${item.path}?${item.searchParam.key}=${item.searchParam.value}`;
  }
  return item.path;
};

const matchesItem = (location, item) => {
  const pathname = location.pathname || "/dashboard";
  const pathMatch = matchesPath(pathname, item);
  if (!pathMatch) return false;

  if (!item.searchParam) return true;

  const params = new URLSearchParams(location.search || "");
  const currentValue = params.get(item.searchParam.key);
  if (item.searchParam.allowEmpty) {
    return !currentValue || currentValue === item.searchParam.value;
  }

  return currentValue === item.searchParam.value;
};

const getMobileExpandedState = (location) => {
  const nextState = {};

  DESKTOP_SECTIONS.forEach((section) => {
    section.items.forEach((item) => {
      if (Array.isArray(item.children) && item.children.length > 0) {
        nextState[item.label] =
          matchesItem(location, item) ||
          item.children.some((child) => matchesItem(location, child));
      }
    });
  });

  return nextState;
};

const DesktopNavItem = ({ item, location, collapsed }) => {
  const Icon = item.icon;
  const childItems = Array.isArray(item.children) ? item.children : [];
  const hasActiveChild = childItems.some((child) =>
    matchesItem(location, child),
  );
  const active = matchesItem(location, item) || hasActiveChild;
  const showChildren = !collapsed && childItems.length > 0 && active;

  return (
    <div>
      <Link
        to={buildTo(item)}
        title={collapsed ? item.label : undefined}
        className={`group flex items-center rounded-xl border transition ${
          collapsed ? "justify-center px-0 py-3.5" : "px-3.5 py-3"
        } ${
          active
            ? "border-white/10 bg-gradient-to-r from-[#345CFF] to-[#7A2CFF] text-white shadow-[0_18px_35px_rgba(90,73,255,0.24)]"
            : "border-transparent text-slate-200/90 hover:border-white/10 hover:bg-white/6 hover:text-white"
        }`}
      >
        <Icon
          className={`text-[15px] ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`}
        />
        {!collapsed ? (
          <>
            <span className="ml-3 flex-1 text-[15px] font-medium">
              {item.label}
            </span>
            {item.chevron || childItems.length > 0 ? (
              showChildren ? (
                <FaChevronDown className="text-[11px] text-white/70" />
              ) : (
                <FaArrowRight className="text-[11px] text-slate-500" />
              )
            ) : null}
          </>
        ) : null}
      </Link>

      {showChildren ? (
        <div className="mt-2 ml-4 space-y-1 border-l border-white/10 pl-4">
          {childItems.map((child) => {
            const childActive = matchesItem(location, child);
            return (
              <Link
                key={`${item.label}-${child.label}`}
                to={buildTo(child)}
                className={`flex items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                  childActive
                    ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "text-slate-300/80 hover:bg-white/6 hover:text-white"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const DesktopSidebar = ({ collapsed, location }) => (
  <aside
    className={`sticky top-0 hidden h-screen min-h-screen shrink-0 overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(90,73,255,0.22),_transparent_22%),linear-gradient(180deg,_#0F1833_0%,_#0A1228_50%,_#081024_100%)] text-white lg:flex lg:flex-col ${
      collapsed ? "w-20" : "w-[214px]"
    } transition-all duration-300`}
  >
    <div
      className={`flex items-center ${collapsed ? "justify-center px-3 py-5" : "px-5 py-5"}`}
    >
      {collapsed ? (
        <Link
          to="/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/6 ring-1 ring-white/10"
        >
          <img src={HOOK_LOGO_URL} className="h-8 w-8" showText={false} />
        </Link>
      ) : (
        <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[1.9rem] font-bold leading-none tracking-tight text-white uppercase">
              hooks
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">
              Gadget Intelligence
            </p>
          </div>
        </Link>
      )}
    </div>

    <div className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0">
      {DESKTOP_SECTIONS.map((section) => (
        <div key={section.title} className="mb-5">
          {!collapsed ? (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {section.title}
            </p>
          ) : null}

          <div className="space-y-1.5">
            {section.items.map((item) => (
              <DesktopNavItem
                key={`${section.title}-${item.label}`}
                item={item}
                location={location}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </aside>
);

const MobileNavItem = ({
  item,
  location,
  setMobileOpen,
  expandedItems,
  onToggleChildren,
}) => {
  const Icon = item.icon;
  const childItems = Array.isArray(item.children) ? item.children : [];
  const hasActiveChild = childItems.some((child) =>
    matchesItem(location, child),
  );
  const active = matchesItem(location, item) || hasActiveChild;
  const hasChildren = childItems.length > 0;
  const showChildren = hasChildren && expandedItems[item.label];

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onToggleChildren(item.label)}
          className={`group flex w-full items-center rounded-xl border px-3.5 py-3 text-left transition ${
            active || showChildren
              ? "border-white/10 bg-gradient-to-r from-[#345CFF] to-[#7A2CFF] text-white shadow-[0_18px_35px_rgba(90,73,255,0.24)]"
              : "border-transparent text-slate-200/90 hover:border-white/10 hover:bg-white/6 hover:text-white"
          }`}
        >
          <Icon
            className={`text-[15px] ${
              active || showChildren
                ? "text-white"
                : "text-slate-400 group-hover:text-white"
            }`}
          />
          <span className="ml-3 flex-1 text-[15px] font-medium">
            {item.label}
          </span>
          <FaChevronDown
            className={`text-[11px] transition ${
              showChildren ? "rotate-180 text-white/70" : "text-slate-500"
            }`}
          />
        </button>

        {showChildren ? (
          <div className="mt-2 ml-4 space-y-1 border-l border-white/10 pl-4">
            {childItems.map((child) => {
              const childActive = matchesItem(location, child);
              return (
                <Link
                  key={`${item.label}-${child.label}`}
                  to={buildTo(child)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                    childActive
                      ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                      : "text-slate-300/80 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <Link
        to={buildTo(item)}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center rounded-xl border px-3.5 py-3 transition ${
          active
            ? "border-white/10 bg-gradient-to-r from-[#345CFF] to-[#7A2CFF] text-white shadow-[0_18px_35px_rgba(90,73,255,0.24)]"
            : "border-transparent text-slate-200/90 hover:border-white/10 hover:bg-white/6 hover:text-white"
        }`}
      >
        <Icon
          className={`text-[15px] ${
            active ? "text-white" : "text-slate-400 group-hover:text-white"
          }`}
        />
        <span className="ml-3 flex-1 text-[15px] font-medium">
          {item.label}
        </span>
        {item.chevron ? (
          <FaArrowRight className="text-[11px] text-slate-500" />
        ) : null}
      </Link>
    </div>
  );
};

const MobileDrawer = ({ mobileOpen, setMobileOpen, location, onLogout }) => {
  const [expandedItems, setExpandedItems] = useState(() =>
    getMobileExpandedState(location),
  );

  useEffect(() => {
    setExpandedItems((previous) => ({
      ...previous,
      ...getMobileExpandedState(location),
    }));
  }, [location]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileOpen, setMobileOpen]);

  const toggleChildren = (label) => {
    setExpandedItems((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  };

  return (
    <Drawer
      anchor="left"
      open={mobileOpen}
      onClose={() => setMobileOpen(false)}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        display: {
          xs: "block",
          lg: "none",
        },
        zIndex: 1400,
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(2, 6, 23, 0.28)",
        },
        "& .MuiDrawer-paper": {
          width: "88vw",
          maxWidth: "340px",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          background:
            "radial-gradient(circle at top, rgba(90,73,255,0.22), transparent 24%), linear-gradient(180deg, #101933 0%, #0A1228 48%, #081024 100%)",
          color: "#fff",
          boxShadow: "0 30px 80px rgba(3,7,18,0.55)",
          padding: "24px 8px 20px",
          overflow: "hidden",
        },
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className="flex h-full flex-col"
      >
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="min-w-0"
          >
            <p className="truncate text-[1.9rem] font-bold leading-none tracking-tight text-white uppercase">
              hooks
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">
              Gadget Intelligence
            </p>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/8 hover:text-white"
            aria-label="Close sidebar"
          >
            <FaTimes className="text-base" />
          </button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0">
          {DESKTOP_SECTIONS.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {section.title}
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <MobileNavItem
                    key={`${section.title}-${item.label}`}
                    item={item}
                    location={location}
                    setMobileOpen={setMobileOpen}
                    expandedItems={expandedItems}
                    onToggleChildren={toggleChildren}
                  />
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            <FaUserShield className="text-sm text-[#A88CFF]" />
            Logout
          </button>
        </div>
      </aside>
    </Drawer>
  );
};

const Sidebar = ({
  collapsed,
  isMobile = false,
  mobileOpen = false,
  setMobileOpen,
  onLogout,
}) => {
  const location = useLocation();

  if (isMobile) {
    return (
      <MobileDrawer
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        location={location}
        onLogout={onLogout}
      />
    );
  }

  return <DesktopSidebar collapsed={collapsed} location={location} />;
};

export default Sidebar;
