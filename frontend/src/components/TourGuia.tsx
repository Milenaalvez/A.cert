"use client";

import "driver.js/dist/driver.css";

interface TourStep {
  element: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    element: "[data-tour='menu-lateral']",
    title: "Menu lateral",
    description: "Todo o conteúdo da A.CERT está organizado aqui. Acesse Dossiês, Pessoas, Certidões e muito mais.",
  },
  {
    element: "[data-tour='btn-novo-dossie']",
    title: "Novo Dossiê",
    description: "Clique aqui para criar sua primeira negociação imobiliária. Tudo começa com um dossiê.",
  },
  {
    element: "[data-tour='dashboard-stats']",
    title: "Indicadores",
    description: "Acompanhe suas métricas: dossiês criados, certidões emitidas e taxa de conclusão.",
  },
  {
    element: "[data-tour='sidebar-perfil']",
    title: "Seu perfil",
    description: "Acesse seus dados, altere sua senha, veja notificações e gerencie sua conta.",
  },
  {
    element: "[data-tour='central-ajuda']",
    title: "Central de Ajuda",
    description: "Sempre que tiver dúvidas, a documentação completa está aqui. Você também pode abrir um chamado de suporte.",
  },
];

export async function iniciarTour() {
  if (typeof window === "undefined") return;

  if (window.location.pathname !== "/dashboard") {
    window.location.href = "/dashboard?tour=1";
    return;
  }

  try {
    const { driver } = await import("driver.js");
    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: TOUR_STEPS.map((s, i) => ({
        element: s.element,
        popover: {
          title: s.title,
          description: s.description,
          side: i === 0 ? "right" : i === 3 ? "top" : "bottom",
          align: "start",
        },
      })),
    });
    driverObj.drive();
  } catch (err) {
    console.error("[Tour] Erro ao iniciar:", err);
  }
}
