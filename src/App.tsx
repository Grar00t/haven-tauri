// ═══════════════════════════════════════════════════════════════════════
// HAVEN IDE — Main Application Layout
// التخطيط الرئيسي للتطبيق
// ═══════════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { useHavenStore } from './store';
import { ollamaService } from './engine/OllamaService';
import { i18n } from './i18n';

// Components
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import AIPanel from './components/AIPanel';
import Terminal from './components/Terminal';
import StatusBar from './components/StatusBar';
import IntentGraph from './components/IntentGraph';
import NotificationStack from './components/NotificationStack';

// ── App ───────────────────────────────────────────────────────────────

export default function App() {
  const { layout, setLayout, setAI, settings, setSystemInfo, addNotification } = useHavenStore();
  const [_lang, setLang] = useState(i18n.lang);

  // ── Initialize ──────────────────────────────────────────────────────

  useEffect(() => {
    initializeApp();

    // Listen for language changes
    const unsubLang = i18n.onLanguageChange(() => setLang(i18n.lang));

    // Subscribe to Ollama status
    const unsubStatus = ollamaService.onStatusChange(status => {
      setAI({ connectionStatus: status });
    });

    const unsubModels = ollamaService.onModelsChange(models => {
      setAI({
        models,
        activeModel: ollamaService.getActiveModel(),
      });
    });

    // Poll system info
    const sysInterval = setInterval(fetchSystemInfo, 30_000);
    fetchSystemInfo();

    return () => {
      unsubLang();
      unsubStatus();
      unsubModels();
      clearInterval(sysInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeApp = useCallback(async () => {
    // Initialize Ollama
    setAI({ connectionStatus: 'connecting' });
    const connected = await ollamaService.connect();

    if (connected) {
      const models = ollamaService.getModels();
      setAI({
        connectionStatus: 'connected',
        models,
        activeModel: ollamaService.getActiveModel(),
      });
      addNotification({
        type: 'success',
        message: `Ollama متصل — ${models.length} نموذج متاح`,
        duration: 3000,
      });
    } else {
      setAI({ connectionStatus: 'disconnected' });
      addNotification({
        type: 'warning',
        message: 'لم يتم الاتصال بـ Ollama. تأكد من تشغيله على المنفذ 11434',
        duration: 6000,
      });
    }
  }, [setAI, addNotification]);

  const fetchSystemInfo = useCallback(async () => {
    try {
      const info = await invoke<{
        cpu_usage: number;
        memory_used: number;
        memory_total: number;
        hostname: string;
        os_name: string;
      }>('get_system_info');

      setSystemInfo({
        cpuUsage: info.cpu_usage,
        memoryUsed: info.memory_used,
        memoryTotal: info.memory_total,
        hostname: info.hostname,
        osName: info.os_name,
      });
    } catch {
      // Non-critical
    }
  }, [setSystemInfo]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === 'b') {
        e.preventDefault();
        setLayout({ sidebarOpen: !layout.sidebarOpen });
      }
      if (mod && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        setLayout({ terminalOpen: !layout.terminalOpen });
      }
      if (mod && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setLayout({ aiPanelOpen: !layout.aiPanelOpen });
      }
      if (mod && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setLayout({ intentGraphOpen: !layout.intentGraphOpen });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layout, setLayout]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div
      className="haven-app"
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--haven-base)',
        overflow: 'hidden',
      }}
      dir={i18n.direction}
    >
      {/* Title Bar */}
      <TopBar />

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Editor + Panels Area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <PanelGroup direction="horizontal" autoSaveId="haven-main-panels">

            {/* Sidebar */}
            {layout.sidebarOpen && (
              <>
                <Panel
                  id="sidebar"
                  defaultSize={18}
                  minSize={12}
                  maxSize={35}
                  style={{ overflow: 'hidden' }}
                >
                  <Sidebar />
                </Panel>
                <PanelResizeHandle
                  style={{
                    width: '3px',
                    background: 'var(--haven-border)',
                    cursor: 'col-resize',
                    transition: 'background 0.15s',
                  }}
                  onDragging={(isDragging) => {
                    if (isDragging) {
                      document.body.style.cursor = 'col-resize';
                    } else {
                      document.body.style.cursor = '';
                    }
                  }}
                />
              </>
            )}

            {/* Editor Area */}
            <Panel id="editor" defaultSize={layout.aiPanelOpen ? 55 : 82} minSize={30}>
              <PanelGroup direction="vertical" autoSaveId="haven-editor-terminal">
                <Panel id="code-editor" defaultSize={layout.terminalOpen ? 70 : 100} minSize={40}>
                  <CodeEditor />
                </Panel>

                {layout.terminalOpen && (
                  <>
                    <PanelResizeHandle
                      style={{
                        height: '3px',
                        background: 'var(--haven-border)',
                        cursor: 'row-resize',
                      }}
                    />
                    <Panel id="terminal" defaultSize={30} minSize={15}>
                      <Terminal />
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>

            {/* AI Panel */}
            {layout.aiPanelOpen && (
              <>
                <PanelResizeHandle
                  style={{
                    width: '3px',
                    background: 'var(--haven-border)',
                    cursor: 'col-resize',
                  }}
                />
                <Panel id="ai-panel" defaultSize={27} minSize={20} maxSize={45}>
                  <PanelGroup direction="vertical" autoSaveId="haven-ai-panels">
                    <Panel id="ai-chat" defaultSize={layout.intentGraphOpen ? 60 : 100} minSize={40}>
                      <AIPanel />
                    </Panel>
                    {layout.intentGraphOpen && (
                      <>
                        <PanelResizeHandle
                          style={{
                            height: '3px',
                            background: 'var(--haven-border)',
                            cursor: 'row-resize',
                          }}
                        />
                        <Panel id="intent-graph" defaultSize={40} minSize={20}>
                          <IntentGraph />
                        </Panel>
                      </>
                    )}
                  </PanelGroup>
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>

      {/* Status Bar */}
      {layout.statusBarVisible && <StatusBar />}

      {/* Notifications */}
      <NotificationStack />
    </div>
  );
}
