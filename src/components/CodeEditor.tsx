// ═══════════════════════════════════════════════════════════════════════
// CODE EDITOR — Monaco Editor Integration
// محرر الكود — تكامل Monaco
// ═══════════════════════════════════════════════════════════════════════

import React, { useRef, useCallback, useEffect, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { invoke } from '@tauri-apps/api/core';
import { X, Circle } from 'lucide-react';
import { useHavenStore, useActiveFile } from '../store';
import { niyahEngine } from '../engine/NiyahEngine';
import { ollamaService } from '../engine/OllamaService';
import { t } from '../i18n';

// ── Haven Dark Theme for Monaco ───────────────────────────────────────

const HAVEN_THEME: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '505050', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'd4af37' },
    { token: 'string', foreground: '00cc33' },
    { token: 'number', foreground: '4488ff' },
    { token: 'type', foreground: 'f0cc55' },
    { token: 'variable', foreground: 'f0f0f0' },
    { token: 'function', foreground: '88aaff' },
    { token: 'parameter', foreground: 'e0c46c' },
    { token: 'class', foreground: 'f0cc55', fontStyle: 'bold' },
    { token: 'interface', foreground: 'f0cc55' },
    { token: 'enum', foreground: 'f0cc55' },
    { token: 'constant', foreground: '4488ff' },
    { token: 'operator', foreground: 'd4af37' },
    { token: 'delimiter', foreground: '606060' },
    { token: 'tag', foreground: 'd4af37' },
    { token: 'attribute.name', foreground: '88aaff' },
    { token: 'attribute.value', foreground: '00cc33' },
    { token: 'regexp', foreground: '00cc33' },
  ],
  colors: {
    'editor.background': '#0a0a0a',
    'editor.foreground': '#f0f0f0',
    'editor.lineHighlightBackground': '#111111',
    'editor.selectionBackground': '#d4af3722',
    'editor.selectionHighlightBackground': '#d4af3711',
    'editorCursor.foreground': '#d4af37',
    'editorWhitespace.foreground': '#2a2a2a',
    'editorIndentGuide.background1': '#1a1a1a',
    'editorIndentGuide.activeBackground1': '#d4af3733',
    'editorLineNumber.foreground': '#404040',
    'editorLineNumber.activeForeground': '#a08828',
    'editorGutter.background': '#0a0a0a',
    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': '#2a2a2a88',
    'scrollbarSlider.hoverBackground': '#3a3a3a',
    'scrollbarSlider.activeBackground': '#d4af3755',
    'editorWidget.background': '#111111',
    'editorWidget.border': '#222222',
    'editorSuggestWidget.background': '#111111',
    'editorSuggestWidget.border': '#222222',
    'editorSuggestWidget.selectedBackground': '#1a1a1a',
    'editorSuggestWidget.highlightForeground': '#d4af37',
    'editorHoverWidget.background': '#111111',
    'editorHoverWidget.border': '#222222',
    'input.background': '#0a0a0a',
    'input.border': '#222222',
    'input.foreground': '#f0f0f0',
    'focusBorder': '#d4af37',
    'list.hoverBackground': '#1a1a1a',
    'list.activeSelectionBackground': '#222222',
    'list.highlightForeground': '#d4af37',
    'breadcrumb.foreground': '#606060',
    'breadcrumb.focusForeground': '#a0a0a0',
    'breadcrumb.activeSelectionForeground': '#d4af37',
    'tab.activeBackground': '#0a0a0a',
    'tab.inactiveBackground': '#111111',
    'tab.activeBorderTop': '#d4af37',
    'sideBar.background': '#111111',
    'activityBar.background': '#050505',
    'statusBar.background': '#050505',
    'titleBar.activeBackground': '#050505',
  },
};

// ── File Tabs ─────────────────────────────────────────────────────────

