export interface Guia {
  slug: string;
  titulo: string;
  descricao: string;
  artigos: { slug?: string; titulo: string }[];
}

export const categorias: Guia[] = [
  {
    slug: "primeiros-passos",
    titulo: "Primeiros Passos",
    descricao: "Configuração inicial e primeiros acessos ao sistema.",
    artigos: [
      { slug: "bem-vindo-a-acert", titulo: "Bem-vindo à A.CERT" },
      { slug: "primeiro-acesso", titulo: "Primeiro Acesso" },
      { slug: "conhecendo-dashboard", titulo: "Conhecendo o Dashboard" },
      { slug: "navegando-sistema", titulo: "Navegando pelo Sistema" },
      { slug: "fluxo-completo", titulo: "Fluxo Completo de Consulta" },
    ],
  },
  {
    slug: "dossies",
    titulo: "Dossiês",
    descricao: "Criação e gerenciamento de dossiês imobiliários.",
    artigos: [
      { slug: "o-que-e-dossie", titulo: "O que é um Dossiê" },
      { slug: "criando-dossie", titulo: "Criando um Dossiê" },
      { slug: "editando-dossie", titulo: "Editando um Dossiê" },
      { slug: "status-dossie", titulo: "Status do Dossiê" },
      { slug: "excluindo-dossie", titulo: "Excluindo um Dossiê" },
    ],
  },
  {
    slug: "pessoas",
    titulo: "Pessoas",
    descricao: "Cadastro e gestão de pessoas físicas e jurídicas.",
    artigos: [
      { slug: "cadastro-pessoa", titulo: "Cadastro de Pessoa" },
      { slug: "vinculos-parentais", titulo: "Vínculos Parentais" },
      { slug: "busca-pessoa", titulo: "Busca de Pessoa" },
    ],
  },
  {
    slug: "emissao-certidoes",
    titulo: "Emissão de Certidões",
    descricao: "Como emitir certidões nos órgãos integrados.",
    artigos: [
      { slug: "como-emitir", titulo: "Como Emitir Certidões" },
      { slug: "display-remoto", titulo: "Display Remoto (VNC)" },
      { slug: "captcha", titulo: "Resolvendo CAPTCHAs" },
      { slug: "orgaos-disponiveis", titulo: "Órgãos Disponíveis" },
    ],
  },
  {
    slug: "orgaos-integrados",
    titulo: "Órgãos Integrados",
    descricao: "Detalhes sobre cada órgão público conectado.",
    artigos: [
      { slug: "trf1", titulo: "TRF1 - Tribunal Regional Federal" },
      { slug: "receita-federal", titulo: "Receita Federal" },
      { slug: "tjdft", titulo: "TJDFT - Tribunal de Justiça do DF" },
      { slug: "trt", titulo: "TRT - Tribunal Regional do Trabalho" },
      { slug: "tst", titulo: "TST - Tribunal Superior do Trabalho" },
    ],
  },
  {
    slug: "dossies-pdf",
    titulo: "Dossiês em PDF",
    descricao: "Geração e download de dossiês consolidados em PDF.",
    artigos: [
      { slug: "gerar-pdf", titulo: "Gerar PDF do Dossiê" },
      { slug: "download-pdf", titulo: "Download do Dossiê" },
    ],
  },
  {
    slug: "relatorios",
    titulo: "Relatórios",
    descricao: "Relatórios e estatísticas de uso do sistema.",
    artigos: [
      { slug: "relatorio-certidoes", titulo: "Relatório de Certidões" },
      { slug: "relatorio-produtividade", titulo: "Relatório de Produtividade" },
    ],
  },
  {
    slug: "usuarios-empresas",
    titulo: "Usuários e Empresas",
    descricao: "Gestão de usuários, permissões e dados da empresa.",
    artigos: [
      { slug: "convite-usuario", titulo: "Convidar Usuário" },
      { slug: "permissoes", titulo: "Permissões" },
      { slug: "dados-empresa", titulo: "Dados da Empresa" },
    ],
  },
  {
    slug: "configuracoes",
    titulo: "Configurações",
    descricao: "Configurações do sistema e preferências.",
    artigos: [
      { slug: "config-geral", titulo: "Configurações Gerais" },
      { slug: "templates-pdf", titulo: "Templates de PDF" },
      { slug: "backup", titulo: "Backup e Restauração" },
    ],
  },
  {
    slug: "lixeira-recuperacao",
    titulo: "Lixeira e Recuperação",
    descricao: "Recuperação de itens excluídos e gestão da lixeira.",
    artigos: [
      { slug: "lixeira", titulo: "Lixeira" },
      { slug: "restaurar-item", titulo: "Restaurar Item" },
      { slug: "excluir-permanente", titulo: "Excluir Permanentemente" },
    ],
  },
];

export type ConteudoBloco = {
  tipo: "hero" | "azul" | "verde" | "amarelo" | "timeline" | "problemas" | "area" | "fluxograma" | "etapa";
  titulo: string;
  texto?: string;
  passos?: { titulo: string; texto?: string; slug?: string; icone?: string }[];
  problemas?: { q: string; a: string }[];
  icone?: string;
  itens?: string[];
  link?: { slug: string; categoria?: string; titulo: string };
};

interface ArtigoDetalhe {
  titulo: string; slug: string; categoria: string; nivel: string; tempo: string;
  subtitulo: string; descricao: string; atualizado: string; conteudo: ConteudoBloco[];
}

function a(slug: string, titulo: string, subtitulo: string, descricao: string, categoria: string, nivel: string, tempo: string, atualizado: string, conteudo: ConteudoBloco[]): ArtigoDetalhe {
  return { slug, titulo, subtitulo, descricao, categoria, nivel, tempo, atualizado, conteudo };
}

export const artigosDetalhes: Record<string, ArtigoDetalhe> = {
"primeiro-acesso": a("primeiro-acesso", "Primeiro Acesso", "Login e Configuração Inicial", "Guia completo para seu primeiro acesso ao sistema: login, verificação de email, configurações essenciais e o que evitar.", "primeiros-passos", "iniciante", "5 min", "26/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Primeiro Acesso à Plataforma",
            "texto": "Seu primeiro acesso define o tom de toda sua experiência. Este guia cobre não apenas o passo a passo, mas também os erros comuns que podem te travam e como resolvê-los rapidamente."
      },
      {
            "tipo": "fluxograma",
            "titulo": "Fluxo do Primeiro Acesso",
            "texto": "Cadastro → Confirmação de email → Login → Troca de senha → Configurações → Dashboard. Se falhar em qualquer etapa, veja a seção de problemas abaixo."
      },
      {
            "tipo": "timeline",
            "titulo": "Passo a Passo",
            "passos": [
                  {
                        "titulo": "1. Acesse a tela de login",
                        "texto": "Vá para acert.tech e digite email e senha. Se sua conta foi criada por um administrador, você recebeu um email de convite. Se ainda não tem conta, clique em Criar Conta.",
                        "icone": "🔐"
                  },
                  {
                        "titulo": "2. Confirme seu email",
                        "texto": "Verifique sua caixa de entrada e a pasta de spam. O link de verificação expira em 24 horas. Se não chegar, solicite reenvio na tela de login.",
                        "icone": "📧"
                  },
                  {
                        "titulo": "3. Troque a senha temporária",
                        "texto": "Use no mínimo 8 caracteres, misturando maiúsculas, minúsculas, números e símbolos. Acesse Perfil > Configurações > Segurança > Alterar Senha.",
                        "icone": "🔑"
                  },
                  {
                        "titulo": "4. Configure suas preferências",
                        "texto": "Escolha o tema (Claro/Escuro/Automático), o idioma e o formato de data. Suas preferências são salvas na nuvem e sincronizadas entre dispositivos.",
                        "icone": "⚙"
                  },
                  {
                        "titulo": "5. Explore o Dashboard",
                        "texto": "Após o login você verá o Dashboard com indicadores de dossiês, certidões e atividades recentes. É seu centro de comando.",
                        "icone": "📊"
                  },
                  {
                        "titulo": "6. Tour guiado opcional",
                        "texto": "Na primeira visita, um tour interativo é oferecido. Para repetir depois: Central de Ajuda > Tour pela Plataforma.",
                        "icone": "🧭"
                  }
            ]
      },
      {
            "tipo": "amarelo",
            "titulo": "O que NÃO fazer",
            "texto": "Nunca compartilhe sua senha com colegas — cada usuário deve ter login próprio. Não use senhas óbvias como '123456' ou 'admin'. Não feche o navegador durante o cadastro. Não ignore a confirmação de email — sem ela o sistema fica bloqueado. Não use email pessoal para contas corporativas."
      },
      {
            "tipo": "problemas",
            "titulo": "Se algo der errado",
            "problemas": [
                  {
                        "q": "Email de verificação não chegou",
                        "a": "Verifique a pasta de spam. Se não encontrar, use a opção 'Reenviar email' na tela de login. O link expira em 24h — se venceu, solicite um novo cadastro. Se o problema persistir, o administrador pode confirmar manualmente."
                  },
                  {
                        "q": "Senha não funciona / Esqueci a senha",
                        "a": "Use 'Esqueci minha senha' na tela de login. Você receberá um link de redefinição por email. Se o email não chegar, verifique o spam. O link expira em 1 hora."
                  },
                  {
                        "q": "Conta bloqueada após várias tentativas",
                        "a": "Aguarde 15 minutos — o bloqueio é automático e temporário. Não tente adivinhar a senha repetidamente pois isso aumenta o tempo de bloqueio. Se precisar de acesso urgente, contate o suporte."
                  },
                  {
                        "q": "Tour guiado não apareceu",
                        "a": "Você pode acionar o tour manualmente em Central de Ajuda > Tour pela Plataforma a qualquer momento."
                  }
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Segurança da Conta",
            "texto": "Cada usuário deve ter login próprio. Sempre faça logout em computadores compartilhados. A A.CERT envia alertas por email se detectar atividade incomum. Ative a verificação em dois fatores se disponível."
      },
      {
            "tipo": "verde",
            "titulo": "Dica Rápida",
            "texto": "Salve acert.tech nos favoritos. No Chrome ou Edge, instale a A.CERT como app desktop clicando no ícone de instalação na barra de endereço."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo passo",
            "texto": "Explore o Dashboard em detalhes para dominar os indicadores e gráficos.",
            "icone": "👆",
            "link": {
                  "slug": "conhecendo-dashboard",
                  "categoria": "primeiros-passos",
                  "titulo": "Conhecendo o Dashboard"
            }
      }
]),

"conhecendo-dashboard": a("conhecendo-dashboard", "Conhecendo o Dashboard", "Seu Centro de Comando", "Aprenda a interpretar cada indicador, gráfico e métrica do Dashboard para tomar decisões rápidas e precisas.", "primeiros-passos", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Conhecendo o Dashboard",
            "texto": "O Dashboard é a primeira tela após o login e funciona como centro de comando da A.CERT. Ele condensa informações vitais sobre dossiês, certidões, produtividade e status dos órgãos em um único painel."
      },
      {
            "tipo": "area",
            "titulo": "Cards de Indicadores Principais",
            "itens": [
                  "Dossiês em Andamento: dossiês ativos com certidões sendo processadas. Clique para ver a lista completa.",
                  "Dossiês Concluídos: total de processos finalizados com todas as certidões emitidas.",
                  "Certidões Emitidas: contagem absoluta de certidões obtidas com sucesso desde o início do uso.",
                  "Certidões Pendentes: quantidade que ainda aguarda emissão — ideal para priorizar o trabalho do dia.",
                  "Taxa de Sucesso: percentual de certidões obtidas em relação ao total solicitado. Acima de 95% é excelente."
            ]
      },
      {
            "tipo": "fluxograma",
            "titulo": "Fluxo de Informações do Dashboard",
            "texto": "O Dashboard coleta dados em tempo real de três fontes: banco de dados de dossiês e certidões, logs de atividade dos displays remotos e monitoramento de disponibilidade dos órgãos. Essas informações são consolidadas e exibidas nos gráficos e indicadores."
      },
      {
            "tipo": "area",
            "titulo": "Gráficos e Visualizações",
            "itens": [
                  "Gráfico de Emissões por Mês: barras mensais mostrando a evolução do volume de certidões emitidas.",
                  "Distribuição por Status: gráfico com proporção de dossiês Em Andamento, Pendentes, Concluídos e Cancelados.",
                  "Prioridades do Dia: lista ordenada dos dossiês mais urgentes que ainda precisam de certidões.",
                  "Status dos Órgãos: indicadores verde (online) e vermelho (offline) para cada órgão integrado.",
                  "Atividades Recentes: feed cronológico das últimas ações suas e da sua equipe."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Como Interpretar os Números",
            "texto": "Não se prenda só aos números absolutos. Observe tendências: a taxa de sucesso está caindo? Há um órgão específico com problema? Dossiês pendentes acumulando? Talvez seja hora de redistribuir a carga de trabalho. Use o Dashboard como ferramenta de gestão."
      },
      {
            "tipo": "verde",
            "titulo": "Dica de Produtividade",
            "texto": "Os cards de indicadores são clicáveis. Clique em 'Dossiês em Andamento' para ir direto à lista filtrada. Use o botão 'Novo Dossiê' no topo para iniciar uma consulta sem navegar pelo menu."
      },
      {
            "tipo": "amarelo",
            "titulo": "Atenção",
            "texto": "Os indicadores são atualizados em tempo real, mas podem levar até 30 segundos para refletir uma emissão recém-concluída. Se algo parecer desatualizado, aguarde ou recarregue a página (F5)."
      },
      {
            "tipo": "etapa",
            "titulo": "Explore mais",
            "texto": "Depois de dominar o Dashboard, aprenda a navegar pelo restante do sistema.",
            "icone": "🧭",
            "link": {
                  "slug": "navegando-sistema",
                  "categoria": "primeiros-passos",
                  "titulo": "Navegando pelo Sistema"
            }
      }
]),

