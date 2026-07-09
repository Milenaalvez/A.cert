#!/bin/bash
# fix-headless.sh — Corrige PUPPETEER_HEADLESS em producao e valida ambiente
# Rodar via SSH no servidor acert.tech, dentro da pasta do projeto

set -e

echo "=== 1. Backup do .env atual ==="
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "Backup criado."

echo ""
echo "=== 2. Corrigindo PUPPETEER_HEADLESS ==="
if grep -q "PUPPETEER_HEADLESS=false" .env; then
  sed -i 's/PUPPETEER_HEADLESS=false/PUPPETEER_HEADLESS=true/' .env
  echo "PUPPETEER_HEADLESS alterado para true."
else
  echo "AVISO: nao encontrei 'PUPPETEER_HEADLESS=false' no .env — confere manualmente:"
  grep "PUPPETEER_HEADLESS" .env || echo "  (variavel nao existe no .env — precisa ADICIONAR: PUPPETEER_HEADLESS=true)"
fi

echo ""
echo "=== 3. Verificando se o Chrome/Chromium esta instalado ==="
if npx puppeteer browsers list 2>/dev/null | grep -q chrome; then
  echo "Chrome ja instalado."
else
  echo "Chrome nao encontrado — instalando..."
  npx puppeteer browsers install chrome
fi

echo ""
echo "=== 4. Verificando dependencias de sistema do Chrome ==="
MISSING=""
for lib in libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2; do
  dpkg -l | grep -q "$lib" || MISSING="$MISSING $lib"
done

if [ -n "$MISSING" ]; then
  echo "AVISO: bibliotecas de sistema faltando:$MISSING"
  echo "Rode: sudo apt-get update && sudo apt-get install -y$MISSING"
else
  echo "Bibliotecas de sistema OK."
fi

echo ""
echo "=== 5. Teste rapido: Chrome consegue abrir em headless? ==="
if [ -f "tmp/test-puppeteer.cjs" ]; then
  node tmp/test-puppeteer.cjs
else
  echo "AVISO: tmp/test-puppeteer.cjs nao encontrado — pulando teste automatico."
  echo "Teste manual: node -e \"require('puppeteer').launch({headless:true}).then(b=>{console.log('OK'); b.close()})\""
fi

echo ""
echo "=== 6. Proximo passo manual ==="
echo "Se tudo acima passou, reinicie o servidor:"
echo "  pm2 restart all     (se usar PM2)"
echo "  ou: systemctl restart acert   (se usar systemd)"
echo "  ou: mate o processo node antigo e rode 'node dist/server.js' de novo"
