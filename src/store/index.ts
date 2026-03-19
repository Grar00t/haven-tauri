// ═══════════════════════════════════════════════════════════════════════
// HAVEN STORE — Zustand Global State
// متجر الحالة العامة
// Single source of truth for all UI state.
// ═══════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { type ConnectionStatus, type OllamaModel } from '../engine/OllamaService';
import type { ConversationTurn } from '../engine/ThreeLobeAgent';
import type { NiyahSession } from '../engine/NiyahEngine';
import type { Language } from '../i18n';

// ── Editor State ──────────────────────────────────────────────────────

export interface OpenFile {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  cursorLine?: number;
  cursorCol?: number;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modified?: number;
  extension?: string;
  children?: FileNode[];
  isExpanded?: boolean;
}

// ── Layout State ──────────────────────────────────────────────────────

export type SidebarTab = 'explorer' | 'search' | 'git' | 'settings';
export type PanelPosition = 'right' | 'bottom';

export interface LayoutState {
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  sidebarWidth: number;
  aiPanelOpen: boolean;
  aiPanelWidth: number;
  terminalOpen: boolean;
  terminalHeight: number;
  intentGraphOpen: boolean;
  statusBarVisible: boolean;
}

// ── AI State ──────────────────────────────────────────────────────────

export interface AIState {
  connectionStatus: ConnectionStatus;
  models: OllamaModel[];
  activeModel: string | null;
  conversation: ConversationTurn[];
  isGenerating: boolean;
  streamingContent: string;
  streamingLobe: string | null;
  lastNiyahSession: NiyahSession | null;
  ollamaHost: string;
}

// ── Editor State ──────────────────────────────────────────────────────

export interface EditorState {
  openFiles: OpenFile[];
  activeFileId: string | null;
  workspacePath: string | null;
  fileTree: FileNode[];
  recentFiles: string[];
  fontSize: number;
  fontFamily: string;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
}

// ── Settings State ────────────────────────────────────────────────────

export interface SettingsState {
  language: Language;
  theme: 'haven-dark' | 'haven-light';
  ollamaHost: string;
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  wordWrap: boolean;
  minimap: boolean;
  sovereignMode: boolean;
  showIntentGraph: boolean;
  gitIntegration: boolean;
}

// ── Notifications ──────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  timestamp: number;
}

// ── Full Store ─────────────────────────────────────────────────────────

export interface HavenStore {
  // Layout
  layout: LayoutState;
  setLayout: (update: Partial<LayoutState>) => void;

  // AI
  ai: AIState;
  setAI: (update: Partial<AIState>) => void;
  addMessage: (msg: ConversationTurn) => void;
  clearConversation: () => void;
  appendStreamToken: (token: string) => void;
  finalizeStream: (content: string, model?: string) => void;

  // Editor
  editor: EditorState;
  setEditor: (update: Partial<EditorState>) => void;
  openFile: (file: OpenFile) => void;
  closeFile: (id: string) => void;
  setActiveFile: (id: string | null) => void;
  updateFileContent: (id: string, content: string) => void;
  markFileDirty: (id: string, isDirty: boolean) => void;
  setFileTree: (tree: FileNode[]) => void;

  // Settings
  settings: SettingsState;
  setSettings: (update: Partial<SettingsState>) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;

  // System
  systemInfo: {
    cpuUsage: number;
    memoryUsed: number;
    memoryTotal: number;
    hostname: string;
    osName: string;
  } | null;
  setSystemInfo: (info: HavenStore['systemInfo']) => void;
}

// ── Default State ─────────────────────────────────────────────────────

const DEFAULT_LAYOUT: LayoutState = {
  sidebarOpen: true,
  sidebarTab: 'explorer',
  sidebarWidth: 280,
  aiPanelOpen: true,
  aiPanelWidth: 380,
  terminalOpen: false,
  terminalHeight: 240,
  intentGraphOpen: false,
  statusBarVisible: true,
};

const DEFAULT_AI: AIState = {
  connectionStatus: 'disconnected',
  models: [],
  activeModel: null,
  conversation: [],
  isGenerating: false,
  streamingContent: '',
  streamingLobe: null,
  lastNiyahSession: null,
  ollamaHost: 'http://127.0.0.1:11434',
};

const DEFAULT_EDITOR: EditorState = {
  openFiles: [],
  activeFileId: null,
  workspacePath: null,
  fileTree: [],
  recentFiles: [],
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  wordWrap: true,
  minimap: false,
  autoSave: true,
};

const DEFAULT_SETTINGS: SettingsState = {
  language: 'ar',
  theme: 'haven-dark',
  ollamaHost: 'http://127.0.0.1:11434',
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  autoSave: true,
  wordWrap: true,
  minimap: false,
  sovereignMode: true,
  showIntentGraph: true,
  gitIntegration: true,
};

