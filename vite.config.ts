import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this app from the /ca-meeting-finder/ subpath in
  // production; keep dev/preview at the root so local URLs stay simple.
  base: command === "build" ? "/ca-meeting-finder/" : "/",
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "localhost",
      ".ngrok-free.app",
      ".ngrok.io",
      ".github.io",
      ".githubusercontent.com",
      ".raw.githubusercontent.com",
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
