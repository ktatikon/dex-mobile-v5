#!/bin/bash

# Cloudflare Pages Console Fix Script
# This script is designed to be used as a custom build command in Cloudflare Pages
# It will disable Bun, force npm, and provide detailed logging

# Print header
echo "====================================================="
echo "Cloudflare Pages Build Fix Script"
echo "====================================================="
echo "Starting build process at $(date)"
echo

# Print environment information
echo "====================================================="
echo "Environment Information:"
echo "====================================================="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Build directory: $CF_PAGES_BUILD_DIR"
echo "Commit hash: $CF_PAGES_COMMIT_SHA"
echo "Branch: $CF_PAGES_BRANCH"
echo

# Disable Bun
echo "====================================================="
echo "Disabling Bun and configuring npm:"
echo "====================================================="
export BUN_INSTALL=false
export USE_BUN=false
export PACKAGE_MANAGER=npm
echo "BUN_INSTALL=$BUN_INSTALL"
echo "USE_BUN=$USE_BUN"
echo "PACKAGE_MANAGER=$PACKAGE_MANAGER"

# Create .npmrc file
echo "Creating .npmrc file..."
cat > .npmrc << EOL
engine-strict=true
use-node-version=18
package-lock=false
EOL
echo "Created .npmrc file:"
cat .npmrc
echo

# Remove bun.lockb if it exists
if [ -f "bun.lockb" ]; then
  echo "Removing bun.lockb file..."
  rm bun.lockb
  echo "bun.lockb removed."
fi

# Clean npm cache
echo "====================================================="
echo "Cleaning npm cache:"
echo "====================================================="
npm cache clean --force
echo "npm cache cleaned."
echo

# Install dependencies with npm
echo "====================================================="
echo "Installing dependencies with npm:"
echo "====================================================="
echo "Running npm install..."
npm install
if [ $? -ne 0 ]; then
  echo "npm install failed, trying with --no-package-lock..."
  npm install --no-package-lock
fi
echo "Dependencies installed."
echo

# Build the project
echo "====================================================="
echo "Building the project:"
echo "====================================================="
echo "Running npm run build..."
npm run build
BUILD_RESULT=$?
echo

# Check build result
if [ $BUILD_RESULT -eq 0 ]; then
  echo "====================================================="
  echo "Build completed successfully!"
  echo "====================================================="
  echo "Build output directory: dist"
  echo "Files in dist directory:"
  ls -la dist
else
  echo "====================================================="
  echo "Build failed with exit code $BUILD_RESULT"
  echo "====================================================="
  echo "Please check the logs above for errors."
  exit $BUILD_RESULT
fi

# Exit with success
exit 0
