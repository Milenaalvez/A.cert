"use client";

import "driver.js/dist/driver.css";

const TOUR_PAGINAS = [
  {
    page: "dashboard",
    titulo: "Dashboard",
    steps: [
      { element: "[data-tour='menu-lateral']", title: "Menu lateral", description: "Todo o conteúdo da A.CERT está organizado aqui. Acesse Dossiês, Pessoas, Certidões e muito mais pela barra lateral." },
      { element: "[data-tour='btn-novo-dossie']", title: "Novo Dossiê", description: "Clique aqui para criar sua primeira negociação imobiliária. Tudo começa com um dossiê." },
      { element: "[data-tour='dashboard-stats']", title: "Indicadores", description: "Acompanhe suas métricas em tempo real: dossiês criados, certidões emitidas e taxa de conclusão." },
      { element: "[data-tour='sidebar-perfil']", title: "Seu perfil", description: "Acesse seus dados, altere sua senha, veja notificações e gerencie sua conta." },
    ],
  },
  {
    page: "pessoas",
    titulo: "Pessoas",
    steps: [
      { element: "[data-tour='pessoas-lista']", title: "Lista de pessoas", description: "Aqui ficam todas as pessoas cadastradas: clientes, proprietários, compradores e vendedores." },
      { element: "[data-tour='pessoas-busca']", title: "Barra de busca", description: "Encontre rapidamente qualquer pessoa pelo nome, CPF, email ou telefone." },
      { element: "[data-tour='pessoas-nova']", title: "Nova Pessoa", description: "Clique aqui para cadastrar uma nova pessoa. Quanto mais completo o cadastro, maior a taxa de acerto nas consultas." },
    ],
  },
  {
    page: "certidoes",
    titulo: "Certidões",
    steps: [
      { element: "[data-tour='certidoes-busca']", title: "Buscar pessoa", description: "Busque e selecione a pessoa para quem você deseja emitir as certidões." },
      { element: "[data-tour='certidoes-orgaos']", title: "Órgãos disponíveis", description: "Marque os órgãos desejados: Receita Federal, TRF1, TJDFT, TRT, TST, SEFAZ-DF e ONR." },
      { element: "[data-tour='certidoes-consultar']", title: "Iniciar consulta", description: "Clique em Buscar para iniciar a consulta automática. O sistema navegará pelos sites oficiais e capturará os documentos." },
    ],
  },
  {
    page: "dossies",
    titulo: "Dossiês",
    steps: [
      { element: "[data-tour='dossies-lista']", title: "Lista de dossiês", description: "Todos os seus dossiês aparecem aqui. Acompanhe o status de cada negociação." },
      { element: "[data-tour='dossies-novo']", title: "Novo Dossiê", description: "Inicie uma nova negociação imobiliária. Defina o tipo de transação, imóvel e participantes." },
    ],
  },
  {
    page: "suporte",
    titulo: "Central de Ajuda",
    steps: [
      { element: "[data-tour='central-ajuda']", title: "Central de Ajuda", description: "A documentação completa está sempre disponível. Encontre guias, tutoriais e abra chamados de suporte." },
      { element: "[data-tour='suporte-ticket']", title: "Abrir chamado", description: "Precisa de ajuda? Clique aqui para enviar um ticket diretamente para nossa equipe de suporte." },
    ],
  },
];

const PAGINAS_URL: Record<string, string> = {
  dashboard: "/dashboard",
  pessoas: "/dashboard/pessoas",
  certidoes: "/dashboard/certidoes",
  dossies: "/dashboard/dossies",
  suporte: "/dashboard/suporte",
};

export function iniciarTour() {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname;

  // If not on tour, redirect to first page
  if (!window.location.search.includes("tour=1")) {
    window.location.href = "/dashboard?tour=1";
    return;
  }

  // Find current page index
  let currentIndex = 0;
  for (let i = 0; i < TOUR_PAGINAS.length; i++) {
    if (currentPath.includes(TOUR_PAGINAS[i].page)) {
      currentIndex = i;
      break;
    }
  }

  const pagina = TOUR_PAGINAS[currentIndex];
  if (!pagina) return;

  import("driver.js").then(({ driver }) => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: "driverjs-theme",
      steps: pagina.steps.map((s, i) => ({
        element: s.element,
        popover: {
          title: `${pagina.titulo} — passo ${i + 1} de ${pagina.steps.length}`,
          description: s.description,
          side: i === 0 ? "right" : "bottom",
          align: "start",
        },
      })),
      onDestroyed: () => {
        // Navigate to next page
        const nextIndex = currentIndex + 1;
        if (nextIndex < TOUR_PAGINAS.length) {
          const nextUrl = PAGINAS_URL[TOUR_PAGINAS[nextIndex].page];
          if (nextUrl) {
            window.location.href = `${nextUrl}?tour=1`;
          }
        }
      },
    });
    driverObj.drive();
  }).catch(err => console.error("[Tour] Erro:", err));
}
