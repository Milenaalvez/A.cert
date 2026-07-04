# Arquitetura — A.CERT v1.2

Documentação técnica completa da stack, fluxos de dados e decisões arquiteturais.

---

## Visão Geral

A A.CERT é uma plataforma SaaS que automatiza a emissão de certidões imobiliárias em 7 órgãos públicos brasileiros. O sistema opera como uma aplicação web com backend Express + banco PostgreSQL (Prisma ORM) e frontend Next.js 15.

**v1.2 (Jun/2026):** Migrei o banco de dados de SQLite para PostgreSQL com Prisma ORM, mantendo compatibilidade total com a API existente.

### Diagrama de Alto Nível

```
Cliente (Navegador)
    │
    ├─── Frontend Next.js (porta 3000)
    │     │
    │     ├── Dashboard (React 19 + Tailwind 4)
    │     └── Página Pública (HTML/CSS/JS vanilla)
    │
    └─── Backend Express (porta 3001)
          │
          ├── Rotas REST (/api/*)
          ├── Conectores (Puppeteer)
          ├── Serviços (Orquestrador, CAPTCHA, Dossiê, Email)
          └── Banco SQLite (better-sqlite3, modo WAL)
```

---

## Stack Tecnológica

### Backend

| Componente | Tecnologia | Justificativa |
|---|---|---|
| **Runtime** | Node.js 22 + TypeScript 5 | Tipagem forte, compatibilidade com Puppeteer |
| **Servidor** | Express 5 | Leve, maduro, ampla compatibilidade |
| **Banco** | PostgreSQL (pg) + Prisma ORM | Type-safe via Prisma Client, raw SQL via pool pg para queries complexas |
| **Browser** | Puppeteer + Stealth Plugin | Automação realista, evasão de detecção anti-bot |
| **PDF** | pdf-lib | Manipulação programática de PDFs (merge, embed) |
| **Auth** | JWT + bcryptjs | Stateless, seguro, simples de implementar |
| **Email** | Nodemailer | Flexível, compatível com qualquer SMTP |
| **Uploads** | Multer | Padrão Express para upload de arquivos |

### Frontend

| Componente | Tecnologia | Justificativa |
|---|---|---|
| **Framework** | Next.js 15 + React 19 | SSR/SSG opcional, roteamento baseado em arquivos |
| **Estilo** | Tailwind CSS 4 | Utility-first, rápido protótipo |
| **Gráficos** | Recharts | Nativos React, responsivos |
| **Ícones** | Lucide React | Leves, tree-shakeable |
| **Tabelas** | @tanstack/react-table | Headless, flexível |

---

## Estrutura de Diretórios

