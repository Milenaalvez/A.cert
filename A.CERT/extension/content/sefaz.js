// SEFAZ-DF — PF/PJ/Imóvel: preenche CPF/CNPJ/inscrição + seleciona LAVRADURA PÚBLICA
(function() {
  const fillSEFAZ = () => {
    setTimeout(() => {
      chrome.storage.local.get(["acert_person", "acert_cert_key", "acert_property"], (data) => {
        const p = data.acert_person;
        const prop = data.acert_property;
        const certKey = data.acert_cert_key;

        if (!p && !prop) return;

        // Ficha Cadastral?
        if (window.location.href.includes("FichaCadastral") || certKey === "FICHA_CADASTRAL") {
          const inscricaoInput = document.querySelector('input[type="text"], input');
          if (inscricaoInput && prop?.registration) {
            inscricaoInput.value = prop.registration;
            inscricaoInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
          return;
        }

        // Main certidão page - generic fill
        const inputs = document.querySelectorAll("input[type=\"text\"], input:not([type])");
        inputs.forEach(inp => {
          const name = (inp.name || inp.placeholder || "").toLowerCase();
          if (name.includes("cpf") && certKey !== "SEFAZ_PJ" && certKey !== "SEFAZ_IMOVEL") {
            inp.value = p?.cpf || "";
          } else if ((name.includes("cnpj") || certKey === "SEFAZ_PJ") && p?.cnpj) {
            inp.value = p.cnpj || "";
          } else if ((name.includes("inscri") || name.includes("iptu") || certKey === "SEFAZ_IMOVEL") && prop?.registration) {
            inp.value = prop.registration;
          }
          inp.dispatchEvent(new Event("input", { bubbles: true }));
          inp.dispatchEvent(new Event("change", { bubbles: true }));
        });

        // Select "LAVRADURA PÚBLICA" or "LAVRAR ESCRITURA PÚBLICA" in finalidade
        const selects = document.querySelectorAll("select");
        selects.forEach(sel => {
          const options = sel.querySelectorAll("option");
          options.forEach(opt => {
            const text = opt.textContent.toUpperCase();
            if (text.includes("LAVRADURA") || text.includes("LAVRAR ESCRITURA")) {
              sel.value = opt.value;
              sel.dispatchEvent(new Event("change", { bubbles: true }));
            }
          });
        });

        // Click "Gerar PDF" / "Gerar" button if visible
        setTimeout(() => {
          const buttons = document.querySelectorAll("button, a, input[type=\"submit\"]");
          buttons.forEach(btn => {
            const text = (btn.textContent || btn.value || "").toUpperCase();
            if (text.includes("GERAR")) {
              btn.click();
            }
          });
        }, 1000);

        console.log("A.CERT: SEFAZ-DF form filled");
      });
    }, 2000);
  };

  fillSEFAZ();
})();
