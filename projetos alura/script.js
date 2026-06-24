document.addEventListener("DOMContentLoaded", () => {

    const loader = document.getElementById("loader");
    if (loader) {
        loader.classList.add("hidden");
        setTimeout(() => { loader.style.display = "none"; }, 500);
    }

    const perfis = document.querySelectorAll('.perfil');

    perfis.forEach(botao => {
        botao.addEventListener('click', () => {

            const nome = botao.querySelector('figcaption')?.innerText;
            const img = botao.querySelector('img')?.src;

            // segurança (evita bug se algo faltar)
            if (!nome || !img) return;

            // 💾 salvar perfil
            localStorage.setItem('perfil', nome);
            localStorage.setItem('perfilImg', img);

            // 🔊 som
            const som = document.getElementById('clickSound');
            if (som) {
                som.currentTime = 0;
                som.play().catch(() => {});
            }

            // 🚀 redireciona
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1300);
        });
    })

});