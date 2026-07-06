# Arquitetura — A.CERT

Documentação técnica da stack, fluxos de dados e decisões arquiteturais.

---

## Visão Geral

A.CERT é uma plataforma SaaS que automatiza a emissão de certidões imobiliárias em 7 órgãos públicos brasileiros. Opera como aplicação web com backend Express + PostgreSQL (Prisma ORM) e frontend Next.js 15.

### Diagrama de Alto Nível

```
                          ┌──────────────────────────┐
                          │     Nginx (Porta 80/443)  │
                          │     Proxy Reverso + HTTPS │
                          └──────────┬───────────────┘
                                     │
                          ┌──────────┴───────────┐
                          │                      │
                    ┌─────┴─────┐          ┌─────┴─────┐
                    │  Arquivos │          │   API     │
                    │ Estáticos │          │ Express 5 │
                    │ (out/)    │          │ :3001     │
                    └───────────┘          └─────┬─────┘
                                                 │
                          ┌──────────────────────┼──────────────────────┐
                          │                      │                      │
                    ┌─────┴─────┐          ┌─────┴─────┐          ┌─────┴─────┐
                    │ Conectores│          │  Serviços  │          │  Prisma   │
                    │ Puppeteer │          │ Orquestrador│          │   ORM     │
                    │ 7 órgãos  │          │ CAPTCHA     │          │ PostgreSQL│
                    └───────────┘          │ Dossiê PDF  │          └───────────┘
                                           │ Email SMTP  │
                                           └─────────────┘
```

---

## Stack Tecnológica

### Backend

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Runtime | Node.js + TypeScript 5 | Tipagem forte, compatibilidade com Puppeteer |
| Servidor | Express 5 | Leve, maduro, ampla compatibilidade |
| Banco | PostgreSQL + Prisma ORM + pg Pool | Type-safe via Prisma Client, raw SQL para queries complexas |
| Browser | Puppeteer + Stealth Plugin | Automação realista, evasão de detecção anti-bot |
| PDF | pdf-lib | Manipulação programática de PDFs (merge, embed) |
| Auth | JWT + bcryptjs | Stateless, seguro |
| Email | Nodemailer | Compatível com qualquer SMTP |
| Uploads | Multer | Padrão Express para upload de arquivos |

### Frontend

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 15 + React 19 | App Router, export estático |
| Estilo | Tailwind CSS 4 | Utility-first, design system consistente |
| Gráficos | Recharts | Nativos React, responsivos |
| Ícones | Lucide React | Leves, tree-shakeable |
| Internacionalização | next-intl | Suporte a múltiplos idiomas |

---

## Fluxo de Dados

### 1. Criação de Dossiê

```
1. Usuário preenche modal (4 passos):
   a. Tipo de transação (venda/locação)
   b. Imóvel (identificação + checkbox matrícula)
   c. Partes envolvidas (múltiplos papéis)
   d. Revisão

2. POST /api/dossiers
   ├── Cria property (se informada)
   ├── Cria dossier com transaction_type
   └── Para cada participante:
       ├── Busca ou cria person por CPF
       └── Insere em dossier_participants
```

### 2. Emissão de Certidões

```
1. POST /api/consultar
   Body: { nome, cpf, dataNascimento, nomeMae, email, personId, dossierId }

2. Orquestrador (orquestrador.service.ts)
   ├── Cria jobId
   ├── Dispara conectores em paralelo
   └── Persiste resultados com person_id e dossier_id

3. Polling: GET /api/consultar/:jobId
   ├── Status por órgão
   ├── CAPTCHAs pendentes
   └── Status geral do job
```

### 3. Geração de Dossiê PDF

```
1. GET /api/dossiers/:id
   ├── Query dossier + property + participants + certificates
   └── Retorna dados completos

2. POST /api/dossiers/:id/generate
   ├── Monta payload com participantes e certidões
   ├── Gera PDF:
   │   ├── Capa: tipo de transação, participantes
   │   ├── Seção por participante (nome, CPF, certidões embedadas)
   │   ├── Informações do imóvel
   │   └── Tabela resumo e estatísticas
   └── Retorna Buffer PDF
```

---

## Conectores (IConnector)

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

