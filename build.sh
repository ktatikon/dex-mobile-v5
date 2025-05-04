#!/bin/bash

# Force using npm instead of bun
echo "Installing dependencies with npm..."
npm install

# Build the project
echo "Building project with cloudflare config..."
npx vite build --config vite.config.cloudflare.js

echo "Build completed successfully!"
