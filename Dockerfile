FROM node:18-alpine

WORKDIR /app

# Install server dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Install client dependencies and build
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npx vite build

# Copy server code
COPY server/ ./server/

# Data directory for SQLite
RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 3000

CMD ["node", "server/index.js"]
