#!/bin/bash
# ============================================================
# diagnose-vnc.sh — Diagnóstico completo do sistema VNC/Display
# Rode no servidor acert.tech, dentro da pasta do projeto
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass()  { echo -e "  ${GREEN}✓${NC} $1"; }
fail()  { echo -e "  ${RED}✗${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
info()  { echo -e "  ${CYAN}→${NC} $1"; }
section() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

FAILS=0

# ============================================================
section "1. SISTEMA OPERACIONAL"
# ============================================================
echo "OS: $(uname -a)"
echo "Node: $(node -v 2>/dev/null || echo 'NÃO INSTALADO')"
echo "NPM: $(npm -v 2>/dev/null || echo 'NÃO INSTALADO')"
echo "PM2: $(pm2 -v 2>/dev/null || echo 'não instalado')"

if [ "$(uname -s)" != "Linux" ]; then
  fail "Este servidor NÃO é Linux! Xvfb/x11vnc só funcionam no Linux."
  fail "Se for Windows, o VNC NÃO funciona! O Chrome abre localmente."
  FAILS=$((FAILS + 1))
else
  pass "Linux detectado"
fi

# ============================================================
section "2. CHROME / CHROMIUM"
# ============================================================
if command -v google-chrome &>/dev/null; then
  pass "google-chrome: $(google-chrome --version 2>/dev/null)"
elif command -v google-chrome-stable &>/dev/null; then
  pass "google-chrome-stable: $(google-chrome-stable --version 2>/dev/null)"
elif command -v chromium-browser &>/dev/null; then
  pass "chromium-browser: $(chromium-browser --version 2>/dev/null)"
elif command -v chromium &>/dev/null; then
  pass "chromium: $(chromium --version 2>/dev/null)"
else
  fail "Nenhum Chrome/Chromium encontrado no sistema!"
  FAILS=$((FAILS + 1))
fi

# Puppeteer Chrome
echo ""
info "Verificando Chrome do Puppeteer..."
if npx puppeteer browsers list 2>/dev/null; then
  pass "Puppeteer browsers list OK"
else
  fail "Puppeteer não encontrou browsers. Rode: npx puppeteer browsers install chrome"
  FAILS=$((FAILS + 1))
fi

# ============================================================
section "3. DEPENDÊNCIAS DE SISTEMA DO CHROME"
# ============================================================
MISSING_LIBS=""
for lib in libnss3 libatk-bridge2.0-0 libatk1.0-0 libgtk-3-0 libgbm1 libasound2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libpango-1.0-0 libcups2 libdrm2 libxshmfence1; do
  dpkg -l 2>/dev/null | grep -q "$lib" || MISSING_LIBS="$MISSING_LIBS $lib"
done

if [ -n "$MISSING_LIBS" ]; then
  fail "Bibliotecas faltando:$MISSING_LIBS"
  info "Instale com: sudo apt-get install -y$MISSING_LIBS"
  FAILS=$((FAILS + 1))
else
  pass "Todas as bibliotecas de sistema OK"
fi

# ============================================================
section "4. Xvfb (DISPLAYS VIRTUAIS)"
# ============================================================
if systemctl is-active --quiet xvfb 2>/dev/null; then
  pass "Xvfb service está ATIVO"
else
  fail "Xvfb service NÃO está ativo!"
  info "Status: $(systemctl status xvfb 2>/dev/null | head -5 || echo 'serviço não encontrado')"
  FAILS=$((FAILS + 1))
fi

# Verificar processos Xvfb
echo ""
XVFB_PROCS=$(ps aux 2>/dev/null | grep -v grep | grep Xvfb || true)
if [ -n "$XVFB_PROCS" ]; then
  pass "Processos Xvfb rodando:"
  echo "$XVFB_PROCS" | while read line; do echo "    $line"; done
else
  fail "Nenhum processo Xvfb rodando!"
  FAILS=$((FAILS + 1))
fi

# ============================================================
section "5. x11vnc (SERVIDOR VNC)"
# ============================================================
for DISP in 99 100 101; do
  if systemctl is-active --quiet x11vnc-${DISP} 2>/dev/null; then
    pass "x11vnc-${DISP} ATIVO (porta $((5900 + DISP - 98)))"
  else
    fail "x11vnc-${DISP} NÃO ativo!"
    FAILS=$((FAILS + 1))
  fi
done

echo ""
info "Verificando portas VNC (devem escutar em 127.0.0.1):"
if command -v ss &>/dev/null; then
  VNC_PORTS=$(ss -tlnp 2>/dev/null | grep -E '59(01|02|03)' || true)
elif command -v netstat &>/dev/null; then
  VNC_PORTS=$(netstat -tlnp 2>/dev/null | grep -E '59(01|02|03)' || true)
else
  VNC_PORTS=""
fi

if [ -n "$VNC_PORTS" ]; then
  pass "Portas VNC escutando:"
  echo "$VNC_PORTS" | while read line; do echo "    $line"; done
else
  fail "Nenhuma porta VNC (5901-5903) escutando!"
  FAILS=$((FAILS + 1))
fi

# ============================================================
section "6. APLICAÇÃO A.CERT"
# ============================================================
# PM2
if command -v pm2 &>/dev/null; then
  PM2_STATUS=$(pm2 list 2>/dev/null | grep -i "a.cert\|acert\|server" || true)
  if [ -n "$PM2_STATUS" ]; then
    pass "PM2: app A.CERT encontrada"
    echo "$PM2_STATUS"
  else
    warn "PM2 instalado mas app A.CERT não encontrada"
  fi
else
  info "PM2 não instalado. Verificando outros gerenciadores..."
fi

# Porta 3001
echo ""
if ss -tlnp 2>/dev/null | grep -q ':3001 ' || netstat -tlnp 2>/dev/null | grep -q ':3001 '; then
  pass "Porta 3001 escutando (servidor A.CERT)"
else
  fail "Porta 3001 NÃO está escutando! Servidor pode estar parado."
  FAILS=$((FAILS + 1))
fi

# ============================================================
section "7. TESTE PUPPETEER + XVFB"
# ============================================================
info "Criando teste rápido do Chrome no display :99..."
cat > /tmp/acert-vnc-test.cjs << 'TESTEOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Lançando Chrome no display :99...');
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--display=:99', '--window-size=1366,900'],
    });
    console.log('SUCESSO: Chrome abriu no display :99!');
    const page = await browser.newPage();
    await page.goto('https://google.com', { waitUntil: 'networkidle2', timeout: 15000 });
    console.log('SUCESSO: Navegou para google.com');
    await browser.close();
    console.log('SUCESSO: Browser fechado corretamente.');
    process.exit(0);
  } catch (err) {
    console.error('FALHA:', err.message);
    process.exit(1);
  }
})();
TESTEOF

