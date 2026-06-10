FROM node:20-slim
RUN npm install -g pnpm

WORKDIR /app
COPY . .

RUN pnpm install
RUN pnpm --filter @repo/common build

ENV NEXT_PUBLIC_HTTP_URL=http://localhost:3001
ENV INTERNAL_HTTP_URL=http://http-backend:3001
ENV NEXT_PUBLIC_WS_URL=ws://localhost:8080

RUN pnpm --filter excalidraw-web build

EXPOSE 3000
CMD ["pnpm", "--filter", "excalidraw-web", "start"]