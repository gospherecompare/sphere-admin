import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FaBolt,
  FaBoxOpen,
  FaChartLine,
  FaCircle,
  FaCode,
  FaCog,
  FaDatabase,
  FaImage,
  FaLaptop,
  FaMobileAlt,
  FaNewspaper,
  FaShieldAlt,
  FaStore,
  FaTags,
  FaTv,
  FaUsers,
} from "react-icons/fa";

const routeMeta = [
  {
    test: (path) => path.startsWith("/products/smartphones"),
    eyebrow: "Product Operations",
    title: "Smartphone Workspace",
    description:
      "Create, enrich, review, and publish smartphone catalog data from one controlled workspace.",
    icon: FaMobileAlt,
    accent: "violet",
  },
  {
    test: (path) => path.startsWith("/edit-mobile"),
    eyebrow: "Product Operations",
    title: "Edit Smartphone",
    description:
      "Update product intelligence, specifications, availability, media, and publishing state.",
    icon: FaMobileAlt,
    accent: "violet",
  },
  {
    test: (path) => path.startsWith("/products/laptops"),
    eyebrow: "Product Operations",
    title: "Laptop Workspace",
    description:
      "Manage laptop specifications, variants, pricing signals, images, and publishing readiness.",
    icon: FaLaptop,
    accent: "blue",
  },
  {
    test: (path) =>
      path.startsWith("/products/tvs") ||
      path.startsWith("/products/homeappliances") ||
      path.startsWith("/products/appliances") ||
      path.startsWith("/create-home-appliance"),
    eyebrow: "Product Operations",
    title: "Television Workspace",
    description:
      "Maintain structured television catalog data and keep every product record release-ready.",
    icon: FaTv,
    accent: "cyan",
  },
  {
    test: (path) => path.startsWith("/content"),
    eyebrow: "Editorial Studio",
    title: "Content & News",
    description:
      "Plan, write, review, and publish timely stories with a focused editorial workflow.",
    icon: FaNewspaper,
    accent: "rose",
  },
  {
    test: (path) => path.startsWith("/reports"),
    eyebrow: "Live Intelligence",
    title: "Analytics & Reports",
    description:
      "Explore publishing performance, user behavior, search demand, and operational signals.",
    icon: FaChartLine,
    accent: "emerald",
  },
  {
    test: (path) => path.startsWith("/marketing"),
    eyebrow: "Growth Studio",
    title: "Marketing Workspace",
    description:
      "Build visual campaigns, placements, banners, and conversion-ready promotional assets.",
    icon: FaImage,
    accent: "orange",
  },
  {
    test: (path) => path.startsWith("/specifications/categories"),
    eyebrow: "Catalog Foundation",
    title: "Category Management",
    description:
      "Organize product taxonomy so every catalog, filter, and comparison stays consistent.",
    icon: FaTags,
    accent: "amber",
  },
  {
    test: (path) => path.startsWith("/specifications/brands"),
    eyebrow: "Catalog Foundation",
    title: "Brand Management",
    description:
      "Maintain trusted brand records, identity assets, and reusable catalog relationships.",
    icon: FaBoxOpen,
    accent: "indigo",
  },
  {
    test: (path) => path.startsWith("/specifications/store"),
    eyebrow: "Commerce Data",
    title: "Store Management",
    description:
      "Manage store sources and the commerce metadata powering price and availability signals.",
    icon: FaStore,
    accent: "blue",
  },
  {
    test: (path) => path.startsWith("/specifications"),
    eyebrow: "Catalog Foundation",
    title: "Specification System",
    description:
      "Define reusable product attributes and keep data entry consistent across every category.",
    icon: FaDatabase,
    accent: "indigo",
  },
  {
    test: (path) =>
      path.startsWith("/user-management") ||
      path.startsWith("/account-management"),
    eyebrow: "Administration",
    title: "Account Operations",
    description:
      "Manage team access, account details, workspace ownership, and operational identity.",
    icon: FaUsers,
    accent: "blue",
  },
  {
    test: (path) => path.startsWith("/permission-management"),
    eyebrow: "Administration",
    title: "Roles & Permissions",
    description:
      "Control access precisely with clear roles, permissions, and protected workspace boundaries.",
    icon: FaShieldAlt,
    accent: "violet",
  },
  {
    test: (path) => path.startsWith("/settings"),
    eyebrow: "System Configuration",
    title: "Platform Settings",
    description:
      "Tune comparison logic, scoring models, and product intelligence behavior safely.",
    icon: FaCog,
    accent: "slate",
  },
  {
    test: (path) => path.startsWith("/api-tester"),
    eyebrow: "Developer Tools",
    title: "API Command Center",
    description:
      "Inspect endpoints, test payloads, and validate integrations in a focused technical workspace.",
    icon: FaCode,
    accent: "cyan",
  },
  {
    test: (path) => path.startsWith("/search"),
    eyebrow: "Workspace Search",
    title: "Global Results",
    description:
      "Find products, brands, categories, content, and operational records across Hooks.",
    icon: FaBolt,
    accent: "indigo",
  },
];

const fallbackMeta = {
  eyebrow: "Hooks Operations",
  title: "Workspace",
  description:
    "Manage platform data, publishing workflows, and operational intelligence from one place.",
  icon: FaBolt,
  accent: "indigo",
};

const accentClasses = {
  violet: "from-violet-500 to-fuchsia-500 shadow-violet-500/25",
  blue: "from-blue-500 to-indigo-500 shadow-blue-500/25",
  cyan: "from-cyan-500 to-blue-500 shadow-cyan-500/25",
  rose: "from-rose-500 to-pink-500 shadow-rose-500/25",
  emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/25",
  orange: "from-orange-500 to-rose-500 shadow-orange-500/25",
  amber: "from-amber-400 to-orange-500 shadow-amber-500/25",
  indigo: "from-indigo-500 to-violet-500 shadow-indigo-500/25",
  slate: "from-slate-600 to-slate-800 shadow-slate-500/20",
};

const WorkspacePageHeader = () => {
  const location = useLocation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const meta = useMemo(
    () => routeMeta.find((item) => item.test(location.pathname)) || fallbackMeta,
    [location.pathname],
  );

  if (location.pathname === "/dashboard") return null;

  const Icon = meta.icon;
  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  const date = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  });

  return (
    <section className="hooks-workspace-header" aria-labelledby="workspace-title">
      <div className="hooks-workspace-grid" aria-hidden="true" />
      <div className="hooks-workspace-orb hooks-workspace-orb-one" aria-hidden="true" />
      <div className="hooks-workspace-orb hooks-workspace-orb-two" aria-hidden="true" />

      <div className="relative z-10 flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
        <div
          className={`hooks-workspace-icon bg-gradient-to-br ${accentClasses[meta.accent] || accentClasses.indigo}`}
        >
          <Icon aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="hooks-eyebrow">{meta.eyebrow}</span>
            <span className="hooks-live-chip">
              <FaCircle className="text-[7px]" aria-hidden="true" />
              System live
            </span>
          </div>
          <h1 id="workspace-title" className="hooks-workspace-title">
            {meta.title}
          </h1>
          <p className="hooks-workspace-description">{meta.description}</p>
        </div>
      </div>

      <div className="hooks-workspace-time relative z-10" aria-label="Current India time">
        <span className="hooks-workspace-time-label">Live workspace</span>
        <strong>{time}</strong>
        <span>{date} · IST</span>
      </div>
    </section>
  );
};

export default WorkspacePageHeader;
