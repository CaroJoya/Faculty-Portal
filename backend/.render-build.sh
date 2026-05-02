#!/bin/bash

# Exit on error
set -o errexit

# Create data directory for SQLite
mkdir -p data

# Install dependencies
npm install

echo "Build completed successfully"