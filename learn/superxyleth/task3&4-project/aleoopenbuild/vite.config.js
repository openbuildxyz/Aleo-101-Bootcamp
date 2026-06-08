import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "ALEO_", "PRIVATE_KEY", "API_KEY", "CONSUME_ID"],
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: "es",
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    exclude: ["@provablehq/wasm"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      "/aleo-api": {
        target: "https://api.provable.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aleo-api/, ""),
      },
      "/aleo-prove": {
        target: "https://api.provable.com",
        changeOrigin: true,
        cookieDomainRewrite: "",
        cookiePathRewrite: "/",
        rewrite: (path) => path.replace(/^\/aleo-prove/, "/prove"),
      },
      "/jwts": {
        target: "https://api.provable.com",
        changeOrigin: true,
      },
    },
  },
});
