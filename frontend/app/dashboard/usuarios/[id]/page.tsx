"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Key, Edit, CheckCircle2, XCircle, Clock, Circle,
  Monitor, Wifi, Activity,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PermissoesModal from "@/components/PermissoesModal";
import * as teamApi from "@/services/teamApi";

/* ── Types ─────────────────────────────────────────── */
interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  departmentId?: string;
  position?: string;
  contractType?: string;
  registrationNumber?: string;
  phone?: string;
  avatar?: string | null;
  weeklyHours?: number;
  workSchedule?: string;
  hireDate?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  lastAccessAt?: string;
  todayStatus?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user?: { name: string; avatar?: string; role?: string };
  userId?: string;
  targetUserId?: string;
}

/* ── Constants ─────────────────────────────────────── */
const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  RH: "RH",
  EMPLOYEE: "Colaborador",
  DEVELOPER: "Desenvolvedor",
};

/* ── Helpers ───────────────────────────────────────── */
function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(d: string | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatDateTime(d: string | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(d: string | undefined) {
  if (!d) return "—";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return "Agora";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) {
    return `Hoje às ${new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return formatDateTime(d);
}

/* ── Permissions ───────────────────────────────────── */
const PERM_SECTIONS = [
  { group: "Dossiês", keys: ["create_dossiers", "edit_dossiers", "delete_dossiers"] },
  { group: "Pessoas", keys: ["create_people", "edit_people", "delete_people"] },
  { group: "Imóveis", keys: ["create_properties", "edit_properties", "delete_properties"] },
  { group: "Certidões", keys: ["emit_certificates", "download_certificates", "export_certificates"] },
  { group: "Relatórios", keys: ["view_reports", "export_reports"] },
  { group: "Sistema", keys: ["manage_users", "manage_settings", "view_logs"] },
];

const PERM_LABELS: Record<string, string> = {
  create_dossiers: "Criar dossiês",
  edit_dossiers: "Editar dossiês",
  delete_dossiers: "Excluir dossiês",
  create_people: "Criar pessoas",
  edit_people: "Editar pessoas",
  delete_people: "Excluir pessoas",
  create_properties: "Criar imóveis",
  edit_properties: "Editar imóveis",
  delete_properties: "Excluir imóveis",
  emit_certificates: "Emitir certidões",
  download_certificates: "Baixar certidões",
  export_certificates: "Exportar certidões",
  view_reports: "Visualizar relatórios",
  export_reports: "Exportar relatórios",
  manage_users: "Gerenciar usuários",
  manage_settings: "Configurações",
  view_logs: "Visualizar logs",
};

/* ── Component ─────────────────────────────────────── */
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
        teamApi
          .getPermissions(id)
          .then((d: any) => d.permissions || [])
          .catch(() => []),
        teamApi.activityLogs().catch(() => []),
      ]);
      const u = (users || []).find((x: any) => x.id === id);
      if (u) setUser(u);
      setPerms(allPerms);
      setActivities(
        (logs || [])
          .filter((a: any) => a.userId === id || a.targetUserId === id)
          .slice(0, 30)
      );
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    } catch (err: any) {
      alert(err.message || "Erro");
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] w-full">
          <div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] w-full">
          <span className="text-[15px] font-medium text-primary">Usuário não encontrado.</span>
        </div>
      </DashboardLayout>
    );
  }

  const st =
    user.isActive === false
      ? { color: "#EF4444", label: "Desativado", Icon: XCircle }
      : user.todayStatus === "online"
        ? { color: "#10B981", label: "Online", Icon: CheckCircle2 }
        : user.todayStatus === "away"
          ? { color: "#F59E0B", label: "Ausente", Icon: Clock }
          : { color: "#6B7280", label: "Offline", Icon: Circle };
  const StatusIcon = st.Icon;

  const infoFields = [
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
  ];

  const sessionFields = [
    { label: "Navegador", value: "Chrome", icon: Monitor },
    { label: "Sistema operacional", value: "Windows", icon: Monitor },
    { label: "IP", value: "189.xxx.xxx.xx", icon: Wifi },
    { label: "Último login", value: formatDateTime(user.lastAccessAt), icon: Clock },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/usuarios")}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-secondary hover:text-primary transition-colors mb-5"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Voltar para Usuários
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-8 mb-7">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-[24px] font-bold text-primary shrink-0"
              style={{ background: "var(--bg-elevated)" }}
            >
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold text-primary tracking-tight">{user.name}</h1>
              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                <span className="text-[13px] text-secondary">
                  {user.position || ROLE_LABEL[user.role] || user.role}
                </span>
                <span className="text-muted">·</span>
                <span className="text-[13px] text-secondary">{user.department || "—"}</span>
                <span className="text-muted">·</span>
                <div className="flex items-center gap-1.5">
                  <StatusIcon size={12} strokeWidth={2} style={{ color: st.color }} />
                  <span className="text-[12px] font-medium" style={{ color: st.color }}>
                    {st.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(`/dashboard/usuarios/${id}`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[12px] font-semibold text-secondary border border-default transition-colors hover:bg-subtle hover:text-primary"
              style={{ background: "transparent", cursor: "pointer" }}
            >
              <Edit size={13} strokeWidth={1.5} /> Editar
            </button>
            <button
              onClick={() => setPermOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[12px] font-semibold text-secondary border border-default transition-colors hover:bg-subtle hover:text-primary"
              style={{ background: "transparent", cursor: "pointer" }}
            >
              <Shield size={13} strokeWidth={1.5} /> Permissões
            </button>
            <button
              onClick={handleResetPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[12px] font-semibold text-secondary border border-default transition-colors hover:bg-subtle hover:text-primary"
              style={{ background: "transparent", cursor: "pointer" }}
            >
              <Key size={13} strokeWidth={1.5} /> Resetar senha
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div
          className="rounded-xl p-6 mb-4"
          style={{ background: "var(--bg-app)" }}
        >
          <h3
            className="text-[14px] font-bold text-primary pb-2.5 mb-4 border-b border-default"
          >
            Informações do Usuário
          </h3>
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", columnGap: "28px" }}
          >
            {infoFields.map((row, i) => (
              <div key={i}>
                <div className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px] mb-1">
                  {row.label}
                </div>
                <div className="text-[13px] font-medium text-primary">{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div
          className="rounded-xl p-6 mb-4"
          style={{ background: "var(--bg-app)" }}
        >
          <h3 className="text-[14px] font-bold text-primary pb-2.5 mb-4 border-b border-default">
            Permissões de Acesso
          </h3>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
          >
            {PERM_SECTIONS.map((sec) => (
              <div key={sec.group}>
                <h4 className="text-[12px] font-bold text-secondary uppercase tracking-[0.4px] mb-2">
                  {sec.group}
                </h4>
                <div className="flex flex-col gap-1.5">
                  {sec.keys.map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                        style={{
                          background: perms.includes(k) ? "#FF7A00" : "var(--border-default)",
                        }}
                      />
                      <span
                        className="text-[12px]"
                        style={{
                          color: perms.includes(k) ? "var(--text-primary)" : "var(--text-muted)",
                        }}
                      >
                        {PERM_LABELS[k] || k}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity History */}
        <div
          className="rounded-xl p-6 mb-4"
          style={{ background: "var(--bg-app)" }}
        >
          <h3 className="text-[14px] font-bold text-primary pb-2.5 mb-4 border-b border-default">
            Histórico de Atividades
          </h3>
          {activities.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-5">Nenhuma atividade registrada.</p>
          ) : (
            <div className="flex flex-col gap-0">
              {activities.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 py-2.5"
                  style={{
                    borderBottom:
                      i < activities.length - 1 ? "1px solid var(--border-default)" : "none",
                  }}
                >
                  <span className="text-[12px] font-semibold text-muted font-mono min-w-[44px]">
                    {new Date(a.timestamp).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Activity size={14} strokeWidth={1.5} color="#FF7A00" className="shrink-0" />
                  <span className="text-[13px] text-primary flex-1">{a.description || a.action}</span>
                  {a.user && (
                    <span className="text-[11px] text-muted shrink-0">{a.user.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security / Sessions */}
        <div
          className="rounded-xl p-6 mb-4"
          style={{ background: "var(--bg-app)" }}
        >
          <h3 className="text-[14px] font-bold text-primary pb-2.5 mb-4 border-b border-default">
            Sessões e Segurança
          </h3>
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", columnGap: "28px" }}
          >
            {sessionFields.map((row, i) => {
              const IconComp = row.icon;
              return (
                <div key={i} className="flex gap-2.5">
                  <IconComp size={16} strokeWidth={1.5} className="text-muted mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">
                      {row.label}
                    </div>
                    <div className="text-[13px] font-medium text-primary">{row.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PermissoesModal
          open={permOpen}
          onClose={() => setPermOpen(false)}
          userId={id}
          userName={user.name}
        />
      </div>
    </DashboardLayout>
  );
}
