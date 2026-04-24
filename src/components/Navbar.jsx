import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { buildUrl, getAuthToken } from "../api";
import { getSearchNavigationTarget } from "../utils/searchNavigation";
import {
  FaBars,
  FaSearch,
  FaBell,
  FaUser,
  FaSignOutAlt,
  FaTimes,
  FaHome,
  FaChevronDown,
  FaMobileAlt,
  FaSpinner,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";
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

const getIconForType = (type) => {
  switch (type) {
    case "product":
      return <FaMobileAlt className="text-gray-400" />;
    case "brand":
      return <FaBuilding className="text-gray-400" />;
    default:
      return <FaSearch className="text-gray-400" />;
  }
};

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
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <FaSpinner className="animate-spin text-base" />
        </div>
        <p className="text-sm font-medium text-slate-700">Searching...</p>
        <p className="mt-1 text-xs text-slate-500">
          Finding products and brands
        </p>
      </div>
    );
  }

  if (suggestions.length === 0 && searchQuery.trim()) {
    return (
      <div className="px-4 py-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <FaSearch className="text-base" />
        </div>
        <p className="text-sm font-medium text-slate-700">
          No results found for "{searchQuery}"
        </p>
        <p className="mt-1 text-xs text-slate-500">Try different keywords</p>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <>
      <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Search Results
        </p>
      </div>
      {suggestions.map((suggestion, idx) => (
        <button
          key={`${suggestion.type}-${suggestion.id}-${idx}`}
          onClick={() => onSelect(suggestion)}
          onMouseEnter={() => {}}
          className={`group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-slate-50 ${
            idx === activeIndex ? "bg-sky-50/90 ring-1 ring-sky-200" : ""
          }`}
        >
          <div className="flex-shrink-0">
            {suggestion.type === "product" && suggestion.image_url ? (
              <img
                src={suggestion.image_url}
                alt={suggestion.name}
                className="h-11 w-11 rounded-md object-cover ring-1 ring-slate-200"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = getIconForType(
                    suggestion.type,
                  );
                }}
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                {getIconForType(suggestion.type)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {suggestion.name}
            </p>
            {suggestion.type === "product" ? (
              <div className="mt-1 flex items-center gap-2">
                {suggestion.brand_name ? (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                    {suggestion.brand_name}
                  </span>
                ) : null}
                <span className="text-xs capitalize text-slate-500">
                  {suggestion.product_type}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex-shrink-0">
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                suggestion.type === "product"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {suggestion.type === "product" ? "Product" : "Brand"}
            </span>
          </div>
        </button>
      ))}
      <div className="border-t border-slate-100 bg-slate-50/80 p-3">
        <button
          onClick={onViewAll}
          className="w-full rounded-md border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50"
        >
          View all results for "{searchQuery}"
        </button>
      </div>
    </>
  );
};

const UserMenu = ({
  email,
  role,
  userName,
  loginTimeLabel,
  isOpen,
  onClose,
  onNavigate,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 z-40 mt-3 w-72 overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 p-4 text-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
            <FaUser className="text-base" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {userName || email || "User"}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {email || "admin"}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {role || "Admin"}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Login: {loginTimeLabel || "N/A"}
            </p>
          </div>
        </div>
      </div>
      <div className="p-2">
        <button
          onClick={() => {
            onNavigate("/dashboard");
            onClose();
          }}
          className="mb-1 flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FaHome className="mr-3 text-slate-400" />
          Dashboard
        </button>
        <button
          onClick={() => {
            onNavigate("/profile");
            onClose();
          }}
          className="mb-1 flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FaUser className="mr-3 text-slate-400" />
          My Profile
        </button>
        <button
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <FaSignOutAlt className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

const REMINDER_STYLES = {
  today: {
    icon: FaBell,
    iconBox: "bg-rose-100 text-rose-600",
    badge: "bg-rose-100 text-rose-700",
  },
  upcoming: {
    icon: FaCalendarAlt,
    iconBox: "bg-amber-100 text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
  released: {
    icon: FaCheckCircle,
    iconBox: "bg-emerald-100 text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  update: {
    icon: FaExclamationTriangle,
    iconBox: "bg-slate-200 text-slate-700",
    badge: "bg-slate-200 text-slate-700",
  },
};

const formatLastUpdatedLabel = (value) => {
  if (!value) return "Not synced yet";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced yet";
  return `Updated ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const NotificationPanel = ({
  summary,
  loading,
  error,
  lastUpdatedAt,
  onRefresh,
  onSelect,
}) => {
  const counts = summary?.counts || EMPTY_SUMMARY.counts;
  const items = summary?.items || [];
  const hiddenCount = summary?.hiddenCount || 0;

  return (
    <div className="absolute right-0 z-50 mt-3 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Status reminders
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatLastUpdatedLabel(lastUpdatedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="Refresh reminders"
          >
            {loading ? (
              <FaSpinner className="animate-spin text-sm" />
            ) : (
              <FaSyncAlt className="text-sm" />
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
            Today {counts.today}
          </span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            Upcoming {counts.upcoming}
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Released {counts.released}
          </span>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            Update info {counts.update}
          </span>
        </div>
      </div>

      {error && items.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-rose-50 text-rose-500">
            <FaExclamationTriangle className="text-base" />
          </div>
          <p className="text-sm font-medium text-slate-800">
            Failed to load reminders
          </p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-4 rounded-md border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 && loading ? (
        <div className="px-4 py-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <FaSpinner className="animate-spin text-base" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Loading reminders...
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Checking launch and sale dates
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-500">
            <FaCheckCircle className="text-base" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            No pending reminders
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sale, launch, release, and update reminders will appear here.
          </p>
        </div>
      ) : (
        <>
          {error ? (
            <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              {error}
            </div>
          ) : null}
          <div className="max-h-[28rem] overflow-y-auto">
            {items.map((item) => {
              const styles = REMINDER_STYLES[item.group] || REMINDER_STYLES.update;
              const Icon = styles.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div
                    className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md ${styles.iconBox}`}
                  >
                    <Icon className="text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles.badge}`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {item.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span>{item.brand}</span>
                      {item.whenLabel ? <span>&bull; {item.whenLabel}</span> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="bg-slate-50/80 px-4 py-3 text-[11px] text-slate-500">
            Tap a reminder to open that mobile.
            {hiddenCount > 0
              ? ` ${hiddenCount} more reminder(s) are not shown here yet.`
              : ""}
          </div>
        </>
      )}
    </div>
  );
};

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

  const searchTimer = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  const email = Cookies.get("userEmail") || Cookies.get("username") || "User";
  const role = Cookies.get("userRole") || Cookies.get("role") || "Admin";
  const userName = Cookies.get("userName") || "";

  const parseJwtPayload = (token) => {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(payload.replace(/=+$/, ""));
      return JSON.parse(
        decodeURIComponent(
          decoded
            .split("")
            .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
            .join(""),
        ),
      );
    } catch {
      return null;
    }
  };

  const loginTimeLabel = useMemo(() => {
    const formatDate = (dateObj) => {
      if (!dateObj || Number.isNaN(dateObj.getTime())) return "N/A";
      return dateObj.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const fromCookie = Cookies.get("loginAt");
    if (fromCookie) {
      const cookieDate = new Date(fromCookie);
      if (!Number.isNaN(cookieDate.getTime())) {
        return formatDate(cookieDate);
      }
    }

    const payload = parseJwtPayload(Cookies.get("authToken"));
    if (payload?.iat) {
      const issuedDate = new Date(Number(payload.iat) * 1000);
      return formatDate(issuedDate);
    }

    return "N/A";
  }, [location.pathname]);

  const notificationCountLabel = useMemo(() => {
    if (notificationSummary.total <= 0) return "";
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
    const elapsed = Date.now() - lastUpdated;
    return Number.isNaN(elapsed) || elapsed > 5 * 60 * 1000;
  }, [notificationsLoadedAt]);

  useEffect(() => {
    setShowUserMenu(false);
    setShowSuggestions(false);
    setShowNotifications(false);
  }, [location.pathname]);

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
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const rows = extractSmartphoneRows(data);
      setNotificationSummary(createMobileReminderSummary(rows));
      setNotificationsLoadedAt(new Date());
    } catch (err) {
      console.error("Notification reminder error:", err);
      setNotificationError(
        err?.message || "Unable to load sale and launch reminders.",
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!searchQuery || searchQuery.trim().length < 1) {
      setSuggestions([]);
      setActiveIndex(-1);
      setSuggestionsLoading(false);
      setShowSuggestions(false);
      return undefined;
    }

    setSuggestionsLoading(true);
    setShowSuggestions(true);

    searchTimer.current = setTimeout(async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(
          buildUrl(
            `/api/search/admin?q=${encodeURIComponent(searchQuery.trim())}`,
          ),
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          },
        );

        if (!res.ok) {
          throw new Error(`Search failed with status: ${res.status}`);
        }

        const data = await res.json();
        const formattedResults = (data.results || data || []).map((item) => ({
          type: item.type || "product",
          id: item.id,
          name: item.name,
          product_type: item.product_type,
          brand_name: item.brand_name,
          image_url: item.image_url || null,
        }));

        setSuggestions(formattedResults);
      } catch (err) {
        console.error("Search error:", err);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const handleSelectSuggestion = useCallback(
    (suggestion) => {
      const target = getSearchNavigationTarget(suggestion, searchQuery.trim());
      navigate(target.path, target.state ? { state: target.state } : undefined);

      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
    },
    [navigate, searchQuery],
  );

  const performSearch = useCallback(
    (query) => {
      if (!query.trim()) return;
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchQuery("");
      setShowSuggestions(false);
    },
    [navigate],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!showSuggestions) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          event.preventDefault();
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            handleSelectSuggestion(suggestions[activeIndex]);
          } else if (searchQuery.trim()) {
            performSearch(searchQuery.trim());
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setActiveIndex(-1);
          break;
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

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      performSearch(searchQuery);
    },
    [performSearch, searchQuery],
  );

  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value);
    if (event.target.value.trim()) {
      setShowSuggestions(true);
    }
  }, []);

  const toggleUserMenu = useCallback(() => {
    setShowNotifications(false);
    setShowUserMenu((prev) => !prev);
  }, []);

  const toggleNotifications = useCallback(() => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);

    if (nextOpen) {
      setShowUserMenu(false);
      setShowSuggestions(false);
      if (shouldRefreshNotifications) {
        loadNotifications();
      }
    }
  }, [
    loadNotifications,
    shouldRefreshNotifications,
    showNotifications,
  ]);

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

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1720px] items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex w-full items-center gap-3 lg:gap-4">
          <div className="admin-nav-left flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {isMobile ? (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label={
                  sidebarOpen ? "Close navigation menu" : "Open navigation menu"
                }
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? (
                  <FaTimes className="text-base" />
                ) : (
                  <FaBars className="text-base" />
                )}
              </button>
            ) : null}

            <div
              className="header-search relative min-w-0 flex-1"
              ref={searchContainerRef}
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, brands..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim() && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="search-input h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-none focus:border-sky-300 focus:outline-none focus:ring-0"
                />

                {showSuggestions ? (
                  <div className="absolute left-0 right-0 z-50 mt-3 max-h-[32rem] overflow-y-auto rounded-md border border-slate-200 bg-white">
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
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right leading-tight xl:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Login
              </p>
              <p className="text-xs font-medium text-slate-600">
                {loginTimeLabel}
              </p>
            </div>

            <div className="relative flex-shrink-0" ref={notificationRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative flex h-10 w-10 items-center justify-center bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <FaBell className="text-sm" />
                {notificationCountLabel ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {notificationCountLabel}
                  </span>
                ) : null}
              </button>

              {showNotifications ? (
                <NotificationPanel
                  summary={notificationSummary}
                  loading={notificationsLoading}
                  error={notificationError}
                  lastUpdatedAt={notificationsLoadedAt}
                  onRefresh={loadNotifications}
                  onSelect={handleReminderSelect}
                />
              ) : null}
            </div>

            <div className="relative flex-shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={toggleUserMenu}
                className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 transition hover:bg-slate-50 sm:gap-3 sm:px-3 sm:py-2"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white">
                  <FaUser className="text-xs sm:text-sm" />
                </div>
                <div className="hidden min-w-0 lg:block">
                  <p className="max-w-[140px] truncate text-xs font-semibold text-slate-900 sm:text-sm">
                    {email || "User"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {role || "Admin"}
                  </p>
                </div>
                <FaChevronDown className="hidden text-xs text-slate-400 sm:block" />
              </button>

              <UserMenu
                email={email}
                role={role}
                userName={userName}
                loginTimeLabel={loginTimeLabel}
                isOpen={showUserMenu}
                onClose={() => setShowUserMenu(false)}
                onNavigate={navigate}
                onLogout={onLogout}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
