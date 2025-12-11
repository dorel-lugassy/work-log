# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Declare build arguments
ARG VITE_CONVEX_URL
ARG VITE_CLERK_PUBLISHABLE_KEY

# Ensure they are available during build
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build the application
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed (optional, using default for now, but enabling SPA fallback)
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
