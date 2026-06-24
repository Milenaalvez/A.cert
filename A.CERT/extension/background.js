// A.CERT Background Service Worker
// Fila sequencial de certidões + captura de PDFs

const BACKEND = "http://localhost:3001";
let certQueue: { key: string; label: string; url: string }[] = [];
let currentCertKey: string | null = null;
let currentTabId: number | null = null;
let processing = false;
let senderPort: any = null;

// ── Mensagens ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Start sequential cert flow
  if (msg.type === "START_CERT_FLOW") {
    certQueue = msg.certs || [];
    senderPort = sender;
    processing = true;
    processNextCert();
    sendResponse({ ok: true });
    return true;
  }

  // Content script signals cert form filled
  if (msg.type === "CERT_FORM_FILLED") {
    currentCertKey = msg.certKey;
    // Wait for PDF download to complete
    sendResponse({ ok: true });
  }

  // Content script signals done (manual close)
  if (msg.type === "CERT_DONE") {
    if (currentTabId) {
      chrome.tabs.remove(currentTabId);
      currentTabId = null;
    }
    currentCertKey = null;
    // Ingest cert
    ingestCert(msg.certKey, msg.dossierId);
    setTimeout(() => processNextCert(), 500);
    sendResponse({ ok: true });
  }

  // Screenshot when restriction detected
  if (msg.type === "SCREENSHOT") {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" }, (dataUrl) => {
      if (dataUrl) {
        chrome.storage.local.get("acert_ext_data", (d) => {
          const dossierId = d.acert_ext_data?.acert_dossier_id;
          if (dossierId) {
            ingestCert(msg.certKey, dossierId);
          }
        });
      }
    });
    return true;
  }
});

// ── Processar próxima certidão na fila ──
function processNextCert() {
  if (!processing || certQueue.length === 0) {
    // All done — notify page
    if (senderPort?.tab) {
      chrome.tabs.sendMessage(senderPort.tab.id, { type: "CERT_FLOW_COMPLETE" }).catch(() => {});
    }
    // Also try runtime
    chrome.runtime.sendMessage({ type: "CERT_FLOW_COMPLETE" }).catch(() => {});
    processing = false;
    senderPort = null;
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "A.CERT",
      message: "Todas as certidões foram processadas!"
    });
    return;
  }

  const cert = certQueue.shift()!;
  currentCertKey = cert.key;

  // Store cert key for content scripts
  chrome.storage.local.set({ acert_cert_key: cert.key, acert_cert_label: cert.label });

  // Open cert site in new tab
  chrome.tabs.create({ url: cert.url, active: true }, (tab) => {
    currentTabId = tab.id || null;

    // Auto-close after 25 seconds if not done yet (fallback)
    setTimeout(() => {
      if (currentTabId === tab.id) {
        // Tab still open — close it and move on
        if (tab.id) chrome.tabs.remove(tab.id).catch(() => {});
        currentTabId = null;
        ingestCert(cert.key, "");
        processNextCert();
      }
    }, 25000);
  });
}

// ── Ingest certidão no backend ──
async function ingestCert(certKey: string, dossierId: string) {
  try {
    await fetch(`${BACKEND}/api/dossiers/${dossierId || "unknown"}/certificates/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cert_key: certKey }),
    });
    console.log(`A.CERT: ${certKey} ingested`);
  } catch (err) {
    console.error(`A.CERT: Failed to ingest ${certKey}`, err);
  }
}

// ── Captura de downloads PDF ──
chrome.downloads.onChanged.addListener(async (delta) => {
  if (delta.state && delta.state.current === "complete" && currentCertKey) {
    const [download] = await chrome.downloads.search({ id: delta.id });
    if (download && download.filename.endsWith(".pdf")) {
      // PDF captured — close tab and move to next
      if (currentTabId) {
        chrome.tabs.remove(currentTabId).catch(() => {});
        currentTabId = null;
      }
      const certKey = currentCertKey;
      currentCertKey = null;

      // Get dossier ID from storage
      const stored = await chrome.storage.local.get("acert_ext_data");
      const dossierId = stored.acert_ext_data?.acert_dossier_id || "";
      ingestCert(certKey, dossierId);

      // Process next
      setTimeout(() => processNextCert(), 800);
    }
  }
});

// Storage token from page
chrome.storage.local.get("acert_token", (result) => {
  if (!result.acert_token) {
    console.log("A.CERT: No token stored yet.");
  }
});
