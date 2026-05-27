// Parallel Vite config used ONLY for Vercel / static-host SPA deploys.
// It deliberately skips the Cloudflare plugin (which @lovable.dev/vite-tanstack-config
// bundles by default), and asks TanStack Start to emit a standalone
// dist/client/index.html shell that boots the client router.
//
// Usage:  npm run build:spa
// Output: dist/client/  (point Vercel's "Output Directory" here)
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      // Emit a client-only build: dist/client/index.html + dist/client/assets/*
      spa: {
        enabled: true,
        // Every unknown route is rewritten to "/" by vercel.json and hydrated
        // by the client router. Leave the default mask path.
      },
    }),
    react(),
  ],
  build: {
    // Vercel's outputDirectory in vercel.json points at dist/client.
    outDir: "dist",
    emptyOutDir: true,
  },
});
