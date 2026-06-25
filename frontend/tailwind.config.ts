import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card:        { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        muted:       { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent:      { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success:     { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning:     { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        /* ── CamCart brand ── */
        brand: {
          blue:           "#0D47A1",
          "blue-hover":   "#1565C0",
          orange:         "#FF6B00",
          "orange-hover": "#FF8C42",
        },
        orange: {
          DEFAULT:   "hsl(var(--orange))",
          foreground:"hsl(var(--orange-foreground))",
          50:  "#FFF3E0",
          100: "#FFE0B2",
          200: "#FFCC80",
          300: "#FFB74D",
          400: "#FFA726",
          500: "#FF6B00",
          600: "#F57C00",
          700: "#E65100",
        },
      },
      borderRadius: {
        "4xl": "2rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans:  ["'Noto Sans Khmer'", "'Inter'", "sans-serif"],
        inter: ["'Inter'", "sans-serif"],
        khmer: ["'Noto Sans Khmer'", "sans-serif"],
      },
      boxShadow: {
        brand:       "0 4px 24px rgba(13,71,161,0.18)",
        orange:      "0 4px 24px rgba(255,107,0,0.25)",
        card:        "0 2px 12px rgba(0,0,0,0.07)",
        "card-hover":"0 8px 32px rgba(0,0,0,0.12)",
        nav:         "0 2px 16px rgba(0,0,0,0.08)",
      },
      backgroundImage: {
        "gradient-brand":  "linear-gradient(135deg, #0D47A1, #1565C0)",
        "gradient-orange": "linear-gradient(135deg, #FF6B00, #FF8C42)",
        "gradient-hero":   "linear-gradient(145deg, #0D47A1 0%, #1565C0 50%, #0a3a8a 100%)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