"navegando-sistema": a("navegando-sistema", "Navegando pelo Sistema", "Menu, Atalhos e Seções", "Domine a navegação completa da A.CERT: menu lateral, atalhos de teclado, busca rápida e todas as seções disponíveis.", "primeiros-passos", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Navegando pelo Sistema",
            "texto": "A interface da A.CERT foi projetada para máxima produtividade. Conhecer a estrutura do menu, os atalhos de teclado e os recursos de busca rápida fará de você um usuário muito mais ágil."
      },
      {
            "tipo": "area",
            "titulo": "Estrutura do Menu Lateral",
            "itens": [
                  "Dashboard: visão geral com indicadores e gráficos. Ponto de partida de toda sessão.",
                  "Dossiês: listagem completa com filtros por status, data e participante.",
                  "Certidões: visão consolidada de todas as certidões já emitidas com filtros por órgão e status.",
                  "Relatórios: exportação de dados em Excel e PDF com estatísticas detalhadas.",
                  "Pessoas: base de pessoas físicas e jurídicas com cadastro, edição e vínculos parentais.",
                  "Imóveis: cadastro de propriedades com matrícula, endereço e cartório.",
                  "Central de Ajuda: documentação completa, guias, tutoriais e acesso ao suporte técnico.",
                  "Usuários: gestão de usuários da empresa, permissões, convites e status de conta.",
                  "Configurações: ajustes gerais, dados da empresa, templates de PDF e segurança.",
                  "Lixeira: recuperação de itens excluídos com retenção de 30 dias."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Busca Rápida Global (Ctrl+K / ⌘K)",
            "texto": "O recurso mais poderoso de navegação. Pressione Ctrl+K (ou ⌘K no Mac) para abrir a barra de busca global. Digite nome de pessoa, número de dossiê, seção do menu ou qualquer termo. Use as setas para navegar, Enter para abrir e Esc para fechar."
      },
      {
            "tipo": "area",
            "titulo": "Atalhos de Teclado Essenciais",
            "itens": [
                  "Ctrl+K / ⌘K: Abrir busca rápida global",
                  "Esc: Fechar modais, busca rápida e menus",
                  "F5: Recarregar a página atual",
                  "Tab: Navegar entre campos de formulário",
                  "Enter: Confirmar e submeter formulários"
            ]
      },
      {
            "tipo": "area",
            "titulo": "Barra Superior (Header)",
            "itens": [
                  "Logo A.CERT: clique para voltar ao Dashboard a qualquer momento.",
                  "Ícone de notificações (sino): alertas de certidões concluídas e prazos importantes.",
                  "Avatar do usuário: acesso ao perfil, configurações, troca de tema e logout."
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Dica de Navegação",
            "texto": "O menu lateral é recolhível. Clique no ícone sanduíche (☰) para minimizar e ganhar espaço de tela. Os ícones permanecem visíveis e o texto aparece ao passar o mouse."
      },
      {
            "tipo": "amarelo",
            "titulo": "Importante",
            "texto": "Algumas seções podem não aparecer dependendo das suas permissões. Se uma seção que você espera ver está ausente, verifique com o administrador da sua empresa."
      },
      {
            "tipo": "etapa",
            "titulo": "Pronto para produzir?",
            "texto": "Veja o fluxo completo de uma consulta, do cadastro da pessoa até a entrega do PDF.",
            "icone": "🚀",
            "link": {
                  "slug": "fluxo-completo",
                  "categoria": "primeiros-passos",
                  "titulo": "Fluxo Completo de Consulta"
            }
      }
]),

"fluxo-completo": a("fluxo-completo", "Fluxo Completo de Consulta", "Do Início ao Fim", "Passo a passo completo: do cadastro da pessoa até o PDF final do dossiê com todas as certidões emitidas.", "primeiros-passos", "iniciante", "10 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Fluxo Completo de uma Consulta",
            "texto": "Este guia percorre o ciclo completo de uma consulta imobiliária na A.CERT. Do cadastro da pessoa até a entrega do PDF consolidado ao cliente, todas as etapas são cobertas em detalhes."
      },
      {
            "tipo": "timeline",
            "titulo": "As 9 Etapas do Fluxo Completo",
            "passos": [
                  {
                        "titulo": "1. Cadastre a Pessoa",
                        "texto": "Em Pessoas > Nova Pessoa, preencha nome completo, CPF, data de nascimento, nome da mãe e do pai. Esses dois últimos são críticos para certidões da Justiça Federal e Estadual.",
                        "icone": "👤"
                  },
                  {
                        "titulo": "2. Cadastre o Imóvel (se aplicável)",
                        "texto": "Em Imóveis > Novo Imóvel, informe matrícula, endereço, CEP e cartório. Essencial para certidões de ônus reais.",
                        "icone": "🏢"
                  },
                  {
                        "titulo": "3. Crie o Dossiê",
                        "texto": "Clique em Novo Dossiê, selecione a pessoa e o imóvel, defina o tipo de transação e atribua um identificador descritivo como '2026-042 - Maria Silva - Casa Asa Sul'.",
                        "icone": "📂"
                  },
                  {
                        "titulo": "4. Selecione as Certidões",
                        "texto": "Na aba Partes Envolvidas, clique em Emitir Certidão e marque os órgãos desejados: Receita Federal, TRF1, TJDFT, TRT, TST, SEFAZ-DF, ONR.",
                        "icone": "📜"
                  },
                  {
                        "titulo": "5. Dispare a Consulta",
                        "texto": "Clique em Emitir. Uma nova aba abrirá com o Display Remoto (VNC) mostrando o navegador acessando os sites oficiais e preenchendo formulários automaticamente.",
                        "icone": "🚀"
                  },
                  {
                        "titulo": "6. Resolva CAPTCHAs",
                        "texto": "Quando um CAPTCHA aparecer, a automação pausa. Resolva-o manualmente (checkbox, imagens, texto). Após a resolução, o sistema retoma automaticamente.",
                        "icone": "🔐"
                  },
                  {
                        "titulo": "7. Certidões Emitidas",
                        "texto": "Cada certidão obtida aparece na aba Certidões do dossiê com status Emitida. Você pode visualizar cada PDF individualmente sem esperar a conclusão de todas.",
                        "icone": "✅"
                  },
                  {
                        "titulo": "8. Gere o PDF Consolidado",
                        "texto": "Com todas as certidões prontas, clique em Gerar PDF. O sistema compila tudo em um arquivo profissional com capa, índice e páginas numeradas.",
                        "icone": "📄"
                  },
                  {
                        "titulo": "9. Download e Entrega",
                        "texto": "O PDF é baixado automaticamente. Você pode baixá-lo novamente a qualquer momento. Entregue ao cliente por email ou WhatsApp.",
                        "icone": "📥"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Tempo Estimado",
            "texto": "Uma consulta completa com 5 certidões leva em média 10 a 15 minutos. Para otimizar, evite horários de pico (10h-12h e 14h-16h) quando os sites oficiais costumam ficar mais lentos."
      },
      {
            "tipo": "azul",
            "titulo": "Consultas Simultâneas (Pool de Displays)",
            "texto": "A A.CERT possui um pool de 3 displays VNC que permite executar até 3 consultas ao mesmo tempo em dossiês diferentes. Gerencie as abas do navegador para alternar entre os displays ativos."
      },
      {
            "tipo": "amarelo",
            "titulo": "Cuidados Durante a Consulta",
            "texto": "Não feche a aba do Display Remoto com consultas em andamento. Se a internet cair, recarregue a página do dossiê — certidões já emitidas não são perdidas."
      },
      {
            "tipo": "etapa",
            "titulo": "Primeiro passo do fluxo",
            "texto": "Antes de criar dossiês, entenda o conceito e a estrutura de um dossiê.",
            "icone": "📂",
            "link": {
                  "slug": "o-que-e-dossie",
                  "categoria": "dossies",
                  "titulo": "O que é um Dossiê"
            }
      }
]),

"o-que-e-dossie": a("o-que-e-dossie", "O que é um Dossiê", "Conceito e Estrutura", "Entenda o conceito de dossiê imobiliário digital, sua estrutura completa e como ele organiza todo o processo de certidões.", "dossies", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "O que é um Dossiê",
            "texto": "Na A.CERT, o dossiê é a unidade central de organização de todo o trabalho. É uma pasta digital inteligente que reúne dados cadastrais, imóveis, certidões, documentos e histórico em um só lugar. Cada negociação imobiliária gira em torno de um dossiê."
      },
      {
            "tipo": "area",
            "titulo": "Componentes de um Dossiê",
            "itens": [
                  "Identificador único: formato ano-sequencial (ex: 2026-015). Referência rápida para localizar o dossiê.",
                  "Pessoa vinculada: indivíduo ou empresa sobre o qual as certidões serão emitidas. Obrigatório.",
                  "Imóvel vinculado (opcional): propriedade relacionada à transação. Essencial para certidões de ônus reais.",
                  "Participantes adicionais: cônjuges, fiadores, coproprietários — qualquer pessoa adicional no contexto da transação.",
                  "Certidões: lista de certidões solicitadas com status individual (Pendente, Em andamento, Emitida, Erro).",
                  "Documentos anexados: upload de contratos, procurações, comprovantes e documentos digitalizados.",
                  "Observações: campo livre para notas da equipe, instruções e informações contextuais.",
                  "Histórico de atividades: registro completo de quem fez o quê e quando. Essencial para auditoria.",
                  "Status geral: Em andamento, Pendente, Concluído, Cancelado ou Arquivado."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Por que Usar Dossiês?",
            "texto": "Antes da A.CERT, o processo era caótico: planilhas, PDFs soltos e anotações em papéis. O dossiê resolve isso centralizando tudo em um lugar acessível por toda a equipe, com rastreabilidade completa. Você nunca mais perde uma certidão ou esquece um prazo."
      },
      {
            "tipo": "fluxograma",
            "titulo": "Ciclo de Vida do Dossiê",
            "texto": "(1) Criação: usuário cria o dossiê e vincula pessoa/imóvel. (2) Configuração: seleciona certidões a emitir. (3) Emissão: sistema dispara consultas, status muda para Em andamento. (4) Finalização: todas certidões emitidas, status muda para Concluído. (5) PDF: usuário gera PDF consolidado. (6) Arquivamento: dossiê pode ser arquivado para manter lista enxuta."
      },
      {
            "tipo": "verde",
            "titulo": "Melhores Práticas",
            "texto": "Adote uma convenção de nomenclatura: 'AAAA-NNN - Nome Cliente - Referência'. Mantenha observações atualizadas com o contexto da transação — são visíveis para toda a equipe."
      },
      {
            "tipo": "amarelo",
            "titulo": "Importante",
            "texto": "Um dossiê pode ter múltiplos participantes, cada um com seu próprio conjunto de certidões. Em uma transação de venda, emita certidões do vendedor e comprador no mesmo dossiê."
      },
      {
            "tipo": "etapa",
            "titulo": "Mão na massa",
            "texto": "Entendeu o conceito? Agora aprenda a criar seu primeiro dossiê na prática.",
            "icone": "➕",
            "link": {
                  "slug": "criando-dossie",
                  "categoria": "dossies",
                  "titulo": "Criando um Dossiê"
            }
      }
]),

"criando-dossie": a("criando-dossie", "Criando um Dossiê", "Criação Passo a Passo", "Aprenda a criar um dossiê, o que evitar e como resolver problemas na criação.", "dossies", "iniciante", "8 min", "26/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Criando um Dossiê",
            "texto": "Criar um dossiê é o ponto de partida de todo processo. Este guia cobre o passo a passo, os erros mais comuns que travam a criação e o que fazer se algo der errado."
      },
      {
            "tipo": "fluxograma",
            "titulo": "Fluxo de Criação",
            "texto": "Novo Dossiê → Selecionar Pessoa (obrigatório) → Vincular Imóvel (opcional) → Tipo de Transação → Identificador → Revisar → Confirmar. Se a pessoa ou imóvel não existir, cadastre antes de prosseguir."
      },
      {
            "tipo": "timeline",
            "titulo": "Passo a Passo",
            "passos": [
                  {
                        "titulo": "1. Acesse a seção Dossiês",
                        "texto": "Use o menu lateral ou o botão rápido 'Novo Dossiê' no Dashboard. A lista de dossiês será exibida com filtros.",
                        "icone": "📂"
                  },
                  {
                        "titulo": "2. Clique em Novo Dossiê",
                        "texto": "No canto superior direito, clique no botão azul. Um modal será aberto com o formulário de criação dividido em seções lógicas.",
                        "icone": "➕"
                  },
                  {
                        "titulo": "3. Selecione a Pessoa",
                        "texto": "Digite nome ou CPF. O sistema faz busca em tempo real. Se a pessoa não estiver cadastrada, cadastre antes em Pessoas > Nova Pessoa.",
                        "icone": "👤"
                  },
                  {
                        "titulo": "4. Vincule um Imóvel (opcional)",
                        "texto": "Busque e selecione o imóvel cadastrado. Dossiês sem imóvel são válidos para consultas apenas sobre a pessoa. Se faltar o imóvel, cadastre em Imóveis > Novo Imóvel.",
                        "icone": "🏢"
                  },
                  {
                        "titulo": "5. Defina o Tipo de Transação",
                        "texto": "Escolha entre Venda, Locação, Due Diligence, Financiamento ou Outros. A classificação ajuda a organizar os dossiês posteriormente.",
                        "icone": "📝"
                  },
                  {
                        "titulo": "6. Atribua um Identificador",
                        "texto": "Gerado automaticamente (ano-sequencial). Personalize para algo descritivo: '2026-042 - Maria Silva - Venda Apt 302'.",
                        "icone": "🏷"
                  },
                  {
                        "titulo": "7. Revise e Confirme",
                        "texto": "Verifique os dados e clique em Criar Dossiê. Você será redirecionado para a página de detalhes.",
                        "icone": "✅"
                  }
            ]
      },
      {
            "tipo": "amarelo",
            "titulo": "O que NÃO fazer",
            "texto": "Não crie dossiês sem pessoa vinculada — o sistema exige pelo menos um participante. Não misture transações diferentes no mesmo dossiê (crie um separado para cada). Não use identificadores genéricos como 'Dossiê 1' ou 'teste' — dificulta encontrar depois. Não feche o modal de criação antes de confirmar — os dados preenchidos serão perdidos."
      },
      {
            "tipo": "problemas",
            "titulo": "Se algo der errado",
            "problemas": [
                  {
                        "q": "Botão 'Criar Dossiê' está desabilitado",
                        "a": "Verifique se todos os campos obrigatórios foram preenchidos: pessoa vinculada, tipo de transação e identificador. Se a pessoa não foi encontrada na busca, cadastre-a primeiro."
                  },
                  {
                        "q": "Pessoa não aparece na busca",
                        "a": "A pessoa precisa estar cadastrada no sistema antes de criar o dossiê. Vá em Pessoas > Nova Pessoa, cadastre e depois retorne ao dossiê. A busca é por nome ou CPF — verifique se digitou corretamente."
                  },
                  {
                        "q": "Dossiê sumiu após criar",
                        "a": "Verifique os filtros na lista de dossiês — pode estar com algum filtro ativo que oculta o novo registro. O padrão é mostrar apenas dossiês ativos. Limpe os filtros ou procure pelo identificador."
                  },
                  {
                        "q": "Erro ao criar: 'limite de dossiês excedido'",
                        "a": "Sua cota de dossiês ativos pode ter sido atingida. Arquive ou conclua dossiês antigos para liberar espaço. Se precisar de mais, solicite ao administrador."
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Dica de Organização",
            "texto": "Crie dossiês separados para cada transação, mesmo que envolvam a mesma pessoa. Use o campo de observações para vincular dossiês relacionados: 'Ver também dossiê 2026-041'."
      },
      {
            "tipo": "azul",
            "titulo": "Atalho de Produtividade",
            "texto": "Use Ctrl+K e digite 'novo dossiê' para abrir o modal de criação instantaneamente, sem navegar pelo menu."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo passo",
            "texto": "Dossiê criado! Veja como editá-lo para ajustar informações e adicionar participantes.",
            "icone": "✏️",
            "link": {
                  "slug": "editando-dossie",
                  "categoria": "dossies",
                  "titulo": "Editando um Dossiê"
            }
      }
]),

