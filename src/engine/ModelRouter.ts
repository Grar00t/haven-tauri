// ═══════════════════════════════════════════════════════════════════════
// MODEL ROUTER — Three-Lobe Intelligence Routing
// موجّه النماذج — توجيه الذكاء ثلاثي الفصوص
// Routes tasks to the correct model/lobe based on NiyahEngine analysis.
// Zero cloud. Every neuron fires locally.
// ═══════════════════════════════════════════════════════════════════════

import type { NiyahDomain, NiyahVector, LobeResult } from './NiyahEngine';
import { ollamaService, type ConnectionStatus, type OllamaRunningModel } from './OllamaService';

// ── Lobe Definitions ──────────────────────────────────────────────────

export type LobeId = 'cognitive' | 'executive' | 'sensory';

export const ALL_LOBE_IDS = ['cognitive', 'executive', 'sensory'] as const satisfies readonly LobeId[];

export interface LobeConfig {
  id: LobeId;
  name: string;
  nameAr: string;
  emoji: string;
  model: string;
  fallbackModel: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  domains: NiyahDomain[];
}

export interface RoutingDecision {
  primary: LobeId;
  secondary: LobeId | null;
  parallel: boolean;
  reason: string;
  confidence: number;
  modelOverride?: string;
}

export interface LobeResponse {
  lobe: LobeId;
  model: string;
  content: string;
  tokensUsed: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface ThreeLobeResult {
  cognitive?: LobeResponse;
  executive?: LobeResponse;
  sensory?: LobeResponse;
  primary: LobeResponse;
  synthesis: string;
  routingDecision: RoutingDecision;
  totalLatencyMs: number;
  vector: NiyahVector;
}

export interface RoutingTrace {
  timestamp: number;
  input: string;
  decision: RoutingDecision;
  responses: LobeResponse[];
  totalMs: number;
}

// ── Model Family Definitions ──────────────────────────────────────────

export interface ModelFamily {
  id: string;
  name: string;
  variants: string[];
  strengths: NiyahDomain[];
  codeSpecialist: boolean;
  arabicSupport: boolean;
  contextWindow: number;
  parameterSizes: string[];
}

const MODEL_FAMILIES: ModelFamily[] = [
  {
    id: 'qwen',
    name: 'Qwen',
    variants: ['qwen2.5', 'qwen2.5-coder', 'qwen3', 'qwen2', 'qwen'],
    strengths: ['code', 'datascience', 'general'],
    codeSpecialist: false,
    arabicSupport: true,
    contextWindow: 128000,
    parameterSizes: ['0.5b', '1.5b', '3b', '7b', '14b', '32b', '72b'],
  },
  {
    id: 'qwen-coder',
    name: 'Qwen Coder',
    variants: ['qwen2.5-coder'],
    strengths: ['code', 'infrastructure'],
    codeSpecialist: true,
    arabicSupport: true,
    contextWindow: 131072,
    parameterSizes: ['0.5b', '1.5b', '3b', '7b', '14b', '32b'],
  },
  {
    id: 'llama',
    name: 'LLaMA',
    variants: ['llama3.3', 'llama3.2', 'llama3.1', 'llama3', 'llama2', 'llama'],
    strengths: ['general', 'education', 'content', 'creative'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 131072,
    parameterSizes: ['1b', '3b', '8b', '70b', '405b'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    variants: ['deepseek-r1', 'deepseek-v3', 'deepseek-coder', 'deepseek'],
    strengths: ['code', 'datascience', 'general'],
    codeSpecialist: true,
    arabicSupport: false,
    contextWindow: 64000,
    parameterSizes: ['1.5b', '7b', '8b', '14b', '32b', '67b'],
  },
  {
    id: 'gemma',
    name: 'Gemma',
    variants: ['gemma3', 'gemma2', 'gemma', 'codegemma'],
    strengths: ['education', 'general', 'content'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 8192,
    parameterSizes: ['2b', '7b', '9b', '27b'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    variants: ['mistral-large', 'mistral-nemo', 'mistral-small', 'mistral'],
    strengths: ['general', 'business', 'content'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 32768,
    parameterSizes: ['7b', '12b', '22b'],
  },
  {
    id: 'phi',
    name: 'Phi',
    variants: ['phi4', 'phi3.5', 'phi3', 'phi'],
    strengths: ['code', 'education', 'general'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 16384,
    parameterSizes: ['3.8b', '7b', '14b'],
  },
  {
    id: 'codellama',
    name: 'CodeLlama',
    variants: ['codellama'],
    strengths: ['code', 'infrastructure'],
    codeSpecialist: true,
    arabicSupport: false,
    contextWindow: 16384,
    parameterSizes: ['7b', '13b', '34b', '70b'],
  },
  {
    id: 'starcoder',
    name: 'StarCoder',
    variants: ['starcoder2', 'starcoder'],
    strengths: ['code'],
    codeSpecialist: true,
    arabicSupport: false,
    contextWindow: 16384,
    parameterSizes: ['3b', '7b', '15b'],
  },
  {
    id: 'vicuna',
    name: 'Vicuna',
    variants: ['vicuna'],
    strengths: ['general', 'content'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 4096,
    parameterSizes: ['7b', '13b', '33b'],
  },
  {
    id: 'yi',
    name: 'Yi',
    variants: ['yi', 'yi-coder'],
    strengths: ['general', 'code'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 200000,
    parameterSizes: ['6b', '9b', '34b'],
  },
  {
    id: 'command-r',
    name: 'Command-R',
    variants: ['command-r', 'command-r-plus'],
    strengths: ['business', 'general', 'content'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 128000,
    parameterSizes: ['35b', '104b'],
  },
  {
    id: 'solar',
    name: 'Solar',
    variants: ['solar'],
    strengths: ['general'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 4096,
    parameterSizes: ['10.7b'],
  },
  {
    id: 'openchat',
    name: 'OpenChat',
    variants: ['openchat'],
    strengths: ['general', 'content'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 8192,
    parameterSizes: ['7b'],
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    variants: ['zephyr'],
    strengths: ['general', 'education'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 4096,
    parameterSizes: ['7b'],
  },
  {
    id: 'orca',
    name: 'Orca',
    variants: ['orca2', 'orca-mini'],
    strengths: ['general', 'education'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 4096,
    parameterSizes: ['3b', '7b', '13b'],
  },
  {
    id: 'neural-chat',
    name: 'Neural Chat',
    variants: ['neural-chat'],
    strengths: ['general'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 8192,
    parameterSizes: ['7b'],
  },
  {
    id: 'mixtral',
    name: 'Mixtral',
    variants: ['mixtral'],
    strengths: ['general', 'code', 'business'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 32768,
    parameterSizes: ['8x7b', '8x22b'],
  },
  {
    id: 'internlm',
    name: 'InternLM',
    variants: ['internlm2', 'internlm'],
    strengths: ['code', 'general', 'datascience'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 200000,
    parameterSizes: ['7b', '20b'],
  },
  {
    id: 'dolphin',
    name: 'Dolphin',
    variants: ['dolphin-mistral', 'dolphin-llama3', 'dolphin'],
    strengths: ['general', 'creative'],
    codeSpecialist: false,
    arabicSupport: false,
    contextWindow: 16384,
    parameterSizes: ['7b', '8b'],
  },
];

// ── Default Lobe Configs ──────────────────────────────────────────────

const DEFAULT_LOBE_CONFIGS: Record<LobeId, LobeConfig> = {
  cognitive: {
    id: 'cognitive',
    name: 'Cognitive',
    nameAr: 'المعرفي',
    emoji: '🧠',
    model: 'qwen2.5:latest',
    fallbackModel: 'llama3:latest',
    description: 'Understanding, reasoning, and deep analysis',
    systemPrompt: `أنت فص المعرفة في HAVEN IDE. مهمتك:
- تحليل عميق للمشكلة
- استخراج النية الحقيقية من الطلب
- ربط السياق بالجلسات السابقة
- الإجابة بدقة عالية
- السيادة الرقمية أولاً — لا تلميحات لخدمات سحابية خارجية`,
    temperature: 0.7,
    maxTokens: 4096,
    domains: ['education', 'business', 'general', 'datascience'],
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    nameAr: 'التنفيذي',
    emoji: '⚡',
    model: 'qwen2.5-coder:latest',
    fallbackModel: 'deepseek-coder:latest',
    description: 'Code generation, execution, and action',
    systemPrompt: `أنت فص التنفيذ في HAVEN IDE. مهمتك:
- كتابة كود نظيف وقابل للتشغيل فوراً
- تنفيذ المهام بدقة وسرعة
- استخدام أفضل الممارسات في البرمجة
- لا Microsoft، لا telemetry، لا cloud
- كل الكود يعمل محلياً على جهاز المستخدم`,
    temperature: 0.2,
    maxTokens: 8192,
    domains: ['code', 'infrastructure'],
  },
  sensory: {
    id: 'sensory',
    name: 'Sensory',
    nameAr: 'الحسي',
    emoji: '👁',
    model: 'llama3.2:latest',
    fallbackModel: 'phi3:latest',
    description: 'Perception, creativity, and aesthetic judgment',
    systemPrompt: `أنت فص الإدراك في HAVEN IDE. مهمتك:
- إنشاء محتوى إبداعي عالي الجودة
- تصميم واجهات جميلة وعملية
- تحليل البيانات المرئية
- الأمن والخصوصية في كل إبداع
- جماليات عربية أصيلة`,
    temperature: 0.9,
    maxTokens: 4096,
    domains: ['content', 'creative', 'security'],
  },
};

// ═══════════════════════════════════════════════════════════════════════
// CORE ROUTER
// ═══════════════════════════════════════════════════════════════════════

export class ModelRouter {
  private lobeConfigs: Record<LobeId, LobeConfig>;
  private routingHistory: RoutingTrace[] = [];
  private readonly MAX_HISTORY = 100;

  // State mirrored from OllamaService
  connected = false;
  connectionStatus: ConnectionStatus = 'disconnected';

  constructor() {
    this.lobeConfigs = { ...DEFAULT_LOBE_CONFIGS };

    // Subscribe to Ollama status
    ollamaService.onStatusChange(status => {
      this.connectionStatus = status;
      this.connected = status === 'connected';
      if (this.connected) {
        this.autoConfigureLobes();
      }
    });
  }

  // ── Lobe Config ─────────────────────────────────────────────────────

  getLobeConfig(lobeId: LobeId): LobeConfig {
    return this.lobeConfigs[lobeId];
  }

  getAllLobeConfigs(): Record<LobeId, LobeConfig> {
    return { ...this.lobeConfigs };
  }

  setLobeModel(lobeId: LobeId, model: string): void {
    this.lobeConfigs[lobeId].model = model;
  }

  /**
   * تهيئة الفصوص تلقائياً بناءً على النماذج المتاحة
   */
  autoConfigureLobes(): void {
    const models = ollamaService.getModels();
    if (models.length === 0) return;

    // Cognitive: best general model
    const cogModel = ollamaService.getBestModelForTask('chat');
    if (cogModel) this.lobeConfigs.cognitive.model = cogModel;

    // Executive: best code model
    const execModel = ollamaService.getBestModelForTask('code');
    if (execModel) this.lobeConfigs.executive.model = execModel;

    // Sensory: best creative model
    const sensModel = ollamaService.getBestModelForTask('creative');
    if (sensModel) this.lobeConfigs.sensory.model = sensModel;
  }

  // ── Routing Decision ────────────────────────────────────────────────

  /**
   * اتخاذ قرار التوجيه بناءً على متجه النية
   */
  route(vector: NiyahVector): RoutingDecision {
    const { domain, flags, tone } = vector;

    // Explicit lobe flag override
    if (flags.lobe !== 'all') {
      const lobeMap: Record<string, LobeId> = {
        exec: 'executive',
        sensory: 'sensory',
        cognitive: 'cognitive',
      };
      const primary = lobeMap[flags.lobe] ?? 'cognitive';
      return {
        primary,
        secondary: null,
        parallel: false,
        reason: `Explicit lobe flag: --${flags.lobe}`,
        confidence: 1.0,
      };
    }

    // Domain-based routing
    switch (domain) {
      case 'code':
        return {
          primary: 'executive',
          secondary: flags.deepMode ? 'cognitive' : null,
          parallel: flags.deepMode,
          reason: 'Code domain → Executive lobe leads',
          confidence: 0.95,
        };

      case 'infrastructure':
        return {
          primary: 'executive',
          secondary: 'cognitive',
          parallel: true,
          reason: 'Infrastructure: Executive + Cognitive in parallel',
          confidence: 0.9,
        };

      case 'security':
        return {
          primary: 'cognitive',
          secondary: 'executive',
          parallel: false,
          reason: 'Security analysis: Cognitive first, Executive for implementation',
          confidence: 0.92,
        };

      case 'content':
      case 'creative':
        return {
          primary: 'sensory',
          secondary: flags.deepMode ? 'cognitive' : null,
          parallel: false,
          reason: 'Creative/Content: Sensory lobe leads',
          confidence: 0.88,
        };

      case 'datascience':
        return {
          primary: 'cognitive',
          secondary: 'executive',
          parallel: true,
          reason: 'Data Science: Parallel cognitive + executive analysis',
          confidence: 0.87,
        };

      case 'business':
        return {
          primary: 'cognitive',
          secondary: null,
          parallel: false,
          reason: 'Business: Cognitive reasoning',
          confidence: 0.85,
        };

      case 'education':
        return {
          primary: 'cognitive',
          secondary: tone === 'curious' ? 'sensory' : null,
          parallel: false,
          reason: 'Education: Cognitive explanation',
          confidence: 0.85,
        };

      default:
        return {
          primary: flags.urgent ? 'executive' : 'cognitive',
          secondary: null,
          parallel: false,
          reason: 'General query: Default routing',
          confidence: 0.7,
        };
    }
  }

  // ── Model Scoring ───────────────────────────────────────────────────

  /**
   * تحديد أفضل نموذج لفصّ معين بناءً على المهمة
   */
  scoreModelsForLobe(lobeId: LobeId, vector: NiyahVector): { model: string; score: number }[] {
    const available = ollamaService.getModels();
    if (available.length === 0) return [];

    return available.map(m => {
      let score = 0.5;
      const nameLower = m.name.toLowerCase();
      const family = MODEL_FAMILIES.find(f => f.variants.some(v => nameLower.includes(v)));

      if (!family) return { model: m.name, score: 0.3 };

      // Code specialist bonus
      if (lobeId === 'executive' && family.codeSpecialist) score += 0.3;
      if (vector.domain === 'code' && family.codeSpecialist) score += 0.2;

      // Arabic support bonus
      if (vector.dialect !== 'english' && family.arabicSupport) score += 0.15;

      // Domain strength match
      if (family.strengths.includes(vector.domain)) score += 0.2;

      // Context window preference (higher is better for deep mode)
      if (vector.flags.deepMode && family.contextWindow >= 32000) score += 0.1;

      return { model: m.name, score: Math.min(score, 1.0) };
    }).sort((a, b) => b.score - a.score);
  }

  getBestModelForLobe(lobeId: LobeId, vector: NiyahVector): string {
    const scored = this.scoreModelsForLobe(lobeId, vector);
    return scored[0]?.model ?? this.lobeConfigs[lobeId].model;
  }

  // ── Routing History ─────────────────────────────────────────────────

  addToHistory(trace: RoutingTrace): void {
    this.routingHistory.push(trace);
    if (this.routingHistory.length > this.MAX_HISTORY) {
      this.routingHistory.shift();
    }
  }

  getRoutingHistory(): RoutingTrace[] {
    return [...this.routingHistory];
  }

  // ── Model Family Info ───────────────────────────────────────────────

  getModelFamilies(): ModelFamily[] {
    return MODEL_FAMILIES;
  }

  identifyModelFamily(modelName: string): ModelFamily | null {
    const lower = modelName.toLowerCase();
    return MODEL_FAMILIES.find(f => f.variants.some(v => lower.includes(v))) ?? null;
  }

  // ── Status ──────────────────────────────────────────────────────────

  getStatusSummary(): {
    connected: boolean;
    status: ConnectionStatus;
    lobes: { id: LobeId; model: string; available: boolean }[];
    runningModels: OllamaRunningModel[];
  } {
    const available = ollamaService.getModels().map(m => m.name);
    return {
      connected: this.connected,
      status: this.connectionStatus,
      lobes: ALL_LOBE_IDS.map(id => ({
        id,
        model: this.lobeConfigs[id].model,
        available: available.includes(this.lobeConfigs[id].model),
      })),
      runningModels: ollamaService.getRunningModels(),
    };
  }
}

// ── Singleton ─────────────────────────────────────────────────────────
export const modelRouter = new ModelRouter();
export default modelRouter;
