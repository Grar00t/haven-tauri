// ═══════════════════════════════════════════════════════════════════════
// SIDEBAR — File Explorer & Navigation
// الشريط الجانبي — مستكشف الملفات
// ═══════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import {
  FolderOpen, FolderClosed, FileText, FileCode, FileCog,
  ChevronRight, ChevronDown, Plus, RefreshCw, FolderPlus,
  Search, Settings, GitBranch, Package, Trash2, Edit2,
} from 'lucide-react';
import { useHavenStore, type FileNode } from '../store';
import { t, i18n } from '../i18n';

// ── File Icon ─────────────────────────────────────────────────────────

const EXT_COLORS: Record<string, string> = {
  ts: '#3178c6',
  tsx: '#3178c6',
  js: '#f7df1e',
  jsx: '#61dafb',
  py: '#3776ab',
  rs: '#dea584',
  go: '#00add8',
  css: '#563d7c',
  html: '#e34c26',
  json: '#8bc34a',
  md: '#f0f0f0',
  toml: '#9c4221',
  yaml: '#cb4e00',
  yml: '#cb4e00',
  sh: '#00ff41',
  bash: '#00ff41',
  sql: '#cc6600',
  graphql: '#e10098',
  vue: '#42b883',
  svelte: '#ff3e00',
  dart: '#0175c2',
  kotlin: '#a97bff',
  swift: '#fa7343',
  java: '#b07219',
  c: '#555555',
  cpp: '#f34b7d',
  cs: '#178600',
  php: '#4f5d95',
  rb: '#701516',
};

function FileIcon({ name, isDir, isExpanded }: { name: string; isDir: boolean; isExpanded?: boolean }) {
  if (isDir) {
    return isExpanded
      ? <FolderOpen size={14} style={{ color: 'var(--haven-gold)', flexShrink: 0 }} />
      : <FolderClosed size={14} style={{ color: 'var(--haven-gold-dim)', flexShrink: 0 }} />;
  }

  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const color = EXT_COLORS[ext] ?? 'var(--haven-text-3)';

  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return <FileCode size={14} style={{ color, flexShrink: 0 }} />;
  if (ext === 'json' || ext === 'toml' || ext === 'yaml' || ext === 'yml') return <FileCog size={14} style={{ color, flexShrink: 0 }} />;

  return <FileText size={14} style={{ color, flexShrink: 0 }} />;
}

// ── Tree Node ─────────────────────────────────────────────────────────

function TreeNode({
  node,
  depth,
  onSelect,
  onToggle,
  activeFilePath,
}: {
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  onToggle: (path: string) => void;
  activeFilePath?: string;
}) {
  const isActive = node.path === activeFilePath;

  return (
    <div>
      <div
        className={`file-tree-item ${isActive ? 'active' : ''}`}
        style={{
          paddingLeft: 8 + depth * 16,
          position: 'relative',
          background: isActive ? 'var(--haven-elevated)' : undefined,
          color: isActive ? 'var(--haven-text-1)' : undefined,
        }}
        onClick={() => {
          if (node.isDir) {
            onToggle(node.path);
          } else {
            onSelect(node);
          }
        }}
      >
        {/* Indentation guide */}
        {depth > 0 && (
          <div style={{
            position: 'absolute',
            left: depth * 16,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'var(--haven-border)',
          }} />
        )}

        {/* Expand/Collapse arrow for dirs */}
        {node.isDir && (
          <span style={{ width: 14, flexShrink: 0, color: 'var(--haven-text-4)' }}>
            {node.isExpanded
              ? <ChevronDown size={12} />
              : <ChevronRight size={12} />}
          </span>
        )}
        {!node.isDir && <span style={{ width: 14, flexShrink: 0 }} />}

        <FileIcon name={node.name} isDir={node.isDir} isExpanded={node.isExpanded} />

        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 13,
          }}
          title={node.path}
        >
          {node.name}
        </span>
      </div>

      {/* Children */}
      {node.isDir && node.isExpanded && node.children?.map(child => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
          onToggle={onToggle}
          activeFilePath={activeFilePath}
        />
      ))}
    </div>
  );
}

// ── Sidebar Tabs ──────────────────────────────────────────────────────

