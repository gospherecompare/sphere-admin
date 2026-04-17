import { useState, useEffect } from "react";

/**
 * Custom hook for responsive design management
 * Detects mobile/tablet/desktop breakpoints and provides responsive state
 * @param {number} mobileBreakpoint - Breakpoint width for mobile (default: 1024)
 * @returns {Object} Responsive state
 */
export const useResponsive = (mobileBreakpoint = 1024) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize after hydration
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < mobileBreakpoint);
      setIsTablet(width >= mobileBreakpoint && width < 1536);
      setIsLoaded(true);
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
  };
};

export default useResponsive;
