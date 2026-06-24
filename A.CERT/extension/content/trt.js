// TRT — CPF ou nome
(function() {
  let attempts = 0;
  const maxAttempts = 10;

  const fill = () => {
    attempts++;
    chrome.storage.local.get("acert_person", (data) => {
      const p = data.acert_person;
      if (!p) { if (attempts < maxAttempts) setTimeout(fill, 800); return; }

      const emitButtons = document.querySelectorAll('a, button, input[type="button"]');
      emitButtons.forEach(btn => {
        if ((btn.textContent || btn.value || "").includes("Emissão de Certidão")) btn.click();
      });

      setTimeout(() => {
        document.querySelectorAll('input[type="text"], input:not([type])').forEach(inp => {
          const name = (inp.name || "").toLowerCase();
          if (name.includes("cpf")) { inp.value = p.cpf || ""; inp.dispatchEvent(new Event("input", { bubbles: true })); }
          else if (name.includes("nome")) { inp.value = p.name || ""; inp.dispatchEvent(new Event("input", { bubbles: true })); }
        });
        console.log("A.CERT: TRT filled ✅");
      }, 1000);
    });
  };

  setTimeout(fill, 1500);
})();
