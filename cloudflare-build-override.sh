#!/bin/bash

# This script is specifically for Cloudflare Pages builds
# It explicitly disables Bun and forces npm

# Unset BUN_INSTALL to prevent Bun from being used
unset BUN_INSTALL
export USE_BUN=false
export PACKAGE_MANAGER=npm

# Print environment information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Package manager: $PACKAGE_MANAGER"

# Clean install dependencies with npm
echo "Installing dependencies with npm..."
npm install

# Build the project
echo "Building project..."
npm run build

echo "Build completed successfully!"
