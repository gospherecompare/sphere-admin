import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { parseTokenPayload, getTokenExpiryMs } from "../utils/tokenUtils";

const AUTH_NOTICE_STORAGE_KEY = "hooksAdminAuthNotice";
const POST_LOGIN_REDIRECT_KEY = "hooksAdminPostLoginRedirect";
const SESSION_TIMEOUT_NOTICE = "Session timed out. Please log in again.";

/**
 * Custom hook for managing authentication state and session management
 * Handles token validation, expiry detection, and secure logout
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = Cookies.get("authToken");
    return token ? getTokenExpiryMs(token) > Date.now() : false;
  });

  const [authReason, setAuthReason] = useState("");

  /**
   * Stores post-login redirect path in session storage
   */
  const storePostLoginRedirect = useCallback(() => {
    if (typeof window === "undefined") return;
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!currentPath || currentPath.startsWith("/login")) return;
    try {
      window.sessionStorage.setItem(
        POST_LOGIN_REDIRECT_KEY,
        JSON.stringify({ path: currentPath, savedAt: Date.now() }),
      );
    } catch (error) {
      console.warn("Failed to store redirect path:", error);
    }
  }, []);

  /**
   * Stores authentication notice in session storage
   */
  const storeAuthNotice = useCallback((message) => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, message);
    } catch (error) {
      console.warn("Failed to store auth notice:", error);
    }
  }, []);

  /**
   * Clears authentication cookies and state
   * @param {string} reason - Reason for logout (logout, session_expired, etc.)
   */
  const clearAuth = useCallback(
    (reason = "logout") => {
      if (reason === "session_expired") {
        storeAuthNotice(SESSION_TIMEOUT_NOTICE);
      }
      storePostLoginRedirect();
      setAuthReason(reason);

      // Clear all auth-related cookies
      ["authToken", "user", "username", "role", "loginAt"].forEach((key) =>
        Cookies.remove(key),
      );

      setIsAuthenticated(false);
    },
    [storeAuthNotice, storePostLoginRedirect],
  );

  /**
   * Handles successful login
   */
  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    setAuthReason("");
  }, []);

  /**
   * Check initial token validity on mount
   */
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token && getTokenExpiryMs(token) <= Date.now()) {
      clearAuth("session_expired");
    }
  }, [clearAuth]);

  /**
   * Setup session timeout and periodic token validation
   */
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const token = Cookies.get("authToken");
    const expMs = getTokenExpiryMs(token);
    const now = Date.now();

    if (!token || !expMs || expMs <= now) {
      clearAuth("session_expired");
      return undefined;
    }

    // Set timeout for exact expiry time
    const timeoutId = setTimeout(() => {
      clearAuth("session_expired");
    }, expMs - now);

    // Periodic validation every 10 seconds
    const intervalId = setInterval(() => {
      const currentToken = Cookies.get("authToken");
      if (!currentToken || getTokenExpiryMs(currentToken) <= Date.now()) {
        clearAuth("session_expired");
      }
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isAuthenticated, clearAuth]);

  return {
    isAuthenticated,
    authReason,
    clearAuth,
    handleLogin,
    storePostLoginRedirect,
    storeAuthNotice,
  };
};

export default useAuth;
