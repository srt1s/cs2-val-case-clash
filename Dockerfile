FROM node:20-alpine

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Run application using Railway provided $PORT
CMD ["node", "server.js"]
