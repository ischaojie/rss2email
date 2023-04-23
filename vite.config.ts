import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import https from "https";

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "https://rss2email.chaojie.workers.dev/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), UnoCSS()],
});
