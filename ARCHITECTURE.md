# ARCHITECTURE.md — Monorepo .vscode

Documentação completa da arquitetura, stack, fluxos de dados e relações entre todos os projetos do monorepo.

---

## Visão Geral

Este monorepo contém **5 projetos** que representam a jornada completa de desenvolvimento web full-stack, desde projetos educacionais até sistemas SaaS em produção.

```
.vscode/
│
├── chronos/              ★ SaaS em produção — Gestão de pessoal com ponto eletrônico
├── A.CERT/               ★ Plataforma desktop — Automação de certidões imobiliárias
├── milena-portfolio/     ★ Portfólio profissional — Site pessoal com tema cyberpunk
├── projetos alura/       ★ MAVIE — Interface de streaming estilo Netflix
└── projetos/
    └── fundação bradesco/  Exercício de curso — HTML/CSS/JS básico
```

---

## 1. Chronos — Sistema de Gestão de Pessoal

### 1.1 Visão Geral

SaaS de controle de ponto eletrônico com verificação facial, geolocalização, central de solicitações (tickets) e notificações inteligentes. Multi-tenant com RBAC completo.

### 1.2 Stack Detalhada

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 3  │
│  face-api.js | FullCalendar 6 | Leaflet | Lucide    │
│  jsPDF + xlsx (exports) | Chart.js (dashboard)      │
├─────────────────────────────────────────────────────┤
│                    BACKEND                           │
│  Express 5 + TypeScript + Prisma 7 (PostgreSQL)     │
│  JWT (7d/30d) | Supabase Auth (Google OAuth)        │
│  Nodemailer + SendGrid (emails)                     │
│  Supabase Storage (documentos/avatares)             │
├─────────────────────────────────────────────────────┤
│                 INFRAESTRUTURA                       │
│  Frontend: Vercel (chronos-blond-gamma.vercel.app)  │
│  Backend:  Render Docker (chronos-1-wzqq.onrender)  │
│  Database: Neon PostgreSQL (serverless)             │
│  Storage:  Supabase Storage                         │
│  Email:    Supabase Edge Function (send-email)      │
└─────────────────────────────────────────────────────┘
```

### 1.3 Arquitetura de Módulos

```
src/index.ts (Express)
├── Middleware Global
│   ├── CORS (origin: produção Vercel + localhost)
│   ├── JSON parser (10mb limit)
│   ├── JWT Auth (Bearer token)
│   └── Error Handler
│
├── Módulos (15 rotas)
│   ├── /api/auth          → Login, registro, Google OAuth, impersonation
│   ├── /api/company       → CRUD empresa + config
│   ├── /api/team          → Gestão equipe, convites
│   ├── /api/timeRecord    → Registros de ponto
│   ├── /api/pointRecord   → Bater ponto (face + senha + geolocalização)
│   ├── /api/ticket        → Central de solicitações
│   ├── /api/justification → Justificativas
│   ├── /api/reports       → Relatórios (PDF/XLSX)
│   ├── /api/notification  → Notificações
│   ├── /api/document      → Upload/download documentos
│   ├── /api/faceRegistration → Cadastro facial
│   ├── /api/branch        → Filiais
│   ├── /api/companyConfig  → Configurações
│   ├── /api/termAcceptance → Termos de uso
│   └── /api/reference      → Dados de referência
│
└── Scheduler (cada 1h)
    ├── Verifica registros faltantes
    ├── Detecta horas extras
    ├── Notifica atrasos
    └── Auto-resolve notificações antigas
```

### 1.4 Modelo de Dados (Prisma — 18 modelos)

```
User ──┬── Company (multi-tenant)
       ├── Branch (filial)
       ├── TimeRecord (registros de ponto)
       ├── PointRecord (eventos de bater ponto)
       ├── Ticket ─── TicketMessage
       ├── Justification
       ├── Notification
       ├── Document
       ├── FaceRegistration
       ├── TermAcceptance
       └── CompanyConfig