// Load persisted settings
function loadPersistedSettings(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem('haven:settings');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const persistedSettings = loadPersistedSettings();

// ── Store ─────────────────────────────────────────────────────────────

export const useHavenStore = create<HavenStore>((set, _get) => ({
  // ── Layout ──────────────────────────────────────────────────────────
  layout: DEFAULT_LAYOUT,
  setLayout: (update) =>
    set(state => ({ layout: { ...state.layout, ...update } })),

  // ── AI ──────────────────────────────────────────────────────────────
  ai: DEFAULT_AI,
  setAI: (update) =>
    set(state => ({ ai: { ...state.ai, ...update } })),

  addMessage: (msg) =>
    set(state => ({
      ai: { ...state.ai, conversation: [...state.ai.conversation, msg] },
    })),

  clearConversation: () =>
    set(state => ({
      ai: { ...state.ai, conversation: [], streamingContent: '', streamingLobe: null },
    })),

  appendStreamToken: (token) =>
    set(state => ({
      ai: { ...state.ai, streamingContent: state.ai.streamingContent + token },
    })),

  finalizeStream: (content, model) => {
    const id = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set(state => ({
      ai: {
        ...state.ai,
        isGenerating: false,
        streamingContent: '',
        streamingLobe: null,
        conversation: [
          ...state.ai.conversation,
          {
            id,
            role: 'assistant' as const,
            content,
            timestamp: Date.now(),
            model: model ?? state.ai.activeModel ?? undefined,
          },
        ],
      },
    }));
  },

  // ── Editor ──────────────────────────────────────────────────────────
  editor: DEFAULT_EDITOR,
  setEditor: (update) =>
    set(state => ({ editor: { ...state.editor, ...update } })),

  openFile: (file) =>
    set(state => {
      const exists = state.editor.openFiles.find(f => f.id === file.id);
      if (exists) {
        return { editor: { ...state.editor, activeFileId: file.id } };
      }
      const recent = [file.path, ...state.editor.recentFiles.filter(p => p !== file.path)].slice(0, 20);
      return {
        editor: {
          ...state.editor,
          openFiles: [...state.editor.openFiles, file],
          activeFileId: file.id,
          recentFiles: recent,
        },
      };
    }),

  closeFile: (id) =>
    set(state => {
      const files = state.editor.openFiles.filter(f => f.id !== id);
      let activeId = state.editor.activeFileId;
      if (activeId === id) {
        activeId = files[files.length - 1]?.id ?? null;
      }
      return { editor: { ...state.editor, openFiles: files, activeFileId: activeId } };
    }),

  setActiveFile: (id) =>
    set(state => ({ editor: { ...state.editor, activeFileId: id } })),

  updateFileContent: (id, content) =>
    set(state => ({
      editor: {
        ...state.editor,
        openFiles: state.editor.openFiles.map(f =>
          f.id === id ? { ...f, content, isDirty: true } : f
        ),
      },
    })),

  markFileDirty: (id, isDirty) =>
    set(state => ({
      editor: {
        ...state.editor,
        openFiles: state.editor.openFiles.map(f =>
          f.id === id ? { ...f, isDirty } : f
        ),
      },
    })),

  setFileTree: (tree) =>
    set(state => ({ editor: { ...state.editor, fileTree: tree } })),

  // ── Settings ─────────────────────────────────────────────────────────
  settings: { ...DEFAULT_SETTINGS, ...persistedSettings },
  setSettings: (update) => {
    set(state => {
      const newSettings = { ...state.settings, ...update };
      localStorage.setItem('haven:settings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },

  // ── Notifications ─────────────────────────────────────────────────────
  notifications: [],
  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    set(state => ({ notifications: [...state.notifications, notification] }));

    // Auto-remove after duration
    const duration = n.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        set(state => ({
          notifications: state.notifications.filter(x => x.id !== notification.id),
        }));
      }, duration);
    }
  },

  removeNotification: (id) =>
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),

  // ── System Info ────────────────────────────────────────────────────────
  systemInfo: null,
  setSystemInfo: (info) => set({ systemInfo: info }),
}));

// ── Selectors ─────────────────────────────────────────────────────────

export const useActiveFile = () =>
  useHavenStore(state =>
    state.editor.openFiles.find(f => f.id === state.editor.activeFileId) ?? null
  );

export const useOllamaConnected = () =>
  useHavenStore(state => state.ai.connectionStatus === 'connected');

export const useSettings = () => useHavenStore(state => state.settings);
export const useLayout = () => useHavenStore(state => state.layout);
export const useAI = () => useHavenStore(state => state.ai);
export const useEditor = () => useHavenStore(state => state.editor);
export const useNotifications = () => useHavenStore(state => state.notifications);