function SidebarTabIcon({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`sidebar-icon ${active ? 'active' : ''}`}
    >
      <Icon size={18} />
    </button>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────

export default function Sidebar() {
  const { layout, setLayout, editor, setEditor, openFile, setFileTree, addNotification } = useHavenStore();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const activeFilePath = editor.openFiles.find(f => f.id === editor.activeFileId)?.path;

  // ── Load Directory ──────────────────────────────────────────────────

  const loadDirectory = useCallback(async (dirPath: string) => {
    setLoading(true);
    try {
      const entries = await invoke<FileNode[]>('list_directory', {
        path: dirPath,
        recursive: true,
      });
      setFileTree(entries);
    } catch (err) {
      addNotification({ type: 'error', message: `فشل تحميل المجلد: ${err}` });
    } finally {
      setLoading(false);
    }
  }, [setFileTree, addNotification]);

  const openWorkspace = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        setEditor({ workspacePath: selected });
        await loadDirectory(selected);
      }
    } catch (err) {
      addNotification({ type: 'error', message: `فشل فتح المجلد: ${err}` });
    }
  }, [setEditor, loadDirectory, addNotification]);

  const openFileNode = useCallback(async (node: FileNode) => {
    // Check if already open
    const existing = editor.openFiles.find(f => f.path === node.path);
    if (existing) {
      useHavenStore.getState().setActiveFile(existing.id);
      return;
    }

    try {
      const content = await invoke<string>('read_file', { path: node.path });
      const ext = node.name.split('.').pop()?.toLowerCase() ?? '';
      const langMap: Record<string, string> = {
        ts: 'typescript', tsx: 'typescriptreact', js: 'javascript',
        jsx: 'javascriptreact', py: 'python', rs: 'rust',
        go: 'go', css: 'css', html: 'html', json: 'json',
        md: 'markdown', toml: 'toml', yaml: 'yaml', yml: 'yaml',
        sh: 'shell', bash: 'shell', sql: 'sql', c: 'c', cpp: 'cpp',
        cs: 'csharp', java: 'java', php: 'php', rb: 'ruby',
      };

      openFile({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        path: node.path,
        name: node.name,
        content,
        language: langMap[ext] ?? 'plaintext',
        isDirty: false,
      });
    } catch (err) {
      addNotification({ type: 'error', message: `فشل قراءة الملف: ${err}` });
    }
  }, [editor.openFiles, openFile, addNotification]);

  const toggleDir = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });

    // Update file tree node expansion state
    const updateExpanded = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => {
        if (n.path === path) {
          return { ...n, isExpanded: !n.isExpanded };
        }
        if (n.children) {
          return { ...n, children: updateExpanded(n.children) };
        }
        return n;
      });

    setFileTree(updateExpanded(editor.fileTree));
  }, [editor.fileTree, setFileTree]);

  // Reload on workspace change
  useEffect(() => {
    if (editor.workspacePath) {
      loadDirectory(editor.workspacePath);
    }
  }, [editor.workspacePath]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter tree by search ─────────────────────────────────────────

  const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    const q = query.toLowerCase();
    return nodes.filter(n => {
      if (n.name.toLowerCase().includes(q)) return true;
      if (n.children) {
        const filteredChildren = filterTree(n.children, query);
        return filteredChildren.length > 0;
      }
      return false;
    }).map(n => ({
      ...n,
      isExpanded: true,
      children: n.children ? filterTree(n.children, query) : undefined,
    }));
  };

  const displayTree = filterTree(editor.fileTree, searchQuery);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: 'var(--haven-surface)',
    }}>
      {/* Activity Bar */}
      <div style={{
        width: 48,
        background: 'var(--haven-void)',
        borderRight: '1px solid var(--haven-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 4,
        gap: 2,
      }}>
        <SidebarTabIcon
          icon={FileText}
          label={t('sidebar.explorer')}
          active={layout.sidebarTab === 'explorer'}
          onClick={() => setLayout({ sidebarTab: 'explorer' })}
        />
        <SidebarTabIcon
          icon={Search}
          label={t('sidebar.search')}
          active={layout.sidebarTab === 'search'}
          onClick={() => setLayout({ sidebarTab: 'search' })}
        />
        <SidebarTabIcon
          icon={GitBranch}
          label={t('sidebar.git')}
          active={layout.sidebarTab === 'git'}
          onClick={() => setLayout({ sidebarTab: 'git' })}
        />
        <SidebarTabIcon
          icon={Package}
          label={t('sidebar.extensions')}
          active={layout.sidebarTab === 'extensions'}
          onClick={() => setLayout({ sidebarTab: 'extensions' })}
        />

        {/* Bottom: Settings */}
        <div style={{ flex: 1 }} />
        <SidebarTabIcon
          icon={Settings}
          label={t('sidebar.settings')}
          active={layout.sidebarTab === 'settings'}
          onClick={() => setLayout({ sidebarTab: 'settings' })}
        />
        <div style={{ height: 8 }} />
      </div>

      {/* Panel Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{
          padding: '8px 12px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--haven-border)',
          minHeight: 34,
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--haven-text-3)',
          }}>
            {t(`sidebar.${layout.sidebarTab}` as Parameters<typeof t>[0])}
          </span>

          {layout.sidebarTab === 'explorer' && (
            <div style={{ display: 'flex', gap: 2 }}>
              <button className="btn-icon" title="New File" onClick={() => {}}>
                <Plus size={14} />
              </button>
              <button className="btn-icon" title="New Folder" onClick={() => {}}>
                <FolderPlus size={14} />
              </button>
              <button className="btn-icon" title="Open Folder" onClick={openWorkspace}>
                <FolderOpen size={14} />
              </button>
              <button
                className="btn-icon"
                title="Refresh"
                onClick={() => editor.workspacePath && loadDirectory(editor.workspacePath)}
              >
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
              </button>
            </div>
          )}
        </div>

        {/* Search Box */}
        {layout.sidebarTab === 'explorer' && (
          <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--haven-border)' }}>
            <input
              className="haven-input"
              placeholder="فلترة الملفات…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ height: 26, fontSize: 12, padding: '3px 8px' }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {layout.sidebarTab === 'explorer' && (
            <>
              {!editor.workspacePath ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '32px 16px',
                  gap: 12,
                  color: 'var(--haven-text-3)',
                  textAlign: 'center',
                }}>
                  <FolderOpen size={32} style={{ color: 'var(--haven-gold-dim)', opacity: 0.5 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>افتح مجلداً للبدء</p>
                  <button className="btn-primary" onClick={openWorkspace} style={{ fontSize: 12 }}>
                    <FolderOpen size={12} />
                    فتح مجلد
                  </button>
                </div>
              ) : loading ? (
                <div style={{ padding: '16px', color: 'var(--haven-text-3)', fontSize: 12, textAlign: 'center' }}>
                  جارٍ التحميل…
                </div>
              ) : displayTree.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--haven-text-3)', fontSize: 12, textAlign: 'center' }}>
                  {searchQuery ? 'لا نتائج' : 'المجلد فارغ'}
                </div>
              ) : (
                displayTree.map(node => (
                  <TreeNode
                    key={node.path}
                    node={node}
                    depth={0}
                    onSelect={openFileNode}
                    onToggle={toggleDir}
                    activeFilePath={activeFilePath}
                  />
                ))
              )}
            </>
          )}

          {layout.sidebarTab === 'settings' && <SettingsPanel />}
          {layout.sidebarTab === 'git' && <GitPanel />}
        </div>

        {/* Footer: Workspace Path */}
        {editor.workspacePath && (
          <div style={{
            padding: '4px 12px',
            borderTop: '1px solid var(--haven-border)',
            fontSize: 10,
            color: 'var(--haven-text-4)',
            fontFamily: 'var(--font-mono)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {editor.workspacePath}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────

function SettingsPanel() {
  const { settings, setSettings } = useHavenStore();
  // i18n already imported at top of file

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ fontSize: 11, color: 'var(--haven-text-3)', display: 'block', marginBottom: 6 }}>
          {t('settings.language')}
        </label>
        <select
          className="haven-input"
          value={settings.language}
          onChange={e => {
            const lang = e.target.value as typeof settings.language;
            setSettings({ language: lang });
            i18n.setLanguage(lang);
          }}
          style={{ height: 30, fontSize: 12 }}
        >
          {i18n.getSupportedLanguages().map(l => (
            <option key={l.code} value={l.code}>{l.nativeName}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: 11, color: 'var(--haven-text-3)', display: 'block', marginBottom: 6 }}>
          {t('settings.ollamaHost')}
        </label>
        <input
          className="haven-input"
          value={settings.ollamaHost}
          onChange={e => setSettings({ ollamaHost: e.target.value })}
          style={{ height: 30, fontSize: 12 }}
        />
      </div>

      <div>
        <label style={{ fontSize: 11, color: 'var(--haven-text-3)', display: 'block', marginBottom: 6 }}>
          {t('settings.fontSize')}: {settings.fontSize}px
        </label>
        <input
          type="range"
          min={10}
          max={24}
          value={settings.fontSize}
          onChange={e => setSettings({ fontSize: Number(e.target.value) })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 12, color: 'var(--haven-text-2)' }}>
          {t('editor.format')} (Auto Save)
        </label>
        <input
          type="checkbox"
          checked={settings.autoSave}
          onChange={e => setSettings({ autoSave: e.target.checked })}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 12, color: 'var(--haven-text-2)' }}>
          Intent Graph
        </label>
        <input
          type="checkbox"
          checked={settings.showIntentGraph}
          onChange={e => setSettings({ showIntentGraph: e.target.checked })}
        />
      </div>

      {/* Sovereignty Block */}
      <div style={{
        padding: 12,
        border: '1px solid rgba(0,255,65,0.2)',
        borderRadius: 6,
        background: 'rgba(0,255,65,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div className="sovereignty-dot" />
          <span style={{ fontSize: 11, color: 'var(--haven-green)', fontWeight: 600 }}>
            {t('sovereignty.title')}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--haven-text-3)', lineHeight: 1.6 }}>
          <div>✓ {t('sovereignty.local')}</div>
          <div>✓ {t('sovereignty.telemetry')}</div>
          <div>✓ Ollama local inference</div>
          <div>✓ AES-256-GCM sessions</div>
        </div>
      </div>
    </div>
  );
}

// ── Git Panel ─────────────────────────────────────────────────────────

function GitPanel() {
  const editor = useHavenStore(s => s.editor);

  return (
    <div style={{ padding: '12px', color: 'var(--haven-text-3)', fontSize: 12 }}>
      {editor.workspacePath ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: 'var(--haven-green)' }}>
            <GitBranch size={13} />
            <span>main</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--haven-text-4)' }}>
            Git integration available via terminal
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 11 }}>افتح مجلداً لعرض حالة Git</p>
      )}
    </div>
  );
}
