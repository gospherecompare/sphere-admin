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
import { buildUrl } from "../api";
import {
  FaSearch,
  FaBell,
  FaComment,
  FaBars,
  FaUser,
  FaSignOutAlt,
  FaTimes,
  FaHome,
  FaPlus,
  FaList,
  FaTags,
  FaMobileAlt,
  FaBox,
  FaSpinner,
  FaBuilding,
  FaImage,
} from "react-icons/fa";

// Constants and utilities

const SearchSuggestions = ({
  suggestions,
  loading,
  activeIndex,
  searchQuery,
  onSelect,
  onViewAll,
  isMobile,
}) => {
  if (loading) {
    return (
      <div className="p-4 text-center">
        <FaSpinner className="animate-spin mx-auto text-gray-400" />
        <p className="text-sm text-gray-500 mt-2">Searching...</p>
      </div>
    );
  }

  if (suggestions.length === 0 && searchQuery.trim()) {
    return (
      <div className="p-4 text-center">
        <FaSearch className="mx-auto text-gray-400 text-lg" />
        <p className="text-sm text-gray-500 mt-2">
          No results found for "{searchQuery}"
        </p>
        <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <>
      <div className="p-2 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Search Results
        </p>
      </div>
      {suggestions.map((suggestion, idx) => (
        <button
          key={`${suggestion.type}-${suggestion.id}-${idx}`}
          onClick={() => onSelect(suggestion)}
          onMouseEnter={() => {}}
          className={`w-full text-left p-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
            idx === activeIndex ? "bg-blue-50 border-l-4 border-blue-500" : ""
          }`}
        >
          <div className="flex-shrink-0">
            {suggestion.type === "product" && suggestion.image_url ? (
              <img
                src={suggestion.image_url}
                alt={suggestion.name}
                className="w-10 h-10 rounded-md object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = getIconForType(
                    suggestion.type,
                  );
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                {getIconForType(suggestion.type)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {suggestion.name}
            </p>
            {suggestion.type === "product" && (
              <div className="flex items-center space-x-2 mt-1">
                {suggestion.brand_name && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {suggestion.brand_name}
                  </span>
                )}
                <span className="text-xs text-gray-500 capitalize">
                  {suggestion.product_type}
                </span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                suggestion.type === "product"
                  ? "bg-green-100 text-green-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {suggestion.type === "product" ? "Product" : "Brand"}
            </span>
          </div>
        </button>
      ))}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onViewAll}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
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
  userId,
  isOpen,
  onClose,
  onNavigate,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg  z-40`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
              <FaUser className="text-base" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {userName || email || "User"}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {email || "admin"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {role || "Admin"}
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
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1"
          >
            <FaHome className="mr-3 text-gray-500" />
            Dashboard
          </button>
          <button
            onClick={() => {
              onNavigate("/profile");
              onClose();
            }}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1"
          >
            <FaUser className="mr-3 text-gray-500" />
            My Profile
          </button>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
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

const Navbar = ({ onToggleSidebar, sidebarCollapsed, onLogout }) => {
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
  const userId = Cookies.get("userId");
  const userName = Cookies.get("userName") || "";

  // Get complete user object if available
  const getUserData = () => {
    try {
      const userData = Cookies.get("userData");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const userData = getUserData();

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
        const res = await fetch(
          buildUrl(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`),
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
      if (suggestion.type === "product") {
        navigate(`/product/${encodeURIComponent(suggestion.name)}`);
      } else if (suggestion.type === "brand") {
        navigate(`/brand/${encodeURIComponent(suggestion.name)}`);
      }

      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
    },
    [navigate],
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

  const handleLogoClick = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  // Render
  return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>

      <nav className="bg-white shadow-sm px-3 sm:px-4 md:px-6 py-3 sm:py-4 relative z-50">
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Hamburger Menu Button */}
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors duration-200 flex-shrink-0 lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? (
                <FaBars className="text-lg sm:text-xl" />
              ) : (
                <FaTimes className="text-lg sm:text-xl" />
              )}
            </button>

            {/* Mobile-only compact logo */}
            <div className="md:hidden flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3">
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
            </div>

            {/* Desktop Search */}
            <div
              className="hidden md:block ml-auto mr-2 lg:mr-4"
              ref={searchContainerRef}
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400 text-sm" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim() && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent w-48 sm:w-56 md:w-48 lg:w-56 xl:w-72 search-input"
                />

                {/* Search Suggestions */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto w-48 sm:w-56 md:w-48 lg:w-56 xl:w-72">
                    <SearchSuggestions
                      suggestions={suggestions}
                      loading={suggestionsLoading}
                      activeIndex={activeIndex}
                      searchQuery={searchQuery}
                      onSelect={handleSelectSuggestion}
                      onViewAll={() => performSearch(searchQuery)}
                      isMobile={false}
                    />
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* Profile Section */}
            <div className="relative user-btn flex-shrink-0">
              <div
                className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 cursor-pointer user-btn transition-colors"
                onClick={toggleUserMenu}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <FaUser className="text-xs sm:text-sm" />
                </div>

                {/* User info - hidden on small screens */}
                <div className="hidden lg:block min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                    {email || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {role || "Admin"}
                  </p>
                </div>
              </div>

              <UserMenu
                email={email}
                role={role}
                userName={userName}
                userId={userId}
                isOpen={showUserMenu}
                onClose={() => setShowUserMenu(false)}
                onNavigate={navigate}
                onLogout={onLogout}
              />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
