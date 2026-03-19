// ═══════════════════════════════════════════════════════════════════════
// STATUS BAR — Connection & System Status
// شريط الحالة
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { Cpu, Wifi, WifiOff, Brain, Globe, GitBranch, HardDrive } from 'lucide-react';
import { useHavenStore, useAI, useActiveFile } from '../store';
import { t, i18n } from '../i18n';

// ── Format bytes ──────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// ── Status Item ───────────────────────────────────────────────────────

function StatusItem({
  icon: Icon,
  text,
  color,
  title,
  onClick,
}: {
  icon: React.ElementType;
  text: string;
  color?: string;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <div
      title={title}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        color: color ?? 'var(--haven-text-3)',
        cursor: onClick ? 'pointer' : 'default',
        padding: '0 4px',
        borderRadius: 3,
        transition: 'background 0.1s',
        height: '100%',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={onClick ? (e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')) : undefined}
      onMouseLeave={onClick ? (e => (e.currentTarget.style.background = 'transparent')) : undefined}
    >
      <Icon size={11} />
      <span>{text}</span>
    </div>
  );
}

// ── Main Status Bar ───────────────────────────────────────────────────

export default function StatusBar() {
  const ai = useAI();
  const activeFile = useActiveFile();
  const { systemInfo, setLayout } = useHavenStore();
  const niyahSession = ai.lastNiyahSession;

  const isConnected = ai.connectionStatus === 'connected';
  const isConnecting = ai.connectionStatus === 'connecting';

  const connectionColor = isConnected
    ? 'var(--haven-green)'
    : isConnecting
    ? 'var(--haven-warning)'
    : 'var(--haven-text-4)';

  return (
    <div className="haven-statusbar" style={{ gap: 0 }}>
      {/* Left: Ollama Status */}
      <StatusItem
        icon={isConnected ? Wifi : WifiOff}
        text={
          isConnected
            ? t('status.connected')
            : isConnecting
            ? t('status.connecting')
            : t('status.disconnected')
        }
        color={connectionColor}
        title="Ollama connection status"
        onClick={() => setLayout({ aiPanelOpen: true })}
      />

      {/* Active Model */}
      {isConnected && ai.activeModel && (
        <>
          <Divider />
          <StatusItem
            icon={Brain}
            text={ai.activeModel.split(':')[0]}
            color="var(--haven-gold)"
            title={`Active model: ${ai.activeModel}`}
          />
        </>
      )}

      {/* NiyahEngine: Dialect */}
      {niyahSession && (
        <>
          <Divider />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--haven-text-3)',
            padding: '0 4px',
          }}>
            <span style={{ fontSize: 10 }}>
              {getDialectLabel(niyahSession.vector.dialect)}
            </span>
          </div>
        </>
      )}

      {/* NiyahEngine: Domain */}
      {niyahSession && (
        <>
          <Divider />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--haven-text-4)',
            padding: '0 4px',
          }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>
              {niyahSession.vector.domain}
            </span>
            <span style={{ fontSize: 10, color: niyahSession.vector.confidence > 0.7 ? 'var(--haven-green)' : 'var(--haven-text-4)' }}>
              {Math.round(niyahSession.vector.confidence * 100)}%
            </span>
          </div>
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Active File language */}
      {activeFile && (
        <>
          <StatusItem
            icon={GitBranch}
            text={activeFile.language}
            color="var(--haven-text-3)"
          />
          <Divider />
        </>
      )}

      {/* System Info */}
      {systemInfo && (
        <>
          <StatusItem
            icon={Cpu}
            text={`${Math.round(systemInfo.cpuUsage)}%`}
            color={systemInfo.cpuUsage > 80 ? 'var(--haven-warning)' : 'var(--haven-text-3)'}
            title={`CPU: ${Math.round(systemInfo.cpuUsage)}%`}
          />
          <Divider />
          <StatusItem
            icon={HardDrive}
            text={`${formatBytes(systemInfo.memoryUsed)} / ${formatBytes(systemInfo.memoryTotal)}`}
            color="var(--haven-text-3)"
            title="RAM usage"
          />
          <Divider />
        </>
      )}

      {/* Language */}
      <StatusItem
        icon={Globe}
        text={i18n.lang.toUpperCase()}
        color="var(--haven-text-3)"
        title="Current language"
      />

      <Divider />

      {/* Sovereignty Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 6px',
        color: 'var(--haven-green)',
        fontSize: 10,
      }} title="Zero telemetry — 100% local">
        <div className="sovereignty-dot" style={{ width: 5, height: 5 }} />
        <span style={{ fontFamily: 'var(--font-mono)' }}>SOVEREIGN</span>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      width: 1,
      height: 14,
      background: 'var(--haven-border)',
      margin: '0 4px',
    }} />
  );
}

function getDialectLabel(dialect: string): string {
  const labels: Record<string, string> = {
    saudi:    'نجدي',
    khaleeji: 'خليجي',
    egyptian: 'مصري',
    levantine:'شامي',
    maghrebi: 'مغربي',
    msa:      'فصحى',
    english:  'EN',
    mixed:    'مختلط',
  };
  return labels[dialect] ?? dialect;
}
