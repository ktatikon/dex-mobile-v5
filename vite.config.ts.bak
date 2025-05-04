import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Simple configuration without lovable-tagger
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      // lovable-tagger is completely removed to avoid build issues
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
