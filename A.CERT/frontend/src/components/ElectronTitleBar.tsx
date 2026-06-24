"use client";

import { useEffect, useState, useRef } from "react";
import { Minus, Square, X, FileText } from "lucide-react";

export default function ElectronTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [api, setApi] = useState<{ isElectron: boolean; windowMinimize: () => void; windowMaximize: () => Promise<boolean>; windowClose: () => void } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const electronApi = typeof window !== 'undefined' ? (window as any).electronAPI : null;
    if (!electronApi?.isElectron) return;
    setApi(electronApi);
    electronApi.windowIsMaximized().then(setIsMaximized);
    if (barRef.current) {
      (barRef.current.style as any).webkitAppRegion = "drag";
    }
  }, []);

  if (!api?.isElectron) return null;

  const btnStyle = (hoverBg: string) => ({
    width: "40px", height: "32px", border: "none", background: "transparent",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#8899B0", transition: "background 0.1s",
  } as React.CSSProperties);

  return (
    <div ref={barRef} className="flex items-center justify-between shrink-0"
      style={{ height: "32px", background: "#0D1425", borderBottom: "1px solid rgba(255,255,255,0.06)", userSelect: "none", paddingLeft: "12px" }}
      onDoubleClick={() => api.windowMaximize().then(setIsMaximized)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={14} strokeWidth={2} color="#FF7A00" />
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#F0F3FA", letterSpacing: "0.5px" }}>A.CERT</span>
      </div>

      <div style={{ display: "flex" }}>
        <button onClick={() => api.windowMinimize()} style={btnStyle("rgba(255,255,255,0.08)")}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
          <Minus size={14} strokeWidth={2} />
        </button>
        <button onClick={() => api.windowMaximize().then(setIsMaximized)} style={btnStyle("rgba(255,255,255,0.08)")}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
          <Square size={12} strokeWidth={2} />
        </button>
        <button onClick={() => api.windowClose()} style={btnStyle("#DC2626")}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.color = "#FFF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8899B0"; }}>
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
