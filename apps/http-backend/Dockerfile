FROM node:20-alpine
RUN npm install -g pnpm

WORKDIR /app
COPY . .

RUN pnpm install

RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder pnpm --filter @repo/db generate
RUN pnpm --filter http-backend build

EXPOSE 3001
CMD ["pnpm", "--filter", "http-backend", "start"]