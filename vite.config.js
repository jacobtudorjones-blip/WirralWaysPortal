import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Explicit, not just relying on the (already false) default — this app
    // is deployed as a public static build, and a sourcemap would let
    // anyone reconstruct the original source (including anything not
    // meant to be readable at a glance) straight from dev tools.
    sourcemap: false,
  },
});
