#!/bin/bash
set -e

echo "=== A.CERT DEPLOY ==="
echo ""

cd "$(dirname "$0")/.."

echo "[1/5] Buscando últimos commits..."
git fetch origin

echo "[2/5] Atualizando código (reset forçado)..."
git reset --hard origin/main

echo "[3/5] Instalando dependências..."
npm install
cd frontend && npm install && cd ..

echo "[4/5] Buildando (Prisma + TypeScript + Next.js)..."
npx prisma generate
npx tsc
cd frontend && rm -rf .next out node_modules && npm install && NEXT_EXPORT=1 npx next build && cd ..

echo "[5/5] Reiniciando PM2..."
pm2 restart a-cert || pm2 start dist/server.js --name a-cert

echo ""
echo "=== DEPLOY CONCLUÍDO ==="
pm2 status