cd "$(dirname "$0")/.." 2>/dev/null || cd /root/A.CERT 2>/dev/null || true

if node /tmp/acert-vnc-test.cjs 2>&1; then
  pass "Teste Puppeteer + Xvfb: SUCESSO!"
else
  fail "Teste Puppeteer + Xvfb: FALHOU!"
  info "Isso explica por que o display remoto não aparece."
  FAILS=$((FAILS + 1))
fi

# ============================================================
section "8. .env"
# ============================================================
if [ -f .env ]; then
  pass ".env encontrado"
  echo ""
  info "Configurações relevantes:"
  grep -E "PUPPETEER_HEADLESS|DISPLAY_POOL|VNC_START|DISPLAY" .env 2>/dev/null || warn "Variáveis VNC não encontradas no .env"
  
  if grep -q "PUPPETEER_HEADLESS=true" .env 2>/dev/null; then
    fail "PUPPETEER_HEADLESS=true — vai abrir Chrome em modo headless!"
    warn "Isso impede o VNC de capturar a tela. Mude para: PUPPETEER_HEADLESS=false"
    FAILS=$((FAILS + 1))
  elif grep -q "PUPPETEER_HEADLESS=false" .env 2>/dev/null; then
    pass "PUPPETEER_HEADLESS=false OK"
  else
    warn "PUPPETEER_HEADLESS não configurado no .env"
  fi
else
  fail ".env não encontrado!"
  FAILS=$((FAILS + 1))
fi

# ============================================================
section "9. LOGS RECENTES DO SERVIDOR"
# ============================================================
if command -v pm2 &>/dev/null; then
  echo "Últimas 30 linhas do log PM2 (procure por 'DisplayPool' ou 'Failed to launch'):"
  pm2 logs --nostream --lines 30 2>/dev/null | grep -iE "display|pool|vnc|launch|error|fail" || echo "  (sem entradas relevantes)"
fi

# Journal
echo ""
echo "Últimas entradas do journal para xvfb:"
journalctl -u xvfb --no-pager -n 5 2>/dev/null || echo "  (não disponível)"

echo ""
echo "Últimas entradas do journal para x11vnc-99:"
journalctl -u x11vnc-99 --no-pager -n 5 2>/dev/null || echo "  (não disponível)"

# ============================================================
section "RESULTADO"
# ============================================================
if [ "$FAILS" -eq 0 ]; then
  echo -e "${GREEN}Tudo OK! ($FAILS falhas)${NC}"
  echo ""
  echo "Se o display remoto ainda não aparece, verifique:"
  echo "  1. O servidor A.CERT foi reiniciado após aplicar correções?"
  echo "  2. Tente acessar: https://acert.tech/novnc/viewer.html?displayId=display-99&port=5901&autoconnect=1"
  echo "  3. Verifique o console do navegador (F12) para erros de WebSocket"
else
  echo -e "${RED}Encontradas $FAILS falhas!${NC}"
  echo ""
  echo "Ações recomendadas:"
  echo "  1. Rode: bash scripts/fix-headless.sh"
  echo "  2. Rode: bash scripts/setup-vnc.sh"
  echo "  3. Reinicie a aplicação: pm2 restart a-cert (ou o nome do processo)"
  echo "  4. Teste novamente com este script"
fi

rm -f /tmp/acert-vnc-test.cjs