"editando-dossie": a("editando-dossie", "Editando um Dossiê", "Edição e Atualização", "Saiba como editar dados de um dossiê existente, adicionar observações, gerenciar participantes e ajustar prioridades.", "dossies", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Editando um Dossiê",
            "texto": "Dossiês são dinâmicos — você pode ajustar informações, adicionar participantes, alterar prioridade ou atualizar observações a qualquer momento. Todas as alterações são registradas no histórico para rastreabilidade."
      },
      {
            "tipo": "area",
            "titulo": "O que Pode Ser Editado",
            "itens": [
                  "Identificador: renomeie o código único do dossiê a qualquer momento.",
                  "Tipo de transação: alterne entre Venda, Locação, Due Diligence, Financiamento ou Outros.",
                  "Pessoa vinculada: troque a pessoa principal do dossiê se necessário.",
                  "Imóvel vinculado: altere, adicione ou remova o imóvel associado.",
                  "Prioridade: defina como Regular, Alta ou Urgente.",
                  "Observações: campo de texto livre para notas e instruções.",
                  "Participantes adicionais: adicione ou remova cônjuges e outras partes."
            ]
      },
      {
            "tipo": "timeline",
            "titulo": "Como Editar um Dossiê",
            "passos": [
                  {
                        "titulo": "1. Localize e abra o dossiê",
                        "texto": "Use filtros ou busca (Ctrl+K) para encontrar o dossiê. Clique para abrir a página de detalhes.",
                        "icone": "📂"
                  },
                  {
                        "titulo": "2. Clique no botão Editar",
                        "texto": "Na barra de ações do topo, clique no ícone de lápis (✏️). O modal de edição abre preenchido com os dados atuais.",
                        "icone": "✏️"
                  },
                  {
                        "titulo": "3. Faça as alterações",
                        "texto": "Modifique os campos necessários. Os campos de Pessoa e Imóvel usam o mesmo sistema de busca com autocomplete.",
                        "icone": "📝"
                  },
                  {
                        "titulo": "4. Salve as alterações",
                        "texto": "Clique em Salvar. As alterações são aplicadas imediatamente e registradas no histórico com data, hora e usuário responsável.",
                        "icone": "💾"
                  }
            ]
      },
      {
            "tipo": "amarelo",
            "titulo": "Cuidados ao Editar",
            "texto": "Alterar pessoa principal ou imóvel tem impacto significativo. Certidões já emitidas permanecem válidas, mas certidões pendentes usarão os novos dados. Na dúvida, crie um novo dossiê."
      },
      {
            "tipo": "azul",
            "titulo": "Histórico de Alterações",
            "texto": "Cada edição gera um registro no histórico de atividades: quem alterou, o que mudou (campo antigo → novo), data e hora. O histórico é permanente e não pode ser apagado."
      },
      {
            "tipo": "verde",
            "titulo": "Dica",
            "texto": "Use as observações como quadro de avisos da equipe: 'Aguardando documento do fiador — previsto para 28/07'. Todos que acessarem o dossiê verão a mensagem."
      },
      {
            "tipo": "etapa",
            "titulo": "Aprofunde",
            "texto": "Entenda o significado de cada status que um dossiê pode ter e como gerenciá-los.",
            "icone": "📊",
            "link": {
                  "slug": "status-dossie",
                  "categoria": "dossies",
                  "titulo": "Status do Dossiê"
            }
      }
]),

"status-dossie": a("status-dossie", "Status do Dossiê", "Acompanhamento e Significados", "Entenda cada status do dossiê e como gerenciá-los no dia a dia para manter o fluxo de trabalho organizado.", "dossies", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Status do Dossiê",
            "texto": "Cada dossiê possui um status que funciona como semáforo do processo: indica em que fase o trabalho está e se há algo precisando de atenção. Saber interpretar esses status é fundamental."
      },
      {
            "tipo": "area",
            "titulo": "Os Cinco Status e Seus Significados",
            "itens": [
                  "🟢 Em Andamento: dossiê ativo com certidões sendo processadas. É o status normal de trabalho.",
                  "🔴 Pendente: algo impede o progresso — dados incompletos, certidão com erro ou ação manual necessária. Aparece com destaque vermelho.",
                  "🟣 Concluído: todas as certidões emitidas com sucesso. Pronto para gerar PDF e entregar ao cliente.",
                  "🔴 Cancelado: processo cancelado manualmente. Pode ser reativado se necessário.",
                  "⚪ Arquivado: movido para arquivo. Não aparece nas listas principais mas pode ser desarquivado."
            ]
      },
      {
            "tipo": "fluxograma",
            "titulo": "Fluxo de Transição de Status",
            "texto": "Ciclo normal: Criação → Pendente (aguardando certidões) → Em Andamento (emitindo) → Concluído (todas emitidas) → Arquivado (opcional). Desvios: a qualquer momento antes de Concluído, o dossiê pode ser Cancelado. Um Cancelado pode ser reativado. Um Arquivado pode ser desarquivado a qualquer momento."
      },
      {
            "tipo": "timeline",
            "titulo": "Como Gerenciar Status na Prática",
            "passos": [
                  {
                        "titulo": "1. Monitore pelo Dashboard",
                        "texto": "O Dashboard destaca dossiês pendentes. Crie o hábito de checar o painel no início do dia.",
                        "icone": "📊"
                  },
                  {
                        "titulo": "2. Resolva pendências",
                        "texto": "Clique no dossiê Pendente para ver o motivo e corrija o dado faltante.",
                        "icone": "🔧"
                  },
                  {
                        "titulo": "3. Acompanhe emissões",
                        "texto": "A aba Certidões mostra status individual de cada uma. Se falhar, reemita individualmente.",
                        "icone": "📜"
                  },
                  {
                        "titulo": "4. Conclua e arquive",
                        "texto": "Com todas emitidas, gere o PDF e considere arquivar para manter a lista organizada.",
                        "icone": "✅"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Dashboard em Tempo Real",
            "texto": "Os indicadores atualizam automaticamente conforme os status mudam. Use o Dashboard como painel de controle diário."
      },
      {
            "tipo": "amarelo",
            "titulo": "Status vs. Realidade",
            "texto": "Concluído significa que as certidões foram emitidas, mas elas têm prazo de validade (30 a 180 dias). Um dossiê concluído hoje pode precisar de reemissão se a transação demorar."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo tópico",
            "texto": "Aprenda a excluir dossiês com segurança, usando a lixeira como rede de proteção.",
            "icone": "🗑",
            "link": {
                  "slug": "excluindo-dossie",
                  "categoria": "dossies",
                  "titulo": "Excluindo um Dossiê"
            }
      }
]),

"excluindo-dossie": a("excluindo-dossie", "Excluindo um Dossiê", "Remoção e Recuperação", "Como excluir um dossiê com segurança, mover para lixeira e recuperar caso necessário.", "dossies", "iniciante", "3 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Excluindo um Dossiê",
            "texto": "A exclusão na A.CERT foi projetada com segurança em primeiro lugar. Nada é excluído definitivamente sem passar pela Lixeira — uma camada de proteção que permite restaurar qualquer item em até 30 dias."
      },
      {
            "tipo": "timeline",
            "titulo": "Como Excluir um Dossiê",
            "passos": [
                  {
                        "titulo": "1. Localize o dossiê",
                        "texto": "Use filtros ou Ctrl+K para encontrar o dossiê na lista.",
                        "icone": "🔍"
                  },
                  {
                        "titulo": "2. Abra o menu de ações",
                        "texto": "Clique nos três pontos verticais (⋮) no canto direito da linha do dossiê.",
                        "icone": "⋮"
                  },
                  {
                        "titulo": "3. Selecione Mover para Lixeira",
                        "texto": "No menu suspenso, escolha esta opção. Uma confirmação será exibida.",
                        "icone": "🗑"
                  },
                  {
                        "titulo": "4. Confirme a ação",
                        "texto": "Leia a mensagem e clique em Confirmar. O dossiê vai para Sistema > Lixeira.",
                        "icone": "✅"
                  },
                  {
                        "titulo": "5. Recupere se necessário",
                        "texto": "Vá em Lixeira, localize o dossiê e clique em Restaurar. Tudo volta como estava.",
                        "icone": "♻"
                  }
            ]
      },
      {
            "tipo": "area",
            "titulo": "O Que Acontece ao Mover para a Lixeira",
            "itens": [
                  "O dossiê é removido da lista principal de Dossiês.",
                  "Todas as certidões já emitidas permanecem intactas e acessíveis.",
                  "Os PDFs continuam disponíveis para download.",
                  "O dossiê aparece na Lixeira com a data de exclusão.",
                  "Após 30 dias, é excluído permanentemente de forma automática."
            ]
      },
      {
            "tipo": "amarelo",
            "titulo": "Importante",
            "texto": "Certidões já emitidas não são perdidas ao excluir. Ao restaurar, tudo volta como estava. A exclusão permanente (manual ou automática após 30 dias) é irreversível."
      },
      {
            "tipo": "verde",
            "titulo": "Dica",
            "texto": "Se não tem certeza se vai precisar, apenas arquive o dossiê em vez de excluir. O arquivamento remove da lista principal mas mantém disponível sem prazo de expiração."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo tema",
            "texto": "Conheça o cadastro de pessoas, a base para todas as certidões.",
            "icone": "👤",
            "link": {
                  "slug": "cadastro-pessoa",
                  "categoria": "pessoas",
                  "titulo": "Cadastro de Pessoa"
            }
      }
]),

"cadastro-pessoa": a("cadastro-pessoa", "Cadastro de Pessoa", "Pessoas Físicas e Jurídicas", "Guia completo para cadastrar pessoas físicas (CPF) e jurídicas (CNPJ) com todos os campos importantes.", "pessoas", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Cadastro de Pessoa",
            "texto": "O cadastro de pessoas é a base para emissão de certidões. Dados corretos e completos garantem que as consultas sejam bem-sucedidas. A A.CERT valida automaticamente os dados na base da Receita Federal."
      },
      {
            "tipo": "area",
            "titulo": "Campos Essenciais — Pessoa Física",
            "itens": [
                  "Nome completo: exatamente como consta no documento oficial.",
                  "CPF: válido e ativo na Receita Federal. A A.CERT valida automaticamente.",
                  "Data de nascimento: formato DD/MM/AAAA.",
                  "Nome da mãe: essencial para certidões da Justiça Federal e Estadual.",
                  "Nome do pai: essencial para certidões cíveis.",
                  "RG: opcional mas recomendado.",
                  "Email e telefone: para contato e notificações.",
                  "Endereço completo: CEP, logradouro, número, cidade e estado."
            ]
      },
      {
            "tipo": "area",
            "titulo": "Campos Essenciais — Pessoa Jurídica",
            "itens": [
                  "Razão social completa.",
                  "CNPJ: válido e ativo.",
                  "Nome fantasia.",
                  "Email e telefone corporativos.",
                  "Endereço da sede."
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Validação Automática",
            "texto": "Ao cadastrar um CPF, a A.CERT valida automaticamente na base da Receita Federal, verificando se o documento existe e se os dados conferem."
      },
      {
            "tipo": "amarelo",
            "titulo": "Atenção",
            "texto": "CPFs com dados divergentes (nome, data de nascimento, filiação) podem causar falhas nas certidões. Sempre confira os dados antes de cadastrar. O nome da mãe é um campo particularmente sensível — muitas certidões o utilizam para desambiguar homônimos."
      },
      {
            "tipo": "azul",
            "titulo": "Dica de Produtividade",
            "texto": "Mantenha os cadastros sempre atualizados. Se um cliente mudou de endereço ou telefone, atualize imediatamente. Isso evita retrabalho quando precisar emitir novas certidões no futuro."
      },
      {
            "tipo": "etapa",
            "titulo": "Aprofunde",
            "texto": "Configure vínculos parentais entre pessoas cadastradas — essencial para certidões que exigem dados de cônjuges.",
            "icone": "🔗",
            "link": {
                  "slug": "vinculos-parentais",
                  "categoria": "pessoas",
                  "titulo": "Vínculos Parentais"
            }
      }
]),

