# A.CERT — Central de Certidões Imobiliárias

Plataforma SaaS para automação de certidões imobiliárias com gestão interna de equipe, desenvolvida em TypeScript. Consulte múltiplos órgãos públicos brasileiros, emita certidões e gere dossiês documentais completos em PDF.

---

## Funcionalidades

### Emissão de Certidões
- Consulta automatizada a **7 órgãos públicos**: Receita Federal, TRF 1ª Região, TJDFT, TRT 10ª Região, TST, SEFAZ-DF e ONR
- Navegação realista com Puppeteer + Stealth Plugin (evasão de detecção anti-bot)
- CAPTCHA interativo com suporte a hCaptcha, reCAPTCHA e CAPTCHA de texto
- Sistema de retry com backoff exponencial e jitter
- Consolidação em dossiê PDF profissional com capa, certidões por participante e sumário

### Gestão de Dossiês
- Criação de dossiês com múltiplos participantes (proprietário, comprador, vendedor, locador, locatário)
- Tipos de transação: Venda ou Locação
- Vínculo de imóveis com matrícula opcional (certidões de ONR, matrícula e ficha cadastral)
- Emissão individual por participante — cada pessoa tem suas certidões salvas separadamente
- Geração de PDF organizado: capa → seção por participante → tabela resumo → estatísticas

### Dashboard
- Métricas agregadas em tempo real (dossiês, certidões, taxa de conclusão)
- CRUD completo de Pessoas, Imóveis e Dossiês
- Gestão de Usuários com perfis de acesso e permissões granulares
- Central de Configurações com abas:
  - **Perfil** — avatar, dados pessoais, atividades recentes
  - **Geral** — regionalização, formato de data/hora, preferências
  - **Conectores** — status dos órgãos integrados
  - **Auditoria** — logs de ações com filtros por usuário e período
  - **Sistema** — versão, ambiente, banco, uptime
- Relatórios exportáveis
- Lixeira com restauração de registros excluídos
- Busca global no topo de cada página
- Onboarding interativo no primeiro acesso (5 cards sequenciais com progresso)
- Tour guiado pela plataforma com tooltips sobrepostos (Driver.js)

### Central de Ajuda
- 3 cards interativos: Documentação, Tour pela Plataforma e Dicas
- Barra de busca com filtro em tempo real
- Modal de ticket de suporte com 6 categorias de motivo
- Envio de tickets via SMTP para o email de suporte
- Barra de contato horizontal com email, horário e tempo de resposta

### Sistema de Documentação
- **65+ artigos** em **10 categorias** (Primeiros passos, Dossiês, Pessoas, Emissão de Certidões, Órgãos Integrados, Dossiês e PDF, Relatórios, Usuários e Empresas, Configurações, Lixeira)
- Páginas de artigo com: breadcrumb, ícone Lucide, badges de nível/tempo/data
- Cards coloridos (azul, verde, amarelo), timeline com linhas conectoras, fluxograma visual
- Espaço para embed de vídeos Loom
- Navegação entre artigos ("Próximo artigo" / "Voltar")
- Links cross-categoria ("Veja também")
- Busca global na documentação com filtros
- Scroll spy na barra lateral (opcional)

### Sistema de Notificações
- Badge com contagem no avatar do sidebar (colapsado e expandido)
- Atualização automática a cada 30 segundos
- API REST completa: listar, contar, marcar como lida, marcar todas
- Modal de notificações integrado ao dropdown do perfil
- Integração futura com eventos do sistema (certidão emitida, dossiê concluído, etc.)

### Multiempresas
- Cadastro de empresas pelo administrador
- Geração de credenciais provisórias para o admin da empresa
- Logo customizada por empresa
- Configurações independentes por empresa
- Controle de licença: plano, status (ativa/trial/expirada), data de expiração

