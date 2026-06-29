"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X, Edit, Shield, User, Mail, Calendar, Clock, MapPin, Phone,
  FileText, FolderOpen, CheckCircle2, XCircle, Activity,
  ExternalLink, Star,
} from "lucide-react";

interface EnrichedUser {
  id: string; name: string; email: string; role: string;
  department?: string; position?: string; phone?: string;
  avatar?: string | null; isActive?: boolean; hireDate?: string;
  birthDate?: string; city?: string; uf?: string; address?: string;
  stats?: { dossiersCreated: number; dossiersCompleted: number; clientsRegistered: number; propertiesLinked: number; };
  lastSession?: { date: string | null; ip: string; device: string; browser: string; os: string; };
  registrationNumber?: string; weeklyHours?: number;
}

interface Props {
  user: EnrichedUser;
  onClose: () => void;
  onEdit: (user: EnrichedUser) => void;
  onPermissions: (user: EnrichedUser) => void;
  onToggleStatus: (user: EnrichedUser) => void;
}

const apiBase = "";

function timeAgo(d: string) {
  if (!d) return "—";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Agora mesmo";
  if (m < 60) return `Há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Há ${h} h`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `Há ${dd} dia${dd > 1 ? "s" : ""}`;
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const TABS = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "atividades", label: "Atividades", icon: Activity },
  { key: "dossies", label: "Dossiês", icon: FolderOpen },
  { key: "permissoes", label: "Permissões", icon: Shield },
];

