// ═══════════════════════════════════════════════════════════════════════
// OLLAMA SERVICE — Local AI Bridge
// جسر الذكاء الاصطناعي المحلي
// Connects HAVEN IDE to Ollama running locally.
// Zero cloud. Every token generated on-device.
// ═══════════════════════════════════════════════════════════════════════

import { invoke } from '@tauri-apps/api/core';

// ── Types ────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaRunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  expires_at?: string;
  size_vram?: number;
}

export interface OllamaGenerateOptions {
  temperature?: number;
  top_k?: number;
  top_p?: number;
  repeat_penalty?: number;
  num_predict?: number;
  num_ctx?: number;
  stop?: string[];
  seed?: number;
  mirostat?: number;
  mirostat_tau?: number;
  mirostat_eta?: number;
  tfs_z?: number;
  typical_p?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: OllamaGenerateOptions;
  context?: number[];
  template?: string;
  raw?: boolean;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: string[];
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: OllamaGenerateOptions;
  format?: 'json' | { type: string };
  tools?: unknown[];
  keep_alive?: string | number;
}

export interface OllamaGenerateChunk {
  model: string;
  created_at: string;
  response?: string;
  message?: { role: string; content: string };
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface GenerateStreamCallbacks {
  onToken: (token: string) => void;
  onDone?: (stats: GenerationStats) => void;
  onError?: (error: string) => void;
}

export interface GenerationStats {
  totalTokens: number;
  promptTokens: number;
  evalTokens: number;
  totalDurationMs: number;
  tokensPerSecond: number;
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// CORE SERVICE
// ═══════════════════════════════════════════════════════════════════════

export class OllamaService {
  private host: string;
  private status: ConnectionStatus = 'disconnected';
  private models: OllamaModel[] = [];
  private runningModels: OllamaRunningModel[] = [];
  private activeModel: string | null = null;
  private abortControllers: Map<string, AbortController> = new Map();
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private modelsListeners: Set<(models: OllamaModel[]) => void> = new Set();

  constructor(host = 'http://127.0.0.1:11434') {
    this.host = host;
  }

  // ── Connection Management ───────────────────────────────────────────

  setHost(host: string): void {
    this.host = host;
  }

