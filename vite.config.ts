import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Initialize plugins array with react
  const plugins = [react()];

  // Only include lovable-tagger in development mode
  if (mode === 'development') {
    try {
      // Dynamic import with a try-catch to handle when the package is not available
      import('lovable-tagger').then(module => {
        if (module && module.componentTagger) {
          plugins.push(module.componentTagger());
        }
      }).catch(() => {
        console.warn("lovable-tagger not found, component tagging will be disabled");
      });
    } catch (error) {
      console.warn("lovable-tagger import failed, component tagging will be disabled");
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
