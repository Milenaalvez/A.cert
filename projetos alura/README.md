# MAVIE — Interface de Streaming de Filmes

Projeto de interface de streaming estilo Netflix desenvolvido durante o curso da Alura, com integração à API do TMDB.

---

## Stack

| Camada | Tecnologia |
|---|---|
| **Linguagens** | HTML5, CSS3, JavaScript Vanilla |
| **API** | The Movie Database (TMDB) API v3 |
| **Fontes** | Google Fonts (Inter, Poppins) |
| **Design** | Tema escuro com accent violeta (#A855F7) |

---

## Funcionalidades

- **Seleção de perfil**: 4 perfis com avatar, som de clique, armazenamento em localStorage
- **Catálogo dinâmico**: Filmes populares, mais votados, em breve e em cartaz via TMDB
- **Banner hero**: Banner aleatório com backdrop de filme popular
- **Modal de detalhes**: Trailer do YouTube com autoplay via TMDB videos endpoint
- **Busca**: Pesquisa ao vivo com resultados instantâneos
- **Carrosséis**: Navegação horizontal com setas
- **Responsivo**: Menu hamburger mobile

---

## Estrutura

```
projetos alura/
├── index.html      # Tela de seleção de perfil
├── home.html       # Página principal do catálogo
├── style.css       # Estilos completos (1130 linhas)
├── script.js       # Lógica de seleção de perfil
├── home.js         # Integração TMDB + carrosséis + busca
├── click.mp3       # Som de clique nos perfis
└── img/
    ├── usuario1.png  # Perfil: Milena
    ├── usuario2.png  # Perfil: Gabriel
    ├── usuario3.png  # Perfil: Larissa
    └── usuario4.png  # Perfil: Ana
```

---

## Como Rodar

Abra `index.html` em qualquer navegador.

> Requer chave da API TMDB configurada em `home.js`.
