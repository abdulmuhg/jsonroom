# syntax=docker/dockerfile:1

# Build: install, run the tests, build the site. A failing test fails the image
# build, so a regression never reaches the server.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm test
RUN npm run build
# /healthz is a small file that reports which commit is running. Written last
# so a new commit with unchanged sources reuses every layer above.
ARG GIT_SHA=dev
RUN printf '{"status":"ok","version":"%s"}\n' "$GIT_SHA" > dist/healthz

# Runtime: nginx serving the built files, nothing else. The unprivileged image
# runs as a non-root user and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.30-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
