# .vscode — Monorepo de Projetos

Repositório contendo projetos desenvolvidos durante a jornada de aprendizado e profissional em desenvolvimento web full-stack.

---

## Projetos

### [Chronos](./chronos/) — Gestão de Pessoal

Sistema completo de controle de ponto eletrônico com verificação facial, geolocalização, central de solicitações e notificações automatizadas.

**Stack:** React 19, Vite 8, Express 5, TypeScript, Prisma 7, PostgreSQL, Tailwind CSS 3

- Registro de ponto com biometria facial (face-api.js)
- Gestão de equipe com RBAC (DEVELOPER, ADMIN, RH, EMPLOYEE)
- Central de solicitações com fluxo de aprovação
- Relatórios mensais com exportação PDF/XLSX
- Notificações inteligentes com scheduler
- Calendário interativo com FullCalendar
- Autenticação JWT + Google OAuth (Supabase Auth)
- Deploy: Frontend → Vercel | Backend → Render (Docker)

[README completo →](./chronos/README.md)

---

### [A.CERT](./A.CERT/) — Central de Certidões (DONNOS Docs)

Plataforma de automação de certidões imobiliárias com Puppeteer, consolidando consultas a 7 órgãos públicos brasileiros em dossiê PDF. Inclui dashboard Next.js e sistema interno de gestão de equipe.

**Stack:** Express 5, Next.js 15, React 19, TypeScript, SQLite, Puppeteer, Electron

- Automação de 7 órgãos (RF, TRF1, TJDFT, TRT, TST, SEFAZ-DF, ONR)
- CAPTCHA interativo com suporte a hCaptcha/reCAPTCHA
- Dossiê PDF consolidado com pdf-lib
- Dashboard administrativo com Next.js 15
- Gestão de equipe com RBAC (14 permissões)
- App desktop Windows via Electron
- Extensão Chrome Manifest V3

[README completo →](./A.CERT/README.md)

---

### [Milena Portfolio](./milena-portfolio/)

Portfólio profissional com tema cyberpunk/HUD futurista, desenvolvido em React + TypeScript + Vite.

**Stack:** React 19, Vite 8, TypeScript, Tailwind CSS 4

- Design inspirado em HUD futurista com efeitos holográficos
- Seções: Sobre, Experiência, Projetos, Ferramentas, Contato
- Modal interativo com informações detalhadas de tecnologias
- Animações e partículas com tema cyberpunk
- Responsivo e moderno
- Deploy: GitHub Pages (`gh-pages`)

[README completo →](./milena-portfolio/README.md)

---

### [MAVIE](./projetos%20alura/) — Interface de Streaming

Interface de catálogo de filmes estilo Netflix com integração à API TMDB, desenvolvido durante o curso da Alura.

**Stack:** HTML5, CSS3, JavaScript Vanilla, TMDB API v3

- Seleção de perfil com avatares
- Catálogo dinâmico via TMDB (populares, em breve, em cartaz)
- Banner hero com backdrop aleatório
- Modal de detalhes com trailer do YouTube
- Busca ao vivo e carrosséis horizontais

[README completo →](./projetos%20alura/README.md)

---

### [Fundação Bradesco](./projetos/funda%C3%A7%C3%A3o%20bradesco/)

Projeto simples desenvolvido no curso da Fundação Bradesco, utilizando HTML, CSS e JavaScript.

[README →](./projetos/funda%C3%A7%C3%A3o%20bradesco/README.md)

---

## Estrutura do Monorepo

```
.
├── chronos/                    # Sistema de ponto eletrônico (React + Express)
├── A.CERT/                     # Central de Certidões (Express + Next.js + Electron)
├── milena-portfolio/           # Portfólio profissional (React)
├── projetos alura/             # MAVIE — Interface de streaming (Vanilla)
├── projetos/
│   └── fundação bradesco/      # Exercício de curso (Vanilla)
├── ARCHITECTURE.md             # Documentação de arquitetura completa
├── .gitignore
└── README.md
```

## Arquitetura Geral

Consulte o [ARCHITECTURE.md](./ARCHITECTURE.md) para a visão completa da arquitetura, fluxos de dados e relações entre os projetos.

## Licença

Projetos privados — uso interno e acadêmico.
