// components/Navbar.js
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  FaMobile,
  FaMobileAlt,
  FaBox,
  FaSpinner,
  FaImage,
  FaBuilding,
} from "react-icons/fa";
import Cookies from "js-cookie";

const Navbar = ({ onToggleSidebar, sidebarCollapsed, onLogout, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchTimer = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const email = Cookies.get("username");
  const role = Cookies.get("role");

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
    setShowSearch(false);
    setShowUserMenu(false);
    setShowSuggestions(false);
  }, [location.pathname]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMobileMenu &&
        !event.target.closest(".mobile-menu") &&
        !event.target.closest(".hamburger-btn")
      ) {
        setShowMobileMenu(false);
      }
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
  }, [showMobileMenu, showUserMenu, showSuggestions]);

  // Focus search input when search is opened on mobile
  useEffect(() => {
    if (showSearch && isMobile) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [showSearch, isMobile]);

  // Debounced fetch suggestions with enhanced error handling
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
          `http://localhost:5000/api/search?q=${encodeURIComponent(
            searchQuery.trim()
          )}`
        );

        if (!res.ok) {
          throw new Error(`Search failed with status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Search results:", data); // Debug log

        // Format the results properly
        const formattedResults = (data.results || data || []).map((item) => {
          if (item.type === "product") {
            return {
              type: "product",
              id: item.id,
              name: item.name,
              product_type: item.product_type,
              brand_name: item.brand_name,
              image_url: item.image_url || null,
            };
          } else {
            return {
              type: "brand",
              id: item.id,
              name: item.name,
            };
          }
        });

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

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          selectSuggestion(suggestions[activeIndex]);
        } else if (searchQuery.trim()) {
          performSearch(searchQuery.trim());
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setActiveIndex(-1);
        break;
    }
  };

  const selectSuggestion = (suggestion) => {
    if (suggestion.type === "product") {
      navigate(`/product/${suggestion.id}`);
    } else if (suggestion.type === "brand") {
      navigate(`/brand/${suggestion.id}`);
    }

    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    if (isMobile) setShowSearch(false);
  };

  const performSearch = (query) => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery("");
    setShowSuggestions(false);
    if (isMobile) setShowSearch(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
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

  const menuItems = [
    { path: "/dashboard", icon: <FaHome />, label: "Dashboard" },
    { path: "/create-mobile", icon: <FaPlus />, label: "Create Mobile" },
    { path: "/view-mobiles", icon: <FaList />, label: "View Mobiles" },
    { path: "/category", icon: <FaTags />, label: "Category" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4 relative z-50">
        <div className="flex items-center justify-between">
          {/* LEFT SECTION - Logo, Hamburger & Title */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Hamburger Menu Button */}
            <button
              onClick={() =>
                isMobile
                  ? setShowMobileMenu(!showMobileMenu)
                  : onToggleSidebar()
              }
              className={`p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors duration-200 hamburger-btn flex-shrink-0 ${
                isMobile ? "block" : "lg:hidden"
              }`}
              aria-label={showMobileMenu ? "Close menu" : "Open menu"}
            >
              {showMobileMenu ? (
                <FaTimes className="text-xl" />
              ) : (
                <FaBars className="text-xl" />
              )}
            </button>

            {/* Logo */}
            <div
              className="flex items-center space-x-2 md:space-x-3 cursor-pointer flex-shrink-0"
              onClick={() => navigate("/dashboard")}
            >
              <div className="relative">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center">
                  <FaMobileAlt className="text-white text-lg md:text-xl" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Logo Text */}
              <div className="hidden sm:block">
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Smart Arena
                  </span>
                </div>
                <p className="text-xs text-gray-500 hidden md:block">
                  Inventory Management
                </p>
              </div>

              {/* Mobile-only abbreviated logo */}
              <div className="sm:hidden">
                <div className="flex items-center">
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Smart
                  </span>
                  <span className="text-lg font-bold text-gray-800">Arena</span>
                </div>
              </div>
            </div>

            {/* Page Title removed per request */}

            {/* Desktop Search */}
            <div
              className="hidden md:block ml-auto mr-4"
              ref={searchContainerRef}
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search mobiles, models..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim() && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-full
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-transparent w-56 lg:w-64 xl:w-72 search-input"
                />

                {/* Search Suggestions */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                    {suggestionsLoading ? (
                      <div className="p-4 text-center">
                        <FaSpinner className="animate-spin mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">
                          Searching...
                        </p>
                      </div>
                    ) : suggestions.length > 0 ? (
                      <>
                        <div className="p-2 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Search Results
                          </p>
                        </div>
                        {suggestions.map((suggestion, idx) => (
                          <button
                            key={`${suggestion.type}-${suggestion.id}-${idx}`}
                            onClick={() => selectSuggestion(suggestion)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={`w-full text-left p-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                              idx === activeIndex
                                ? "bg-blue-50 border-l-4 border-blue-500"
                                : ""
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {suggestion.type === "product" &&
                              suggestion.image_url ? (
                                <img
                                  src={suggestion.image_url}
                                  alt={suggestion.name}
                                  className="w-10 h-10 rounded-md object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML =
                                      getIconForType(suggestion.type);
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
                                {suggestion.type === "product"
                                  ? "Product"
                                  : "Brand"}
                              </span>
                            </div>
                          </button>
                        ))}
                        <div className="p-3 border-t border-gray-100">
                          <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                          >
                            View all results for "{searchQuery}"
                          </button>
                        </div>
                      </>
                    ) : searchQuery.trim() && !suggestionsLoading ? (
                      <div className="p-4 text-center">
                        <FaSearch className="mx-auto text-gray-400 text-lg" />
                        <p className="text-sm text-gray-500 mt-2">
                          No results found for "{searchQuery}"
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try different keywords
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* RIGHT SECTION - Icons & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Mobile Search Button/Toggle */}
            {isMobile && (
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  setShowSuggestions(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 flex-shrink-0"
              >
                {showSearch ? (
                  <FaTimes className="text-lg" />
                ) : (
                  <FaSearch className="text-lg" />
                )}
              </button>
            )}

            {/* Profile Section */}
            <div className="relative user-btn flex-shrink-0">
              <div
                className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 cursor-pointer user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 
                            rounded-full flex items-center justify-center text-white flex-shrink-0"
                >
                  <FaUser className="text-sm" />
                </div>

                {/* User info - hidden on mobile */}
                <div className="hidden md:block min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                    {email || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {role || "Admin"}
                  </p>
                </div>

                {/* Mobile user icon only */}
                <div className="md:hidden">
                  <span className="text-xs font-semibold text-gray-700">
                    Admin
                  </span>
                </div>
              </div>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  {/* Overlay for mobile */}
                  {isMobile && (
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowUserMenu(false)}
                    />
                  )}

                  <div
                    className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-40 user-menu ${
                      isMobile
                        ? "fixed top-16 left-1/2 transform -translate-x-1/2 w-11/12 max-w-xs"
                        : ""
                    }`}
                  >
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 
                                    rounded-full flex items-center justify-center text-white"
                        >
                          <FaUser className="text-base" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {email || "User"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {role || "Admin"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate("/dashboard");
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1"
                      >
                        <FaHome className="mr-3 text-gray-500" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1"
                      >
                        <FaUser className="mr-3 text-gray-500" />
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <FaSignOutAlt className="mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobile && showSearch && (
          <div className="mt-3 animate-slideDown" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search mobiles, categories..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent search-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <FaTimes className="text-gray-400" />
                </button>
              </div>

              {/* Mobile Search Suggestions */}
              {showSuggestions && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {suggestionsLoading ? (
                    <div className="p-4 text-center">
                      <FaSpinner className="animate-spin mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">Searching...</p>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <>
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={`${suggestion.type}-${suggestion.id}-${idx}-m`}
                          onClick={() => selectSuggestion(suggestion)}
                          className={`w-full text-left p-3 hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0 ${
                            idx === activeIndex ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {getIconForType(suggestion.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.name}
                            </p>
                            {suggestion.type === "product" &&
                              suggestion.brand_name && (
                                <p className="text-xs text-gray-500 truncate">
                                  {suggestion.brand_name}
                                </p>
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
                              {suggestion.type === "product"
                                ? "Product"
                                : "Brand"}
                            </span>
                          </div>
                        </button>
                      ))}
                      <div className="p-3 border-t border-gray-100">
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                          View all results
                        </button>
                      </div>
                    </>
                  ) : searchQuery.trim() && !suggestionsLoading ? (
                    <div className="p-4 text-center">
                      <FaSearch className="mx-auto text-gray-400 text-lg" />
                      <p className="text-sm text-gray-500 mt-2">
                        No results found
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try different keywords
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </form>
          </div>
        )}
      </nav>

      {/* Mobile Sidebar Menu */}
      {showMobileMenu && (
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-40 mobile-menu transform transition-transform duration-300 ease-in-out lg:hidden">
          {/* Mobile Menu Header with Logo */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FaMobileAlt className="text-white text-xl" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Mobile
                  </span>
                  <span className="text-xl font-bold text-gray-800">ERP</span>
                </div>
                <p className="text-xs text-gray-500">Inventory Management</p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 
                          rounded-full flex items-center justify-center text-white"
              >
                <FaUser className="text-sm" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {email || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {role || "Admin"}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div
            className="p-2 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 160px)" }}
          >
            <div className="mb-4 px-3 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Navigation
              </h3>
            </div>

            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setShowMobileMenu(false);
                }}
                className={`flex items-center w-full p-3 rounded-lg mb-1 transition-colors ${
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border-l-4 border-blue-500"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span
                  className={`text-lg mr-3 ${
                    location.pathname === item.path
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
                {location.pathname === item.path && (
                  <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>
            ))}

            {/* Additional Mobile-only Items */}
            <div className="mt-6 mb-4 px-3 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Quick Actions
              </h3>
            </div>

            <button
              onClick={() => {
                navigate("/reports");
                setShowMobileMenu(false);
              }}
              className="flex items-center w-full p-3 rounded-lg mb-1 text-gray-700 hover:bg-gray-100"
            >
              <FaBox className="text-lg mr-3 text-gray-500" />
              <span className="font-medium">Reports</span>
            </button>

            <button
              onClick={() => {
                navigate("/settings");
                setShowMobileMenu(false);
              }}
              className="flex items-center w-full p-3 rounded-lg mb-1 text-gray-700 hover:bg-gray-100"
            >
              <FaTags className="text-lg mr-3 text-gray-500" />
              <span className="font-medium">Settings</span>
            </button>
          </div>

          {/* Mobile Menu Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Status:</span> Online
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <button
              onClick={() => {
                onLogout();
                setShowMobileMenu(false);
              }}
              className="flex items-center justify-center w-full p-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg transition-colors font-medium"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Add CSS for animation */}
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
    </>
  );
};

export default Navbar;
