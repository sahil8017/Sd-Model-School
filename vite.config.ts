// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Use 'node' preset so the build produces a plain Node.js HTTP server
  // (.output/server/index.mjs) that works inside Docker / Hugging Face Spaces.
  //
  // routeRules proxy /api/* and /uploads/* to the Express API server
  // which runs on port 3001 internally (started by start.sh alongside Nitro).
  nitro: {
    preset: "node",
    routeRules: {
      "/api/**": { proxy: "http://127.0.0.1:3001/api/**" },
      "/uploads/**": { proxy: "http://127.0.0.1:3001/uploads/**" },
    },
  },
  vite: {
    server: {
      // Proxy /api/* and /uploads/* to the Express backend in dev (port 3001)
      proxy: {
        "/api": {
          target: `http://localhost:3001`,
          changeOrigin: true,
        },
        "/uploads": {
          target: `http://localhost:3001`,
          changeOrigin: true,
        },
      },
    },
  },
});
