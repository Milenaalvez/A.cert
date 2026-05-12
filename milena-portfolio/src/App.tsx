import { useState } from "react";
import { FaGithub, FaPython, FaCss3Alt, FaReact, FaHtml5, FaDatabase, FaAws } from "react-icons/fa";
import { SiFigma, SiTailwindcss } from "react-icons/si";
import { MdDesignServices } from "react-icons/md";

const techData: Record<string, { descricao: string; nivel: number }> = {
  React: { descricao: "Biblioteca para construção de interfaces de usuário interativas e componentizadas.", nivel: 50 },
  CSS: { descricao: "Linguagem de estilização para criar layouts responsivos e designs modernos.", nivel: 80 },
  "UI/UX": { descricao: "Design de interfaces com foco em usabilidade, estética e experiência do usuário.", nivel: 75 },
  SQL: { descricao: "Linguagem para gerenciamento e consulta de dados em bancos relacionais.", nivel: 65 },
  "Node.JS": { descricao: "Runtime JavaScript para desenvolvimento de aplicações back-end escaláveis.", nivel: 60 },
  APIS: { descricao: "Integração e consumo de APIs REST para comunicação entre sistemas.", nivel: 70 },
  Git: { descricao: "Sistema de controle de versão para gerenciamento de código e colaboração.", nivel: 75 },
  Figma: { descricao: "Ferramenta colaborativa de design para prototipação e criação de interfaces.", nivel: 70 },
  JavaScript: { descricao: "Linguagem de programação para criar interatividade e lógica em aplicações web.", nivel: 80 },
  Scrum: { descricao: "Metodologia ágil para gestão e organização de projetos em equipe.", nivel: 60 },
  Python: { descricao: "Linguagem versátil usada em automação, análise de dados e desenvolvimento web.", nivel: 55 },
  AWS: { descricao: "Plataforma de serviços em nuvem para hospedagem, armazenamento e computação.", nivel: 40 },
};

const nivelLabel = (n: number) => {
  if (n >= 81) return "Expert";
  if (n >= 61) return "Avançado";
  if (n >= 41) return "Intermediário";
  if (n >= 21) return "Básico";
  return "Iniciante";
};