"vinculos-parentais": a("vinculos-parentais", "Vínculos Parentais", "Relações Familiares", "Configure vínculos parentais entre pessoas cadastradas. Essencial para certidões que exigem dados de cônjuges e dependentes.", "pessoas", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Vínculos Parentais",
            "texto": "Algumas certidões exigem dados do cônjuge ou de dependentes. Configurar vínculos parentais automatiza o preenchimento dessas informações, evitando que você precise digitar os mesmos dados repetidamente."
      },
      {
            "tipo": "area",
            "titulo": "Tipos de Vínculo Disponíveis",
            "itens": [
                  "Cônjuge / Companheiro(a): relação matrimonial ou união estável.",
                  "Filho(a): dependentes diretos.",
                  "Pai / Mãe: ascendentes diretos.",
                  "Irmão/Irmã: colaterais.",
                  "Outros: vínculo personalizado para relações não padronizadas."
            ]
      },
      {
            "tipo": "timeline",
            "titulo": "Como Criar um Vínculo",
            "passos": [
                  {
                        "titulo": "1. Abra a ficha da pessoa",
                        "texto": "Na lista de Pessoas, clique na pessoa base para abrir a ficha detalhada.",
                        "icone": "👤"
                  },
                  {
                        "titulo": "2. Acesse a seção Vínculos",
                        "texto": "Na ficha da pessoa, localize a aba ou seção 'Vínculos Parentais'.",
                        "icone": "🔗"
                  },
                  {
                        "titulo": "3. Selecione a pessoa relacionada",
                        "texto": "Busque pelo nome ou CPF da pessoa a ser vinculada. Ela precisa estar cadastrada no sistema.",
                        "icone": "🔍"
                  },
                  {
                        "titulo": "4. Escolha o tipo de vínculo",
                        "texto": "Selecione o tipo de relação no menu suspenso.",
                        "icone": "📋"
                  },
                  {
                        "titulo": "5. Confirme",
                        "texto": "O vínculo é registrado e será usado automaticamente nas certidões que exigirem esses dados.",
                        "icone": "✅"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Uso Automático nas Certidões",
            "texto": "Quando você emite certidões para uma pessoa que possui vínculo de cônjuge, o sistema preenche automaticamente os dados do cônjuge nos formulários dos órgãos, economizando tempo e evitando erros de digitação."
      },
      {
            "tipo": "amarelo",
            "titulo": "Atenção",
            "texto": "Mantenha os vínculos atualizados. Em caso de divórcio ou falecimento, remova ou atualize o vínculo imediatamente para evitar certidões com dados incorretos."
      },
      {
            "tipo": "azul",
            "titulo": "Vínculos Bidirecionais",
            "texto": "Ao criar um vínculo de cônjuge entre A e B, o sistema automaticamente cria o vínculo recíproco (B é cônjuge de A). Isso garante consistência na base de dados."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Aprenda a buscar rapidamente qualquer pessoa cadastrada usando múltiplos critérios.",
            "icone": "🔍",
            "link": {
                  "slug": "busca-pessoa",
                  "categoria": "pessoas",
                  "titulo": "Busca de Pessoa"
            }
      }
]),

"busca-pessoa": a("busca-pessoa", "Busca de Pessoa", "Localização Rápida", "Como encontrar rapidamente qualquer pessoa cadastrada usando busca por nome, CPF, email ou telefone.", "pessoas", "iniciante", "3 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Busca de Pessoa",
            "texto": "Com a base de pessoas crescendo, a busca eficiente é essencial. A A.CERT oferece busca instantânea por múltiplos campos, com resultados em tempo real conforme você digita."
      },
      {
            "tipo": "area",
            "titulo": "Campos Pesquisáveis",
            "itens": [
                  "Nome completo ou parcial: digite parte do nome e veja sugestões instantâneas.",
                  "CPF: com ou sem pontuação. O sistema normaliza automaticamente.",
                  "CNPJ: para pessoas jurídicas.",
                  "Email: busca exata ou parcial.",
                  "Telefone: com ou sem DDD, com ou sem formatação.",
                  "Cidade/Estado: filtre por localização."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Busca Global (Ctrl+K)",
            "texto": "Use Ctrl+K em qualquer tela para abrir a busca global. Digite o nome da pessoa e navegue direto para a ficha dela sem precisar acessar a seção Pessoas primeiro."
      },
      {
            "tipo": "timeline",
            "titulo": "Dicas de Busca Eficiente",
            "passos": [
                  {
                        "titulo": "1. Use termos parciais",
                        "texto": "Digitar 'Maria' já retorna todas as pessoas com esse nome. Não precisa digitar o nome completo.",
                        "icone": "🔍"
                  },
                  {
                        "titulo": "2. Busque por CPF",
                        "texto": "Se tiver o CPF, é o método mais rápido e preciso. O sistema encontra instantaneamente.",
                        "icone": "🪪"
                  },
                  {
                        "titulo": "3. Combine filtros",
                        "texto": "Na tela de Pessoas, use os filtros avançados para combinar cidade, tipo (PF/PJ) e data de cadastro.",
                        "icone": "⚙"
                  },
                  {
                        "titulo": "4. Use a busca global",
                        "texto": "Ctrl+K funciona de qualquer lugar do sistema. É o caminho mais curto para qualquer pessoa.",
                        "icone": "⌨"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Resultados em Tempo Real",
            "texto": "A busca inicia após 2 caracteres digitados e refina a cada nova letra. Não é necessário pressionar Enter para buscar — os resultados aparecem automaticamente."
      },
      {
            "tipo": "etapa",
            "titulo": "Continue aprendendo",
            "texto": "Agora que domina o cadastro de pessoas, veja como emitir certidões.",
            "icone": "📜",
            "link": {
                  "slug": "como-emitir",
                  "categoria": "emissao-certidoes",
                  "titulo": "Como Emitir Certidões"
            }
      }
]),

"como-emitir": a("como-emitir", "Como Emitir Certidões", "Processo Completo de Emissão", "Guia detalhado do processo de emissão: seleção de órgãos, disparo da consulta, acompanhamento e obtenção dos PDFs.", "emissao-certidoes", "iniciante", "10 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Como Emitir Certidões",
            "texto": "A emissão de certidões é o coração da A.CERT. Em poucos cliques você dispara consultas automatizadas em múltiplos órgãos simultaneamente, acompanha o progresso em tempo real pelo Display Remoto e recebe os PDFs automaticamente no dossiê."
      },
      {
            "tipo": "timeline",
            "titulo": "Passo a Passo da Emissão",
            "passos": [
                  {
                        "titulo": "1. Abra o dossiê",
                        "texto": "Na lista de Dossiês, clique no dossiê onde deseja emitir certidões.",
                        "icone": "📂"
                  },
                  {
                        "titulo": "2. Vá para Partes Envolvidas",
                        "texto": "Na página do dossiê, selecione a aba Partes Envolvidas para ver os participantes.",
                        "icone": "👥"
                  },
                  {
                        "titulo": "3. Clique em Emitir Certidão",
                        "texto": "Para cada participante, clique no botão de emissão. O seletor de certidões será aberto.",
                        "icone": "📜"
                  },
                  {
                        "titulo": "4. Selecione as certidões",
                        "texto": "Marque os órgãos desejados: Receita Federal, TRF1, TJDFT, TRT, TST, SEFAZ-DF, ONR. Você pode selecionar todas ou apenas as necessárias.",
                        "icone": "☑"
                  },
                  {
                        "titulo": "5. Dispare a consulta",
                        "texto": "Clique em Emitir. O sistema inicia o navegador automatizado e abre o Display Remoto.",
                        "icone": "🚀"
                  },
                  {
                        "titulo": "6. Acompanhe pelo Display Remoto",
                        "texto": "Uma nova aba mostra o navegador remoto com a consulta em tempo real.",
                        "icone": "🖥"
                  },
                  {
                        "titulo": "7. Resolva CAPTCHAs",
                        "texto": "Se aparecer CAPTCHA, resolva-o manualmente. O sistema continua automaticamente após a resolução.",
                        "icone": "🔐"
                  },
                  {
                        "titulo": "8. Aguarde a conclusão",
                        "texto": "Cada certidão obtida aparece no dossiê com status Emitida. O progresso é atualizado em tempo real.",
                        "icone": "⏳"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Consultas Simultâneas",
            "texto": "O sistema possui um pool de 3 displays que permite executar até 3 consultas ao mesmo tempo em dossiês diferentes. Ideal para alta produtividade."
      },
      {
            "tipo": "amarelo",
            "titulo": "Importante",
            "texto": "Não feche o Display Remoto durante a consulta. Se precisar interromper, aguarde a finalização da certidão atual. Se a internet cair, recarregue a página do dossiê para verificar o status."
      },
      {
            "tipo": "azul",
            "titulo": "Ordem de Processamento",
            "texto": "As certidões são processadas na ordem em que foram selecionadas. Você pode usar o Display Remoto para ver qual órgão está sendo consultado no momento."
      },
      {
            "tipo": "etapa",
            "titulo": "Entenda o Display Remoto",
            "texto": "Saiba como funciona o VNC que mostra as consultas em tempo real.",
            "icone": "🖥",
            "link": {
                  "slug": "display-remoto",
                  "categoria": "emissao-certidoes",
                  "titulo": "Display Remoto (VNC)"
            }
      }
]),

"display-remoto": a("display-remoto", "Display Remoto (VNC)", "Acompanhamento em Tempo Real", "Entenda o Display Remoto: como funciona o VNC, como resolver CAPTCHAs e acompanhar as consultas em tempo real.", "emissao-certidoes", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Display Remoto (VNC)",
            "texto": "O Display Remoto é uma janela que mostra o navegador Chrome rodando no servidor em tempo real. Através dele você acompanha as consultas, resolve CAPTCHAs e verifica o andamento de cada certidão."
      },
      {
            "tipo": "azul",
            "titulo": "O Que Você Vê no Display Remoto",
            "texto": "O navegador Chrome acessando o site do órgão oficial.\n\nFormulários sendo preenchidos automaticamente com os dados da pessoa.\n\nCAPTCHAs aparecendo para resolução manual.\n\nPDFs sendo gerados e baixados automaticamente.\n\nNavegação entre páginas do órgão."
      },
      {
            "tipo": "timeline",
            "titulo": "Como Usar o Display Remoto",
            "passos": [
                  {
                        "titulo": "1. O display abre automaticamente",
                        "texto": "Ao iniciar uma consulta, o Display Remoto abre em nova aba. Não é necessário instalar nada.",
                        "icone": "🖥"
                  },
                  {
                        "titulo": "2. Apenas observe na maioria do tempo",
                        "texto": "O sistema preenche formulários e navega sozinho. Você só interage quando aparece um CAPTCHA.",
                        "icone": "👀"
                  },
                  {
                        "titulo": "3. Resolva CAPTCHAs",
                        "texto": "Quando aparecer um CAPTCHA, clique nele e resolva (selecionar imagens, digitar texto). Após resolvido, o sistema continua.",
                        "icone": "🔐"
                  },
                  {
                        "titulo": "4. Aguarde a conclusão",
                        "texto": "Quando a certidão for obtida, o display pode ser fechado. O PDF estará disponível no dossiê.",
                        "icone": "✅"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Dica",
            "texto": "Você pode redimensionar a janela do Display Remoto. A resolução é 1920x1080 para máxima compatibilidade com os sites dos órgãos."
      },
      {
            "tipo": "amarelo",
            "titulo": "Importante",
            "texto": "Não feche a aba do Display Remoto durante a consulta. Se a conexão cair, o display pode congelar — recarregue a página do dossiê para verificar o status."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Aprenda a resolver os diferentes tipos de CAPTCHA que aparecem nas consultas.",
            "icone": "🔐",
            "link": {
                  "slug": "captcha",
                  "categoria": "emissao-certidoes",
                  "titulo": "Resolvendo CAPTCHAs"
            }
      }
]),

"captcha": a("captcha", "Resolvendo CAPTCHAs", "Verificação Manual", "Guia prático para resolver os diferentes tipos de CAPTCHA que aparecem durante as consultas automatizadas.", "emissao-certidoes", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Resolvendo CAPTCHAs",
            "texto": "Alguns órgãos oficiais utilizam CAPTCHAs para verificação de segurança. A A.CERT detecta automaticamente quando um CAPTCHA aparece e pausa a automação para que você resolva manualmente."
      },
      {
            "tipo": "area",
            "titulo": "Tipos de CAPTCHA Encontrados",
            "itens": [
                  "Google reCAPTCHA v2: checkbox 'Não sou um robô' — clique simples.",
                  "Google reCAPTCHA v2 com imagens: selecionar quadrados com objetos específicos (semáforos, carros, bicicletas, etc.).",
                  "hCaptcha: similar ao reCAPTCHA, usado por alguns órgãos específicos.",
                  "CAPTCHA textual: digitar caracteres distorcidos exibidos em uma imagem.",
                  "Cloudflare Turnstile: verificação automática que geralmente não exige ação manual."
            ]
      },
      {
            "tipo": "timeline",
            "titulo": "Como Resolver Cada Tipo",
            "passos": [
                  {
                        "titulo": "1. Checkbox (Não sou um robô)",
                        "texto": "Basta clicar no quadrado. Uma animação verde confirma a verificação. É o tipo mais rápido e simples.",
                        "icone": "☑"
                  },
                  {
                        "titulo": "2. Seleção de imagens",
                        "texto": "Clique nos quadrados que contêm o objeto pedido. Novos quadrados podem aparecer — continue clicando até o botão Verificar ficar verde. Não tenha pressa.",
                        "icone": "🖼"
                  },
                  {
                        "titulo": "3. CAPTCHA textual",
                        "texto": "Digite exatamente os caracteres mostrados na imagem distorcida. Diferencie maiúsculas de minúsculas. Se estiver ilegível, clique no ícone de recarregar para gerar um novo.",
                        "icone": "🔤"
                  },
                  {
                        "titulo": "4. hCaptcha",
                        "texto": "Funciona como o reCAPTCHA. Pode alternar entre checkbox simples e desafios com imagens. Siga as instruções na tela.",
                        "icone": "🛡"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Dica para CAPTCHAs de Imagem",
            "texto": "Clique apenas nos quadrados que contêm o objeto pedido, mesmo que parcialmente. Se o objeto estiver em 3 quadrados, clique nos 3. Se errar, um novo desafio será gerado automaticamente."
      },
      {
            "tipo": "amarelo",
            "titulo": "Se o CAPTCHA Falhar",
            "texto": "Se errar, um novo CAPTCHA será gerado. O sistema tentará novamente. Não é necessário reiniciar a consulta. Se falhar repetidamente, verifique sua conexão de internet."
      },
      {
            "tipo": "etapa",
            "titulo": "Continue",
            "texto": "Conheça a lista completa de órgãos oficiais integrados à A.CERT.",
            "icone": "🏛",
            "link": {
                  "slug": "orgaos-disponiveis",
                  "categoria": "emissao-certidoes",
                  "titulo": "Órgãos Disponíveis"
            }
      }
]),

"orgaos-disponiveis": a("orgaos-disponiveis", "Órgãos Disponíveis", "Lista Completa de Órgãos", "Conheça todos os órgãos oficiais integrados à A.CERT e quais certidões cada um fornece.", "emissao-certidoes", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Órgãos Disponíveis",
            "texto": "A A.CERT está integrada com os principais órgãos oficiais brasileiros para emissão de certidões imobiliárias. Cada órgão fornece certidões específicas, cobrindo as esferas federal, estadual e trabalhista."
      },
      {
            "tipo": "area",
            "titulo": "Órgãos Integrados e Suas Certidões",
            "itens": [
                  "Receita Federal: Certidão de Débitos Relativos a Créditos Tributários Federais e Dívida Ativa da União.",
                  "TRF1 (Tribunal Regional Federal da 1ª Região): Certidão de Ações Cíveis e Criminais Federais.",
                  "TJDFT (Tribunal de Justiça do Distrito Federal): Certidão Especial Cível e Criminal Estadual.",
                  "TRT 10ª Região: Certidão de Ações Trabalhistas no DF e Tocantins.",
                  "TST (Tribunal Superior do Trabalho): Certidão Trabalhista com abrangência nacional.",
                  "SEFAZ-DF: Certidão de Débitos Estaduais do Distrito Federal.",
                  "ONR (Operador Nacional de Registro): Ônus Reais e Ações Reipersecutórias sobre imóveis."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Status dos Órgãos em Tempo Real",
            "texto": "O Dashboard mostra o status de cada órgão com indicadores coloridos: verde (online e responsivo), vermelho (offline ou com problemas). Sempre verifique o status antes de disparar consultas."
      },
      {
            "tipo": "fluxograma",
            "titulo": "Cobertura Geográfica das Certidões",
            "texto": "Receita Federal: abrangência nacional. TRF1: DF, AC, AM, AP, BA, GO, MA, MT, PA, PI, RO, RR, TO e parte de MG. TJDFT: apenas Distrito Federal. TRT 10ª: DF e TO. TST: todos os 24 TRTs do Brasil. SEFAZ-DF: apenas DF. ONR: abrangência nacional para imóveis registrados."
      },
      {
            "tipo": "verde",
            "titulo": "Dica",
            "texto": "Para uma due diligence completa, o padrão do mercado é emitir todas as certidões disponíveis para a pessoa e o imóvel. Use o seletor 'Marcar Todas' no momento da emissão."
      },
      {
            "tipo": "etapa",
            "titulo": "Detalhes de cada órgão",
            "texto": "Veja informações detalhadas sobre a certidão do TRF1.",
            "icone": "⚖",
            "link": {
                  "slug": "trf1",
                  "categoria": "orgaos-integrados",
                  "titulo": "TRF1 - Tribunal Regional Federal"
            }
      }
]),

