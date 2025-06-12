import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(async ({ mode }) => {
  const plugins = [react()];

  if (mode === "development") {
    const { componentTagger } = await import("lovable-tagger");
    // Uncomment below line if you want lovable-tagger plugin enabled during dev
    // plugins.push(componentTagger());
  }

  return {
    server: {
      host: "::", // Listen on all IPv4 & IPv6 addresses (for LAN access)
      port: 3000,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // Alias "@" to src directory
      },
    },
    define: {
      global: "window", // Required to emulate Node.js global
    },
    optimizeDeps: {
      include: ["buffer"], // Pre-bundle buffer for browser
    },
  };
});
