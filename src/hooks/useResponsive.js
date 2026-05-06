/**
 * Mobile Responsive Utilities & Hooks
 * Comprehensive responsive design helpers and React hooks
 */

import { useState, useEffect } from "react";

/* ===================== RESPONSIVE BREAKPOINTS ===================== */
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/* ===================== PRIMARY RESPONSIVE HOOK ===================== */
/**
 * Custom hook for responsive design management
 * Detects mobile/tablet/desktop breakpoints and provides responsive state
 */
export const useResponsive = (mobileBreakpoint = 1024) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [screenSize, setScreenSize] = useState("xs");

  useEffect(() => {
    // Initialize after hydration
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < mobileBreakpoint);
      setIsTablet(width >= mobileBreakpoint && width < 1536);
      setIsLoaded(true);

      // Set screen size
      if (width < 640) setScreenSize("xs");
      else if (width < 768) setScreenSize("sm");
      else if (width < 1024) setScreenSize("md");
      else if (width < 1280) setScreenSize("lg");
      else if (width < 1536) setScreenSize("xl");
      else setScreenSize("2xl");
    };

    // Initial check
    checkBreakpoints();

    // Add resize listener
    const handleResize = () => checkBreakpoints();
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileBreakpoint]);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    windowWidth,
    isLoaded,
    screenSize,
  };
};

/* ===================== RESPONSIVE VALUE HOOK ===================== */
/**
 * Hook for responsive values based on screen size
 */
export const useResponsiveValue = (values) => {
  const [screenSize, setScreenSize] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setScreenSize("xs");
      else if (window.innerWidth < 768) setScreenSize("sm");
      else if (window.innerWidth < 1024) setScreenSize("md");
      else if (window.innerWidth < 1280) setScreenSize("lg");
      else setScreenSize("xl");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return values[screenSize] || values.xs;
};

/* ===================== DEVICE-SPECIFIC HOOKS ===================== */

/**
 * Hook for detecting if mobile
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

/**
 * Hook for detecting if tablet
 */
export const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isTablet;
};

/**
 * Hook for detecting if desktop
 */
export const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isDesktop;
};

/**
 * Hook for detecting touch device
 */
export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
          "ontouchstart" in window,
      );
    };

    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  return isTouch;
};

/**
 * Hook for viewport dimensions
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewport;
};

/* ===================== UTILITY FUNCTIONS ===================== */

/**
 * Get responsive padding based on screen size
 */
export const getResponsivePadding = (screenSize) => {
  const paddingMap = {
    xs: "1rem",
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
  };
  return paddingMap[screenSize] || paddingMap.xs;
};

/**
 * Get responsive font size
 */
export const getResponsiveFontSize = (size, screenSize) => {
  const fontSizes = {
    xs: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "0.875rem",
      lg: "1rem",
      xl: "1rem",
    },
    sm: {
      xs: "0.875rem",
      sm: "1rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
    },
    base: {
      xs: "1rem",
      sm: "1.125rem",
      md: "1.25rem",
      lg: "1.25rem",
      xl: "1.5rem",
    },
    lg: {
      xs: "1.125rem",
      sm: "1.25rem",
      md: "1.5rem",
      lg: "1.875rem",
      xl: "2.25rem",
    },
    xl: {
      xs: "1.25rem",
      sm: "1.5rem",
      md: "1.875rem",
      lg: "2.25rem",
      xl: "3rem",
    },
  };
  return fontSizes[size]?.[screenSize] || fontSizes.base.xs;
};

/**
 * Get responsive grid columns
 */
export const getResponsiveGridCols = (screenSize) => {
  const colsMap = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  };
  return colsMap[screenSize] || 1;
};

/**
 * Get touch-friendly size (minimum 44px)
 */
export const getTouchFriendlySize = (size = "default") => {
  const sizes = {
    small: "32px",
    default: "44px",
    large: "56px",
  };
  return sizes[size] || sizes.default;
};

/**
 * Get screen size name
 */
export const getScreenSize = (width = window.innerWidth) => {
  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  if (width < 1536) return "xl";
  return "2xl";
};

/* ===================== ADVANCED HOOKS ===================== */

/**
 * Debounce hook
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Media query hook
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

/**
 * Safe area insets hook
 */
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setInsets({
        top:
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--safe-area-inset-top",
            ),
          ) || 0,
        bottom:
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--safe-area-inset-bottom",
            ),
          ) || 0,
        left:
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--safe-area-inset-left",
            ),
          ) || 0,
        right:
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--safe-area-inset-right",
            ),
          ) || 0,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return insets;
};

/* ===================== TOUCH UTILITIES ===================== */

/**
 * Get touch event info
 */
export const getTouchInfo = (event) => {
  const touch = event.touches[0] || event.changedTouches[0];
  return {
    x: touch.clientX,
    y: touch.clientY,
    pageX: touch.pageX,
    pageY: touch.pageY,
  };
};

/**
 * Detect swipe direction
 */
export const detectSwipeDirection = (startX, startY, endX, endY) => {
  const diffX = endX - startX;
  const diffY = endY - startY;
  const distance = Math.sqrt(diffX * diffX + diffY * diffY);

  if (distance < 50) return null;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    return diffX > 0 ? "right" : "left";
  } else {
    return diffY > 0 ? "down" : "up";
  }
};

export default useResponsive;
