// vite.config.js - CommonJS version that can be used as a fallback
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react-swc');
const path = require('path');

// Configuration that conditionally includes lovable-tagger
module.exports = defineConfig(({ mode }) => {
  // Initialize plugins array with react
  const plugins = [react()];

  // Only include lovable-tagger in development mode
  if (mode === 'development') {
    try {
      // Try to require lovable-tagger
      const lovableTagger = require('lovable-tagger');
      if (lovableTagger && lovableTagger.componentTagger) {
        plugins.push(lovableTagger.componentTagger());
      }
    } catch (error) {
      console.warn("lovable-tagger not found or failed to load, component tagging will be disabled");
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
