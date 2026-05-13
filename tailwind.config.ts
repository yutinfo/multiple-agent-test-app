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
        // Soft White Base
        "soft-white": "#F8F9FA",

        // Teal Color Scale
        teal: {
          50: "#F0FDFA",   // Lightest - for subtle backgrounds
          100: "#CCFBF1",  // Light - for hover/focus states
          500: "#0D9488",  // Primary - main interactive color
          700: "#0F766E",  // Dark - for active/pressed states
        },

        // Neutral Gray Scale
        gray: {
          50: "#F9FAFB",   // Lightest gray
          100: "#F3F4F6",  // Hover background
          200: "#E5E7EB",  // Border color
          600: "#6B7280",  // Text secondary
          700: "#374151",  // Lighter text
          900: "#1F2937",  // Text primary (dark)
        },

        // Status Colors
        green: {
          500: "#10B981",  // Success
        },
        amber: {
          500: "#F59E0B",  // Warning
        },
        red: {
          500: "#EF4444",  // Error
        },
      },
    },
  },
  plugins: [],
};
export default config;
