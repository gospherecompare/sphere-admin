import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const STATIC_ROUTE_HTML_PATHS = ["/login", "/dashboard"];

const createStaticRouteHtmlPlugin = (routes = []) => ({
  name: "admin-generate-route-html",
  apply: "build",
  closeBundle() {
    const outputDir = path.join(__dirname, "dist");
    const rootHtmlPath = path.join(outputDir, "index.html");

    if (!fs.existsSync(rootHtmlPath)) {
      return;
    }

    const html = fs.readFileSync(rootHtmlPath, "utf8");
    for (const routePath of routes) {
      const normalized = String(routePath || "").trim();
      if (!normalized || normalized === "/") continue;

      const outputPath = path.join(
        outputDir,
        normalized.replace(/^\/+/, ""),
        "index.html",
      );
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, html, "utf8");
    }

    fs.writeFileSync(path.join(outputDir, "404.html"), html, "utf8");
  },
});

// Proxy `/api` requests in dev to avoid CORS when calling external APIs.
export default defineConfig({
  plugins: [tailwindcss(), createStaticRouteHtmlPlugin(STATIC_ROUTE_HTML_PATHS)],
  server: {
    proxy: {
      "/api": {
        target: "https://api.apisphere.in",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
