#!/bin/bash
# fix-headless.sh — Prepara ambiente Puppeteer com xvfb no servidor
# Rodar via SSH no servidor acert.tech, dentro da pasta do projeto

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
echo "=== 3. Instalando xvfb (display virtual) ==="
if command -v xvfb-run &>/dev/null; then
  echo "xvfb ja instalado."
else
  echo "Instalando xvfb..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq xvfb
  echo "xvfb instalado."
fi

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
echo "=== 6. Teste rapido: Chrome abre com xvfb? ==="
export DISPLAY=:99
Xvfb :99 -screen 0 1366x768x24 &
XVFB_PID=$!
sleep 1

if [ -f "tmp/test-puppeteer.cjs" ]; then
  PUPPETEER_HEADLESS=false node tmp/test-puppeteer.cjs && echo "TESTE OK - Chrome funciona com xvfb!"
else
  echo "AVISO: tmp/test-puppeteer.cjs nao encontrado — pulando teste automatico."
fi

kill $XVFB_PID 2>/dev/null
wait $XVFB_PID 2>/dev/null

echo ""
echo "=== 7. Como iniciar o servidor com xvfb ==="
echo ""
echo "Opcao A — via xvfb-run (mais simples):"
echo "  xvfb-run -a --server-args='-screen 0 1366x768x24' node dist/server.js"
echo ""
echo "Opcao B — com PM2 (recomendado):"
echo "  pm2 start dist/server.js --name acert -- xvfb-run -a --server-args='-screen 0 1366x768x24'"
echo "  ou edite o ecosystem.config.js do PM2 e adicione o wrapper xvfb-run"
echo ""
echo "Opcao C — Xvfb como servico systemd (mais robusto):"
echo "  sudo bash -c 'cat > /etc/systemd/system/xvfb.service << EOF"
echo "  [Unit]"
echo "  Description=Xvfb virtual display"
echo "  After=network.target"
echo "  [Service]"
echo "  ExecStart=/usr/bin/Xvfb :99 -screen 0 1366x768x24"
echo "  Restart=always"
echo "  [Install]"
echo "  WantedBy=multi-user.target"
echo "  EOF'"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable xvfb"
echo "  sudo systemctl start xvfb"
echo "  # Depois adicione 'Environment=DISPLAY=:99' no service do acert"
