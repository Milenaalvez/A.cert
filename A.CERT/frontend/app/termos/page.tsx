import Link from "next/link";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link href="/cadastro" className="text-accent hover:text-accent-hover text-sm mb-8 inline-block">&larr; Voltar ao cadastro</Link>
        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-white/60 text-sm mb-10">Última atualização: junho de 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed text-[15px]">
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">1. Aceitação dos Termos</h2>
            <p>Ao acessar e utilizar a plataforma A.CERT ("Central de Certidões"), você declara estar de acordo com estes Termos de Uso. Caso não concorde com qualquer condição aqui prevista, não utilize o serviço.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">2. Definição dos Serviços</h2>
            <p>A A.CERT é uma plataforma digital que permite a consulta, emissão e gestão de certidões imobiliárias, além da geração de dossiês documentais. Os serviços incluem:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Consulta automatizada em múltiplas fontes</li>
              <li>Emissão e acompanhamento de certidões</li>
              <li>Geração de dossiês completos</li>
              <li>Armazenamento e organização de documentos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">3. Cadastro e Conta</h2>
            <p>Para utilizar a plataforma, é necessário criar uma conta fornecendo dados precisos e atualizados. Você é o único responsável pela confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">4. Uso Permitido</h2>
            <p>O usuário concorda em utilizar a plataforma exclusivamente para fins legais e de acordo com estas normas. É proibido:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Utilizar o serviço para atividades fraudulentas ou ilícitas</li>
              <li>Compartilhar credenciais de acesso</li>
              <li>Tentar acessar dados de terceiros sem autorização</li>
              <li>Reproduzir, distribuir ou modificar o conteúdo sem autorização</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">5. Privacidade e Dados</h2>
            <p>O tratamento de dados pessoais segue nossa Política de Privacidade. Ao utilizar a plataforma, você consente com a coleta e uso de dados conforme descrito na referida política.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">6. Propriedade Intelectual</h2>
            <p>Todos os direitos de propriedade intelectual sobre a plataforma, seu código, design, marcas e conteúdos pertencem à A.CERT. Nenhuma licença ou direito é concedido ao usuário além do expressamente previsto nestes Termos.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">7. Limitação de Responsabilidade</h2>
            <p>A A.CERT empreende esforços para garantir a disponibilidade e precisão dos serviços, mas não se responsabiliza por:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Interrupções temporárias por manutenção ou falhas técnicas</li>
              <li>Informações fornecidas por fontes terceiras</li>
              <li>Danos decorrentes do uso inadequado da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">8. Alterações nos Termos</h2>
            <p>Estes Termos podem ser alterados a qualquer momento. As mudanças serão comunicadas aos usuários cadastrados por e-mail ou notificação na plataforma. O uso continuado do serviço após as alterações implica aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">9. Rescisão</h2>
            <p>A A.CERT reserva-se o direito de suspender ou encerrar contas que violem estes Termos, sem prejuízo das demais medidas legais cabíveis.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">10. Contato</h2>
            <p>Dúvidas ou solicitações podem ser encaminhadas para nosso suporte através do e-mail disponível na plataforma.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
