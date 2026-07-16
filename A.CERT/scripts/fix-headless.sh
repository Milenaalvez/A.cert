#!/bin/bash
# fix-headless.sh — Prepara ambiente Puppeteer com xvfb + x11vnc no servidor
# Rodar via SSH no servidor acert.tech, dentro da pasta do projeto
#
# Agora usa setup-vnc.sh para configurar displays e VNC permanentes.

set -e

echo "=== 1. Backup do .env atual ==="
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "Backup criado."

echo ""
echo "=== 2. Garantindo PUPPETEER_HEADLESS=false (xvfb vai fornecer o display) ==="
if grep -q "PUPPETEER_HEADLESS=true" .env; then
  sed -i 's/PUPPETEER_HEADLESS=true/PUPPETEER_HEADLESS=false/' .env
  echo "PUPPETEER_HEADLESS alterado para false (xvfb fornece display virtual)."
elif grep -q "PUPPETEER_HEADLESS" .env; then
  echo "PUPPETEER_HEADLESS ja esta correto: $(grep PUPPETEER_HEADLESS .env)"
else
  echo "PUPPETEER_HEADLESS=false" >> .env
  echo "PUPPETEER_HEADLESS=false adicionado ao .env"
fi

echo ""
echo "=== 3. Instalando xvfb + x11vnc (display virtual + acesso remoto) ==="
sudo apt-get update -qq
sudo apt-get install -y -qq xvfb x11vnc
echo "xvfb e x11vnc instalados."

echo ""
echo "=== 4. Verificando se o Chrome/Chromium esta instalado ==="
if npx puppeteer browsers list 2>/dev/null | grep -q chrome; then
  echo "Chrome ja instalado."
else
  echo "Chrome nao encontrado — instalando..."
  npx puppeteer browsers install chrome
fi

echo ""
echo "=== 5. Verificando dependencias de sistema do Chrome ==="
MISSING=""
for lib in libnss3 libatk-bridge2.0-0 libatk1.0-0 libgtk-3-0 libgbm1 libasound2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libpango-1.0-0 libcups2; do
  dpkg -l 2>/dev/null | grep -q "$lib" || MISSING="$MISSING $lib"
done

if [ -n "$MISSING" ]; then
  echo "AVISO: bibliotecas de sistema faltando:$MISSING"
  echo "Instalando..."
  sudo apt-get install -y -qq$MISSING
  echo "Bibliotecas instaladas."
else
  echo "Bibliotecas de sistema OK."
fi

echo ""
echo "=== 6. Configurando Xvfb + x11vnc como servicos systemd ==="
sudo bash scripts/setup-vnc.sh

echo ""
echo "=== 7. Teste rapido: Chrome abre com xvfb? ==="
export DISPLAY=:99
if [ -f "tmp/test-puppeteer.cjs" ]; then
  PUPPETEER_HEADLESS=false node tmp/test-puppeteer.cjs && echo "TESTE OK - Chrome funciona com xvfb!"
else
  echo "AVISO: tmp/test-puppeteer.cjs nao encontrado — pulando teste automatico."
fi

echo ""
echo "=== CONCLUIDO ==="
echo "Displays configurados e rodando:"
echo "  systemctl status xvfb x11vnc-99 x11vnc-100 x11vnc-101"
echo ""
echo "Acesse via navegador: https://acert.tech/novnc/viewer.html"
