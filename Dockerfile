# Use an official Node.js runtime as the base image
FROM node:16 as build-stage

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --force

# Copy app source code to the working directory
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the app (if applicable)
RUN npm run build

# Ensure the 'dist' directory exists
RUN ls -la dist

# Set the Node.js memory limit for all processes
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Set the environment variables for the database connection
ENV DATABASE_URL="postgresql://root:VkX182wRRg7gB1EbvUnrw7a2LjXTKk7ncb3aE=@139.59.244.26:5432/vrms-intern?schema=public"

# Run Prisma migrations and seed the database during the build process
RUN npx prisma migrate deploy
RUN if [ -f "prisma/seed.ts" ]; then npx prisma db seed; else echo "Seed file not found, skipping seeding"; fi

# Expose port (if needed)
EXPOSE 5050

# Start the Node.js application
CMD [ "node", "dist/main.js" ]
