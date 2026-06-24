const base = import.meta.env.BASE_URL;

export interface Project {
  titulo: string
  imagem: string
  imgPosition?: string
  descricao: string
  tags: string[]
  linkProjeto: string
  linkGitHub: string
}

export const projects: Project[] = [
  {
    titulo: "Chronos",
    imagem: `${base}chronos.png`,
    imgPosition: "center",
    descricao: "Sistema completo de gestão de pessoas com registro de jornada, banco de horas, controle de férias, solicitações (tickets) e relatórios. Desenvolvido com React, TypeScript, Node.js, PostgreSQL e Prisma, utiliza autenticação JWT, envio de e-mails e dashboard administrativo com permissões por cargo.",
    tags: ["React", "TypeScript", "Node.js", "PostgreSQL", "Prisma"],
    linkProjeto: "https://chronos-blond-gamma.vercel.app",
    linkGitHub: "https://github.com/Milenaalvez/.vscode/tree/main/chronos",
  },
  {
    titulo: "DONNOS Docs",
    imagem: `${base}certidoes.png`,
    descricao: "Plataforma web que automatiza a busca de certidões imobiliárias em portais públicos brasileiros (Receita Federal, TRF1 e TJDFT). Utiliza Puppeteer com stealth para navegação automatizada, resolucão de CAPTCHAs com interação do usuário e consolidação de PDFs em um dossiê único.",
    tags: ["TypeScript", "Node.js", "Puppeteer", "Express", "PDF-lib"],
    linkProjeto: "https://github.com/Milenaalvez/.vscode/tree/main/A.CERT",
    linkGitHub: "https://github.com/Milenaalvez/.vscode/tree/main/A.CERT",
  },
  {
    titulo: "Netflix Cover",
    imagem: `${base}netflix-cover.png`,
    imgPosition: "top",
    descricao: "Sistema inspirado na interface da Netflix desenvolvido com HTML, CSS e JavaScript. O projeto utiliza responsividade, organização de layout e estilização moderna, além de praticar manipulação de elementos e estruturação de interfaces front-end.",
    tags: ["HTML", "JavaScript", "CSS"],
    linkProjeto: "https://milenaalvez.github.io/Netflix--Alura/home.html",
    linkGitHub: "https://github.com/Milenaalvez/Netflix--Alura",
  },
  {
    titulo: "Banco de Horas",
    imagem: `${base}banco-de-horas.png`,
    imgPosition: "10px center",
    descricao: "Sistema web de banco de horas para registrar horários e acompanhar o saldo de horas trabalhadas. Utiliza manipulação do DOM, lógica de programação e atualização dinâmica de dados, com responsividade e estruturação de interfaces front-end.",
    tags: ["HTML", "JavaScript", "CSS"],
    linkProjeto: "https://milenaalvez.github.io/Banco-de-Horas/",
    linkGitHub: "https://github.com/Milenaalvez/Banco-de-Horas",
  },
  {
    titulo: "Portfólio",
    imagem: `${base}portfolio-novo.png`,
    descricao: "Portfólio web com tema cyberpunk/HUD futurista para apresentar projetos, habilidades e informações profissionais. Desenvolvido com React, TypeScript e Tailwind CSS, utiliza responsividade, componentização e estilização personalizada com animações e efeitos visuais.",
    tags: ["React", "JavaScript", "Tailwind CSS"],
    linkProjeto: "https://milenaalvez.github.io/milena-portfolio",
    linkGitHub: "https://github.com/Milenaalvez/milena-portfolio",
  },
]
