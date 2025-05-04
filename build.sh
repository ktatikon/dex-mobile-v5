#!/bin/bash

# Force using npm instead of bun
echo "Installing dependencies with npm..."
npm install

# Build the project
echo "Building project with Vite directly..."
npx vite build

echo "Build completed successfully!"
