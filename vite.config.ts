import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import https from "https";

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [react(), UnoCSS()],
  server: {
    host: "localhost",
    proxy: {
      "/api": {
        target: "https://rss2email.chaojie.workers.dev",
        changeOrigin: true,
        agent: new https.Agent(),
      },
    },
  },
});