function FileTabs() {
  const { editor: editorState, setActiveFile, closeFile } = useHavenStore();

  return (
    <div className="haven-tabs">
      {editorState.openFiles.map(file => {
        const isActive = file.id === editorState.activeFileId;
        return (
          <div
            key={file.id}
            className={`haven-tab ${isActive ? 'active' : ''}`}
            onClick={() => setActiveFile(file.id)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
            {file.isDirty && (
              <Circle
                size={7}
                fill="var(--haven-gold)"
                style={{ color: 'var(--haven-gold)', flexShrink: 0 }}
              />
            )}
            <button
              className="haven-tab-close"
              onClick={e => {
                e.stopPropagation();
                closeFile(file.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 2,
                cursor: 'pointer',
                borderRadius: 2,
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
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

// ── Empty State ───────────────────────────────────────────────────────

function EditorEmptyState() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--haven-base)',
      gap: 16,
      color: 'var(--haven-text-4)',
    }}>
      <div className="bg-grid" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.5,
      }} />

      {/* Haven Logo */}
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
        <path d="M12 2L21.196 7V17L12 22L2.804 17V7L12 2Z" stroke="#d4af37" strokeWidth="1" fill="none" />
        <path d="M12 7L16.5 15H7.5L12 7Z" fill="#d4af37" fillOpacity="0.4" />
        <circle cx="12" cy="12" r="1.5" fill="#00ff41" fillOpacity="0.6" />
      </svg>

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--haven-text-3)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
          HAVEN IDE
        </div>
        <div style={{ fontSize: 13, color: 'var(--haven-text-4)', fontFamily: 'var(--font-arabic)' }}>
          بيئة التطوير السيادية
        </div>
      </div>

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--haven-text-4)' }}>
        <div>Ctrl+B — فتح/إغلاق المستكشف</div>
        <div>Ctrl+Shift+A — لوحة الذكاء الاصطناعي</div>
        <div>Ctrl+Shift+J — الطرفية</div>
        <div>Ctrl+Shift+I — خارطة النية</div>
      </div>
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────────

export default function CodeEditor() {
  const activeFile = useActiveFile();
  const { updateFileContent, markFileDirty, settings } = useHavenStore();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Monaco Setup ────────────────────────────────────────────────────

  useEffect(() => {
    if (!monaco) return;

    // Register Haven dark theme
    monaco.editor.defineTheme('haven-dark', HAVEN_THEME);
    monaco.editor.setTheme('haven-dark');

    // Configure TypeScript/JavaScript defaults
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.Bundler,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      esModuleInterop: true,
      strict: true,
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Register Ollama completion provider
    monaco.languages.registerInlineCompletionsProvider(
      ['typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'python', 'rust', 'go'],
      {
        provideInlineCompletions: async (model, position) => {
          if (ollamaService.getStatus() !== 'connected') return { items: [] };

          const textBefore = model.getValueInRange({
            startLineNumber: Math.max(1, position.lineNumber - 15),
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const textAfter = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: Math.min(model.getLineCount(), position.lineNumber + 5),
            endColumn: model.getLineMaxColumn(Math.min(model.getLineCount(), position.lineNumber + 5)),
          });

          try {
            const codeModel = ollamaService.getBestModelForTask('code');
            if (!codeModel) return { items: [] };

            const completion = await ollamaService.codeComplete(
              textBefore,
              textAfter,
              model.getLanguageId(),
              codeModel
            );

            if (!completion.trim()) return { items: [] };

            return {
              items: [{
                insertText: completion,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              }],
            };
          } catch {
            return { items: [] };
          }
        },
        freeInlineCompletions: () => {},
      }
    );
  }, [monaco]);

  // ── Editor Mount ────────────────────────────────────────────────────

  const handleEditorMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;

    // Configure editor options
    editorInstance.updateOptions({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      lineNumbers: 'on',
      wordWrap: settings.wordWrap ? 'on' : 'off',
      minimap: { enabled: settings.minimap },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'line',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      formatOnType: false,
      formatOnPaste: true,
      tabSize: 2,
      insertSpaces: true,
      folding: true,
      foldingHighlight: true,
      suggest: { showKeywords: true, showSnippets: true },
      inlineSuggest: { enabled: true },
      padding: { top: 12, bottom: 12 },
    });

    // Keyboard shortcut: Ctrl+S to save
    editorInstance.addCommand(
      (monaco?.KeyMod.CtrlCmd ?? 0) | (monaco?.KeyCode.KeyS ?? 0),
      () => saveCurrentFile()
    );
  }, [settings, monaco]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Content Change ──────────────────────────────────────────────────

  const handleChange = useCallback((value: string | undefined) => {
    if (!activeFile || value === undefined) return;

    updateFileContent(activeFile.id, value);

    // NiyahEngine context update (non-blocking)
    if (value.length > 0 && value.length % 50 === 0) {
      niyahEngine.process(value.slice(-200), {
        activeFile: activeFile.name,
        language: activeFile.language,
      });
    }

    // Auto-save
    if (settings.autoSave) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveFile(activeFile.path, value), 2000);
    }
  }, [activeFile, updateFileContent, settings.autoSave]);

  const saveCurrentFile = useCallback(async () => {
    if (!activeFile) return;
    await saveFile(activeFile.path, activeFile.content);
  }, [activeFile]);

  const saveFile = useCallback(async (path: string, content: string) => {
    setIsSaving(true);
    try {
      await invoke('write_file', { path, content });
      if (activeFile?.path === path) {
        markFileDirty(activeFile.id, false);
      }
    } catch (err) {
      console.error('[CodeEditor] Save failed:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [activeFile, markFileDirty]);

  // Update font size when settings change
  useEffect(() => {
    editorRef.current?.updateOptions({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      wordWrap: settings.wordWrap ? 'on' : 'off',
      minimap: { enabled: settings.minimap },
    });
  }, [settings]);

  // ── Render ──────────────────────────────────────────────────────────

  if (!activeFile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--haven-base)' }}>
        <FileTabs />
        <EditorEmptyState />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--haven-base)' }}>
      {/* Tabs */}
      <FileTabs />

      {/* Breadcrumb */}
      <div style={{
        padding: '3px 12px',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--haven-text-3)',
        borderBottom: '1px solid var(--haven-border)',
        background: 'var(--haven-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>{activeFile.path.replace(/\\/g, '/')}</span>
        <span style={{ color: isSaving ? 'var(--haven-gold)' : 'var(--haven-text-4)' }}>
          {isSaving ? 'حفظ…' : activeFile.isDirty ? '●' : ''}
        </span>
      </div>

      {/* Monaco */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          key={activeFile.id}
          value={activeFile.content}
          language={activeFile.language}
          theme="haven-dark"
          onChange={handleChange}
          onMount={handleEditorMount}
          loading={
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--haven-base)',
              color: 'var(--haven-text-3)',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
            }}>
              جارٍ تحميل المحرر…
            </div>
          }
          options={{
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            lineNumbers: 'on',
            wordWrap: settings.wordWrap ? 'on' : 'off',
            minimap: { enabled: settings.minimap },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