```
A.CERT/
├── src/
│   ├── server.ts                    # Entry point do backend
│   ├── database.ts                  # Schema + migrations + seed
│   ├── connectors/                  # 7 conectores de órgãos
│   │   ├── connector.interface.ts   # Interface IConnector
│   │   ├── types.ts                 # Tipos compartilhados
│   │   ├── index.ts                 # Factory criarConectores()
│   │   ├── receita-federal.connector.ts
│   │   ├── trf1.connector.ts
│   │   ├── tjdft.connector.ts
│   │   ├── trt.connector.ts
│   │   ├── tst.connector.ts
│   │   ├── sefaz-df.connector.ts
│   │   └── onr.connector.ts
│   ├── services/
│   │   ├── orquestrador.service.ts  # Orquestração de consultas
│   │   ├── captcha-manager.service.ts
│   │   ├── captcha-solver.service.ts
│   │   ├── dossie.service.ts        # Geração de PDFs
│   │   └── email.service.ts
│   ├── routes/                      # 13 arquivos de rotas
│   │   ├── auth.ts                  # /api/auth
│   │   ├── companies.ts             # /api/companies (novo v1.1)
│   │   ├── dashboard.ts             # /api/dashboard
│   │   ├── people.ts                # /api/people
│   │   ├── dossiers.ts              # /api/dossiers
│   │   ├── properties.ts            # /api/properties
│   │   ├── reports.ts               # /api/reports
│   │   ├── search.ts                # /api/search
│   │   ├── captcha.ts               # /api/captcha
│   │   ├── settings.ts              # /api/settings
│   │   ├── team.ts                  # /api/team, /api/justifications, /api/time-records
│   │   ├── support.ts               # /api/support
│   │   └── trash.ts                 # /api/trash
│   ├── middleware/
│   │   └── auth.ts                  # JWT middleware
│   └── utils/
│       ├── browser.ts               # Puppeteer + Stealth config
│       ├── captcha.ts               # Detecção de CAPTCHA
│       ├── dom-helper.ts            # Preenchimento de formulários
│       ├── retry-manager.service.ts
│       └── validation.ts            # CPF, CNPJ, email, etc.
├── frontend/
│   ├── app/                         # Páginas Next.js (App Router)
│   │   ├── dashboard/               # Dashboard principal
│   │   │   ├── page.tsx             # Home do dashboard
│   │   │   ├── dossies/             # Dossiês
│   │   │   ├── pessoas/             # Pessoas
│   │   │   ├── imoveis/             # Imóveis
│   │   │   ├── certidoes/           # Certidões
│   │   │   ├── relatorios/          # Relatórios
│   │   │   ├── usuarios/            # Usuários (Team)
│   │   │   ├── configuracoes/       # Configurações
│   │   │   ├── suporte/             # Suporte
│   │   │   └── trash/               # Lixeira
│   │   ├── cadastro/                # Registro
│   │   ├── recuperar-senha/         # Esqueci senha
│   │   └── page.tsx                 # Landing page
│   └── src/
│       ├── components/              # 31+ componentes React
│       ├── contexts/
│       │   └── ThemeContext.tsx
│       ├── lib/
│       │   └── api.ts               # Cliente auth
│       └── services/
│           └── teamApi.ts
├── electron/                        # Desktop (congelado v1.1)
├── extension/                       # Chrome Extension (Manifest V3)
├── public/                          # Interface pública standalone
├── scripts/                         # Utilidades de manutenção
└── data/                            # SQLite DB + documentos + backups
```

---

## Banco de Dados

### Tabelas Principais (21 tabelas)

#### Core do Negócio

| Tabela | Descrição |
|---|---|
| `persons` | Cadastro de pessoas (CPF, nome, dados pessoais) |
| `properties` | Imóveis (identificador, matrícula, endereço) |
| `dossiers` | Dossiês com `transaction_type` (venda/locação) |
| `certificates` | Certidões por dossiê com `person_id` (v1.1) |
| `dossier_participants` | Vínculo pessoa-dossiê com `role` (v1.1) |

#### Multiempresas (v1.1)

| Tabela | Descrição |
|---|---|
| `companies` | Empresas cadastradas (plano, licença, logo) |
| `company_settings` | Configurações por empresa (key-value) |

#### RH Interno

| Tabela | Descrição |
|---|---|
| `users` | Usuários com `password_change_required` (v1.1) |
| `departments` | Departamentos |
| `positions` | Cargos |
| `justifications` | Justificativas de ausência |
| `time_records` | Registros de ponto |
| `user_permissions` | Permissões por usuário |
| `team_activities` | Log de atividades da equipe |

#### Suporte

| Tabela | Descrição |
|---|---|
| `organs` | Órgãos integrados |
| `certificate_templates` | Templates de certidões disponíveis |
| `activities` | Log de atividades geral |
| `settings` | Configurações globais do sistema |
| `support_tickets` | Tickets de suporte |
| `audit_log` | Log de auditoria |

#### Relacionamentos

| Tabela | Descrição |
|---|---|
| `property_owners` | Vínculo pessoa-imóvel |
| `property_timeline` | Histórico do imóvel |
| `person_relationships` | Vínculo parental entre pessoas |

### Diagrama de Relacionamentos (Core)

```
companies ──< users
users ──< team_activities
users ──< time_records
users ──< justifications
users ──< user_permissions

dossiers ──< certificates
dossiers ──< dossier_participants >── persons
dossiers ── properties
persons ──< property_owners >── properties
persons ──< person_relationships >── persons
```

---

## Fluxo de Dados

### 1. Criação de Dossiê (v1.1)

```
1. Usuário preenche modal (4 passos):
   a. Tipo de transação (venda/locação)
   b. Imóvel (identificação + checkbox matrícula)
   c. Partes envolvidas (múltiplos com roles)
   d. Revisão

2. POST /api/dossiers
   ├── Cria property (se informada)
   ├── Cria dossier com transaction_type
   ├── Para cada participante:
   │   ├── Busca ou cria person por CPF
   │   └── Insere em dossier_participants
   └── Retorna { id, identifier }

3. Modal pós-criação:
   "Ver Dossiê" / "Emitir Certidões"
```

