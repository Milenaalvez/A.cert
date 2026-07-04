"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  LifeBuoy, BookOpen, HelpCircle, FileText, Video,
  Monitor, Globe, Server, Database, Clock, Copy, CheckCheck,
  Activity, Wifi, Terminal, RefreshCw, HardDrive, ExternalLink,
  AlertTriangle, CheckCircle2, XCircle, Search,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useT } from "@/i18n/useT";

const apiBase = "";

const HELP_CARDS = [
  { icon: BookOpen, title: "Guias e Manuais", desc: "Aprenda a utilizar os principais recursos do sistema através de tutoriais passo a passo.", color: "#FF7A00" },
  { icon: HelpCircle, title: "Perguntas Frequentes", desc: "Respostas rápidas para as dúvidas mais comuns dos usuários.", color: "#3B82F6" },
  { icon: FileText, title: "Documentação do Sistema", desc: "Manual técnico da plataforma, integrações e funcionalidades.", color: "#059669" },
  { icon: Video, title: "Vídeos Tutoriais", desc: "Vídeos explicando processos operacionais dentro do sistema.", color: "#7C3AED" },
];

const QUICK_SOLUTIONS = [
  { icon: Activity, label: "Diagnóstico do Sistema", desc: "Executa verificações básicas do sistema.", color: "#FF7A00" },
  { icon: Wifi, label: "Status das Integrações", desc: "Exibe situação atual dos órgãos conectados.", color: "#3B82F6" },
  { icon: Terminal, label: "Logs do Sistema", desc: "Permite visualizar registros e erros.", color: "#059669" },
  { icon: RefreshCw, label: "Atualizações do Sistema", desc: "Histórico de versões e melhorias.", color: "#7C3AED" },
  { icon: Globe, label: "Ambiente do Sistema", desc: "Informações técnicas utilizadas pelo A.CERT.", color: "#D97706" },
  { icon: HardDrive, label: "Backup do Sistema", desc: "Permite criar backup manual e visualizar últimos backups.", color: "#DC2626" },
];

const FAQ_DATA = [
  { q: "Como criar um dossiê?", a: "Acesse Dossiês pelo menu lateral, clique em \"Novo Dossiê\" e preencha os dados do proprietário e imóvel." },
  { q: "Como emitir certidões?", a: "Acesse Certidões, selecione uma pessoa cadastrada e marque os órgãos desejados. Resolva os CAPTCHAs quando solicitado." },
  { q: "Como cadastrar uma pessoa?", a: "Acesse Pessoas, clique em \"Nova Pessoa\" e preencha os dados. O CPF é validado automaticamente." },
  { q: "Como baixar os PDFs das certidões?", a: "Após a emissão, cada certidão aparece com um botão de download. Você também pode gerar o dossiê completo em PDF." },
  { q: "Como redefinir a senha de um usuário?", a: "Acesse Usuários, encontre o colaborador, clique nos três pontos e selecione \"Resetar Senha\"." },
  { q: "Como alterar permissões de acesso?", a: "Na página de detalhes do usuário, vá até a seção \"Permissões\" e utilize os switches para conceder ou revogar acessos." },
];

const IMPORTANT_INFO = [
  { title: "Segurança", desc: "Mantenha credenciais protegidas e realize backups periódicos." },
  { title: "Boas Práticas", desc: "Utilize cadastros completos para aumentar a taxa de sucesso das emissões." },
  { title: "Integrações", desc: "Verifique regularmente o status dos órgãos integrados." },
];

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-secondary shrink-0" />
      <div className="flex items-center justify-between w-full min-w-0">
        <span className="text-[12px] text-secondary">{label}</span>
        <span className="text-[13px] text-primary font-medium">{value}</span>
      </div>
    </div>
  );
}

const statusIcon = (status: string) => {
  if (status === "online") return { icon: CheckCircle2, color: "#059669", label: "Online" };
  if (status === "offline") return { icon: XCircle, color: "#DC2626", label: "Offline" };
  return { icon: AlertTriangle, color: "#D97706", label: "Instável" };
};

const card = "bg-surface p-6";
const btnBase = "flex items-center justify-center gap-1.5 h-[38px] px-5 text-[13px] font-semibold cursor-pointer transition-all duration-150";
const btnOutline = `${btnBase} bg-transparent text-muted border border-default hover:border-[#FF7A00] hover:text-[#FF7A00]`;