"trf1": a("trf1", "TRF1 — Tribunal Regional Federal", "Certidão Cível e Criminal", "Detalhes sobre a certidão do TRF1: o que consulta, dados necessários e como interpretar o resultado.", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "TRF1 — Certidão Cível e Criminal",
            "texto": "O Tribunal Regional Federal da 1ª Região abrange 13 estados e o DF, sendo um dos maiores TRFs do país. Sua certidão consulta processos cíveis e criminais na Justiça Federal, essencial para verificar pendências judiciais federais."
      },
      {
            "tipo": "area",
            "titulo": "O Que a Certidão do TRF1 Verifica",
            "itens": [
                  "Ações cíveis federais em nome da pessoa consultada.",
                  "Ações criminais federais em nome da pessoa.",
                  "Execuções fiscais federais.",
                  "Mandados de segurança impetrados.",
                  "Processos em todas as varas federais da 1ª Região."
            ]
      },
      {
            "tipo": "area",
            "titulo": "Dados Necessários para a Consulta",
            "itens": [
                  "Nome completo da pessoa.",
                  "CPF válido e ativo.",
                  "Nome da mãe (campo essencial para desambiguar homônimos).",
                  "Nome do pai."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Abrangência Geográfica",
            "texto": "A 1ª Região da Justiça Federal cobre: Distrito Federal, Acre, Amapá, Amazonas, Bahia, Goiás, Maranhão, Mato Grosso, Pará, Piauí, Rondônia, Roraima, Tocantins e parte de Minas Gerais."
      },
      {
            "tipo": "amarelo",
            "titulo": "Atenção",
            "texto": "Se a pessoa tiver processos em outros TRFs (ex: TRF3 para SP, TRF2 para RJ/ES), a certidão do TRF1 não os detectará. Para cobertura nacional, considere emitir também a certidão da Receita Federal que cobre débitos em todo o país."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo órgão",
            "texto": "Veja os detalhes da certidão da Receita Federal.",
            "icone": "🏛",
            "link": {
                  "slug": "receita-federal",
                  "categoria": "orgaos-integrados",
                  "titulo": "Receita Federal"
            }
      }
]),

"receita-federal": a("receita-federal", "Receita Federal", "Certidão de Débitos Federais", "Detalhes sobre a Certidão Conjunta da Receita Federal: débitos tributários, dívida ativa e como interpretar os resultados.", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Receita Federal — Certidão de Débitos",
            "texto": "A Certidão Conjunta da Receita Federal e Procuradoria-Geral da Fazenda Nacional (PGFN) atesta a situação fiscal da pessoa ou empresa perante a União. É uma das certidões mais importantes para transações imobiliárias."
      },
      {
            "tipo": "area",
            "titulo": "O Que a Certidão Verifica",
            "itens": [
                  "Débitos de tributos federais: IRPF, IRPJ, PIS, COFINS, CSLL, entre outros.",
                  "Dívida ativa da União inscrita.",
                  "Contribuições previdenciárias em aberto.",
                  "Inscrições no CADIN (Cadastro Informativo de Créditos não Quitados)."
            ]
      },
      {
            "tipo": "area",
            "titulo": "Resultados Possíveis e Seus Significados",
            "itens": [
                  "Negativa: nenhum débito encontrado. Situação fiscal regular.",
                  "Positiva com efeitos de negativa: constam débitos, mas estão com exigibilidade suspensa (parcelamento, recurso administrativo, liminar judicial). Equivale a negativa para fins práticos.",
                  "Positiva: débitos ativos e exigíveis. A pessoa precisa regularizar antes da transação."
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Validade da Certidão",
            "texto": "A certidão da Receita Federal tem validade de 180 dias a partir da emissão. Contudo, para transações imobiliárias, cartórios e instituições financeiras costumam exigir certidões com no máximo 30 a 60 dias."
      },
      {
            "tipo": "amarelo",
            "titulo": "CPF vs. CNPJ",
            "texto": "Para pessoas físicas, a consulta usa o CPF. Para pessoas jurídicas, usa o CNPJ. Certifique-se de selecionar o tipo correto no cadastro da pessoa antes de emitir."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo órgão",
            "texto": "Veja os detalhes da certidão do TJDFT.",
            "icone": "⚖",
            "link": {
                  "slug": "tjdft",
                  "categoria": "orgaos-integrados",
                  "titulo": "TJDFT - Tribunal de Justiça do DF"
            }
      }
]),

"tjdft": a("tjdft", "TJDFT — Tribunal de Justiça do DF", "Certidão Especial Cível e Criminal", "Certidão do Tribunal de Justiça do Distrito Federal: processos cíveis, criminais e de família.", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "TJDFT — Certidão Especial",
            "texto": "O TJDFT fornece a Certidão Especial Cível e Criminal, essencial para transações imobiliárias no Distrito Federal. Ela cobre todas as varas cíveis e criminais estaduais do DF."
      },
      {
            "tipo": "area",
            "titulo": "O Que a Certidão do TJDFT Cobre",
            "itens": [
                  "Ações cíveis em todas as varas cíveis do DF.",
                  "Ações criminais: antecedentes criminais estaduais.",
                  "Ações de família: divórcio, alimentos, guarda de filhos.",
                  "Execuções fiscais estaduais do DF.",
                  "Protestos de títulos registrados no DF."
            ]
      },
      {
            "tipo": "area",
            "titulo": "Dados Necessários para a Consulta",
            "itens": [
                  "Nome completo da pessoa.",
                  "CPF válido.",
                  "Nome da mãe.",
                  "Nome do pai."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Resultado Esperado",
            "texto": "A certidão pode retornar 'Nada Consta' (sem processos) ou 'Consta' com a lista de processos encontrados. Para cada processo, são exibidos: número, vara, tipo de ação e situação atual."
      },
      {
            "tipo": "verde",
            "titulo": "Cobertura",
            "texto": "Esta certidão cobre exclusivamente o Distrito Federal. Para outros estados, é necessário consultar o Tribunal de Justiça do respectivo estado, o que pode ser feito manualmente para complementar a due diligence."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo órgão",
            "texto": "Veja os detalhes da certidão trabalhista do TRT.",
            "icone": "⚖",
            "link": {
                  "slug": "trt",
                  "categoria": "orgaos-integrados",
                  "titulo": "TRT - Tribunal Regional do Trabalho"
            }
      }
]),

"trt": a("trt", "TRT — Tribunal Regional do Trabalho", "Certidão Trabalhista Regional", "Certidão de ações trabalhistas do TRT da 10ª Região, abrangendo Distrito Federal e Tocantins.", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "TRT 10ª Região — Certidão Trabalhista",
            "texto": "O Tribunal Regional do Trabalho da 10ª Região emite certidão de ações trabalhistas para DF e Tocantins. É essencial para avaliar o passivo trabalhista de pessoas e empresas envolvidas na transação."
      },
      {
            "tipo": "area",
            "titulo": "O Que a Certidão do TRT Verifica",
            "itens": [
                  "Reclamações trabalhistas como reclamante (pessoa processando empregador).",
                  "Reclamações trabalhistas como reclamado (pessoa sendo processada).",
                  "Processos em fase de execução (dívidas trabalhistas ativas).",
                  "Acordos trabalhistas homologados pela Justiça do Trabalho."
            ]
      },
      {
            "tipo": "area",
            "titulo": "Resultados Possíveis",
            "itens": [
                  "Nada Consta: nenhum processo trabalhista encontrado na 10ª Região.",
                  "Consta: processos ativos encontrados, com detalhamento de cada um."
            ]
      },
      {
            "tipo": "amarelo",
            "titulo": "Abrangência Limitada",
            "texto": "A certidão do TRT 10ª Região cobre apenas processos no DF e Tocantins. Para outros estados, é necessário consultar o TRT da respectiva região. Para cobertura nacional, use a certidão do TST."
      },
      {
            "tipo": "azul",
            "titulo": "Importância para Imobiliárias",
            "texto": "Ações trabalhistas podem gerar penhora sobre imóveis. Por isso, a certidão trabalhista é obrigatória em praticamente todas as transações imobiliárias, tanto para o vendedor quanto para o comprador."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Veja a certidão trabalhista de abrangência nacional emitida pelo TST.",
            "icone": "⚖",
            "link": {
                  "slug": "tst",
                  "categoria": "orgaos-integrados",
                  "titulo": "TST - Tribunal Superior do Trabalho"
            }
      }
]),

"tst": a("tst", "TST — Tribunal Superior do Trabalho", "Certidão Trabalhista Nacional", "Certidão de ações trabalhistas com abrangência nacional emitida pelo Tribunal Superior do Trabalho.", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "TST — Certidão Trabalhista Nacional",
            "texto": "O Tribunal Superior do Trabalho emite certidão com abrangência nacional, consolidando informações de todos os 24 Tribunais Regionais do Trabalho do país. É a certidão mais abrangente para verificação de passivo trabalhista."
      },
      {
            "tipo": "area",
            "titulo": "O Que a Certidão do TST Cobre",
            "itens": [
                  "Processos em todos os 24 TRTs do Brasil.",
                  "Ações em fase de conhecimento (tramitação inicial).",
                  "Ações em fase de execução (dívidas ativas).",
                  "Débitos trabalhistas registrados no Banco Nacional de Devedores Trabalhistas (BNDT).",
                  "Certidão negativa ou positiva de débitos trabalhistas."
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Cobertura Nacional",
            "texto": "Diferente do TRT 10ª Região (apenas DF e TO), a certidão do TST tem abrangência nacional, cobrindo processos trabalhistas em qualquer estado brasileiro. É indispensável para due diligence completa."
      },
      {
            "tipo": "area",
            "titulo": "Quando Usar TRT vs. TST",
            "itens": [
                  "TRT 10ª Região: quando a transação é local (DF/TO) e você precisa de detalhes regionais.",
                  "TST: quando precisa de cobertura nacional ou o cliente possui vínculos com múltiplos estados.",
                  "Recomendação: para due diligence completa, emita ambas as certidões."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Certidão Negativa de Débitos Trabalhistas",
            "texto": "A certidão do TST também funciona como Certidão Negativa de Débitos Trabalhistas (CNDT), documento obrigatório em licitações públicas e em algumas transações imobiliárias específicas."
      },
      {
            "tipo": "etapa",
            "titulo": "Mude de assunto",
            "texto": "Aprenda a gerar o PDF consolidado do dossiê com todas as certidões.",
            "icone": "📄",
            "link": {
                  "slug": "gerar-pdf",
                  "categoria": "dossies-pdf",
                  "titulo": "Gerar PDF do Dossiê"
            }
      }
]),

