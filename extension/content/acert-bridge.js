// A.CERT Bridge — reads localStorage and pushes to chrome.storage immediately
(function() {
  const pushData = () => {
    try {
      const extData = localStorage.getItem("acert_ext_data");
      const certKey = localStorage.getItem("acert_cert_key");
      const token = localStorage.getItem("acert_token");
      
      const updates: Record<string, any> = {};
      if (extData) {
        const data = JSON.parse(extData);
        if (data.acert_person) updates.acert_person = data.acert_person;
        if (data.acert_property) updates.acert_property = data.acert_property;
        if (data.acert_dossier_id) updates.acert_dossier_id = data.acert_dossier_id;
      }
      if (certKey) updates.acert_cert_key = certKey;
      if (token) updates.acert_token = token;
      
      if (Object.keys(updates).length > 0) {
        chrome.storage.local.set(updates);
      }
    } catch (e) {}
  };

  // Push immediately
  pushData();

  // Also push on any storage change
  window.addEventListener("storage", pushData);

  // Keep polling every 500ms while on A.CERT pages
  setInterval(pushData, 500);
})();
