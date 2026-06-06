FROM node:20-bookworm-slim

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate

# Marketplace runtime (required by acpGateway)
COPY ["member 2/marketplace-runtime/package.json", "member 2/marketplace-runtime/pnpm-lock.yaml", "member 2/marketplace-runtime/"]
WORKDIR "/app/member 2/marketplace-runtime"
RUN pnpm install --frozen-lockfile
COPY ["member 2/marketplace-runtime/tsconfig.json", "member 2/marketplace-runtime/src/", "./"]
RUN pnpm build

# Demo UI API server
WORKDIR /app/demo-ui
COPY demo-ui/package.json demo-ui/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY demo-ui/server ./server
COPY demo-ui/tsconfig.json ./

# Catalog + sellers for gateway
COPY data /app/data

ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 8787

CMD ["pnpm", "exec", "tsx", "server/agentApi.ts"]
