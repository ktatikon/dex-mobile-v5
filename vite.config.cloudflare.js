// vite.config.cloudflare.js - CommonJS version for Cloudflare builds
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react-swc');
const path = require('path');

// Simple configuration for Cloudflare builds
module.exports = defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // No additional plugins needed
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
