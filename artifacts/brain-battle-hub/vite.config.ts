import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

const rawPort = process.env.PORT || "3000";
const basePath = process.env.BASE_PATH || "/";

const port = Number(rawPort);

// Plugin to inject deploy version into service worker and create version.json
function serviceWorkerVersionPlugin() {
  return {
    name: 'service-worker-version',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist/public');
      const swPath = path.join(outDir, 'sw.js');
      const versionPath = path.join(outDir, 'version.json');
      const version = Date.now().toString();

      // Ensure output directory exists
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // Inject version into sw.js if it exists
      if (fs.existsSync(swPath)) {
        const content = fs.readFileSync(swPath, 'utf8');
        const newContent = content.replace(/__DEPLOY_VERSION__/g, version);
        fs.writeFileSync(swPath, newContent, 'utf8');
        console.log(`Service Worker version injected: ${version}`);
      }

      // Create version.json for the app to check
      fs.writeFileSync(versionPath, JSON.stringify({ version, timestamp: version }), 'utf8');
      console.log(`version.json created: ${version}`);
    }
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    serviceWorkerVersionPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});