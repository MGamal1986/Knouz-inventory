import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxied so the browser only ever talks to one origin (localhost:3000).
// That keeps the auth cookies same-site without needing HTTPS in dev.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      "/api": { target: apiProxyTarget, changeOrigin: true },
      "/uploads": { target: apiProxyTarget, changeOrigin: true },
      "/invoices": { target: apiProxyTarget, changeOrigin: true },
    },
  },
});
