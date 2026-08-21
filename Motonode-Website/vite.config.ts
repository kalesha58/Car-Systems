import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const spaRoutes = [
  "privacy",
  "terms",
  "about",
  "services",
  "parts",
  "community",
  "rides",
  "blog",
  "contact",
  "search",
];

const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    {
      name: "spa-html-copies",
      closeBundle() {
        const dist = path.resolve(import.meta.dirname, "dist");
        const indexPath = path.join(dist, "index.html");
        if (!fs.existsSync(indexPath)) {
          return;
        }
        const html = fs.readFileSync(indexPath);
        fs.writeFileSync(path.join(dist, "404.html"), html);
        for (const route of spaRoutes) {
          fs.writeFileSync(path.join(dist, `${route}.html`), html);
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: securityHeaders,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: securityHeaders,
  },
});
