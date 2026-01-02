# STAGE 1: Build React App
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy only package and lock files first to leverage build cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build production artifacts
RUN npm run build

# STAGE 2: Use Nginx to serve static content
FROM nginx:alpine

# Remove the default nginx page and config
RUN rm -rf /usr/share/nginx/html/*
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
