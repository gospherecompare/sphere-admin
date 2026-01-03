/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"], // body
        heading: ["Satoshi", "Inter", "sans-serif"], // headings
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease-out forwards",
        bubble: "bubbleFloat linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        bubbleFloat: {
          "0%": {
            transform: "translateY(100%) translateX(0) scale(0.5)",
            opacity: "0",
          },
          "10%": { opacity: "0.2" },
          "90%": { opacity: "0.1" },
          "100%": {
            transform:
              "translateY(-1000%) translateX(calc(var(--move-x, 0) * 100px)) scale(1.2)",
            opacity: "0",
          },
        },
      },
    },
  },
  plugins: [],
};
