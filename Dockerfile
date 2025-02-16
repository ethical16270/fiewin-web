# Build stage
FROM node:16.20-slim as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:16.20-slim
WORKDIR /app

# Copy production files
COPY --from=builder /app/build ./build
COPY --from=builder /app/server.js .
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV PROXY_TARGET=https://91appw.com

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server.js"] 