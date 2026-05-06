/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      xs: "320px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    colors: {
      // Primary - Purple
      purple: {
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
      // Secondary - Blue
      blue: {
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
      // Neutral - Gray
      gray: {
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
      green: {
        50: "#f0fdf4",
        100: "#dcfce7",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
      },
      red: {
        50: "#fef2f2",
        100: "#fee2e2",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
      },
      amber: {
        50: "#fffbeb",
        100: "#fef3c7",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
      },
      cyan: {
        50: "#ecf0ff",
        100: "#cffafe",
        500: "#06b6d4",
        600: "#0891b2",
        700: "#0e7490",
      },
      white: "#ffffff",
      black: "#000000",
      transparent: "transparent",
    },
    spacing: {
      0: "0px",
      1: "0.25rem",
      2: "0.5rem",
      3: "0.75rem",
      4: "1rem",
      5: "1.25rem",
      6: "1.5rem",
      7: "1.75rem",
      8: "2rem",
      9: "2.25rem",
      10: "2.5rem",
      12: "3rem",
      14: "3.5rem",
      16: "4rem",
      20: "5rem",
      24: "6rem",
      28: "7rem",
      32: "8rem",
      36: "9rem",
      40: "10rem",
      44: "11rem",
      48: "12rem",
      52: "13rem",
      56: "14rem",
      60: "15rem",
      64: "16rem",
      72: "18rem",
      80: "20rem",
      96: "24rem",
    },
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      heading: ["Satoshi", "Inter", "sans-serif"],
      mono: ["'Fira Code'", "monospace"],
    },
    fontSize: {
      xs: ["0.75rem", "1rem"], // 12px
      sm: ["0.875rem", "1.25rem"], // 14px
      base: ["1rem", "1.5rem"], // 16px
      lg: ["1.125rem", "1.75rem"], // 18px
      xl: ["1.25rem", "1.75rem"], // 20px
      "2xl": ["1.5rem", "2rem"], // 24px
      "3xl": ["1.875rem", "2.25rem"], // 30px
      "4xl": ["2.25rem", "2.5rem"], // 36px
      "5xl": ["3rem", "1"], // 48px
      "6xl": ["3.75rem", "1"], // 60px
      "7xl": ["4.5rem", "1"], // 72px
    },
    fontWeight: {
      thin: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },
    borderRadius: {
      none: "0px",
      xs: "0.25rem",
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      "2xl": "1.5rem",
      "3xl": "2rem",
      full: "9999px",
    },
    boxShadow: {
      none: "none",
      xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
    },
    opacity: {
      0: "0",
      5: "0.05",
      10: "0.1",
      20: "0.2",
      25: "0.25",
      30: "0.3",
      40: "0.4",
      50: "0.5",
      60: "0.6",
      70: "0.7",
      75: "0.75",
      80: "0.8",
      90: "0.9",
      95: "0.95",
      100: "1",
    },
    extend: {
      animation: {
        "fade-up": "fadeUp 0.8s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-in": "slideIn 0.3s ease-out forwards",
        "slide-in-left": "slideInLeft 0.3s ease-out forwards",
        "pulse-soft": "pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounceSlow 3s infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".8" },
        },
        bounceSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      maxWidth: {
        container: "1440px",
      },
      transitionDuration: {
        150: "150ms",
        250: "250ms",
        350: "350ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
};