"gerar-pdf": a("gerar-pdf", "Gerar PDF do Dossiê", "Consolidação de Documentos", "Como gerar o PDF consolidado do dossiê reunindo todas as certidões emitidas em um único arquivo profissional.", "dossies-pdf", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Gerar PDF do Dossiê",
            "texto": "Com todas as certidões emitidas, você pode gerar um PDF consolidado que reúne tudo em um único arquivo profissional — pronto para apresentar ao cliente ou cartório. O PDF inclui capa personalizada, índice e todas as certidões numeradas."
      },
      {
            "tipo": "timeline",
            "titulo": "Como Gerar o PDF Consolidado",
            "passos": [
                  {
                        "titulo": "1. Verifique as certidões",
                        "texto": "Confira na aba Certidões se todas que você precisa estão com status Emitida (selo verde).",
                        "icone": "✅"
                  },
                  {
                        "titulo": "2. Clique em Gerar PDF",
                        "texto": "No topo da página do dossiê, clique no botão Gerar PDF. O sistema inicia a compilação.",
                        "icone": "📄"
                  },
                  {
                        "titulo": "3. Aguarde a geração",
                        "texto": "O sistema compila todas as certidões em um único arquivo. O processo leva de 10 a 30 segundos, dependendo da quantidade de certidões.",
                        "icone": "⏳"
                  },
                  {
                        "titulo": "4. Download automático",
                        "texto": "O PDF é baixado automaticamente para sua pasta de downloads. O arquivo inclui capa, índice, cabeçalho, rodapé e páginas numeradas.",
                        "icone": "📥"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Formato Profissional",
            "texto": "O PDF consolidado inclui: capa com logo da sua empresa e dados do dossiê, índice de certidões com links clicáveis, cabeçalho e rodapé padronizados, numeração de página e todas as certidões em ordem lógica."
      },
      {
            "tipo": "azul",
            "titulo": "Personalização do PDF",
            "texto": "A aparência do PDF é configurável em Configurações > Templates de PDF. Você pode alterar o logo, cores, fontes e elementos da capa para refletir a identidade visual da sua empresa."
      },
      {
            "tipo": "amarelo",
            "titulo": "Regeração Segura",
            "texto": "Você pode gerar o PDF quantas vezes quiser. Cada geração compila as certidões atuais do dossiê. Se novas certidões foram emitidas após a primeira geração, gere novamente para incluir tudo."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Saiba como baixar, compartilhar e gerenciar os PDFs gerados.",
            "icone": "📥",
            "link": {
                  "slug": "download-pdf",
                  "categoria": "dossies-pdf",
                  "titulo": "Download do Dossiê"
            }
      }
]),

"download-pdf": a("download-pdf", "Download do Dossiê", "Baixar e Compartilhar", "Como baixar o PDF gerado e compartilhar com clientes e cartórios de forma segura.", "dossies-pdf", "iniciante", "3 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Download do Dossiê em PDF",
            "texto": "Após gerar o PDF consolidado, você pode baixá-lo, compartilhá-lo com segurança e armazená-lo conforme necessário. O PDF fica disponível para download a qualquer momento."
      },
      {
            "tipo": "area",
            "titulo": "Opções de Download",
            "itens": [
                  "Download automático: ao gerar o PDF, ele baixa instantaneamente para sua pasta de downloads.",
                  "Download manual: o botão de download fica disponível na página do dossiê após a geração.",
                  "Download de certidão individual: cada certidão pode ser baixada separadamente do dossiê.",
                  "Re-geração: você pode gerar o PDF quantas vezes quiser, sempre com as certidões mais recentes."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Segurança dos PDFs",
            "texto": "Todos os PDFs são gerados no servidor e transmitidos via HTTPS com criptografia. Os arquivos não ficam acessíveis publicamente. Cada download é registrado no histórico de atividades do dossiê."
      },
      {
            "tipo": "timeline",
            "titulo": "Como Compartilhar com Segurança",
            "passos": [
                  {
                        "titulo": "1. Baixe o PDF",
                        "texto": "Use qualquer uma das opções de download disponíveis.",
                        "icone": "📥"
                  },
                  {
                        "titulo": "2. Verifique o conteúdo",
                        "texto": "Abra o PDF e confira se todas as certidões estão presentes e legíveis.",
                        "icone": "🔍"
                  },
                  {
                        "titulo": "3. Compartilhe",
                        "texto": "Envie por email, WhatsApp ou plataforma de compartilhamento de arquivos.",
                        "icone": "📤"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Nomenclatura dos Arquivos",
            "texto": "Os PDFs seguem um padrão de nomenclatura que inclui o identificador do dossiê, facilitando a organização: 'Dossie_2026-042_Maria_Silva.pdf'. Para certidões individuais: 'Certidao_TRF1_2026-042.pdf'."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo tema",
            "texto": "Aprenda a gerar relatórios de certidões com estatísticas detalhadas.",
            "icone": "📊",
            "link": {
                  "slug": "relatorio-certidoes",
                  "categoria": "relatorios",
                  "titulo": "Relatório de Certidões"
            }
      }
]),

"relatorio-certidoes": a("relatorio-certidoes", "Relatório de Certidões", "Estatísticas de Emissão", "Gere relatórios detalhados de certidões emitidas com filtros por período, órgão e status.", "relatorios", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Relatório de Certidões",
            "texto": "Acompanhe todas as certidões emitidas em um período com detalhes de cada emissão e indicadores de performance. Ideal para prestação de contas, análise de eficiência e identificação de gargalos."
      },
      {
            "tipo": "area",
            "titulo": "Informações Disponíveis no Relatório",
            "itens": [
                  "Total de certidões emitidas no período selecionado.",
                  "Distribuição por órgão: quantas de cada órgão foram emitidas.",
                  "Distribuição por status: Emitidas vs. Pendentes vs. Com Erro.",
                  "Tempo médio de emissão por órgão.",
                  "Taxa de sucesso por órgão (certidões obtidas / certidões solicitadas).",
                  "Exportação nos formatos Excel (.xlsx) e PDF."
            ]
      },
      {
            "tipo": "timeline",
            "titulo": "Como Gerar o Relatório",
            "passos": [
                  {
                        "titulo": "1. Acesse Relatórios",
                        "texto": "No menu lateral em Gerenciamento, clique em Relatórios.",
                        "icone": "📊"
                  },
                  {
                        "titulo": "2. Selecione o período",
                        "texto": "Escolha o intervalo de datas. Pode ser este mês, mês passado, últimos 30 dias ou período personalizado.",
                        "icone": "📅"
                  },
                  {
                        "titulo": "3. Aplique filtros opcionais",
                        "texto": "Filtre por órgão específico (ex: só Receita Federal) ou por status (só Emitidas).",
                        "icone": "🔍"
                  },
                  {
                        "titulo": "4. Exporte",
                        "texto": "Clique em Exportar Excel para análise detalhada ou Exportar PDF para apresentação.",
                        "icone": "📥"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Uso Gerencial",
            "texto": "Use o relatório de certidões para: justificar produtividade da equipe, identificar quais órgãos estão mais lentos, planejar capacidade e apresentar resultados aos clientes ou à diretoria."
      },
      {
            "tipo": "azul",
            "titulo": "Filtros Combinados",
            "texto": "Você pode combinar múltiplos filtros: por exemplo, 'certidões da Receita Federal nos últimos 60 dias com status Emitida'. Isso permite análises muito específicas e direcionadas."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Veja o relatório de produtividade para monitorar o desempenho da sua equipe.",
            "icone": "📈",
            "link": {
                  "slug": "relatorio-produtividade",
                  "categoria": "relatorios",
                  "titulo": "Relatório de Produtividade"
            }
      }
]),

"relatorio-produtividade": a("relatorio-produtividade", "Relatório de Produtividade", "Desempenho da Equipe", "Monitore a produtividade da sua equipe com relatórios de dossiês criados, certidões emitidas e tempo médio por usuário.", "relatorios", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Relatório de Produtividade",
            "texto": "Acompanhe o desempenho individual de cada membro da equipe: quantos dossiês criou, quantas certidões emitiu, tempo médio de conclusão e taxa de sucesso. Essencial para gestão de pessoas e identificação de necessidades de treinamento."
      },
      {
            "tipo": "area",
            "titulo": "Métricas por Usuário",
            "itens": [
                  "Dossiês criados no período.",
                  "Dossiês concluídos (todas as certidões emitidas).",
                  "Certidões emitidas com sucesso.",
                  "Tempo médio por certidão emitida.",
                  "Taxa de conclusão: dossiês concluídos / dossiês criados.",
                  "Comparativo com o período anterior: evolução ou queda."
            ]
      },
      {
            "tipo": "area",
            "titulo": "Visões Disponíveis",
            "itens": [
                  "Visão individual: desempenho de um usuário específico.",
                  "Visão comparativa: desempenho de todos os usuários lado a lado.",
                  "Visão temporal: evolução do desempenho ao longo do tempo.",
                  "Visão por órgão: produtividade segmentada por tipo de certidão."
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Exportação Flexível",
            "texto": "O relatório de produtividade pode ser exportado em Excel para análises personalizadas, criação de dashboards externos ou apresentações em reuniões de equipe."
      },
      {
            "tipo": "azul",
            "titulo": "Benchmarks",
            "texto": "Use os dados históricos para estabelecer benchmarks internos: qual é a média de certidões por dia? Quanto tempo leva um dossiê completo? Isso ajuda a definir metas realistas e identificar outliers (positivos ou negativos)."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Aprenda a gerenciar usuários e convidar novos membros para a plataforma.",
            "icone": "👥",
            "link": {
                  "slug": "convite-usuario",
                  "categoria": "usuarios-empresas",
                  "titulo": "Convidar Usuário"
            }
      }
]),

"convite-usuario": a("convite-usuario", "Convidar Usuário", "Adicionar Membros à Equipe", "Como convidar novos usuários para a plataforma, definir cargos e permissões iniciais.", "usuarios-empresas", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Convidar Usuário",
            "texto": "Adicione membros da sua equipe à plataforma A.CERT. Cada usuário recebe um acesso personalizado com permissões configuráveis de acordo com sua função na empresa."
      },
      {
            "tipo": "timeline",
            "titulo": "Como Convidar um Novo Usuário",
            "passos": [
                  {
                        "titulo": "1. Acesse Usuários",
                        "texto": "No menu lateral em Sistema, clique em Usuários para ver a lista atual.",
                        "icone": "👥"
                  },
                  {
                        "titulo": "2. Clique em Novo Usuário",
                        "texto": "No canto superior direito, clique no botão Novo Usuário para abrir o formulário.",
                        "icone": "➕"
                  },
                  {
                        "titulo": "3. Preencha os dados",
                        "texto": "Informe nome completo, email, cargo (Administrador, Vendedor, Colaborador, Supervisor, RH ou Desenvolvedor), departamento e carga horária.",
                        "icone": "📝"
                  },
                  {
                        "titulo": "4. Defina o cargo",
                        "texto": "O cargo define o conjunto inicial de permissões. Você pode ajustar permissões individuais depois em Permissões.",
                        "icone": "🪪"
                  },
                  {
                        "titulo": "5. Envie o convite",
                        "texto": "O usuário receberá um email com link para definir a senha e acessar o sistema pela primeira vez.",
                        "icone": "📧"
                  }
            ]
      },
      {
            "tipo": "area",
            "titulo": "Cargos Disponíveis e Seus Significados",
            "itens": [
                  "Administrador: acesso total ao sistema, incluindo gestão de usuários e configurações.",
                  "Supervisor: pode gerenciar dossiês e visualizar relatórios da equipe.",
                  "Vendedor: foco em criação de dossiês e emissão de certidões para seus clientes.",
                  "Colaborador: acesso operacional para emissão de certidões e gestão de dossiês.",
                  "RH: acesso a relatórios de produtividade e gestão de usuários.",
                  "Desenvolvedor: acesso técnico para integrações e manutenção."
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Convites Pendentes",
            "texto": "Após enviar o convite, o usuário aparece na lista com status Pendente até confirmar o email e definir a senha. Você pode reenviar o convite a qualquer momento."
      },
      {
            "tipo": "amarelo",
            "titulo": "Limites de Usuários",
            "texto": "O número de usuários ativos depende do plano contratado. Verifique seu plano atual em Configurações > Dados da Empresa > Plano. Usuários desativados não contam para o limite."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Gerencie permissões granulares para controlar exatamente o que cada usuário pode fazer.",
            "icone": "🔐",
            "link": {
                  "slug": "permissoes",
                  "categoria": "usuarios-empresas",
                  "titulo": "Permissões"
            }
      }
]),

"permissoes": a("permissoes", "Permissões", "Controle de Acesso Granular", "Gerencie permissões detalhadas de cada usuário: o que pode ver, criar, editar e excluir em cada módulo do sistema.", "usuarios-empresas", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Gerenciamento de Permissões",
            "texto": "Controle exatamente o que cada usuário pode fazer no sistema. As permissões são granulares e organizadas por módulo, permitindo configurar acessos específicos para cada função."
      },
      {
            "tipo": "area",
            "titulo": "Módulos de Permissão",
            "itens": [
                  "Dossiês: Criar, Visualizar, Editar, Excluir, Arquivar.",
                  "Pessoas: Criar, Visualizar, Editar, Excluir, Gerenciar Vínculos.",
                  "Imóveis: Criar, Visualizar, Editar, Excluir.",
                  "Certidões: Emitir, Visualizar PDFs, Fazer Download, Reemitir.",
                  "Relatórios: Visualizar Relatórios, Exportar Excel, Exportar PDF.",
                  "Sistema: Gerenciar Usuários, Configurações, Ver Logs, Gerenciar Lixeira."
            ]
      },
      {
            "tipo": "timeline",
            "titulo": "Como Alterar Permissões de um Usuário",
            "passos": [
                  {
                        "titulo": "1. Acesse o perfil do usuário",
                        "texto": "Na lista de Usuários, clique no ícone de olho (👁) para abrir o painel lateral.",
                        "icone": "👤"
                  },
                  {
                        "titulo": "2. Vá para a aba Permissões",
                        "texto": "No painel lateral, selecione a aba Permissões para ver a matriz atual.",
                        "icone": "🔐"
                  },
                  {
                        "titulo": "3. Marque ou desmarque permissões",
                        "texto": "Cada módulo lista as ações permitidas. Use os checkboxes para ativar ou desativar.",
                        "icone": "☑"
                  },
                  {
                        "titulo": "4. Salve as alterações",
                        "texto": "Clique em Salvar. As alterações entram em vigor imediatamente na próxima ação do usuário.",
                        "icone": "💾"
                  }
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Boas Práticas de Permissão",
            "texto": "Siga o princípio do menor privilégio: conceda apenas as permissões necessárias para a função. Revise periodicamente as permissões da equipe. Remova acessos de ex-funcionários imediatamente."
      },
      {
            "tipo": "amarelo",
            "titulo": "Permissões e Segurança",
            "texto": "Um usuário sem permissão de excluir dossiês não verá o botão de exclusão. As permissões são verificadas tanto no frontend (interface) quanto no backend (API), garantindo segurança em dupla camada."
      },
      {
            "tipo": "verde",
            "titulo": "Dica",
            "texto": "Use os cargos como ponto de partida e ajuste permissões individuais conforme necessário. Isso economiza tempo em relação a configurar cada permissão manualmente."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Configure os dados da sua empresa que aparecem nos PDFs e relatórios.",
            "icone": "🏢",
            "link": {
                  "slug": "dados-empresa",
                  "categoria": "usuarios-empresas",
                  "titulo": "Dados da Empresa"
            }
      }
]),

