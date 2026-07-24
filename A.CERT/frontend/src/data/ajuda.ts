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
  "primeiro-acesso": a("primeiro-acesso", "Primeiro Acesso", "Login e Configuração Inicial", "Guia completo para seu primeiro acesso ao sistema: login, verificação de email e configurações essenciais.", "primeiros-passos", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Primeiro Acesso", texto: "Após criar sua conta, é hora de acessar o sistema pela primeira vez. Siga este guia para configurar tudo corretamente e começar a usar a A.CERT sem dificuldades." },
    { tipo: "timeline", titulo: "Passo a passo do primeiro acesso", passos: [
      { titulo: "1. Acesse a tela de login", texto: "Vá para acert.tech e digite seu email e senha cadastrados. Se esqueceu a senha, clique em 'Esqueci minha senha'.", icone: "🔐" },
      { titulo: "2. Verifique seu email (se necessário)", texto: "Se você ainda não confirmou seu email, receberá um link de verificação. Clique nele para ativar sua conta. Verifique também a caixa de spam.", icone: "📧" },
      { titulo: "3. Dashboard — seu painel de controle", texto: "Após o login, você verá o Dashboard com indicadores de dossiês, certidões pendentes e atividades recentes. É sua central de comando.", icone: "📊" },
      { titulo: "4. Primeira troca de senha", texto: "Por segurança, recomendamos trocar a senha temporária. Vá em Configurações > Segurança da Conta > Alterar Senha.", icone: "🔑" },
      { titulo: "5. Configure preferências", texto: "Em Configurações, ajuste idioma, tema (claro/escuro) e formato de data conforme sua preferência.", icone: "⚙" },
    ]},
    { tipo: "azul", titulo: "Dica de segurança", texto: "Nunca compartilhe sua senha. Use uma senha forte com letras maiúsculas, minúsculas, números e símbolos. Ative a verificação em duas etapas se disponível." },
  ]),

  "conhecendo-dashboard": a("conhecendo-dashboard", "Conhecendo o Dashboard", "Seu Centro de Comando", "Aprenda a interpretar cada indicador e métrica do Dashboard para tomar decisões rápidas e precisas.", "primeiros-passos", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Conhecendo o Dashboard", texto: "O Dashboard é a primeira tela que você vê ao fazer login. Ele concentra todas as informações importantes sobre seus dossiês, certidões e produtividade em um só lugar." },
    { tipo: "area", titulo: "Indicadores principais", itens: [
      "Dossiês em Andamento: quantos dossiês estão ativos no momento",
      "Dossiês Concluídos: total de dossiês finalizados (todas as certidões emitidas)",
      "Certidões Emitidas: total de certidões obtidas com sucesso",
      "Taxa de Conclusão: percentual de certidões obtidas em relação ao total solicitado",
      "Certidões Pendentes: quantas ainda precisam ser emitidas",
    ]},
    { tipo: "area", titulo: "Gráficos e visualizações", itens: [
      "Gráfico de Emissões por Mês: acompanhe a evolução das emissões ao longo do tempo",
      "Distribuição de Status: veja quantos dossiês estão Pendentes, Cancelados ou Concluídos",
      "Prioridades: lista dos dossiês que precisam de atenção urgente",
      "Status dos Órgãos: veja se os órgãos estão online e responsivos",
      "Atividades Recentes: últimas ações realizadas no sistema",
    ]},
    { tipo: "verde", titulo: "Ação rápida", texto: "Use os cards do topo para criar um novo dossiê com um clique. O botão 'Novo Dossiê' está sempre visível na sidebar e no Dashboard." },
  ]),

  "navegando-sistema": a("navegando-sistema", "Navegando pelo Sistema", "Menu e Seções", "Domine a navegação completa da A.CERT: menu lateral, atalhos, busca rápida e todas as seções disponíveis.", "primeiros-passos", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Navegando pelo Sistema", texto: "A interface da A.CERT foi projetada para ser intuitiva e produtiva. Conheça cada seção e como se movimentar rapidamente entre elas." },
    { tipo: "area", titulo: "Menu Lateral — Seções", itens: [
      "GERENCIAMENTO: Dashboard — visão geral do sistema",
      "GERENCIAMENTO: Dossiês — criação e acompanhamento de dossiês",
      "GERENCIAMENTO: Certidões — consultas e emissão de certidões",
      "GERENCIAMENTO: Relatórios — exportação de dados e estatísticas",
      "CADASTROS: Pessoas — cadastro de pessoas físicas e jurídicas",
      "CADASTROS: Imóveis — cadastro de propriedades e matrículas",
      "DOCUMENTAÇÃO: Ajuda/Suporte — documentação completa e abertura de chamados",
      "SISTEMA: Usuários — gestão de usuários e permissões",
      "SISTEMA: Configurações — ajustes do sistema e perfil",
      "SISTEMA: Lixeira — recuperação de itens excluídos",
    ]},
    { tipo: "azul", titulo: "Atalhos do teclado", texto: "Pressione Ctrl+K ou ⌘K para abrir a busca rápida e navegar para qualquer seção do sistema instantaneamente. Use Esc para fechar." },
    { tipo: "verde", titulo: "Tour guiado", texto: "Na primeira visita, o tour guiado mostra cada elemento da interface. Para repetir o tour a qualquer momento, vá em Central de Ajuda > Tour pela Plataforma." },
  ]),

  "fluxo-completo": a("fluxo-completo", "Fluxo Completo de Consulta", "Do Início ao Fim", "Passo a passo completo: do cadastro da pessoa até o PDF final do dossiê com todas as certidões emitidas.", "primeiros-passos", "iniciante", "10 min", "24/07/2026", [
    { tipo: "hero", titulo: "Fluxo Completo de uma Consulta", texto: "Este guia mostra o ciclo completo de uma consulta na A.CERT: cadastrar a pessoa, criar o dossiê, emitir as certidões e gerar o PDF final." },
    { tipo: "timeline", titulo: "Etapas do fluxo completo", passos: [
      { titulo: "1. Cadastre a Pessoa", texto: "Vá em Pessoas > Nova Pessoa. Preencha nome completo, CPF, data de nascimento, nome da mãe e do pai. Esses dados são essenciais para as certidões.", icone: "👤" },
      { titulo: "2. Cadastre o Imóvel (opcional)", texto: "Se a consulta envolver imóvel, cadastre-o em Imóveis com matrícula, endereço e cartório.", icone: "🏢" },
      { titulo: "3. Crie um Dossiê", texto: "No Dashboard ou Dossiês, clique em 'Novo Dossiê'. Selecione a pessoa e o imóvel (se aplicável). Dê um nome identificador.", icone: "📂" },
      { titulo: "4. Selecione as Certidões", texto: "Escolha quais certidões deseja emitir: Receita Federal, TRF1, TJDFT, TRT, TST, SEFAZ-DF, ONR. Você pode selecionar todas ou apenas as necessárias.", icone: "📜" },
      { titulo: "5. Dispare a Consulta", texto: "Clique em 'Emitir Certidões'. O sistema abrirá o Display Remoto (VNC) mostrando o navegador em tempo real.", icone: "🚀" },
      { titulo: "6. Acompanhe e resolva CAPTCHAs", texto: "No Display Remoto, você verá o navegador automatizado. Se aparecer CAPTCHA, resolva-o manualmente. O sistema continua sozinho depois.", icone: "🖥" },
      { titulo: "7. Certidões emitidas", texto: "Conforme cada certidão é obtida, ela aparece no dossiê. Acompanhe o progresso em tempo real.", icone: "✅" },
      { titulo: "8. Gere o PDF consolidado", texto: "Com todas as certidões prontas, clique em 'Gerar PDF'. O sistema compila tudo em um único arquivo profissional.", icone: "📄" },
      { titulo: "9. Faça o download", texto: "Baixe o PDF consolidado com todas as certidões e entregue ao cliente.", icone: "📥" },
    ]},
    { tipo: "verde", titulo: "Tempo estimado", texto: "Uma consulta completa com 5 certidões leva em média 10-15 minutos, dependendo da velocidade dos órgãos e da necessidade de resolver CAPTCHAs." },
  ]),

  "o-que-e-dossie": a("o-que-e-dossie", "O que é um Dossiê", "Conceito e Estrutura", "Entenda o conceito de dossiê imobiliário digital, sua estrutura e como ele organiza todo o processo de certidões.", "dossies", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "O que é um Dossiê", texto: "O Dossiê é a unidade central de trabalho na A.CERT. Ele reúne pessoa, imóvel, certidões e documentos em um único processo organizado — como uma pasta digital completa para cada negociação imobiliária." },
    { tipo: "area", titulo: "O que compõe um dossiê", itens: [
      "Identificador único — número sequencial (ex: 2026-001)",
      "Pessoa vinculada — dados do comprador/vendedor",
      "Imóvel vinculado — matrícula, endereço, cartório",
      "Participantes adicionais — cônjuges, fiadores, etc.",
      "Certidões — lista de certidões solicitadas e seus status",
      "Documentos anexados — upload de documentos complementares",
      "Observações — notas e comentários da equipe",
      "Histórico de atividades — log completo de todas as ações",
      "Status — Em andamento, Concluído, Cancelado, Arquivado",
    ]},
    { tipo: "azul", titulo: "Status do Dossiê", texto: "• Em andamento: consultas sendo processadas\n• Pendente: ação necessária (ex: falta CPF)\n• Concluído: todas as certidões emitidas\n• Cancelado: processo cancelado\n• Arquivado: movido para arquivo (não aparece nas listas principais)" },
  ]),

  "criando-dossie": a("criando-dossie", "Criando um Dossiê", "Criação Passo a Passo", "Aprenda a criar um dossiê completo vinculando pessoa e imóvel para iniciar as consultas de certidões.", "dossies", "iniciante", "10 min", "24/07/2026", [
    { tipo: "hero", titulo: "Criando um Dossiê", texto: "Criar um dossiê é o primeiro passo para emitir certidões. Em menos de 2 minutos você configura tudo e está pronto para disparar as consultas." },
    { tipo: "timeline", titulo: "Como criar um dossiê", passos: [
      { titulo: "1. Acesse a seção Dossiês", texto: "No menu lateral, clique em Dossiês ou use o botão 'Novo Dossiê' no Dashboard.", icone: "📂" },
      { titulo: "2. Clique em Novo Dossiê", texto: "O modal de criação será aberto.", icone: "➕" },
      { titulo: "3. Selecione a Pessoa", texto: "Busque pelo nome ou CPF da pessoa. Se ainda não cadastrou, pode criar na hora.", icone: "👤" },
      { titulo: "4. Vincule um Imóvel (opcional)", texto: "Se a consulta for para um imóvel específico, busque e vincule a propriedade.", icone: "🏢" },
      { titulo: "5. Defina o tipo de transação", texto: "Escolha entre Venda, Locação ou outros tipos.", icone: "📝" },
      { titulo: "6. Confirme", texto: "Clique em 'Criar Dossiê'. O novo dossiê aparecerá na lista.", icone: "✅" },
    ]},
    { tipo: "verde", titulo: "Dica", texto: "Use identificadores descritivos como '2026-001 - João Silva - Apt 302'. Isso facilita encontrar o dossiê depois." },
  ]),

  "editando-dossie": a("editando-dossie", "Editando um Dossiê", "Edição e Atualização", "Saiba como editar dados de um dossiê existente, adicionar observações e gerenciar participantes.", "dossies", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Editando um Dossiê", texto: "Dossiês podem ser editados a qualquer momento para atualizar informações, adicionar observações ou vincular novos participantes." },
    { tipo: "area", titulo: "O que pode ser editado", itens: [
      "Identificador do dossiê",
      "Tipo de transação (venda, locação, etc.)",
      "Pessoa vinculada",
      "Imóvel vinculado",
      "Prioridade (Regular, Alta, Urgente)",
      "Observações gerais",
      "Participantes adicionais",
    ]},
    { tipo: "timeline", titulo: "Como editar", passos: [
      { titulo: "1. Abra o dossiê", texto: "Na lista de dossiês, clique no que deseja editar.", icone: "📂" },
      { titulo: "2. Clique em Editar", texto: "No topo da página do dossiê, clique no ícone de lápis (Editar).", icone: "✏️" },
      { titulo: "3. Faça as alterações", texto: "Modifique os campos necessários no modal de edição.", icone: "📝" },
      { titulo: "4. Salve", texto: "Clique em 'Salvar'. As alterações são aplicadas imediatamente.", icone: "💾" },
    ]},
    { tipo: "amarelo", titulo: "Atenção", texto: "Alterar a pessoa ou imóvel vinculado pode afetar certidões já emitidas. Certifique-se antes de modificar esses campos." },
  ]),

  "status-dossie": a("status-dossie", "Status do Dossiê", "Acompanhamento e Significados", "Entenda cada status do dossiê (Em andamento, Pendente, Concluído, Cancelado, Arquivado) e como gerenciá-los.", "dossies", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Status do Dossiê", texto: "Cada dossiê possui um status que indica em que fase do processo ele se encontra. Saber interpretar esses status é essencial para gerenciar seu fluxo de trabalho." },
    { tipo: "area", titulo: "Significado de cada status", itens: [
      "Em andamento (verde): consultas estão sendo processadas ou há certidões já emitidas. É o status normal de trabalho.",
      "Pendente (vermelho): algo está impedindo o progresso — CPF não informado, dados incompletos, pendência de ação do usuário.",
      "Concluído (verde escuro): todas as certidões solicitadas foram emitidas com sucesso. O dossiê está pronto para gerar PDF.",
      "Cancelado (vermelho): o processo foi cancelado manualmente pelo usuário.",
      "Arquivado (cinza): o dossiê foi movido para arquivo. Não aparece nas listas principais mas pode ser restaurado.",
    ]},
    { tipo: "timeline", titulo: "Como gerenciar status", passos: [
      { titulo: "1. Visualize o status", texto: "Na lista de dossiês, o status aparece em destaque com cor. Dossiês pendentes têm indicador vermelho.", icone: "👁" },
      { titulo: "2. Resolva pendências", texto: "Se o status for Pendente, veja o motivo (ex: 'CPF não informado') e corrija o dado faltante.", icone: "🔧" },
      { titulo: "3. Conclua ou cancele", texto: "Quando todas as certidões estiverem prontas, o status muda automaticamente para Concluído. Para cancelar, use o menu de ações.", icone: "✅" },
    ]},
  ]),

  "excluindo-dossie": a("excluindo-dossie", "Excluindo um Dossiê", "Remoção e Recuperação", "Como excluir um dossiê com segurança, mover para lixeira e recuperar caso necessário.", "dossies", "iniciante", "3 min", "24/07/2026", [
    { tipo: "hero", titulo: "Excluindo um Dossiê", texto: "A exclusão na A.CERT é segura: os itens vão primeiro para a Lixeira, onde podem ser restaurados em até 30 dias." },
    { tipo: "timeline", titulo: "Como excluir", passos: [
      { titulo: "1. Localize o dossiê", texto: "Na lista de dossiês, encontre o que deseja remover.", icone: "📂" },
      { titulo: "2. Menu de ações", texto: "Clique nos três pontos (⋮) ao lado do dossiê e selecione 'Mover para Lixeira'.", icone: "⋮" },
      { titulo: "3. Confirme", texto: "Confirme a ação. O dossiê será movido para a lixeira.", icone: "✅" },
      { titulo: "4. Recupere se necessário", texto: "Vá em Sistema > Lixeira para ver itens excluídos e restaurá-los.", icone: "♻" },
    ]},
    { tipo: "amarelo", titulo: "Importante", texto: "Certidões já emitidas não são perdidas ao excluir um dossiê. Ao restaurar da lixeira, tudo volta como estava. A exclusão permanente remove definitivamente os dados." },
  ]),

  "cadastro-pessoa": a("cadastro-pessoa", "Cadastro de Pessoa", "Pessoas Físicas e Jurídicas", "Guia completo para cadastrar pessoas físicas (CPF) e jurídicas (CNPJ) com todos os campos importantes.", "pessoas", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Cadastro de Pessoa", texto: "O cadastro de pessoas é a base para emissão de certidões. Dados corretos e completos garantem que as consultas sejam bem-sucedidas." },
    { tipo: "area", titulo: "Campos essenciais — Pessoa Física", itens: [
      "Nome completo (igual ao documento)",
      "CPF (válido e ativo na Receita Federal)",
      "Data de nascimento",
      "Nome da mãe (essencial para algumas certidões)",
      "Nome do pai (essencial para certidões cíveis)",
      "RG (opcional, mas recomendado)",
      "Email e telefone para contato",
      "Endereço completo (CEP, cidade, estado)",
    ]},
    { tipo: "area", titulo: "Campos essenciais — Pessoa Jurídica", itens: [
      "Razão social completa",
      "CNPJ (válido e ativo)",
      "Nome fantasia",
      "Email e telefone para contato",
      "Endereço da sede",
    ]},
    { tipo: "verde", titulo: "Validação automática", texto: "Ao cadastrar um CPF, a A.CERT valida automaticamente na base da Receita Federal, garantindo que o documento existe e os dados conferem." },
    { tipo: "amarelo", titulo: "Atenção", texto: "CPFs com dados divergentes (nome, data de nascimento, filiação) podem causar falhas nas certidões. Sempre confira os dados antes de cadastrar." },
  ]),

  "vinculos-parentais": a("vinculos-parentais", "Vínculos Parentais", "Relações Familiares", "Configure vínculos parentais entre pessoas cadastradas. Essencial para certidões que exigem dados de cônjuges e dependentes.", "pessoas", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Vínculos Parentais", texto: "Algumas certidões (especialmente as da Justiça Federal e Trabalhista) exigem dados do cônjuge. Configure vínculos para automatizar o preenchimento." },
    { tipo: "area", titulo: "Tipos de vínculo disponíveis", itens: [
      "Cônjuge / Companheiro(a)",
      "Filho(a)",
      "Pai / Mãe",
      "Irmão/Irmã",
      "Outros (personalizado)",
    ]},
    { tipo: "timeline", titulo: "Como criar um vínculo", passos: [
      { titulo: "1. Abra a ficha da pessoa", texto: "Na lista de Pessoas, clique na pessoa base.", icone: "👤" },
      { titulo: "2. Seção Vínculos", texto: "Na ficha, encontre a seção 'Vínculos Parentais'.", icone: "🔗" },
      { titulo: "3. Selecione a pessoa relacionada", texto: "Busque pelo nome ou CPF da pessoa a ser vinculada.", icone: "🔍" },
      { titulo: "4. Escolha o tipo de vínculo", texto: "Selecione o tipo de relação (cônjuge, filho, etc.).", icone: "📋" },
      { titulo: "5. Confirme", texto: "O vínculo fica registrado e será usado automaticamente nas certidões.", icone: "✅" },
    ]},
  ]),

  "busca-pessoa": a("busca-pessoa", "Busca de Pessoa", "Localização Rápida", "Como encontrar rapidamente qualquer pessoa cadastrada usando busca por nome, CPF, email ou telefone.", "pessoas", "iniciante", "3 min", "24/07/2026", [
    { tipo: "hero", titulo: "Busca de Pessoa", texto: "Com dezenas ou centenas de pessoas cadastradas, a busca eficiente é essencial. A A.CERT oferece busca instantânea por múltiplos campos." },
    { tipo: "area", titulo: "Campos pesquisáveis", itens: [
      "Nome completo ou parcial",
      "CPF (com ou sem pontuação)",
      "CNPJ (para pessoas jurídicas)",
      "Email",
      "Telefone",
      "Cidade/Estado",
    ]},
    { tipo: "azul", titulo: "Dica de produtividade", texto: "Use o atalho Ctrl+K em qualquer tela para abrir a busca global. Digite o nome da pessoa e navegue direto para a ficha dela." },
  ]),

  "como-emitir": a("como-emitir", "Como Emitir Certidões", "Processo Completo de Emissão", "Guia detalhado do processo de emissão: seleção de órgãos, disparo da consulta, acompanhamento e obtenção dos PDFs.", "emissao-certidoes", "iniciante", "10 min", "24/07/2026", [
    { tipo: "hero", titulo: "Como Emitir Certidões", texto: "A emissão de certidões é o coração da A.CERT. Em poucos cliques, você dispara consultas automatizadas em múltiplos órgãos simultaneamente." },
    { tipo: "timeline", titulo: "Passo a passo da emissão", passos: [
      { titulo: "1. Abra o dossiê", texto: "Na lista de dossiês, clique no dossiê onde deseja emitir certidões.", icone: "📂" },
      { titulo: "2. Vá para a aba Partes", texto: "Na página do dossiê, selecione a aba 'Partes Envolvidas'.", icone: "👥" },
      { titulo: "3. Clique em Emitir Certidão", texto: "Para cada participante, clique no botão de emissão. Será aberto o seletor de certidões.", icone: "📜" },
      { titulo: "4. Selecione as certidões desejadas", texto: "Marque quais certidões deseja emitir: Receita Federal, TRF1, TJDFT, TRT, TST, SEFAZ-DF, ONR.", icone: "☑" },
      { titulo: "5. Dispare a consulta", texto: "Clique em 'Emitir'. O sistema iniciará o navegador automatizado.", icone: "🚀" },
      { titulo: "6. Acompanhe pelo Display Remoto", texto: "Uma nova janela/aba abrirá com o navegador remoto mostrando a consulta em tempo real.", icone: "🖥" },
      { titulo: "7. Resolva CAPTCHAs se necessário", texto: "Se o órgão exigir CAPTCHA, resolva-o no Display Remoto. O sistema continua após a resolução.", icone: "🔐" },
      { titulo: "8. Aguarde a conclusão", texto: "Cada certidão obtida aparece automaticamente no dossiê com status 'Emitida'. O progresso é atualizado em tempo real.", icone: "⏳" },
    ]},
    { tipo: "verde", titulo: "Consultas simultâneas", texto: "O sistema possui um pool de 3 displays que permite executar até 3 consultas ao mesmo tempo em dossiês diferentes. Ideal para alta produtividade." },
    { tipo: "amarelo", titulo: "Importante", texto: "Não feche o Display Remoto durante a consulta. Se precisar interromper, aguarde a finalização da certidão atual." },
  ]),

  "display-remoto": a("display-remoto", "Display Remoto (VNC)", "Acompanhamento em Tempo Real", "Entenda o Display Remoto: como funciona o VNC, como resolver CAPTCHAs e acompanhar as consultas.", "emissao-certidoes", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Display Remoto (VNC)", texto: "O Display Remoto é uma janela que mostra o navegador Chrome rodando no servidor em tempo real. Através dele você acompanha as consultas, resolve CAPTCHAs e verifica o andamento." },
    { tipo: "azul", titulo: "O que você vê no Display Remoto", texto: "• O navegador Chrome acessando o site do órgão oficial\n• Formulários sendo preenchidos automaticamente\n• CAPTCHAs aparecendo para resolução manual\n• PDFs sendo gerados e baixados\n• Navegação entre páginas do órgão" },
    { tipo: "timeline", titulo: "Como usar o Display Remoto", passos: [
      { titulo: "1. O display abre automaticamente", texto: "Ao iniciar uma consulta, o Display Remoto abre em uma nova aba do seu navegador. Não é necessário instalar nada.", icone: "🖥" },
      { titulo: "2. Apenas observe na maioria do tempo", texto: "O sistema preenche formulários e navega sozinho. Você só precisa interagir quando aparece um CAPTCHA.", icone: "👀" },
      { titulo: "3. Resolva CAPTCHAs", texto: "Quando aparecer um CAPTCHA, clique nele e resolva (selecionar imagens, digitar texto, etc.). Após resolvido, o sistema continua.", icone: "🔐" },
      { titulo: "4. Aguarde a conclusão", texto: "Quando a certidão for obtida, o display pode ser fechado. O PDF estará disponível no dossiê.", icone: "✅" },
    ]},
    { tipo: "verde", titulo: "Dica", texto: "Você pode redimensionar a janela do Display Remoto para acompanhar melhor. A resolução é 1920x1080 para máxima compatibilidade com os sites dos órgãos." },
  ]),

  "captcha": a("captcha", "Resolvendo CAPTCHAs", "Verificação Manual", "Guia prático para resolver os diferentes tipos de CAPTCHA que aparecem durante as consultas automatizadas.", "emissao-certidoes", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Resolvendo CAPTCHAs", texto: "Alguns órgãos oficiais utilizam CAPTCHAs para verificação de segurança. A A.CERT detecta automaticamente quando um CAPTCHA aparece e pausa a automação para que você resolva manualmente." },
    { tipo: "area", titulo: "Tipos de CAPTCHA encontrados", itens: [
      "Google reCAPTCHA v2 — 'Não sou um robô' (checkbox simples)",
      "Google reCAPTCHA v2 com imagens — selecionar quadrados com objetos específicos",
      "hCaptcha — similar ao reCAPTCHA, usado por alguns órgãos",
      "CAPTCHA textual — digitar caracteres distorcidos",
      "Cloudflare Turnstile — verificação automática (geralmente não exige ação)",
    ]},
    { tipo: "verde", titulo: "Dica para CAPTCHAs de imagem", texto: "Clique nos quadrados que contêm o objeto pedido (ex: 'semáforos', 'carros'). Se novos quadrados aparecerem, continue clicando até o botão 'Verificar' ficar verde. Não tenha pressa — o sistema aguarda o tempo que for necessário." },
    { tipo: "amarelo", titulo: "Se o CAPTCHA falhar", texto: "Se errar o CAPTCHA, um novo será gerado automaticamente. O sistema tentará novamente. Não é necessário reiniciar a consulta." },
  ]),

  "orgaos-disponiveis": a("orgaos-disponiveis", "Órgãos Disponíveis", "Lista Completa", "Conheça todos os órgãos oficiais integrados à A.CERT e quais certidões cada um fornece.", "emissao-certidoes", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Órgãos Disponíveis", texto: "A A.CERT está integrada com os principais órgãos oficiais brasileiros para emissão de certidões imobiliárias. Cada órgão fornece certidões específicas." },
    { tipo: "area", titulo: "Órgãos integrados e suas certidões", itens: [
      "Receita Federal — Certidão de Débitos Relativos a Créditos Tributários Federais e Dívida Ativa da União",
      "TRF1 (Tribunal Regional Federal da 1ª Região) — Certidão de Ações Cíveis e Criminais",
      "TJDFT (Tribunal de Justiça do DF) — Certidão Especial Cível e Criminal",
      "TRT 10ª Região — Certidão de Ações Trabalhistas",
      "TST (Tribunal Superior do Trabalho) — Certidão de Ações Trabalhistas (abrangência nacional)",
      "SEFAZ-DF — Certidão de Débitos Estaduais do DF",
      "ONR (Operador Nacional de Registro) — Ônus Reais e Ações Reipersecutórias",
    ]},
    { tipo: "azul", titulo: "Status dos órgãos", texto: "O Dashboard mostra o status de cada órgão (Online/Offline) em tempo real. Se um órgão estiver fora do ar, aguarde alguns minutos e tente novamente." },
  ]),

  "trf1": a("trf1", "TRF1 — Tribunal Regional Federal", "Certidão Cível e Criminal", "Detalhes sobre a certidão do TRF1: o que consulta, dados necessários e como interpretar o resultado.", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "TRF1 — Certidão Cível e Criminal", texto: "O Tribunal Regional Federal da 1ª Região (TRF1) abrange 13 estados e o DF. A certidão consulta processos cíveis e criminais na Justiça Federal." },
    { tipo: "area", titulo: "O que a certidão do TRF1 verifica", itens: [
      "Ações cíveis federais em nome da pessoa",
      "Ações criminais federais em nome da pessoa",
      "Execuções fiscais federais",
      "Mandados de segurança",
      "Processos em todas as varas federais da 1ª Região",
    ]},
    { tipo: "area", titulo: "Dados necessários", itens: [
      "Nome completo da pessoa",
      "CPF válido",
      "Nome da mãe (essencial)",
      "Nome do pai",
    ]},
    { tipo: "azul", titulo: "Abrangência", texto: "A 1ª Região da Justiça Federal cobre: DF, AC, AM, AP, BA, GO, MA, MT, PA, PI, RO, RR, TO e MG (parcial)." },
  ]),

  "receita-federal": a("receita-federal", "Receita Federal", "Certidão de Débitos Federais", "Detalhes sobre a Certidão Conjunta da Receita Federal: débitos tributários, dívida ativa e como interpretar.", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Receita Federal — Certidão de Débitos", texto: "A Certidão Conjunta da Receita Federal e Procuradoria-Geral da Fazenda Nacional (PGFN) atesta a situação fiscal da pessoa ou empresa perante a União." },
    { tipo: "area", titulo: "O que a certidão verifica", itens: [
      "Débitos de tributos federais (IRPF, IRPJ, PIS, COFINS, etc.)",
      "Dívida ativa da União",
      "Contribuições previdenciárias",
      "Inscrições no CADIN",
    ]},
    { tipo: "area", titulo: "Resultados possíveis", itens: [
      "Positiva com efeitos de negativa (constam débitos, mas estão suspensos/parcelados)",
      "Negativa (nenhum débito encontrado)",
      "Positiva (débitos ativos — exige regularização)",
    ]},
    { tipo: "verde", titulo: "Validade", texto: "A certidão da Receita Federal tem validade de 180 dias a partir da data de emissão. Para transações imobiliárias, certidões com mais de 60 dias podem não ser aceitas." },
  ]),

  "tjdft": a("tjdft", "TJDFT — Tribunal de Justiça do DF", "Certidão Especial Cível e Criminal", "Certidão do Tribunal de Justiça do Distrito Federal: processos cíveis, criminais e de família.", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "TJDFT — Certidão Especial", texto: "O TJDFT fornece a Certidão Especial Cível e Criminal, essencial para transações imobiliárias no Distrito Federal." },
    { tipo: "area", titulo: "O que a certidão cobre", itens: [
      "Ações cíveis em todas as varas cíveis do DF",
      "Ações criminais — antecedentes criminais estaduais",
      "Ações de família (divórcio, alimentos, guarda)",
      "Execuções fiscais estaduais",
      "Protestos de títulos",
    ]},
    { tipo: "area", titulo: "Dados necessários", itens: [
      "Nome completo",
      "CPF",
      "Nome da mãe",
      "Nome do pai",
    ]},
  ]),

  "trt": a("trt", "TRT — Tribunal Regional do Trabalho", "Certidão Trabalhista", "Certidão de ações trabalhistas do TRT da 10ª Região (DF e TO).", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "TRT 10ª Região — Certidão Trabalhista", texto: "O Tribunal Regional do Trabalho da 10ª Região (DF e Tocantins) emite certidão de ações trabalhistas, essencial para avaliar o passivo trabalhista de pessoas e empresas." },
    { tipo: "area", titulo: "O que a certidão verifica", itens: [
      "Reclamações trabalhistas como reclamante",
      "Reclamações trabalhistas como reclamado",
      "Processos em fase de execução",
      "Acordos trabalhistas homologados",
    ]},
    { tipo: "area", titulo: "Resultados possíveis", itens: [
      "Nada consta (nenhum processo encontrado)",
      "Consta — com detalhamento dos processos ativos",
    ]},
    { tipo: "amarelo", titulo: "Abrangência limitada", texto: "A certidão do TRT 10ª Região cobre apenas processos no DF e Tocantins. Para outros estados, é necessário consultar o TRT da respectiva região." },
  ]),

  "tst": a("tst", "TST — Tribunal Superior do Trabalho", "Certidão Trabalhista Nacional", "Certidão de ações trabalhistas com abrangência nacional emitida pelo TST.", "orgaos-integrados", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "TST — Certidão Trabalhista Nacional", texto: "O Tribunal Superior do Trabalho emite certidão com abrangência nacional, consolidando informações de todos os TRTs do país." },
    { tipo: "area", titulo: "O que a certidão cobre", itens: [
      "Processos em todos os 24 TRTs do Brasil",
      "Ações em fase de conhecimento e execução",
      "Débitos trabalhistas registrados",
      "Certidão negativa ou positiva de débitos trabalhistas",
    ]},
    { tipo: "verde", titulo: "Cobertura nacional", texto: "Diferente do TRT 10ª Região (apenas DF/TO), a certidão do TST tem abrangência nacional, cobrindo processos em qualquer estado brasileiro." },
  ]),

  "gerar-pdf": a("gerar-pdf", "Gerar PDF do Dossiê", "Consolidação de Documentos", "Como gerar o PDF consolidado do dossiê reunindo todas as certidões emitidas em um único arquivo profissional.", "dossies-pdf", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Gerar PDF do Dossiê", texto: "Com todas as certidões emitidas, você pode gerar um PDF consolidado que reúne tudo em um único arquivo profissional — pronto para apresentar ao cliente ou cartório." },
    { tipo: "timeline", titulo: "Como gerar o PDF", passos: [
      { titulo: "1. Verifique as certidões", texto: "Certifique-se de que todas as certidões desejadas estão com status 'Emitida' no dossiê.", icone: "✅" },
      { titulo: "2. Clique em Gerar PDF", texto: "No topo da página do dossiê, clique no botão 'Gerar PDF'.", icone: "📄" },
      { titulo: "3. Aguarde a geração", texto: "O sistema compila todas as certidões em um único PDF. Isso leva alguns segundos.", icone: "⏳" },
      { titulo: "4. Download automático", texto: "O PDF será baixado automaticamente para seu computador. O arquivo inclui capa, índice e todas as certidões.", icone: "📥" },
    ]},
    { tipo: "verde", titulo: "Formato profissional", texto: "O PDF inclui capa personalizada, índice de certidões, cabeçalho e rodapé com numeração de páginas — formato profissional para entrega ao cliente." },
  ]),

  "download-pdf": a("download-pdf", "Download do Dossiê", "Baixar e Compartilhar", "Como baixar o PDF gerado e compartilhar com clientes e cartórios de forma segura.", "dossies-pdf", "iniciante", "3 min", "24/07/2026", [
    { tipo: "hero", titulo: "Download do Dossiê em PDF", texto: "Após gerar o PDF consolidado, você pode baixá-lo, compartilhá-lo e armazená-lo conforme necessário." },
    { tipo: "area", titulo: "Opções de download", itens: [
      "Download automático: ao gerar o PDF, ele baixa instantaneamente",
      "Download manual: o botão de download fica disponível no dossiê após a geração",
      "Download de certidão individual: cada certidão pode ser baixada separadamente",
      "Re-geração: você pode gerar o PDF quantas vezes quiser, com as certidões mais recentes",
    ]},
    { tipo: "azul", titulo: "Segurança", texto: "Todos os PDFs são gerados no servidor e transmitidos via HTTPS. Os arquivos não ficam acessíveis publicamente." },
  ]),

  "relatorio-certidoes": a("relatorio-certidoes", "Relatório de Certidões", "Estatísticas de Emissão", "Gere relatórios detalhados de certidões emitidas com filtros por período, órgão e status.", "relatorios", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Relatório de Certidões", texto: "Acompanhe todas as certidões emitidas em um período, com detalhes de cada emissão e indicadores de performance." },
    { tipo: "area", titulo: "Informações do relatório", itens: [
      "Total de certidões emitidas no período",
      "Distribuição por órgão",
      "Distribuição por status (Emitida, Pendente)",
      "Tempo médio de emissão",
      "Taxa de sucesso por órgão",
      "Exportação em Excel e PDF",
    ]},
    { tipo: "timeline", titulo: "Como gerar", passos: [
      { titulo: "1. Acesse Relatórios", texto: "No menu lateral, clique em Relatórios.", icone: "📊" },
      { titulo: "2. Selecione o período", texto: "Escolha o intervalo de datas desejado.", icone: "📅" },
      { titulo: "3. Aplique filtros opcionais", texto: "Filtre por órgão específico ou status.", icone: "🔍" },
      { titulo: "4. Exporte", texto: "Clique em Exportar Excel ou Exportar PDF.", icone: "📥" },
    ]},
  ]),

  "relatorio-produtividade": a("relatorio-produtividade", "Relatório de Produtividade", "Desempenho da Equipe", "Monitore a produtividade da sua equipe com relatórios de dossiês criados, certidões emitidas e tempo médio por usuário.", "relatorios", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Relatório de Produtividade", texto: "Acompanhe o desempenho de cada membro da equipe: quantos dossiês criou, quantas certidões emitiu e tempo médio de conclusão." },
    { tipo: "area", titulo: "Métricas por usuário", itens: [
      "Dossiês criados no período",
      "Dossiês concluídos",
      "Certidões emitidas",
      "Tempo médio por certidão",
      "Taxa de conclusão",
      "Comparativo com período anterior",
    ]},
    { tipo: "verde", titulo: "Exportação", texto: "O relatório de produtividade pode ser exportado em Excel para análises mais detalhadas ou apresentações." },
  ]),

  "convite-usuario": a("convite-usuario", "Convidar Usuário", "Adicionar Membros à Equipe", "Como convidar novos usuários para a plataforma, definir cargos e permissões iniciais.", "usuarios-empresas", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Convidar Usuário", texto: "Adicione membros da sua equipe à plataforma A.CERT. Cada usuário recebe um acesso personalizado com permissões configuráveis." },
    { tipo: "timeline", titulo: "Como convidar", passos: [
      { titulo: "1. Acesse Usuários", texto: "No menu lateral em SISTEMA, clique em Usuários.", icone: "👥" },
      { titulo: "2. Clique em Novo Usuário", texto: "No canto superior direito, clique no botão 'Novo Usuário'.", icone: "➕" },
      { titulo: "3. Preencha os dados", texto: "Nome, email, cargo (Administrador, Vendedor, Colaborador, Supervisor, RH, Desenvolvedor), departamento e carga horária.", icone: "📝" },
      { titulo: "4. Envie o convite", texto: "O usuário receberá um email com link para definir a senha e acessar o sistema.", icone: "📧" },
    ]},
  ]),

  "permissoes": a("permissoes", "Permissões", "Controle de Acesso Granular", "Gerencie permissões detalhadas de cada usuário: o que pode ver, criar, editar e excluir.", "usuarios-empresas", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Gerenciamento de Permissões", texto: "Controle exatamente o que cada usuário pode fazer no sistema. As permissões são granulares e organizadas por módulo." },
    { tipo: "area", titulo: "Módulos de permissão", itens: [
      "Dossiês — Criar, Editar, Excluir",
      "Pessoas — Criar, Editar, Excluir",
      "Imóveis — Criar, Editar, Excluir",
      "Certidões — Emitir, Download, Exportar",
      "Relatórios — Visualizar, Exportar",
      "Sistema — Gerenciar usuários, Configurações, Ver logs",
    ]},
    { tipo: "timeline", titulo: "Como alterar permissões", passos: [
      { titulo: "1. Acesse o perfil do usuário", texto: "Na lista de Usuários, clique no ícone de olho (👁) para abrir o painel lateral.", icone: "👤" },
      { titulo: "2. Vá para a aba Permissões", texto: "No painel lateral, selecione a aba 'Permissões'.", icone: "🔐" },
      { titulo: "3. Marque/desmarque", texto: "Ative ou desative cada permissão conforme necessário.", icone: "☑" },
      { titulo: "4. Salve", texto: "As alterações entram em vigor imediatamente.", icone: "💾" },
    ]},
  ]),

  "dados-empresa": a("dados-empresa", "Dados da Empresa", "Configuração Corporativa", "Configure os dados da sua empresa: razão social, CNPJ, logo e informações que aparecem nos PDFs gerados.", "usuarios-empresas", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Dados da Empresa", texto: "Configure as informações da sua empresa que aparecerão nos PDFs gerados, na capa dos dossiês e nos relatórios." },
    { tipo: "area", titulo: "Dados configuráveis", itens: [
      "Razão social / Nome fantasia",
      "CNPJ",
      "Logo (aparece na capa dos PDFs)",
      "Endereço e telefone de contato",
      "Site e email institucional",
    ]},
    { tipo: "azul", titulo: "Logo nos PDFs", texto: "A logo da empresa aparece na capa de todos os PDFs gerados. Use uma imagem PNG com fundo transparente para melhor resultado. Tamanho recomendado: 400x200px." },
  ]),

  "config-geral": a("config-geral", "Configurações Gerais", "Personalização do Sistema", "Ajuste as configurações gerais: tema, idioma, formato de data, notificações e preferências de exibição.", "configuracoes", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Configurações Gerais", texto: "Personalize a A.CERT conforme suas preferências. Ajuste o tema (claro/escuro/sistema), idioma, formato de data e muito mais." },
    { tipo: "area", titulo: "Opções de personalização", itens: [
      "Tema: Claro, Escuro ou Automático (segue o sistema)",
      "Idioma: Português, Inglês, Espanhol, Italiano, Japonês, Coreano, Chinês",
      "Formato de data: DD/MM/AAAA ou MM/DD/AAAA",
      "Fuso horário: América/São Paulo (padrão)",
      "Notificações do sistema: ativar/desativar alertas",
      "Notificações por email: receber atualizações por email",
    ]},
    { tipo: "verde", titulo: "Sincronização", texto: "Suas preferências são salvas na nuvem e sincronizadas em todos os dispositivos onde você acessar a A.CERT." },
  ]),

  "templates-pdf": a("templates-pdf", "Templates de PDF", "Personalização de Documentos", "Personalize os templates dos PDFs gerados: capa, cabeçalho, rodapé e formatação.", "configuracoes", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Templates de PDF", texto: "Configure a aparência dos PDFs gerados pela A.CERT para que reflitam a identidade visual da sua empresa." },
    { tipo: "area", titulo: "Elementos personalizáveis", itens: [
      "Capa: logo, título, subtítulo, data",
      "Cabeçalho: nome da empresa, logo pequena",
      "Rodapé: numeração de página, site, telefone",
      "Cores: cor primária dos elementos",
      "Fonte: família tipográfica",
    ]},
  ]),

  "backup": a("backup", "Backup e Restauração", "Segurança de Dados", "Como funciona o backup automático dos seus dados e como restaurar informações em caso de necessidade.", "configuracoes", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Backup e Restauração", texto: "Seus dados na A.CERT são armazenados com segurança em servidores com backup automático diário. Saiba como funciona." },
    { tipo: "area", titulo: "Política de backup", itens: [
      "Backup automático diário de todo o banco de dados",
      "Retenção de 30 dias de backups",
      "Dados criptografados em trânsito e em repouso",
      "Possibilidade de exportar seus dados a qualquer momento",
    ]},
    { tipo: "verde", titulo: "Tranquilidade", texto: "Você não precisa se preocupar com perda de dados. O backup é automático e gerenciado pela A.CERT. Para exportações manuais, use os relatórios em Excel." },
  ]),

  "lixeira": a("lixeira", "Lixeira", "Recuperação de Itens", "Entenda como funciona a lixeira da A.CERT: itens excluídos vão para lá e podem ser restaurados em até 30 dias.", "lixeira-recuperacao", "iniciante", "3 min", "24/07/2026", [
    { tipo: "hero", titulo: "Lixeira", texto: "A lixeira da A.CERT é um recurso de segurança. Tudo que é excluído vai primeiro para a lixeira, onde pode ser restaurado. Nada é perdido acidentalmente." },
    { tipo: "area", titulo: "O que vai para a lixeira", itens: [
      "Dossiês excluídos",
      "Pessoas removidas",
      "Imóveis excluídos",
      "Documentos apagados",
      "Usuários desativados",
    ]},
    { tipo: "area", titulo: "Regras da lixeira", itens: [
      "Itens permanecem na lixeira por 30 dias",
      "Após 30 dias, são excluídos permanentemente",
      "Restaurar um item o devolve exatamente como estava",
      "A exclusão permanente é irreversível",
    ]},
  ]),

  "restaurar-item": a("restaurar-item", "Restaurar Item", "Recuperação de Dados", "Passo a passo para restaurar qualquer item da lixeira: dossiês, pessoas, imóveis e documentos.", "lixeira-recuperacao", "iniciante", "3 min", "24/07/2026", [
    { tipo: "hero", titulo: "Restaurar Item da Lixeira", texto: "Recuperar itens excluídos é simples e rápido. Em poucos cliques, tudo volta ao normal." },
    { tipo: "timeline", titulo: "Como restaurar", passos: [
      { titulo: "1. Acesse a Lixeira", texto: "No menu lateral em SISTEMA, clique em Lixeira.", icone: "🗑" },
      { titulo: "2. Localize o item", texto: "Use a busca ou navegue pela lista de itens excluídos.", icone: "🔍" },
      { titulo: "3. Clique em Restaurar", texto: "Ao lado do item, clique no botão 'Restaurar'.", icone: "♻" },
      { titulo: "4. Confirme", texto: "O item volta para sua seção original com todos os dados preservados.", icone: "✅" },
    ]},
  ]),

  "excluir-permanente": a("excluir-permanente", "Excluir Permanentemente", "Remoção Definitiva", "Como excluir itens permanentemente da lixeira quando não forem mais necessários.", "lixeira-recuperacao", "iniciante", "3 min", "24/07/2026", [
    { tipo: "hero", titulo: "Excluir Permanentemente", texto: "Se você tem certeza de que um item não será mais necessário, pode removê-lo definitivamente da lixeira." },
    { tipo: "timeline", titulo: "Como excluir permanentemente", passos: [
      { titulo: "1. Acesse a Lixeira", texto: "No menu lateral em SISTEMA, clique em Lixeira.", icone: "🗑" },
      { titulo: "2. Selecione o item", texto: "Encontre o item que deseja remover definitivamente.", icone: "🔍" },
      { titulo: "3. Excluir permanentemente", texto: "Clique no botão 'Excluir permanentemente'.", icone: "❌" },
      { titulo: "4. Confirme a ação", texto: "Esta ação é irreversível. Confirme apenas se tiver certeza.", icone: "⚠" },
    ]},
    { tipo: "amarelo", titulo: "Cuidado", texto: "A exclusão permanente é IRREVERSÍVEL. Todos os dados do item, incluindo certidões, documentos anexados e histórico, serão perdidos para sempre. Recomendamos manter os itens na lixeira pelos 30 dias antes de excluir permanentemente." },
  ]),

  "bem-vindo-a-acert": a("bem-vindo-a-acert", "Bem-vindo à A.CERT", "Visão Geral da Plataforma", "Conheça tudo sobre a A.CERT, seus recursos principais e como ela vai transformar sua rotina de certidões imobiliárias.", "primeiros-passos", "iniciante", "5 min", "24/07/2026", [
    { tipo: "hero", titulo: "Bem-vindo à A.CERT", texto: "A A.CERT é a plataforma mais completa do mercado para emissão automatizada de certidões imobiliárias. Conectada a 7+ órgãos oficiais, ela elimina horas de trabalho manual, reduz erros e centraliza toda a documentação em um só lugar." },
    { tipo: "azul", titulo: "O que a A.CERT faz por você", texto: "Automatiza a consulta e emissão de certidões em órgãos como Receita Federal, TRF1, TJDFT, TRT, TST, SEFAZ-DF e ONR. Basta cadastrar a pessoa e o imóvel, criar um dossiê e disparar as consultas — o sistema navega nos sites oficiais, preenche formulários, resolve CAPTCHAs com sua ajuda via Display Remoto e baixa os PDFs automaticamente." },
    { tipo: "verde", titulo: "Principais benefícios", texto: "• Redução de 90% do tempo gasto com consultas manuais\n• Diminuição de erros de digitação e esquecimentos\n• Centralização de todos os documentos em dossiês organizados\n• Geração automática de PDF consolidado\n• Acompanhamento em tempo real pelo Display Remoto (VNC)\n• Múltiplas consultas simultâneas com o pool de displays\n• Relatórios de produtividade para gestão da equipe\n• Lixeira com recuperação para evitar perda acidental de dados" },
    { tipo: "timeline", titulo: "Como começar", passos: [
      { titulo: "1. Faça seu cadastro", texto: "Acesse a tela de cadastro e preencha seus dados. Você receberá um email de confirmação.", icone: "🚀" },
      { titulo: "2. Confirme seu email", texto: "Clique no link enviado para seu email para ativar sua conta.", icone: "✅" },
      { titulo: "3. Faça login", texto: "Use seu email e senha para acessar o Dashboard.", icone: "🔐" },
      { titulo: "4. Cadastre sua primeira Pessoa", texto: "Na seção Pessoas, cadastre um cliente com CPF, nome e dados.", icone: "👤" },
      { titulo: "5. Cadastre um Imóvel", texto: "Na seção Imóveis, cadastre a matrícula e endereço do imóvel.", icone: "🏢" },
      { titulo: "6. Crie um Dossiê", texto: "Vincule pessoa e imóvel em um dossiê e dispare as consultas.", icone: "📂" },
    ]},
    { tipo: "problemas", titulo: "Dúvidas comuns", problemas: [
      { q: "A A.CERT substitui completamente as consultas manuais?", a: "Sim! Para os 7 órgãos integrados, a A.CERT automatiza todo o processo. Apenas CAPTCHAs precisam de interação manual." },
      { q: "Preciso instalar algum programa?", a: "Não. A A.CERT é 100% web. Basta um navegador moderno (Chrome, Edge ou Firefox)." },
      { q: "Posso acessar do celular?", a: "Sim, a interface é responsiva e funciona em smartphones e tablets, embora a experiência completa seja melhor no desktop." },
    ]},
    { tipo: "etapa", titulo: "Precisa de ajuda?", texto: "Se tiver qualquer dúvida, nossa equipe de suporte está pronta para ajudar. Abra um chamado na Central de Ajuda.", icone: "💬" },
  ]),
};
