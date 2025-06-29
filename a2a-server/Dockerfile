FROM node:18-alpine

WORKDIR /app

# Add build argument to force rebuilds when needed
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
ARG BUILD_ID=unknown

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Create a build context hash to force cache invalidation
COPY --chown=node:node . .

# Create a build timestamp file and hash the source files to ensure changes are detected
RUN echo "Build date: ${BUILD_DATE}" > /app/build-info.txt && \
    echo "VCS ref: ${VCS_REF}" >> /app/build-info.txt && \
    echo "Build ID: ${BUILD_ID}" >> /app/build-info.txt && \
    echo "Build timestamp: $(date)" >> /app/build-info.txt && \
    find /app/src -name "*.js" -exec sha256sum {} \; > /app/source-hash.txt

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 8000

# Start the server
CMD ["npm", "start"] 