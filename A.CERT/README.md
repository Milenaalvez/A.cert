# A.CERT — Central de Certidões Imobiliárias

Plataforma completa de automação de certidões imobiliárias com gestão interna de equipe, desenvolvida em TypeScript.

---

## Sobre o Projeto

A A.CERT automatiza consultas a **7 órgãos públicos brasileiros** para emissão de certidões imobiliárias e cíveis. O sistema realiza consultas via Puppeteer, gerencia CAPTCHAs interativos e consolida os resultados em um dossiê PDF profissional.

A partir da versão 1.1, o fluxo de dossiês foi reestruturado com suporte a **múltiplos participantes** (proprietários, comprador, vendedor, locador, locatário), **tipos de transação** (venda ou locação) e **emissão de certidões por pessoa**, garantindo que cada participante tenha suas certidões organizadas separadamente dentro do mesmo dossiê.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Backend** | Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL (pg) |
| **Frontend (Dashboard)** | Next.js 15, React 19, Tailwind CSS 4 |
| **Frontend (Público)** | HTML5, CSS3, JavaScript Vanilla |
| **Desktop** | Electron (NSIS installer) — congelado |
| **Browser Automation** | Puppeteer + puppeteer-extra (Stealth Plugin) |
| **PDF** | pdf-lib (dossiês), Puppeteer page.pdf() (captura) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Database** | PostgreSQL (pg) + Prisma Client para type-safe, raw SQL via pg Pool para queries complexas |
| **Email** | Nodemailer (SMTP) |
| **CAPTCHA** | svg-captcha (registro), hCaptcha/reCAPTCHA (órgãos) |
| **Extensão Chrome** | Manifest V3 |

---

## Arquitetura

```
A.CERT/
├── src/                          # Backend TypeScript
│   ├── server.ts                 # Entry point Express (porta 3001)
│   ├── database.ts               # Schema SQLite (21 tabelas) + seed — REMOVIDO (v1.2)
│   ├── connectors/               # Conectores por órgão (7 agências)
│   │   ├── receita-federal.connector.ts
│   │   ├── trf1.connector.ts     # TRF 1ª Região (Cível + Criminal)
│   │   ├── tjdft.connector.ts    # TJDFT
│   │   ├── trt.connector.ts      # TRT 10ª Região
│   │   ├── tst.connector.ts      # TST
│   │   ├── sefaz-df.connector.ts # SEFAZ-DF
│   │   └── onr.connector.ts      # ONR (Ônus Reais)
│   ├── services/
│   │   ├── orquestrador.service.ts   # Orquestração de consultas por pessoa
│   │   ├── captcha-manager.service.ts # Gerenciador de CAPTCHA
│   │   ├── dossie.service.ts         # Geração de dossiê PDF (organizado por pessoa)
│   │   └── email.service.ts          # Emails transacionais
│   ├── routes/                   # Rotas REST
│   │   ├── auth.ts               # /api/auth (login, registro, troca de senha)
│   │   ├── companies.ts          # /api/companies (gestão multiempresas)
│   │   ├── dashboard.ts          # /api/dashboard
│   │   ├── people.ts             # /api/people
│   │   ├── dossiers.ts           # /api/dossiers
│   │   ├── properties.ts         # /api/properties
│   │   ├── reports.ts            # /api/reports
│   │   ├── search.ts             # /api/search
│   │   ├── captcha.ts            # /api/captcha
│   │   ├── settings.ts           # /api/settings (config, backup, SMTP, auditoria)
│   │   ├── team.ts               # /api/team (RH interno)
│   │   ├── support.ts            # /api/support
│   │   └── trash.ts              # /api/trash (lixeira)
│   ├── middleware/
│   │   └── auth.ts               # JWT middleware
│   └── utils/
│       ├── browser.ts            # Puppeteer + Stealth
│       ├── captcha.ts            # Detecção de CAPTCHA
│       ├── dom-helper.ts         # Helper para formulários reativos
│       ├── retry-manager.service.ts
│       └── validation.ts         # CPF, CNPJ, email, etc.
├── frontend/                     # Next.js 15 Dashboard
│   └── src/
│       ├── components/           # 31+ componentes React
│       ├── contexts/
│       │   └── ThemeContext.tsx   # Tema claro/escuro
│       ├── lib/api.ts            # Cliente de autenticação
│       └── services/teamApi.ts   # API de gestão de equipe
├── electron/                     # Electron Desktop (congelado)
├── extension/                    # Extensão Chrome
│   ├── manifest.json             # Manifest V3
│   ├── background.js             # Service worker
│   └── content/                  # Content scripts por órgão
├── public/                       # Interface pública standalone
│   ├── index.html
│   ├── app.js
│   └── style.css
└── scripts/                      # Manutenção do banco
    ├── fix-db.mjs
    └── fix-dates.mjs
```

---

## Funcionalidades

