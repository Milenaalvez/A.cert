# Chronos — Gestão de Pessoas

Sistema de controle de ponto eletrônico com verificação facial, geolocalização, central de solicitações e notificações automatizadas.

**Frontend:** [chronos-blond-gamma.vercel.app](https://chronos-blond-gamma.vercel.app)
**API:** [chronos-1-wzqq.onrender.com](https://chronos-1-wzqq.onrender.com)

---

## Funcionalidades

### Registro de Ponto
- Marcação de entrada, intervalo (início/fim) e saída
- Verificação facial com **face-api.js** (descritores de 512 floats, threshold Euclidiano 0.6)
- Captura de foto por webcam
- Geolocalização (coordenadas, endereço reverso) via API do navegador
- Identificação de dispositivo (IP público, user-agent, timezone)

### Gestão de Equipe
- CRUD de colaboradores com vínculo a departamentos e cargos
- Controle de regimes contratuais (CLT, PJ, Estágio)
- Permissões granulares por usuário
- Métricas em tempo real (presentes, atrasados, ausentes)
- Histórico de atividades por colaborador

### Central de Solicitações
- Abertura de chamados em categorias (Suporte Técnico, Jornada e Ponto, RH e Benefícios, Acesso e Permissões, Sugestões)
- Fluxo de mensagens entre solicitante e responsável
- Auto-assign por categoria (ex: Suporte Técnico → DEVELOPER, RH → ADMIN/RH)
- Protocolo automático (`SOL-{ano}-{sequencial}`)
- Status: Aberto → Em Análise → Aguardando Resposta → Resolvido / Encerrado
- Notificações in-app e por e-mail ao atualizar status

### Relatórios
- Relatório consolidado mensal com filtros (departamento, cargo, colaborador, status)
- Fechamento mensal com controle de abertura/reabertura
- Exportação para PDF (jsPDF com auto-table) e Excel (SheetJS)
- Log de auditoria de ações sobre relatórios

### Calendário
- Visualização mensal FullCalendar (dayGrid, timeGrid, list)
- Codificação por cores conforme status (Normal, Extra, Ausência, Pendente, Negativo)
- Edição rápida e associação de justificativas

### Notificações Inteligentes
- Scheduler com verificação a cada 1 hora
- Categorias: face pendente, almoço não registrado, atraso, hora extra, falta de entrada/saída
- Resolução automática quando a condição deixa de existir

### Autenticação e Segurança
- Login por email/senha e Google OAuth (Supabase Auth)
- JWT (7 dias) + Refresh Token (30 ou 365 dias)
- Verificação de email obrigatória
- Recuperação de senha com token expirável
- Impersonação de usuários (permissão `switch_accounts`)
- Senha com bcrypt (10 rounds)

### Configurações
- Edição de perfil (nome, email, telefone, CPF)
- Upload de avatar
- Personalização de tema (claro, escuro, sistema) e cor de destaque

### Outros
- Gestão de documentos por colaborador (uploads para Supabase Storage)
- Controle de férias
- Justificativas de ausência com fluxo de aprovação
- Mapa interativo com Leaflet
- Página de diagnóstico para desenvolvimento (Ctrl+Shift+D)

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 3 |
| Backend | Express 5, TypeScript |
| ORM | Prisma 7 + @prisma/adapter-pg |
| Banco | PostgreSQL (Neon) |
| Autenticação | JWT + Refresh Token + Supabase Auth (Google OAuth) |
| Storage | Supabase Storage |
| E-mail | Nodemailer + SMTP Gmail |
| Face API | face-api.js (inferência no navegador) |
| Mapas | Leaflet + react-leaflet |
| PDF | jsPDF + jspdf-autotable |
| Planilhas | xlsx (SheetJS) |
| Calendário | FullCalendar 6 |
| Ícones | Lucide React |
| Deploy Frontend | Vercel |
| Deploy Backend | Render (Docker) |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (Vercel)                   │
│  React 19 + Vite 8 + TypeScript + Tailwind          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Páginas    │  │ Componentes  │  │ Serviços  │ │
│  │   (15+)      │  │   (26+)      │  │  api.ts   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                  │                 │       │
│         └──────────────────┴─────────────────┘       │
│                        │                             │
│                   HTTP /api/*                        │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────┐
│               BACKEND (Render)                       │
│  Express 5 + Prisma + TypeScript                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Routes  │  │ Services │  │    Database       │  │
│  │(11+ mod.)│  │          │  │ PostgreSQL/Prisma │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                        │                             │
│  ┌──────────────────────────────────────────────┐   │
│  │          Supabase (Auth + Storage)           │   │
│  │  Google OAuth  Storage  E-mails SMTP         │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. Cliente React faz requisição HTTP para `/api/*`
2. Express roteia para o módulo correspondente
3. Middleware de autenticação valida JWT
4. Controller processa e chama serviços
5. Serviços acessam banco via Prisma ORM
6. Resposta JSON retorna ao cliente

---

## Estrutura do Projeto

```
chronos/
├── backend/
│   ├── prisma/                  # Schema ORM, migrations
│   │   └── schema.prisma        # 15+ modelos de dados
│   ├── prisma.config.ts
│   └── server/
│       └── src/
│           ├── index.ts         # Entry point Express
│           ├── config/          # Variáveis de ambiente
│           ├── database/        # Conexão Prisma
│           ├── generated/       # Prisma Client
│           ├── middleware/      # Auth, error handler, permissões
│           ├── modules/         # Módulos funcionais
│           ├── services/        # E-mail (Nodemailer)
│           └── utils/           # Scheduler, validadores
├── frontend/
│   └── src/
│       ├── App.tsx              # Componente raiz
│       ├── main.tsx             # Inicialização React
│       ├── types.ts             # Interfaces TypeScript
│       ├── context/             # ThemeProvider
│       ├── paginas/             # Páginas do sistema
│       ├── componentes/         # Componentes reutilizáveis
│       ├── services/            # API, validação, cálculo de horas
│       └── utils/               # Face API, permissões, máscaras
├── docs/
│   └── pipeline.md              # Documentação técnica
├── Dockerfile                   # Build Docker
├── vercel.json                  # Configuração Vercel
└── package.json                 # Dependências e scripts
```

---

## Modelo de Dados

15 modelos gerenciados pelo Prisma:

- `User` — Colaboradores (autenticação, perfil, preferências)
- `Company` — Empresas (multi-tenant)
- `Department` — Departamentos
- `Position` — Cargos
- `TimeRecord` — Registros de jornada
- `PointEvent` — Eventos de ponto (GPS, foto, face)
- `Justification` — Justificativas de ausência
- `Ticket` — Solicitações (central de chamados)
- `TicketMessage` — Mensagens de solicitações
- `TicketAttachment` — Anexos de solicitações
- `Notification` — Notificações do sistema
- `FaceRegistration` — Descritores faciais
- `Document` — Documentos
- `Integration` — Integrações
- `TermAcceptance` — Aceitação de termos
- `ActivityLog` — Auditoria
- `MonthClosing` — Fechamento mensal

---

## Controle de Acesso (RBAC)

| Role | Nível | Permissões Padrão |
|------|-------|-------------------|
| DEVELOPER | 1 | Acesso total ao sistema |
| ADMIN | 2 | Gestão completa (equipe, relatórios, permissões, auditoria, solicitações) |
| RH | 3 | Equipe, relatórios, justificativas, aprovações |
| EMPLOYEE | 4 | Registro de ponto, dashboard, calendário, notificações, perfil |

Usuários do departamento **TI** recebem automaticamente todas as permissões.

---

## Setup Local

### Requisitos
- Node.js 22+
- PostgreSQL (ou Neon)

### Instalação

```bash
git clone https://github.com/Milenaalvez/Chronos.git
cd Chronos
npm install
cp .env.example .env
# Configurar DATABASE_URL, JWT_SECRET, SUPABASE_* no .env
npm run db:generate
npm run db:push
npm run dev:all
```

Frontend em `http://localhost:5173`, API em `http://localhost:3001`.

### Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Frontend (Vite dev server) |
| `npm run dev:server` | Backend (tsx watch) |
| `npm run dev:all` | Frontend + Backend |
| `npm run build` | Build produção (tsc + Vite) |
| `npm start` | Iniciar servidor produção |
| `npm run db:generate` | Gerar Prisma Client |
| `npm run db:push` | Sincronizar schema |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Seed de dados |
| `npm run db:migrate` | Criar migration |

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | URL de conexão PostgreSQL |
| `JWT_SECRET` | Sim | Chave para assinatura de tokens JWT |
| `PORT` | Não | Porta do servidor (default: 3001) |
| `SUPABASE_URL` | Sim | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Sim | Chave anônima Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave de serviço Supabase |
| `SMTP_HOST` | Não | Host SMTP |
| `SMTP_PORT` | Não | Porta SMTP (default: 587) |
| `SMTP_USER` | Não | Usuário SMTP |
| `SMTP_PASS` | Não | Senha SMTP (App Password) |
| `SMTP_FROM` | Não | Remetente de e-mails |
| `APP_URL` | Não | URL pública do frontend |
| `CORS_ORIGIN` | Não | Origens CORS permitidas |
| `VITE_SUPABASE_URL` | Sim | URL Supabase (frontend) |
| `VITE_SUPABASE_ANON_KEY` | Sim | Anon key (frontend) |
| `VITE_API_URL` | Não | URL da API (default: `/api`) |

---

## Deploy

### Frontend (Vercel)

Build: `npm run build`
Output: `frontend/dist/`
Auto-deploy: habilitado (branch `main`)
URL: `https://chronos-blond-gamma.vercel.app`

### Backend (Render)

Runtime: Docker (Node.js 22 Alpine)
Build: `npm install && npm run build`
Start: `npm start` (tsx)
URL: `https://chronos-1-wzqq.onrender.com`

---

## Licença

Uso interno. Projeto privado.