```

### 1.5 Fluxo Principal: Bater Ponto

```
1. Usuário clica "Bater Ponto" no frontend
2. Frontend captura:
   - Geolocalização (navigator.geolocation)
   - Foto facial (câmera)
3. Frontend envia para POST /api/pointRecord/register
4. Backend:
   a. Verifica JWT → identifica usuário
   b. Valida geolocalização (distância da filial)
   c. Compara face com registro facial (Euclidean distance < 0.6)
   d. Verifica se usuário está dentro do horário
   e. Salva PointRecord + cria/atualiza TimeRecord
5. Scheduler (background):
   a. Verifica se há registro de entrada sem saída
   b. Calcula horas trabalhadas, extras, banco de horas
   c. Gera notificações se necessário
```

### 1.6 RBAC (Role-Based Access Control)

| Role | Permissões |
|---|---|
| **DEVELOPER** | Acesso total, impersonation, configurações do sistema |
| **ADMIN** | Gestão de equipe, aprovações, relatórios, tickets |
| **RH** | Registros de ponto, justificativas, relatórios de equipe |
| **EMPLOYEE** | Bater ponto, ver próprios registros, criar tickets |

---

## 2. A.CERT — Central de Certidões (v1.1)

### 2.1 Visão Geral

Plataforma completa de automação de certidões imobiliárias com 2 interfaces: pública (consulta) e dashboard interno (gestão). Consulta 7 órgãos públicos brasileiros via Puppeteer com stealth. O módulo Electron foi congelado a pedido do cliente — foco na versão web.

**v1.1 (Jun/2026):** Fluxo de dossiê reestruturado com múltiplos participantes + multiempresas + certidões por pessoa + PDF organizado por participante.

### 2.2 Stack Detalhada

```
┌──────────────────────────────────────────────────────────────┐
│                      INTERFACES                               │
│  Landing Page: Next.js 15 + React 19 + Tailwind CSS 4        │
│  Dashboard:   Next.js 15 + React 19 + Tailwind CSS 4          │
│  Desktop:     Electron (congelado)                             │
│  Extensão:    Chrome Manifest V3                              │
├──────────────────────────────────────────────────────────────┤
│                      BACKEND                                  │
│  Express 5 + TypeScript + Prisma 7 (PostgreSQL)               │
│  JWT (jsonwebtoken) + bcryptjs                               │
│  Nodemailer (SMTP) | svg-captcha (registro)                  │
├──────────────────────────────────────────────────────────────┤
│                   AUTOMAÇÃO                                   │
│  Puppeteer + puppeteer-extra (Stealth Plugin)                │
│  pdf-lib (consolidação de dossiês)                           │
│  2captcha (resolução automática de CAPTCHA, opcional)        │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Arquitetura de Conectores

Cada órgão implementa a interface `IConnector`:

```typescript
interface IConnector {
  nome: string
  consultar(dados: DadosProprietario, captchaManager?: CaptchaManager, jobId?: string, certKeys?: string[]): Promise<ConnectorResult>
}
```

**Fluxo de consulta por órgão:**

```
1. createPage() → Abre página Puppeteer com stealth
2. Navega até URL do órgão
3. diagnosticarFormulario() → Analisa estrutura do formulário
4. injectFillHelper() → Injeta __fillInput para frameworks reativos
5. Preenche campos por correspondência de label
6. Clica no botão de envio
7. Polling de CAPTCHA:
   ├── detectarCaptcha() → identifica hCaptcha/reCAPTCHA/texto
   ├── Screenshot → envia para cliente
   └── captchaManager.waitForSolution() → aguarda resolução manual
8. Captura resultado como PDF (tentarBaixarPDF: 3 níveis de fallback)
9. Retorna ConnectorResult com status + documento (buffer Uint8Array)
```

**Órgãos suportados:**

