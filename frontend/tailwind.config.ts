import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        foreground: "var(--color-fg)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
      },
      letterSpacing: {
        archive: "0.35em",
        archiveWide: "0.45em",
      },
      container: {
        center: true,
        padding: "3rem",
      },
    },
  },
  plugins: [],
};

export default config;