"dados-empresa": a("dados-empresa", "Dados da Empresa", "Configuração Corporativa", "Configure os dados da sua empresa: razão social, CNPJ, logo e informações que aparecem nos PDFs gerados.", "usuarios-empresas", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Dados da Empresa",
            "texto": "Configure as informações corporativas que aparecerão nos PDFs, na capa dos dossiês, nos relatórios e em toda a comunicação gerada pelo sistema. Uma configuração correta garante profissionalismo e conformidade."
      },
      {
            "tipo": "area",
            "titulo": "Dados Configuráveis da Empresa",
            "itens": [
                  "Razão social: nome oficial da empresa conforme registro na Junta Comercial.",
                  "Nome fantasia: nome comercial usado no dia a dia.",
                  "CNPJ: Cadastro Nacional de Pessoa Jurídica da empresa.",
                  "Logo: imagem que aparece na capa dos PDFs e relatórios. Formatos aceitos: PNG, JPG.",
                  "Endereço: logradouro, número, complemento, CEP, cidade e estado.",
                  "Telefone de contato: número principal da empresa.",
                  "Site: endereço do site institucional.",
                  "Email institucional: email oficial de contato."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Logo nos PDFs",
            "texto": "A logo aparece na capa de todos os PDFs gerados. Para melhor resultado, use uma imagem PNG com fundo transparente. Tamanho recomendado: 400x200 pixels. Dimensão máxima: 2 MB."
      },
      {
            "tipo": "verde",
            "titulo": "Impacto nos Documentos",
            "texto": "Os dados da empresa são automaticamente inseridos: na capa dos PDFs consolidados, no cabeçalho dos relatórios, na assinatura de emails enviados pelo sistema e nos metadados dos arquivos gerados."
      },
      {
            "tipo": "timeline",
            "titulo": "Como Atualizar os Dados",
            "passos": [
                  {
                        "titulo": "1. Acesse Configurações",
                        "texto": "Menu lateral > Sistema > Configurações.",
                        "icone": "⚙"
                  },
                  {
                        "titulo": "2. Selecione Dados da Empresa",
                        "texto": "No menu de abas, clique em Dados da Empresa.",
                        "icone": "🏢"
                  },
                  {
                        "titulo": "3. Edite os campos",
                        "texto": "Atualize as informações necessárias. Para o logo, faça upload do novo arquivo.",
                        "icone": "📝"
                  },
                  {
                        "titulo": "4. Salve",
                        "texto": "As alterações são aplicadas imediatamente em todos os novos documentos gerados.",
                        "icone": "💾"
                  }
            ]
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Personalize as configurações gerais do sistema.",
            "icone": "⚙",
            "link": {
                  "slug": "config-geral",
                  "categoria": "configuracoes",
                  "titulo": "Configurações Gerais"
            }
      }
]),

"config-geral": a("config-geral", "Configurações Gerais", "Personalização do Sistema", "Ajuste as configurações gerais: tema, idioma, formato de data, notificações e preferências de exibição.", "configuracoes", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Configurações Gerais",
            "texto": "Personalize a A.CERT conforme suas preferências. Todas as configurações são salvas na nuvem e sincronizadas entre dispositivos, garantindo uma experiência consistente onde quer que você acesse."
      },
      {
            "tipo": "area",
            "titulo": "Opções de Personalização",
            "itens": [
                  "Tema da interface: Claro, Escuro ou Automático (segue o tema do sistema operacional).",
                  "Idioma: Português, Inglês, Espanhol, Italiano, Japonês, Coreano ou Chinês.",
                  "Formato de data: DD/MM/AAAA (padrão brasileiro) ou MM/DD/AAAA (padrão americano).",
                  "Fuso horário: ajustável conforme sua localização (padrão: América/São Paulo).",
                  "Notificações do sistema: ativar ou desativar alertas visuais na plataforma.",
                  "Notificações por email: receber atualizações e alertas por email."
            ]
      },
      {
            "tipo": "timeline",
            "titulo": "Como Alterar Suas Configurações",
            "passos": [
                  {
                        "titulo": "1. Acesse Configurações",
                        "texto": "Clique no ícone de engrenagem no menu lateral ou no avatar > Configurações.",
                        "icone": "⚙"
                  },
                  {
                        "titulo": "2. Navegue pelas abas",
                        "texto": "As configurações são organizadas em abas: Geral, Segurança, Notificações e Aparência.",
                        "icone": "📑"
                  },
                  {
                        "titulo": "3. Ajuste as preferências",
                        "texto": "Modifique cada opção conforme desejado. As alterações são salvas automaticamente na maioria dos casos.",
                        "icone": "🎚"
                  },
                  {
                        "titulo": "4. Verifique as mudanças",
                        "texto": "Navegue pelo sistema para conferir se as alterações foram aplicadas corretamente.",
                        "icone": "✅"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Sincronização na Nuvem",
            "texto": "Suas preferências são salvas em nuvem e sincronizadas em todos os dispositivos. Configure uma vez e acesse de qualquer computador com suas preferências pessoais."
      },
      {
            "tipo": "azul",
            "titulo": "Tema Escuro",
            "texto": "O tema escuro reduz a fadiga visual em ambientes com pouca luz e economiza bateria em dispositivos móveis. A opção Automático alterna entre claro e escuro conforme o horário do dia (baseado no sistema operacional)."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Personalize os templates dos PDFs gerados pela A.CERT.",
            "icone": "📄",
            "link": {
                  "slug": "templates-pdf",
                  "categoria": "configuracoes",
                  "titulo": "Templates de PDF"
            }
      }
]),

"templates-pdf": a("templates-pdf", "Templates de PDF", "Personalização de Documentos", "Personalize os templates dos PDFs gerados: capa, cabeçalho, rodapé, cores e tipografia.", "configuracoes", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Templates de PDF",
            "texto": "Configure a aparência dos PDFs gerados pela A.CERT para que reflitam a identidade visual da sua empresa. Todos os documentos seguirão o padrão definido, garantindo consistência e profissionalismo."
      },
      {
            "tipo": "area",
            "titulo": "Elementos Personalizáveis",
            "itens": [
                  "Capa do PDF: logo da empresa, título do dossiê, nome do cliente e data de geração.",
                  "Cabeçalho: nome da empresa, logo reduzida em todas as páginas.",
                  "Rodapé: numeração de página, site e telefone de contato.",
                  "Cores: cor primária dos títulos e elementos visuais.",
                  "Fonte tipográfica: família de fontes para títulos e corpo do texto.",
                  "Layout: posicionamento dos elementos na capa."
            ]
      },
      {
            "tipo": "timeline",
            "titulo": "Como Personalizar os Templates",
            "passos": [
                  {
                        "titulo": "1. Acesse Configurações",
                        "texto": "Menu lateral > Sistema > Configurações > Templates de PDF.",
                        "icone": "⚙"
                  },
                  {
                        "titulo": "2. Escolha o elemento",
                        "texto": "Selecione qual parte do PDF deseja personalizar: Capa, Cabeçalho, Rodapé ou Cores.",
                        "icone": "🎨"
                  },
                  {
                        "titulo": "3. Faça os ajustes",
                        "texto": "Use os controles visuais para modificar cores, fontes e posicionamento. Um preview é exibido em tempo real.",
                        "icone": "🖌"
                  },
                  {
                        "titulo": "4. Salve o template",
                        "texto": "Clique em Salvar. O novo template será aplicado a todos os PDFs gerados a partir de agora.",
                        "icone": "💾"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Preview em Tempo Real",
            "texto": "Durante a personalização, um preview do PDF é exibido mostrando exatamente como ficará o documento final. Isso permite ajustes precisos sem precisar gerar PDFs de teste."
      },
      {
            "tipo": "azul",
            "titulo": "Múltiplos Templates",
            "texto": "Você pode criar diferentes templates para diferentes finalidades: um template formal para cartórios, um template com branding para clientes e um template simplificado para uso interno."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Entenda como funciona o backup automático dos seus dados.",
            "icone": "💾",
            "link": {
                  "slug": "backup",
                  "categoria": "configuracoes",
                  "titulo": "Backup e Restauração"
            }
      }
]),

"backup": a("backup", "Backup e Restauração", "Segurança de Dados", "Como funciona o backup automático dos seus dados e como exportar informações quando necessário.", "configuracoes", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Backup e Restauração",
            "texto": "Seus dados na A.CERT são armazenados em servidores seguros com backup automático diário. Você não precisa se preocupar com perda de dados — mas é importante entender como o sistema protege suas informações."
      },
      {
            "tipo": "area",
            "titulo": "Política de Backup da A.CERT",
            "itens": [
                  "Backup automático diário: todos os dados são copiados a cada 24 horas.",
                  "Retenção de 30 dias: backups são mantidos por 30 dias corridos.",
                  "Criptografia: dados criptografados em trânsito (HTTPS/TLS) e em repouso (AES-256).",
                  "Redundância geográfica: backups são armazenados em múltiplas regiões para proteção contra desastres.",
                  "Exportação manual: você pode exportar seus dados a qualquer momento pelos relatórios."
            ]
      },
      {
            "tipo": "azul",
            "titulo": "O Que Está Protegido pelo Backup",
            "texto": "Todos os dossiês criados e seu conteúdo.\n\nCadastros de pessoas físicas e jurídicas.\n\nCadastros de imóveis com matrícula e endereço.\n\nCertidões emitidas (PDFs armazenados).\n\nDocumentos anexados aos dossiês.\n\nHistórico de atividades de todos os usuários.\n\nConfigurações da empresa e templates de PDF."
      },
      {
            "tipo": "verde",
            "titulo": "Tranquilidade Total",
            "texto": "O backup é 100% automático e gerenciado pela A.CERT. Você não precisa configurar nada. Em caso de falha de hardware ou desastre, os dados são restaurados automaticamente pela equipe de infraestrutura."
      },
      {
            "tipo": "timeline",
            "titulo": "Como Exportar Seus Dados Manualmente",
            "passos": [
                  {
                        "titulo": "1. Use os Relatórios",
                        "texto": "Os relatórios em Excel permitem exportar certidões e dados de produtividade sob demanda.",
                        "icone": "📊"
                  },
                  {
                        "titulo": "2. Download de PDFs",
                        "texto": "Baixe os PDFs consolidados dos dossiês concluídos para armazenamento local.",
                        "icone": "📥"
                  },
                  {
                        "titulo": "3. Backup local",
                        "texto": "Mantenha uma cópia dos PDFs importantes em seu computador ou servidor local como redundância adicional.",
                        "icone": "💾"
                  }
            ]
      },
      {
            "tipo": "amarelo",
            "titulo": "Importante",
            "texto": "O backup automático cobre todo o banco de dados. Se você excluir permanentemente um item da Lixeira, ele será removido do backup após 30 dias. Até lá, a equipe de suporte pode ajudar na recuperação."
      },
      {
            "tipo": "etapa",
            "titulo": "Último tema",
            "texto": "Conheça a Lixeira e como recuperar itens excluídos acidentalmente.",
            "icone": "🗑",
            "link": {
                  "slug": "lixeira",
                  "categoria": "lixeira-recuperacao",
                  "titulo": "Lixeira"
            }
      }
]),

"lixeira": a("lixeira", "Lixeira", "Recuperação de Itens Excluídos", "Entenda como funciona a lixeira da A.CERT: itens excluídos vão para lá e podem ser restaurados em até 30 dias.", "lixeira-recuperacao", "iniciante", "3 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Lixeira",
            "texto": "A lixeira da A.CERT é um recurso de segurança que funciona como uma rede de proteção. Tudo que é excluído vai primeiro para a lixeira, onde permanece por 30 dias antes da exclusão definitiva. Nada é perdido acidentalmente."
      },
      {
            "tipo": "area",
            "titulo": "O Que Vai Para a Lixeira",
            "itens": [
                  "Dossiês excluídos (com todas as certidões e documentos).",
                  "Pessoas removidas (físicas e jurídicas).",
                  "Imóveis excluídos (com matrícula e endereço).",
                  "Documentos anexados apagados.",
                  "Usuários desativados."
            ]
      },
      {
            "tipo": "area",
            "titulo": "Regras da Lixeira",
            "itens": [
                  "Itens permanecem na lixeira por 30 dias corridos.",
                  "Após 30 dias, são excluídos permanentemente de forma automática.",
                  "Restaurar um item o devolve exatamente como estava, com todos os dados preservados.",
                  "A exclusão permanente (manual ou automática) é irreversível.",
                  "Itens na lixeira não aparecem nas listas principais do sistema."
            ]
      },
      {
            "tipo": "timeline",
            "titulo": "Como Acessar e Usar a Lixeira",
            "passos": [
                  {
                        "titulo": "1. Acesse a Lixeira",
                        "texto": "Menu lateral > Sistema > Lixeira. Todos os itens excluídos são listados por tipo e data de exclusão.",
                        "icone": "🗑"
                  },
                  {
                        "titulo": "2. Filtre por tipo",
                        "texto": "Use os filtros para ver apenas Dossiês, Pessoas, Imóveis ou Documentos excluídos.",
                        "icone": "🔍"
                  },
                  {
                        "titulo": "3. Visualize detalhes",
                        "texto": "Clique em um item para ver seus detalhes e confirmar se é o que deseja restaurar.",
                        "icone": "👁"
                  },
                  {
                        "titulo": "4. Restaure ou exclua permanentemente",
                        "texto": "Use os botões Restaurar (♻) ou Excluir Permanentemente (❌) para cada item.",
                        "icone": "⚡"
                  }
            ]
      },
      {
            "tipo": "verde",
            "titulo": "Dica",
            "texto": "Se não tem certeza se vai precisar de um item, apenas archive-o em vez de excluir. O arquivamento remove da lista principal mas mantém o item acessível sem prazo de expiração."
      },
      {
            "tipo": "amarelo",
            "titulo": "Atenção",
            "texto": "A exclusão automática após 30 dias é irreversível e não gera novo aviso. Se houver itens na lixeira que você quer manter, restaure-os antes do prazo expirar. O sistema exibe a data de exclusão para cada item."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Aprenda a restaurar itens da lixeira passo a passo.",
            "icone": "♻",
            "link": {
                  "slug": "restaurar-item",
                  "categoria": "lixeira-recuperacao",
                  "titulo": "Restaurar Item"
            }
      }
]),