| Órgão | Conector | Tipo de Certidão |
|---|---|---|
| Receita Federal | `receita-federal.connector.ts` | CPF |
| TRF 1ª Região | `trf1.connector.ts` | Cível + Criminal |
| TJDFT | `tjdft.connector.ts` | Cível + Criminal |
| TRT 10ª Região | `trt.connector.ts` | Trabalhista |
| TST | `tst.connector.ts` | Trabalhista |
| SEFAZ-DF | `sefaz-df.connector.ts` | Fiscal (PF/PJ/Imóvel) |
| ONR | `onr.connector.ts` | Ônus Reais |

### 2.4 Orquestração de Consultas (v1.1)

```
POST /api/consultar { nome, cpf, ..., personId, dossierId }
  │
  ├── 1. Cria job (in-memory Map)
  ├── 2. Inicia orquestrador:
  │      para cada conector (sequencial):
  │        ├── Executa consulta com timeout
  │        ├── Se CAPTCHA: pausa e aguarda resolução
  │        ├── Se sucesso: persistirResultado(personId, dossierId, resultado)
  │        │   ├── Insere em dossier_participants
  │        │   ├── Insere certificate com person_id
  │        │   └── Salva PDF em data/documents/
  │        └── Se falha: retry com backoff
  ├── 3. Polling: GET /api/consultar/:jobId
  └── 4. PDF consolidado (/:id/generate) → organizado por participante com embed de certidões
```

### 2.5 Banco de Dados (PostgreSQL + Prisma — 25 tabelas)

**Novas tabelas v1.1:** `dossier_participants`, `companies`, `company_settings`
**Novas colunas:** `certificates.person_id`, `dossiers.transaction_type`, `users.password_change_required`

```
users ──┬── companies ── company_settings
        │
        ├── persons ──┬── dossier_participants ── dossiers
        │              │       (role: proprietario/comprador/vendedor/locador/locatario)
        │              ├── dossiers ──┬── certificates (person_id)
        │              │              └── certificate_templates
        │              ├── properties ── property_owners
        │              │               └── property_timeline
        │              └── person_relationships
        │
        ├── user_permissions
        ├── activities
        ├── organs
        ├── notifications
        ├── user_sessions
        └── audit_log
```

### 2.6 Distribuição Multi-Plataforma

| Plataforma | Entrada | Descrição |
|---|---|---|
| **Web (Público)** | `frontend/app/page.tsx` | Landing page Next.js com Navbar + Hero |
| **Web (Dashboard)** | Next.js em `localhost:3000` | Gestão administrativa completa |
| **Desktop** | Electron (`A.CERT.exe`) | App nativo Windows, frameless, com backend + frontend embutidos |
| **Extensão Chrome** | `extension/` | Automação alternativa via navegador |

---

## 3. Milena Portfolio

### 3.1 Visão Geral

Portfólio profissional single-page com design cyberpunk/HUD futurista, hospedado no GitHub Pages.

### 3.2 Stack

```
React 19 + TypeScript 6 + Vite 8
Tailwind CSS 4 (@tailwindcss/vite)
Framer Motion 12 (animações)
react-icons 5 (ícones FontAwesome)
gh-pages 6 (deploy GitHub Pages)
```

### 3.3 Componentes

```
App.tsx (897 linhas — single-file)
├── Hero Section        → Nome, título, foto, partículas
├── About Section       → Biografia, skills
├── Experience Section  → Timeline de experiência
├── Projects Section    → ProjectCarousel (3D perspective)
├── Tools Section       → Modal interativo com grade de tecnologias
└── Contact Section     → Formulário (FormSubmit.co)
```

### 3.4 Design System

