// ONR — Login → Novo Pedido → DF → cartório → matrícula → crédito
(function() {
  const fillONR = () => {
    setTimeout(() => {
      chrome.storage.local.get(["acert_property", "acert_person"], (data) => {
        const prop = data.acert_property;
        if (!prop) return;

        // If login page: fill credentials
        const emailInput = document.querySelector('input[type="email"], input[name*="email"], input[placeholder*="e-mail"]');
        const senhaInput = document.querySelector('input[type="password"], input[name*="senha"]');
        if (emailInput && senhaInput) {
          emailInput.value = "vendas@blocoimob.com.br";
          senhaInput.value = "Bloco100%";
          emailInput.dispatchEvent(new Event("input", { bubbles: true }));
          senhaInput.dispatchEvent(new Event("input", { bubbles: true }));

          // Click login button
          setTimeout(() => {
            const loginBtn = document.querySelector('button[type="submit"], input[type="submit"], button:contains("Entrar"), button:contains("Acessar")');
            if (loginBtn) loginBtn.click();
          }, 500);

          return; // Don't proceed further on login page
        }

        // Already logged in — navigate to Novo Pedido
        const buttons = document.querySelectorAll("a, button");
        buttons.forEach(btn => {
          const text = (btn.textContent || "").trim();
          if (text.includes("Novo Pedido") || text.includes("NOVO PEDIDO")) {
            btn.click();
          }
        });

        // Wait for Novo Pedido page, then:
        setTimeout(() => {
          // Click DF on the map
          const dfElement = document.querySelector('[title*="Distrito Federal"], [data-uf="DF"], area[alt*="DF"]');
          if (dfElement) dfElement.click();

          // Check "li e concordo"
          setTimeout(() => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
              if (!cb.checked) cb.click();
            });

            // Click "Prosseguir"
            const prosseguir = Array.from(document.querySelectorAll("button")).find(b =>
              b.textContent.includes("Prosseguir") || b.textContent.includes("PROSSEGUIR")
            );
            if (prosseguir) prosseguir.click();

            // Fill city, cartório, matrícula on next page
            setTimeout(() => {
              const allInputs = document.querySelectorAll("input[type=\"text\"], input:not([type]), select");
              allInputs.forEach(inp => {
                const label = inp.closest("label")?.textContent || inp.previousElementSibling?.textContent || "";
                const l = label.toLowerCase();
                if (l.includes("cidade") && prop.city) {
                  inp.value = prop.city;
                  inp.dispatchEvent(new Event("input", { bubbles: true }));
                } else if (l.includes("cartório") && prop.cartorio) {
                  inp.value = prop.cartorio;
                  inp.dispatchEvent(new Event("input", { bubbles: true }));
                } else if (l.includes("matrícula") && prop.registration) {
                  inp.value = prop.registration;
                  inp.dispatchEvent(new Event("input", { bubbles: true }));
                }
              });

              // Select "Matrícula inteiro teor"
              const selects = document.querySelectorAll("select");
              selects.forEach(sel => {
                const options = sel.querySelectorAll("option");
                options.forEach(opt => {
                  if (opt.textContent.includes("inteiro teor") || opt.textContent.includes("Inteiro Teor")) {
                    sel.value = opt.value;
                    sel.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                });
              });

              // Select "não desejo declarar finalidade"
              selects.forEach(sel => {
                const options = sel.querySelectorAll("option");
                options.forEach(opt => {
                  if (opt.textContent.includes("não desejo") || opt.textContent.includes("Não desejo")) {
                    sel.value = opt.value;
                    sel.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                });
              });

              // Select "utilizar crédito" as payment
              setTimeout(() => {
                const creditos = document.querySelectorAll("input[type=\"radio\"], label");
                creditos.forEach(el => {
                  const text = (el.textContent || "").toLowerCase();
                  if (text.includes("utilizar crédito") || text.includes("crédito")) {
                    el.click();
                  }
                });
              }, 1000);

            }, 2000);
          }, 1500);
        }, 2000);

        console.log("A.CERT: ONR flow executing");
      });
    }, 2500);
  };

  fillONR();
})();
