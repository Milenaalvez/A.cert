"use client";

import { useState } from "react";
import {
  User,
  FileText,
  MoreHorizontal,
  Eye,
  Pencil,
  FolderOpen,
  ScrollText,
  History,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Person {
  id: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  type: string;
  dossierCount: number;
  documentationStatus: string;
  updatedAt: string;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  Completa: { bg: "#ECFDF5", text: "#059669" },
  Parcial: { bg: "#FFFBEB", text: "#D97706" },
  Pendente: { bg: "#FEF2F2", text: "#DC2626" },
  "Sem análise": { bg: "#F3F4F6", text: "#9CA3AF" },
};

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface PeopleTableProps {
  people: Person[];
  onSelect: (person: Person) => void;
  selectedId: string | null;
}

export function PeopleTable({ people, onSelect, selectedId }: PeopleTableProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (people.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 6px", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] h-9 px-2 w-[3%]"></th>
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-[0.08em] h-9 px-5 w-[22%]">Pessoa</th>
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-[0.08em] h-9 px-4 w-[10%]">CPF</th>
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-[0.08em] h-9 px-4 w-[16%]">E-mail</th>
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-[0.08em] h-9 px-4 w-[10%]">Contato</th>
              <th className="text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] h-9 px-4 w-[10%]">Dossiês</th>
              <th className="text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] h-9 px-4 w-[12%]">Documentação</th>
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-[0.08em] h-9 px-4 w-[14%]">Última atualização</th>
              <th className="text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] h-9 px-4 w-[3%]"></th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => {
              const isSelected = selectedId === person.id;
              const statusCfg = statusStyles[person.documentationStatus] || statusStyles["Sem análise"];
              return (
                <tr
                  key={person.id}
                  onClick={() => onSelect(person)}
                  className={`transition-colors duration-150 cursor-pointer`}
                  style={{
                    borderBottom: "1px solid var(--border-light)",
                    background: isSelected
                      ? isDark ? "rgba(255,122,0,0.12)" : "#FFF7ED"
                      : "transparent"
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-subtle)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <td className="px-2 text-center" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded-[4px] text-[#FF7A00] focus:ring-[#FF7A00]/30 cursor-pointer"
                      style={{ borderColor: isDark ? "#4B5563" : "#D1D5DB" }}
                    />
                  </td>
                  <td className="px-5" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 text-[12px] font-bold text-white" style={{ background: "#FF7A00" }}>
                        {getInitials(person.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-primary truncate">{person.name}</div>
                        <span className="text-[11px] text-muted">{person.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    <span className="text-[13px] text-body font-mono">{person.cpf || "-"}</span>
                  </td>
                  <td className="px-4" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    {person.email ? (
                      <span className="text-[13px] text-body truncate max-w-[180px] block">{person.email}</span>
                    ) : (
                      <span className="text-[13px] text-muted">Não informado</span>
                    )}
                  </td>
                  <td className="px-4" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    {person.phone ? (
                      <span className="text-[13px] text-body">{person.phone}</span>
                    ) : (
                      <span className="text-[13px] text-muted">Não informado</span>
                    )}
                  </td>
                  <td className="px-4 text-center" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    <span className="inline-flex items-center justify-center h-7 rounded-[6px] text-[12px] font-semibold text-body" style={{ border: "1px solid var(--border-light)", background: "var(--bg-subtle)", minWidth: "80px", paddingLeft: "24px", paddingRight: "24px" }}>
                      {person.dossierCount} dossiê{person.dossierCount !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-4 text-center" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    <span
                      className="inline-flex items-center gap-1.5 h-7 rounded-[6px] text-[12px] font-semibold"
                      style={{
                        paddingLeft: "24px",
                        paddingRight: "24px",
                        background: isDark
                          ? statusCfg.bg === "#ECFDF5" ? "rgba(5,150,105,0.15)"
                            : statusCfg.bg === "#FFFBEB" ? "rgba(217,119,6,0.15)"
                            : statusCfg.bg === "#FEF2F2" ? "rgba(220,38,38,0.15)"
                            : "rgba(156,163,175,0.15)"
                          : statusCfg.bg,
                        color: statusCfg.text
                      }}
                    >
                      <FileText size={12} strokeWidth={2} />
                      {person.documentationStatus}
                    </span>
                  </td>
                  <td className="px-4 text-left" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    <span className="text-[13px] text-muted">{formatDate(person.updatedAt)}</span>
                  </td>
                  <td className="px-4 text-center relative" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === person.id ? null : person.id) }}
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-body)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)" }}
                    >
                      <MoreHorizontal size={16} strokeWidth={1.5} />
                    </button>
                    {menuOpen === person.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-full mt-1 w-[180px] rounded-[10px] bg-surface py-1.5 z-20 shadow-[0_4px_16px_rgba(0,0,0,0.1)]" style={{ border: "1px solid var(--border-light)" }}>
                          {[
                            { icon: Eye, label: "Visualizar" },
                            { icon: Pencil, label: "Editar" },
                            { icon: FolderOpen, label: "Ver dossiês" },
                            { icon: ScrollText, label: "Ver certidões" },
                            { icon: History, label: "Histórico" },
                          ].map((item) => (
                            <button
                              key={item.label}
                              onClick={(e) => { e.stopPropagation(); setMenuOpen(null) }}
                              className="flex items-center gap-3 w-full h-9 px-4 text-[13px] transition-colors"
                              style={{ color: "var(--text-body)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)" }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                            >
                              <item.icon size={14} strokeWidth={1.5} className="text-muted" />
                              {item.label}
                            </button>
                          ))}
                          <div className="h-px mx-3 my-1.5" style={{ background: "var(--border-light)" }} />
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(null) }}
                            className="flex items-center gap-3 w-full h-9 px-4 text-[13px] transition-colors"
                            style={{ color: "#DC2626" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
