#!/bin/bash

# List the contents of the dist directory to ensure it exists
# ls -la dist

# Run Prisma migrations
npx prisma migrate deploy

# Run Prisma seed
if [ -f "prisma/seed.ts" ]; then
  NODE_OPTIONS="--max-old-space-size=4096" npx prisma db seed
else
  echo "Seed file not found, skipping seeding."
fi

# Start the Node.js application
exec node dist/main.js
# npm run start:prod
