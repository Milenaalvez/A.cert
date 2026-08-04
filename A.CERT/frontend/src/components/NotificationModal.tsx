'use client';

import { X, Bell, CheckCircle, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  details?: string;
  type: string;
  isRead: number;
  link?: string;
  createdAt: string;
}

interface Props {
  notification: Notification | null;
  onClose: () => void;
  onNavigate?: (link: string) => void;
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  success: { icon: CheckCircle, color: '#22C55E', bg: 'rgba(34,197,94,0.12)', label: 'Concluído' },
  warning: { icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Aviso' },
  error: { icon: AlertCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Erro' },
  info: { icon: Info, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Informação' },
};

export default function NotificationModal({ notification, onClose, onNavigate }: Props) {
  if (!notification) return null;

  const cfg = typeConfig[notification.type] || typeConfig.info;
  const Icon = cfg.icon;
  const hasDetails = notification.details && notification.details.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-8">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full animate-in fade-in zoom-in-95 duration-200"
        style={{
          maxWidth: 560,
          borderRadius: 16,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '36px 44px 24px' }}>
          <div className="flex items-start justify-between gap-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors cursor-pointer order-2"
            >
              <X size={16} strokeWidth={2} className="text-[#94A3B8]" />
            </button>

            {/* Icon + Title block */}
            <div className="flex items-start gap-4 order-1 min-w-0">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 48, height: 48, background: cfg.bg }}
              >
                <Icon size={24} strokeWidth={1.6} color={cfg.color} />
              </div>

              <div className="min-w-0">
                <span
                  className="inline-block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <h2 className="text-[17px] font-semibold text-[#F0F3FA] leading-snug break-words">
                  {notification.title}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div style={{ padding: '0 44px 24px' }}>
          <p className="text-[14px] text-[#CBD5E1] leading-relaxed">
            {notification.message}
          </p>
          <p className="text-[12px] text-[#94A3B8] mt-3">
            {formatDate(notification.createdAt)}
          </p>
        </div>

        {/* Details section */}
        {hasDetails && (
          <div style={{ padding: '0 44px 28px' }}>
            <div
              className="rounded-xl"
              style={{
                padding: '20px 24px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-default)',
              }}
            >
              <h3 className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                O que aconteceu
              </h3>
              <div className="text-[14px] text-[#CBD5E1] leading-relaxed whitespace-pre-line">
                {notification.details}
              </div>
            </div>
          </div>
        )}

        {/* Divider + Actions */}
        <div style={{ margin: '0 44px', height: 1, background: 'var(--border-default)' }} />

        <div style={{ padding: '24px 44px 44px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl text-[14px] font-medium transition-colors cursor-pointer"
            style={{
              background: 'transparent',
              color: '#94A3B8',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Fechar
          </button>

          {notification.link && onNavigate && (
            <button
              onClick={() => onNavigate(notification.link!)}
              className="flex-1 h-12 rounded-xl text-[14px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              style={{ background: cfg.color, color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Ver no sistema
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
