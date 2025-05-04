#!/bin/bash

# This script is specifically for Cloudflare Pages builds

# Use npm instead of bun
echo "Setting up for Cloudflare Pages build..."

# If cloudflare-package.json exists, use it instead of package.json
if [ -f "cloudflare-package.json" ]; then
  echo "Using cloudflare-package.json..."
  cp cloudflare-package.json package.json
fi

# Clean install dependencies with npm
echo "Installing dependencies with npm..."
npm ci || npm install

# Build the project
echo "Building project with Vite directly..."
npx vite build

echo "Build completed successfully!"
