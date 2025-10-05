import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Backgrounds & text
        background: "#FDFBF7",
        foreground: "#0F172A",

        // Surface cards & popovers
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        popover: {
          DEFAULT: "#FFFDF8",
          foreground: "#0F172A",
        },

        // Primary (buttons, main accents)
        primary: {
          DEFAULT: "#E05B4B",
          foreground: "#FFFFFF",
        },

        // Secondary (progress ring, secondary accents)
        secondary: {
          DEFAULT: "#89A9A1",
          foreground: "#0F172A",
        },

        // Destructive (danger states)
        destructive: {
          DEFAULT: "#D9534F",
          foreground: "#FFFFFF",
        },

        // Muted / subtle backgrounds
        muted: {
          DEFAULT: "#F6F3F1",
          foreground: "#6B6B6B",
        },

        // Accent (light tinted backgrounds used in charts/tiles)
        accent: {
          DEFAULT: "#EBF6F4",
          foreground: "#0F172A",
        },

        // Form / layout tokens
        border: "#E9E5E0",
        input: "#F8F6F4",
        ring: "#CDE6E0",

        // Small chart palette
        chart: {
          "1": "#89A9A1",
          "2": "#E05B4B",
          "3": "#F5C6BB",
          "4": "#A9C1BA",
          "5": "#D9EDE9",
        },

        // Sidebar / navigation specific tokens
        sidebar: {
          DEFAULT: "#F7F5F3",
          foreground: "#0F172A",
          primary: "#E05B4B",
          "primary-foreground": "#FFFFFF",
          accent: "#89A9A1",
          "accent-foreground": "#0F172A",
          border: "#E6E2DD",
          ring: "#CDE6E0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        chinese: ['NSimSun', 'Noto Serif SC', 'serif'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;