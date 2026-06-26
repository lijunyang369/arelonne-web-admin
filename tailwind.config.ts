import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: "#1E1E2D",
        "sidebar-hover": "#2A2A3C",
        primary: "#4F6EF7",
        "primary-hover": "#4460DF",
        surface: "#F4F5F7",
      },
    },
  },
  plugins: [],
};
export default config;