### Autenticação e Segurança
- Login/registro com JWT (expiração de 7 dias)
- Senhas hashadas com bcryptjs (12 rounds)
- Troca de senha obrigatória no primeiro acesso
- Confirmação de email via SMTP
- Recuperação de senha com token temporário
- Sessões rastreáveis por dispositivo e IP

### Extensão Chrome
- Manifest V3 para captura de dados diretamente dos sites dos órgãos
- Content scripts por órgão para extração automatizada

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Runtime** | Node.js + TypeScript 5 |
| **Backend** | Express 5 |
| **Frontend** | Next.js 15 + React 19 + Tailwind CSS 4 |
| **Banco de Dados** | PostgreSQL + Prisma ORM |
| **Automação** | Puppeteer + puppeteer-extra (Stealth Plugin) |
| **PDF** | pdf-lib (merge/embed), Puppeteer page.pdf() (captura) |
| **Autenticação** | JWT (jsonwebtoken) + bcryptjs |
| **Email** | Nodemailer (SMTP) |
| **Ícones** | Lucide React |
| **Gráficos** | Recharts |
| **Tour Guiado** | Driver.js |

---

## Estrutura do Projeto

```
A.CERT/
├── src/
│   ├── server.ts                         # Entry point do backend (Express, porta 3001)
│   ├── connectors/                       # Conectores por órgão (implementam IConnector)
│   │   ├── connector.interface.ts        # Interface padronizada
│   │   ├── types.ts                      # Tipos compartilhados
│   │   ├── index.ts                      # Factory criarConectores()
│   │   ├── receita-federal.connector.ts
│   │   ├── trf1.connector.ts
│   │   ├── tjdft.connector.ts
│   │   ├── trt.connector.ts
│   │   ├── tst.connector.ts
│   │   ├── sefaz-df.connector.ts
│   │   └── onr.connector.ts
│   ├── services/
│   │   ├── orquestrador.service.ts       # Orquestração de consultas em paralelo
│   │   ├── captcha-manager.service.ts    # Gerenciamento de CAPTCHAs
│   │   ├── dossie.service.ts             # Geração de dossiê PDF
│   │   └── email.service.ts              # Emails transacionais
│   ├── routes/
│   │   ├── auth.ts                       # /api/auth
│   │   ├── companies.ts                  # /api/companies
│   │   ├── dashboard.ts                  # /api/dashboard
│   │   ├── people.ts                     # /api/people
│   │   ├── dossiers.ts                   # /api/dossiers
│   │   ├── properties.ts                 # /api/properties
│   │   ├── reports.ts                    # /api/reports
│   │   ├── search.ts                     # /api/search
│   │   ├── captcha.ts                    # /api/captcha
│   │   ├── settings.ts                   # /api/settings
│   │   ├── team.ts                       # /api/team
│   │   ├── support.ts                    # /api/support
│   │   ├── notifications.ts              # /api/notifications
│   │   └── trash.ts                      # /api/trash
│   ├── middleware/
│   │   └── auth.ts                       # JWT middleware
│   └── utils/
│       ├── browser.ts                    # Configuração Puppeteer + Stealth
│       ├── captcha.ts                    # Detecção de CAPTCHA
│       ├── dom-helper.ts                 # Preenchimento de formulários
│       ├── retry-manager.service.ts      # Retry com backoff
│       └── validation.ts                 # Validação de CPF, CNPJ, email
├── frontend/
│   ├── app/                              # Next.js App Router
│   │   ├── page.tsx                      # Landing page / login
│   │   ├── cadastro/                     # Registro de usuário
│   │   ├── recuperar-senha/              # Recuperação de senha
│   │   ├── redefinir-senha/              # Redefinição de senha
│   │   ├── confirmar-email/              # Confirmação de email
│   │   └── dashboard/                    # Área autenticada
│   │       ├── page.tsx                  # Home com métricas
│   │       ├── dossies/                  # Gestão de dossiês
│   │       ├── pessoas/                  # Gestão de pessoas
│   │       ├── certidoes/                # Emissão de certidões
│   │       ├── empresas/                 # Gestão de empresas
│   │       ├── relatorios/               # Relatórios
│   │       ├── usuarios/                 # Gestão de usuários
│   │       ├── configuracoes/            # Configurações do sistema
│   │       ├── suporte/                  # Central de ajuda e tickets
│   │       │   └── ajuda/                # Sistema de documentação
│   │       │       └── [slug]/           # Páginas de categoria e artigo
│   │       └── trash/                    # Lixeira
│   └── src/
│       ├── components/                   # Componentes React reutilizáveis
│       │   ├── OnboardingModal.tsx       # Modal de boas-vindas (5 cards)
│       │   ├── TicketModal.tsx           # Modal de ticket reutilizável
│       │   └── TourGuia.tsx              # Tour guiado com Driver.js
│       ├── contexts/                     # Contextos (User, Theme, Settings, Locale)
│       ├── data/
│       │   └── ajuda.ts                  # 65+ artigos de documentação
│       ├── lib/
│       │   └── api.ts                    # Cliente de autenticação
│       └── i18n/                         # Internacionalização
├── prisma/
│   ├── schema.prisma                     # Schema do banco (PostgreSQL)
│   └── seed.ts                           # Dados iniciais
├── extension/                            # Extensão Chrome (Manifest V3)
└── scripts/                              # Utilidades de manutenção
```

