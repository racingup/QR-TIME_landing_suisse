# Multi-stage build: Astro static site → nginx:alpine.
# Output of `astro build` is /app/dist/, copied into the final nginx image.

FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (layer cached as long as lockfile + manifest don't change)
COPY package.json package-lock.json* ./
RUN npm ci

# Build-time env vars (passed in via compose `build.args`)
ARG PUBLIC_ZONECOMMENTS_API_URL
ARG PUBLIC_ZONECOMMENTS_PROJECT_ID
ENV PUBLIC_ZONECOMMENTS_API_URL=$PUBLIC_ZONECOMMENTS_API_URL
ENV PUBLIC_ZONECOMMENTS_PROJECT_ID=$PUBLIC_ZONECOMMENTS_PROJECT_ID

# Build
COPY . .
RUN npm run build

# Runtime: serve /dist with nginx
FROM nginx:1.29-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
