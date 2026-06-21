FROM node:20-slim AS builder
WORKDIR /app
COPY dashboard/package*.json dashboard/server/prisma/schema.prisma ./
RUN npm install
COPY dashboard/ .
RUN npm run build && npm cache clean --force

FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 20130
ENV NODE_ENV=production
CMD ["npm", "start"]