---

## Banco de Dados

**PostgreSQL** gerenciado via **Prisma ORM** com 21 tabelas. Queries type-safe via Prisma Client, queries analíticas complexas via raw SQL com pool `pg`.

### Principais Entidades

| Grupo | Tabelas |
|---|---|
| **Core** | `persons`, `properties`, `dossiers`, `certificates`, `dossier_participants` |
| **Autenticação** | `users`, `user_sessions`, `user_permissions` |
| **Multiempresas** | `companies`, `company_settings` |
| **RH** | `departments`, `positions`, `justifications`, `time_records`, `team_activities` |
| **Notificações** | `notifications` |
| **Sistema** | `organs`, `certificate_templates`, `settings`, `support_tickets`, `audit_log`, `activities` |
| **Relacionamentos** | `property_owners`, `property_timeline`, `person_relationships` |

### Relacionamentos Principais

```
companies ──< users
users ──< user_permissions
users ──< time_records
users ──< justifications

dossiers ──< certificates
dossiers ──< dossier_participants >── persons
dossiers ── properties
persons ──< property_owners >── properties
```

---

## Como Executar

### Pré-requisitos

- Node.js 22+
- PostgreSQL 16+
- npm 10+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Milenaalvez/A.cert.git
cd A.cert

# Instale as dependências
npm install
cd frontend && npm install && cd ..

# Configure o banco de dados
# 1. Crie um banco PostgreSQL
# 2. Configure DATABASE_URL no arquivo .env (veja abaixo)
# 3. Execute as migrations
npx prisma migrate dev

# Popule dados iniciais (opcional)
npm run prisma:seed
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz com:

```env
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@host:5432/acert?sslmode=require

# Servidor
PORT=3001
FRONTEND_URL=http://localhost:3000

# Segurança
JWT_SECRET=uma-chave-secreta-longa-e-aleatoria
PUPPETEER_HEADLESS=true

# SMTP (opcional — para emails transacionais)
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=seu-email@exemplo.com
SMTP_PASS=sua-senha-smtp
SMTP_FROM_EMAIL=noreply@exemplo.com
SMTP_FROM_NAME=A.CERT

# Cloudflare Turnstile (opcional — para proteção anti-bot)
TURNSTILE_SITE_KEY=seu-site-key
TURNSTILE_SECRET_KEY=seu-secret-key
```

### Desenvolvimento

```bash
# Backend + Frontend em paralelo
npm run dev:all

# Apenas backend
npm run dev

# Apenas frontend
npm run dev:frontend
```

### Build de Produção

```bash
npm run build
npm start
```