### Automação de Certidões
- Consulta automatizada a 7 órgãos públicos (RF, TRF1, TJDFT, TRT, TST, SEFAZ-DF, ONR)
- Puppeteer com Stealth Plugin para evitar detecção
- CAPTCHA interativo (hCaptcha, reCAPTCHA, texto)
- Consolidação em dossiê PDF (capa, certidões por pessoa, sumário)
- Retry com backoff exponencial + jitter

### Novo Fluxo de Dossiê (v1.1)
- **Tipos de transação**: Venda ou Locação
- **Partes envolvidas**: múltiplos proprietários, comprador/vendedor (venda) ou locador/locatário (locação)
- **Imóvel com matrícula opcional**: checkbox que ativa certidões de ONR, matrícula e ficha cadastral
- **Emissão por pessoa**: cada participante tem suas certidões salvas com `person_id`
- **PDF organizado**: capa → seção por participante com certidões embedadas → resumo

### Gestão Interna (Dashboard)
- Dashboard com métricas agregadas
- CRUD de Pessoas com vínculo aos dossiês
- CRUD de Imóveis com categorias
- CRUD de Dossiês com participantes e templates de certidão
- Gestão de Usuários com perfis de acesso e permissões
- Central de Configurações (9 abas):
  - **Perfil**: avatar, dados pessoais, atividades recentes
  - **Geral**: fuso horário, formato de data/hora, preferências do sistema
  - **Segurança**: alteração de senha, sessões ativas
  - **Órgãos Integrados**: status, sincronização, tokens
  - **E-mail (SMTP)**: configuração e teste de conexão
  - **Templates PDF**: cores, logotipo, elementos dos documentos
  - **Backup**: gerar, baixar, restaurar e excluir backups
  - **Auditoria**: logs de ações com filtros por usuário/período
  - **Sistema**: versão, ambiente, banco de dados, uptime
- Relatórios exportáveis (PDF/CSV)
- Lixeira com restauração
- Busca global com contagem de participantes

### Multiempresas
- Cadastro manual de empresas pelo admin via `/api/companies`
- Geração de credenciais provisórias para o admin da empresa
- Logo customizada por empresa
- Configurações por empresa (`company_settings`)
- Controle de licença: plano, status (ativa/trial/expirada), data de expiração
- Reenvio de credenciais

### Autenticação
- Login/registro com JWT
- Troca de senha obrigatória no primeiro acesso (`password_change_required`)
- Confirmação de email
- Recuperação de senha
- CAPTCHA matemático no registro

---

## Banco de Dados

**PostgreSQL** com **Prisma ORM** (21 tabelas). Queries type-safe via Prisma Client, queries analíticas complexas via raw SQL com pool `pg`.

### Tabelas principais

- `users`, `persons`, `properties`, `dossiers`, `certificates`
- `dossier_participants` — vincula pessoas aos dossiês com papel (proprietario, comprador, vendedor, locador, locatario)
- `companies`, `company_settings` — multiempresas com configurações por empresa
- `organs`, `certificate_templates`
- `departments`, `positions`, `justifications`, `time_records`
- `user_permissions`, `team_activities`
- `property_owners`, `property_timeline`, `person_relationships`
- `activities`, `settings`, `support_tickets`, `audit_log`

---

## Como Rodar

```bash
# Instalar dependências
cd A.CERT
npm install

# Configurar o banco (precisa de PostgreSQL rodando)
# Editar DATABASE_URL no .env
npx prisma migrate dev    # Cria as tabelas
npm run prisma:seed        # Popula dados de exemplo

# Modo desenvolvimento (backend + frontend em paralelo)
npm run dev

# Backend standalone
npm run dev:server

# Build produção
npm run build
```

---

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://acert:senha@localhost:5432/acert?schema=public
PORT=3001
PUPPETEER_HEADLESS=true
CONNECTOR_TIMEOUT_MS=60000
JWT_SECRET=acert-dev-secret-change-in-production
FRONTEND_URL=http://localhost:3000
```

---

## Endpoints Principais (v1.1)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login (retorna `precisaTrocarSenha` se 1º acesso) |
| POST | `/api/auth/trocar-senha` | Trocar senha (obrigatório no 1º login) |
| POST | `/api/dossiers` | Criar dossiê com participantes e propriedade |
| GET | `/api/dossiers/:id` | Detalhes do dossiê com participantes |
| POST | `/api/dossiers/:id/generate` | Gerar PDF do dossiê |
| POST | `/api/consultar` | Iniciar consulta de certidões (aceita `personId` e `dossierId`) |
| POST | `/api/companies` | Criar empresa (admin) |
| GET | `/api/companies` | Listar empresas |
| POST | `/api/companies/:id/resend-credentials` | Reenviar credenciais |

---

## Notas de Segurança

- **Credenciais do ONR estão hardcoded** no conector (`onr.connector.ts`). Extrair para `.env`.
- `.env`, `data/`, `dist/`, `release/`, `tmp/` estão no `.gitignore`.
- Senhas são hashadas com bcryptjs (12 rounds).
- Tokens JWT expiram em 7 dias.

---

## Licença

Projeto privado — uso interno.