**Fluxo padrão:**
1. `createPage()` — Nova página Puppeteer com stealth
2. Preenche formulário com dados do proprietário
3. Detecta CAPTCHA → pausa e aguarda resolução manual
4. Captura PDF do resultado
5. Retorna `ConnectorResult { status, orgao, documento, protocolo }`

| Órgão | Tipo de Certidão | Método de Captura |
|---|---|---|
| Receita Federal | CPF/CNPJ | Navegação + PDF |
| TRF 1ª Região | Cível e Criminal | Navegação + PDF |
| TJDFT | Distribuição Cível | Navegação + PDF |
| TRT 10ª Região | Trabalhista | Navegação + PDF |
| TST | Trabalhista | Navegação + PDF |
| SEFAZ-DF | Débitos Fiscais | Navegação + PDF |
| ONR | Ônus Reais | Navegação + PDF |

---

## Banco de Dados

### Modelagem (21 tabelas)

**Core do Negócio:**
- `persons` — Cadastro de pessoas (CPF, nome, dados pessoais)
- `properties` — Imóveis (identificador, matrícula, endereço)
- `dossiers` — Dossiês com `transaction_type` (venda/locação)
- `certificates` — Certidões por dossiê vinculadas a `person_id`
- `dossier_participants` — Vínculo pessoa-dossiê com `role`

**Multiempresas:**
- `companies` — Empresas cadastradas (plano, licença, logo)
- `company_settings` — Configurações por empresa (key-value)

**RH Interno:**
- `users` — Usuários com controle de acesso
- `departments`, `positions` — Estrutura organizacional
- `justifications`, `time_records` — Controle de ponto
- `user_permissions` — Permissões granulares por usuário
- `team_activities` — Log de atividades da equipe

**Sistema:**
- `organs` — Órgãos integrados com status e tokens
- `certificate_templates` — Templates de certidões disponíveis
- `settings` — Configurações globais (key-value)
- `activities` — Log de atividades geral
- `support_tickets` — Tickets de suporte
- `audit_log` — Log de auditoria com informações detalhadas

**Relacionamentos:**
- `property_owners` — Vínculo pessoa-imóvel
- `property_timeline` — Histórico de alterações do imóvel
- `person_relationships` — Vínculo entre pessoas (parentesco)

---

## Decisões Arquiteturais

1. **PostgreSQL (antes SQLite):** Migrado para deploy em produção. Prisma ORM fornece type-safety nas operações CRUD, pool `pg` mantém flexibilidade para queries analíticas.

2. **Puppeteer com Stealth:** Órgãos públicos usam detecção anti-bot agressiva (Cloudflare, DataDome). O stealth plugin modifica fingerprints do navegador para parecer tráfego humano.

3. **CAPTCHA interativo:** Impossível automatizar 100%. O sistema detecta CAPTCHAs e pausa para resolução manual. Cloudflare Turnstile é usado para proteção no registro.

4. **pdf-lib para merge:** JavaScript puro, sem dependências nativas, permitindo manipulação programática de PDFs em qualquer plataforma.

5. **Export estático do Next.js:** O frontend é buildado como HTML/CSS/JS estático (`NEXT_EXPORT=1`) e servido pelo Express, eliminando a necessidade de um servidor Node.js dedicado para o frontend.

6. **Multiempresas manual:** Cadastro de empresas feito pelo admin. Self-service com landing page pública será implementado em fase futura.

---

## Segurança

- Senhas hashadas com bcryptjs (12 rounds)
- JWT com expiração de 7 dias
- `password_change_required` força troca de senha no primeiro login
- Middleware de autorização em todas as rotas protegidas
- `.env`, `data/`, `dist/`, `release/`, `tmp/` no `.gitignore`
- Logs de auditoria para ações críticas (criação, edição, exclusão)
- Sessões rastreáveis com dispositivo, navegador, OS e IP
- Rate limiting via Cloudflare (nível de CDN)

---

## Próximos Passos

- [ ] Landing page pública com planos e pagamento
- [ ] Emissão sequencial por pessoa na interface
- [ ] Relatórios avançados com gráficos comparativos
- [ ] Webhooks para integração com sistemas externos
- [ ] Aplicativo mobile (React Native)
