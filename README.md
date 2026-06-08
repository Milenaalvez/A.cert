# .vscode — Monorepo de Projetos

Repositório contendo projetos desenvolvidos durante a jornada de aprendizado em desenvolvimento web.

---

## Projetos

### [Chronos](./chronos/) — Gestão de Pessoas

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

### [Fundação Bradesco](./projetos/funda%C3%A7%C3%A3o%20bradesco/)

Projeto simples desenvolvido no curso da Fundação Bradesco, utilizando HTML, CSS e JavaScript.

---

## Estrutura

```
.
├── chronos/                  # Sistema de ponto eletrônico
├── milena-portfolio/         # Portfólio profissional
├── projetos/
│   └── fundação bradesco/    # Exercício de curso
├── .gitignore
└── README.md
```

## Licença

Projetos privados — uso interno e acadêmico.