export default function SuportePage() {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [organs, setOrgans] = useState<any[]>([]);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("acert_token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${apiBase}/api/settings/system-info`, { headers })
      .then(r => r.json()).then(setSystemInfo).catch(() => {});
    fetch(`${apiBase}/api/settings/organs`, { headers })
      .then(r => r.json()).then(setOrgans).catch(() => {});
  }, []);

  async function copyInfo() {
    if (!systemInfo) return;
    const text = `A.CERT ${systemInfo.version}
Ambiente: ${systemInfo.environment}
Atualização: ${systemInfo.lastUpdate}
Servidor: ${systemInfo.server}
Banco: ${systemInfo.database}
Uptime: ${systemInfo.uptime}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ marginTop: 24, marginBottom: 28 }}>
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Suporte</h1>
              <p className="text-[14px] text-secondary leading-relaxed">Central de ajuda, documentação e recursos para utilização do sistema A.CERT.</p>
            </div>
          </div>
        </div>

        {/* Central de Ajuda */}
        <div className="flex gap-6 mb-8">
          {HELP_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className={`${card} flex-1 flex flex-col`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ background: `${card.color}15` }}>
                    <Icon size={20} strokeWidth={1.5} color={card.color} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-primary">{card.title}</h3>
                </div>
                <p className="text-[13px] text-muted leading-relaxed flex-1 mb-4">{card.desc}</p>
                <button className={btnOutline} style={{ alignSelf: "flex-start" }}>
                  <ExternalLink size={13} />
                  {["Acessar Guias", "Ver FAQ", "Abrir Documentação", "Assistir Vídeos"][i]}
                </button>
              </div>
            );
          })}

          {/* Sidebar - Info Sistema */}
          <div className={card} style={{ width: "280px", minWidth: "280px" }}>
            <h3 className="text-[14px] font-semibold text-primary mb-4">Informações do Sistema</h3>
            <div className="flex flex-col gap-3">
              <InfoRow icon={Monitor} label={t("config.versao")} value={systemInfo?.version || "—"} />
              <InfoRow icon={Globe} label={t("config.ambiente")} value={systemInfo?.environment || "—"} />
              <InfoRow icon={Clock} label={t("config.atualizacao")} value={systemInfo?.lastUpdate || "—"} />
              <InfoRow icon={Server} label={t("config.servidor")} value={systemInfo?.server || "—"} />
              <InfoRow icon={Database} label={t("config.banco")} value={systemInfo?.database || "—"} />
              <InfoRow icon={Activity} label={t("config.uptime")} value={systemInfo?.uptime || "—"} />
            </div>
            <button onClick={copyInfo} className={`${btnOutline} w-full mt-4`}>
              {copied ? <CheckCheck size={14} color="#059669" /> : <Copy size={14} />}
              {copied ? "Copiado!" : "Copiar Informações"}
            </button>
          </div>
        </div>

        {/* Soluções Rápidas */}
        <div className="mb-8">
          <h2 className="text-[17px] font-bold text-primary mb-5">Soluções Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            {QUICK_SOLUTIONS.map((sol, i) => {
              const Icon = sol.icon;
              return (
                <button key={i} className={`${card} flex items-center gap-4 text-left cursor-pointer hover:border-[#FF7A00] transition-colors`}>
                  <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ background: `${sol.color}12` }}>
                    <Icon size={22} strokeWidth={1.5} color={sol.color} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14px] font-semibold text-primary">{sol.label}</h4>
                    <p className="text-[12px] text-muted mt-0.5">{sol.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status das Integrações */}
        {organs.length > 0 && (
          <div className={`${card} mb-8`}>
            <h3 className="text-[14px] font-semibold text-primary mb-4">Status das Integrações</h3>
            <div className="flex flex-wrap gap-4">
              {organs.map((o: any) => {
                const si = statusIcon(o.status);
                const Icon = si.icon;
                return (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-3" style={{ minWidth: "160px" }}>
                    <Icon size={16} color={si.color} />
                    <div>
                      <p className="text-[13px] font-medium text-primary">{o.name}</p>
                      <p className="text-[11px]" style={{ color: si.color }}>{si.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className={`${card} mb-8`}>
          <h3 className="text-[14px] font-semibold text-primary mb-4">Perguntas Frequentes</h3>
          <div className="flex flex-col">
            {FAQ_DATA.map((faq, i) => (
              <div key={i} className="border-b border-default last:border-0">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="flex items-center justify-between w-full py-4 text-left hover:opacity-80 transition-opacity"
                >
                  <span className="text-[14px] font-medium text-primary">{faq.q}</span>
                  <span className={`text-secondary text-lg transition-transform ${faqOpen === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {faqOpen === i && (
                  <p className="text-[13px] text-muted pb-4 leading-relaxed pr-8">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Informações Importantes */}
        <div className={card}>
          <h3 className="text-[14px] font-semibold text-primary mb-4">Informações Importantes</h3>
          <div className="grid grid-cols-3 gap-6">
            {IMPORTANT_INFO.map((info, i) => (
              <div key={i}>
                <h4 className="text-[13px] font-semibold text-[#FF7A00] mb-2">{info.title}</h4>
                <p className="text-[13px] text-muted leading-relaxed">{info.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
