// TJDFT — CPF + nome + mãe + pai + Especial
(function() {
  let attempts = 0;
  const maxAttempts = 10;

  const fill = () => {
    attempts++;
    chrome.storage.local.get("acert_person", (data) => {
      const p = data.acert_person;
      if (!p) { if (attempts < maxAttempts) setTimeout(fill, 800); return; }

      document.querySelectorAll("label").forEach(label => {
        const text = label.textContent.toLowerCase();
        const input = label.nextElementSibling || label.parentElement.querySelector("input");
        if (!input) return;
        if (text.includes("cpf")) { input.value = p.cpf || ""; input.dispatchEvent(new Event("input", { bubbles: true })); }
        else if (text.includes("nome") && !text.includes("mãe") && !text.includes("pai")) { input.value = p.name || ""; input.dispatchEvent(new Event("input", { bubbles: true })); }
        else if (text.includes("mãe") || text.includes("mae")) { input.value = p.mother_name || ""; input.dispatchEvent(new Event("input", { bubbles: true })); }
        else if (text.includes("pai")) { input.value = p.father_name || ""; input.dispatchEvent(new Event("input", { bubbles: true })); }
      });

      document.querySelectorAll("select").forEach(sel => {
        sel.querySelectorAll("option").forEach(opt => {
          if (opt.textContent.includes("Especial")) { sel.value = opt.value; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        });
      });
      console.log("A.CERT: TJDFT filled ✅");
    });
  };

  setTimeout(fill, 2000);
})();
