// Central API config — update this single value when backend URL changes.
import Cookies from "js-cookie";

const getLocalDevApiBase = () => {
  if (typeof window === "undefined") return null;

  const hostname = String(window.location.hostname || "").toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  ) {
    return "http://localhost:5000";
  }

  return null;
};

const resolvedApiBase = (() => {
  const envBase =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE;
  if (envBase) return String(envBase);

  const localDevBase = getLocalDevApiBase();
  if (localDevBase) return localDevBase;

  return "https://api.apisphere.in";
})();

const API_BASE = String(resolvedApiBase).replace(/\/$/, "");

// buildUrl('/path') -> 'https://api.apisphere.in/path'
const buildUrl = (path = "") => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

// Prefer the active session cookie, then fall back to localStorage.
const getAuthToken = () => {
  try {
    const cookieToken = Cookies.get("authToken");
    if (cookieToken) return cookieToken;
  } catch (e) {
    // ignore cookie errors
  }
  try {
    return localStorage.getItem("authToken");
  } catch (e) {
    return null;
  }
};

export { API_BASE, buildUrl, getAuthToken };
export default { API_BASE, buildUrl, getAuthToken };

// Usage guidance:
// - Use `buildUrl('/api/endpoint')` to construct full URLs.
// - Use `getAuthToken()` to read the current auth token (reads cookie first).
