/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B1120",
        foreground: "#F1F5F9",
        card: "#1E293B",
        "card-foreground": "#F1F5F9",
        popover: "#1E293B",
        "popover-foreground": "#F1F5F9",
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#334155",
          foreground: "#F1F5F9",
        },
        muted: {
          DEFAULT: "#1E293B",
          foreground: "#94A3B8",
        },
        accent: {
          DEFAULT: "#334155",
          foreground: "#F1F5F9",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        border: "#334155",
        input: "#334155",
        ring: "#3B82F6",
        sidebar: {
          DEFAULT: "#0B1120",
          foreground: "#F1F5F9",
          accent: "#1E293B",
          border: "#1E293B",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