const toolData = [
  { nome: "Python", icon: FaPython, descricao: "Linguagem versátil usada em automação, análise de dados e desenvolvimento web.", descricaoLonga: "Python é reconhecida por sua sintaxe clara e legibilidade, sendo amplamente adotada em automação, análise de dados, inteligência artificial e desenvolvimento web. Sua vasta biblioteca padrão e ecossistema de pacotes tornam-na uma das linguagens mais versáteis da atualidade.", nivel: 55, subtitulo: "Linguagem de Programação", tipo: "Back-end / Script", linguagem: "Python", lancamento: "1991", desenvolvedor: "Guido van Rossum", features: ["Sintaxe Limpa", "Bibliotecas Poderosas", "Multi-paradigma", "Automação", "Data Science", "APIs REST"], usadoEm: ["Automação", "Data Science", "Web Apps", "Scripts", "IA/ML"] },
  { nome: "Figma", icon: SiFigma, descricao: "Ferramenta colaborativa de design para prototipação e criação de interfaces.", descricaoLonga: "Figma é uma ferramenta de design colaborativa baseada em nuvem que permite criar protótipos, interfaces e experiências de usuário em tempo real. Com recursos avançados de componentes, auto-layout e prototipação, é a escolha padrão para designers modernos.", nivel: 70, subtitulo: "Ferramenta de Design", tipo: "Design UI/UX", linguagem: "N/A", lancamento: "2016", desenvolvedor: "Figma Inc.", features: ["Componentes", "Auto Layout", "Prototipação", "Colaboração", "Variants", "Design Systems"], usadoEm: ["Prototipação", "UI Design", "Design Systems", "Equipes Ágeis"] },
  { nome: "CSS", icon: FaCss3Alt, descricao: "Linguagem de estilização para criar layouts responsivos e designs modernos.", descricaoLonga: "CSS é a linguagem fundamental para estilização web, permitindo criar layouts responsivos, animações sofisticadas e designs visualmente impressionantes. Com recursos modernos como Grid, Flexbox e Custom Properties, o CSS evoluiu para uma poderosa ferramenta de criação.", nivel: 80, subtitulo: "Linguagem de Estilo", tipo: "Front-end", linguagem: "CSS", lancamento: "1996", desenvolvedor: "Håkon Wium Lie", features: ["Flexbox", "CSS Grid", "Animações", "Responsividade", "Variáveis CSS", "Media Queries"], usadoEm: ["Web Apps", "Sites Responsivos", "Dashboards", "Landing Pages"] },
  { nome: "Tailwind CSS", icon: SiTailwindcss, descricao: "Framework CSS utilitário para desenvolvimento rápido de interfaces modernas.", descricaoLonga: "Tailwind CSS é um framework utilitário que revoluciona a forma de estilizar aplicações web. Em vez de componentes pré-estilizados, oferece classes atômicas que permitem construir designs personalizados rapidamente, com produtividade e consistência.", nivel: 65, subtitulo: "Framework CSS", tipo: "Front-end", linguagem: "CSS", lancamento: "2017", desenvolvedor: "Adam Wathan", features: ["Utility-First", "Customização", "Responsivo", "Design System", "Dark Mode", "JIT Engine"], usadoEm: ["Landing Pages", "Dashboards", "SPAs", "E-commerce"] },
  { nome: "UI/UX", icon: MdDesignServices, descricao: "Design de interfaces com foco em usabilidade, estética e experiência do usuário.", descricaoLonga: "UI/UX Design é a disciplina que combina estética visual com usabilidade para criar experiências digitais memoráveis. Envolve pesquisa de usuários, prototipação, design de interface e testes de usabilidade para garantir produtos intuitivos e agradáveis.", nivel: 75, subtitulo: "Design de Interfaces", tipo: "Design", linguagem: "N/A", lancamento: "-", desenvolvedor: "-", features: ["Pesquisa", "Wireframes", "Prototipação", "Testes A/B", "Acessibilidade", "Design Thinking"], usadoEm: ["Web Apps", "Mobile Apps", "Sites", "Sistemas"] },
  { nome: "React", icon: FaReact, descricao: "Biblioteca para construção de interfaces de usuário interativas e componentizadas.", descricaoLonga: "React é a biblioteca mais influente para construção de interfaces de usuário na web moderna. Baseada em componentes reutilizáveis e Virtual DOM, permite criar aplicações complexas com performance excepcional, sendo mantida pelo Facebook e uma comunidade global ativa.", nivel: 50, subtitulo: "Biblioteca Front-end", tipo: "Framework Front-end", linguagem: "JavaScript / TypeScript", lancamento: "2013", desenvolvedor: "Meta (Facebook)", features: ["Componentes Reutilizáveis", "Hooks", "Virtual DOM", "React Router", "Gerenciamento de Estado", "Integração com APIs"], usadoEm: ["Portfólio", "Dashboards", "SPAs", "Sistemas Web", "E-commerce"] },
  { nome: "HTML", icon: FaHtml5, descricao: "Linguagem de marcação para estruturação e semântica de conteúdo web.", descricaoLonga: "HTML é a espinha dorsal da web, fornecendo a estrutura semântica para todo o conteúdo online. Com a evolução para HTML5, trouxe elementos poderosos para multimídia, formulários avançados e APIs nativas que transformaram a experiência de navegação.", nivel: 85, subtitulo: "Linguagem de Marcação", tipo: "Front-end", linguagem: "HTML", lancamento: "1993", desenvolvedor: "Tim Berners-Lee", features: ["Semântica", "Multimídia", "Formulários", "Canvas", "APIs Nativas", "Acessibilidade"], usadoEm: ["Web Apps", "Sites", "E-mails", "Docs"] },
  { nome: "SQL", icon: FaDatabase, descricao: "Linguagem para gerenciamento e consulta de dados em bancos relacionais.", descricaoLonga: "SQL é a linguagem padrão para gerenciamento de bancos de dados relacionais, essencial para armazenar, consultar e manipular dados estruturados. Domínio de SQL é fundamental para qualquer profissional que trabalhe com back-end, análise de dados ou engenharia de software.", nivel: 65, subtitulo: "Linguagem de Banco de Dados", tipo: "Banco de Dados", linguagem: "SQL", lancamento: "1974", desenvolvedor: "IBM", features: ["Consultas", "Joins", "Subqueries", "Índices", "Transactions", "Views"], usadoEm: ["Sistemas Web", "APIs", "Data Science", "Relatórios"] },
  { nome: "AWS", icon: FaAws, descricao: "Plataforma de serviços em nuvem para hospedagem, armazenamento e computação.", descricaoLonga: "Amazon Web Services é a plataforma de nuvem mais abrangente do mundo, oferecendo mais de 200 serviços de infraestrutura, armazenamento, computação e inteligência artificial. Essencial para deploy, escalabilidade e gerenciamento de aplicações modernas.", nivel: 40, subtitulo: "Plataforma Cloud", tipo: "Cloud Computing", linguagem: "N/A", lancamento: "2006", desenvolvedor: "Amazon", features: ["EC2", "S3", "Lambda", "RDS", "DynamoDB", "CloudFront"], usadoEm: ["Deploy", "Armazenamento", "Serverless", "Infraestrutura"] },
];

