/**
 * JWT Token Utility Functions
 * Handles token parsing, validation, and expiry management
 */

/**
 * Parses JWT token payload
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
export const parseTokenPayload = (token) => {
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
  } catch (err) {
    console.warn("Token parsing error:", err);
    return null;
  }
};

/**
 * Gets token expiry time in milliseconds
 * @param {string} token - JWT token
 * @returns {number|null} Expiry timestamp in ms or null if invalid
 */
export const getTokenExpiryMs = (token) => {
  const payload = parseTokenPayload(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000;
};

/**
 * Checks if token is still valid
 * @param {string} token - JWT token
 * @returns {boolean} True if token is valid and not expired
 */
export const isTokenValid = (token) => {
  const expMs = getTokenExpiryMs(token);
  if (!expMs) return false;
  return expMs > Date.now();
};

/**
 * Gets time remaining until token expiry in ms
 * @param {string} token - JWT token
 * @returns {number|null} Milliseconds until expiry or null if invalid
 */
export const getTimeUntilExpiry = (token) => {
  const expMs = getTokenExpiryMs(token);
  if (!expMs) return null;
  const timeLeft = expMs - Date.now();
  return timeLeft > 0 ? timeLeft : 0;
};

export default {
  parseTokenPayload,
  getTokenExpiryMs,
  isTokenValid,
  getTimeUntilExpiry,
};
