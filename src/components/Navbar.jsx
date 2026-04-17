// components/Navbar.jsx
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
} from "react-icons/fa";

// Constants and utilities

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
            {suggestion.type === "product" && (
              <div className="mt-1 flex items-center gap-2">
                {suggestion.brand_name && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                    {suggestion.brand_name}
                  </span>
                )}
                <span className="text-xs capitalize text-slate-500">
                  {suggestion.product_type}
                </span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <span
              className={`text-xs px-2 py-1 rounded-full font-semibold ${
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
    <>
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
    </>
  );
};

// Mobile-specific search UI removed — desktop search is used universally

// Helper function
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

const Navbar = ({
  isMobile,
  sidebarCollapsed,
  sidebarOpen,
  onToggleSidebar,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs
  const searchTimer = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Data - Get user info from cookies
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
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
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

  // Close menus when route changes
  useEffect(() => {
    setShowUserMenu(false);
    setShowSuggestions(false);
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showUserMenu &&
        !event.target.closest(".user-menu") &&
        !event.target.closest(".user-btn")
      ) {
        setShowUserMenu(false);
      }
      if (
        showSuggestions &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target) &&
        !event.target.closest(".search-input")
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu, showSuggestions]);

  // (mobile search removed)

  // Search API call with debouncing
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!searchQuery || searchQuery.trim().length < 1) {
      setSuggestions([]);
      setActiveIndex(-1);
      setSuggestionsLoading(false);
      setShowSuggestions(false);
      return;
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

        if (!res.ok)
          throw new Error(`Search failed with status: ${res.status}`);

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

  // Event handlers
  const handleKeyDown = useCallback(
    (e) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
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
    [showSuggestions, suggestions, activeIndex, searchQuery],
  );

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

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      performSearch(searchQuery);
    },
    [searchQuery, performSearch],
  );

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setShowSuggestions(true);
    }
  }, []);

  // mobile search toggle removed

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  // Render
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto flex w-full max-w-[1720px] items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex w-full items-center gap-3 lg:gap-4">
          {/* Left Section */}
          <div className="admin-nav-left flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {/* Global Search */}
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

                {/* Search Suggestions */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 z-50 mt-3 max-h-[32rem] overflow-y-auto scrollbar-hide rounded-md border border-slate-200 bg-white">
                    <SearchSuggestions
                      suggestions={suggestions}
                      loading={suggestionsLoading}
                      activeIndex={activeIndex}
                      searchQuery={searchQuery}
                      onSelect={handleSelectSuggestion}
                      onViewAll={() => performSearch(searchQuery)}
                    />
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden xl:block text-right leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Login
              </p>
              <p className="text-xs font-medium text-slate-600">
                {loginTimeLabel}
              </p>
            </div>

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center  bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              aria-label="Notifications"
            >
              <FaBell className="text-sm" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            {/* Profile Section */}
            <div className="relative user-btn flex-shrink-0">
              <button
                type="button"
                onClick={toggleUserMenu}
                className="flex items-center gap-2 rounded-md  bg-white px-2 py-1.5 transition hover:border-slate-300 hover:bg-slate-50 sm:gap-3 sm:px-3 sm:py-2"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white">
                  <FaUser className="text-xs sm:text-sm" />
                </div>

                {/* User info - hidden on small screens */}
                <div className="hidden min-w-0 lg:block">
                  <p className="max-w-[140px] truncate text-xs sm:text-sm font-semibold text-slate-900">
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
