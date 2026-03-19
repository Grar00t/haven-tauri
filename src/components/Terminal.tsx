// ═══════════════════════════════════════════════════════════════════════
// TERMINAL — Embedded xterm.js Terminal
// الطرفية المدمجة
// ═══════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Plus, Trash2, X, TerminalSquare } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useHavenStore } from '../store';
import { t } from '../i18n';
import '@xterm/xterm/css/xterm.css';

// ── Terminal Instance ─────────────────────────────────────────────────

interface TerminalTab {
  id: string;
  title: string;
  xterm: XTerm;
  fitAddon: FitAddon;
  cwd: string;
  history: string[];
  historyIndex: number;
  currentInput: string;
}

function createTerminal(): Omit<TerminalTab, 'id' | 'title'> {
  const xterm = new XTerm({
    theme: {
      background: '#050505',
      foreground: '#f0f0f0',
      cursor: '#d4af37',
      cursorAccent: '#0a0a0a',
      black: '#0a0a0a',
      red: '#ff4444',
      green: '#00ff41',
      yellow: '#d4af37',
      blue: '#4488ff',
      magenta: '#cc44ff',
      cyan: '#00ccff',
      white: '#f0f0f0',
      brightBlack: '#404040',
      brightRed: '#ff6666',
      brightGreen: '#33ff66',
      brightYellow: '#f0cc55',
      brightBlue: '#6699ff',
      brightMagenta: '#dd66ff',
      brightCyan: '#33ddff',
      brightWhite: '#ffffff',
      selectionBackground: '#d4af3733',
    },
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 13,
    lineHeight: 1.4,
    cursorBlink: true,
    cursorStyle: 'bar',
    scrollback: 5000,
    allowTransparency: true,
    allowProposedApi: true,
  });

  const fitAddon = new FitAddon();
  xterm.loadAddon(fitAddon);
  xterm.loadAddon(new WebLinksAddon());

  return {
    xterm,
    fitAddon,
    cwd: '~',
    history: [],
    historyIndex: -1,
    currentInput: '',
  };
}

// ── Terminal Panel ─────────────────────────────────────────────────────

