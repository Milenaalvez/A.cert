export interface ArtigoItem {
  titulo: string;
  slug?: string;
}

export interface PassoItem {
  titulo: string;
  texto?: string;
  icone?: string;
  slug?: string;
}

export interface ArtigoDetalhe {
  slug: string;
  categoria: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  nivel: "iniciante" | "intermediario" | "avancado";
  tempo: string;
  icone: string;
  atualizado?: string;
  conteudo: {
    id: string;
    tipo: "hero" | "azul" | "verde" | "amarelo" | "timeline" | "problemas" | "veja-tambem" | "area" | "fluxograma" | "etapa";
    titulo?: string;
    subtitulo?: string;
    texto?: string;
    passos?: PassoItem[];
    problemas?: { q: string; a: string }[];
    links?: { titulo: string; slug: string; categoria?: string }[];
    icone?: string;
    itens?: string[];
    link?: { titulo: string; slug: string; categoria?: string };
  }[];
}

export interface Guia {
  slug: string;
  titulo: string;
  descricao: string;
  artigos: ArtigoItem[];
}

export const artigosDetalhes: Record<string, ArtigoDetalhe> = {
  "primeiros-passos/bem-vindo-a-acert": {
    slug: "bem-vindo-a-acert",
    categoria: "primeiros-passos",
    titulo: "Bem-vindo à A.CERT",
    subtitulo: "Artigo 1 — Primeiros passos",
    descricao: "A A.CERT foi desenvolvida para automatizar a emissão de certidões imobiliárias, centralizando toda a documentação de uma negociação em um único lugar. Neste guia você conhecerá os principais recursos da plataforma e entenderá como funciona o fluxo de trabalho.",
    nivel: "iniciante",
    tempo: "3 min de leitura",
    icone: "🚀",
    atualizado: "07/07/2026",
    conteudo: [
      {
        id: "o-que-e",
        tipo: "hero",
        titulo: "O que é a A.CERT?",
        texto: "A A.CERT é uma plataforma SaaS que centraliza negociações imobiliárias, organiza participantes, consulta órgãos públicos automaticamente e gera um PDF consolidado com todas as certidões. Tudo em um único lugar, sem processos manuais.",
      },
      {
        id: "como-funciona",
        tipo: "azul",
        titulo: "Como funciona?",
        texto: "A A.CERT organiza cada negociação dentro de um dossiê. A partir dele é possível cadastrar participantes, emitir certidões e gerar toda a documentação necessária para a transação.",
      },
      {
        id: "fluxo",
        tipo: "timeline",
        titulo: "Fluxo de trabalho",
        passos: [
          { titulo: "Crie um dossiê", texto: "Clique em \"+ Novo Dossiê\" no menu lateral e preencha as informações da transação." },
          { titulo: "Adicione participantes", texto: "Cadastre as pessoas envolvidas: proprietário, comprador, vendedor, locador ou locatário." },
          { titulo: "Emita certidões", texto: "Selecione os órgãos desejados e inicie a consulta automática. O sistema fará todo o trabalho." },
          { titulo: "Acompanhe os resultados", texto: "Monitore o status de cada certidão em tempo real e resolva CAPTCHAs quando necessário." },
          { titulo: "Gere o PDF", texto: "Compile todas as certidões em um dossiê PDF profissional, organizado por participante." },
        ],
      },
      {
        id: "resultado",
        tipo: "verde",
        titulo: "Resultado esperado",
        texto: "Ao final deste guia você compreenderá o funcionamento geral da plataforma e estará preparado para iniciar sua primeira negociação imobiliária com a A.CERT.",
      },
      {
        id: "boas-praticas",
        tipo: "amarelo",
        titulo: "Boas práticas",
        texto: "✔ Trabalhe sempre utilizando um dossiê para cada negociação.\n✔ Cadastre corretamente todos os participantes antes de emitir certidões.\n✔ Aguarde todas as consultas finalizarem antes de gerar o PDF final.",
      },
      {
        id: "problemas",
        tipo: "problemas",
        titulo: "Problemas comuns",
        problemas: [
          { q: "Não entendi por onde começar.", a: "Comece criando um dossiê. Ele é a unidade central de cada negociação na A.CERT." },
          { q: "Preciso cadastrar pessoas antes?", a: "Não. Você pode cadastrar as pessoas durante a criação do dossiê, na etapa de participantes." },
        ],
      },
      {
        id: "veja-tambem",
        tipo: "veja-tambem",
        links: [
          { titulo: "Primeiro acesso", slug: "primeiro-acesso" },
          { titulo: "Conhecendo o Dashboard", slug: "conhecendo-dashboard" },
          { titulo: "Fluxo completo da plataforma", slug: "fluxo-completo" },
        ],
      },
    ],
  },
  "primeiros-passos/primeiro-acesso": {
    slug: "primeiro-acesso",
    categoria: "primeiros-passos",
    titulo: "Primeiro acesso",
    subtitulo: "Artigo 2 — Primeiros passos",
    descricao: "Ao acessar a A.CERT pela primeira vez, algumas etapas iniciais são necessárias para garantir a segurança da sua conta e preparar sua experiência na plataforma. Neste artigo você aprenderá como concluir esse processo de forma rápida e segura.",
    nivel: "iniciante",
    tempo: "5 min de leitura",
    icone: "🔐",
    atualizado: "07/07/2026",
    conteudo: [
      {
        id: "oque-acontece",
        tipo: "hero",
        titulo: "O que acontece no primeiro acesso?",
        texto: "Ao receber suas credenciais de acesso, você será direcionado para realizar algumas configurações iniciais antes de começar a utilizar a plataforma. Estas etapas garantem que sua conta esteja segura e pronta para uso.",
      },
      {
        id: "quando-utilizar",
        tipo: "azul",
        titulo: "Quando utilizar?",
        texto: "Este procedimento deve ser realizado apenas no primeiro acesso de cada usuário ou sempre que uma senha provisória for redefinida por um administrador.",
      },
      {
        id: "antes-de-comecar",
        tipo: "amarelo",
        titulo: "Antes de começar",
        texto: "✔ Tenha em mãos seu e-mail cadastrado na empresa.\n✔ A senha temporária enviada pelo administrador.\n✔ Um navegador atualizado (Google Chrome, Microsoft Edge ou Mozilla Firefox).\n✔ Conexão estável com a internet.",
      },
      {
        id: "passo-a-passo",
        tipo: "timeline",
        titulo: "Passo a passo",
        passos: [
          { titulo: "1. Acesse a página de login", texto: "Abra a página de acesso da A.CERT utilizando o endereço fornecido pela sua empresa." },
          { titulo: "2. Informe seu e-mail", texto: "Digite o e-mail utilizado no cadastro da sua conta. Certifique-se de que ele esteja escrito corretamente." },
          { titulo: "3. Digite sua senha provisória", texto: "Utilize a senha enviada pelo administrador do sistema. Após realizar o login, a plataforma identificará que este é o seu primeiro acesso." },
          { titulo: "4. Crie uma nova senha", texto: "Por questões de segurança, será solicitado que você cadastre uma nova senha pessoal. Sua nova senha deve atender aos requisitos mínimos de segurança definidos pela empresa." },
          { titulo: "5. Confirme sua nova senha", texto: "Digite novamente a senha criada para confirmar as informações. Caso ambas sejam iguais, clique em Salvar para confirmar a alteração." },
          { titulo: "6. Conclua o acesso", texto: "Após salvar sua nova senha, você será redirecionado automaticamente para o Dashboard da A.CERT, onde poderá começar a utilizar a plataforma." },
        ],
      },
      {
        id: "primeira-experiencia",
        tipo: "azul",
        titulo: "Primeira experiência",
        texto: "Após concluir o primeiro acesso, a A.CERT poderá apresentar um breve Onboarding destacando as principais funcionalidades da plataforma, como a documentação completa, vídeos tutoriais e o canal de suporte para abertura de chamados. Esse guia rápido ajuda novos usuários a conhecerem os principais recursos disponíveis logo no início.",
      },
      {
        id: "resultado",
        tipo: "verde",
        titulo: "Resultado esperado",
        texto: "Ao concluir este artigo, sua conta estará configurada e pronta para utilização. Você poderá acessar normalmente todos os recursos disponíveis de acordo com as permissões do seu perfil.",
      },
      {
        id: "boas-praticas",
        tipo: "amarelo",
        titulo: "Boas práticas",
        texto: "✔ Utilize uma senha forte e exclusiva para sua conta.\n✔ Nunca compartilhe suas credenciais de acesso.\n✔ Sempre encerre sua sessão ao utilizar computadores compartilhados.\n✔ Mantenha seu e-mail atualizado para facilitar a recuperação de acesso.",
      },
      {
        id: "problemas",
        tipo: "problemas",
        titulo: "Problemas comuns",
        problemas: [
          { q: "Não recebi minhas credenciais", a: "Entre em contato com o administrador da empresa para verificar se seu usuário foi criado corretamente." },
          { q: "Esqueci minha senha", a: "Utilize a opção \"Esqueci minha senha\" disponível na tela de login ou solicite uma nova senha ao administrador." },
          { q: "Minha senha temporária não funciona", a: "Verifique se foi digitada corretamente, respeitando letras maiúsculas, minúsculas e caracteres especiais. Caso o problema persista, solicite uma nova senha." },
          { q: "Não consigo acessar a plataforma", a: "Confirme se o endereço da A.CERT está correto, se sua conexão com a internet está funcionando e se sua conta possui permissão de acesso." },
        ],
      },
      {
        id: "veja-tambem",
        tipo: "veja-tambem",
        links: [
          { titulo: "Bem-vindo à A.CERT", slug: "bem-vindo-a-acert" },
          { titulo: "Conhecendo o Dashboard", slug: "conhecendo-dashboard" },
          { titulo: "Navegando pelo sistema", slug: "navegando-sistema" },
          { titulo: "Fluxo completo da plataforma", slug: "fluxo-completo" },
        ],
      },
    ],
  },
  "primeiros-passos/conhecendo-dashboard": {
    slug: "conhecendo-dashboard",
    categoria: "primeiros-passos",
    titulo: "Conhecendo o Dashboard",
    subtitulo: "Artigo 3 — Primeiros passos",
    descricao: "Aprenda como interpretar cada área da tela inicial da A.CERT e descubra onde encontrar as principais informações para acompanhar suas negociações de forma rápida e organizada.",
    nivel: "iniciante",
    tempo: "6 min de leitura",
    icone: "🖥",
    atualizado: "07/07/2026",
    conteudo: [
      {
        id: "oque-e-dashboard",
        tipo: "hero",
        titulo: "O que é o Dashboard?",
        texto: "O Dashboard reúne em uma única tela um panorama geral da plataforma. Nele você encontra atalhos para as principais funcionalidades, indicadores da operação, acesso rápido aos módulos e informações relevantes para o seu dia a dia.",
      },
      {
        id: "conhecendo-areas",
        tipo: "hero",
        titulo: "Conhecendo cada área da tela",
        texto: "Cada seção do Dashboard foi projetada para oferecer acesso rápido às informações e funcionalidades mais importantes da plataforma.",
      },
      {
        id: "area-indicadores",
        tipo: "area",
        icone: "📊",
        titulo: "Indicadores",
        texto: "Mostram informações importantes sobre a utilização da plataforma, como quantidade de dossiês, certidões emitidas e demais dados relevantes para acompanhar o andamento das operações.",
      },
      {
        id: "area-menu-lateral",
        tipo: "area",
        icone: "📂",
        titulo: "Menu lateral",
        texto: "O menu lateral reúne todos os módulos da plataforma em um único local de fácil acesso.",
        itens: ["Dashboard", "Dossiês", "Pessoas", "Empresas", "Relatórios", "Configurações", "Central de Ajuda"],
      },
      {
        id: "area-barra-pesquisa",
        tipo: "area",
        icone: "🔍",
        titulo: "Barra de pesquisa",
        texto: "Permite localizar rapidamente informações dentro dos módulos da plataforma, agilizando a navegação e a busca por dados específicos.",
      },
      {
        id: "area-perfil-usuario",
        tipo: "area",
        icone: "👤",
        titulo: "Perfil do usuário",
        texto: "No canto superior direito é possível acessar informações da conta, configurações pessoais e realizar logout.",
      },
      {
        id: "area-central-ajuda",
        tipo: "area",
        icone: "📚",
        titulo: "Central de Ajuda",
        texto: "Sempre que surgir uma dúvida, a Central de Ajuda reúne documentações, vídeos tutoriais e suporte para que você encontre respostas rapidamente.",
      },
      {
        id: "dica-importante",
        tipo: "azul",
        titulo: "Dica importante",
        texto: "Quanto mais você utilizar o Dashboard como ponto de partida, mais rápido conseguirá acessar os recursos da plataforma sem precisar navegar por vários menus.",
      },
      {
        id: "resultado",
        tipo: "verde",
        titulo: "Resultado esperado",
        texto: "Ao concluir este artigo você será capaz de identificar todas as áreas do Dashboard e compreender a função de cada uma delas.",
      },
      {
        id: "boas-praticas",
        tipo: "amarelo",
        titulo: "Boas práticas",
        texto: "✔ Consulte os indicadores diariamente.\n✔ Utilize os atalhos disponíveis.\n✔ Mantenha atenção às notificações da plataforma.\n✔ Utilize a Central de Ajuda sempre que surgir alguma dúvida.",
      },
      {
        id: "problemas",
        tipo: "problemas",
        titulo: "Problemas comuns",
        problemas: [
          { q: "Não encontro determinada funcionalidade", a: "Verifique se ela está disponível no menu lateral ou utilize a barra de pesquisa." },
          { q: "Não visualizo alguns módulos", a: "Isso pode ocorrer devido ao perfil de acesso definido para seu usuário." },
        ],
      },
      {
        id: "veja-tambem",
        tipo: "veja-tambem",
        links: [
          { titulo: "Navegando pelo sistema", slug: "navegando-sistema" },
          { titulo: "Fluxo completo da plataforma", slug: "fluxo-completo" },
        ],
      },
    ],
  },
  "primeiros-passos/navegando-sistema": {
    slug: "navegando-sistema",
    categoria: "primeiros-passos",
    titulo: "Navegando pelo sistema",
    subtitulo: "Artigo 4 — Primeiros passos",
    descricao: "Conheça a estrutura de navegação da plataforma e descubra como localizar rapidamente cada recurso disponível na A.CERT.",
    nivel: "iniciante",
    tempo: "7 min de leitura",
    icone: "🧭",
    atualizado: "07/07/2026",
    conteudo: [
      {
        id: "como-navegacao-funciona",
        tipo: "hero",
        titulo: "Como a navegação funciona?",
        texto: "Toda a plataforma foi organizada em módulos, permitindo que você encontre cada funcionalidade de forma simples e intuitiva através do menu lateral, disponível em todas as telas do sistema.",
      },
      {
        id: "estrutura-modulos",
        tipo: "hero",
        titulo: "Estrutura dos módulos",
        texto: "Cada módulo da plataforma é acessível através do menu lateral e oferece funcionalidades específicas para a gestão imobiliária.",
      },
      {
        id: "area-dossies",
        tipo: "area",
        icone: "📂",
        titulo: "Dossiês",
        texto: "Gerencie negociações, acompanhe status e organize documentos de cada transação imobiliária.",
      },
      {
        id: "area-pessoas",
        tipo: "area",
        icone: "👥",
        titulo: "Pessoas",
        texto: "Cadastre participantes, consulte informações e gerencie relacionamentos entre pessoas e dossiês.",
      },
      {
        id: "area-empresas",
        tipo: "area",
        icone: "🏢",
        titulo: "Empresas",
        texto: "Administre empresas cadastradas e seus usuários, definindo permissões e licenças de acesso.",
      },
      {
        id: "area-relatorios",
        tipo: "area",
        icone: "📊",
        titulo: "Relatórios",
        texto: "Visualize indicadores e acompanhe resultados da operação através de relatórios detalhados.",
      },
      {
        id: "area-configuracoes",
        tipo: "area",
        icone: "⚙",
        titulo: "Configurações",
        texto: "Personalize a plataforma conforme as necessidades da empresa, ajustando preferências regionais e de sistema.",
      },
      {
        id: "area-central-ajuda",
        tipo: "area",
        icone: "📚",
        titulo: "Central de Ajuda",
        texto: "Acesse documentações, vídeos e suporte sempre que necessário para tirar dúvidas sobre a plataforma.",
      },
      {
        id: "fluxo-navegacao",
        tipo: "timeline",
        titulo: "Fluxo de navegação",
        passos: [
          { titulo: "Dashboard", texto: "Ponto de partida para todas as operações da plataforma." },
          { titulo: "Selecionar módulo", texto: "Escolha o módulo desejado no menu lateral para acessar suas funcionalidades." },
          { titulo: "Executar ação", texto: "Realize a operação necessária dentro do módulo selecionado." },
          { titulo: "Salvar", texto: "Confirme as alterações antes de prosseguir para garantir que os dados sejam armazenados." },
          { titulo: "Retornar ao Dashboard", texto: "Utilize o menu lateral ou o breadcrumb para voltar à tela inicial." },
        ],
      },
      {
        id: "dica-importante",
        tipo: "azul",
        titulo: "Dica importante",
        texto: "Utilize sempre o menu lateral como principal forma de navegação. Todos os módulos da plataforma podem ser acessados por ele, e os breadcrumbs ajudam a manter a orientação dentro do sistema.",
      },
      {
        id: "resultado",
        tipo: "verde",
        titulo: "Resultado esperado",
        texto: "Ao concluir este artigo você será capaz de navegar por toda a plataforma com segurança, encontrando rapidamente cada funcionalidade disponível.",
      },
      {
        id: "boas-praticas",
        tipo: "amarelo",
        titulo: "Boas práticas",
        texto: "✔ Trabalhe um módulo por vez para manter o foco.\n✔ Salve as alterações antes de trocar de tela.\n✔ Utilize os breadcrumbs para saber onde está dentro do sistema.",
      },
      {
        id: "problemas",
        tipo: "problemas",
        titulo: "Problemas comuns",
        problemas: [
          { q: "Voltei para a tela errada", a: "Utilize o breadcrumb no topo da página para retornar rapidamente à tela anterior." },
          { q: "Não encontro um módulo", a: "Verifique se possui permissão para acessá-lo. As permissões são definidas pelo administrador da empresa." },
        ],
      },
      {
        id: "veja-tambem",
        tipo: "veja-tambem",
        links: [
          { titulo: "Conhecendo o Dashboard", slug: "conhecendo-dashboard" },
          { titulo: "Fluxo completo da plataforma", slug: "fluxo-completo" },
        ],
      },
    ],
  },
  "primeiros-passos/fluxo-completo": {
    slug: "fluxo-completo",
    categoria: "primeiros-passos",
    titulo: "Fluxo completo da plataforma",
    subtitulo: "Artigo 5 — Primeiros passos",
    descricao: "Entenda como funciona toda a jornada de uma negociação dentro da A.CERT e descubra como os módulos trabalham em conjunto para automatizar o processo de emissão de certidões imobiliárias.",
    nivel: "iniciante",
    tempo: "8 min de leitura",
    icone: "🔄",
    atualizado: "07/07/2026",
    conteudo: [
      {
        id: "como-funciona",
        tipo: "hero",
        titulo: "Como funciona a A.CERT?",
        texto: "A A.CERT organiza todas as etapas da negociação em um fluxo contínuo. Cada ação realizada na plataforma alimenta a próxima etapa, garantindo que todas as informações permaneçam centralizadas e organizadas durante todo o processo.",
      },
      {
        id: "fluxo",
        tipo: "fluxograma",
        titulo: "Fluxo completo",
        passos: [
          { icone: "📂", titulo: "Criar dossiê" },
          { icone: "👥", titulo: "Adicionar participantes" },
          { icone: "📜", titulo: "Emitir certidões" },
          { icone: "⏳", titulo: "Acompanhar processamento" },
          { icone: "📄", titulo: "Gerar PDF" },
          { icone: "✅", titulo: "Finalizar negociação" },
        ],
      },
      {
        id: "entendendo-etapas",
        tipo: "hero",
        titulo: "Entendendo cada etapa",
        texto: "Cada fase do processo representa uma ação importante dentro da plataforma. Conhecer cada uma delas é essencial para utilizar a A.CERT de forma eficiente.",
      },
      {
        id: "etapa-criar-dossie",
        tipo: "etapa",
        icone: "📂",
        titulo: "Criar um dossiê",
        texto: "O dossiê é o ponto de partida da negociação. É nele que serão centralizadas todas as informações da operação, incluindo o tipo de transação, o imóvel e os participantes envolvidos.",
        link: { titulo: "Ler artigo completo", slug: "criando-dossie", categoria: "dossies" },
      },
      {
        id: "etapa-participantes",
        tipo: "etapa",
        icone: "👥",
        titulo: "Adicionar participantes",
        texto: "Cadastre as pessoas envolvidas na negociação: proprietário, comprador, vendedor, locador ou locatário. O CPF de cada participante é validado automaticamente pelo sistema.",
        link: { titulo: "Ler artigo completo", slug: "cadastrando-pessoas", categoria: "pessoas" },
      },
      {
        id: "etapa-emitir-certidoes",
        tipo: "etapa",
        icone: "📜",
        titulo: "Emitir certidões",
        texto: "Selecione os órgãos desejados e inicie a consulta automática. O sistema navegará pelos sites oficiais, preencherá os formulários e capturará os documentos necessários.",
        link: { titulo: "Ler artigo completo", slug: "emitindo-certidoes", categoria: "emissao-certidoes" },
      },
      {
        id: "etapa-acompanhar",
        tipo: "etapa",
        icone: "⏳",
        titulo: "Acompanhar processamento",
        texto: "Monitore o status de cada certidão em tempo real. Resolva os CAPTCHAs quando solicitado e aguarde a conclusão de todas as consultas antes de prosseguir.",
        link: { titulo: "Ler artigo completo", slug: "emitindo-certidoes", categoria: "emissao-certidoes" },
      },
      {
        id: "etapa-gerar-pdf",
        tipo: "etapa",
        icone: "📄",
        titulo: "Gerar PDF",
        texto: "Compile todas as certidões em um dossiê PDF profissional, organizado por participante e pronto para compartilhamento com as partes envolvidas na negociação.",
        link: { titulo: "Ler artigo completo", slug: "gerando-baixando-pdfs", categoria: "dossies-pdf" },
      },
      {
        id: "etapa-finalizar",
        tipo: "etapa",
        icone: "✅",
        titulo: "Finalizar negociação",
        texto: "Com todas as certidões emitidas e o dossiê gerado, a negociação está documentada e pronta para ser concluída com segurança jurídica.",
      },
      {
        id: "dica-importante",
        tipo: "azul",
        titulo: "Dica importante",
        texto: "A plataforma foi projetada para seguir esse fluxo naturalmente. Evitar pular etapas reduz erros e garante que toda a documentação seja gerada corretamente ao final da negociação.",
      },
      {
        id: "resultado",
        tipo: "verde",
        titulo: "Resultado esperado",
        texto: "Ao finalizar este artigo, você compreenderá como cada módulo da A.CERT se conecta e estará preparado para utilizar a plataforma de forma completa e organizada em suas negociações imobiliárias.",
      },
      {
        id: "boas-praticas",
        tipo: "amarelo",
        titulo: "Boas práticas",
        texto: "✔ Crie um novo dossiê para cada negociação.\n✔ Cadastre todos os participantes antes de emitir certidões.\n✔ Acompanhe o status das consultas antes de gerar o PDF.\n✔ Revise as informações antes de finalizar o processo.",
      },
      {
        id: "problemas",
        tipo: "problemas",
        titulo: "Problemas comuns",
        problemas: [
          { q: "As certidões não foram emitidas", a: "Verifique se todos os participantes obrigatórios foram cadastrados e se não existem pendências nas consultas em andamento." },
          { q: "O PDF não foi gerado", a: "Confirme se todas as certidões foram concluídas antes de solicitar a geração do documento. Certidões pendentes impedem a geração do dossiê." },
        ],
      },
      {
        id: "veja-tambem",
        tipo: "veja-tambem",
        links: [
          { titulo: "O que é um dossiê?", slug: "o-que-e-dossie" },
          { titulo: "Criando um dossiê", slug: "criando-dossie" },
          { titulo: "Emissão de certidões", slug: "emitindo-certidoes" },
          { titulo: "Dossiês e PDF", slug: "gerando-baixando-pdfs" },
        ],
      },
    ],
  },
  "dossies/o-que-e-dossie": {
    slug: "o-que-e-dossie",
    categoria: "dossies",
    titulo: "O que é um dossiê?",
    subtitulo: "Artigo 1 — Dossiês",
    descricao: "Entenda o conceito de dossiê na A.CERT e descubra como ele organiza todas as informações de uma negociação imobiliária em um único lugar.",
    nivel: "iniciante",
    tempo: "4 min de leitura",
    icone: "📂",
    conteudo: [
      { id: "oque-e", tipo: "hero", titulo: "O que é um dossiê?", texto: "O dossiê é a unidade central de trabalho na A.CERT. Ele representa uma negociação imobiliária completa — seja uma venda ou uma locação — e centraliza todas as informações, documentos e certidões relacionadas àquela transação." },
      { id: "para-que-serve", tipo: "azul", titulo: "Para que serve?", texto: "O dossiê organiza cada negociação de forma estruturada. Dentro dele você gerencia os participantes envolvidos, o imóvel da transação, as certidões que precisam ser emitidas e o PDF final consolidado. Tudo fica vinculado e rastreável." },
      { id: "elementos", tipo: "timeline", titulo: "Elementos de um dossiê", passos: [
        { titulo: "Tipo de transação", texto: "Define se é uma venda ou locação, determinando quais papéis os participantes terão na negociação." },
        { titulo: "Imóvel", texto: "Identificação da propriedade objeto da negociação, podendo incluir matrícula para certidões adicionais." },
        { titulo: "Participantes", texto: "Pessoas físicas ou jurídicas envolvidas, cada uma com seu papel específico na transação." },
        { titulo: "Certidões", texto: "Documentos emitidos pelos órgãos públicos, organizados por participante dentro do dossiê." },
        { titulo: "PDF consolidado", texto: "Documento final que reúne todas as certidões e informações em um único arquivo profissional." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Ao final deste artigo, você compreenderá o que é um dossiê e como ele serve como estrutura central para organizar todas as suas negociações na A.CERT." },
      { id: "boas-praticas", tipo: "amarelo", titulo: "Boas práticas", texto: "✔ Crie um dossiê para cada negociação, mesmo as mais simples.\n✔ Mantenha as informações do dossiê sempre atualizadas.\n✔ Verifique se todos os participantes foram vinculados corretamente." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "Qual a diferença entre dossiê e certidão?", a: "O dossiê é o processo completo da negociação. As certidões são documentos individuais emitidos dentro dele." },
        { q: "Posso ter mais de um dossiê para o mesmo imóvel?", a: "Sim. Cada negociação (venda, locação) deve ter seu próprio dossiê, mesmo que seja o mesmo imóvel." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [
        { titulo: "Criando um dossiê", slug: "criando-dossie" },
        { titulo: "Tipos de transação", slug: "tipos-transacao" },
      ]},
    ],
  },
  "dossies/criando-dossie": {
    slug: "criando-dossie",
    categoria: "dossies",
    titulo: "Criando um dossiê",
    subtitulo: "Artigo 2 — Dossiês",
    descricao: "Aprenda o passo a passo completo para criar um dossiê imobiliário na A.CERT, desde a escolha do tipo de transação até a revisão final.",
    nivel: "iniciante",
    tempo: "6 min de leitura",
    icone: "📂",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Criando um dossiê", texto: "A criação de um dossiê é o primeiro passo para organizar uma negociação imobiliária na A.CERT. O processo é guiado por um modal com 4 etapas que garantem que todas as informações necessárias sejam coletadas antes de iniciar a emissão de certidões." },
      { id: "pre-requisitos", tipo: "amarelo", titulo: "Antes de começar", texto: "✔ Tenha em mãos os dados do imóvel (endereço, matrícula se houver).\n✔ CPF de todos os participantes da negociação.\n✔ Defina o tipo de transação: venda ou locação." },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Passo a passo", passos: [
        { titulo: "1. Acesse Dossiês", texto: "No menu lateral, clique em Dossiês para abrir a lista de dossiês já cadastrados." },
        { titulo: "2. Clique em Novo Dossiê", texto: "No canto superior direito, clique no botão laranja \"+ Novo Dossiê\" para abrir o modal de criação." },
        { titulo: "3. Escolha o tipo de transação", texto: "Selecione Venda ou Locação. Esta escolha define quais papéis os participantes terão (comprador/vendedor ou locador/locatário)." },
        { titulo: "4. Informe o imóvel", texto: "Preencha o identificador do imóvel. Se ele possuir matrícula registrada em cartório, marque a opção \"Possui matrícula\" para obter certidões adicionais." },
        { titulo: "5. Adicione os participantes", texto: "Cadastre as pessoas envolvidas na negociação. O CPF de cada uma é validado automaticamente. Atribua o papel correto a cada participante." },
        { titulo: "6. Revise e confirme", texto: "Confira todas as informações na etapa de revisão. Se tudo estiver correto, clique em Criar Dossiê para finalizar." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Seu dossiê será criado e aparecerá na lista de Dossiês. A partir dele você poderá gerenciar participantes, emitir certidões e gerar o PDF consolidado." },
      { id: "boas-praticas", tipo: "amarelo", titulo: "Boas práticas", texto: "✔ Confira o CPF de cada participante antes de salvar.\n✔ Só marque \"Possui matrícula\" se o imóvel realmente tiver registro em cartório.\n✔ Revise todas as informações na etapa final antes de confirmar." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "O CPF não foi validado", a: "Verifique se o número foi digitado corretamente, sem pontos ou traços. O sistema valida automaticamente." },
        { q: "Esqueci de adicionar um participante", a: "Você pode editar o dossiê depois de criado e adicionar novos participantes a qualquer momento." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [
        { titulo: "O que é um dossiê?", slug: "o-que-e-dossie" },
        { titulo: "Tipos de transação", slug: "tipos-transacao" },
        { titulo: "Gerenciando participantes", slug: "gerenciando-participantes" },
      ]},
    ],
  },
  "dossies/tipos-transacao": {
    slug: "tipos-transacao",
    categoria: "dossies",
    titulo: "Tipos de transação",
    subtitulo: "Artigo 3 — Dossiês",
    descricao: "Entenda as diferenças entre Venda e Locação na A.CERT e saiba qual tipo de transação escolher para cada negociação imobiliária.",
    nivel: "iniciante",
    tempo: "4 min de leitura",
    icone: "📂",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Tipos de transação", texto: "Ao criar um dossiê, a primeira decisão é escolher o tipo de transação: Venda ou Locação. Esta escolha define quais papéis os participantes terão e influencia todo o fluxo do dossiê." },
      { id: "venda", tipo: "azul", titulo: "Venda", texto: "Na transação de venda, os participantes assumem os papéis de Proprietário (vendedor) e Comprador. Este tipo é utilizado para negociações de compra e venda de imóveis, onde as certidões comprovam a situação jurídica do vendedor e do imóvel." },
      { id: "locacao", tipo: "verde", titulo: "Locação", texto: "Na transação de locação, os participantes assumem os papéis de Proprietário (locador) e Locatário. Este tipo é utilizado para contratos de aluguel, onde as certidões comprovam a situação jurídica do locador e do imóvel a ser alugado." },
      { id: "diferencas", tipo: "timeline", titulo: "Principais diferenças", passos: [
        { titulo: "Participantes", texto: "Na venda: Proprietário + Comprador. Na locação: Proprietário + Locatário. O papel do proprietário é o mesmo em ambas." },
        { titulo: "Finalidade", texto: "Venda: transferência de propriedade. Locação: cessão de uso por tempo determinado." },
        { titulo: "Documentos", texto: "Ambos os tipos emitem as mesmas certidões. A diferença está apenas na organização dos participantes no dossiê." },
      ]},
      { id: "boas-praticas", tipo: "amarelo", titulo: "Boas práticas", texto: "✔ Escolha o tipo correto antes de adicionar os participantes.\n✔ Se houver mais de um proprietário ou comprador, adicione todos na etapa de participantes.\n✔ Verifique se os papéis estão corretos antes de finalizar." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "Escolhi o tipo errado, e agora?", a: "Você pode editar o tipo de transação do dossiê a qualquer momento. Acesse o dossiê e clique em Editar." },
        { q: "Posso mudar de venda para locação depois?", a: "Sim. Ao alterar o tipo, os papéis dos participantes serão atualizados automaticamente." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [
        { titulo: "O que é um dossiê?", slug: "o-que-e-dossie" },
        { titulo: "Criando um dossiê", slug: "criando-dossie" },
      ]},
    ],
  },
  "dossies/editando-dossie": {
    slug: "editando-dossie",
    categoria: "dossies",
    titulo: "Editando um dossiê",
    subtitulo: "Artigo 4 — Dossiês",
    descricao: "Aprenda como modificar informações de um dossiê já criado, incluindo tipo de transação, participantes, imóvel e status.",
    nivel: "iniciante",
    tempo: "4 min de leitura",
    icone: "📂",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Editando um dossiê", texto: "Após criar um dossiê, você pode precisar ajustar informações como o tipo de transação, adicionar ou remover participantes, alterar dados do imóvel ou atualizar o status. Todas essas edições podem ser feitas a qualquer momento." },
      { id: "como-editar", tipo: "timeline", titulo: "Como editar um dossiê", passos: [
        { titulo: "1. Acesse o dossiê", texto: "Na lista de Dossiês, clique sobre o identificador do dossiê que deseja editar para abrir a página de detalhes." },
        { titulo: "2. Abra o modo de edição", texto: "Clique no botão de edição (ícone de lápis) ou no menu de ações do dossiê e selecione a opção de editar." },
        { titulo: "3. Faça as alterações", texto: "Modifique as informações necessárias: tipo de transação, dados do imóvel, participantes ou status do dossiê." },
        { titulo: "4. Salve as mudanças", texto: "Após concluir as alterações, clique em Salvar para que as modificações sejam aplicadas ao dossiê." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "As alterações serão salvas e o dossiê será atualizado imediatamente. Todas as informações vinculadas, como participantes e certidões, permanecem intactas." },
      { id: "cuidados", tipo: "amarelo", titulo: "Cuidados ao editar", texto: "✔ Ao alterar o tipo de transação, verifique se os papéis dos participantes continuam corretos.\n✔ Se remover um participante, as certidões já emitidas para ele permanecem no dossiê.\n✔ Alterações no imóvel não afetam certidões já emitidas." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "Não consigo editar um dossiê", a: "Verifique se você possui permissão de edição. Apenas usuários com permissões adequadas podem modificar dossiês." },
        { q: "As alterações não foram salvas", a: "Certifique-se de clicar em Salvar após fazer as modificações. Se o problema persistir, verifique sua conexão." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [
        { titulo: "Criando um dossiê", slug: "criando-dossie" },
        { titulo: "Status do dossiê", slug: "status-dossie" },
      ]},
    ],
  },
  "dossies/status-dossie": {
    slug: "status-dossie",
    categoria: "dossies",
    titulo: "Status do dossiê",
    subtitulo: "Artigo 5 — Dossiês",
    descricao: "Entenda o que significa cada status de um dossiê e como gerenciar o ciclo de vida da sua negociação na A.CERT.",
    nivel: "iniciante",
    tempo: "4 min de leitura",
    icone: "📂",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Status do dossiê", texto: "Cada dossiê na A.CERT possui um status que indica em que etapa da negociação ele se encontra. Entender cada status ajuda a gerenciar melhor suas operações e priorizar as atividades pendentes." },
      { id: "status-em-andamento", tipo: "area", icone: "📊", titulo: "Em andamento", texto: "O dossiê está ativo e em processamento. Certidões estão sendo emitidas ou ainda há etapas pendentes para conclusão." },
      { id: "status-pendente", tipo: "area", icone: "⚠", titulo: "Pendente", texto: "Existem ações que precisam ser resolvidas antes de prosseguir, como a resolução de CAPTCHAs ou a conclusão de consultas que falharam." },
      { id: "status-concluido", tipo: "area", icone: "✅", titulo: "Concluído", texto: "Todas as certidões foram emitidas com sucesso e o dossiê está finalizado. O PDF consolidado pode ser gerado a qualquer momento." },
      { id: "status-cancelado", tipo: "area", icone: "📂", titulo: "Cancelado", texto: "O dossiê foi descontinuado e não terá prosseguimento. Ele permanece no sistema para consulta histórica." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Ao final deste artigo, você saberá identificar cada status de dossiê e entenderá como gerenciar o ciclo de vida das suas negociações." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "Meu dossiê está pendente há muito tempo", a: "Verifique se existem CAPTCHAs não resolvidos ou consultas que falharam e precisam ser retentadas." },
        { q: "Posso reabrir um dossiê concluído?", a: "Sim. Acesse o dossiê e altere o status manualmente se precisar emitir novas certidões." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [
        { titulo: "Editando um dossiê", slug: "editando-dossie" },
        { titulo: "Excluindo um dossiê", slug: "excluindo-dossie" },
      ]},
    ],
  },
  "dossies/excluindo-dossie": {
    slug: "excluindo-dossie",
    categoria: "dossies",
    titulo: "Excluindo um dossiê",
    subtitulo: "Artigo 6 — Dossiês",
    descricao: "Saiba como excluir um dossiê da A.CERT, entenda o que acontece com os dados vinculados e como recuperar um dossiê da lixeira.",
    nivel: "iniciante",
    tempo: "3 min de leitura",
    icone: "📂",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Excluindo um dossiê", texto: "A exclusão de um dossiê na A.CERT é um processo seguro: o dossiê é movido para a Lixeira, onde permanece por 30 dias antes da remoção permanente. Durante esse período, ele pode ser restaurado a qualquer momento." },
      { id: "atencao", tipo: "amarelo", titulo: "Atenção", texto: "✔ Ao excluir um dossiê, ele não é removido imediatamente — vai para a Lixeira.\n✔ Após 30 dias na Lixeira, o dossiê é excluído permanentemente.\n✔ Certidões já emitidas permanecem armazenadas no sistema." },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Como excluir um dossiê", passos: [
        { titulo: "1. Acesse o dossiê", texto: "Na lista de Dossiês, localize o dossiê que deseja excluir." },
        { titulo: "2. Abra o menu de ações", texto: "Clique nos três pontos ao lado do dossiê para abrir o menu de opções disponíveis." },
        { titulo: "3. Selecione Mover para Lixeira", texto: "Escolha a opção de mover para a lixeira. Uma confirmação será solicitada." },
        { titulo: "4. Confirme a exclusão", texto: "Revise a mensagem de confirmação e clique em confirmar para mover o dossiê para a lixeira." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "O dossiê será movido para a Lixeira e não aparecerá mais na lista principal. Você pode acessar a Lixeira a qualquer momento para restaurar ou excluir permanentemente." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "Excluí um dossiê por engano", a: "Acesse a Lixeira no menu lateral e restaure o dossiê. Ele voltará para a lista principal com todos os dados." },
        { q: "Não consigo excluir um dossiê", a: "Verifique se você possui permissão para excluir. Alguns perfis de acesso podem ter essa ação restrita." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [
        { titulo: "Lixeira e recuperação", slug: "lixeira-recuperacao" },
        { titulo: "Status do dossiê", slug: "status-dossie" },
      ]},
    ],
  },
  "dossies/gerenciando-participantes": {
    slug: "gerenciando-participantes",
    categoria: "dossies",
    titulo: "Gerenciando participantes",
    subtitulo: "Artigo 7 — Dossiês",
    descricao: "Aprenda como adicionar, remover e editar participantes dentro de um dossiê, atribuindo os papéis corretos para cada tipo de transação.",
    nivel: "iniciante",
    tempo: "5 min de leitura",
    icone: "👥",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Gerenciando participantes", texto: "Os participantes são as pessoas físicas ou jurídicas envolvidas na negociação. Gerenciá-los corretamente é essencial para que as certidões sejam emitidas para as pessoas certas e o dossiê fique organizado." },
      { id: "como-funciona", tipo: "azul", titulo: "Como funciona?", texto: "Cada participante recebe um papel dentro do dossiê: Proprietário, Comprador, Vendedor, Locador ou Locatário. O papel define quais certidões serão emitidas para aquela pessoa e como ela aparece no PDF final." },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Gerenciando participantes", passos: [
        { titulo: "Adicionar participante", texto: "Na página do dossiê, clique em Adicionar Participante e preencha os dados da pessoa. O CPF é validado automaticamente." },
        { titulo: "Atribuir papel", texto: "Selecione o papel correto para o participante de acordo com o tipo de transação: Proprietário, Comprador, Vendedor, Locador ou Locatário." },
        { titulo: "Remover participante", texto: "Se um participante foi adicionado por engano, você pode removê-lo. As certidões já emitidas para ele serão mantidas no dossiê." },
        { titulo: "Editar informações", texto: "Caso precise corrigir dados de um participante, acesse a página de Pessoas e edite o cadastro. As alterações refletirão em todos os dossiês vinculados." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Seu dossiê estará com todos os participantes corretamente cadastrados e vinculados, pronto para a emissão de certidões." },
      { id: "boas-praticas", tipo: "amarelo", titulo: "Boas práticas", texto: "✔ Verifique o CPF de cada participante antes de salvar.\n✔ Atribua o papel correto — isso afeta diretamente as certidões emitidas.\n✔ Mantenha os dados cadastrais dos participantes sempre atualizados." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "O participante não aparece na lista de pessoas", a: "Cadastre a pessoa primeiro na seção Pessoas do menu lateral. Depois ela estará disponível para ser vinculada ao dossiê." },
        { q: "Atribuí o papel errado a um participante", a: "Edite o dossiê e altere o papel do participante. Os dados não serão perdidos." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [
        { titulo: "Criando um dossiê", slug: "criando-dossie" },
        { titulo: "Cadastrando pessoas", slug: "cadastrando-pessoas" },
      ]},
    ],
  },
  "pessoas/cadastrando-uma-pessoa": {
    slug: "cadastrando-uma-pessoa", categoria: "pessoas", titulo: "Cadastrando uma pessoa", subtitulo: "Artigo 1 — Pessoas",
    descricao: "Aprenda como cadastrar uma pessoa física na A.CERT, preenchendo todos os dados necessários para emissão de certidões e vinculação a dossiês.",
    nivel: "iniciante", tempo: "5 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Cadastrando uma pessoa", texto: "O cadastro de pessoas é essencial para a A.CERT, pois cada certidão é emitida para uma pessoa específica. Quanto mais completo o cadastro, maior a taxa de sucesso nas consultas aos órgãos públicos." },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Passo a passo", passos: [
        { titulo: "1. Acesse Pessoas", texto: "No menu lateral, clique em Pessoas. A lista exibe todos os cadastros já realizados." },
        { titulo: "2. Clique em Nova Pessoa", texto: "No canto superior direito, clique no botão laranja \"Nova Pessoa\" para abrir o formulário." },
        { titulo: "3. Preencha os dados obrigatórios", texto: "Informe nome completo, CPF, data de nascimento e nome da mãe. O CPF é validado automaticamente." },
        { titulo: "4. Adicione informações complementares", texto: "Preencha email, telefone, endereço e outros dados de contato. Esses dados enriquecem o cadastro." },
        { titulo: "5. Salve o cadastro", texto: "Revise as informações e clique em Salvar. A pessoa ficará disponível para vinculação a dossiês." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "A pessoa estará cadastrada e disponível para emissão de certidões e vinculação a dossiês." },
      { id: "boas-praticas", tipo: "amarelo", titulo: "Boas práticas", texto: "✔ Preencha todos os campos disponíveis — dados completos aumentam a taxa de acerto.\n✔ Confira o CPF antes de salvar para evitar retrabalho.\n✔ Mantenha os cadastros atualizados sempre que houver mudança de dados." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "O CPF não foi aceito", a: "Verifique se o número foi digitado sem pontos ou traços. O CPF precisa ser válido e ter 11 dígitos." },
        { q: "Já existe uma pessoa com este CPF", a: "O sistema não permite CPFs duplicados. Verifique se a pessoa já foi cadastrada." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Pessoa Física x Pessoa Jurídica", slug: "pessoa-fisica-x-juridica" }, { titulo: "Editando um cadastro", slug: "editando-um-cadastro" }] },
    ],
  },
  "pessoas/pessoa-fisica-x-juridica": {
    slug: "pessoa-fisica-x-juridica", categoria: "pessoas", titulo: "Pessoa Física x Pessoa Jurídica", subtitulo: "Artigo 2 — Pessoas",
    descricao: "Entenda as diferenças entre cadastrar uma pessoa física e uma pessoa jurídica e saiba quando usar cada tipo.",
    nivel: "iniciante", tempo: "3 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Pessoa Física x Jurídica", texto: "A A.CERT permite cadastrar dois tipos: físicas (CPF) e jurídicas (CNPJ). Cada tipo possui campos específicos e é utilizado em contextos diferentes nas negociações." },
      { id: "pessoa-fisica", tipo: "azul", titulo: "Pessoa Física", texto: "Representa um indivíduo. Utiliza CPF como identificador. É o tipo mais comum para proprietários, compradores e locatários. Campos: nome, CPF, data de nascimento, nome da mãe e dados de contato." },
      { id: "pessoa-juridica", tipo: "verde", titulo: "Pessoa Jurídica", texto: "Representa uma empresa. Utiliza CNPJ como identificador. Usada quando uma empresa é parte da negociação — imobiliária, construtora, etc. Campos: razão social, CNPJ, nome fantasia e dados de contato." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você saberá quando cadastrar cada tipo de pessoa e quais informações são necessárias." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "Posso mudar de PF para PJ depois?", a: "Não. Crie um novo cadastro com o tipo correto." },
        { q: "Uma empresa pode ser participante?", a: "Sim. Pessoas jurídicas podem ser vinculadas com os mesmos papéis disponíveis para PF." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Cadastrando uma pessoa", slug: "cadastrando-uma-pessoa" }, { titulo: "Vinculando participantes ao dossiê", slug: "vinculando-participantes-ao-dossie" }] },
    ],
  },
  "pessoas/editando-um-cadastro": {
    slug: "editando-um-cadastro", categoria: "pessoas", titulo: "Editando um cadastro", subtitulo: "Artigo 3 — Pessoas",
    descricao: "Aprenda como modificar os dados de uma pessoa já cadastrada, mantendo as informações sempre atualizadas.",
    nivel: "iniciante", tempo: "3 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Editando um cadastro", texto: "Manter os cadastros atualizados é fundamental para garantir que as certidões sejam emitidas com dados corretos. A edição reflete em todos os dossiês vinculados." },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Como editar", passos: [
        { titulo: "1. Localize a pessoa", texto: "Na lista de Pessoas, use a barra de busca para encontrar a pessoa pelo nome, CPF ou email." },
        { titulo: "2. Abra os detalhes", texto: "Clique sobre o nome para abrir o painel lateral com todas as informações." },
        { titulo: "3. Faça as alterações", texto: "Modifique os campos necessários. Todos os dados podem ser editados, exceto o tipo (PF/PJ) e CPF/CNPJ." },
        { titulo: "4. Salve", texto: "As alterações serão aplicadas em todos os dossiês e certidões vinculados." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Os dados estarão atualizados em todo o sistema, incluindo dossiês existentes e futuras emissões." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Cadastrando uma pessoa", slug: "cadastrando-uma-pessoa" }, { titulo: "Histórico da pessoa", slug: "historico-da-pessoa" }] },
    ],
  },
  "pessoas/relacionamentos": {
    slug: "relacionamentos", categoria: "pessoas", titulo: "Relacionamentos", subtitulo: "Artigo 4 — Pessoas",
    descricao: "Entenda como criar e gerenciar vínculos entre pessoas, como relações de parentesco ou dependência.",
    nivel: "intermediario", tempo: "3 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Relacionamentos", texto: "A A.CERT permite criar vínculos entre pessoas cadastradas, como cônjuge, dependente ou procurador. Esses relacionamentos ajudam a organizar as informações familiares." },
      { id: "como-criar", tipo: "timeline", titulo: "Como criar", passos: [
        { titulo: "1. Acesse o cadastro", texto: "Na lista de Pessoas, clique sobre o nome para abrir o painel de detalhes." },
        { titulo: "2. Vá até Relacionamentos", texto: "No painel, localize a seção de relacionamentos e clique em Adicionar." },
        { titulo: "3. Selecione a pessoa", texto: "Busque e selecione a pessoa com quem deseja criar o vínculo." },
        { titulo: "4. Defina o tipo", texto: "Escolha o tipo: cônjuge, dependente, procurador, entre outros." },
        { titulo: "5. Salve", texto: "O vínculo ficará visível no cadastro de ambas as pessoas." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "O vínculo estará registrado e visível nos cadastros das duas pessoas." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Histórico da pessoa", slug: "historico-da-pessoa" }, { titulo: "Editando um cadastro", slug: "editando-um-cadastro" }] },
    ],
  },
  "pessoas/historico-da-pessoa": {
    slug: "historico-da-pessoa", categoria: "pessoas", titulo: "Histórico da pessoa", subtitulo: "Artigo 5 — Pessoas",
    descricao: "Acompanhe todo o histórico de uma pessoa: dossiês vinculados, certidões emitidas e alterações cadastrais.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Histórico da pessoa", texto: "Cada pessoa possui um histórico completo: dossiês em que participa, certidões emitidas em seu nome e alterações cadastrais. Tudo organizado cronologicamente." },
      { id: "oque-ver", tipo: "azul", titulo: "O que você encontra", texto: "O painel de detalhes exibe: dossiês vinculados com status, certidões emitidas em cada dossiê, data da última atualização e relacionamentos com outras pessoas." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Visão completa da participação da pessoa em todas as negociações da plataforma." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Editando um cadastro", slug: "editando-um-cadastro" }, { titulo: "Relacionamentos", slug: "relacionamentos" }] },
    ],
  },
  "pessoas/vinculando-participantes-ao-dossie": {
    slug: "vinculando-participantes-ao-dossie", categoria: "pessoas", titulo: "Vinculando participantes ao dossiê", subtitulo: "Artigo 6 — Pessoas",
    descricao: "Aprenda como vincular pessoas a um dossiê, atribuindo os papéis corretos para cada tipo de transação.",
    nivel: "iniciante", tempo: "4 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Vinculando participantes", texto: "Para que as certidões sejam emitidas corretamente, cada pessoa deve estar vinculada ao dossiê com o papel adequado. A vinculação acontece durante a criação ou edição do dossiê." },
      { id: "papeis", tipo: "area", icone: "📂", titulo: "Papéis disponíveis", texto: "Cada tipo de transação define os papéis:", itens: ["Venda: Proprietário, Comprador", "Locação: Proprietário, Locatário", "O Proprietário é comum a ambos os tipos"] },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Como vincular", passos: [
        { titulo: "1. Abra o dossiê", texto: "Acesse o dossiê onde deseja adicionar participantes, durante a criação ou na edição." },
        { titulo: "2. Vá até Participantes", texto: "Busque a pessoa pelo nome ou CPF na etapa de participantes." },
        { titulo: "3. Selecione o papel", texto: "Atribua o papel correto de acordo com o tipo de transação." },
        { titulo: "4. Confirme", texto: "Salve o dossiê. A pessoa estará vinculada e apta para emissão de certidões." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "A pessoa estará vinculada ao dossiê e pronta para ter suas certidões emitidas." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Criando um dossiê", slug: "criando-dossie", categoria: "dossies" }, { titulo: "Gerenciando participantes", slug: "gerenciando-participantes", categoria: "dossies" }] },
    ],
  },
  "emissao-certidoes/como-emitir-certidoes": {
    slug: "como-emitir-certidoes", categoria: "emissao-certidoes", titulo: "Como emitir certidões", subtitulo: "Artigo 1 — Emissão de Certidões",
    descricao: "Aprenda o passo a passo para emitir certidões, desde a seleção da pessoa até a conclusão das consultas.",
    nivel: "intermediario", tempo: "6 min de leitura", icone: "📜",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Como emitir certidões", texto: "A emissão de certidões é o principal diferencial da A.CERT. O sistema automatiza a consulta a diversos órgãos públicos, navegando pelos sites oficiais, preenchendo formulários e capturando os documentos — tudo enquanto você acompanha em tempo real." },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Passo a passo", passos: [
        { titulo: "1. Acesse Certidões", texto: "No menu lateral, clique em Certidões para abrir a tela de consulta." },
        { titulo: "2. Selecione a pessoa", texto: "Busque a pessoa para quem deseja emitir as certidões. Os dados serão preenchidos automaticamente." },
        { titulo: "3. Escolha os órgãos", texto: "Marque os órgãos desejados: Receita Federal, TRF1, TJDFT, TRT, TST, SEFAZ-DF e ONR." },
        { titulo: "4. Inicie a consulta", texto: "Clique em Consultar. O sistema abrirá o navegador automaticamente." },
        { titulo: "5. Resolva os CAPTCHAs", texto: "Quando solicitado, resolva os CAPTCHAs que aparecerem. Fique atento ao popup do navegador." },
        { titulo: "6. Acompanhe o status", texto: "Cada órgão mostrará seu status em tempo real até a conclusão." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "As certidões serão emitidas e estarão disponíveis para download, vinculadas à pessoa e ao dossiê." },
      { id: "boas-praticas", tipo: "amarelo", titulo: "Boas práticas", texto: "✔ Não minimize o navegador durante as consultas.\n✔ Resolva os CAPTCHAs rapidamente para evitar timeout.\n✔ Verifique os PDFs emitidos para confirmar que estão corretos." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "A consulta ficou travada", a: "Verifique se há CAPTCHAs não resolvidos. Se o problema persistir, retente a consulta." },
        { q: "Uma certidão retornou com erro", a: "Cada órgão tem seu próprio status. Você pode retentar apenas aquele órgão específico." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como funciona a consulta automática", slug: "como-funciona-consulta-automatica" }, { titulo: "Acompanhando o status", slug: "acompanhando-o-status" }] },
    ],
  },
  "emissao-certidoes/como-funciona-consulta-automatica": {
    slug: "como-funciona-consulta-automatica", categoria: "emissao-certidoes", titulo: "Como funciona a consulta automática", subtitulo: "Artigo 2 — Emissão de Certidões",
    descricao: "Entenda como a A.CERT automatiza as consultas aos órgãos públicos utilizando tecnologia de navegação web.",
    nivel: "intermediario", tempo: "4 min de leitura", icone: "📜",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Como funciona", texto: "A A.CERT utiliza automação de navegador para acessar os sites oficiais de cada órgão, preencher os formulários com os dados da pessoa e capturar os PDFs resultantes. Múltiplos órgãos são consultados simultaneamente." },
      { id: "etapas", tipo: "timeline", titulo: "Etapas da consulta", passos: [
        { titulo: "Navegação", texto: "O sistema abre o site do órgão e navega até a página de consulta de certidões." },
        { titulo: "Preenchimento", texto: "Os dados da pessoa são inseridos automaticamente nos formulários do órgão." },
        { titulo: "CAPTCHA", texto: "Se o órgão exigir CAPTCHA, o sistema pausa e aguarda você resolver manualmente." },
        { titulo: "Captura", texto: "Após a consulta, o documento PDF é capturado e salvo no sistema." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você entenderá como o sistema realiza as consultas de forma automatizada, economizando horas de trabalho manual." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como emitir certidões", slug: "como-emitir-certidoes" }, { titulo: "Órgãos Integrados", slug: "receita-federal", categoria: "orgaos-integrados" }] },
    ],
  },
  "emissao-certidoes/acompanhando-o-status": {
    slug: "acompanhando-o-status", categoria: "emissao-certidoes", titulo: "Acompanhando o status", subtitulo: "Artigo 3 — Emissão de Certidões",
    descricao: "Saiba como interpretar os diferentes status das consultas e o que fazer em cada situação.",
    nivel: "iniciante", tempo: "3 min de leitura", icone: "📜",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Status das consultas", texto: "Durante a emissão, cada órgão exibe um status em tempo real. Entender cada um ajuda a gerenciar o processo e agir rapidamente." },
      { id: "status-list", tipo: "area", icone: "📊", titulo: "Status possíveis", texto: "Cada consulta passa por diferentes estados:", itens: ["Aguardando — na fila para iniciar", "Processando — navegando no site do órgão", "Aguardando CAPTCHA — precisa da sua intervenção", "Concluído — certidão emitida com sucesso", "Erro — falha na consulta, requer retentativa"] },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você saberá interpretar cada status e agir adequadamente para garantir todas as certidões." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como emitir certidões", slug: "como-emitir-certidoes" }, { titulo: "Retentando uma consulta", slug: "retentando-uma-consulta" }] },
    ],
  },
  "emissao-certidoes/certidoes-por-participante": {
    slug: "certidoes-por-participante", categoria: "emissao-certidoes", titulo: "Certidões por participante", subtitulo: "Artigo 4 — Emissão de Certidões",
    descricao: "Entenda como as certidões são organizadas por participante dentro de cada dossiê.",
    nivel: "intermediario", tempo: "3 min de leitura", icone: "📜",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Certidões por participante", texto: "Cada certidão é vinculada a um participante específico do dossiê. Em dossiês com múltiplos participantes, cada um terá suas certidões organizadas separadamente no PDF final." },
      { id: "como-funciona", tipo: "azul", titulo: "Como funciona?", texto: "Ao selecionar uma pessoa para emissão, o sistema vincula automaticamente as certidões ao participante correspondente. No PDF final, as certidões aparecem organizadas por participante." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Dossiê organizado com certidões de cada participante claramente identificadas e separadas." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como emitir certidões", slug: "como-emitir-certidoes" }, { titulo: "Gerenciando participantes", slug: "gerenciando-participantes", categoria: "dossies" }] },
    ],
  },
  "emissao-certidoes/retentando-uma-consulta": {
    slug: "retentando-uma-consulta", categoria: "emissao-certidoes", titulo: "Retentando uma consulta", subtitulo: "Artigo 5 — Emissão de Certidões",
    descricao: "Aprenda como retentar uma consulta que falhou por erro no site, CAPTCHA não resolvido ou instabilidade.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "📜",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Retentando consultas", texto: "Nem sempre uma consulta é concluída na primeira tentativa. A A.CERT permite retentar apenas os órgãos que falharam, sem duplicar certidões já emitidas." },
      { id: "como-retentar", tipo: "timeline", titulo: "Como retentar", passos: [
        { titulo: "1. Identifique as falhas", texto: "Na tela de acompanhamento, os órgãos com erro aparecem marcados em vermelho." },
        { titulo: "2. Clique em Retentar", texto: "Ao lado do órgão com falha, clique no botão de retentar." },
        { titulo: "3. Acompanhe", texto: "O sistema processará apenas os órgãos selecionados, mantendo as certidões já emitidas." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Apenas os órgãos com falha serão processados novamente." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Acompanhando o status", slug: "acompanhando-o-status" }, { titulo: "Como emitir certidões", slug: "como-emitir-certidoes" }] },
    ],
  },
  "emissao-certidoes/download-das-certidoes": {
    slug: "download-das-certidoes", categoria: "emissao-certidoes", titulo: "Download das certidões", subtitulo: "Artigo 6 — Emissão de Certidões",
    descricao: "Saiba como baixar as certidões emitidas em PDF, individualmente ou em lote.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "📜",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Baixando certidões", texto: "Após a emissão, cada certidão fica disponível em PDF. Você pode baixar individualmente ou gerar o dossiê completo." },
      { id: "como-baixar", tipo: "timeline", titulo: "Como baixar", passos: [
        { titulo: "Download individual", texto: "Na tela de Certidões, cada certidão concluída exibe um botão de download. Clique para baixar o PDF." },
        { titulo: "Dossiê completo", texto: "No dossiê, clique em Gerar Dossiê PDF para compilar todas as certidões em um único arquivo." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Os arquivos estarão salvos, prontos para compartilhamento e arquivamento." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como emitir certidões", slug: "como-emitir-certidoes" }, { titulo: "Estrutura do dossiê", slug: "estrutura-do-dossie", categoria: "dossies-pdf" }] },
    ],
  },
  "emissao-certidoes/interpretando-os-resultados": {
    slug: "interpretando-os-resultados", categoria: "emissao-certidoes", titulo: "Interpretando os resultados", subtitulo: "Artigo 7 — Emissão de Certidões",
    descricao: "Aprenda a interpretar os resultados das certidões e entenda o que cada documento significa.",
    nivel: "avancado", tempo: "5 min de leitura", icone: "📜",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Interpretando resultados", texto: "Cada certidão contém informações específicas sobre a situação jurídica, fiscal ou trabalhista da pessoa. Saber interpretar esses documentos é essencial para decisões informadas." },
      { id: "tipos", tipo: "area", icone: "📊", titulo: "O que cada certidão significa", texto: "Cada órgão emite um tipo específico:", itens: ["Receita Federal — situação fiscal do CPF/CNPJ", "TRF1 — certidões cíveis e criminais federais", "TJDFT — certidões de distribuição cível", "TRT — certidões trabalhistas", "TST — certidões da Justiça do Trabalho", "SEFAZ-DF — débitos fiscais estaduais", "ONR — ônus reais e matrícula do imóvel"] },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você será capaz de interpretar cada certidão emitida e compreender seu impacto na negociação." },
      { id: "boas-praticas", tipo: "amarelo", titulo: "Boas práticas", texto: "✔ Confira nome, CPF e data de emissão em cada certidão.\n✔ Verifique a validade — algumas têm prazo de expiração.\n✔ Consulte um profissional jurídico em caso de dúvidas sobre os resultados." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como emitir certidões", slug: "como-emitir-certidoes" }, { titulo: "Órgãos Integrados", slug: "receita-federal", categoria: "orgaos-integrados" }] },
    ],
  },
  "orgaos-integrados/receita-federal": {
    slug: "receita-federal", categoria: "orgaos-integrados", titulo: "Receita Federal", subtitulo: "Artigo 1 — Órgãos Integrados",
    descricao: "Saiba qual certidão é emitida pela Receita Federal e quando utilizá-la na sua negociação imobiliária.",
    nivel: "iniciante", tempo: "3 min de leitura", icone: "🏛",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Receita Federal", texto: "A consulta à Receita Federal verifica a situação cadastral e fiscal do CPF ou CNPJ da pessoa consultada. É uma das certidões mais importantes para qualquer negociação imobiliária." },
      { id: "oque-emite", tipo: "azul", titulo: "O que é emitido?", texto: "A certidão da Receita Federal comprova a regularidade fiscal e cadastral da pessoa. Ela mostra se o CPF ou CNPJ está ativo e se existem pendências junto à Receita Federal." },
      { id: "quando-usar", tipo: "verde", titulo: "Quando utilizar?", texto: "Esta certidão deve ser emitida para todos os participantes da negociação: proprietário, comprador, vendedor, locador e locatário. É um documento básico exigido em praticamente todas as transações imobiliárias." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "A certidão da Receita Federal estará disponível em PDF, comprovando a situação fiscal do participante." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "TJDFT", slug: "tjdft" }, { titulo: "TRF1", slug: "trf1" }] },
    ],
  },
  "orgaos-integrados/tjdft": {
    slug: "tjdft", categoria: "orgaos-integrados", titulo: "TJDFT", subtitulo: "Artigo 2 — Órgãos Integrados",
    descricao: "Entenda a certidão de distribuição cível emitida pelo Tribunal de Justiça do Distrito Federal.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "🏛",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "TJDFT", texto: "O Tribunal de Justiça do Distrito Federal e Territórios emite certidões de distribuição cível, que mostram se existem processos judiciais em nome da pessoa consultada." },
      { id: "oque-emite", tipo: "azul", titulo: "O que é emitido?", texto: "A certidão do TJDFT lista os processos cíveis em que a pessoa figura como parte. É um documento essencial para verificar o histórico judicial do participante." },
      { id: "quando-usar", tipo: "verde", titulo: "Quando utilizar?", texto: "Recomendada para todos os participantes, especialmente em transações de venda, para verificar se o vendedor possui ações judiciais que possam impactar a negociação." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Receita Federal", slug: "receita-federal" }, { titulo: "TRF1", slug: "trf1" }] },
    ],
  },
  "orgaos-integrados/trf1": {
    slug: "trf1", categoria: "orgaos-integrados", titulo: "TRF1", subtitulo: "Artigo 3 — Órgãos Integrados",
    descricao: "Conheça as certidões cíveis e criminais emitidas pelo Tribunal Regional Federal da 1ª Região.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "🏛",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "TRF1", texto: "O Tribunal Regional Federal da 1ª Região emite certidões da Justiça Federal, tanto cíveis quanto criminais, abrangendo processos em âmbito federal." },
      { id: "oque-emite", tipo: "azul", titulo: "O que é emitido?", texto: "A consulta ao TRF1 gera duas certidões: cível e criminal. A cível verifica processos federais não-criminais. A criminal verifica a existência de ações penais federais." },
      { id: "quando-usar", tipo: "verde", titulo: "Quando utilizar?", texto: "Emita para todos os participantes. A certidão criminal é particularmente importante para transações de maior valor ou exigidas por instituições financeiras." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "TJDFT", slug: "tjdft" }, { titulo: "TRT", slug: "trt-10-regiao" }] },
    ],
  },
  "orgaos-integrados/trt-10-regiao": {
    slug: "trt-10-regiao", categoria: "orgaos-integrados", titulo: "TRT 10ª Região", subtitulo: "Artigo 4 — Órgãos Integrados",
    descricao: "Saiba sobre a certidão trabalhista emitida pelo Tribunal Regional do Trabalho da 10ª Região.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "🏛",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "TRT 10ª Região", texto: "O Tribunal Regional do Trabalho da 10ª Região emite certidões que verificam a existência de processos trabalhistas em nome da pessoa consultada." },
      { id: "oque-emite", tipo: "azul", titulo: "O que é emitido?", texto: "A certidão do TRT mostra se a pessoa possui reclamações trabalhistas registradas. É fundamental para avaliar passivos trabalhistas de pessoas físicas e jurídicas." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "TST", slug: "tst" }, { titulo: "TRF1", slug: "trf1" }] },
    ],
  },
  "orgaos-integrados/tst": {
    slug: "tst", categoria: "orgaos-integrados", titulo: "TST", subtitulo: "Artigo 5 — Órgãos Integrados",
    descricao: "Entenda a certidão emitida pelo Tribunal Superior do Trabalho e sua importância na negociação.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "🏛",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "TST", texto: "O Tribunal Superior do Trabalho é a instância máxima da Justiça do Trabalho. Sua certidão verifica processos em grau de recurso em nome da pessoa consultada." },
      { id: "oque-emite", tipo: "azul", titulo: "O que é emitido?", texto: "A certidão do TST complementa a do TRT, verificando processos que já chegaram à instância superior da Justiça do Trabalho." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "TRT 10ª Região", slug: "trt-10-regiao" }, { titulo: "SEFAZ-DF", slug: "sefaz-df" }] },
    ],
  },
  "orgaos-integrados/sefaz-df": {
    slug: "sefaz-df", categoria: "orgaos-integrados", titulo: "SEFAZ-DF", subtitulo: "Artigo 6 — Órgãos Integrados",
    descricao: "Conheça a certidão de débitos fiscais estaduais emitida pela Secretaria de Fazenda do Distrito Federal.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "🏛",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "SEFAZ-DF", texto: "A Secretaria de Estado de Fazenda do Distrito Federal emite certidões que verificam a existência de débitos fiscais estaduais em nome da pessoa ou empresa." },
      { id: "oque-emite", tipo: "azul", titulo: "O que é emitido?", texto: "A certidão da SEFAZ-DF comprova a regularidade fiscal estadual. Ela mostra se existem débitos de ICMS, IPVA ou outros tributos estaduais pendentes." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Receita Federal", slug: "receita-federal" }, { titulo: "ONR", slug: "onr" }] },
    ],
  },
  "orgaos-integrados/onr": {
    slug: "onr", categoria: "orgaos-integrados", titulo: "ONR", subtitulo: "Artigo 7 — Órgãos Integrados",
    descricao: "Saiba sobre a certidão de ônus reais emitida pelo Operador Nacional do Registro de Imóveis.",
    nivel: "iniciante", tempo: "3 min de leitura", icone: "🏛",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "ONR", texto: "O Operador Nacional do Registro de Imóveis emite certidões sobre ônus reais que recaem sobre o imóvel, como hipotecas, alienações fiduciárias e penhoras." },
      { id: "oque-emite", tipo: "azul", titulo: "O que é emitido?", texto: "A certidão de ônus reais mostra todos os gravames registrados sobre a matrícula do imóvel. É essencial para verificar se o imóvel está livre para venda ou se existem restrições." },
      { id: "pre-requisito", tipo: "amarelo", titulo: "Importante", texto: "✔ Esta certidão só está disponível para imóveis com matrícula registrada.\n✔ Ao criar o dossiê, marque a opção \"Possui matrícula\" para habilitar esta consulta.\n✔ Tenha o número da matrícula em mãos." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Matrícula e ficha cadastral", slug: "matricula-e-ficha-cadastral" }, { titulo: "Como emitir certidões", slug: "como-emitir-certidoes", categoria: "emissao-certidoes" }] },
    ],
  },
  "orgaos-integrados/matricula-e-ficha-cadastral": {
    slug: "matricula-e-ficha-cadastral", categoria: "orgaos-integrados", titulo: "Matrícula e ficha cadastral", subtitulo: "Artigo 8 — Órgãos Integrados",
    descricao: "Entenda a certidão de matrícula e ficha cadastral do imóvel emitida pelo cartório de registro.",
    nivel: "intermediario", tempo: "3 min de leitura", icone: "🏛",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Matrícula e ficha cadastral", texto: "Além da certidão de ônus reais, a A.CERT também pode emitir a matrícula atualizada e a ficha cadastral do imóvel. Estes documentos complementam as informações sobre a propriedade." },
      { id: "matricula", tipo: "azul", titulo: "Matrícula do imóvel", texto: "A matrícula é o documento que identifica oficialmente o imóvel no cartório de registro. Ela contém todo o histórico de transações e eventuais ônus que recaem sobre a propriedade." },
      { id: "ficha", tipo: "verde", titulo: "Ficha cadastral", texto: "A ficha cadastral contém informações complementares sobre o imóvel, incluindo dados da construção, área, localização e demais características registradas." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "ONR", slug: "onr" }, { titulo: "Como emitir certidões", slug: "como-emitir-certidoes", categoria: "emissao-certidoes" }] },
    ],
  },
  "dossies-pdf/como-gerar-um-pdf": {
    slug: "como-gerar-um-pdf", categoria: "dossies-pdf", titulo: "Como gerar um PDF", subtitulo: "Artigo 1 — Dossiês e PDF",
    descricao: "Aprenda como gerar o PDF consolidado do dossiê, reunindo todas as certidões em um único documento profissional.",
    nivel: "iniciante", tempo: "4 min de leitura", icone: "📄",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Gerando o dossiê PDF", texto: "O PDF do dossiê é o produto final da A.CERT: um documento profissional que compila todas as certidões emitidas, organizado por participante e pronto para compartilhamento com as partes envolvidas na negociação." },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Como gerar o PDF", passos: [
        { titulo: "1. Acesse o dossiê", texto: "Na lista de Dossiês, clique sobre o identificador para abrir a página de detalhes." },
        { titulo: "2. Verifique as certidões", texto: "Confirme se todas as certidões necessárias foram emitidas. Certidões pendentes não serão incluídas no PDF." },
        { titulo: "3. Clique em Gerar Dossiê PDF", texto: "O sistema compilará automaticamente todas as certidões em um único arquivo." },
        { titulo: "4. Baixe o arquivo", texto: "Após a geração, o PDF estará disponível para download imediato." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "O dossiê PDF estará gerado com todas as certidões, organizado e pronto para compartilhamento." },
      { id: "problemas", tipo: "problemas", titulo: "Problemas comuns", problemas: [
        { q: "O PDF não foi gerado", a: "Verifique se todas as certidões estão concluídas. Certidões pendentes ou com erro impedem a geração." },
        { q: "Faltam certidões no PDF", a: "Certifique-se de que todas as certidões foram emitidas antes de gerar. Você pode gerar novamente a qualquer momento." },
      ]},
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Estrutura do dossiê", slug: "estrutura-do-dossie" }, { titulo: "Baixando arquivos", slug: "baixando-arquivos" }] },
    ],
  },
  "dossies-pdf/estrutura-do-dossie": {
    slug: "estrutura-do-dossie", categoria: "dossies-pdf", titulo: "Estrutura do dossiê", subtitulo: "Artigo 2 — Dossiês e PDF",
    descricao: "Conheça a estrutura completa do dossiê PDF e entenda como cada seção é organizada.",
    nivel: "iniciante", tempo: "4 min de leitura", icone: "📄",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Estrutura do dossiê", texto: "O dossiê PDF é dividido em seções claramente organizadas. Cada parte foi projetada para apresentar as informações de forma profissional e de fácil compreensão para todas as partes da negociação." },
      { id: "secoes", tipo: "area", icone: "📊", titulo: "Seções do dossiê", texto: "O PDF é organizado nas seguintes seções:", itens: ["Capa — tipo de transação e identificação do dossiê", "Participantes — lista com nome, CPF e papel de cada um", "Certidões por participante — cada pessoa com seus documentos", "Informações do imóvel — dados da propriedade", "Resumo — tabela com status de todas as certidões"] },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você conhecerá a estrutura completa do dossiê e saberá encontrar cada informação no documento final." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como gerar um PDF", slug: "como-gerar-um-pdf" }, { titulo: "Compartilhando documentos", slug: "compartilhando-documentos" }] },
    ],
  },
  "dossies-pdf/compartilhando-documentos": {
    slug: "compartilhando-documentos", categoria: "dossies-pdf", titulo: "Compartilhando documentos", subtitulo: "Artigo 3 — Dossiês e PDF",
    descricao: "Saiba como compartilhar o dossiê PDF e as certidões individuais com clientes e parceiros.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "📄",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Compartilhando documentos", texto: "Após gerar o dossiê PDF ou baixar as certidões individuais, você pode compartilhar os documentos por email, aplicativos de mensagem ou serviços de armazenamento em nuvem." },
      { id: "formatos", tipo: "azul", titulo: "Formatos disponíveis", texto: "Todos os documentos são gerados em formato PDF, compatível com qualquer dispositivo. O dossiê completo reúne todas as certidões em um único arquivo. As certidões individuais permitem compartilhar apenas o documento relevante." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você saberá como compartilhar os documentos de forma profissional com todas as partes envolvidas." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Baixando arquivos", slug: "baixando-arquivos" }, { titulo: "Como gerar um PDF", slug: "como-gerar-um-pdf" }] },
    ],
  },
  "dossies-pdf/baixando-arquivos": {
    slug: "baixando-arquivos", categoria: "dossies-pdf", titulo: "Baixando arquivos", subtitulo: "Artigo 4 — Dossiês e PDF",
    descricao: "Aprenda como baixar e organizar os arquivos PDF gerados pela A.CERT no seu computador.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "📄",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Baixando arquivos", texto: "A A.CERT permite baixar cada documento individualmente ou o dossiê completo em PDF. Todos os arquivos são salvos com nomes padronizados para facilitar a organização." },
      { id: "como-baixar", tipo: "timeline", titulo: "Como baixar", passos: [
        { titulo: "Certidão individual", texto: "Na tela de Certidões, clique no botão de download ao lado de cada certidão concluída." },
        { titulo: "Dossiê completo", texto: "Na página do dossiê, clique em Gerar Dossiê PDF e depois baixe o arquivo gerado." },
        { titulo: "Regenerar PDF", texto: "Se novas certidões forem emitidas, você pode gerar o PDF novamente para incluir os documentos mais recentes." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Os arquivos estarão salvos no seu computador, organizados e prontos para uso." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como gerar um PDF", slug: "como-gerar-um-pdf" }, { titulo: "Compartilhando documentos", slug: "compartilhando-documentos" }] },
    ],
  },
  "dossies-pdf/atualizando-um-pdf": {
    slug: "atualizando-um-pdf", categoria: "dossies-pdf", titulo: "Atualizando um PDF", subtitulo: "Artigo 5 — Dossiês e PDF",
    descricao: "Saiba como atualizar o dossiê PDF após emitir novas certidões ou modificar informações do dossiê.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "📄",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Atualizando o PDF", texto: "Sempre que novas certidões são emitidas ou informações do dossiê são alteradas, você pode regenerar o PDF para manter o documento sempre atualizado." },
      { id: "como-atualizar", tipo: "azul", titulo: "Como atualizar", texto: "Basta acessar o dossiê e clicar novamente em Gerar Dossiê PDF. O sistema compilará todas as certidões atuais, incluindo as novas, em um arquivo atualizado. O PDF anterior não é alterado — um novo arquivo é gerado." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você terá um PDF sempre atualizado com a versão mais recente de todas as certidões do dossiê." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como gerar um PDF", slug: "como-gerar-um-pdf" }, { titulo: "Baixando arquivos", slug: "baixando-arquivos" }] },
    ],
  },
  "relatorios/visao-geral": {
    slug: "visao-geral", categoria: "relatorios", titulo: "Visão geral", subtitulo: "Artigo 1 — Relatórios",
    descricao: "Conheça a central de relatórios da A.CERT e entenda como utilizá-la para acompanhar os indicadores da sua operação.",
    nivel: "intermediario", tempo: "3 min de leitura", icone: "📊",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Visão geral dos relatórios", texto: "A central de relatórios da A.CERT oferece uma visão completa dos indicadores da sua operação. Você pode gerar relatórios de dossiês, certidões, produtividade da equipe e dados cadastrais." },
      { id: "tipos", tipo: "area", icone: "📊", titulo: "Tipos de relatórios disponíveis", texto: "A plataforma oferece diferentes visões:", itens: ["Dossiês — visão geral das negociações", "Certidões — quantidade e status das emissões", "Produtividade — desempenho da equipe", "Cadastros — pessoas e imóveis registrados"] },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você conhecerá os tipos de relatórios disponíveis e saberá quando utilizar cada um." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Filtros", slug: "filtros" }, { titulo: "Exportação", slug: "exportacao" }] },
    ],
  },
  "relatorios/filtros": {
    slug: "filtros", categoria: "relatorios", titulo: "Filtros", subtitulo: "Artigo 2 — Relatórios",
    descricao: "Aprenda a aplicar filtros nos relatórios para obter dados precisos por período, status ou responsável.",
    nivel: "intermediario", tempo: "3 min de leitura", icone: "📊",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Filtros nos relatórios", texto: "Os filtros permitem refinar os dados dos relatórios para obter exatamente as informações que você precisa. Você pode filtrar por período, status do dossiê, usuário responsável ou tipo de transação." },
      { id: "como-usar", tipo: "azul", titulo: "Como usar os filtros", texto: "Na tela de Relatórios, selecione o tipo de relatório desejado e utilize os filtros disponíveis no topo da página. Você pode combinar múltiplos filtros para refinar ainda mais os resultados. Após aplicar os filtros, o relatório será atualizado automaticamente." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você conseguirá gerar relatórios precisos e personalizados para sua necessidade." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Visão geral", slug: "visao-geral" }, { titulo: "Indicadores", slug: "indicadores" }] },
    ],
  },
  "relatorios/exportacao": {
    slug: "exportacao", categoria: "relatorios", titulo: "Exportação", subtitulo: "Artigo 3 — Relatórios",
    descricao: "Saiba como exportar os relatórios em PDF ou CSV para compartilhar com sua equipe ou clientes.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "📊",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Exportando relatórios", texto: "Após gerar um relatório, você pode exportá-lo em formato PDF ou CSV. O PDF é ideal para apresentações e compartilhamento com clientes. O CSV permite análise dos dados em planilhas." },
      { id: "formatos", tipo: "azul", titulo: "Formatos disponíveis", texto: "PDF: documento formatado, pronto para impressão e compartilhamento. CSV: dados brutos em formato tabular, compatível com Excel e Google Sheets para análises personalizadas." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você terá os relatórios exportados no formato desejado, prontos para uso externo." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Filtros", slug: "filtros" }, { titulo: "Métricas", slug: "metricas" }] },
    ],
  },
  "relatorios/indicadores": {
    slug: "indicadores", categoria: "relatorios", titulo: "Indicadores", subtitulo: "Artigo 4 — Relatórios",
    descricao: "Entenda os principais indicadores disponíveis nos relatórios e como interpretá-los.",
    nivel: "intermediario", tempo: "3 min de leitura", icone: "📊",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Indicadores", texto: "Os relatórios da A.CERT apresentam indicadores-chave sobre sua operação. Entender cada um deles ajuda a tomar decisões mais informadas sobre a gestão dos seus dossiês." },
      { id: "principais", tipo: "area", icone: "📊", titulo: "Principais indicadores", texto: "Os relatórios incluem:", itens: ["Dossiês criados — total de novas negociações", "Dossiês concluídos — negociações finalizadas", "Taxa de conclusão — eficiência do processo", "Certidões emitidas — volume de documentos gerados", "Tempo médio — duração das consultas"] },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você saberá interpretar os indicadores e utilizá-los para melhorar seus processos." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Visão geral", slug: "visao-geral" }, { titulo: "Métricas", slug: "metricas" }] },
    ],
  },
  "relatorios/metricas": {
    slug: "metricas", categoria: "relatorios", titulo: "Métricas", subtitulo: "Artigo 5 — Relatórios",
    descricao: "Aprenda a utilizar as métricas dos relatórios para acompanhar o desempenho da sua operação ao longo do tempo.",
    nivel: "avancado", tempo: "3 min de leitura", icone: "📊",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Métricas da operação", texto: "Além dos indicadores pontuais, a A.CERT oferece métricas de tendência que mostram a evolução da sua operação ao longo do tempo. Isso permite identificar padrões e oportunidades de melhoria." },
      { id: "como-usar", tipo: "azul", titulo: "Como utilizar", texto: "Acompanhe as métricas semanalmente para identificar tendências. Se a taxa de conclusão está caindo, pode ser necessário revisar os processos. Se o volume de certidões está aumentando, sua operação está crescendo." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você utilizará as métricas para tomar decisões baseadas em dados e melhorar continuamente seus processos." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Indicadores", slug: "indicadores" }, { titulo: "Exportação", slug: "exportacao" }] },
    ],
  },
  "usuarios-empresas/cadastro-de-empresas": {
    slug: "cadastro-de-empresas", categoria: "usuarios-empresas", titulo: "Cadastro de empresas", subtitulo: "Artigo 1 — Usuários e Empresas",
    descricao: "Aprenda como cadastrar uma nova empresa na A.CERT e configurar suas licenças de acesso.",
    nivel: "avancado", tempo: "4 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Cadastro de empresas", texto: "O módulo de Empresas permite gerenciar múltiplas organizações na A.CERT. Cada empresa possui seus próprios usuários, configurações e licenças de acesso." },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Como cadastrar", passos: [
        { titulo: "1. Acesse Empresas", texto: "No menu lateral, clique em Empresas para ver a lista de empresas cadastradas." },
        { titulo: "2. Clique em Nova Empresa", texto: "Preencha os dados: nome, CNPJ, plano e data de expiração da licença." },
        { titulo: "3. Configure as licenças", texto: "Defina o plano (Basic, Pro, Enterprise) e o status (Ativa, Trial, Expirada)." },
        { titulo: "4. Salve", texto: "A empresa será criada e estará pronta para receber usuários vinculados." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "A empresa estará cadastrada e disponível para gerenciamento de usuários e configurações." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Licenças", slug: "licencas" }, { titulo: "Criando usuários", slug: "criando-usuarios" }] },
    ],
  },
  "usuarios-empresas/criando-usuarios": {
    slug: "criando-usuarios", categoria: "usuarios-empresas", titulo: "Criando usuários", subtitulo: "Artigo 2 — Usuários e Empresas",
    descricao: "Saiba como criar novos usuários na A.CERT, definir cargos e enviar credenciais de acesso.",
    nivel: "avancado", tempo: "4 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Criando usuários", texto: "Cada pessoa que utiliza a A.CERT precisa de um usuário configurado. Os administradores podem criar novos usuários, definir seus cargos e permissões, e enviar as credenciais de acesso." },
      { id: "passo-a-passo", tipo: "timeline", titulo: "Como criar um usuário", passos: [
        { titulo: "1. Acesse Usuários", texto: "No menu lateral, clique em Usuários." },
        { titulo: "2. Clique em Novo Usuário", texto: "Preencha nome, email, cargo e departamento." },
        { titulo: "3. Defina as permissões", texto: "Configure quais módulos o usuário terá acesso: visualizar, criar, editar e excluir." },
        { titulo: "4. Envie as credenciais", texto: "O sistema enviará automaticamente um email com a senha provisória para o primeiro acesso." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "O usuário receberá suas credenciais e poderá acessar a plataforma com as permissões definidas." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Perfis e permissões", slug: "perfis-e-permissoes" }, { titulo: "Reenvio de credenciais", slug: "reenvio-de-credenciais" }] },
    ],
  },
  "usuarios-empresas/perfis-e-permissoes": {
    slug: "perfis-e-permissoes", categoria: "usuarios-empresas", titulo: "Perfis e permissões", subtitulo: "Artigo 3 — Usuários e Empresas",
    descricao: "Entenda como funcionam os perfis de acesso e as permissões granulares na A.CERT.",
    nivel: "avancado", tempo: "3 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Perfis e permissões", texto: "A A.CERT possui um sistema flexível de permissões. Cada usuário pode ter acesso granular a cada módulo: visualizar, criar, editar e excluir. Isso permite configurar exatamente o que cada pessoa pode fazer." },
      { id: "como-funciona", tipo: "azul", titulo: "Como funciona?", texto: "As permissões são definidas por módulo (Dossiês, Pessoas, Certidões, etc.) e por ação (visualizar, criar, editar, excluir). Um corretor pode ter permissão para criar dossiês e visualizar pessoas, mas não para excluir ou gerenciar configurações." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você saberá configurar permissões adequadas para cada perfil de usuário na sua empresa." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Criando usuários", slug: "criando-usuarios" }, { titulo: "Licenças", slug: "licencas" }] },
    ],
  },
  "usuarios-empresas/licencas": {
    slug: "licencas", categoria: "usuarios-empresas", titulo: "Licenças", subtitulo: "Artigo 4 — Usuários e Empresas",
    descricao: "Entenda como funciona o controle de licenças na A.CERT: planos, status e data de expiração.",
    nivel: "avancado", tempo: "3 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Licenças de acesso", texto: "O acesso à A.CERT é controlado por licenças vinculadas a cada empresa. Cada licença define o plano, o status e a data de expiração do acesso." },
      { id: "planos", tipo: "area", icone: "📊", titulo: "Tipos de plano", texto: "Status possíveis para as licenças:", itens: ["Ativa — acesso completo e ilimitado", "Trial — período de avaliação gratuito", "Expirada — acesso suspenso, requer renovação"] },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você saberá gerenciar as licenças e entender os diferentes status disponíveis." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Cadastro de empresas", slug: "cadastro-de-empresas" }, { titulo: "Empresas independentes", slug: "empresas-independentes" }] },
    ],
  },
  "usuarios-empresas/reenvio-de-credenciais": {
    slug: "reenvio-de-credenciais", categoria: "usuarios-empresas", titulo: "Reenvio de credenciais", subtitulo: "Artigo 5 — Usuários e Empresas",
    descricao: "Aprenda como reenviar as credenciais de acesso para usuários que perderam a senha ou não receberam o email.",
    nivel: "intermediario", tempo: "2 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Reenviando credenciais", texto: "Se um usuário perdeu a senha ou não recebeu o email de boas-vindas, o administrador pode reenviar as credenciais de acesso a qualquer momento." },
      { id: "como-fazer", tipo: "timeline", titulo: "Como reenviar", passos: [
        { titulo: "1. Acesse Usuários", texto: "Localize o usuário na lista." },
        { titulo: "2. Abra as ações", texto: "Clique nos três pontos ao lado do nome do usuário." },
        { titulo: "3. Reenviar credenciais", texto: "Selecione a opção de reenviar credenciais. Um novo email será enviado com uma senha provisória." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "O usuário receberá um novo email com as credenciais atualizadas para acessar a plataforma." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Criando usuários", slug: "criando-usuarios" }, { titulo: "Primeiro acesso", slug: "primeiro-acesso", categoria: "primeiros-passos" }] },
    ],
  },
  "usuarios-empresas/empresas-independentes": {
    slug: "empresas-independentes", categoria: "usuarios-empresas", titulo: "Empresas independentes", subtitulo: "Artigo 6 — Usuários e Empresas",
    descricao: "Entenda o conceito de empresas independentes na A.CERT e como gerenciar múltiplas organizações.",
    nivel: "avancado", tempo: "3 min de leitura", icone: "👤",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Empresas independentes", texto: "A A.CERT suporta o modelo multi-empresa, permitindo que múltiplas organizações utilizem a plataforma de forma independente. Cada empresa possui seus próprios usuários, dossiês e configurações." },
      { id: "como-funciona", tipo: "azul", titulo: "Como funciona?", texto: "Cada empresa cadastrada é completamente independente: seus usuários não veem dados de outras empresas, as configurações são isoladas e os dossiês são mantidos separadamente. Isso permite que uma imobiliária matriz gerencie múltiplas filiais sem misturar informações." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você entenderá o modelo multi-empresa e saberá gerenciar organizações independentes na plataforma." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Cadastro de empresas", slug: "cadastro-de-empresas" }, { titulo: "Licenças", slug: "licencas" }] },
    ],
  },
  "configuracoes/perfil": {
    slug: "perfil", categoria: "configuracoes", titulo: "Perfil", subtitulo: "Artigo 1 — Configurações",
    descricao: "Aprenda a personalizar seu perfil na A.CERT: foto, dados pessoais e preferências de conta.",
    nivel: "iniciante", tempo: "3 min de leitura", icone: "⚙",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Perfil do usuário", texto: "A seção de Perfil nas Configurações permite gerenciar seus dados pessoais, foto de perfil e informações de contato. Manter essas informações atualizadas é importante para a comunicação dentro da plataforma." },
      { id: "oque-editar", tipo: "area", icone: "📊", titulo: "O que você pode configurar", texto: "Na aba Perfil, você encontra:", itens: ["Foto de perfil — avatar exibido no sistema", "Nome completo — como você é identificado", "Email — para notificações e recuperação de senha", "Telefone — para contato", "Cargo e departamento — sua posição na empresa"] },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Seu perfil estará atualizado e suas informações estarão corretas em todo o sistema." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Configurações gerais", slug: "configuracoes-gerais" }, { titulo: "Sistema", slug: "sistema" }] },
    ],
  },
  "configuracoes/configuracoes-gerais": {
    slug: "configuracoes-gerais", categoria: "configuracoes", titulo: "Configurações gerais", subtitulo: "Artigo 2 — Configurações",
    descricao: "Ajuste as preferências gerais da plataforma: fuso horário, formato de data e regionalização.",
    nivel: "intermediario", tempo: "3 min de leitura", icone: "⚙",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Configurações gerais", texto: "A aba Geral permite ajustar as preferências regionais da plataforma. Você pode configurar o fuso horário, o formato de data e hora, e outras preferências que afetam como as informações são exibidas." },
      { id: "opcoes", tipo: "azul", titulo: "Opções disponíveis", texto: "As configurações gerais incluem: fuso horário (para correto registro de datas), formato de data (DD/MM/AAAA ou MM/DD/AAAA), idioma da interface, e preferências de exibição como itens por página nas listagens." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "A plataforma estará configurada de acordo com as preferências regionais da sua empresa." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Perfil", slug: "perfil" }, { titulo: "Sistema", slug: "sistema" }] },
    ],
  },
  "configuracoes/conectores": {
    slug: "conectores", categoria: "configuracoes", titulo: "Conectores", subtitulo: "Artigo 3 — Configurações",
    descricao: "Gerencie os órgãos integrados: visualize status, configure tokens e sincronize conectores.",
    nivel: "avancado", tempo: "3 min de leitura", icone: "⚙",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Conectores", texto: "A aba Conectores mostra o status de cada órgão integrado à A.CERT. Você pode verificar se um órgão está online, instável ou offline, e gerenciar as configurações de conexão." },
      { id: "como-usar", tipo: "azul", titulo: "Como gerenciar", texto: "A tela de conectores exibe o status de cada órgão em tempo real. Um órgão offline pode indicar manutenção no site oficial ou problemas de conexão. Você pode verificar o status antes de iniciar consultas para evitar falhas." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você saberá monitorar o status dos órgãos e agir quando algum conector apresentar problemas." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Auditoria", slug: "auditoria" }, { titulo: "Órgãos Integrados", slug: "receita-federal", categoria: "orgaos-integrados" }] },
    ],
  },
  "configuracoes/auditoria": {
    slug: "auditoria", categoria: "configuracoes", titulo: "Auditoria", subtitulo: "Artigo 4 — Configurações",
    descricao: "Acompanhe o registro de auditoria: visualize todas as ações realizadas na plataforma com filtros por usuário e período.",
    nivel: "avancado", tempo: "3 min de leitura", icone: "⚙",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Auditoria", texto: "O registro de auditoria mantém um histórico completo de todas as ações realizadas na plataforma. Cada criação, edição ou exclusão é registrada com data, hora e usuário responsável." },
      { id: "como-usar", tipo: "azul", titulo: "Como utilizar", texto: "Na aba Auditoria, você pode filtrar os registros por período, usuário ou tipo de ação. Isso permite rastrear alterações, identificar responsáveis e manter a conformidade dos processos." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você terá visibilidade completa sobre todas as ações realizadas na plataforma." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Conectores", slug: "conectores" }, { titulo: "Sistema", slug: "sistema" }] },
    ],
  },
  "configuracoes/sistema": {
    slug: "sistema", categoria: "configuracoes", titulo: "Sistema", subtitulo: "Artigo 5 — Configurações",
    descricao: "Visualize informações técnicas da plataforma: versão, ambiente, banco de dados e uptime.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "⚙",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Informações do sistema", texto: "A aba Sistema exibe informações técnicas sobre a plataforma. Esses dados são úteis para diagnóstico e suporte técnico." },
      { id: "info", tipo: "area", icone: "📊", titulo: "Informações disponíveis", texto: "Na aba Sistema você encontra:", itens: ["Versão da plataforma", "Ambiente (produção, homologação)", "Servidor e tempo de atividade (uptime)", "Banco de dados em uso", "Data da última atualização"] },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você saberá onde encontrar informações técnicas sobre a plataforma quando necessário." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Auditoria", slug: "auditoria" }, { titulo: "Backup", slug: "backup" }] },
    ],
  },
  "configuracoes/backup": {
    slug: "backup", categoria: "configuracoes", titulo: "Backup", subtitulo: "Artigo 6 — Configurações",
    descricao: "Aprenda a gerar, baixar e gerenciar backups dos dados da plataforma.",
    nivel: "avancado", tempo: "3 min de leitura", icone: "⚙",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Backup do sistema", texto: "A A.CERT permite gerar backups manuais dos dados da plataforma. Os backups podem ser baixados para armazenamento local e restaurados quando necessário." },
      { id: "como-fazer", tipo: "timeline", titulo: "Como gerenciar backups", passos: [
        { titulo: "Gerar backup", texto: "Na aba Sistema, clique em Gerar Backup para criar uma cópia atual dos dados." },
        { titulo: "Baixar backup", texto: "Os backups gerados ficam disponíveis para download. Clique no nome do arquivo para baixá-lo." },
        { titulo: "Restaurar backup", texto: "Se necessário, você pode restaurar um backup anterior para recuperar dados." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Seus dados estarão seguros com backups regulares disponíveis para restauração." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Sistema", slug: "sistema" }, { titulo: "Auditoria", slug: "auditoria" }] },
    ],
  },
  "lixeira-recuperacao/como-funciona-a-lixeira": {
    slug: "como-funciona-a-lixeira", categoria: "lixeira-recuperacao", titulo: "Como funciona a lixeira", subtitulo: "Artigo 1 — Lixeira",
    descricao: "Entenda como a lixeira da A.CERT armazena itens excluídos e por quanto tempo eles ficam disponíveis para restauração.",
    nivel: "iniciante", tempo: "3 min de leitura", icone: "🗑",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Como funciona a lixeira", texto: "A lixeira da A.CERT é um recurso de segurança que armazena itens excluídos por 30 dias antes da remoção permanente. Durante esse período, qualquer item pode ser restaurado com todos os seus dados intactos." },
      { id: "regras", tipo: "azul", titulo: "Regras da lixeira", texto: "Todos os itens excluídos (dossiês, pessoas, imóveis) vão para a lixeira. Eles permanecem por 30 dias. Após esse prazo, são removidos permanentemente e não podem ser recuperados. Itens na lixeira não aparecem nas listagens principais." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você entenderá o funcionamento da lixeira e saberá que itens excluídos podem ser recuperados dentro do prazo." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Restaurando registros", slug: "restaurando-registros" }, { titulo: "Exclusão permanente", slug: "exclusao-permanente" }] },
    ],
  },
  "lixeira-recuperacao/restaurando-registros": {
    slug: "restaurando-registros", categoria: "lixeira-recuperacao", titulo: "Restaurando registros", subtitulo: "Artigo 2 — Lixeira",
    descricao: "Aprenda como restaurar itens da lixeira e recuperar dados que foram excluídos acidentalmente.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "🗑",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Restaurando registros", texto: "Se você excluiu um dossiê, pessoa ou imóvel por engano, pode restaurá-lo da lixeira. O item voltará exatamente como estava, com todos os dados e vínculos preservados." },
      { id: "como-restaurar", tipo: "timeline", titulo: "Como restaurar", passos: [
        { titulo: "1. Acesse a Lixeira", texto: "No menu lateral, clique em Lixeira." },
        { titulo: "2. Localize o item", texto: "Use os filtros para encontrar dossiês, pessoas ou imóveis específicos." },
        { titulo: "3. Clique em Restaurar", texto: "O item voltará para sua lista original com todos os dados intactos." },
      ]},
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "O item restaurado estará de volta à sua lista original, pronto para uso normal." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como funciona a lixeira", slug: "como-funciona-a-lixeira" }, { titulo: "Exclusão permanente", slug: "exclusao-permanente" }] },
    ],
  },
  "lixeira-recuperacao/exclusao-permanente": {
    slug: "exclusao-permanente", categoria: "lixeira-recuperacao", titulo: "Exclusão permanente", subtitulo: "Artigo 3 — Lixeira",
    descricao: "Saiba como funciona a exclusão definitiva de itens e quando ela ocorre automaticamente.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "🗑",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Exclusão permanente", texto: "A exclusão permanente remove definitivamente um item do sistema. Isso acontece automaticamente após 30 dias na lixeira ou pode ser feito manualmente a qualquer momento." },
      { id: "atencao", tipo: "amarelo", titulo: "Atenção", texto: "✔ A exclusão permanente é irreversível.\n✔ Após 30 dias na lixeira, os itens são removidos automaticamente.\n✔ Certifique-se de que realmente deseja excluir antes de confirmar." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você saberá quando e como os itens são removidos permanentemente do sistema." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como funciona a lixeira", slug: "como-funciona-a-lixeira" }, { titulo: "Boas práticas", slug: "boas-praticas" }] },
    ],
  },
  "lixeira-recuperacao/boas-praticas": {
    slug: "boas-praticas", categoria: "lixeira-recuperacao", titulo: "Boas práticas", subtitulo: "Artigo 4 — Lixeira",
    descricao: "Recomendações para gerenciar a lixeira de forma eficiente e evitar perda acidental de dados.",
    nivel: "iniciante", tempo: "2 min de leitura", icone: "🗑",
    conteudo: [
      { id: "introducao", tipo: "hero", titulo: "Boas práticas da lixeira", texto: "Algumas práticas simples ajudam a manter a lixeira organizada e garantem que você não perca dados importantes acidentalmente." },
      { id: "dicas", tipo: "amarelo", titulo: "Recomendações", texto: "✔ Revise a lixeira periodicamente para restaurar itens excluídos por engano.\n✔ Não confie na lixeira como armazenamento — ela é temporária (30 dias).\n✔ Antes de excluir permanentemente, verifique se o item não é mais necessário.\n✔ Mantenha backups regulares dos dados importantes." },
      { id: "resultado", tipo: "verde", titulo: "Resultado esperado", texto: "Você adotará boas práticas para gerenciar a lixeira e proteger seus dados contra exclusões acidentais." },
      { id: "veja-tambem", tipo: "veja-tambem", links: [{ titulo: "Como funciona a lixeira", slug: "como-funciona-a-lixeira" }, { titulo: "Excluindo um dossiê", slug: "excluindo-dossie", categoria: "dossies" }] },
    ],
  },
};

