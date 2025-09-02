# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build project
RUN pnpm build

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Copy built app and node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Apply migrations and start server
CMD npx prisma migrate deploy && node dist/server.js
