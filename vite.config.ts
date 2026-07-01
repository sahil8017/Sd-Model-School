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
  // Disable Nitro bundling — the nf3/@vercel/nft dependency tracer used by the
  // node-server preset crashes on HuggingFace's Docker builder due to a CJS/ESM
  // named-export incompatibility. We don't need SSR for this auth-gated
  // management app; the Vite client build produces a full SPA bundle.
  // A post-build script (scripts/generate-index.cjs) creates index.html from
  // the content-hashed assets so Express can serve the SPA correctly.
  nitro: false,
  vite: {
    server: {
      // Proxy /api/* and /uploads/* to the Express backend in dev (port 3001)
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
        "/uploads": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  },
});