const techId = (name: string) => `hud-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;

function App() {
  const [modalAberto, setModalAberto] = useState(false);
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState<typeof toolData[0] | null>(null);

  const abrirModal = (ferramenta: typeof ferramentaSelecionada) => {
    setFerramentaSelecionada(ferramenta);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
  };

  return (
    <main className="bg-[#030205] min-h-screen text-white relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #030205 0%, #080312 50%, #05020A 100%)' }}>

      {/* FUNDO HOLOGRAFICO FEMININO */}
      <div className="hologram-glow" />
      <div className="scanlines-soft" />
      <div className="bg-circuit-l" />
      <div className="bg-circuit-r" />
      <div className="bg-corner-geo bg-corner-geo-tl" />
      <div className="bg-corner-geo bg-corner-geo-br" />
      <div className="bg-hud-ring bg-hud-ring-1" />
      <div className="bg-hud-ring bg-hud-ring-2" />
      <div className="bg-particle-lilac bg-pos-1" />
      <div className="bg-particle-pink bg-pos-2" />
      <div className="bg-particle-gold bg-pos-3" />
      <div className="bg-particle-lilac bg-pos-4" />
      <div className="bg-particle-pink bg-pos-5" />
      <div className="bg-particle-lilac bg-pos-6" />
      <div className="bg-particle-gold bg-pos-7" />
      <div className="bg-particle-pink bg-pos-8" />
      <div className="bg-dash-line bg-dash-line-t" />
      <div className="bg-dash-line bg-dash-line-b" />
      <div className="bg-node bg-node-1" />
      <div className="bg-node bg-node-2" />
      <div className="bg-node bg-node-3" />
      <div className="bg-node bg-node-4" />
      <div className="bg-node bg-node-5" />
      <div className="bg-node bg-node-6" />
      <div className="bg-trace-h bg-trace-h-1" />
      <div className="bg-trace-h bg-trace-h-2" />
      <div className="bg-trace-v bg-trace-v-1" />
      <div className="bg-trace-v bg-trace-v-2" />
      <div className="bg-bracket bg-bracket-lt" />
      <div className="bg-bracket bg-bracket-rb" />
      <div className="bg-signal bg-signal-1" />
      <div className="bg-signal bg-signal-2" />

      {/* NAVBAR */}
      <nav className="w-full flex justify-center fixed top-0 left-0 z-50 pt-6">

        <div
          className="
            w-full
            h-[72px]
            flex
            items-center
            justify-between
            rounded-2xl
            cyber-nav
          "
          style={{ paddingLeft: 16, paddingRight: 16 }}
        >

          {/* LOGO */}
          <h2 className="cyber-nav-logo">
            Milena OL.
          </h2>

          {/* LINKS */}
          <div className="hidden md:flex items-center gap-14">
            <a href="#about" className="cyber-nav-link">Sobre</a>
            <a href="#experiencia" className="cyber-nav-link">Experiências</a>
            <a href="#ferramentas" className="cyber-nav-link">Ferramentas</a>
            <a href="#contato" className="cyber-nav-link">Contato</a>
          </div>

          {/* BOTÃO */}
          <a
            href="https://wa.me/61935006766"
            target="_blank"
            rel="noopener noreferrer"
            className="cyber-nav-btn flex items-center justify-center w-[110px] h-[50px] rounded-[10px]"
          >
            Conectar-se
          </a>

        </div>

      </nav>
é so 
      {/* GLOW */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#7C3AED] opacity-15 blur-[200px]" />
      <div className="absolute top-[200px] right-0 w-[400px] h-[400px] bg-[#FF1493] opacity-10 blur-[180px]" />

      {/* HERO */}
      <section
        className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative"
      >

        <div className="hero-hud-wrapper">
          <div className="hero-hud-frame" />
          <div className="hero-hud-frame-inner" />
          <span className="hero-coord hero-coord-tl">NUC::15.7794° S</span>
          <span className="hero-coord hero-coord-tr">TEC::47.9292° W</span>
          <span className="hero-coord hero-coord-bl">SYS::PORTFOLIO</span>
          <span className="hero-coord hero-coord-br">VER::1.0.0</span>
          <h1 className="hero-name">
            Milena de<br />Oliveira Alves
          </h1>
        </div>

        <div className="hero-terminal">
          <span>UI/UX Designer &amp; Full Stack Developer</span>
          <span className="hero-terminal-cursor" />
        </div>

        <div className="hero-status-bar">
          <div className="hero-status-item">
            <span className="hero-status-dot" />
            <span>Disponível</span>
          </div>
          <div className="hero-status-item">
            <span style={{ color: "#D8B4FE", opacity: 0.5 }}>⬡</span>
            <span>6+ projetos</span>
          </div>
          <div className="hero-status-item">
            <span style={{ color: "#D8B4FE", opacity: 0.5 }}>⬡</span>
            <span>Full Stack</span>
          </div>
        </div>

        <p className="hero-subtitle">
          Apaixonada por design UI/UX e desenvolvimento full stack,
          criando experiências digitais com foco em usabilidade,
          estética e performance.
        </p>

        {/* ESPAÇO */}
        <div className="h-4" />

        {/* BOTÕES */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/milenaalvez/"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn-primary w-[170px] h-[53px] rounded-[10px] flex items-center justify-center"
          >
            LinkedIn
          </a>

          <a
            href="https://github.com/Milenaalvez"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn-secondary flex items-center justify-center gap-2 w-[150px] h-[54px] rounded-[10px]"
          >
            GitHub
            <FaGithub size={16} />
          </a>
        </div>

        {/* SCROLL INDICATOR */}
        <a href="#about" className="hero-scroll">
          <span>Rolar</span>
          <div className="hero-scroll-line" />
        </a>

      </section>

      {/* GLOW ESPAÇO */}
      <div className="absolute top-[950px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#E9D5FF] opacity-30 blur-[220px]" />

      {/* ESPAÇO */}
      <div className="h-[100px]" />

      {/* ABOUT */}
      <section
        id="about"
        className="min-h-screen flex items-center justify-center px-6 relative"
        style={{ scrollMarginTop: 100 }}
      >

        <div
          className="
            w-full
            max-w-[1280px]
            flex flex-col md:flex-row
            items-center md:items-start
            justify-center
            gap-[60px] md:gap-[130px]
            px-4 md:px-0
          "
        >

          {/* TEXTO */}
          <div className="w-full md:w-[520px] relative">

            <div className="about-section-label">APRESENTAÇÃO</div>
            <h2 className="about-title">
              Sobre mim
            </h2>

            <div className="space-y-32 md:space-y-48 relative z-10" style={{ marginTop: 36 }}>
              <p className="about-text">
                A criatividade sempre esteve presente na forma como
                enxergo e construo experiências. Através da leitura,
                do desenho e da curiosidade por aprender, desenvolvi
                uma visão conectada à criação de algo que vá além da
                funcionalidade, experiências capazes de marcar, gerar
                conexão e deixar lembranças positivas nas pessoas.
              </p>
              <p className="about-text">
                Hoje, encontro no design UI/UX e no desenvolvimento
                full stack uma forma de transformar criatividade em
                experiências digitais intuitivas, funcionais e
                significativas. Busco sempre criar projetos que
                proporcionem uma boa experiência para quem os utiliza,
                seja através de um site, de uma interface ou de
                qualquer solução construída com propósito, estética
                e atenção aos detalhes.
              </p>
            </div>
          </div>

          {/* LADO DIREITO — FOTO + CARD */}
          <div className="flex flex-col items-center gap-10 w-full md:w-auto relative">

            {/* GLOWS */}
            <div className="absolute right-40 top-[200px] w-[400px] h-[400px] bg-[#7C3AED] opacity-10 blur-[200px]" />

            <div className="flex flex-col items-center gap-2">

            {/* FOTO CYBERPUNK */}
            <div className="foto-milena-wrapper">
              <div className="foto-glow-bg" />
              <div className="foto-milena-frame" />
              <div className="foto-milena-frame-inner" />

              <span className="foto-tech-label">IDENTIFICAÇÃO::AGENTE</span>
              <span className="foto-tech-label-right">HUD::ATIVO</span>

              <img src="/milena.jpeg" alt="Milena Oliveira Alves" className="foto-milena-img" />

              <div className="foto-grid-overlay" />

              <div className="foto-scan-top" />
              <div className="foto-scan-bottom" />
              <div className="foto-scan-left" />
              <div className="foto-scan-right" />

              <div className="foto-corner foto-corner-tl" />
              <div className="foto-corner foto-corner-tr" />
              <div className="foto-corner foto-corner-bl" />
              <div className="foto-corner foto-corner-br" />

              <div className="foto-diag-tl" />
              <div className="foto-diag-tr" />
              <div className="foto-diag-bl" />
              <div className="foto-diag-br" />

              <div className="foto-circuit-tl" />
              <div className="foto-circuit-br" />

              <div className="foto-dot foto-dot-pink foto-dot-1" />
              <div className="foto-dot foto-dot-purple foto-dot-2" />
              <div className="foto-dot foto-dot-pink foto-dot-3" />
              <div className="foto-dot foto-dot-purple foto-dot-4" />
            </div>

            {/* ID BADGE */}
            <div className="foto-id-badge">
              <span className="foto-id-dot" />
              <span>Status: Ativa — Full Stack Developer</span>
            </div>
            </div>

            {/* CARD TECNOLOGIAS */}
            <div
              className="about-card w-full md:w-[552px] rounded-[18px] flex flex-col relative"
              style={{ padding: 32 }}
            >
              
              {/* SCANLINES + CANTOS */}
              <div className="about-card-scantop" />
              <div className="about-card-scanbottom" />
              <div className="about-card-corner about-card-corner-tl" />
              <div className="about-card-corner about-card-corner-tr" />
              <div className="about-card-corner about-card-corner-bl" />
              <div className="about-card-corner about-card-corner-br" />

              {/* TÍTULO */}
              <p
                className="text-[#D8B4FE] text-[14px] md:text-[15px] tracking-[1px] uppercase font-['JetBrains_Mono',monospace]"
                style={{ marginBottom: 24 }}
              >
                tecnologias e ferramentas
              </p>

            {/* GRID DE TAGS (como <a> links para :target com IDs seguros) */}
            <div className="flex flex-col items-center gap-[14px]">
              
              {/* LINHA 1 */}
              <div className="flex flex-wrap items-center justify-center gap-[10px] md:gap-[17px]">
                {["React", "CSS", "UI/UX", "SQL", "Node.JS"].map((item) => (
                  <a
                    key={item}
                    href={`#${techId(item)}`}
                    className="tech-tag px-[12px] md:px-0 md:w-[79.5px] h-[37.59px] rounded-[4px] bg-[#3F394D] flex items-center justify-center text-[11px] md:text-[12px] tracking-[2px] uppercase text-[#E7E4EF] font-['JetBrains_Mono',monospace] hover:bg-[#4F4960] no-underline"
                  >
                    {item}
                  </a>
                ))}
              </div>

              {/* LINHA 2 */}
              <div className="flex flex-wrap items-center justify-center gap-[10px] md:gap-[17px]">
                {["APIS", "Git", "Figma", "JavaScript"].map((item) => (
                  <a
                    key={item}
                    href={`#${techId(item)}`}
                    className={`tech-tag ${item === "JavaScript" ? "px-[16px] md:px-0 md:w-[96px]" : "px-[12px] md:px-0 md:w-[79.5px]"} h-[37.59px] rounded-[4px] bg-[#3F394D] flex items-center justify-center text-[11px] md:text-[12px] tracking-[2px] uppercase text-[#E7E4EF] font-['JetBrains_Mono',monospace] hover:bg-[#4F4960] no-underline`}
                  >
                    {item}
                  </a>
                ))}
              </div>

              {/* LINHA 3 */}
              <div className="flex flex-wrap items-center justify-center gap-[10px] md:gap-[17px]">
                {["Scrum", "Python", "AWS"].map((item) => (
                  <a
                    key={item}
                    href={`#${techId(item)}`}
                    className="tech-tag px-[12px] md:px-0 md:w-[79.5px] h-[37.59px] rounded-[4px] bg-[#3F394D] flex items-center justify-center text-[11px] md:text-[12px] tracking-[2px] uppercase text-[#E7E4EF] font-['JetBrains_Mono',monospace] hover:bg-[#4F4960] no-underline"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* HUD PANELS (usando :target com IDs seguros) */}
            {Object.entries(techData).map(([nome, data]) => (
              <div key={nome} id={techId(nome)} className="hud-panel" style={{ scrollMarginTop: 120 }}>
                
                {/* Decorações HUD */}
                <div className="hud-scan-top" />
                <div className="hud-scan-right" />
                <div className="hud-scan-bottom" />
                <div className="hud-corner hud-corner-tl" />
                <div className="hud-corner hud-corner-tr" />
                <div className="hud-corner hud-corner-bl" />
                <div className="hud-corner hud-corner-br" />
                <div className="hud-diag-tl" />
                <div className="hud-diag-br" />
                <div className="hud-dot hud-dot-1" />
                <div className="hud-dot hud-dot-2" />
                <div className="hud-particle hud-particle-1" />
                <div className="hud-particle hud-particle-2" />
                <div className="hud-particle hud-particle-3" />
                <div className="hud-grid-overlay" />

                {/* NOME + PORCENTAGEM + FECHAR */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ display: "inline-block", width: 3, height: 24, background: "#D8B4FE", boxShadow: "0 0 10px #D8B4FE" }} />
                    <span style={{ color: "#E7E4EF", fontSize: 18, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, textTransform: "uppercase" }}>
                      {nome}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#D8B4FE", fontSize: 15, fontWeight: 600, fontFamily: "JetBrains Mono, monospace", textShadow: "0 0 20px rgba(216,180,254,0.3)" }}>
                      {data.nivel}%
                    </span>
                    <a href="#about"
                       className="hud-close"
                       title="Fechar">✕</a>
                  </div>
                </div>

                {/* DESCRIÇÃO */}
                <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.8, fontFamily: "Inter, sans-serif", margin: "0 0 20px 0", position: "relative", zIndex: 1, paddingLeft: 15, borderLeft: "1px solid rgba(208,188,255,0.1)" }}>
                  {data.descricao}
                </p>

                {/* BARRA DE PROGRESSO FUTURISTA */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "rgba(208,188,255,0.5)", fontSize: 11, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: 1 }}>
                      proficiency
                    </span>
                    <span style={{ color: "rgba(208,188,255,0.5)", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                      {data.nivel}/100
                    </span>
                  </div>
                  <div className="hud-progress-track">
                    <div className="hud-progress-fill" style={{ width: `${data.nivel}%` }} />
                  </div>
                </div>
              </div>
            ))}
            
          </div>
          </div>
          </div>
      </section>

      {/* ESPAÇO EXPERIÊNCIA */}
      <div className="h-[80px] md:h-[120px]" />

      {/* EXPERIÊNCIA PROFISSIONAL */}
      <section id="experiencia" className="min-h-screen flex flex-col items-center px-6 md:px-0 relative" style={{ scrollMarginTop: 100 }}>

        <h2 className="exp-section-title">Experiência Profissional</h2>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-[40px] md:gap-y-[48px] gap-x-[48px] w-full max-w-[1200px] px-4 md:px-0" style={{ marginTop: 90 }}>

          {[
            {
              empresa: "UNICEUB",
              ano: "2025 - 2026",
              cargo: "Auxiliar Administrativo",
              descricao: "Atuação na organização e validação de dados acadêmicos, suporte em sistemas internos e otimização de processos, desenvolvendo atenção aos detalhes e resolução de problemas.",
            },
            {
              empresa: "Inova Papelaria",
              ano: "2025 - 2025",
              cargo: "Atendimento & Suporte Operacional",
              descricao: "Experiência com atendimento ao público, organização de demandas e suporte operacional, desenvolvendo comunicação, agilidade e foco na experiência do usuário.",
            },
            {
              empresa: "BSB MED",
              ano: "2023 - 2023",
              cargo: "Auxiliar de Segurança do Trabalho",
              descricao: "Estruturação de dados para eSocial, controle de documentação técnica e apoio em processos administrativos com foco em organização e gestão de informações.",
            },
            {
              empresa: "Intelit Service",
              ano: "2021 - 2023",
              cargo: "Auxiliar Administrativo",
              descricao: "Atuação no suporte administrativo, organização de documentos e atualização de informações internas, contribuindo para a eficiência de processos e rotinas operacionais.",
            },
          ].map((exp) => (
            <div
              key={exp.empresa}
              className="exp-card w-full rounded-[18px] flex flex-col justify-start"
              style={{ padding: 32 }}
            >
              <div className="exp-card-header">
                <h3 className="exp-company">{exp.empresa}</h3>
                <span className="exp-year">{exp.ano}</span>
              </div>
              <p className="exp-role">{exp.cargo}</p>
              <p className="exp-desc">{exp.descricao}</p>

            </div>
          ))}

        </div>

      </section>

      {/* ESPAÇO PROJETOS */}
      <div className="h-[40px] md:h-[60px]" />

      {/* PROJETOS */}
      <section id="projetos" className="min-h-screen flex flex-col items-center px-6 md:px-0 relative" style={{ scrollMarginTop: 100 }}>

        <h2 className="proj-section-title">Meus Projetos</h2>

        {/* CARDS */}
        <div
          className="flex flex-col md:flex-row items-stretch justify-center gap-6 w-full max-w-[1200px]"
          style={{ marginTop: 90 }}
        >
          {[
            {
              titulo: "Netflix Cover",
              imagem: "/netflix-cover.png",
              imgPosition: "top",
              descricao: "Sistema inspirado na interface da Netflix desenvolvido com HTML, CSS e JavaScript com o objetivo de proporcionar ao usuário uma experiência visual semelhante à de uma plataforma de streaming. O projeto utiliza responsividade, organização de layout e estilização moderna, além de praticar manipulação de elementos e estruturação de interfaces front-end.",
              tags: ["HTML", "JavaScript", "CSS"],
              linkProjeto: "https://milenaalvez.github.io/Netflix--Alura/home.html",
              linkGitHub: "https://github.com/Milenaalvez/Netflix--Alura",
            },
            {
              titulo: "Banco de Horas",
              imagem: "/banco-de-horas.png",
              imgPosition: "10px center",
              descricao: "Sistema web de banco de horas desenvolvido com HTML, CSS e JavaScript com o objetivo de proporcionar ao usuário uma forma prática de registrar horários e acompanhar o saldo de horas trabalhadas. O projeto utiliza manipulação do DOM, lógica de programação e atualização dinâmica de dados, além de praticar responsividade e estruturação de interfaces front-end.",
              tags: ["HTML", "JavaScript", "CSS"],
              linkProjeto: "https://milenaalvez.github.io/Banco-de-Horas/",
              linkGitHub: "https://github.com/Milenaalvez/Banco-de-Horas",
            },
            {
              titulo: "Portfólio",
              imagem: "/portfolio-novo.png",
              imgPosition: "center",
              descricao: "Portfólio web desenvolvido com HTML, CSS, JavaScript e React com o objetivo de apresentar projetos, habilidades e informações profissionais de forma moderna e organizada. O projeto utiliza responsividade, componentização e estilização personalizada para proporcionar ao usuário uma navegação intuitiva e uma melhor visualização dos conteúdos e tecnologias utilizadas.",
              tags: ["React", "JavaScript", "Tailwind CSS"],
              linkProjeto: "",
              linkGitHub: "",
            },
          ].map((projeto) => (
            <div
              key={projeto.titulo}
              className="proj-card rounded-[18px] flex flex-col w-full"
            >
              <div className="proj-card-scantop" />

              {/* IMAGEM */}
              <div className="proj-image-wrap">
                <img
                  src={projeto.imagem}
                  alt={projeto.titulo}
                  className="proj-image"
                  style={{ objectPosition: projeto.imgPosition || "center" }}
                />
              </div>

              {/* CONTEÚDO */}
              <div className="proj-content">
                <h3 className="proj-title">{projeto.titulo}</h3>
                <p className="proj-desc">{projeto.descricao}</p>

                {/* TAGS */}
                {projeto.tags.length > 0 && (
                  <div className="flex items-center gap-[8px]" style={{ marginTop: 14 }}>
                    {projeto.tags.map((tag) => (
                      <span key={tag} className="proj-tag">{tag}</span>
                    ))}
                  </div>
                )}

                {/* BOTÕES */}
                <div className="flex items-center justify-center gap-3" style={{ marginTop: 20 }}>
                  <a
                    href={projeto.linkProjeto || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="proj-btn-primary flex items-center justify-center rounded-[10px]"
                    style={{ width: 140, height: 42 }}
                  >
                    Ver mais
                  </a>
                  <a
                    href={projeto.linkGitHub || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="proj-btn-secondary flex items-center justify-center rounded-[10px]"
                    style={{ width: 120, height: 42 }}
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ESPAÇO FERRAMENTAS */}
      <div className="h-[40px] md:h-[60px]" />

      {/* FERRAMENTAS */}
      <section id="ferramentas" className="min-h-screen flex flex-col items-center px-6 md:px-0 relative overflow-hidden" style={{ scrollMarginTop: 100 }}>

        {/* GLOW */}
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D8B4FE] opacity-25 blur-[200px]" />

        <h2
          className="
            w-full md:w-[1152px]
            text-white
            text-[28px] md:text-[32px]
            font-semibold
            tracking-[-2px]
            text-center
            font-['Hanken_Grotesk',sans-serif]
            relative
            z-10
          "
        >
          Ferramentas
        </h2>

        {/* GRADE */}
        <div
          className="flex flex-wrap items-center justify-center gap-5 w-full max-w-[900px] relative z-10"
          style={{ marginTop: 80 }}
        >
          {toolData.map((ferramenta) => (
            <div
              key={ferramenta.nome}
              className="ferramenta-card flex flex-col items-center justify-center rounded-[16px] border border-[#2A2533] transition-all duration-300 cursor-pointer"
              style={{
                width: 130,
                height: 130,
                background: "rgba(18,16,25,0.45)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 0 20px rgba(216,180,254,0.08)",
              }}
              onClick={() => abrirModal(ferramenta)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#FF69B4";
                e.currentTarget.style.boxShadow = "0 0 35px rgba(255,20,147,0.25), 0 0 30px rgba(216,180,254,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2A2533";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(216,180,254,0.08)";
              }}
            >
              <ferramenta.icon size={28} color="#D0BCFF" />
              <p className="text-white text-[13px] font-medium font-['Inter',sans-serif] mt-3 text-center leading-tight">
                {ferramenta.nome}
              </p>
            </div>
          ))}
        </div>

      </section>

      {/* MODAL HORIZONTAL CYBERPUNK HUD */}
      {modalAberto && ferramentaSelecionada && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(14px) brightness(0.5)" }}>
          
          {/* OVERLAY DE FECHAR */}
          <div className="absolute inset-0" onClick={fecharModal} />

          {/* PAINEL HUD HORIZONTAL */}
          <div className="hud-modal relative" style={{ animation: "modalZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
            
            {/* SYS::ACTIVE TOPO */}
            <div className="hud-modal-systop">
              <span className="hud-modal-syslabel">SISTEMA::ATIVO</span>
              <span className="hud-modal-syslabel">v.{ferramentaSelecionada.nivel}.0</span>
            </div>

            {/* MOLDURAS EXTERNAS */}
            <div className="hud-frame-outer" />
            <div className="hud-frame-inner" />

            {/* SCANLINES */}
            <div className="hud-scan-top" />
            <div className="hud-scan-right" />
            <div className="hud-scan-bottom" />
            <div className="hud-scan-left" />

            {/* CANTOS CHANFRADOS */}
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />

            {/* TRAÇOS DIAGONAIS */}
            <div className="hud-diag-tl" />
            <div className="hud-diag-br" />
            <div className="hud-diag-tr" />
            <div className="hud-diag-bl" />

            {/* PONTOS LUMINOSOS */}
            <div className="hud-dot hud-dot-1" />
            <div className="hud-dot hud-dot-2" />
            <div className="hud-dot hud-dot-3" />
            <div className="hud-dot hud-dot-4" />

            {/* PARTÍCULAS FLUTUANTES */}
            <div className="hud-particle hud-particle-1" />
            <div className="hud-particle hud-particle-2" />
            <div className="hud-particle hud-particle-3" />
            <div className="hud-particle hud-particle-4" />
            <div className="hud-particle hud-particle-5" />

            {/* CIRCUITOS LUMINOSOS */}
            <div className="hud-circuit-top" />
            <div className="hud-circuit-right" />
            <div className="hud-circuit-bottom" />
            <div className="hud-circuit-left" />
            <div className="hud-circuit-corner-tl" />
            <div className="hud-circuit-corner-br" />

            {/* OVERLAY DE GRADE */}
            <div className="hud-grid-overlay" />

            {/* CONTEÚDO INTERNO - GRID LAYOUT */}
            <div className="hud-modal-inner">

              {/* === LADO ESQUERDO: ÍCONE + NOME + DESCRIÇÃO === */}
              <div className="hud-left">
                <div className="hud-badge">TECNOLOGIA</div>
                <div className="hud-icon-block">
                  <div className="hud-icon-glow" />
                  <div className="hud-icon-ring-outer" />
                  <div className="hud-icon-ring-inner" />
                  <ferramentaSelecionada.icon size={56} color="#D8B4FE" />
                </div>
                <h2 className="hud-tech-name">{ferramentaSelecionada.nome}</h2>
                <p className="hud-tech-subtitle">{ferramentaSelecionada.subtitulo}</p>
                <div className="hud-divider-neon" />
                <p className="hud-tech-desc">{ferramentaSelecionada.descricaoLonga}</p>
              </div>

              {/* === CENTRO: MEU NÍVEL === */}
              <div className="hud-center">
                <div className="hud-center-header">
                  <div className="hud-pulse-dot" />
                  <span className="hud-section-title">MEU NÍVEL</span>
                </div>
                <div className="hud-level-block">
                  <span className="hud-level-number">{ferramentaSelecionada.nivel}</span>
                  <span className="hud-level-percent">%</span>
                  <span className="hud-level-label">{nivelLabel(ferramentaSelecionada.nivel)}</span>
                </div>
                <div className="hud-progress-wrap">
                  <div className="hud-progress-track">
                    <div className="hud-progress-fill" style={{ width: `${ferramentaSelecionada.nivel}%` }} />
                  </div>
                </div>
                <p className="hud-level-desc">
                  {ferramentaSelecionada.nivel <= 20 && "Iniciando minha jornada com esta tecnologia, explorando conceitos fundamentais."}
                  {ferramentaSelecionada.nivel >= 21 && ferramentaSelecionada.nivel <= 40 && "Possuo conhecimento básico e consigo desenvolver projetos simples com esta tecnologia."}
                  {ferramentaSelecionada.nivel >= 41 && ferramentaSelecionada.nivel <= 60 && "Tenho experiência intermediária, criando soluções funcionais e bem estruturadas."}
                  {ferramentaSelecionada.nivel >= 61 && ferramentaSelecionada.nivel <= 80 && "Possuo domínio avançado, desenvolvendo projetos complexos com boas práticas."}
                  {ferramentaSelecionada.nivel >= 81 && "Expert na tecnologia, capaz de arquitetar soluções robustas e ensinar outros desenvolvedores."}
                </p>
              </div>

              {/* === DIREITA: INFORMAÇÕES TÉCNICAS === */}
              <div className="hud-right">
                <div className="hud-right-header">
                  <span className="hud-section-title-sm">INFORMAÇÕES</span>
                </div>
                <div className="hud-info-list">
                  <div className="hud-info-item">
                    <div className="hud-info-icon">◈</div>
                    <div className="hud-info-content">
                      <span className="hud-info-label">TIPO</span>
                      <span className="hud-info-value">{ferramentaSelecionada.tipo}</span>
                    </div>
                  </div>
                  <div className="hud-info-item">
                    <div className="hud-info-icon">◈</div>
                    <div className="hud-info-content">
                      <span className="hud-info-label">LINGUAGEM</span>
                      <span className="hud-info-value">{ferramentaSelecionada.linguagem}</span>
                    </div>
                  </div>
                  <div className="hud-info-item">
                    <div className="hud-info-icon">◈</div>
                    <div className="hud-info-content">
                      <span className="hud-info-label">LANÇAMENTO</span>
                      <span className="hud-info-value">{ferramentaSelecionada.lancamento}</span>
                    </div>
                  </div>
                  <div className="hud-info-item">
                    <div className="hud-info-icon">◈</div>
                    <div className="hud-info-content">
                      <span className="hud-info-label">DESENVOLVIDO POR</span>
                      <span className="hud-info-value">{ferramentaSelecionada.desenvolvedor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* === INFERIOR ESQUERDO: PRINCIPAIS RECURSOS === */}
              <div className="hud-bottom-left">
                <div className="hud-bottom-header">
                  <div className="hud-pulse-dot-sm" />
                  <span className="hud-section-title-sm">PRINCIPAIS RECURSOS</span>
                </div>
                <div className="hud-features-list">
                  {ferramentaSelecionada.features.map((f: string) => (
                    <div key={f} className="hud-feature-item">
                      <span className="hud-feature-bullet">▸</span>
                      <span className="hud-feature-text">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* === INFERIOR DIREITO: USADO EM === */}
              <div className="hud-bottom-right">
                <div className="hud-bottom-header">
                  <div className="hud-pulse-dot-sm" />
                  <span className="hud-section-title-sm">USADO EM</span>
                </div>
                <div className="hud-tags-grid">
                  {ferramentaSelecionada.usadoEm.map((u: string) => (
                    <span key={u} className="hud-tag">{u}</span>
                  ))}
                </div>
              </div>

            </div>

            {/* FECHAR */}
            <button className="hud-modal-close" onClick={fecharModal}>✕</button>
          </div>
        </div>
      )}

      {/* CONTATO */}
      <section id="contato" className="min-h-screen flex flex-col items-center px-6 relative overflow-hidden" style={{ scrollMarginTop: 100 }}>

        <div className="cyber-grid" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#7C3AED] opacity-10 blur-[200px]" />

        <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="about-card w-full max-w-[640px] rounded-[18px] flex flex-col items-center relative" style={{ padding: '60px 40px 50px' }}>
          
          <div className="about-card-scantop" />
          <div className="about-card-scanbottom" />
          <div className="about-card-corner about-card-corner-tl" />
          <div className="about-card-corner about-card-corner-tr" />
          <div className="about-card-corner about-card-corner-bl" />
          <div className="about-card-corner about-card-corner-br" />

          <h2 className="text-white text-[28px] md:text-[36px] font-bold font-['Hanken_Grotesk',sans-serif] text-center leading-tight" style={{ textShadow: '0 0 50px rgba(255,20,147,0.15)' }}>
            Vamos trabalhar juntos
          </h2>
          <p className="text-[#A78BFA] text-[14px] md:text-[15px] font-['Inter',sans-serif] text-center mt-3 max-w-[400px]">
            Disponível para oportunidades, colaborações e projetos criativos
          </p>

          <div className="hud-divider-neon" style={{ margin: '28px auto' }} />

          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=milenayor020@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn-primary flex items-center justify-center gap-3 rounded-[10px]"
            style={{ width: 280, height: 54, fontSize: 13, textDecoration: 'none' }}
          >
            <span>✉</span>
            milenayor020@gmail.com
          </a>

        </div>
        </div>

        {/* FOOTER */}
        <div className="w-full max-w-[1100px] flex flex-col md:flex-row items-center justify-between gap-6 pt-8 pb-8" style={{ borderTop: '1px solid rgba(255,20,147,0.08)' }}>
          
          <span className="text-white text-[18px] font-bold font-['Hanken_Grotesk',sans-serif] tracking-[4px]" style={{ textShadow: '0 0 20px rgba(255,20,147,0.08)' }}>
            MILENA
          </span>

          <div className="flex items-center gap-6 flex-wrap justify-center">
            <a href="https://github.com/Milenaalvez" target="_blank" rel="noopener noreferrer" className="contact-footer-link">GitHub</a>
            <a href="https://www.behance.net/milenaalves39" target="_blank" rel="noopener noreferrer" className="contact-footer-link">Behance</a>
            <a href="https://www.linkedin.com/in/milenaalvez/" target="_blank" rel="noopener noreferrer" className="contact-footer-link">LinkedIn</a>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=milenayor020@gmail.com" target="_blank" rel="noopener noreferrer" className="contact-footer-link">Email</a>
          </div>

          <span className="text-[#A78BFA] text-[9px] font-['JetBrains_Mono',monospace] tracking-[1px]">© 2026 Milena Oliveira.</span>

        </div>

      </section>

    </main>
  );
}

export default App;
