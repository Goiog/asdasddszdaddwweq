import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontSize: {
        // name: [ 'clamp(min, preferred, max)', { lineHeight: 'unitless' } ]
        xs: ['clamp(0.75rem, 0.6vw, 0.8rem)', { lineHeight: '1.2' }],     // ~12px
        base: ['clamp(0.875rem, 0.9vw, 1rem)', { lineHeight: '1.25' }],   // ~14-16px
        lg: ['clamp(1rem, 1.1vw, 1.125rem)', { lineHeight: '1.22' }],     // ~16-18px
        xl: ['clamp(1.125rem, 1.3vw, 1.25rem)', { lineHeight: '1.2' }],   // ~18-20px
        '2xl': ['clamp(1.25rem, 1.6vw, 1.5rem)', { lineHeight: '1.18' }],
      },
      lineHeight: {
        snug: '1.15',
        relaxed: '1.35',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Backgrounds & text
        background: "#F8F9F7",
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
          DEFAULT: "#2E8B75",
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
          DEFAULT: "#F8F9F7",
          foreground: "#6B6B6B",
        },

        // Accent (light tinted backgrounds used in charts/tiles)
        accent: {
          DEFAULT: "#D6D9D2",
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
        Winchinese: ['Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', 'sans-serif'],
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