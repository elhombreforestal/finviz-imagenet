FROM node:20-alpine

WORKDIR /app

# deps needed to build better-sqlite3 on Alpine
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

CMD ["sh", "-lc", "pnpm run dev"]