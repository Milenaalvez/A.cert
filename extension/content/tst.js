// TST — Aceita cookies + CPF/CNPJ
(function() {
  let attempts = 0;
  const maxAttempts = 10;

  const fill = () => {
    attempts++;
    chrome.storage.local.get("acert_person", (data) => {
      const p = data.acert_person;
      if (!p) { if (attempts < maxAttempts) setTimeout(fill, 800); return; }

      const cookieBtn = document.querySelector('button[aria-label*="Aceitar"], .cookie-accept, button:has(span:contains("Aceitar"))');
      if (cookieBtn) cookieBtn.click();

      const input = document.querySelector('input[type="text"], input[placeholder*="CPF"], input[placeholder*="CNPJ"]');
      if (input) {
        input.value = p.cpf || p.cnpj || "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      console.log("A.CERT: TST filled ✅");
    });
  };

  setTimeout(fill, 2000);
})();
