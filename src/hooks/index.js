/**
 * Central export for all custom hooks
 * Simplifies importing hooks across the application
 */

export { default as useAuth } from "./useAuth";
export { default as useResponsive } from "./useResponsive";

// Import existing hooks if they exist, or they can be created later
// Example for future hooks:
// export { default as useFetch } from './useFetch';
// export { default as useLocalStorage } from './useLocalStorage';
// export { default as useDebounce } from './useDebounce';
// export { default as useTheme } from './useTheme';
