"use client";

import { useState } from "react";
import { Monitor, X, Maximize2, Minimize2, Loader2, ExternalLink } from "lucide-react";

interface Props {
  displayId: string | null;
  displayPort: number | null;
  jobStatus?: string;
}

export default function RemoteDisplay({ displayId, displayPort, jobStatus }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [show, setShow] = useState(false);

  if (!displayId) return null;

  const novncUrl = `/novnc/viewer.html?displayId=${displayId}&port=${displayPort || 5901}`;

  return (
    <>
      <button
        onClick={() => setShow(!show)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          background: show ? "rgba(255,122,0,0.12)" : "rgba(255,255,255,0.05)",
          border: show ? "1px solid rgba(255,122,0,0.35)" : "1px solid rgba(255,255,255,0.12)",
          borderRadius: "8px",
          color: show ? "#FF7A00" : "var(--text-secondary)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        title={show ? "Fechar display remoto" : "Abrir display remoto"}
      >
        <Monitor size={15} />
        {show ? "Fechar Display" : "Display Remoto"}
        {jobStatus === "processing" && (
          <Loader2 size={10} className="animate-spin" style={{ opacity: 0.7 }} />
        )}
      </button>

      {show ? (
        <div
          style={{
            position: "fixed",
            bottom: expanded ? 0 : 24,
            right: expanded ? 0 : 24,
            width: expanded ? "100%" : "560px",
            height: expanded ? "100%" : "420px",
            maxWidth: expanded ? "100%" : "90vw",
            maxHeight: expanded ? "100%" : "70vh",
            zIndex: 9999,
            borderRadius: expanded ? 0 : "12px",
            overflow: "hidden",
            background: "#0a0a0a",
            border: expanded ? "none" : "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              background: "#1a1a1a",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Monitor size={14} style={{ color: "#FF7A00" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>
                Display Remoto — {displayId}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <a
                href={novncUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 6px",
                  color: "rgba(255,255,255,0.5)",
                  borderRadius: "4px",
                  transition: "background 0.15s",
                }}
                title="Abrir em nova janela"
              >
                <ExternalLink size={13} />
              </a>
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 6px",
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  borderRadius: "4px",
                  transition: "background 0.15s",
                }}
                title={expanded ? "Restaurar" : "Expandir"}
              >
                {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button
                onClick={() => setShow(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 6px",
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  borderRadius: "4px",
                  transition: "background 0.15s",
                }}
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <iframe
            src={`${novncUrl}&autoconnect=1`}
            style={{
              flex: 1,
              width: "100%",
              border: "none",
              background: "#0a0a0a",
            }}
            title={`Display Remoto — ${displayId}`}
            allow="clipboard-read; clipboard-write"
          />
        </div>
      ) : null}
    </>
  );
}
