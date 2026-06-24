# A.CERT — Central de Certidões Imobiliárias

Plataforma completa de automação de certidões imobiliárias com gestão interna de equipe, desenvolvida em TypeScript.

---

## Sobre o Projeto

A A.CERT automatiza consultas a **7 órgãos públicos brasileiros** para emissão de certidões imobiliárias e cíveis. O sistema realiza consultas via Puppeteer, gerencia CAPTCHAs interativos e consolida os resultados em um dossiê PDF profissional.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Backend** | Node.js, Express 5, TypeScript, better-sqlite3 |
| **Frontend (Dashboard)** | Next.js 15, React 19, Tailwind CSS 4 |
| **Frontend (Público)** | HTML5, CSS3, JavaScript Vanilla |
| **Desktop** | Electron (NSIS installer) |
| **Browser Automation** | Puppeteer + puppeteer-extra (Stealth Plugin) |
| **PDF** | pdf-lib (dossiês), Puppeteer page.pdf() (captura) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Email** | Nodemailer (SMTP) |
| **CAPTCHA** | svg-captcha (registro), hCaptcha/reCAPTCHA (órgãos) |
| **Extensão Chrome** | Manifest V3 |

---

## Arquitetura

```
A.CERT/
├── src/                          # Backend TypeScript
│   ├── server.ts                 # Entry point Express (porta 3001)
│   ├── database.ts               # Schema SQLite (18 tabelas) + seed
│   ├── connectors/               # Conectores por órgão (7 agências)
│   │   ├── receita-federal.connector.ts
│   │   ├── trf1.connector.ts     # TRF 1ª Região (Cível + Criminal)
│   │   ├── tjdft.connector.ts    # TJDFT
│   │   ├── trt.connector.ts      # TRT 10ª Região
│   │   ├── tst.connector.ts      # TST
│   │   ├── sefaz-df.connector.ts # SEFAZ-DF
│   │   └── onr.connector.ts      # ONR (Ônus Reais)
│   ├── services/
│   │   ├── orquestrador.service.ts   # Orquestração de consultas
│   │   ├── captcha-manager.service.ts # Gerenciador de CAPTCHA
│   │   ├── dossie.service.ts         # Geração de dossiê PDF
│   │   └── email.service.ts          # Emails transacionais
│   ├── routes/                   # Rotas REST
│   │   ├── auth.ts               # /api/auth
│   │   ├── dashboard.ts          # /api/dashboard
│   │   ├── people.ts             # /api/people
│   │   ├── dossiers.ts           # /api/dossiers
│   │   ├── properties.ts         # /api/properties
│   │   ├── reports.ts            # /api/reports
│   │   ├── search.ts             # /api/search
│   │   ├── captcha.ts            # /api/captcha
│   │   └── team.ts               # /api/team (RH interno)
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
│       ├── components/           # 23+ componentes React
│       ├── contexts/
│       │   └── ThemeContext.tsx   # Tema claro/escuro
│       ├── lib/api.ts            # Cliente de autenticação
│       └── services/teamApi.ts   # API de gestão de equipe
├── electron/                     # Electron Desktop
│   ├── main.mjs                  # Processo principal
│   ├── preload.mjs               # IPC bridge
│   └── loading.html              # Tela de carregamento
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
- Consolidação em dossiê PDF (capa, certidões, sumário)
- Retry com backoff exponencial + jitter

### Gestão Interna (Dashboard)
- Dashboard com métricas agregadas
- CRUD de Pessoas (pessoa física + jurídica)
- CRUD de Imóveis com categorias
- CRUD de Dossiês com templates de certidão
- Relatórios exportáveis
- Busca global

### Autenticação
- Login/registro com JWT
- Confirmação de email
- Recuperação de senha
- CAPTCHA matemático no registro

### Distribuição
- **Web**: Dashboard Next.js + Backend Express
- **Desktop**: App nativo Windows via Electron (NSIS installer)
- **Extensão Chrome**: Automação alternativa via navegador

---

## Banco de Dados

SQLite (better-sqlite3, modo WAL) com **18 tabelas**:

- `users`, `persons`, `properties`, `dossiers`, `certificates`
- `organs`, `certificate_templates`
- `departments`, `positions`, `justifications`, `time_records`
- `user_permissions`, `team_activities`
- `property_owners`, `property_timeline`, `person_relationships`
- `activities`

---

## Como Rodar

```bash
# Instalar dependências
cd A.CERT
npm install

# Modo desenvolvimento (backend + frontend em paralelo)
npm run dev

# Backend standalone
npm run dev:server

# Build produção
npm run build

# Electron desktop
npm run build:electron
```

---

## Variáveis de Ambiente

```env
PORT=3001
PUPPETEER_HEADLESS=true
CONNECTOR_TIMEOUT_MS=60000
CAPTCHA_API_KEY=     # 2captcha (opcional)
```

---

## Notas de Segurança

- **Credenciais do ONR estão hardcoded** no conector (`onr.connector.ts`). Extrair para `.env`.
- `.env`, `data/`, `dist/`, `release/`, `tmp/` estão no `.gitignore`.
- Senhas são hashadas com bcryptjs (12 rounds).
- Tokens JWT expiram em 7 dias.

---

## Licença

Projeto privado — uso interno.
