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
  "bem-vindo-a-acert": a("bem-vindo-a-acert", "Bem-vindo à A.CERT", "Introdução", "Conheça a plataforma A.CERT e seus recursos.", "primeiros-passos", "iniciante", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Bem-vindo", texto: "A A.CERT é uma plataforma para emissão automatizada de certidões imobiliárias junto a órgãos oficiais." }]),
  "primeiro-acesso": a("primeiro-acesso", "Primeiro Acesso", "Começando", "Como acessar o sistema pela primeira vez.", "primeiros-passos", "iniciante", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Acessando", texto: "Guia de primeiro acesso ao sistema A.CERT." }]),
  "conhecendo-dashboard": a("conhecendo-dashboard", "Conhecendo o Dashboard", "Visão Geral", "Explore o painel principal do sistema.", "primeiros-passos", "iniciante", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Dashboard", texto: "Visão geral do dashboard e seus componentes." }]),
  "navegando-sistema": a("navegando-sistema", "Navegando pelo Sistema", "Navegação", "Aprenda a navegar entre as seções.", "primeiros-passos", "iniciante", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Navegação", texto: "Como navegar entre as seções do sistema." }]),
  "fluxo-completo": a("fluxo-completo", "Fluxo Completo de Consulta", "Passo a Passo", "Do início ao fim de uma consulta.", "primeiros-passos", "iniciante", "10 min", "15/07/2026", [{ tipo: "hero", titulo: "Fluxo", texto: "Passo a passo completo para realizar uma consulta e emitir certidões." }]),
  "o-que-e-dossie": a("o-que-e-dossie", "O que é um Dossiê", "Conceitos", "Entenda o que é um dossiê imobiliário.", "dossies", "iniciante", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Dossiê", texto: "Entenda o conceito de dossiê imobiliário na A.CERT." }]),
  "criando-dossie": a("criando-dossie", "Criando um Dossiê", "Criação", "Como criar um novo dossiê.", "dossies", "iniciante", "10 min", "15/07/2026", [{ tipo: "hero", titulo: "Criação", texto: "Como criar e configurar um novo dossiê." }]),
  "editando-dossie": a("editando-dossie", "Editando um Dossiê", "Edição", "Como editar um dossiê existente.", "dossies", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Edição", texto: "Como editar informações de um dossiê existente." }]),
  "status-dossie": a("status-dossie", "Status do Dossiê", "Status", "Entenda os status de um dossiê.", "dossies", "iniciante", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Status", texto: "Entenda os diferentes status de um dossiê." }]),
  "excluindo-dossie": a("excluindo-dossie", "Excluindo um Dossiê", "Exclusão", "Como remover um dossiê.", "dossies", "intermediario", "3 min", "15/07/2026", [{ tipo: "hero", titulo: "Exclusão", texto: "Como excluir um dossiê e recuperar da lixeira." }]),
  "cadastro-pessoa": a("cadastro-pessoa", "Cadastro de Pessoa", "Cadastro", "Cadastre pessoas físicas e jurídicas.", "pessoas", "iniciante", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Cadastro", texto: "Como cadastrar uma pessoa física ou jurídica." }]),
  "vinculos-parentais": a("vinculos-parentais", "Vínculos Parentais", "Vínculos", "Configure vínculos familiares.", "pessoas", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Vínculos", texto: "Como configurar vínculos parentais entre pessoas." }]),
  "busca-pessoa": a("busca-pessoa", "Busca de Pessoa", "Busca", "Encontre pessoas cadastradas.", "pessoas", "iniciante", "3 min", "15/07/2026", [{ tipo: "hero", titulo: "Busca", texto: "Como buscar pessoas cadastradas no sistema." }]),
  "como-emitir": a("como-emitir", "Como Emitir Certidões", "Emissão", "Passo a passo da emissão de certidões.", "emissao-certidoes", "intermediario", "10 min", "15/07/2026", [{ tipo: "hero", titulo: "Emissão", texto: "Passo a passo para emitir certidões nos órgãos oficiais." }]),
  "display-remoto": a("display-remoto", "Display Remoto (VNC)", "VNC", "Use o display remoto para acompanhar as consultas.", "emissao-certidoes", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Display Remoto", texto: "O display remoto mostra o navegador Chrome em tempo real durante a emissão de certidões. Use-o para resolver CAPTCHAs e acompanhar o processo." }]),
  "captcha": a("captcha", "Resolvendo CAPTCHAs", "CAPTCHA", "Como resolver CAPTCHAs dos órgãos.", "emissao-certidoes", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "CAPTCHA", texto: "Alguns órgãos exigem CAPTCHA. Use o display remoto para resolvê-los manualmente." }]),
  "orgaos-disponiveis": a("orgaos-disponiveis", "Órgãos Disponíveis", "Órgãos", "Lista dos órgãos integrados.", "emissao-certidoes", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Órgãos", texto: "Lista completa dos órgãos integrados e suas particularidades." }]),
  "trf1": a("trf1", "TRF1", "Certidão Cível e Criminal", "Tribunal Regional Federal da 1ª Região.", "orgaos-integrados", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "TRF1", texto: "Certidão de Ações Cíveis e Criminais do TRF1." }]),
  "receita-federal": a("receita-federal", "Receita Federal", "Certidão de Débitos", "Certidão da Receita Federal.", "orgaos-integrados", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "RF", texto: "Certidão de Débitos da Receita Federal." }]),
  "tjdft": a("tjdft", "TJDFT", "Certidão Especial", "Tribunal de Justiça do DF.", "orgaos-integrados", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "TJDFT", texto: "Certidão Especial Cível e Criminal do TJDFT." }]),
  "trt": a("trt", "TRT", "Certidão Trabalhista", "Tribunal Regional do Trabalho.", "orgaos-integrados", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "TRT", texto: "Certidão Trabalhista do TRT 10ª Região." }]),
  "tst": a("tst", "TST", "Certidão Trabalhista", "Tribunal Superior do Trabalho.", "orgaos-integrados", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "TST", texto: "Certidão Trabalhista do TST." }]),
  "gerar-pdf": a("gerar-pdf", "Gerar PDF do Dossiê", "PDF", "Gere o dossiê consolidado em PDF.", "dossies-pdf", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "PDF", texto: "Como gerar o PDF consolidado do dossiê." }]),
  "download-pdf": a("download-pdf", "Download do Dossiê", "Download", "Baixe o dossiê em PDF.", "dossies-pdf", "intermediario", "3 min", "15/07/2026", [{ tipo: "hero", titulo: "Download", texto: "Como fazer download do dossiê em PDF." }]),
  "relatorio-certidoes": a("relatorio-certidoes", "Relatório de Certidões", "Estatísticas", "Relatório de certidões emitidas.", "relatorios", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Relatório", texto: "Relatório com estatísticas das certidões emitidas." }]),
  "relatorio-produtividade": a("relatorio-produtividade", "Relatório de Produtividade", "Produtividade", "Relatório de produtividade.", "relatorios", "intermediario", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Produtividade", texto: "Relatório de produtividade da equipe." }]),
  "convite-usuario": a("convite-usuario", "Convidar Usuário", "Convite", "Convide novos usuários.", "usuarios-empresas", "avancado", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Convite", texto: "Como convidar novos usuários para a plataforma." }]),
  "permissoes": a("permissoes", "Permissões", "Permissões", "Gerencie permissões de usuários.", "usuarios-empresas", "avancado", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Permissões", texto: "Gerenciamento de permissões de usuários." }]),
  "dados-empresa": a("dados-empresa", "Dados da Empresa", "Empresa", "Configure os dados da empresa.", "usuarios-empresas", "avancado", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Empresa", texto: "Configuração dos dados da empresa." }]),
  "config-geral": a("config-geral", "Configurações Gerais", "Configurações", "Ajustes gerais do sistema.", "configuracoes", "avancado", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Config", texto: "Configurações gerais da plataforma." }]),
  "templates-pdf": a("templates-pdf", "Templates de PDF", "Templates", "Personalize os templates de PDF.", "configuracoes", "avancado", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Templates", texto: "Personalização dos templates de PDF." }]),
  "backup": a("backup", "Backup e Restauração", "Backup", "Faça backup dos seus dados.", "configuracoes", "avancado", "5 min", "15/07/2026", [{ tipo: "hero", titulo: "Backup", texto: "Como fazer backup e restaurar dados." }]),
  "lixeira": a("lixeira", "Lixeira", "Lixeira", "Gerencie itens excluídos.", "lixeira-recuperacao", "iniciante", "3 min", "15/07/2026", [{ tipo: "hero", titulo: "Lixeira", texto: "Como funciona a lixeira do sistema." }]),
  "restaurar-item": a("restaurar-item", "Restaurar Item", "Restauração", "Recupere itens excluídos.", "lixeira-recuperacao", "iniciante", "3 min", "15/07/2026", [{ tipo: "hero", titulo: "Restauração", texto: "Como restaurar itens da lixeira." }]),
  "excluir-permanente": a("excluir-permanente", "Excluir Permanentemente", "Exclusão", "Remova itens definitivamente.", "lixeira-recuperacao", "intermediario", "3 min", "15/07/2026", [{ tipo: "hero", titulo: "Exclusão", texto: "Como excluir itens permanentemente." }]),
};
