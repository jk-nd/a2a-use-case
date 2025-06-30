FROM node:18-alpine

WORKDIR /app

# Add build arguments to force rebuilds when needed
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
ARG BUILD_ID=unknown

# Copy package files first (for better caching)
COPY package*.json ./

# Install all dependencies (including ts-node for TypeScript execution)
RUN npm ci

# Copy source files
COPY --chown=node:node . .

# Create build metadata with timestamps
RUN echo "Build date: ${BUILD_DATE}" > /app/build-info.txt && \
    echo "VCS ref: ${VCS_REF}" >> /app/build-info.txt && \
    echo "Build ID: ${BUILD_ID}" >> /app/build-info.txt && \
    echo "Build timestamp: $(date)" >> /app/build-info.txt && \
    echo "Source files:" >> /app/build-info.txt && \
    find /app/src -name "*.ts" -exec sha256sum {} \; >> /app/build-info.txt

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 8000

# Start the server using TypeScript directly
CMD ["npm", "start"] 