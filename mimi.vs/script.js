
// TEXTO DIGITANDO COM CURSOR
const text = "Milena de Oliveira Alves";
let index = 0;

function typing() {
  if (index < text.length) {
    document.getElementById("typing").innerHTML += text.charAt(index);
    index++;
    setTimeout(typing, 80);
  }
}
typing();

// DARK MODE
const button = document.getElementById("toggle-dark");
button.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  button.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// ANIMAÇÃO AO ROLAR (fade-in)
const elements = document.querySelectorAll(".hidden");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});
elements.forEach(el => observer.observe(el));

// ANIMAÇÃO DAS HABILIDADES (progress bars)
const skills = document.querySelectorAll(".progress");
const skillsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});
skills.forEach(skill => skillsObserver.observe(skill));

// BOTÃO VOLTAR AO TOPO (aparece só quando rolar)
const topBtn = document.getElementById("topBtn");
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    topBtn.style.display = "block";
  } else {
    topBtn.style.display = "none";
  }
});

topBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});
