import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config = {
  darkMode: "class",
  plugins: [animate],
} satisfies Config;

export default config;
