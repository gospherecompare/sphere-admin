/**
 * Responsive Utilities - CSS and Tailwind helper classes
 * Comprehensive responsive design utilities
 */

/**
 * Responsive Display Classes
 * Usage: Apply these classes directly to elements
 */
export const RESPONSIVE_DISPLAY = {
  // Show only on mobile
  mobileOnly: "block sm:hidden",

  // Show only on tablet
  tabletOnly: "hidden sm:block md:hidden",

  // Show only on desktop
  desktopOnly: "hidden md:block",

  // Hide on mobile
  hideOnMobile: "hidden sm:block",

  // Hide on desktop
  hideOnDesktop: "sm:hidden",
};

/**
 * Responsive Padding
 */
export const RESPONSIVE_PADDING = {
  container: "px-4 sm:px-6 md:px-8 lg:px-10",
  section: "py-6 sm:py-8 md:py-10 lg:py-12",
  card: "p-4 sm:p-5 md:p-6",
};

/**
 * Responsive Grid Columns
 */
export const GRID_COLUMNS = {
  auto: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  flexible: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  sidebar: "grid-cols-1 md:grid-cols-4 gap-6",
  twoCol: "grid-cols-1 md:grid-cols-2",
};

/**
 * Responsive Text Sizes
 */
export const TEXT_SIZES = {
  xs: "text-xs sm:text-xs md:text-sm",
  sm: "text-sm sm:text-sm md:text-base",
  base: "text-base sm:text-base md:text-lg",
  lg: "text-lg sm:text-lg md:text-xl",
  xl: "text-xl sm:text-2xl md:text-3xl",
  "2xl": "text-2xl sm:text-3xl md:text-4xl",
};

/**
 * Responsive Width Utilities
 */
export const RESPONSIVE_WIDTH = {
  full: "w-full",
  container: "w-full max-w-7xl mx-auto",
  sidebar: "w-full md:w-64 lg:w-80",
  contentArea: "w-full md:w-3/4 lg:w-4/5",
};

/**
 * Common Responsive Patterns
 */
export const PATTERNS = {
  // Page header with title and action buttons
  pageHeader:
    "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",

  // Card grid
  cardGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",

  // Horizontal list
  horizontalList: "flex flex-col sm:flex-row gap-2 sm:gap-4",

  // Form layout
  formLayout: "space-y-4 md:space-y-6",

  // Two column form
  formTwoColumn: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",

  // Table responsive wrapper
  tableWrapper: "overflow-x-auto",
};

/**
 * Responsive Breakpoints Values (in pixels)
 */
export const BREAKPOINTS_PX = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Helper function to generate responsive class strings
 */
export const createResponsiveClass = (
  base,
  sm = "",
  md = "",
  lg = "",
  xl = "",
) => {
  return [
    base,
    sm && `sm:${sm}`,
    md && `md:${md}`,
    lg && `lg:${lg}`,
    xl && `xl:${xl}`,
  ]
    .filter(Boolean)
    .join(" ");
};

/**
 * Media Query Helper for JavaScript
 */
export const useMediaQuery = (breakpoint) => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const breakpointPx = BREAKPOINTS_PX[breakpoint] || 768;
    const media = window.matchMedia(`(min-width: ${breakpointPx}px)`);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => {
      setMatches(media.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [breakpoint, matches]);

  return matches;
};

/**
 * Container Query Utilities (for modern browsers)
 */
export const CONTAINER_QUERIES = {
  sm: "@container (min-width: 20rem)",
  md: "@container (min-width: 28rem)",
  lg: "@container (min-width: 32rem)",
  xl: "@container (min-width: 36rem)",
};

/**
 * Responsive Shadow Classes
 */
export const RESPONSIVE_SHADOW = {
  hover: "shadow-sm hover:shadow-md transition-shadow",
  card: "shadow-sm md:shadow-md",
  elevated: "shadow-md md:shadow-lg",
};

/**
 * Responsive Spacing Scale
 */
export const SPACING_SCALE = {
  xs: "space-y-1 md:space-y-2",
  sm: "space-y-2 md:space-y-3",
  md: "space-y-3 md:space-y-4",
  lg: "space-y-4 md:space-y-6",
  xl: "space-y-6 md:space-y-8",
};

/**
 * Responsive Border Utilities
 */
export const RESPONSIVE_BORDER = {
  card: "border border-gray-200 dark:border-gray-700",
  dividing: "border-t border-gray-200 dark:border-gray-700 my-4 md:my-6",
  input: "border border-gray-300 dark:border-gray-600 focus:border-purple-500",
};

/**
 * Responsive Opacity for Dark Mode
 */
export const DARK_MODE = {
  text: "text-gray-900 dark:text-white",
  textSecondary: "text-gray-600 dark:text-gray-300",
  bg: "bg-white dark:bg-gray-800",
  border: "border-gray-200 dark:border-gray-700",
  hover: "hover:bg-gray-100 dark:hover:bg-gray-700",
};

/**
 * Common Component Classes
 */
export const COMPONENT_CLASSES = {
  button: {
    primary:
      "bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors",
    danger:
      "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors",
    small: "py-1 px-3 text-sm",
    large: "py-3 px-6 text-lg",
  },
  card: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-4 md:p-6",
  input:
    "w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent",
  badge:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
};

export default {
  RESPONSIVE_DISPLAY,
  RESPONSIVE_PADDING,
  GRID_COLUMNS,
  TEXT_SIZES,
  RESPONSIVE_WIDTH,
  PATTERNS,
  BREAKPOINTS_PX,
  createResponsiveClass,
  RESPONSIVE_SHADOW,
  SPACING_SCALE,
  RESPONSIVE_BORDER,
  DARK_MODE,
  COMPONENT_CLASSES,
};
