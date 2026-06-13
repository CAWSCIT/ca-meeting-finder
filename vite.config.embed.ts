import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import prefixSelector from "postcss-prefix-selector";
import path from "path";

const MOUNT_ID = "#camf";

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(path.resolve(__dirname, "./tailwind.config.ts")),
        autoprefixer(),
        prefixSelector({
          prefix: MOUNT_ID,
          transform(prefix, selector, prefixedSelector) {
            // :root vars → scoped to the mount element
            if (selector === ":root") return prefix;
            // body/html base styles → scoped to mount element
            if (selector === "body" || selector === "html") return prefix;
            return prefixedSelector;
          },
        }),
      ],
    },
  },
  build: {
    lib: {
      entry: "src/embed.tsx",
      name: "MeetingFinder",
      formats: ["iife"],
      fileName: () => "meeting-finder.js",
    },
    outDir: "dist/embed",
    minify: "terser",
    terserOptions: {
      compress: {
        passes: 3,          // multiple passes find more to eliminate
        drop_console: true,
        drop_debugger: true,
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_symbols: true,
      },
      mangle: {
        toplevel: true,     // mangle top-level names (safe in IIFE)
      },
      format: {
        comments: false,    // strip all comments
      },
    },
    rollupOptions: {
      output: {
        // Inline all dynamic imports — keeps it a single file
        inlineDynamicImports: true,
      },
    },
  },
});