"restaurar-item": a("restaurar-item", "Restaurar Item", "Recuperação de Dados", "Passo a passo para restaurar qualquer item da lixeira: dossiês, pessoas, imóveis e documentos.", "lixeira-recuperacao", "iniciante", "3 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Restaurar Item da Lixeira",
            "texto": "Recuperar itens excluídos é simples e rápido. Em poucos cliques, o item volta ao seu local original com todos os dados, certidões e documentos preservados exatamente como estavam antes da exclusão."
      },
      {
            "tipo": "timeline",
            "titulo": "Passo a Passo para Restaurar",
            "passos": [
                  {
                        "titulo": "1. Acesse a Lixeira",
                        "texto": "No menu lateral em Sistema, clique em Lixeira. A lista de todos os itens excluídos será exibida.",
                        "icone": "🗑"
                  },
                  {
                        "titulo": "2. Localize o item",
                        "texto": "Use a barra de busca ou os filtros por tipo (Dossiês, Pessoas, Imóveis, Documentos) para encontrar o item desejado.",
                        "icone": "🔍"
                  },
                  {
                        "titulo": "3. Verifique os detalhes",
                        "texto": "Clique no item para expandir e ver informações como data de exclusão, quem excluiu e quantos dias restam para exclusão permanente.",
                        "icone": "👁"
                  },
                  {
                        "titulo": "4. Clique em Restaurar",
                        "texto": "Ao lado do item ou no painel de detalhes, clique no botão Restaurar. Uma confirmação rápida será exibida.",
                        "icone": "♻"
                  },
                  {
                        "titulo": "5. Confirme a restauração",
                        "texto": "Após confirmar, o item desaparece da lixeira e reaparece em sua seção original. Todos os dados estão intactos.",
                        "icone": "✅"
                  }
            ]
      },
      {
            "tipo": "azul",
            "titulo": "O Que É Restaurado Junto",
            "texto": "Ao restaurar um dossiê, tudo volta junto: certidões emitidas, PDFs gerados, documentos anexados, observações, participantes vinculados e histórico completo de atividades. É como se nunca tivesse sido excluído."
      },
      {
            "tipo": "verde",
            "titulo": "Ações em Lote",
            "texto": "Você pode selecionar múltiplos itens na lixeira e restaurá-los de uma só vez usando a caixa de seleção no topo da lista e o botão 'Restaurar Selecionados'."
      },
      {
            "tipo": "amarelo",
            "titulo": "Restauração e Vínculos",
            "texto": "Se você excluiu uma Pessoa que estava vinculada a dossiês, ao restaurá-la os vínculos são restabelecidos automaticamente. O mesmo vale para Imóveis vinculados."
      },
      {
            "tipo": "etapa",
            "titulo": "Próximo",
            "texto": "Saiba como excluir itens permanentemente quando não forem mais necessários.",
            "icone": "❌",
            "link": {
                  "slug": "excluir-permanente",
                  "categoria": "lixeira-recuperacao",
                  "titulo": "Excluir Permanentemente"
            }
      }
]),

"excluir-permanente": a("excluir-permanente", "Excluir Permanentemente", "Remoção Definitiva", "Quando e como excluir itens permanentemente, o que evitar e como resolver erros na exclusão.", "lixeira-recuperacao", "iniciante", "5 min", "26/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Excluir Permanentemente",
            "texto": "Excluir permanentemente é a ação mais radical no sistema — remove todos os vestígios de um item sem possibilidade de recuperação. Este guia mostra quando fazer, como fazer, o que NÃO fazer e como resolver se algo der errado."
      },
      {
            "tipo": "fluxograma",
            "titulo": "Fluxo da Exclusão Definitiva",
            "texto": "Item na lixeira → Verificar se realmente não é mais necessário → Tentar excluir → Se erro de vínculo, resolver pendências primeiro → Confirmar ação → Item removido definitivamente."
      },
      {
            "tipo": "timeline",
            "titulo": "Passo a Passo",
            "passos": [
                  {
                        "titulo": "1. Acesse a Lixeira",
                        "texto": "Menu lateral > Sistema > Lixeira. Localize o item que deseja remover.",
                        "icone": "🗑"
                  },
                  {
                        "titulo": "2. Verifique o item antes de excluir",
                        "texto": "Confira nome, data de exclusão e conteúdo vinculado (certidões, documentos, participantes). Se houver algo importante, restaure em vez de excluir.",
                        "icone": "🔍"
                  },
                  {
                        "titulo": "3. Clique em Excluir Permanentemente",
                        "texto": "Use o botão ❌ na linha do item. Diferente de mover para lixeira, esta ação não tem volta.",
                        "icone": "❌"
                  },
                  {
                        "titulo": "4. Confirme na mensagem de alerta",
                        "texto": "Leia o aviso com atenção. Se tiver dúvida, clique em Cancelar. Depois de confirmar, não há como desfazer.",
                        "icone": "⚠"
                  }
            ]
      },
      {
            "tipo": "amarelo",
            "titulo": "O que NÃO fazer",
            "texto": "Nunca exclua permanentemente um item que ainda pode ser necessário — a não ser que tenha absoluta certeza. Não tente excluir um item que ainda tem vínculos ativos (como uma pessoa participando de dossiês ativos) — o sistema vai recusar. Não feche o navegador durante a exclusão. Não confirme a exclusão por impulso — leia o aviso primeiro."
      },
      {
            "tipo": "problemas",
            "titulo": "Se algo der errado",
            "problemas": [
                  {
                        "q": "O sistema mostra 'Erro ao excluir permanentemente'",
                        "a": "Isso acontece quando o item ainda tem vínculos ativos no banco de dados. Por exemplo: uma pessoa que ainda é participante de um dossiê, proprietária de um imóvel, ou tem vínculos parentais. Solução: primeiro remova ou desvincule a pessoa desses registros, depois tente excluir novamente."
                  },
                  {
                        "q": "O item não aparece na lixeira",
                        "a": "Itens excluídos ficam na lixeira por 30 dias antes de serem removidos automaticamente. Se o item sumiu antes disso, ele pode ter sido excluído permanentemente por outro usuário com permissão. Verifique o histórico de auditoria em Configurações > Auditoria."
                  },
                  {
                        "q": "Excluí um item sem querer",
                        "a": "Se o item ainda está na lixeira (não foi excluído permanentemente), basta restaurá-lo. Se já foi excluído permanentemente, não há como recuperar — o dado foi removido fisicamente do banco. Contate o suporte apenas se o item foi excluído há menos de 24h (pode haver backup)."
                  },
                  {
                        "q": "A exclusão permanente está desabilitada",
                        "a": "Apenas administradores podem excluir itens permanentemente. Se você não vê o botão, solicite a um administrador ou peça para ele realizar a exclusão."
                  }
            ]
      },
      {
            "tipo": "azul",
            "titulo": "Quando Excluir Permanentemente",
            "texto": "Recomendamos manter itens na lixeira pelos 30 dias completos antes de excluir permanentemente. Só antecipe a exclusão se: o item foi criado por engano e nunca teve conteúdo relevante, ou se há questões legais/compliance que exigem remoção definitiva imediata."
      },
      {
            "tipo": "verde",
            "titulo": "Alternativa: Arquivamento",
            "texto": "Na maioria dos casos, arquivar é melhor que excluir. O arquivamento remove o item das listas principais mas o mantém acessível indefinidamente. Apenas exclua permanentemente se tiver absoluta certeza."
      },
      {
            "tipo": "etapa",
            "titulo": "Voltar ao guia principal",
            "texto": "Revisite a visão geral da lixeira.",
            "icone": "🗑",
            "link": {
                  "slug": "lixeira",
                  "categoria": "lixeira-recuperacao",
                  "titulo": "Lixeira"
            }
      }
]),

"bem-vindo-a-acert": a("bem-vindo-a-acert", "Bem-vindo à A.CERT", "Visão Geral da Plataforma", "Conheça tudo sobre a A.CERT, seus recursos principais e como ela vai transformar sua rotina de certidões imobiliárias.", "primeiros-passos", "iniciante", "5 min", "24/07/2026", [
      {
            "tipo": "hero",
            "titulo": "Bem-vindo à A.CERT",
            "texto": "A A.CERT é a plataforma mais completa do mercado para emissão automatizada de certidões imobiliárias. Conectada a 7 órgãos oficiais, ela elimina horas de trabalho manual, reduz erros e centraliza toda a documentação em um só lugar. Seja bem-vindo à nova era das certidões imobiliárias."
      },
      {
            "tipo": "azul",
            "titulo": "O Que a A.CERT Faz por Você",
            "texto": "Automatiza a consulta e emissão de certidões em órgãos como Receita Federal, TRF1, TJDFT, TRT, TST, SEFAZ-DF e ONR. Basta cadastrar a pessoa e o imóvel, criar um dossiê e disparar as consultas — o sistema navega nos sites oficiais, preenche formulários e baixa os PDFs automaticamente. Apenas CAPTCHAs precisam de interação manual."
      },
      {
            "tipo": "verde",
            "titulo": "Principais Benefícios",
            "texto": "Redução de 90% do tempo gasto com consultas manuais.\n\nDiminuição drástica de erros de digitação e esquecimentos.\n\nCentralização de todos os documentos em dossiês organizados.\n\nGeração automática de PDF consolidado profissional.\n\nAcompanhamento em tempo real pelo Display Remoto (VNC).\n\nMúltiplas consultas simultâneas com pool de 3 displays.\n\nRelatórios de produtividade para gestão da equipe.\n\nLixeira com recuperação de 30 dias para evitar perda de dados."
      },
      {
            "tipo": "timeline",
            "titulo": "Como Começar em 6 Passos",
            "passos": [
                  {
                        "titulo": "1. Faça seu cadastro",
                        "texto": "Acesse acert.tech e crie sua conta com email e senha. Você receberá um email de confirmação.",
                        "icone": "🚀"
                  },
                  {
                        "titulo": "2. Confirme seu email",
                        "texto": "Clique no link enviado para ativar sua conta. Verifique a caixa de spam se necessário.",
                        "icone": "✅"
                  },
                  {
                        "titulo": "3. Faça login e configure",
                        "texto": "Acesse o Dashboard, troque a senha temporária e ajuste tema e idioma nas configurações.",
                        "icone": "🔐"
                  },
                  {
                        "titulo": "4. Cadastre sua primeira Pessoa",
                        "texto": "Em Pessoas > Nova Pessoa, preencha nome completo, CPF, data de nascimento e filiação.",
                        "icone": "👤"
                  },
                  {
                        "titulo": "5. Cadastre um Imóvel (opcional)",
                        "texto": "Em Imóveis > Novo Imóvel, informe matrícula, endereço e cartório.",
                        "icone": "🏢"
                  },
                  {
                        "titulo": "6. Crie seu primeiro Dossiê",
                        "texto": "No Dashboard, clique em Novo Dossiê, vincule pessoa e imóvel, selecione as certidões e dispare!",
                        "icone": "📂"
                  }
            ]
      },
      {
            "tipo": "fluxograma",
            "titulo": "Arquitetura da Plataforma",
            "texto": "A A.CERT opera em três camadas: (1) Frontend Web — interface que você usa no navegador, responsiva para desktop e mobile; (2) Backend API — processa as solicitações, gerencia o banco de dados e orquestra as automações; (3) Displays Remotos (VNC) — navegadores Chrome em servidores que acessam os sites dos órgãos oficiais, preenchem formulários e baixam certidões."
      },
      {
            "tipo": "area",
            "titulo": "Órgãos Integrados",
            "itens": [
                  "Receita Federal: Certidão Conjunta de Débitos Federais.",
                  "TRF1: Certidão Cível e Criminal da Justiça Federal (13 estados + DF).",
                  "TJDFT: Certidão Especial Cível e Criminal do DF.",
                  "TRT 10ª Região: Certidão Trabalhista (DF e TO).",
                  "TST: Certidão Trabalhista Nacional (todos os 24 TRTs).",
                  "SEFAZ-DF: Certidão de Débitos Estaduais do DF.",
                  "ONR: Ônus Reais e Ações Reipersecutórias sobre imóveis."
            ]
      },
      {
            "tipo": "problemas",
            "titulo": "Dúvidas Frequentes",
            "problemas": [
                  {
                        "q": "A A.CERT substitui completamente as consultas manuais?",
                        "a": "Sim! Para os 7 órgãos integrados, a A.CERT automatiza todo o processo de navegação, preenchimento de formulários e download de PDFs. Apenas CAPTCHAs precisam de interação manual, e mesmo estes são detectados automaticamente com pausa para sua resolução."
                  },
                  {
                        "q": "Preciso instalar algum programa no computador?",
                        "a": "Não. A A.CERT é 100% baseada em nuvem (web). Basta um navegador moderno como Chrome, Edge ou Firefox. Os displays remotos rodam em servidores da A.CERT — você apenas visualiza e interage via navegador."
                  },
                  {
                        "q": "Posso acessar do celular ou tablet?",
                        "a": "Sim, a interface é totalmente responsiva e se adapta a smartphones e tablets. No entanto, para resolver CAPTCHAs e acompanhar o Display Remoto, a experiência no desktop é mais confortável."
                  },
                  {
                        "q": "Meus dados estão seguros?",
                        "a": "Sim. Todos os dados são criptografados em trânsito (HTTPS/TLS) e em repouso (AES-256). Backups automáticos diários com retenção de 30 dias garantem que nenhuma informação seja perdida."
                  },
                  {
                        "q": "Posso emitir certidões para qualquer estado do Brasil?",
                        "a": "Sim, para os órgãos de abrangência nacional (Receita Federal, TST, ONR). Para órgãos regionais como TRF1 e TJDFT, a cobertura é da respectiva jurisdição. Consulte a lista de órgãos integrados para detalhes de abrangência."
                  }
            ]
      },
      {
            "tipo": "etapa",
            "titulo": "Precisa de ajuda?",
            "texto": "Se tiver qualquer dúvida, nossa equipe de suporte está pronta para ajudar pelo chat da plataforma.",
            "icone": "💬"
      }
])
};