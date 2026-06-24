// Detector de restrições e pendências — monitora o DOM por palavras-chave
(function() {
  const RESTRICAO_KEYWORDS = [
    "restrição", "débito", "impedimento", "pendência", "protesto",
    "ação judicial", "execução fiscal", "bloqueio", "indisponibilidade"
  ];

  const checkForRestrictions = () => {
    const bodyText = document.body.innerText.toLowerCase();
    const found = RESTRICAO_KEYWORDS.some(kw => bodyText.includes(kw));

    if (found && !bodyText.includes("nada consta")) {
      chrome.storage.local.get(["acert_cert_key", "acert_dossier_id"], (data) => {
        if (data.acert_cert_key && data.acert_dossier_id) {
          // Send screenshot
          chrome.runtime.sendMessage({
            type: "SCREENSHOT",
            certKey: data.acert_cert_key,
            dossierId: data.acert_dossier_id
          });

          // Show alert banner on page
          const banner = document.createElement("div");
          banner.id = "acert-alert";
          banner.innerHTML = `⚠️ A.CERT detectou restrição nesta certidão. Um screenshot foi enviado automaticamente.`;
          banner.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
            background: #FEF2F2; color: #DC2626; padding: 12px 20px;
            font-family: Arial, sans-serif; font-size: 14px; font-weight: 600;
            text-align: center; border-bottom: 2px solid #DC2626;
          `;
          document.body.prepend(banner);
        }
      });
    }
  };

  // Check after page loads
  setTimeout(checkForRestrictions, 3000);

  // Also check periodically for AJAX-loaded content
  setInterval(checkForRestrictions, 8000);
})();
