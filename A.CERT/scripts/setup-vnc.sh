#!/bin/bash
# ============================================================
# setup-vnc.sh — Instala e configura Xvfb + x11vnc permanentes
# para os displays :99, :100, :101 (portas VNC 5901, 5902, 5903)
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[setup-vnc]${NC} $1"; }
warn() { echo -e "${YELLOW}[setup-vnc]${NC} $1"; }
err()  { echo -e "${RED}[setup-vnc]${NC} $1"; }

MUST_RESTART_XVFB=false

# ============================================================
# PASSO 1: Instalar dependencias
# ============================================================
log "Instalando x11vnc e Xvfb..."
apt-get update -qq
apt-get install -y -qq x11vnc xvfb 2>&1 | tail -1
log "Dependencias instaladas."

# ============================================================
# PASSO 2: Criar servico Xvfb (3 displays)
# ============================================================
log "Configurando Xvfb systemd service..."

cat > /etc/systemd/system/xvfb.service << 'XEOF'
[Unit]
Description=Xvfb Virtual Displays (:99, :100, :101)
After=network.target

[Service]
Type=simple
ExecStartPre=/bin/bash -c 'for d in 99 100 101; do pgrep -f "Xvfb :${d}" && kill $(pgrep -f "Xvfb :${d}") 2>/dev/null; done; sleep 1'
ExecStart=/bin/bash -c '\
  /usr/bin/Xvfb :99 -screen 0 1366x768x24 +extension RANDR -ac & \
  /usr/bin/Xvfb :100 -screen 0 1366x768x24 +extension RANDR -ac & \
  /usr/bin/Xvfb :101 -screen 0 1366x768x24 +extension RANDR -ac & \
  wait'
ExecStop=/bin/bash -c 'for d in 99 100 101; do pgrep -f "Xvfb :${d}" && kill $(pgrep -f "Xvfb :${d}") 2>/dev/null; done'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
XEOF

systemctl daemon-reload
systemctl enable xvfb

if systemctl is-active --quiet xvfb; then
  warn "Xvfb ja esta rodando. Reiniciando..."
  systemctl restart xvfb
else
  systemctl start xvfb
fi

sleep 2
if systemctl is-active --quiet xvfb; then
  log "Xvfb OK (displays :99, :100, :101)"
else
  err "Xvfb FALHOU ao iniciar. Verifique: journalctl -u xvfb"
  exit 1
fi

# ============================================================
# PASSO 3: Criar servicos x11vnc (um por display)
# ============================================================
log "Configurando x11vnc services..."

for DISPLAY_NUM in 99 100 101; do
  VNC_PORT=$((5900 + DISPLAY_NUM - 98))

  cat > /etc/systemd/system/x11vnc-${DISPLAY_NUM}.service << XEOF
[Unit]
Description=x11vnc on display :${DISPLAY_NUM} (port ${VNC_PORT})
After=xvfb.service
Requires=xvfb.service

[Service]
Type=simple
ExecStartPre=/bin/sleep 2
ExecStart=/usr/bin/x11vnc \
  -display :${DISPLAY_NUM} \
  -rfbport ${VNC_PORT} \
  -forever \
  -shared \
  -nopw \
  -noxdamage \
  -noxfixes \
  -noshm \
  -wait 5 \
  -defer 5
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
XEOF

  systemctl daemon-reload
  systemctl enable x11vnc-${DISPLAY_NUM}

  if systemctl is-active --quiet x11vnc-${DISPLAY_NUM}; then
    warn "x11vnc-${DISPLAY_NUM} ja rodando. Reiniciando..."
    systemctl restart x11vnc-${DISPLAY_NUM}
  else
    systemctl start x11vnc-${DISPLAY_NUM}
  fi

  sleep 1
  if systemctl is-active --quiet x11vnc-${DISPLAY_NUM}; then
    log "x11vnc-${DISPLAY_NUM} OK (display :${DISPLAY_NUM}, porta ${VNC_PORT})"
  else
    err "x11vnc-${DISPLAY_NUM} FALHOU. Verifique: journalctl -u x11vnc-${DISPLAY_NUM}"
  fi
done

# ============================================================
# PASSO 4: Verificacao final
# ============================================================
log "============================================"
log "Verificacao final:"
log ""

for DISPLAY_NUM in 99 100 101; do
  if systemctl is-active --quiet x11vnc-${DISPLAY_NUM}; then
    log "  Display :${DISPLAY_NUM} → porta $((5900 + DISPLAY_NUM - 98)) ✓"
  else
    err "  Display :${DISPLAY_NUM} → FALHOU ✗"
  fi
done

log ""
log "Acesse via navegador: https://acert.tech/novnc/viewer.html"
log "Comandos uteis:"
log "  systemctl status xvfb x11vnc-99 x11vnc-100 x11vnc-101"
log "  journalctl -u xvfb -f"
log "  journalctl -u x11vnc-99 -f"
log "============================================"
log "Setup concluido!"
