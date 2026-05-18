import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  FaBars,
  FaBell,
  FaCheckCircle,
  FaChevronDown,
  FaCog,
  FaEnvelope,
  FaExclamationTriangle,
  FaHeadset,
  FaSearch,
  FaSignOutAlt,
  FaSpinner,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../api";
import { getSearchNavigationTarget } from "../utils/searchNavigation";
import {
  EMPTY_SUMMARY,
  createMobileReminderSummary,
} from "../utils/mobileReminders";

const extractSmartphoneRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.smartphones)) return payload.smartphones;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const getUserInitials = (value) =>
  String(value || "JD")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const SearchSuggestions = ({
  suggestions,
  loading,
  activeIndex,
  searchQuery,
  onSelect,
  onViewAll,
}) => {
  if (loading) {
    return (
      <div className="px-4 py-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <FaSpinner className="animate-spin text-base" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-800">
          Searching...
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Finding products and brands
        </p>
      </div>
    );
  }

  if (suggestions.length === 0 && searchQuery.trim()) {
    return (
      <div className="px-4 py-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <FaSearch className="text-base" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-800">
          No results for &quot;{searchQuery}&quot;
        </p>
        <p className="mt-1 text-xs text-slate-500">Try different keywords</p>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <>
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Search Results
        </p>
      </div>
      <div className="max-h-[24rem] overflow-y-auto p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.type}-${suggestion.id}-${index}`}
            type="button"
            onClick={() => onSelect(suggestion)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
              index === activeIndex
                ? "bg-blue-50 ring-1 ring-blue-100"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              {getUserInitials(suggestion.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {suggestion.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {suggestion.brand_name || suggestion.type || "Search result"}
              </p>
            </div>
            <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-semibold text-[#4A55FF]">
              {suggestion.type === "brand" ? "Brand" : "Product"}
            </span>
          </button>
        ))}
      </div>
      <div className="border-t border-slate-100 px-3 py-3">
        <button
          type="button"
          onClick={onViewAll}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#345CFF] transition hover:bg-[#F6F8FF]"
        >
          View all results
        </button>
      </div>
    </>
  );
};

const NotificationPanel = ({ summary, loading, error, onSelect }) => {
  const items = summary?.items || [];

  return (
    <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_25px_55px_rgba(15,23,42,0.14)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <h3 className="text-sm font-semibold text-slate-950">Notifications</h3>
        <button type="button" className="text-xs font-semibold text-[#345CFF]">
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <FaSpinner className="animate-spin text-base" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Loading notifications
          </p>
        </div>
      ) : error && items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <FaExclamationTriangle className="text-base" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Failed to load notifications
          </p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <div className="mt-4 text-xs font-semibold text-[#345CFF]">
            Tap the bell again to retry
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
            <FaCheckCircle className="text-base" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            No new notifications
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[22rem] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0">
            {items.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F7FF] text-slate-500">
                  <FaBell className="text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.description}
                  </p>
                </div>
                <div className="flex min-w-[48px] flex-col items-end gap-2">
                  <span className="text-xs text-slate-400">
                    {item.whenLabel || "Now"}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#345CFF]" />
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 px-4 py-4 text-center">
            <button
              type="button"
              className="text-sm font-semibold text-[#4A55FF]"
            >
              View all notifications
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const UserMenu = ({ userName, role, onNavigate, onLogout }) => (
  <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_25px_55px_rgba(15,23,42,0.14)]">
    <div className="border-b border-slate-100 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#345CFF] to-[#7A2CFF] text-sm font-bold text-white">
          {getUserInitials(userName)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">{userName}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </div>

    <div className="px-2 py-2">
      {[
        {
          label: "My Profile",
          icon: FaUser,
          action: () => onNavigate("/account-management"),
        },
        {
          label: "Account Settings",
          icon: FaCog,
          action: () => onNavigate("/change-password"),
        },
        {
          label: "Preferences",
          icon: FaCog,
          action: () => onNavigate("/settings/compare-pages"),
        },
        {
          label: "Help & Support",
          icon: FaHeadset,
          action: () => onNavigate("/dashboard"),
        },
      ].map((entry) => {
        const Icon = entry.icon;
        return (
          <button
            key={entry.label}
            type="button"
            onClick={entry.action}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Icon className="text-slate-400" />
            {entry.label}
          </button>
        );
      })}
    </div>

    <div className="border-t border-slate-100 px-2 py-2">
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
      >
        <FaSignOutAlt />
        Logout
      </button>
    </div>
  </div>
);

const Navbar = ({ isMobile, sidebarOpen, onToggleSidebar, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState(EMPTY_SUMMARY);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationsLoadedAt, setNotificationsLoadedAt] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchTimer = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  const email =
    Cookies.get("userEmail") || Cookies.get("username") || "John Doe";
  const role = Cookies.get("userRole") || Cookies.get("role") || "Super Admin";
  const userName = Cookies.get("userName") || email;

  const notificationCountLabel = useMemo(() => {
    if (notificationSummary.total <= 0) return "12";
    return notificationSummary.total > 99
      ? "99+"
      : String(notificationSummary.total);
  }, [notificationSummary.total]);

  const shouldRefreshNotifications = useMemo(() => {
    if (!notificationsLoadedAt) return true;
    const lastUpdated =
      notificationsLoadedAt instanceof Date
        ? notificationsLoadedAt.getTime()
        : new Date(notificationsLoadedAt).getTime();
    return (
      Number.isNaN(lastUpdated) || Date.now() - lastUpdated > 5 * 60 * 1000
    );
  }, [notificationsLoadedAt]);

  useEffect(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowSuggestions(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobile && mobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobile, mobileSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSuggestions &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
      if (
        showNotifications &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications, showSuggestions, showUserMenu]);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationError("");

    try {
      const token = getAuthToken();
      const res = await fetch(buildUrl("/api/smartphone"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setNotificationSummary(
        createMobileReminderSummary(extractSmartphoneRows(data)),
      );
      setNotificationsLoadedAt(new Date());
    } catch (error) {
      console.error("Notification error:", error);
      setNotificationError(error.message || "Failed to load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(loadNotifications, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!searchQuery.trim()) {
      setSuggestions([]);
      setActiveIndex(-1);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return undefined;
    }

    setSuggestionsLoading(true);
    searchTimer.current = window.setTimeout(async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(
          buildUrl(
            `/api/search/admin?q=${encodeURIComponent(searchQuery.trim())}`,
          ),
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        if (!res.ok) {
          throw new Error(`Search failed with status ${res.status}`);
        }

        const data = await res.json();
        const results = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
            ? data
            : [];

        setSuggestions(results);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 250);

    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const handleSelectSuggestion = useCallback(
    (suggestion) => {
      const target = getSearchNavigationTarget(suggestion, searchQuery.trim());
      navigate(target.path, target.state ? { state: target.state } : undefined);
      setSearchQuery("");
      setShowSuggestions(false);
      setMobileSearchOpen(false);
    },
    [navigate, searchQuery],
  );

  const performSearch = useCallback(
    (query) => {
      if (!query.trim()) return;
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      setMobileSearchOpen(false);
    },
    [navigate],
  );

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      performSearch(searchQuery);
    },
    [performSearch, searchQuery],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!showSuggestions) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelectSuggestion(suggestions[activeIndex]);
        } else {
          performSearch(searchQuery);
        }
      } else if (event.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [
      activeIndex,
      handleSelectSuggestion,
      performSearch,
      searchQuery,
      showSuggestions,
      suggestions,
    ],
  );

  const toggleNotifications = useCallback(() => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);
    setShowUserMenu(false);
    setShowSuggestions(false);
    if (nextOpen && shouldRefreshNotifications) {
      loadNotifications();
    }
  }, [loadNotifications, shouldRefreshNotifications, showNotifications]);

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
    setShowNotifications(false);
    setShowSuggestions(false);
  }, []);

  const handleReminderSelect = useCallback(
    (item) => {
      setShowNotifications(false);
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

  const renderSearchBar = (mobile = false) => (
    <div className="relative min-w-0 flex-1" ref={searchContainerRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <FaSearch
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm ${
            mobile ? "text-slate-400" : "text-slate-400"
          }`}
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            if (event.target.value.trim()) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchQuery.trim()) setShowSuggestions(true);
          }}
          placeholder="Search for products, brands, categories, articles..."
          className={
            mobile
              ? "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#345CFF] focus:outline-none"
              : "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-24 text-sm text-slate-800 placeholder:text-slate-400 shadow-[0_10px_28px_rgba(15,23,42,0.05)] focus:border-[#345CFF] focus:outline-none"
          }
        />
        {mobile ? (
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(false);
              setSearchQuery("");
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <FaTimes />
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            Ctrl K
          </span>
        )}

        {showSuggestions ? (
          <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_25px_55px_rgba(15,23,42,0.14)]">
            <SearchSuggestions
              suggestions={suggestions}
              loading={suggestionsLoading}
              activeIndex={activeIndex}
              searchQuery={searchQuery}
              onSelect={handleSelectSuggestion}
              onViewAll={() => performSearch(searchQuery)}
            />
          </div>
        ) : null}
      </form>
    </div>
  );

  const actionButtonBase = isMobile
    ? "relative flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
    : "relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-[0_10px_25px_rgba(15,23,42,0.05)] transition hover:bg-slate-50 hover:text-slate-900";

  if (isMobile) {
    return (
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
        <div className="px-2 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Open navigation menu"
            >
              <FaBars className="text-base" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  mobileSearchOpen
                    ? "bg-[#F6F8FF] text-[#345CFF]"
                    : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-label={mobileSearchOpen ? "Close search" : "Open search"}
                aria-expanded={mobileSearchOpen}
              >
                <FaSearch className="text-sm" />
              </button>

              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className={actionButtonBase}
                >
                  <FaBell className="text-sm" />
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {notificationCountLabel}
                  </span>
                </button>
                {showNotifications ? (
                  <NotificationPanel
                    summary={notificationSummary}
                    loading={notificationsLoading}
                    error={notificationError}
                    onSelect={handleReminderSelect}
                  />
                ) : null}
              </div>

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={toggleUserMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#345CFF] to-[#7A2CFF] text-[11px] font-bold text-white shadow-[0_10px_25px_rgba(92,76,255,0.22)]"
                >
                  {getUserInitials(userName)}
                </button>
                {showUserMenu ? (
                  <UserMenu
                    userName={userName}
                    role={role}
                    onNavigate={(path) => {
                      navigate(path);
                      setShowUserMenu(false);
                    }}
                    onLogout={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {mobileSearchOpen ? (
          <div className="border-t border-slate-100 px-2 py-3">
            {renderSearchBar(true)}
          </div>
        ) : null}
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex w-full max-w-[1720px] items-center gap-4 px-6 py-4 lg:px-8">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-600 shadow-[0_10px_25px_rgba(15,23,42,0.05)] transition hover:bg-slate-50 hover:text-slate-900"
        >
          <FaBars className="text-base" />
        </button>

        <div className="min-w-0 flex-1">{renderSearchBar(false)}</div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={toggleNotifications}
              className={actionButtonBase}
            >
              <FaBell className="text-sm" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {notificationCountLabel}
              </span>
            </button>
            {showNotifications ? (
              <NotificationPanel
                summary={notificationSummary}
                loading={notificationsLoading}
                error={notificationError}
                onSelect={handleReminderSelect}
              />
            ) : null}
          </div>

          <button type="button" className={actionButtonBase}>
            <FaEnvelope className="text-sm" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
              5
            </span>
          </button>

          <button type="button" className={actionButtonBase}>
            <FaHeadset className="text-sm" />
          </button>

          <div className="h-8 w-px bg-slate-200" />

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={toggleUserMenu}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-1.5 text-slate-900 shadow-[0_10px_25px_rgba(15,23,42,0.05)] transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-900">
                {getUserInitials(userName)}
              </div>
              <div className="hidden text-left leading-tight xl:block">
                <p className="text-sm font-semibold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">{role}</p>
              </div>
              <FaChevronDown className="text-xs text-slate-400" />
            </button>

            {showUserMenu ? (
              <UserMenu
                userName={userName}
                role={role}
                onNavigate={(path) => {
                  navigate(path);
                  setShowUserMenu(false);
                }}
                onLogout={() => {
                  onLogout();
                  setShowUserMenu(false);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
