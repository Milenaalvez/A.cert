import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link href="/cadastro" className="text-accent hover:text-accent-hover text-sm mb-8 inline-block">&larr; Voltar ao cadastro</Link>
        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-white/60 text-sm mb-10">Última atualização: junho de 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed text-[15px]">
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">1. Introdução</h2>
            <p>A A.CERT ("Central de Certidões") valoriza sua privacidade. Esta Política descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais quando você utiliza nossa plataforma.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">2. Dados Coletados</h2>
            <p>Podemos coletar as seguintes informações:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nome completo, e-mail e CPF</li>
              <li>Dados de acesso (endereço IP, navegador, dispositivo)</li>
              <li>Informações sobre certidões e documentos emitidos</li>
              <li>Dados de pagamento quando aplicável</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">3. Finalidade do Tratamento</h2>
            <p>Seus dados são utilizados para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Fornecer e melhorar os serviços da plataforma</li>
              <li>Processar emissões de certidões e geração de dossiês</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Comunicar atualizações, alterações e novidades</li>
              <li>Garantir a segurança da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">4. Compartilhamento de Dados</h2>
            <p>Não compartilhamos seus dados pessoais com terceiros, exceto:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Quando necessário para a prestação do serviço (cartórios, órgãos públicos)</li>
              <li>Para cumprimento de obrigação legal ou ordem judicial</li>
              <li>Com prestadores de serviços contratados (processamento de pagamentos, hospedagem)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">5. Armazenamento e Segurança</h2>
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou destruição. Os dados são armazenados em servidores seguros com criptografia em trânsito e em repouso.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">6. Seus Direitos (LGPD)</h2>
            <p>Com base na Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão dos dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">7. Cookies</h2>
            <p>Utilizamos cookies essenciais para o funcionamento da plataforma. Você pode configurar seu navegador para recusar cookies, mas isso pode afetar a funcionalidade do serviço.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">8. Retenção de Dados</h2>
            <p>Mantemos seus dados pelo período necessário à prestação dos serviços ou conforme exigido por lei. Após o encerramento da conta, os dados serão excluídos em até 90 dias, salvo obrigação legal de retenção.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">9. Alterações nesta Política</h2>
            <p>Esta Política pode ser atualizada periodicamente. Notificaremos os usuários sobre mudanças significativas por e-mail ou na plataforma.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-2">10. Contato</h2>
            <p>Para exercer seus direitos ou esclarecer dúvidas, entre em contato pelo e-mail de suporte disponível na plataforma.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
