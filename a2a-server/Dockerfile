FROM node:18-alpine

WORKDIR /app

# Add build arguments to force rebuilds when needed
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
ARG BUILD_ID=unknown

# Copy package files first (for better caching)
COPY package*.json ./

# Install all dependencies (including dev dependencies for TypeScript compilation)
RUN npm ci

# Copy source files
COPY --chown=node:node . .

# Use pre-compiled TypeScript files (compiled locally)
# Don't run npm run build inside container - use the dist/ files that were compiled locally
RUN if [ ! -f "dist/server.js" ]; then \
        echo "Error: dist/server.js not found. Please run 'npm run build' locally first."; \
        exit 1; \
    fi

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create build metadata with timestamps
RUN echo "Build date: ${BUILD_DATE}" > /app/build-info.txt && \
    echo "VCS ref: ${VCS_REF}" >> /app/build-info.txt && \
    echo "Build ID: ${BUILD_ID}" >> /app/build-info.txt && \
    echo "Build timestamp: $(date)" >> /app/build-info.txt && \
    echo "Source files:" >> /app/build-info.txt && \
    find /app/src -name "*.ts" -exec sha256sum {} \; >> /app/build-info.txt && \
    echo "Compiled files:" >> /app/build-info.txt && \
    find /app/dist -name "*.js" -exec sha256sum {} \; >> /app/build-info.txt

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 8000

# Start the server
CMD ["npm", "start"] 