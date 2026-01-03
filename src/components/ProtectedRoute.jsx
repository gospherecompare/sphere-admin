import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

function parseJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload.replace(/=+$/, ""));
    return JSON.parse(
      decodeURIComponent(
        decoded
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      )
    );
  } catch (err) {
    return null;
  }
}

/**
 * ProtectedRoute — checks for a JWT `authToken` cookie and validates its `exp` claim.
 * If missing or expired it removes the cookie and redirects to `/login`.
 */
const ProtectedRoute = ({ children }) => {
  const token = Cookies.get("authToken");
  if (!token) return <Navigate to="/login" replace />;

  const payload = parseJwt(token);
  if (!payload || !payload.exp) {
    // invalid token format — remove and redirect
    Cookies.remove("authToken");
    Cookies.remove("user");
    return <Navigate to="/login" replace />;
  }

  // exp is in seconds since epoch per JWT spec
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowSec) {
    // token expired — remove and redirect to login
    Cookies.remove("authToken");
    Cookies.remove("user");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
