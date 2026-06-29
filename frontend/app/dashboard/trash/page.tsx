"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Eye, RotateCcw, Trash2, X, User, Building2,
  FolderOpen, Users, AlertTriangle, Calendar, Mail, Phone,
  MapPin, Hash, FileText, Shield, Clock, UserCog, Archive,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ConfirmModal from "@/components/ConfirmModal";
import * as trashApi from "@/services/trashApi";

interface TrashItem {
  id: string;
  title: string;
  subtitle1: string;
  subtitle2: string;
  entityType: string;
  entityLabel: string;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  extra?: Record<string, any>;
}

interface DetailData {
  [key: string]: any;
}

const ENTITY_CONFIG = {
  pessoas: { label: "Pessoa", icon: User, color: "#3B82F6" },
  imoveis: { label: "Imóvel", icon: Building2, color: "#8B5CF6" },
  dossies: { label: "Dossiê", icon: FolderOpen, color: "#F59E0B" },
  usuarios: { label: "Usuário", icon: UserCog, color: "#10B981" },
} as const;

type FilterKey = "todos" | "pessoas" | "imoveis" | "dossies" | "usuarios";

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Agora há pouco";
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `Hoje, ${new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 172800) return `Ontem, ${new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  const Icon = icon;
  return (
    <div className="flex items-start gap-3" style={{ padding: "6px 0" }}>
      <Icon size={15} strokeWidth={1.5} style={{ color: "var(--text-secondary)", marginTop: 2, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 1, wordBreak: "break-word" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");
  const searchRef = useRef<HTMLInputElement>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<TrashItem | null>(null);
  const [previewData, setPreviewData] = useState<DetailData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [restoreConfirm, setRestoreConfirm] = useState<TrashItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TrashItem | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trashApi.listTrash(activeFilter === "todos" ? undefined : activeFilter);
      setItems(data.items || []);
    } catch {} finally { setLoading(false); }
  }, [activeFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filtered = items.filter((item) => {
    const s = search.toLowerCase();
    if (!s) return true;
    return item.title?.toLowerCase().includes(s) ||
      item.subtitle1?.toLowerCase().includes(s) ||
      item.subtitle2?.toLowerCase().includes(s) ||
      item.entityLabel?.toLowerCase().includes(s);
  });

  const counts = {
    todos: items.length,
    pessoas: items.filter(i => i.entityType === "pessoas").length,
    imoveis: items.filter(i => i.entityType === "imoveis").length,
    dossies: items.filter(i => i.entityType === "dossies").length,
    usuarios: items.filter(i => i.entityType === "usuarios").length,
  };

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "todos", label: "Todos", count: counts.todos },
    { key: "pessoas", label: "Pessoas", count: counts.pessoas },
    { key: "imoveis", label: "Imóveis", count: counts.imoveis },
    { key: "dossies", label: "Dossiês", count: counts.dossies },
    { key: "usuarios", label: "Usuários", count: counts.usuarios },
  ];

  async function handlePreview(item: TrashItem) {
    setPreviewItem(item);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const data = await trashApi.getTrashItem(item.entityType, item.id);
      setPreviewData(data);
    } catch {} finally { setPreviewLoading(false); }
  }

  function renderPreviewContent() {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 28, height: 28, border: "3px solid var(--border-light)", borderTopColor: "#FF7A00", borderRadius: "50%" }} />
        </div>
      );
    }
    if (!previewData || !previewItem) return null;

    const entity = previewItem.entityType;

    if (entity === "pessoas") {
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <DetailRow icon={User} label="Nome" value={previewData.name} />
          <DetailRow icon={Hash} label="CPF/CNPJ" value={previewData.cpf || previewData.cnpj} />
          <DetailRow icon={Mail} label="E-mail" value={previewData.email} />
          <DetailRow icon={Phone} label="Telefone" value={previewData.phone} />
          <DetailRow icon={MapPin} label="Endereço" value={previewData.address} />
          <DetailRow icon={Calendar} label="Data de Cadastro" value={formatDate(previewData.created_at)} />
        </div>
      );
    }

    if (entity === "imoveis") {
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <DetailRow icon={Building2} label="Tipo" value={previewData.type} />
          <DetailRow icon={MapPin} label="Endereço" value={previewData.address} />
          <DetailRow icon={Hash} label="Matrícula" value={previewData.registration} />
          <DetailRow icon={FileText} label="Inscrição" value={previewData.inscription} />
          <DetailRow icon={Hash} label="Registro" value={previewData.registration_number} />
          <DetailRow icon={Calendar} label="Data de Cadastro" value={formatDate(previewData.created_at)} />
        </div>
      );
    }

    if (entity === "dossies") {
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <DetailRow icon={FolderOpen} label="Identificador" value={previewData.identifier} />
          <DetailRow icon={Shield} label="Status" value={previewData.status} />
          <DetailRow icon={User} label="Criado por" value={previewData.created_by} />
          <DetailRow icon={Building2} label="Imóvel" value={previewData.property_id} />
          <DetailRow icon={User} label="Pessoa" value={previewData.person_id} />
          <DetailRow icon={Calendar} label="Data de Criação" value={formatDate(previewData.created_at)} />
        </div>
      );
    }

    if (entity === "usuarios") {
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <DetailRow icon={UserCog} label="Nome" value={previewData.name} />
          <DetailRow icon={Mail} label="E-mail" value={previewData.email} />
          <DetailRow icon={Shield} label="Cargo" value={previewData.role} />
          <DetailRow icon={Users} label="Departamento" value={previewData.department} />
          <DetailRow icon={Clock} label="Último Acesso" value={formatDate(previewData.last_access_at)} />
          <DetailRow icon={Calendar} label="Data de Cadastro" value={formatDate(previewData.created_at)} />
        </div>
      );
    }

    return <p style={{ color: "var(--text-secondary)" }}>Nenhum detalhe disponível</p>;
  }

  async function handleRestore() {
    if (!restoreConfirm) return;
    try {
      await trashApi.restoreTrashItem(restoreConfirm.entityType, restoreConfirm.id);
      setRestoreConfirm(null);
      fetchItems();
    } catch (err: any) {
      alert(err.message || "Erro ao restaurar");
    }
  }

  async function handlePermanentDelete() {
    if (!deleteConfirm) return;
    try {
      await trashApi.permanentDelete(deleteConfirm.entityType, deleteConfirm.id);
      setDeleteConfirm(null);
      fetchItems();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir permanentemente");
    }
  }

  function getEntityBadge(entityType: string) {
    const cfg = ENTITY_CONFIG[entityType as keyof typeof ENTITY_CONFIG];
    if (!cfg) return null;
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, padding: "2px 8px",
          borderRadius: 4, color: cfg.color,
          background: `${cfg.color}14`,
          whiteSpace: "nowrap",
        }}
      >
        <cfg.icon size={11} strokeWidth={2} />
        {cfg.label}
      </span>
    );
  }

  function getRemovalBadge(item: TrashItem) {
    const isDeleted = !!item.deletedAt;
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, padding: "2px 8px",
          borderRadius: 4,
          color: isDeleted ? "#EF4444" : "#F59E0B",
          background: isDeleted ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
          whiteSpace: "nowrap",
        }}
      >
        {isDeleted ? <Trash2 size={11} strokeWidth={2} /> : <Archive size={11} strokeWidth={2} />}
        {isDeleted ? "Excluído" : "Arquivado"}
      </span>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "24px 32px 48px 32px" }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Lixeira</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Itens removidos e arquivados. Restaure ou exclua permanentemente.
          </p>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            height: 42, padding: "0 14px",
            background: "var(--bg-app)", border: "1px solid var(--border-default)",
            borderRadius: 8, maxWidth: 400,
            transition: "border-color 0.15s",
          }}
        >
          <Search size={16} strokeWidth={2} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar na lixeira... (Ctrl+K)"
            style={{
              flex: 1, height: "100%", border: "none", outline: "none",
              background: "transparent", fontSize: 13, color: "var(--text-primary)",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4 }}>
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)" }}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  position: "relative",
                  height: 36, padding: "0 16px",
                  border: "none", background: "transparent",
                  cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  color: isActive ? "#FF7A00" : "var(--text-secondary)",
                  borderBottom: isActive ? "3px solid #FF7A00" : "3px solid transparent",
                  marginBottom: -2,
                  transition: "color 0.15s",
                  whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {f.label}
                <span
                  style={{
                    fontSize: 11, fontWeight: 600,
                    color: isActive ? "#FF7A00" : "var(--text-tertiary)",
                    background: isActive ? "rgba(255,122,0,0.1)" : "var(--bg-muted)",
                    padding: "0 6px", borderRadius: 4,
                    lineHeight: "18px",
                  }}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ border: "1px solid var(--border-default)", borderRadius: 10, overflow: "hidden", background: "var(--bg-surface)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                <th style={thStyle}>Item</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Removido em</th>
                <th style={{ ...thStyle, textAlign: "right", width: 120 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "60px 20px" }}>
                        <div className="flex items-center justify-center gap-3" style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                          <div className="animate-spin" style={{ width: 20, height: 20, border: "2px solid var(--border-light)", borderTopColor: "#FF7A00", borderRadius: "50%" }} />
                          Carregando...
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)", fontSize: 13 }}>
                        <Trash2 size={24} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 8 }} />
                        <div>Nenhum item na lixeira</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const removedDate = item.deletedAt || item.archivedAt;
                      return (
                        <tr key={`${item.entityType}-${item.id}`} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.1s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-muted)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ ...tdStyle, padding: "14px 16px" }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{item.title}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>{item.subtitle1}</div>
                          </td>
                          <td style={{ ...tdStyle, padding: "14px 16px" }}>
                            {getEntityBadge(item.entityType)}
                          </td>
                          <td style={{ ...tdStyle, padding: "14px 16px" }}>
                            {getRemovalBadge(item)}
                          </td>
                          <td style={{ ...tdStyle, padding: "14px 16px", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: 12, color: "var(--text-primary)" }}>{formatDate(removedDate)}</div>
                            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{timeAgo(removedDate)}</div>
                          </td>
                          <td style={{ ...tdStyle, padding: "8px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                              <button
                                onClick={() => handlePreview(item)}
                                title="Visualizar detalhes"
                                style={actionBtnStyle}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)" }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent" }}
                              >
                                <Eye size={15} strokeWidth={1.5} />
                              </button>
                              <button
                                onClick={() => setRestoreConfirm(item)}
                                title="Restaurar"
                                style={actionBtnStyle}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; e.currentTarget.style.color = "#10B981" }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent" }}
                              >
                                <RotateCcw size={15} strokeWidth={1.5} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(item)}
                                title="Excluir permanentemente"
                                style={actionBtnStyle}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#EF4444" }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent" }}
                              >
                                <Trash2 size={15} strokeWidth={1.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

      {/* ─── Preview Modal ─── */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
            onClick={() => setPreviewOpen(false)}
          />
          <div
            className="relative w-full animate-in fade-in zoom-in-95 duration-200"
            style={{
              maxWidth: 560, borderRadius: 12,
              background: "var(--bg-surface)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 16px 24px",
              borderBottom: "1px solid var(--border-light)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: previewItem ? `${ENTITY_CONFIG[previewItem.entityType as keyof typeof ENTITY_CONFIG]?.color}14` || "var(--bg-muted)" : "var(--bg-muted)",
                }}>
                  {previewItem && (() => {
                    const Icon = ENTITY_CONFIG[previewItem.entityType as keyof typeof ENTITY_CONFIG]?.icon || Eye;
                    return <Icon size={18} strokeWidth={1.5} style={{ color: ENTITY_CONFIG[previewItem.entityType as keyof typeof ENTITY_CONFIG]?.color || "var(--text-secondary)" }} />;
                  })()}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                    {previewItem?.title || "Detalhes"}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>
                    {previewItem?.entityLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  border: "none", background: "transparent",
                  cursor: "pointer", color: "var(--text-tertiary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div style={{ padding: "20px 24px", minHeight: 100 }}>
              {renderPreviewContent()}
            </div>

            <div style={{
              display: "flex", justifyContent: "flex-end", gap: 8,
              padding: "12px 24px",
              borderTop: "1px solid var(--border-light)",
            }}>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{
                  height: 36, padding: "0 16px", borderRadius: 6,
                  border: "1px solid var(--border-light)",
                  fontSize: 12, fontWeight: 600,
                  color: "var(--text-secondary)", background: "transparent",
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!restoreConfirm}
        title="Restaurar item"
        message={`Tem certeza que deseja restaurar "${restoreConfirm?.title}"? Ele voltará a aparecer na listagem principal.`}
        confirmLabel="Restaurar"
        cancelLabel="Cancelar"
        variant="default"
        icon={<RotateCcw size={24} strokeWidth={2} color="#10B981" />}
        onConfirm={handleRestore}
        onCancel={() => setRestoreConfirm(null)}
        onClose={() => setRestoreConfirm(null)}
      />

      <ConfirmModal
        open={!!deleteConfirm}
        title="Excluir permanentemente"
        message={`Esta ação não pode ser desfeita. "${deleteConfirm?.title}" será excluído permanentemente.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        icon={<AlertTriangle size={24} strokeWidth={2} color="#DC2626" />}
        onConfirm={handlePermanentDelete}
        onCancel={() => setDeleteConfirm(null)}
        onClose={() => setDeleteConfirm(null)}
      />
    </DashboardLayout>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.05em", color: "var(--text-secondary)",
  padding: "12px 16px", textAlign: "left", whiteSpace: "nowrap",
  background: "var(--bg-muted)",
};

const tdStyle: React.CSSProperties = {
  fontSize: 13, verticalAlign: "middle",
};

const actionBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 6,
  border: "none", background: "transparent",
  cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: "var(--text-tertiary)",
  transition: "all 0.12s",
};
