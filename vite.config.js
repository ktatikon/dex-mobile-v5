// vite.config.js - CommonJS version that can be used as a fallback
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react-swc');
const path = require('path');

// Simple configuration without lovable-tagger
module.exports = defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
