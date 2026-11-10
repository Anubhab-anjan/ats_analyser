# Multi-stage Production Dockerfile for AWS ECS / App Runner / EC2
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Create application user for security least-privilege
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

COPY --from=builder /usr/src/app /usr/src/app

# Ensure uploads and reports directories are writable
RUN mkdir -p uploads reports && chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
