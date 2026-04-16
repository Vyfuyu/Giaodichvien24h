FROM node:24-slim

# Install pnpm
RUN npm install -g pnpm@10.26.1

WORKDIR /app

# Copy all source
COPY . .

# Install all dependencies including devDependencies (needed for build tools like drizzle-kit, vite, esbuild)
RUN pnpm install --no-frozen-lockfile

# Build frontend (static files)
RUN BASE_PATH=/ pnpm --filter @workspace/giaodichvien24h run build

# Build API server
RUN pnpm --filter @workspace/api-server run build

EXPOSE 8080

CMD ["node", "scripts/railway-start.mjs"]