O build compila TypeScript (`tsc`), gera o Prisma Client, e cria o export estático do Next.js em `frontend/out/`. O servidor Express serve tanto a API quanto os arquivos estáticos.

---

## API REST

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Criar conta |
| `POST` | `/api/auth/login` | Login (retorna `precisaTrocarSenha` se 1º acesso) |
| `GET` | `/api/auth/me` | Dados do usuário logado |
| `POST` | `/api/auth/trocar-senha` | Alterar senha |
| `POST` | `/api/auth/esqueci-senha` | Solicitar recuperação |
| `POST` | `/api/auth/redefinir-senha` | Redefinir com token |
| `GET` | `/api/auth/me/sessions` | Sessões ativas |
| `POST` | `/api/auth/me/sessions/end` | Encerrar sessões |

### Dossiês
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/dossiers` | Listar dossiês (com paginação e filtros) |
| `POST` | `/api/dossiers` | Criar dossiê com participantes e imóvel |
| `GET` | `/api/dossiers/:id` | Detalhes do dossiê |
| `PUT` | `/api/dossiers/:id` | Atualizar dossiê |
| `DELETE` | `/api/dossiers/:id` | Mover para lixeira |
| `POST` | `/api/dossiers/:id/generate` | Gerar PDF do dossiê |

### Certidões
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/consultar` | Iniciar consulta (aceita `personId`, `dossierId`, `certKeys`) |
| `GET` | `/api/consultar/:jobId` | Status da consulta (polling) |
| `POST` | `/api/consultar/:jobId/retry` | Retentar órgãos com falha |
| `GET` | `/api/certificates/:id/download` | Baixar PDF da certidão |

### Empresas
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/companies` | Listar empresas |
| `POST` | `/api/companies` | Criar empresa (admin) |
| `PUT` | `/api/companies/:id` | Atualizar empresa |
| `POST` | `/api/companies/:id/resend-credentials` | Reenviar credenciais |

### Configurações
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/settings` | Listar configurações |
| `PUT` | `/api/settings` | Atualizar configurações |
| `GET` | `/api/settings/system-info` | Informações do sistema |
| `GET` | `/api/settings/backup` | Listar backups |
| `POST` | `/api/settings/backup` | Criar backup |
| `GET` | `/api/settings/backup/:filename/download` | Baixar backup |

### Suporte
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/support/ticket` | Criar ticket de suporte |
| `GET` | `/api/support/ticket/:protocol` | Consultar ticket |

### Notificações
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/notifications` | Listar notificações do usuário |
| `GET` | `/api/notifications/count` | Contagem de não lidas |
| `PUT` | `/api/notifications/:id/read` | Marcar como lida |
| `POST` | `/api/notifications/mark-all-read` | Marcar todas como lidas |

---

## Deploy

O projeto está configurado para deploy em VPS Linux com:

1. **PM2** para gerenciamento de processos
2. **Nginx** como proxy reverso
3. **PostgreSQL** como banco de dados

### Comandos de Deploy

```bash
# Na VPS
cd /var/www/acert/A.CERT
git pull
npm run build
pm2 restart backend frontend
```

O servidor Express serve a API na porta 3001 e os arquivos estáticos do frontend através da mesma instância. O Nginx deve ser configurado para proxy reverso no domínio, encaminhando tanto as rotas `/api/*` quanto os arquivos estáticos para o Express.

---

## Segurança

- Senhas armazenadas com hash bcrypt (12 rounds de salt)
- Autenticação via JWT com expiração de 7 dias
- Middleware de autorização em todas as rotas protegidas
- Confirmação de email obrigatória para novos registros
- Troca de senha forçada no primeiro acesso
- Registro de auditoria para ações críticas
- Suporte a CAPTCHA (Cloudflare Turnstile) no registro
- `.env`, `dist/`, `tmp/` no `.gitignore`

---

## Licença

Projeto privado. Todos os direitos reservados.
