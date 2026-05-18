import React from "react";
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
  FaMobileAlt,
  FaNewspaper,
  FaRobot,
  FaSearch,
  FaShoppingBag,
  FaSignal,
  FaTags,
  FaTimes,
  FaUserCog,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import HookLogo from "./Ui/hooklogo";

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
          {
            label: "Compare Pages",
            path: "/settings/compare-pages",
            prefixes: ["/settings/compare-pages"],
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
        label: "Appliances",
        icon: FaShoppingBag,
        path: "/products/tvs/inventory",
        prefixes: ["/products/tvs", "/products/homeappliances"],
        chevron: true,
      },
      {
        label: "Compare Engine",
        icon: FaExchangeAlt,
        path: "/settings/compare-pages",
        prefixes: ["/settings/compare-pages"],
        chevron: true,
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
      {
        label: "Specifications",
        icon: FaClipboardList,
        path: "/specifications/brands",
        prefixes: ["/specifications"],
      },
      {
        label: "Brands",
        icon: FaTags,
        path: "/specifications/brands",
        prefixes: ["/specifications/brands"],
      },
      {
        label: "Newsroom CMS",
        icon: FaNewspaper,
        path: "/content/news-articles",
        prefixes: ["/content/news-articles"],
      },
      {
        label: "SEO Reports",
        icon: FaSearch,
        path: "/reports/search-popularity",
        prefixes: ["/reports/search-popularity"],
      },
      {
        label: "Analytics",
        icon: FaChartLine,
        path: "/reports/productpublishstatus",
        prefixes: ["/reports/productpublishstatus", "/analytics"],
        chevron: true,
      },
      {
        label: "Affiliate Links",
        icon: FaLink,
        path: "/dashboard",
        prefixes: ["/dashboard"],
      },
      {
        label: "Publish Center",
        icon: FaFileAlt,
        path: "/reports/productpublishstatus",
        prefixes: ["/reports/productpublishstatus"],
      },
      {
        label: "AI Summaries",
        icon: FaRobot,
        path: "/dashboard",
        prefixes: ["/dashboard"],
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
      {
        label: "Activity Logs",
        icon: FaChartBar,
        path: "/reports/recentactivity",
        prefixes: ["/reports/recentactivity", "/reports/useractivity"],
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Settings",
        icon: FaCog,
        path: "/settings/compare-pages",
        prefixes: ["/settings", "/api-tester"],
      },
      {
        label: "Integrations",
        icon: FaBolt,
        path: "/api-tester",
        prefixes: ["/api-tester"],
      },
      {
        label: "System Health",
        icon: FaHeartbeat,
        path: "/dashboard",
        prefixes: ["/dashboard"],
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
          <HookLogo showText={false} className="h-8 w-8" />
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

const MobileNavItem = ({ item, location, setMobileOpen }) => {
  const Icon = item.icon;
  const childItems = Array.isArray(item.children) ? item.children : [];
  const hasActiveChild = childItems.some((child) =>
    matchesItem(location, child),
  );
  const active = matchesItem(location, item) || hasActiveChild;
  const showChildren = childItems.length > 0 && active;

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
        {item.chevron || childItems.length > 0 ? (
          showChildren ? (
            <FaChevronDown className="text-[11px] text-white/70" />
          ) : (
            <FaArrowRight className="text-[11px] text-slate-500" />
          )
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
};

const MobileDrawer = ({ mobileOpen, setMobileOpen, location, onLogout }) => (
  <aside
    className={`fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[340px] border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(90,73,255,0.22),_transparent_24%),linear-gradient(180deg,_#101933_0%,_#0A1228_48%,_#081024_100%)] px-2 pb-5 pt-6 text-white shadow-[0_30px_80px_rgba(3,7,18,0.55)] transition-transform duration-300 lg:hidden ${
      mobileOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <div className="flex items-center justify-between">
      <Link to="/dashboard" className="min-w-0">
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

    <div className="mt-6 h-[calc(100%-4.5rem)] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0">
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
);

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
