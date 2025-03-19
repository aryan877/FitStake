#!/bin/bash

# Ensure we're in the project directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the seed script
echo "Seeding the database with test data..."
npm run seed

echo "Seeding completed!" 