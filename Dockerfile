FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose dynamic PORT for Railway
ENV PORT=3000
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