  getHost(): string {
    return this.host;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getActiveModel(): string | null {
    return this.activeModel;
  }

  setActiveModel(model: string): void {
    this.activeModel = model;
  }

  getModels(): OllamaModel[] {
    return this.models;
  }

  getRunningModels(): OllamaRunningModel[] {
    return this.runningModels;
  }

  onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  onModelsChange(cb: (models: OllamaModel[]) => void): () => void {
    this.modelsListeners.add(cb);
    return () => this.modelsListeners.delete(cb);
  }

  private setStatus(s: ConnectionStatus): void {
    this.status = s;
    this.statusListeners.forEach(cb => cb(s));
  }

  /**
   * الاتصال بـ Ollama وجلب النماذج
   */
  async connect(): Promise<boolean> {
    this.setStatus('connecting');
    try {
      const healthy = await invoke<boolean>('ollama_health_check', { host: this.host });
      if (!healthy) {
        this.setStatus('disconnected');
        return false;
      }
      this.setStatus('connected');
      await this.refreshModels();
      this.startHealthCheck();
      return true;
    } catch (err) {
      console.error('[OllamaService] connect error:', err);
      this.setStatus('error');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.stopHealthCheck();
    this.setStatus('disconnected');
    this.models = [];
    this.runningModels = [];
    this.modelsListeners.forEach(cb => cb([]));
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await invoke<boolean>('ollama_health_check', { host: this.host });
    } catch {
      return false;
    }
  }

  private startHealthCheck(): void {
    this.stopHealthCheck();
    this.healthCheckInterval = setInterval(async () => {
      const healthy = await this.healthCheck();
      if (!healthy && this.status === 'connected') {
        this.setStatus('disconnected');
      } else if (healthy && this.status !== 'connected') {
        this.setStatus('connected');
        await this.refreshModels();
      }
    }, 15_000);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval !== null) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // ── Model Management ────────────────────────────────────────────────

  async refreshModels(): Promise<OllamaModel[]> {
    try {
      this.models = await invoke<OllamaModel[]>('ollama_list_models', { host: this.host });
      this.modelsListeners.forEach(cb => cb(this.models));

      // If no active model, pick the first available
      if (!this.activeModel && this.models.length > 0) {
        this.activeModel = this.models[0].name;
      }

      return this.models;
    } catch (err) {
      console.error('[OllamaService] refreshModels error:', err);
      return [];
    }
  }

  async getRunning(): Promise<OllamaRunningModel[]> {
    try {
      this.runningModels = await invoke<OllamaRunningModel[]>('ollama_running_models', {
        host: this.host,
      });
      return this.runningModels;
    } catch {
      return [];
    }
  }

  async showModel(name: string): Promise<Record<string, unknown>> {
    return invoke<Record<string, unknown>>('ollama_show_model', { modelName: name, host: this.host });
  }

  async deleteModel(name: string): Promise<boolean> {
    const ok = await invoke<boolean>('ollama_delete_model', { modelName: name, host: this.host });
    if (ok) await this.refreshModels();
    return ok;
  }

  // ── Streaming Generation ────────────────────────────────────────────

  /**
   * Generate via HTTP streaming (SSE-like line-delimited JSON)
   * Used when Tauri's native bridge can't handle SSE directly
   */
  async generateStream(
    req: OllamaGenerateRequest,
    callbacks: GenerateStreamCallbacks,
    abortId?: string
  ): Promise<void> {
    const ctrl = new AbortController();
    if (abortId) this.abortControllers.set(abortId, ctrl);

    const startTime = Date.now();
    let totalTokens = 0;
    let evalTokens = 0;
    let promptTokens = 0;

    try {
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...req, stream: true }),
        signal: ctrl.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line) as OllamaGenerateChunk;
            if (chunk.response) {
              callbacks.onToken(chunk.response);
              totalTokens++;
            }
            if (chunk.done) {
              evalTokens = chunk.eval_count ?? 0;
              promptTokens = chunk.prompt_eval_count ?? 0;
            }
          } catch {
            // Partial JSON — wait for next chunk
          }
        }
      }

      const durationMs = Date.now() - startTime;
      callbacks.onDone?.({
        totalTokens,
        promptTokens,
        evalTokens,
        totalDurationMs: durationMs,
        tokensPerSecond: evalTokens > 0 ? (evalTokens / (durationMs / 1000)) : 0,
      });
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') {
        callbacks.onDone?.({ totalTokens, promptTokens, evalTokens, totalDurationMs: Date.now() - startTime, tokensPerSecond: 0 });
      } else {
        callbacks.onError?.(String(err));
      }
    } finally {
      if (abortId) this.abortControllers.delete(abortId);
    }
  }

  /**
   * Chat completion with streaming
   */
  async chatStream(
    req: OllamaChatRequest,
    callbacks: GenerateStreamCallbacks,
    abortId?: string
  ): Promise<void> {
    const ctrl = new AbortController();
    if (abortId) this.abortControllers.set(abortId, ctrl);

    const startTime = Date.now();
    let totalTokens = 0;
    let evalTokens = 0;
    let promptTokens = 0;

    try {
      const response = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...req, stream: true }),
        signal: ctrl.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line) as OllamaGenerateChunk;
            if (chunk.message?.content) {
              callbacks.onToken(chunk.message.content);
              totalTokens++;
            }
            if (chunk.done) {
              evalTokens = chunk.eval_count ?? 0;
              promptTokens = chunk.prompt_eval_count ?? 0;
            }
          } catch {
            // Partial JSON
          }
        }
      }

      const durationMs = Date.now() - startTime;
      callbacks.onDone?.({
        totalTokens,
        promptTokens,
        evalTokens,
        totalDurationMs: durationMs,
        tokensPerSecond: evalTokens > 0 ? (evalTokens / (durationMs / 1000)) : 0,
      });
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') {
        callbacks.onDone?.({ totalTokens, promptTokens, evalTokens, totalDurationMs: Date.now() - startTime, tokensPerSecond: 0 });
      } else {
        callbacks.onError?.(String(err));
      }
    } finally {
      if (abortId) this.abortControllers.delete(abortId);
    }
  }

  // ── Non-streaming Generation ────────────────────────────────────────

  async generate(req: OllamaGenerateRequest): Promise<string> {
    return invoke<string>('ollama_generate', {
      request: { ...req, stream: false },
      host: this.host,
    });
  }

  async chat(req: OllamaChatRequest): Promise<string> {
    return invoke<string>('ollama_chat', {
      request: { ...req, stream: false },
      host: this.host,
    });
  }

  /**
   * Code completion (fill-in-middle pattern)
   */
  async codeComplete(
    prefix: string,
    suffix: string,
    language: string,
    model?: string
  ): Promise<string> {
    const targetModel = model ?? this.activeModel ?? 'qwen2.5-coder:latest';
    const prompt = `<fim_prefix>${prefix}<fim_suffix>${suffix}<fim_middle>`;

    return this.generate({
      model: targetModel,
      prompt,
      options: {
        temperature: 0.1,
        num_predict: 256,
        stop: ['<fim_middle>', '<fim_suffix>', '<fim_prefix>', '</s>'],
      },
      raw: true,
    });
  }

  // ── Abort Management ───────────────────────────────────────────────

  abort(abortId: string): void {
    const ctrl = this.abortControllers.get(abortId);
    if (ctrl) {
      ctrl.abort();
      this.abortControllers.delete(abortId);
    }
  }

  abortAll(): void {
    for (const ctrl of this.abortControllers.values()) {
      ctrl.abort();
    }
    this.abortControllers.clear();
  }

  // ── Model Families (for routing) ────────────────────────────────────

  getBestModelForTask(task: 'code' | 'chat' | 'analysis' | 'creative'): string | null {
    if (this.models.length === 0) return null;

    const priorities: Record<typeof task, string[]> = {
      code: ['qwen2.5-coder', 'deepseek-coder', 'codellama', 'starcoder', 'codegemma', 'phi-3'],
      chat: ['qwen2.5', 'llama3', 'mistral', 'gemma', 'phi-3', 'deepseek'],
      analysis: ['qwen2.5', 'llama3', 'mistral-large', 'deepseek', 'gemma'],
      creative: ['llama3', 'mistral', 'qwen2.5', 'gemma', 'phi'],
    };

    const prefs = priorities[task];
    const modelNames = this.models.map(m => m.name.toLowerCase());

    for (const pref of prefs) {
      const found = modelNames.find(name => name.includes(pref));
      if (found) return this.models.find(m => m.name.toLowerCase() === found)?.name ?? null;
    }

    return this.models[0]?.name ?? null;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────
export const ollamaService = new OllamaService();
export default ollamaService;