export default function UserSidePanel({ user, onClose, onEdit, onPermissions, onToggleStatus }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("perfil");
  const [activities, setActivities] = useState<any[]>([]);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingDossiers, setLoadingDossiers] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("acert_token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    if (activeTab === "atividades") {
      setLoadingActivities(true);
      fetch(`${apiBase}/api/team/user-activities/${user.id}`, { headers })
        .then(r => r.json())
        .then(data => {
          const all = [
            ...(data.auditLogs || []).map((a: any) => ({ ...a, time: a.created_at, type: "audit" })),
            ...(data.teamActivities || []).map((a: any) => ({ ...a, time: a.timestamp, type: "team" })),
          ].sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 100);
          setActivities(all);
        })
        .catch(() => {})
        .finally(() => setLoadingActivities(false));
    }

    if (activeTab === "dossies") {
      setLoadingDossiers(true);
      fetch(`${apiBase}/api/team/user-dossiers/${user.id}`, { headers })
        .then(r => r.json())
        .then(data => setDossiers(data))
        .catch(() => {})
        .finally(() => setLoadingDossiers(false));
    }
  }, [activeTab, user.id]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{
            maxWidth: "640px",
            borderRadius: "16px",
            border: "1px solid var(--border-default)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.18)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between shrink-0"
            style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden"
                style={{ background: "var(--badge-orange-bg)" }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#FF7A00] text-[15px] font-bold">{getInitials(user.name)}</span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold tracking-tight text-primary truncate">{user.name}</h2>
                <p className="text-[12px] text-muted mt-0.5">{user.position || user.department || "Colaborador"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted transition-colors shrink-0"
              style={{ border: "none", background: "transparent", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 px-7 border-b border-default shrink-0">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 h-9 text-[13px] font-medium transition-colors -mb-px border-b-[3px] ${
                    isActive ? "border-[#FF7A00] text-primary" : "border-transparent text-secondary hover:text-body"
                  }`}>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
            {activeTab === "perfil" && (
              <div className="flex flex-col gap-5">
                {/* Resumo */}
                <div className="border border-default rounded-[10px] p-4 bg-surface">
                  <h3 className="text-[12px] font-semibold text-muted uppercase tracking-[0.6px] mb-4">Resumo</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <StatBox label="Dossiês criados" value={String(user.stats?.dossiersCreated || 0)} />
                    <StatBox label="Concluídos" value={String(user.stats?.dossiersCompleted || 0)} />
                    <StatBox label="Clientes" value={String(user.stats?.clientsRegistered || 0)} />
                    <StatBox label="Imóveis" value={String(user.stats?.propertiesLinked || 0)} />
                  </div>
                </div>

                {/* Dados Cadastrais */}
                <div className="border border-default rounded-[10px] p-4 bg-surface">
                  <h3 className="text-[12px] font-semibold text-muted uppercase tracking-[0.6px] mb-4">Dados Cadastrais</h3>
                  <div className="flex flex-col gap-3">
                    <ProfileRow icon={Mail} label="Email" value={user.email} />
                    <ProfileRow icon={Phone} label="Telefone" value={user.phone || "—"} />
                    {user.registrationNumber && <ProfileRow icon={FileText} label="Registro" value={user.registrationNumber} />}
                    {user.birthDate && <ProfileRow icon={Calendar} label="Nascimento" value={formatDate(user.birthDate)} />}
                    {user.hireDate && <ProfileRow icon={Calendar} label="Contratação" value={formatDate(user.hireDate)} />}
                    {user.city && <ProfileRow icon={MapPin} label="Local" value={`${user.city}${user.uf ? ` - ${user.uf}` : ""}`} />}
                  </div>
                </div>

                {/* Último Acesso */}
                {user.lastSession && (
                  <div className="border border-default rounded-[10px] p-4 bg-surface">
                    <h3 className="text-[12px] font-semibold text-muted uppercase tracking-[0.6px] mb-4">Último Acesso</h3>
                    <div className="flex flex-col gap-2">
                      {user.lastSession.date && <ProfileRow icon={Clock} label="Data" value={formatDate(user.lastSession.date)} />}
                      <GlobeRow label="IP" value={user.lastSession.ip || "—"} />
                      <MonitorRow label="Dispositivo" value={user.lastSession.device || "—"} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "atividades" && (
              <div>
                {loadingActivities ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-[13px] text-secondary">Carregando...</div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity size={32} className="text-muted mb-3" />
                    <p className="text-[14px] text-secondary">Nenhuma atividade registrada.</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {activities.map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 py-3 border-b border-default last:border-0">
                        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                          style={{ background: a.type === "audit" ? "rgba(255,122,0,0.1)" : "rgba(59,130,246,0.1)" }}>
                          {a.type === "audit" ? <Activity size={14} color="#FF7A00" /> : <Clock size={14} color="#3B82F6" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] text-primary leading-snug">{a.action}</p>
                          {a.detail && <p className="text-[11px] text-secondary mt-0.5">{a.detail}</p>}
                          <p className="text-[10px] text-secondary mt-1">{timeAgo(a.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "dossies" && (
              <div>
                {loadingDossiers ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-[13px] text-secondary">Carregando...</div>
                  </div>
                ) : dossiers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen size={32} className="text-muted mb-3" />
                    <p className="text-[14px] text-secondary">Nenhum dossiê encontrado.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dossiers.map((d: any) => {
                      const certObtidas = d.certificatesObtidas || 0;
                      const certTotal = d.certificateCount || 0;
                      const progress = certTotal > 0 ? Math.round((certObtidas / certTotal) * 100) : 0;
                      return (
                        <button
                          key={d.id}
                          onClick={() => { router.push(`/dashboard/dossies/${d.id}`); onClose(); }}
                          className="flex items-center gap-4 p-4 text-left border border-default hover:border-[#FF7A00] transition-colors bg-subtle rounded-[10px]"
                        >
                          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                            style={{ background: d.status === "Concluído" ? "rgba(5,150,105,0.15)" : d.status === "Pendente" ? "rgba(220,38,38,0.15)" : "rgba(255,122,0,0.15)" }}>
                            <FileText size={18} strokeWidth={1.5} color={d.status === "Concluído" ? "#059669" : d.status === "Pendente" ? "#DC2626" : "#FF7A00"} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold text-primary">{d.identifier}</span>
                              {d.priority === "Preferencial" && <Star size={12} color="#FFB800" fill="#FFB800" />}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-[11px] font-medium ${d.status === "Concluído" ? "text-[#059669]" : d.status === "Pendente" ? "text-[#DC2626]" : "text-[#FF7A00]"}`}>{d.status}</span>
                              {certTotal > 0 && <span className="text-[11px] text-secondary">{certObtidas}/{certTotal} certidões</span>}
                            </div>
                            {certTotal > 0 && (
                              <div className="mt-2 h-1.5 w-full rounded-full bg-elevated">
                                <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, background: progress >= 80 ? "#059669" : progress >= 50 ? "#D97706" : "#DC2626" }} />
                              </div>
                            )}
                          </div>
                          <ExternalLink size={14} className="text-muted shrink-0" />
                        </button>
                      );
                    })}
                    {dossiers.length > 0 && (
                      <button onClick={() => { router.push(`/dashboard/dossies?search=${encodeURIComponent(user.name)}`); onClose(); }}
                        className="text-[13px] text-[#FF7A00] hover:text-[#E06900] text-center py-2 transition-colors">
                        Ver todos os dossiês →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "permissoes" && (
              <div className="flex flex-col gap-4 py-8 items-center text-center">
                <Shield size={40} className="text-muted" />
                <p className="text-[14px] text-secondary">Gerencie as permissões de {user.name.split(" ")[0]}.</p>
                <button onClick={() => { onPermissions(user); onClose(); }}
                  className="flex items-center gap-2 h-[38px] px-6 text-[13px] font-semibold text-white bg-[#FF7A00] hover:bg-[#E06900] transition-colors border-0 cursor-pointer rounded-[8px]">
                  <Shield size={15} /> Gerenciar Permissões
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 shrink-0"
            style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}>
            <button onClick={() => { onEdit(user); onClose(); }}
              className="flex items-center justify-center gap-1.5 h-[38px] px-5 text-[13px] font-medium text-secondary border border-default bg-transparent hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors cursor-pointer rounded-[8px] flex-1">
              <Edit size={14} /> Editar
            </button>
            <button onClick={() => { onPermissions(user); onClose(); }}
              className="flex items-center justify-center gap-1.5 h-[38px] px-5 text-[13px] font-medium text-secondary border border-default bg-transparent hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors cursor-pointer rounded-[8px] flex-1">
              <Shield size={14} /> Permissões
            </button>
            <button onClick={() => { onToggleStatus(user); onClose(); }}
              className={`flex items-center justify-center gap-1.5 h-[38px] px-5 text-[13px] font-semibold text-white transition-colors cursor-pointer rounded-[8px] flex-1 border-0 ${
                user.isActive ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#059669] hover:bg-[#047857]'
              }`}>
              {user.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
              {user.isActive ? "Desativar" : "Ativar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-default rounded-[8px] p-4 text-center bg-subtle">
      <p className="text-[22px] font-bold text-primary">{value}</p>
      <p className="text-[11px] text-secondary mt-1">{label}</p>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={13} className="text-secondary shrink-0" />
      <span className="text-[11px] text-secondary w-24 shrink-0">{label}</span>
      <span className="text-[13px] text-primary">{value}</span>
    </div>
  );
}

function GlobeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary shrink-0">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span className="text-[11px] text-secondary w-24 shrink-0">{label}</span>
      <span className="text-[13px] text-primary">{value}</span>
    </div>
  );
}

function MonitorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary shrink-0">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      <span className="text-[11px] text-secondary w-24 shrink-0">{label}</span>
      <span className="text-[13px] text-primary">{value}</span>
    </div>
  );
}
