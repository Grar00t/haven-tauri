// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATION STACK — Toast Notifications
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { useNotifications, useHavenStore } from '../store';

const TYPE_CONFIG = {
  success: { icon: CheckCircle, color: 'var(--haven-green)', bg: 'rgba(0,255,65,0.08)' },
  error:   { icon: XCircle,    color: 'var(--haven-error)',  bg: 'rgba(255,68,68,0.08)' },
  warning: { icon: AlertCircle, color: 'var(--haven-warning)', bg: 'rgba(255,170,0,0.08)' },
  info:    { icon: Info,        color: 'var(--haven-info)',   bg: 'rgba(68,136,255,0.08)' },
};

export default function NotificationStack() {
  const notifications = useNotifications();
  const { removeNotification } = useHavenStore();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 36,
      right: 16,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxWidth: 360,
      pointerEvents: 'none',
    }}>
      {notifications.map(n => {
        const { icon: Icon, color, bg } = TYPE_CONFIG[n.type];
        return (
          <div
            key={n.id}
            className="animate-slide-up"
            style={{
              background: 'var(--haven-surface)',
              border: `1px solid ${color}44`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 6,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              backdropFilter: 'blur(8px)',
              background: bg,
              pointerEvents: 'all',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <Icon size={14} style={{ color, flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--haven-text-1)', flex: 1, lineHeight: 1.5 }}>
              {n.message}
            </span>
            <button
              onClick={() => removeNotification(n.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--haven-text-4)',
                flexShrink: 0,
                display: 'flex',
              }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
