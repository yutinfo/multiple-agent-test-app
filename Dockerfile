# Base stage with dependencies installed for local development.
FROM node:20-alpine AS dev

WORKDIR /app

# Install all dependencies so the container can run next dev directly.
COPY package.json package-lock.json ./
RUN npm ci

ENV NODE_ENV=development

# The source code is bind-mounted in docker-compose for live reload.
EXPOSE 3000

CMD ["npm", "run", "dev"]

# Multi-stage build: Stage 2 - Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manager lock files and package.json
COPY package.json package-lock.json ./

# Install dependencies with frozen lockfile for reproducibility
RUN npm ci

# Copy source code and configuration files
COPY . .

# Build the Next.js application
RUN npm run build

# Multi-stage build: Stage 3 - Production
FROM node:20-alpine AS production

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package.json and lock file
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next

# Expose port 3000 for the application
EXPOSE 3000

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the Next.js production server
CMD ["npm", "start"]
