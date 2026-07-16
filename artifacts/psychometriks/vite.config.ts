import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "PSYCHOMETRIKS",
        short_name: "PSY",
        description: "Plataforma profesional de análisis y psicología para traders de crypto. LiqMap, Señales, PSY Score y más.",
        theme_color: "#00e5ff",
        background_color: "#020b12",
        display: "standalone",
        orientation: "portrait",
        start_url: basePath,
        scope: basePath,
        lang: "es",
        categories: ["finance", "education"],
        icons: [
          {
            src: "psy-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "psy-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "psy-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
        screenshots: [
          {
            src: "opengraph.jpg",
            sizes: "1200x630",
            type: "image/jpeg",
            label: "PSYCHOMETRIKS Platform",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,svg,jpg,jpeg,png,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^\/api\/proxy\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      "@wagmi/core/tempo": path.resolve(import.meta.dirname, "src/lib/wagmi-tempo-mock.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            id.includes("@wagmi") || id.includes("/wagmi/") ||
            id.includes("viem") || id.includes("@reown") ||
            id.includes("@web3modal") || id.includes("@walletconnect") ||
            id.includes("abitype") || id.includes("ox/")
          ) return "web3";
          if (
            id.includes("@coinbase") || id.includes("@tronweb3") ||
            id.includes("@solana") || id.includes("@coral-xyz")
          ) return "blockchain";
          if (
            id.includes("recharts") || id.includes("lightweight-charts") ||
            id.includes("d3-")
          ) return "charts";
          return undefined;
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
