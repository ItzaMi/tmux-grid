/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Geist Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#0b0c0e",
        panel: "#12141a",
        line: "#22252e",
        accent: "#7cf7a8",
        muted: "#6b7180",
      },
    },
  },
  plugins: [],
};
