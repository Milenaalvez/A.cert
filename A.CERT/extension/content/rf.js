// RF — Receita Federal: CPF + clica aviso
(function() {
  let attempts = 0;
  const maxAttempts = 10;

  const fill = () => {
    attempts++;
    chrome.storage.local.get("acert_person", (data) => {
      const p = data.acert_person;
      if (!p) { if (attempts < maxAttempts) setTimeout(fill, 800); return; }

      document.querySelectorAll('input[type="text"], input:not([type])').forEach(inp => {
        if ((inp.name || inp.placeholder || "").toLowerCase().includes("cpf") || (inp.name || inp.placeholder || "").toLowerCase().includes("documento")) {
          inp.value = p.cpf || p.cnpj || "";
          inp.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      setTimeout(() => {
        document.querySelectorAll("a, button").forEach(link => {
          const text = (link.textContent || "").toLowerCase();
          if (text.includes("clicar aqui") || text.includes("aviso") || text.includes("prosseguir")) link.click();
        });
      }, 1500);
      console.log("A.CERT: RF filled ✅");
    });
  };

  setTimeout(fill, 2000);
})();
