/**
 * ERP+SaaS Theme Configuration
 * Provides comprehensive design tokens for responsive enterprise applications
 */

export const colors = {
  // Primary colors - Modern purple/blue theme
  primary: {
    50: "#f3e8ff",
    100: "#e9d5ff",
    200: "#d8b4fe",
    300: "#c084fc",
    400: "#a855f7",
    500: "#9333ea",
    600: "#7e22ce",
    700: "#6b21a8",
    800: "#581c87",
    900: "#3f0f5c",
  },
  // Secondary colors - Bright blue
  secondary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  // Neutral colors - Gray scale
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  // Status colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#0ea5e9",
  // Semantic colors
  background: "#ffffff",
  surface: "#f9fafb",
  border: "#e5e7eb",
  text: {
    primary: "#111827",
    secondary: "#4b5563",
    muted: "#9ca3af",
    inverse: "#ffffff",
  },
};

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
};

export const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export const typography = {
  display: {
    fontSize: ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }], // 36px
    mobileSize: ["1.875rem", { lineHeight: "2.25rem" }], // 30px
  },
  heading1: {
    fontSize: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }], // 30px
    mobileSize: ["1.5rem", { lineHeight: "2rem" }], // 24px
  },
  heading2: {
    fontSize: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }], // 24px
    mobileSize: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
  },
  heading3: {
    fontSize: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }], // 20px
    mobileSize: ["1.125rem", { lineHeight: "1.5rem" }], // 18px
  },
  body: {
    fontSize: ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }], // 16px
    mobileSize: ["0.9375rem", { lineHeight: "1.5rem" }], // 15px
  },
  bodySmall: {
    fontSize: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }], // 14px
  },
  caption: {
    fontSize: ["0.75rem", { lineHeight: "1rem", fontWeight: "500" }], // 12px
  },
};

export const shadows = {
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
};

export const borderRadius = {
  none: "0",
  sm: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
};

export const transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 1, 1)",
  base: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "350ms cubic-bezier(0.4, 0, 0.2, 1)",
};

export const zIndex = {
  hide: "-1",
  base: "0",
  dropdown: "100",
  sticky: "110",
  fixed: "120",
  backdrop: "130",
  modal: "140",
  popover: "150",
  tooltip: "160",
  notification: "170",
};

export const themeVariants = {
  modern: {
    primary: colors.primary[600],
    secondary: colors.secondary[500],
    accent: "#ec4899",
  },
  traditional: {
    primary: colors.neutral[700],
    secondary: colors.secondary[400],
    accent: "#f59e0b",
  },
  corporate: {
    primary: colors.neutral[800],
    secondary: colors.secondary[400],
    accent: "#0ea5e9",
  },
};

export const responsive = {
  containerPadding: {
    xs: "1rem", // 16px on mobile
    sm: "1rem", // 16px on small
    md: "1.5rem", // 24px on medium
    lg: "2rem", // 32px on large
    xl: "3rem", // 48px on XL
  },
  sidebarWidth: {
    collapsed: "80px",
    expanded: "280px",
    mobile: "0px", // Hidden on mobile
  },
  headerHeight: {
    mobile: "64px",
    desktop: "72px",
  },
  gridCols: {
    mobile: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  },
};

export default {
  colors,
  spacing,
  breakpoints,
  typography,
  shadows,
  borderRadius,
  transitions,
  zIndex,
  themeVariants,
  responsive,
};
