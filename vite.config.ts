import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Try to import lovable-tagger, but don't fail if it's not available
let componentTagger;
try {
  const lovableTagger = await import("lovable-tagger");
  componentTagger = lovableTagger.componentTagger;
} catch (error) {
  console.warn("lovable-tagger not found, component tagging will be disabled");
  componentTagger = () => null;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
