#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Print header
console.log('='.repeat(70));
console.log('Cloudflare Pages Custom Build Script (CommonJS)');
console.log('='.repeat(70));
console.log(`Starting build process at ${new Date().toISOString()}`);
console.log();

// Print environment information
console.log('='.repeat(70));
console.log('Environment Information:');
console.log('='.repeat(70));
console.log(`Node version: ${process.version}`);
console.log(`NPM version: ${execSync('npm --version').toString().trim()}`);
console.log(`Current directory: ${process.cwd()}`);
console.log();

// Check for bun.lockb and remove it if it exists
const bunLockPath = path.join(process.cwd(), 'bun.lockb');
if (fs.existsSync(bunLockPath)) {
  console.log('Removing bun.lockb file...');
  fs.unlinkSync(bunLockPath);
  console.log('bun.lockb removed.');
}

// Set environment variables to disable Bun and set Node.js version
process.env.BUN_INSTALL = 'false';
process.env.USE_BUN = 'false';
process.env.PACKAGE_MANAGER = 'npm';
process.env.NODE_VERSION = '20';

console.log('='.repeat(70));
console.log('Environment Variables:');
console.log('='.repeat(70));
console.log(`BUN_INSTALL=${process.env.BUN_INSTALL}`);
console.log(`USE_BUN=${process.env.USE_BUN}`);
console.log(`PACKAGE_MANAGER=${process.env.PACKAGE_MANAGER}`);
console.log(`NODE_VERSION=${process.env.NODE_VERSION}`);
console.log();

// Clean npm cache
console.log('='.repeat(70));
console.log('Cleaning npm cache:');
console.log('='.repeat(70));
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('npm cache cleaned.');
} catch (error) {
  console.error('Failed to clean npm cache:', error.message);
}
console.log();

// Install dependencies with npm
console.log('='.repeat(70));
console.log('Installing dependencies with npm:');
console.log('='.repeat(70));
try {
  console.log('Running npm ci --legacy-peer-deps...');
  execSync('npm ci --legacy-peer-deps', { stdio: 'inherit' });
} catch (error) {
  console.error('npm ci failed, trying npm install with legacy-peer-deps...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  } catch (installError) {
    console.error('npm install failed, trying with --no-package-lock and --legacy-peer-deps...');
    execSync('npm install --no-package-lock --legacy-peer-deps', { stdio: 'inherit' });
  }
}
console.log('Dependencies installed.');
console.log();

// Build the project
console.log('='.repeat(70));
console.log('Building the project:');
console.log('='.repeat(70));
try {
  console.log('Running vite build with explicit config...');
  execSync('NODE_ENV=production npx vite build --config vite.config.js --mode production', { stdio: 'inherit' });
  console.log('Build completed successfully!');

  // List files in dist directory
  console.log('='.repeat(70));
  console.log('Build output:');
  console.log('='.repeat(70));
  console.log('Files in dist directory:');
  const distFiles = execSync('ls -la dist').toString();
  console.log(distFiles);

  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
