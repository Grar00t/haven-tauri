// ═══════════════════════════════════════════════════════════════════════
// TOP BAR — Window Controls & Branding
// شريط العنوان — تحكم النافذة والهوية
// ═══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useHavenStore, useAI } from '../store';
import { t } from '../i18n';
import {
  Minus, Square, X, Code2, Cpu, Wifi, WifiOff,
  Brain, Layers, TerminalSquare, PanelRight, GitBranch,
} from 'lucide-react';

// ── Haven Logo SVG ────────────────────────────────────────────────────

function HavenLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="HAVEN IDE"
    >
      {/* Hexagonal sovereignty mark */}
      <path
        d="M12 2L21.196 7V17L12 22L2.804 17V7L12 2Z"
        stroke="#d4af37"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner triangle — three lobes */}
      <path
        d="M12 7L16.5 15H7.5L12 7Z"
        fill="#d4af37"
        fillOpacity="0.8"
      />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5" fill="#00ff41" />
    </svg>
  );
}

// ── Window Controls ───────────────────────────────────────────────────

function WindowControls() {
  const appWindow = getCurrentWindow();

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  return (
    <div
      className="haven-titlebar-buttons"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '0 8px',
      }}
    >
      {/* macOS-style traffic lights */}
      <button
        onClick={handleClose}
        title="Close"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: 'none',
          background: '#ff4444',
          cursor: 'pointer',
          margin: '0 3px',
          transition: 'filter 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.3)')}
        onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
      />
      <button
        onClick={handleMinimize}
        title="Minimize"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: 'none',
          background: '#ffaa00',
          cursor: 'pointer',
          margin: '0 3px',
          transition: 'filter 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.3)')}
        onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
      />
      <button
        onClick={handleMaximize}
        title="Maximize"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: 'none',
          background: '#00cc33',
          cursor: 'pointer',
          margin: '0 3px',
          transition: 'filter 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.3)')}
        onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
      />
    </div>
  );
}

// ── Toolbar Actions ───────────────────────────────────────────────────

function ToolbarBtn({
  icon: Icon,
  label,
  active,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  color?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        border: 'none',
        borderRadius: 4,
        background: active ? 'rgba(212,175,55,0.1)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? (color ?? 'var(--haven-gold)') : hovered ? 'var(--haven-text-1)' : 'var(--haven-text-3)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={15} />
    </button>
  );
}

// ── Main TopBar ───────────────────────────────────────────────────────

export default function TopBar() {
  const { layout, setLayout } = useHavenStore();
  const ai = useAI();
  const editor = useHavenStore(s => s.editor);

  const isConnected = ai.connectionStatus === 'connected';
  const isConnecting = ai.connectionStatus === 'connecting';

  return (
    <div
      className="haven-titlebar"
      style={{
        height: 'var(--titlebar-height)',
        background: 'var(--haven-void)',
        borderBottom: '1px solid var(--haven-border)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8,
        gap: 0,
        WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion'],
        userSelect: 'none',
      } as React.CSSProperties}
    >
      {/* Window Controls (left) */}
      <div style={{ WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion'] } as React.CSSProperties}>
        <WindowControls />
      </div>

      {/* Logo + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
        <HavenLogo size={18} />
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--haven-gold)',
          letterSpacing: '0.05em',
          fontFamily: 'var(--font-mono)',
        }}>
          HAVEN
        </span>
        <span style={{ fontSize: 11, color: 'var(--haven-text-4)', fontFamily: 'var(--font-mono)' }}>
          IDE
        </span>
      </div>

      {/* Git Branch (if workspace open) */}
      {editor.workspacePath && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginLeft: 16,
          color: 'var(--haven-text-3)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}>
          <GitBranch size={12} />
          <span>main</span>
        </div>
      )}

      {/* Spacer — draggable area */}
      <div style={{ flex: 1 }} />

      {/* Toolbar Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion'],
        } as React.CSSProperties}
      >
        <ToolbarBtn
          icon={Code2}
          label="Explorer (Ctrl+B)"
          active={layout.sidebarOpen}
          onClick={() => setLayout({ sidebarOpen: !layout.sidebarOpen })}
        />
        <ToolbarBtn
          icon={Brain}
          label="AI Panel (Ctrl+Shift+A)"
          active={layout.aiPanelOpen}
          onClick={() => setLayout({ aiPanelOpen: !layout.aiPanelOpen })}
        />
        <ToolbarBtn
          icon={TerminalSquare}
          label="Terminal (Ctrl+Shift+J)"
          active={layout.terminalOpen}
          onClick={() => setLayout({ terminalOpen: !layout.terminalOpen })}
        />
        <ToolbarBtn
          icon={Layers}
          label="Intent Graph (Ctrl+Shift+I)"
          active={layout.intentGraphOpen}
          onClick={() => setLayout({ intentGraphOpen: !layout.intentGraphOpen })}
        />

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'var(--haven-border)', margin: '0 4px' }} />

        {/* Ollama Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 4,
          border: `1px solid ${isConnected ? 'rgba(0,255,65,0.2)' : 'var(--haven-border)'}`,
          background: isConnected ? 'rgba(0,255,65,0.05)' : 'transparent',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: isConnected ? 'var(--haven-green)' : isConnecting ? 'var(--haven-warning)' : 'var(--haven-text-4)',
        }}>
          {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {isConnected ? t('status.connected') : isConnecting ? t('status.connecting') : t('status.disconnected')}
          {isConnected && ai.activeModel && (
            <span style={{ color: 'var(--haven-text-3)', marginLeft: 4 }}>
              {ai.activeModel.split(':')[0]}
            </span>
          )}
        </div>

        <ToolbarBtn
          icon={PanelRight}
          label="Settings"
          onClick={() => useHavenStore.getState().setLayout({ sidebarTab: 'settings', sidebarOpen: true })}
        />

        {/* Sovereignty dot */}
        <div title="Zero Telemetry — 100% Local" style={{ marginLeft: 4 }}>
          <Cpu size={13} style={{ color: 'var(--haven-green)' }} />
        </div>
      </div>
    </div>
  );
}
