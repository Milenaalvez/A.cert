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

export const artigosDetalhes: Record<string, { titulo: string; slug: string; categoria: string; nivel: string; tempo: string; conteudo: string }> = {
  "bem-vindo-a-acert": { slug: "bem-vindo-a-acert", titulo: "Bem-vindo à A.CERT", categoria: "primeiros-passos", nivel: "iniciante", tempo: "5 min", conteudo: "A A.CERT é uma plataforma para emissão automatizada de certidões imobiliárias junto a órgãos oficiais." },
  "primeiro-acesso": { slug: "primeiro-acesso", titulo: "Primeiro Acesso", categoria: "primeiros-passos", nivel: "iniciante", tempo: "5 min", conteudo: "Guia de primeiro acesso ao sistema A.CERT." },
  "conhecendo-dashboard": { slug: "conhecendo-dashboard", titulo: "Conhecendo o Dashboard", categoria: "primeiros-passos", nivel: "iniciante", tempo: "5 min", conteudo: "Visão geral do dashboard e seus componentes." },
  "navegando-sistema": { slug: "navegando-sistema", titulo: "Navegando pelo Sistema", categoria: "primeiros-passos", nivel: "iniciante", tempo: "5 min", conteudo: "Como navegar entre as seções do sistema." },
  "fluxo-completo": { slug: "fluxo-completo", titulo: "Fluxo Completo de Consulta", categoria: "primeiros-passos", nivel: "iniciante", tempo: "10 min", conteudo: "Passo a passo completo para realizar uma consulta e emitir certidões." },
  "o-que-e-dossie": { slug: "o-que-e-dossie", titulo: "O que é um Dossiê", categoria: "dossies", nivel: "iniciante", tempo: "5 min", conteudo: "Entenda o conceito de dossiê imobiliário na A.CERT." },
  "criando-dossie": { slug: "criando-dossie", titulo: "Criando um Dossiê", categoria: "dossies", nivel: "iniciante", tempo: "10 min", conteudo: "Como criar e configurar um novo dossiê." },
  "editando-dossie": { slug: "editando-dossie", titulo: "Editando um Dossiê", categoria: "dossies", nivel: "intermediario", tempo: "5 min", conteudo: "Como editar informações de um dossiê existente." },
  "status-dossie": { slug: "status-dossie", titulo: "Status do Dossiê", categoria: "dossies", nivel: "iniciante", tempo: "5 min", conteudo: "Entenda os diferentes status de um dossiê." },
  "excluindo-dossie": { slug: "excluindo-dossie", titulo: "Excluindo um Dossiê", categoria: "dossies", nivel: "intermediario", tempo: "3 min", conteudo: "Como excluir um dossiê e recuperar da lixeira." },
  "cadastro-pessoa": { slug: "cadastro-pessoa", titulo: "Cadastro de Pessoa", categoria: "pessoas", nivel: "iniciante", tempo: "5 min", conteudo: "Como cadastrar uma pessoa física ou jurídica." },
  "vinculos-parentais": { slug: "vinculos-parentais", titulo: "Vínculos Parentais", categoria: "pessoas", nivel: "intermediario", tempo: "5 min", conteudo: "Como configurar vínculos parentais entre pessoas." },
  "busca-pessoa": { slug: "busca-pessoa", titulo: "Busca de Pessoa", categoria: "pessoas", nivel: "iniciante", tempo: "3 min", conteudo: "Como buscar pessoas cadastradas no sistema." },
  "como-emitir": { slug: "como-emitir", titulo: "Como Emitir Certidões", categoria: "emissao-certidoes", nivel: "intermediario", tempo: "10 min", conteudo: "Passo a passo para emitir certidões nos órgãos oficiais." },
  "display-remoto": { slug: "display-remoto", titulo: "Display Remoto (VNC)", categoria: "emissao-certidoes", nivel: "intermediario", tempo: "5 min", conteudo: "O display remoto mostra o navegador Chrome em tempo real durante a emissão de certidões. Use-o para resolver CAPTCHAs e acompanhar o processo." },
  "captcha": { slug: "captcha", titulo: "Resolvendo CAPTCHAs", categoria: "emissao-certidoes", nivel: "intermediario", tempo: "5 min", conteudo: "Alguns órgãos exigem CAPTCHA. Use o display remoto para resolvê-los manualmente." },
  "orgaos-disponiveis": { slug: "orgaos-disponiveis", titulo: "Órgãos Disponíveis", categoria: "emissao-certidoes", nivel: "intermediario", tempo: "5 min", conteudo: "Lista completa dos órgãos integrados e suas particularidades." },
  "trf1": { slug: "trf1", titulo: "TRF1", categoria: "orgaos-integrados", nivel: "intermediario", tempo: "5 min", conteudo: "Certidão de Ações Cíveis e Criminais do TRF1." },
  "receita-federal": { slug: "receita-federal", titulo: "Receita Federal", categoria: "orgaos-integrados", nivel: "intermediario", tempo: "5 min", conteudo: "Certidão de Débitos da Receita Federal." },
  "tjdft": { slug: "tjdft", titulo: "TJDFT", categoria: "orgaos-integrados", nivel: "intermediario", tempo: "5 min", conteudo: "Certidão Especial Cível e Criminal do TJDFT." },
  "trt": { slug: "trt", titulo: "TRT", categoria: "orgaos-integrados", nivel: "intermediario", tempo: "5 min", conteudo: "Certidão Trabalhista do TRT 10ª Região." },
  "tst": { slug: "tst", titulo: "TST", categoria: "orgaos-integrados", nivel: "intermediario", tempo: "5 min", conteudo: "Certidão Trabalhista do TST." },
  "gerar-pdf": { slug: "gerar-pdf", titulo: "Gerar PDF do Dossiê", categoria: "dossies-pdf", nivel: "intermediario", tempo: "5 min", conteudo: "Como gerar o PDF consolidado do dossiê." },
  "download-pdf": { slug: "download-pdf", titulo: "Download do Dossiê", categoria: "dossies-pdf", nivel: "intermediario", tempo: "3 min", conteudo: "Como fazer download do dossiê em PDF." },
  "relatorio-certidoes": { slug: "relatorio-certidoes", titulo: "Relatório de Certidões", categoria: "relatorios", nivel: "intermediario", tempo: "5 min", conteudo: "Relatório com estatísticas das certidões emitidas." },
  "relatorio-produtividade": { slug: "relatorio-produtividade", titulo: "Relatório de Produtividade", categoria: "relatorios", nivel: "intermediario", tempo: "5 min", conteudo: "Relatório de produtividade da equipe." },
  "convite-usuario": { slug: "convite-usuario", titulo: "Convidar Usuário", categoria: "usuarios-empresas", nivel: "avancado", tempo: "5 min", conteudo: "Como convidar novos usuários para a plataforma." },
  "permissoes": { slug: "permissoes", titulo: "Permissões", categoria: "usuarios-empresas", nivel: "avancado", tempo: "5 min", conteudo: "Gerenciamento de permissões de usuários." },
  "dados-empresa": { slug: "dados-empresa", titulo: "Dados da Empresa", categoria: "usuarios-empresas", nivel: "avancado", tempo: "5 min", conteudo: "Configuração dos dados da empresa." },
  "config-geral": { slug: "config-geral", titulo: "Configurações Gerais", categoria: "configuracoes", nivel: "avancado", tempo: "5 min", conteudo: "Configurações gerais da plataforma." },
  "templates-pdf": { slug: "templates-pdf", titulo: "Templates de PDF", categoria: "configuracoes", nivel: "avancado", tempo: "5 min", conteudo: "Personalização dos templates de PDF." },
  "backup": { slug: "backup", titulo: "Backup e Restauração", categoria: "configuracoes", nivel: "avancado", tempo: "5 min", conteudo: "Como fazer backup e restaurar dados." },
  "lixeira": { slug: "lixeira", titulo: "Lixeira", categoria: "lixeira-recuperacao", nivel: "iniciante", tempo: "3 min", conteudo: "Como funciona a lixeira do sistema." },
  "restaurar-item": { slug: "restaurar-item", titulo: "Restaurar Item", categoria: "lixeira-recuperacao", nivel: "iniciante", tempo: "3 min", conteudo: "Como restaurar itens da lixeira." },
  "excluir-permanente": { slug: "excluir-permanente", titulo: "Excluir Permanentemente", categoria: "lixeira-recuperacao", nivel: "intermediario", tempo: "3 min", conteudo: "Como excluir itens permanentemente." },
};
