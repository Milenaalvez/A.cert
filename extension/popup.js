document.getElementById("openDossies").addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:3000/dashboard/dossies" });
});

document.getElementById("checkStatus").addEventListener("click", () => {
  document.getElementById("status").innerHTML = '<span class="active">Extensão ativa</span>';
});
