#!/bin/bash
# Package server into standalone .exe using pkg
set -e

echo "Installing dependencies..."
npm install

echo "Building TypeScript..."
npm run build

echo "Packaging with pkg..."
npx pkg dist/index.js \
  --targets node18-win-x64 \
  --output ../dist/auto-resume-server.exe

echo "Done! Executable: dist/auto-resume-server.exe"
