import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
  ],
  corePlugins: {
    preflight: false,
  },
  darkMode: [
    "variant",
    [
      '[data-theme="dark"] &',
      '@media (prefers-color-scheme: dark) { [data-theme="system"] & }',
    ],
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "var(--max)",
        "2xl": "var(--max-wide)",
      },
    },
    extend: {
      colors: {
        // shadcn/ui standard token names (use these in new components).
        // CSS variable namespace stays untouched — these reference our existing tokens via :root.
        background: "var(--bg)",
        foreground: "var(--text)",
        card: { DEFAULT: "var(--card)", foreground: "var(--text)" },
        popover: { DEFAULT: "var(--card)", foreground: "var(--text)" },
        primary: { DEFAULT: "var(--accent)", foreground: "#ffffff" },
        secondary: { DEFAULT: "var(--bg-elev)", foreground: "var(--text)" },
        muted: { DEFAULT: "var(--bg-elev)", foreground: "var(--muted)" },
        accent: { DEFAULT: "var(--bg-elev)", foreground: "var(--text)" },
        destructive: { DEFAULT: "var(--red)", foreground: "#ffffff" },
        border: "var(--line)",
        input: "var(--line)",
        ring: "var(--accent)",

        // Project legacy aliases — keep so handwritten CSS using these names via Tailwind keeps working.
        bg: "var(--bg)",
        "bg-elev": "var(--bg-elev)",
        "bg-soft": "var(--bg-soft)",
        surface: "var(--surface)",
        line: "var(--line)",
        text: "var(--text)",
        link: "var(--link)",
        brand: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          2: "var(--accent-2)",
        },
        blue: { DEFAULT: "var(--blue)", bg: "var(--blue-bg)" },
        green: { DEFAULT: "var(--green)", bg: "var(--green-bg)" },
        red: { DEFAULT: "var(--red)", bg: "var(--red-bg)" },
        orange: { DEFAULT: "var(--orange)", bg: "var(--orange-bg)" },
        amber: { DEFAULT: "var(--amber)", bg: "var(--amber-bg)" },
        yellow: { DEFAULT: "var(--yellow)", bg: "var(--yellow-bg)" },
        purple: { DEFAULT: "var(--purple)", bg: "var(--purple-bg)" },
        pink: { DEFAULT: "var(--pink)", bg: "var(--pink-bg)" },
        teal: { DEFAULT: "var(--teal)", bg: "var(--teal-bg)" },
        indigo: { DEFAULT: "var(--indigo)", bg: "var(--indigo-bg)" },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        focus: "var(--focus)",
      },
      transitionDuration: {
        1: "var(--dur-1)",
        2: "var(--dur-2)",
        3: "var(--dur-3)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        inout: "var(--ease-inout)",
        spring: "var(--ease-spring)",
      },
      maxWidth: {
        site: "var(--max)",
        "site-wide": "var(--max-wide)",
      },
      backdropBlur: {
        glass: "20px",
      },
      backdropSaturate: {
        glass: "180%",
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
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [typography, animate],
};

export default config;
