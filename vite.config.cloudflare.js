// vite.config.cloudflare.js - CommonJS version for Cloudflare builds
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react-swc');
const path = require('path');

// Simple configuration without lovable-tagger for Cloudflare builds
module.exports = defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // lovable-tagger is completely removed to avoid build issues
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