### 2. Emissão de Certidões

```
1. POST /api/consultar
   Body: { nome, cpf, dataNascimento, nomeMae, email, personId, dossierId }

2. Orquestrador (orquestrador.service.ts)
   ├── Cria jobId
   ├── Dispara conectores em paralelo
   └── Ao final de cada conector:
       └── persistirResultado(personId, dossierId, resultado)
           ├── Insere em dossier_participants (se não existe)
           ├── Insere certificate com person_id
           └── Salva documento PDF em data/documents/

3. Polling: GET /api/consultar/:jobId
   ├── Status por órgão
   ├── CAPTCHAs pendentes
   └── Status geral do job
```

### 3. Geração de Dossiê PDF

```
1. GET /api/dossiers/:id
   ├── Query dossier + property + participants
   └── Retorna dados completos

2. POST /api/dossiers/:id/generate
   ├── Monta payload com participants + certificates
   ├── Chama gerarDossiePDFFromDB(payload)
   │   ├── Capa: tipo de transação, nº participantes
   │   ├── Para cada participante:
   │   │   ├── Nome, CPF, papel, certs
   │   │   └── Embeda PDFs reais via document_path
   │   ├── Propriedade (se existir)
   │   ├── Tabela resumo de certidões
   │   └── Estatísticas finais
   └── Retorna Buffer PDF
```

---

## Padrões de Código

### Conectores (IConnector)

Cada conector implementa a interface:

```typescript
interface IConnector {
  readonly nome: string;
  consultar(
    dados: DadosProprietario,
    captchaManager?: CaptchaManager,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult>;
}
```

Padrão comum:
1. `createPage()` — Nova página Puppeteer com stealth
2. Preenche formulário com dados do proprietário
3. Detecta CAPTCHA → pausa e aguarda resolução
4. Captura PDF do resultado
5. Retorna `ConnectorResult { status, orgao, documento, protocolo }`

### Rotas

- Arquivos separados por domínio (auth, people, dossiers, etc.)
- Middleware `authMiddleware` nas rotas protegidas
- Respostas padronizadas: `{ error }` ou `{ success, data }`
- Validação no servidor com funções utilitárias em `validation.ts`

### Frontend

- Componentes na pasta `frontend/src/components/`
- Contextos em `frontend/src/contexts/`
- API client em `frontend/src/lib/api.ts`
- Páginas no App Router (`frontend/app/dashboard/`)

---

## Decisões Arquiteturais

1. **PostgreSQL em vez de SQLite**: Escolhido para deploy em produção na Hostinger KVM2. O Prisma ORM fornece type-safety nas operações CRUD, enquanto o pool `pg` mantém flexibilidade para queries analíticas complexas.

2. **Puppeteer com Stealth**: Necessário porque órgãos públicos usam detecção anti-bot agressiva (Cloudflare, DataDome).

3. **CAPTCHA interativo**: Impossível automatizar 100% — o sistema abre o navegador para o usuário resolver manualmente quando necessário.

4. **pdf-lib para merge**: Escolhido por ser puro JavaScript (sem dependências nativas), permitindo manipulação programática de PDFs.

5. **Multiempresas manual (MVP)**: O cadastro de empresas é feito pelo admin do A.CERT, não self-service. Landing page pública com pagamento será fase 2.

6. **Electron congelado**: O cliente optou por não usar o app desktop inicialmente, mantendo apenas a versão web.

---

## Segurança

- Senhas hashadas com bcryptjs (12 rounds)
- JWT com expiração de 7 dias
- `password_change_required` força troca no primeiro login
- `.env`, `data/`, `dist/`, `release/`, `tmp/` no `.gitignore`
- ⚠️ Credenciais ONR hardcoded — extrair para `.env`

---

## Próximos Passos

- [ ] Landing page pública com planos e pagamento
- [ ] Configuração SMTP Hostinger para emails transacionais
- [ ] Finalizar design das abas de Configurações e Suporte
- [ ] Emissão sequencial por pessoa na UI
- [ ] Extrair credenciais ONR para `.env`