export const categorias: Guia[] = [
  {
    slug: "primeiros-passos",
    titulo: "Primeiros passos",
    descricao: "Conheça a A.CERT, faça seu primeiro acesso e aprenda os conceitos fundamentais da plataforma.",
    artigos: [
      { titulo: "Bem-vindo à A.CERT", slug: "bem-vindo-a-acert" },
      { titulo: "Primeiro acesso", slug: "primeiro-acesso" },
      { titulo: "Conhecendo o Dashboard", slug: "conhecendo-dashboard" },
      { titulo: "Navegando pelo sistema", slug: "navegando-sistema" },
      { titulo: "Fluxo completo da plataforma", slug: "fluxo-completo" },
    ],
  },
  {
    slug: "dossies",
    titulo: "Dossiês",
    descricao: "Aprenda a criar, organizar e acompanhar um dossiê imobiliário durante toda a negociação.",
    artigos: [
      { titulo: "O que é um dossiê?", slug: "o-que-e-dossie" },
      { titulo: "Criando um dossiê", slug: "criando-dossie" },
      { titulo: "Tipos de transação", slug: "tipos-transacao" },
      { titulo: "Editando um dossiê", slug: "editando-dossie" },
      { titulo: "Status do dossiê", slug: "status-dossie" },
      { titulo: "Excluindo um dossiê", slug: "excluindo-dossie" },
      { titulo: "Gerenciando participantes", slug: "gerenciando-participantes" },
    ],
  },
  {
    slug: "pessoas",
    titulo: "Pessoas",
    descricao: "Cadastre pessoas físicas e jurídicas e gerencie participantes vinculados aos dossiês.",
    artigos: [
      { titulo: "Cadastrando uma pessoa", slug: "cadastrando-uma-pessoa" },
      { titulo: "Pessoa Física x Pessoa Jurídica", slug: "pessoa-fisica-x-juridica" },
      { titulo: "Editando um cadastro", slug: "editando-um-cadastro" },
      { titulo: "Relacionamentos", slug: "relacionamentos" },
      { titulo: "Histórico da pessoa", slug: "historico-da-pessoa" },
      { titulo: "Vinculando participantes ao dossiê", slug: "vinculando-participantes-ao-dossie" },
    ],
  },
  {
    slug: "emissao-certidoes",
    titulo: "Emissão de Certidões",
    descricao: "Entenda como funciona a emissão automática das certidões e acompanhe o andamento das consultas.",
    artigos: [
      { titulo: "Como emitir certidões", slug: "como-emitir-certidoes" },
      { titulo: "Como funciona a consulta automática", slug: "como-funciona-consulta-automatica" },
      { titulo: "Acompanhando o status", slug: "acompanhando-o-status" },
      { titulo: "Certidões por participante", slug: "certidoes-por-participante" },
      { titulo: "Retentando uma consulta", slug: "retentando-uma-consulta" },
      { titulo: "Download das certidões", slug: "download-das-certidoes" },
      { titulo: "Interpretando os resultados", slug: "interpretando-os-resultados" },
    ],
  },
  {
    slug: "orgaos-integrados",
    titulo: "Órgãos Integrados",
    descricao: "Conheça os órgãos disponíveis para consulta e saiba quando cada certidão é utilizada.",
    artigos: [
      { titulo: "Receita Federal", slug: "receita-federal" },
      { titulo: "TJDFT", slug: "tjdft" },
      { titulo: "TRF1", slug: "trf1" },
      { titulo: "TRT 10ª Região", slug: "trt-10-regiao" },
      { titulo: "TST", slug: "tst" },
      { titulo: "SEFAZ-DF", slug: "sefaz-df" },
      { titulo: "ONR", slug: "onr" },
      { titulo: "Matrícula e ficha cadastral", slug: "matricula-e-ficha-cadastral" },
    ],
  },
  {
    slug: "dossies-pdf",
    titulo: "Dossiês e PDF",
    descricao: "Aprenda a gerar, visualizar e compartilhar os dossiês consolidados em PDF.",
    artigos: [
      { titulo: "Como gerar um PDF", slug: "como-gerar-um-pdf" },
      { titulo: "Estrutura do dossiê", slug: "estrutura-do-dossie" },
      { titulo: "Compartilhando documentos", slug: "compartilhando-documentos" },
      { titulo: "Baixando arquivos", slug: "baixando-arquivos" },
      { titulo: "Atualizando um PDF", slug: "atualizando-um-pdf" },
    ],
  },
  {
    slug: "relatorios",
    titulo: "Relatórios",
    descricao: "Visualize indicadores da operação e exporte informações da plataforma.",
    artigos: [
      { titulo: "Visão geral", slug: "visao-geral" },
      { titulo: "Filtros", slug: "filtros" },
      { titulo: "Exportação", slug: "exportacao" },
      { titulo: "Indicadores", slug: "indicadores" },
      { titulo: "Métricas", slug: "metricas" },
    ],
  },
  {
    slug: "usuarios-empresas",
    titulo: "Usuários e Empresas",
    descricao: "Gerencie usuários, empresas, permissões e credenciais de acesso.",
    artigos: [
      { titulo: "Cadastro de empresas", slug: "cadastro-de-empresas" },
      { titulo: "Criando usuários", slug: "criando-usuarios" },
      { titulo: "Perfis e permissões", slug: "perfis-e-permissoes" },
      { titulo: "Licenças", slug: "licencas" },
      { titulo: "Reenvio de credenciais", slug: "reenvio-de-credenciais" },
      { titulo: "Empresas independentes", slug: "empresas-independentes" },
    ],
  },
  {
    slug: "configuracoes",
    titulo: "Configurações",
    descricao: "Personalize sua conta e acompanhe informações do sistema.",
    artigos: [
      { titulo: "Perfil", slug: "perfil" },
      { titulo: "Configurações gerais", slug: "configuracoes-gerais" },
      { titulo: "Conectores", slug: "conectores" },
      { titulo: "Auditoria", slug: "auditoria" },
      { titulo: "Sistema", slug: "sistema" },
      { titulo: "Backup", slug: "backup" },
    ],
  },
  {
    slug: "lixeira-recuperacao",
    titulo: "Lixeira e recuperação",
    descricao: "Recupere registros excluídos ou remova-os definitivamente.",
    artigos: [
      { titulo: "Como funciona a lixeira", slug: "como-funciona-a-lixeira" },
      { titulo: "Restaurando registros", slug: "restaurando-registros" },
      { titulo: "Exclusão permanente", slug: "exclusao-permanente" },
      { titulo: "Boas práticas", slug: "boas-praticas" },
    ],
  },
];