- **Cores**: Fundo escuro (#0a0a0f), accent ciano (#00f0ff), roxo (#7C3AED)
- **Efeitos**: Scanlines, glow, holográfico, partículas, cantos decorados
- **Tipografia**: Fontes monospace para HUD, Inter para corpo
- **Animações**: Framer Motion para transições, CSS keyframes para efeitos contínuos

---

## 4. MAVIE (Projetos Alura)

### 4.1 Visão Geral

Interface de streaming de filmes estilo Netflix, consumindo a API do TMDB. Projeto educacional do curso da Alura.

### 4.2 Stack

```
HTML5 + CSS3 (1130 linhas) + JavaScript Vanilla (373 linhas)
TMDB API v3 (fetch)
Google Fonts (Inter, Poppins)
```

### 4.3 Funcionalidades

- **Perfis**: 4 avatares com som de clique e localStorage
- **Catálogo**: 4 categorias via TMDB (popular, top rated, upcoming, now playing)
- **Banner**: Filme aleatório como hero backdrop
- **Modal**: Detalhes do filme + trailer YouTube com autoplay
- **Busca**: Input com resultados ao vivo
- **Carrosséis**: Scroll horizontal com botões de seta

---

## 5. Fundação Bradesco

Projeto educacional simples com HTML, CSS (variáveis e temas) e JavaScript básico. Exercício do curso de desenvolvimento web da Fundação Bradesco.

---

## Relações Entre Projetos

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Chronos ◄────────────────────────── Milena Portfolio       │
│  │ (capture.mjs faz screenshot      │ (lista Chronos como   │
│  │  do dashboard para portfólio)    │  projeto principal)   │
│  │                                  │                       │
│  ├── Compartilham: React 19, TS 6, Vite 8, Tailwind        │
│  └── Mesmo banco Neon PostgreSQL (query_verify.mjs)         │
│                                                             │
│  A.CERT ◄─────────────────────────── Milena Portfolio       │
│  │ (listado como "DONNOS Docs"      │                       │
│  │  no portfólio)                   │                       │
│  │                                  │                       │
│  MAVIE ◄──────────────────────────── Milena Portfolio       │
│  │ (listado como "Netflix Cover"    │                       │
│  │  no portfólio, deploy GitHub     │                       │
│  │  Pages separado)                 │                       │
│                                                             │
│  donnos/ ──► evoluiu para ──► A.CERT/                      │
│  (versão inicial, agora deletada e substituída)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tecnologias Compartilhadas

| Tecnologia | Chronos | A.CERT | Portfolio | MAVIE |
|---|---|---|---|---|
| TypeScript | ✅ | ✅ | ✅ | ❌ |
| React 19 | ✅ | ✅ | ✅ | ❌ |
| Express 5 | ✅ | ✅ | ❌ | ❌ |
| Next.js 15 | ❌ | ✅ | ❌ | ❌ |
| Tailwind CSS | ✅ (v3) | ✅ (v4) | ✅ (v4) | ❌ |
| Vite 8 | ✅ | ❌ | ✅ | ❌ |
| Prisma | ✅ | ✅ | ❌ | ❌ |
| PostgreSQL | ✅ | ✅ | ❌ | ❌ |
| SQLite | ❌ | ❌ | ❌ | ❌ |
| JWT Auth | ✅ | ✅ | ❌ | ❌ |
| Puppeteer | ❌ | ✅ | ❌ | ❌ |
| Framer Motion | ❌ | ❌ | ✅ | ❌ |
| Chart.js | ✅ | ❌ | ❌ | ❌ |

---

## Deploy e Infraestrutura

| Projeto | Frontend | Backend | Database |
|---|---|---|---|
| **Chronos** | Vercel | Render (Docker) | Neon PostgreSQL |
| **A.CERT** | Next.js (localhost) | Express (localhost) | PostgreSQL / Prisma |
| **Portfolio** | GitHub Pages | N/A (estático) | N/A |
| **MAVIE** | GitHub Pages (repo separado) | N/A (estático) | N/A |
| **Bradesco** | N/A (local) | N/A | N/A |

---

## Convenções de Código

- **Nomes de arquivo**: kebab-case para módulos, PascalCase para componentes React
- **Idioma do código**: Português (nomes de variáveis, funções, comentários)
- **Idioma dos commits**: Português, primeira pessoa
- **Formatação**: ESLint flat config, sem trailing commas, aspas simples
- **Tipagem**: TypeScript strict mode em todos os projetos TS
