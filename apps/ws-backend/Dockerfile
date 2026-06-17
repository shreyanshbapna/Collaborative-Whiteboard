FROM --platform=linux/amd64 node:20-slim
RUN npm install -g pnpm

WORKDIR /app
COPY . .

RUN pnpm install
RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder pnpm --filter @repo/db generate

RUN pnpm --filter excalidraw-web build

EXPOSE 3000
CMD ["pnpm", "--filter", "ws-backend", "start"]