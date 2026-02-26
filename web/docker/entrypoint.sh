#!/bin/sh
set -e

echo "[entrypoint] SQLITE_PATH=${SQLITE_PATH:-/data/app.db}"
echo "[entrypoint] XML_PATH=${XML_PATH:-/app/data/structure_released.xml}"

#node /app/dist/seed-from-xml.cjs

echo "[entrypoint] starting Next.js standalone..."
exec node /app/server.js