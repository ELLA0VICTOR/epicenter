import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        accent: "var(--accent)",
        muted: "var(--fg-muted)",
        subtle: "var(--fg-subtle)",
        dim: "var(--fg-dim)",
        rule: "var(--border)",
        "rule-strong": "var(--border-strong)",
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      maxWidth: {
        shell: "1240px",
      },
      borderRadius: {
        none: "0px",
      },
    },
  },
  plugins: [],
} satisfies Config;
