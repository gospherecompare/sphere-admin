// Central API config — update this single value when backend URL changes.
import Cookies from "js-cookie";

const resolvedApiBase = (() => {
  const envBase =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE;
  if (envBase) return String(envBase);

  return "https://api.apisphere.in";
})();

const API_BASE = String(resolvedApiBase).replace(/\/$/, "");

// buildUrl('/path') -> 'https://api.apisphere.in/path'
const buildUrl = (path = "") => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

// Read auth token from localStorage first, fall back to cookie if present.
const getAuthToken = () => {
  try {
    const t = localStorage.getItem("authToken");
    if (t) return t;
  } catch (e) {
    // ignore localStorage errors
  }
  try {
    return Cookies.get("authToken");
  } catch (e) {
    return null;
  }
};

export { API_BASE, buildUrl, getAuthToken };
export default { API_BASE, buildUrl, getAuthToken };

// Usage guidance:
// - Use `buildUrl('/api/endpoint')` to construct full URLs.
// - Use `getAuthToken()` to read the current auth token (reads localStorage first).
