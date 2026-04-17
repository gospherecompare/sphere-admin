/**
 * Application-wide constants and configuration
 */

// Authentication Constants
export const AUTH_CONFIG = {
  STORAGE_KEY_NOTICE: "hooksAdminAuthNotice",
  STORAGE_KEY_REDIRECT: "hooksAdminPostLoginRedirect",
  SESSION_TIMEOUT_MESSAGE: "Session timed out. Please log in again.",
  TOKEN_CHECK_INTERVAL: 10000, // 10 seconds
};

// UI Breakpoints
export const BREAKPOINTS = {
  MOBILE: 640, // sm
  TABLET: 1024, // lg
  DESKTOP: 1536, // 2xl
};

// Feature Flags
export const FEATURES = {
  ENABLE_ADVANCED_SEARCH: true,
  ENABLE_BATCH_OPERATIONS: true,
  ENABLE_EXPORT_FUNCTIONALITY: true,
  ENABLE_IMPORT_FUNCTIONALITY: true,
};

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// Notification Settings
export const NOTIFICATIONS = {
  TOAST_DURATION: 5000, // 5 seconds
  DISMISSIBLE: true,
};

// Date Format
export const DATE_FORMAT = "YYYY-MM-DD";
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

// Cache Configuration
export const CACHE_CONFIG = {
  ENABLED: true,
  DEFAULT_TTL: 3600000, // 1 hour in milliseconds
  MAX_SIZE: 100, // Maximum number of items in cache
};

// Logging Levels
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

// Product Categories
export const PRODUCT_TYPES = {
  SMARTPHONE: "smartphone",
  LAPTOP: "laptop",
  TV: "tv",
  APPLIANCE: "appliance",
};

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
  USER: "user",
};

// Permission Types
export const PERMISSIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  PUBLISH: "publish",
  APPROVE: "approve",
};

// Validation Patterns
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+?\d{1,3}[-.\s]?)?\d{10,}$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

// Status Enums
export const STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  PUBLISHED: "published",
  DRAFT: "draft",
  ARCHIVED: "archived",
  REJECTED: "rejected",
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
};

export default {
  AUTH_CONFIG,
  BREAKPOINTS,
  FEATURES,
  API_CONFIG,
  PAGINATION,
  NOTIFICATIONS,
  DATE_FORMAT,
  DATETIME_FORMAT,
  CACHE_CONFIG,
  LOG_LEVELS,
  PRODUCT_TYPES,
  USER_ROLES,
  PERMISSIONS,
  VALIDATION,
  STATUS,
  HTTP_METHODS,
};
