/**
 * Professional Responsive Navbar Component
 * Mobile-first responsive design with improved UX
 */
import React, { useEffect, useRef, useState } from "react";
import { FaBars, FaBell, FaSearch, FaSignOutAlt, FaTimes, FaUser } from "react-icons/fa";
import PropTypes from "prop-types";

const ResponsiveNavbar = ({
  onToggleSidebar,
  sidebarCollapsed,
  sidebarOpen,
  isMobile,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleIcon = isMobile
    ? sidebarOpen
      ? FaTimes
      : FaBars
    : sidebarCollapsed
      ? FaBars
      : FaTimes;
  const ToggleIcon = toggleIcon;

  return (
    <nav className="ui-form-shell sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b-0 px-4 md:h-20 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="soft-pill hover:bg-white"
          aria-label="Toggle sidebar"
        >
          <ToggleIcon className="text-lg text-slate-700" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Hook
          </h1>
        </div>
      </div>

      <div
        ref={searchRef}
        className="hidden w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-2 shadow-sm md:flex"
      >
        <FaSearch className="text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full border-0 bg-transparent p-0 outline-none focus:ring-0"
          onFocus={() => setSearchActive(true)}
        />
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => setSearchActive((prev) => !prev)}
          className="soft-pill md:hidden"
          aria-label="Search"
        >
          <FaSearch className="text-base text-slate-700" />
        </button>

        <button
          className="soft-pill relative"
          aria-label="Notifications"
        >
          <FaBell className="text-base text-slate-700" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="soft-pill"
            aria-label="User menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <FaUser className="text-sm" />
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">
              Account
            </span>
          </button>

          {showUserMenu && (
            <div className="ui-form-shell absolute right-0 mt-2 w-48 overflow-hidden p-1 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Admin User</p>
                <p className="text-xs text-slate-500">admin@hook.com</p>
              </div>

              <button className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm text-slate-700 hover:bg-white/80">
                Profile
              </button>
              <button className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm text-slate-700 hover:bg-white/80">
                Settings
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                <FaSignOutAlt className="text-sm" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {searchActive && isMobile && (
        <div className="ui-form-shell absolute left-3 right-3 top-16 z-30 p-3 md:hidden">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              onClick={() => setSearchActive(false)}
              className="soft-pill"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

ResponsiveNavbar.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
  sidebarCollapsed: PropTypes.bool,
  sidebarOpen: PropTypes.bool,
  isMobile: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default ResponsiveNavbar;
