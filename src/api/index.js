// Central API config — update this single value when backend URL changes.
const API_BASE = "https://api.apisphere.in";

// buildUrl('/path') -> 'http://localhost:5000/path'
const buildUrl = (path = "") => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

export { API_BASE, buildUrl };
export default { API_BASE, buildUrl };

// Usage guidance:
// - Import the base URL: import { API_BASE } from '../api'
// - Use buildUrl('/api/endpoint') to construct full URLs.
