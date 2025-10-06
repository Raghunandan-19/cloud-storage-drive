# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production || npm ci

# Copy the rest of the app
COPY . .

# Ensure production NODE_ENV
ENV NODE_ENV=production

# Use dynamic port from platform
ENV PORT=3000
EXPOSE 3000

CMD ["node", "app.js"]


