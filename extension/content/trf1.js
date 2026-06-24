// TRF1 — Preenche CPF + seleciona órgão
(function() {
  let attempts = 0;
  const maxAttempts = 10;

  const fillTRF1 = () => {
    attempts++;
    chrome.storage.local.get(["acert_person", "acert_cert_key"], (data) => {
      const p = data.acert_person;
      if (!p) {
        if (attempts < maxAttempts) setTimeout(fillTRF1, 800);
        return;
      }

      const cpfInput = document.querySelector('input[type="text"], input[placeholder*="CPF"], input[name*="cpf"]');
      if (cpfInput) {
        cpfInput.value = p.cpf || "";
        cpfInput.dispatchEvent(new Event("input", { bubbles: true }));
        cpfInput.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const selects = document.querySelectorAll("select");
      selects.forEach(sel => {
        const options = sel.querySelectorAll("option");
        options.forEach(opt => {
          if (opt.textContent.includes("SEÇÃO JUDICIÁRIA DO DF") || opt.textContent.includes("SEÇÃO JUDICIÁRIA DF")) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      });

      const isCriminal = data.acert_cert_key === "TRF1_CRIMINAL";
      if (isCriminal) {
        selects.forEach(sel => {
          const options = sel.querySelectorAll("option");
          options.forEach(opt => {
            if (opt.textContent.includes("TRIBUNAL REGIONAL FEDERAL") || opt.textContent.includes("TRF 1")) {
              sel.value = opt.value;
              sel.dispatchEvent(new Event("change", { bubbles: true }));
            }
          });
        });
      }

      console.log("A.CERT: TRF1 form filled ✅");
    });
  };

  fillTRF1();
})();
