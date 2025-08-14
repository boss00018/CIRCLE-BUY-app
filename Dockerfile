# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy source code
COPY server/ ./server/

# Build the application
RUN cd server && npm run build

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]