export default function Terminal() {
  const { editor } = useHavenStore();
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const terminalDivRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const activeTabRef = useRef<TerminalTab | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;
  activeTabRef.current = activeTab;

  // ── Create Tab ──────────────────────────────────────────────────────

  const createTab = useCallback(() => {
    const id = `term-${Date.now()}`;
    const { xterm, fitAddon, cwd, history, historyIndex, currentInput } = createTerminal();

    const tab: TerminalTab = {
      id,
      title: `Shell ${tabs.length + 1}`,
      xterm,
      fitAddon,
      cwd: editor.workspacePath ?? '~',
      history,
      historyIndex,
      currentInput,
    };

    setTabs(prev => [...prev, tab]);
    setActiveTabId(id);

    return tab;
  }, [tabs.length, editor.workspacePath]);

  // Initialize with one tab
  useEffect(() => {
    if (tabs.length === 0) {
      createTab();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mount xterm to DOM ──────────────────────────────────────────────

  useEffect(() => {
    if (!activeTab || !terminalDivRef.current) return;

    // Clear previous content
    const container = terminalDivRef.current;
    container.innerHTML = '';

    // Open xterm in container
    activeTab.xterm.open(container);

    // Fit to container
    setTimeout(() => {
      try {
        activeTab.fitAddon.fit();
      } catch { /* ignore */ }
    }, 50);

    // Write welcome message
    if (activeTab.history.length === 0) {
      activeTab.xterm.writeln('\x1b[33m╔═══════════════════════════════════════╗\x1b[0m');
      activeTab.xterm.writeln('\x1b[33m║  HAVEN IDE — Sovereign Terminal        ║\x1b[0m');
      activeTab.xterm.writeln('\x1b[33m║  الطرفية السيادية — لا تتبع، لا cloud ║\x1b[0m');
      activeTab.xterm.writeln('\x1b[33m╚═══════════════════════════════════════╝\x1b[0m');
      activeTab.xterm.writeln('');
      writePrompt(activeTab);
    }

    // Handle input
    const dataDisposable = activeTab.xterm.onData(async (data) => {
      const tab = activeTabRef.current;
      if (!tab) return;

      // Handle special keys
      if (data === '\r') {
        // Enter — execute command
        const cmd = tab.currentInput.trim();
        tab.xterm.writeln('');

        if (cmd) {
          tab.history.unshift(cmd);
          if (tab.history.length > 100) tab.history.pop();
          tab.historyIndex = -1;

          await executeCommand(tab, cmd);
        }

        tab.currentInput = '';
        writePrompt(tab);
      } else if (data === '\x7F') {
        // Backspace
        if (tab.currentInput.length > 0) {
          tab.currentInput = tab.currentInput.slice(0, -1);
          tab.xterm.write('\b \b');
        }
      } else if (data === '\x1b[A') {
        // Arrow up — history
        if (tab.history.length > 0) {
          tab.historyIndex = Math.min(tab.historyIndex + 1, tab.history.length - 1);
          const hist = tab.history[tab.historyIndex];
          clearCurrentLine(tab);
          tab.currentInput = hist;
          tab.xterm.write(hist);
        }
      } else if (data === '\x1b[B') {
        // Arrow down
        if (tab.historyIndex > 0) {
          tab.historyIndex--;
          const hist = tab.history[tab.historyIndex];
          clearCurrentLine(tab);
          tab.currentInput = hist;
          tab.xterm.write(hist);
        } else {
          tab.historyIndex = -1;
          clearCurrentLine(tab);
          tab.currentInput = '';
        }
      } else if (data === '\x03') {
        // Ctrl+C
        tab.xterm.writeln('^C');
        tab.currentInput = '';
        writePrompt(tab);
      } else if (data === '\x0c') {
        // Ctrl+L — clear
        tab.xterm.clear();
        tab.currentInput = '';
        writePrompt(tab);
      } else if (data >= ' ' || data === '\t') {
        // Regular character
        tab.currentInput += data;
        tab.xterm.write(data);
      }
    });

    // Resize observer
    if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    resizeObserverRef.current = new ResizeObserver(() => {
      try { activeTab.fitAddon.fit(); } catch { /* ignore */ }
    });
    resizeObserverRef.current.observe(container);

    return () => {
      dataDisposable.dispose();
    };
  }, [activeTabId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Execute Command ─────────────────────────────────────────────────

  const executeCommand = async (tab: TerminalTab, cmd: string) => {
    // Built-in commands
    if (cmd === 'clear' || cmd === 'cls') {
      tab.xterm.clear();
      return;
    }

    if (cmd.startsWith('cd ')) {
      const newDir = cmd.slice(3).trim();
      if (newDir === '~') {
        tab.cwd = editor.workspacePath ?? '~';
      } else if (newDir.startsWith('/') || newDir.match(/^[A-Z]:\\/i)) {
        tab.cwd = newDir;
      } else {
        tab.cwd = `${tab.cwd}/${newDir}`;
      }
      return;
    }

    if (cmd === 'pwd') {
      tab.xterm.writeln(tab.cwd);
      return;
    }

    // Execute via Tauri
    tab.xterm.write('\x1b[33m'); // yellow for output
    try {
      const result = await invoke<{ stdout: string; stderr: string; exit_code: number }>(
        'run_command',
        {
          command: cmd,
          cwd: tab.cwd === '~' ? editor.workspacePath ?? undefined : tab.cwd,
          envVars: {},
        }
      );

      if (result.stdout) {
        // Split by lines and write each
        for (const line of result.stdout.split('\n')) {
          if (line) tab.xterm.writeln(line);
        }
      }

      if (result.stderr) {
        tab.xterm.write('\x1b[31m'); // red for errors
        for (const line of result.stderr.split('\n')) {
          if (line) tab.xterm.writeln(line);
        }
        tab.xterm.write('\x1b[0m');
      }

      if (result.exit_code !== 0) {
        tab.xterm.writeln(`\x1b[31m[exit code: ${result.exit_code}]\x1b[0m`);
      }
    } catch (err) {
      tab.xterm.writeln(`\x1b[31mError: ${err}\x1b[0m`);
    }

    tab.xterm.write('\x1b[0m');
  };

  const writePrompt = (tab: TerminalTab) => {
    const cwd = tab.cwd === editor.workspacePath
      ? tab.cwd.split('/').pop() ?? tab.cwd
      : tab.cwd;
    tab.xterm.write(`\x1b[33m${cwd}\x1b[0m \x1b[32m❯\x1b[0m `);
  };

  const clearCurrentLine = (tab: TerminalTab) => {
    // Move cursor to start of input and clear
    for (let i = 0; i < tab.currentInput.length; i++) {
      tab.xterm.write('\b \b');
    }
  };

  const closeTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      tab.xterm.dispose();
    }
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);

    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1]?.id ?? null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--haven-void)',
      borderTop: '1px solid var(--haven-border)',
    }}>
      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--haven-border)',
        height: 34,
        background: 'var(--haven-surface)',
        paddingLeft: 8,
        gap: 2,
      }}>
        <TerminalSquare size={12} style={{ color: 'var(--haven-green)', marginRight: 6 }} />

        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px',
              height: '100%',
              cursor: 'pointer',
              background: activeTabId === tab.id ? 'var(--haven-void)' : 'transparent',
              borderRight: '1px solid var(--haven-border)',
              fontSize: 12,
              color: activeTabId === tab.id ? 'var(--haven-text-1)' : 'var(--haven-text-3)',
              fontFamily: 'var(--font-mono)',
              transition: 'background 0.1s',
              position: 'relative',
            }}
          >
            {activeTabId === tab.id && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: 'var(--haven-green)',
              }} />
            )}
            {tab.title}
            <button
              onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
              style={{
                background: 'none',
                border: 'none',
                padding: 2,
                cursor: 'pointer',
                color: 'var(--haven-text-4)',
                display: 'flex',
                borderRadius: 2,
                transition: 'color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--haven-error)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--haven-text-4)')}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        <button
          className="btn-icon"
          title={t('terminal.new')}
          onClick={createTab}
          style={{ width: 28, height: 28 }}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalDivRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: 4,
        }}
      />
    </div>
  );
}
