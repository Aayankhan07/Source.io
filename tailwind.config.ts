import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        // `sans` and `display` mirror the faces index.css already applies to body
        // and headings; declaring them here makes `font-sans`/`font-display` real
        // utilities instead of relying on bare CSS selectors.
        sans: ["Outfit", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Outfit", "Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        // Fira Code is loaded in index.html but was never mapped, so every
        // `font-mono` fell back to the browser default.
        mono: ["Fira Code", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        // Long-form reading face for generated study material. Literata carries an
        // optical-size axis, so it holds up from body copy to headings.
        reading: ["Literata", "Georgia", "ui-serif", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        surface: {
          sunken: "hsl(var(--surface-sunken))",
          raised: "hsl(var(--surface-raised))",
          elevated: "hsl(var(--surface-elevated))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        aurora: {
          bg: "#06080F",
          cyan: "#00F0FF",
          sky: "#06B6D4",
          violet: "#8B5CF6",
          indigo: "#6366F1",
          amber: "#F59E0B",
          emerald: "#10B981",
          rose: "#F43F5E",
        },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "aurora-gradient": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.18), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 10%, rgba(99, 102, 241, 0.14), transparent 60%)",
      },
      fontSize: {
        "fs-title": ["17px", { lineHeight: "24px" }],
        "fs-section": ["15px", { lineHeight: "22px" }],
        "fs-body": ["13px", { lineHeight: "20px" }],
        "fs-label": ["12px", { lineHeight: "18px" }],
        "fs-meta": ["11px", { lineHeight: "16px" }],
        "display-xs": ["24px", { lineHeight: "32px" }],
        "display-sm": ["30px", { lineHeight: "38px" }],
        "display-md": ["36px", { lineHeight: "44px" }],
        "display-lg": ["48px", { lineHeight: "60px" }],
        "display-xl": ["60px", { lineHeight: "72px" }],
        "display-2xl": ["72px", { lineHeight: "90px" }],
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        glow: "var(--shadow-glow)",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
        full: "9999px",
      },
      transitionTimingFunction: {
        ease: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(4px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pulse-slow": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.25s ease-out",
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
