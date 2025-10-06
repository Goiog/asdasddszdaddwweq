# server/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx esbuild index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
