"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Key, Edit, CheckCircle2, XCircle, Clock, Circle,
  Monitor, Wifi, MapPin, Activity,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PermissoesModal from "@/components/PermissoesModal";
import * as teamApi from "@/services/teamApi";

/* ── Types ─────────────────────────────────────────── */
interface UserDetail {
  id: string; name: string; email: string; role: string;
  department?: string; departmentId?: string; position?: string;
  contractType?: string; registrationNumber?: string; phone?: string;
  avatar?: string | null; weeklyHours?: number; workSchedule?: string;
  hireDate?: string; isActive?: boolean; emailVerified?: boolean;
  lastAccessAt?: string; todayStatus?: string;
}

interface ActivityLog {
  id: string; action: string; description: string; timestamp: string;
  user?: { name: string; avatar?: string; role?: string };
}

const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrador", RH: "RH", EMPLOYEE: "Colaborador", DEVELOPER: "Desenvolvedor" };

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function formatDate(d: string | undefined) { if (!d) return "—"; return new Date(d).toLocaleDateString("pt-BR"); }
function formatDateTime(d: string | undefined) { if (!d) return "—"; return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function timeAgo(d: string | undefined) { if (!d) return "—"; const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (diff < 60) return "Agora"; if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`; if (diff < 86400) return `Hoje às ${new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`; return formatDateTime(d); }

export default function UsuarioDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [permOpen, setPermOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [users, allPerms, logs] = await Promise.all([
        teamApi.enriched(),
        teamApi.getPermissions(id).then((d: any) => d.permissions || []).catch(() => []),
        teamApi.activityLogs().catch(() => []),
      ]);
      const u = (users || []).find((x: any) => x.id === id);
      if (u) setUser(u);
      setPerms(allPerms);
      setActivities((logs || []).filter((a: any) => a.userId === id || a.targetUserId === id).slice(0, 30));
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleResetPassword() {
    try {
      await teamApi.resetPassword(id);
      alert("Senha resetada com sucesso. Uma senha temporária foi gerada.");
    } catch (err: any) {
      alert(err.message || "Erro");
    }
  }

  async function handleToggleStatus() {
    if (!user) return;
    try {
      await teamApi.updateStatus(id, !user.isActive);
      fetchData();
    } catch (err: any) { alert(err.message || "Erro"); }
  }

  if (loading) {
    return <DashboardLayout><div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>Carregando...</div></DashboardLayout>;
  }
  if (!user) {
    return <DashboardLayout><div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>Usuário não encontrado.</div></DashboardLayout>;
  }

  const st = user.isActive === false
    ? { color: "#EF4444", label: "Desativado", Icon: XCircle }
    : user.todayStatus === "online"
      ? { color: "#10B981", label: "Online", Icon: CheckCircle2 }
      : { color: "#6B7280", label: "Offline", Icon: Circle };
  const StatusIcon = st.Icon;

  const sectionStyle: React.CSSProperties = { border: "1px solid var(--border-default)", borderRadius: 12, background: "var(--bg-app)", padding: "22px 24px", marginBottom: 18 };
  const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--border-default)" };

  const PERM_SECTIONS = [
    { group: "Dossiês", keys: ["create_dossiers", "edit_dossiers", "delete_dossiers"] },
    { group: "Pessoas", keys: ["create_people", "edit_people", "delete_people"] },
    { group: "Imóveis", keys: ["create_properties", "edit_properties", "delete_properties"] },
    { group: "Certidões", keys: ["emit_certificates", "download_certificates", "export_certificates"] },
    { group: "Relatórios", keys: ["view_reports", "export_reports"] },
    { group: "Sistema", keys: ["manage_users", "manage_settings", "view_logs"] },
  ];
  const PERM_LABELS: Record<string, string> = {
    create_dossiers: "Criar dossiês", edit_dossiers: "Editar dossiês", delete_dossiers: "Excluir dossiês",
    create_people: "Criar pessoas", edit_people: "Editar pessoas", delete_people: "Excluir pessoas",
    create_properties: "Criar imóveis", edit_properties: "Editar imóveis", delete_properties: "Excluir imóveis",
    emit_certificates: "Emitir certidões", download_certificates: "Baixar certidões", export_certificates: "Exportar certidões",
    view_reports: "Visualizar relatórios", export_reports: "Exportar relatórios",
    manage_users: "Gerenciar usuários", manage_settings: "Configurações", view_logs: "Visualizar logs",
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px 64px" }}>
        {/* Back */}
        <button onClick={() => router.push("/dashboard/usuarios")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 20, padding: 0 }}>
          <ArrowLeft size={14} /> Voltar para Usuários
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
              {getInitials(user.name)}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{user.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user.position || ROLE_LABEL[user.role] || user.role}</span>
                <span style={{ color: "var(--border-default)" }}>·</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user.department || "—"}</span>
                <span style={{ color: "var(--border-default)" }}>·</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <StatusIcon size={12} color={st.color} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: st.color }}>{st.label}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.push(`/dashboard/usuarios/${id}`)} style={btnOutlineStyle}><Edit size={13} /> Editar</button>
            <button onClick={() => setPermOpen(true)} style={btnOutlineStyle}><Shield size={13} /> Permissões</button>
            <button onClick={handleResetPassword} style={btnOutlineStyle}><Key size={13} /> Resetar senha</button>
          </div>
        </div>

        {/* Info Grid */}
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>Informações do Usuário</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px 28px" }}>
            {[
              { label: "Nome completo", value: user.name },
              { label: "CPF", value: user.registrationNumber || "Não informado" },
              { label: "Email", value: user.email },
              { label: "Telefone", value: user.phone || "Não informado" },
              { label: "Cargo", value: user.position || ROLE_LABEL[user.role] || user.role },
              { label: "Departamento", value: user.department || "—" },
              { label: "Carga horária", value: `${user.weeklyHours || 40}h semanais` },
              { label: "Tipo de contrato", value: user.contractType || "CLT" },
              { label: "Data de cadastro", value: formatDate(user.hireDate) },
              { label: "Último acesso", value: timeAgo(user.lastAccessAt) },
              { label: "Status", value: user.isActive === false ? "Desativado" : "Ativo" },
            ].map((row, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>Permissões de Acesso</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {PERM_SECTIONS.map(sec => (
              <div key={sec.group}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", margin: "0 0 8px" }}>{sec.group}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {sec.keys.map(k => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: perms.includes(k) ? "#FF7A00" : "var(--border-default)" }} />
                      <span style={{ fontSize: 12, color: perms.includes(k) ? "var(--text-primary)" : "var(--text-tertiary)" }}>{PERM_LABELS[k] || k}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity History */}
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>Histórico de Atividades</h3>
          {activities.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", textAlign: "center", padding: 20 }}>Nenhuma atividade registrada.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {activities.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < activities.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", minWidth: 44, fontFamily: "monospace" }}>
                    {new Date(a.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Activity size={14} color="#FF7A00" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--text-primary)", flex: 1 }}>{a.description || a.action}</span>
                  {a.user && (
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{a.user.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security / Sessions */}
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>Sessões e Segurança</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px 28px" }}>
            {[
              { label: "Navegador", value: "Chrome", icon: Monitor },
              { label: "Sistema operacional", value: "Windows", icon: Monitor },
              { label: "IP", value: "189.xxx.xxx.xx", icon: Wifi },
              { label: "Último login", value: formatDateTime(user.lastAccessAt), icon: Clock },
            ].map((row, i) => {
              const Icon = row.icon;
              return (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <Icon size={16} color="var(--text-tertiary)" style={{ marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>{row.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{row.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PermissoesModal open={permOpen} onClose={() => setPermOpen(false)} userId={id} userName={user.name} />
      </div>
    </DashboardLayout>
  );
}

const btnOutlineStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
  borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent",
  color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
};
