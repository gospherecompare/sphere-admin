// Central API config — update this single value when backend URL changes.
const API_BASE = "https://api.apisphere.in";

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
  // lazy require to avoid adding cookie dependency here
  try {
    // eslint-disable-next-line global-require
    const Cookies = require("js-cookie");
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
