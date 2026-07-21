#!/bin/bash
set -e

echo "=== A.CERT DEPLOY ==="
echo ""

cd "$(dirname "$0")/.."

echo "[1/6] Buscando últimos commits..."
git fetch origin

echo "[2/6] Atualizando código (reset forçado)..."
git reset --hard origin/main

echo "[3/6] Instalando dependências..."
npm install
cd frontend && npm install && cd ..

echo "[4/6] Buildando (Prisma + TypeScript + Next.js)..."
npx prisma generate
npx tsc
cd frontend && rm -rf .next out node_modules && npm install && NEXT_EXPORT=1 npx next build && cd ..

echo "[5/6] Reiniciando PM2..."
pm2 restart a-cert || pm2 start dist/server.js --name a-cert

echo "[6/6] Verificando displays VNC..."
for svc in xvfb x11vnc-99 x11vnc-100 x11vnc-101; do
  if systemctl is-active --quiet $svc 2>/dev/null; then
    echo "  $svc ✓"
  else
    echo "  $svc ✗ (parado)"
    systemctl start $svc 2>/dev/null || echo "    Falha ao iniciar $svc"
  fi
done

echo ""
echo "=== DEPLOY CONCLUÍDO ==="
pm2 status
echo ""
echo "VNC: https://acert.tech/novnc/viewer.html"
