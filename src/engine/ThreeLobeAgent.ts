// ═══════════════════════════════════════════════════════════════════════
// THREE LOBE AGENT — Sovereign Cognitive Orchestrator
// المنسّق المعرفي السيادي
// Orchestrates parallel/sequential lobe execution.
// Thinks in Arabic. Codes in silence. Serves with sovereignty.
// ═══════════════════════════════════════════════════════════════════════

import { niyahEngine, type NiyahSession, type NiyahVector } from './NiyahEngine';
import { ollamaService, type OllamaChatMessage, type GenerationStats } from './OllamaService';
import { modelRouter, type LobeId, type LobeResponse, type ThreeLobeResult, type RoutingDecision } from './ModelRouter';

// ── Types ────────────────────────────────────────────────────────────

export interface AgentContext {
  activeFile?: string;
  language?: string;
  recentFiles?: string[];
  workspacePath?: string;
  gitBranch?: string;
  selectedText?: string;
  cursorLine?: number;
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  lobeId?: LobeId;
  model?: string;
  stats?: GenerationStats;
  niyahSession?: NiyahSession;
}

export interface AgentStreamCallbacks {
  onToken?: (lobeId: LobeId, token: string) => void;
  onLobeStart?: (lobeId: LobeId, model: string) => void;
  onLobeEnd?: (lobeId: LobeId, response: LobeResponse) => void;
  onRoutingDecision?: (decision: RoutingDecision) => void;
  onDone?: (result: ThreeLobeResult) => void;
  onError?: (error: string) => void;
}

export interface AgentConfig {
  maxHistoryLength: number;
  maxTokensPerLobe: number;
  parallelTimeout: number;
  arabicSystemPrompt: boolean;
  gitIntegration: boolean;
  sessionEncryption: boolean;
}

// ── Arabic-First System Prompts ───────────────────────────────────────

const ARABIC_SYSTEM_PROMPT = `أنت HAVEN، مساعد تطوير سيادي مبني خصيصاً للمطورين العرب.

مبادئك الأساسية:
1. الخصوصية أولاً — لا telemetry، لا cloud، لا تتبع
2. السيادة الرقمية — كل شيء يبقى على جهاز المستخدم
3. اللغة العربية أصيل وليست ترجمة
4. الكود الذي تكتبه يعمل فوراً دون اعتماد على خدمات خارجية
5. أنت تخدم المطور، لا الشركات التقنية الكبرى

عند الإجابة:
- استخدم لهجة المستخدم (نجدية، مصرية، شامية، إلخ) إذا كان يتحدث بالعربية
- قدّم الكود بشكل نظيف ومباشر
- اشرح التفكير وراء الحل لا فقط الحل
- نبّه على أي مشاكل أمنية أو تبعيات خارجية`;

const ENGLISH_SYSTEM_PROMPT = `You are HAVEN, a sovereign AI development assistant.

Core principles:
1. Privacy first — no telemetry, no cloud, no tracking
2. Digital sovereignty — everything stays on the user's device
3. All AI runs locally via Ollama
4. Zero Microsoft, zero external dependencies
5. You serve the developer, not big tech

Respond with:
- Clean, directly runnable code
- Clear reasoning, not just answers
- Security and privacy considerations
- Flag any external dependencies`;

// ═══════════════════════════════════════════════════════════════════════
// CORE AGENT
// ═══════════════════════════════════════════════════════════════════════

export class ThreeLobeAgent {
  private conversation: ConversationTurn[] = [];
  private config: AgentConfig;
  private currentAbortId: string | null = null;

  constructor(config?: Partial<AgentConfig>) {
    this.config = {
      maxHistoryLength: 50,
      maxTokensPerLobe: 8192,
      parallelTimeout: 120_000,
      arabicSystemPrompt: true,
      gitIntegration: true,
      sessionEncryption: false,
      ...config,
    };
  }

  // ── Public API ──────────────────────────────────────────────────────

  /**
   * معالجة رسالة المستخدم عبر الفصوص الثلاثة
   */
  async processMessage(
    userInput: string,
    context: AgentContext = {},
    callbacks: AgentStreamCallbacks = {}
  ): Promise<ThreeLobeResult> {
    const startTime = Date.now();

    // Step 1: Run NiyahEngine analysis
    const niyahSession = niyahEngine.process(userInput, context);
    const vector = niyahSession.vector;

    // Step 2: Get routing decision
    const decision = modelRouter.route(vector);
    callbacks.onRoutingDecision?.(decision);

    // Step 3: Add user turn to history
    this.addTurn('user', userInput, undefined, undefined, undefined, niyahSession);

    // Step 4: Build messages for each lobe
    const systemPrompt = this.buildSystemPrompt(vector, context);

    // Step 5: Execute lobes
    let result: ThreeLobeResult;

    if (decision.parallel && decision.secondary) {
      result = await this.executeParallel(vector, decision, systemPrompt, userInput, context, callbacks);
    } else {
      result = await this.executeSequential(vector, decision, systemPrompt, userInput, context, callbacks);
    }

    result.totalLatencyMs = Date.now() - startTime;

    // Step 6: Store assistant turn
    this.addTurn('assistant', result.synthesis, decision.primary, result.primary.model, undefined);

    // Step 7: Record routing trace
    modelRouter.addToHistory({
      timestamp: startTime,
      input: userInput,
      decision,
      responses: [result.primary, result.cognitive, result.executive, result.sensory].filter(Boolean) as LobeResponse[],
      totalMs: result.totalLatencyMs,
    });

    callbacks.onDone?.(result);
    return result;
  }

  /**
   * إيقاف التوليد الحالي
   */
  abort(): void {
    if (this.currentAbortId) {
      ollamaService.abort(this.currentAbortId);
      this.currentAbortId = null;
    }
    ollamaService.abortAll();
  }

  getConversation(): ConversationTurn[] {
    return [...this.conversation];
  }

  clearConversation(): void {
    this.conversation = [];
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // ── Lobe Execution ──────────────────────────────────────────────────

  private async executeSequential(
    vector: NiyahVector,
    decision: RoutingDecision,
    systemPrompt: string,
    userInput: string,
    _context: AgentContext,
    callbacks: AgentStreamCallbacks
  ): Promise<ThreeLobeResult> {
    const primaryResponse = await this.generateFromLobe(
      decision.primary,
      systemPrompt,
      userInput,
      vector,
      callbacks
    );

    let secondaryResponse: LobeResponse | undefined;
    if (decision.secondary && primaryResponse.success) {
      const secondaryInput = this.buildSecondaryPrompt(userInput, primaryResponse.content, decision.secondary);
      secondaryResponse = await this.generateFromLobe(
        decision.secondary,
        systemPrompt,
        secondaryInput,
        vector,
        callbacks
      );
    }

    const synthesis = this.synthesize(primaryResponse, secondaryResponse, vector);

    return {
      primary: primaryResponse,
      cognitive: decision.primary === 'cognitive' ? primaryResponse : secondaryResponse?.lobe === 'cognitive' ? secondaryResponse : undefined,
      executive: decision.primary === 'executive' ? primaryResponse : secondaryResponse?.lobe === 'executive' ? secondaryResponse : undefined,
      sensory: decision.primary === 'sensory' ? primaryResponse : secondaryResponse?.lobe === 'sensory' ? secondaryResponse : undefined,
      synthesis,
      routingDecision: decision,
      totalLatencyMs: 0,
      vector,
    };
  }

  private async executeParallel(
    vector: NiyahVector,
    decision: RoutingDecision,
    systemPrompt: string,
    userInput: string,
    _context: AgentContext,
    callbacks: AgentStreamCallbacks
  ): Promise<ThreeLobeResult> {
    const secondary = decision.secondary!;

    const [primaryResponse, secondaryResponse] = await Promise.allSettled([
      this.generateFromLobe(decision.primary, systemPrompt, userInput, vector, callbacks),
      this.generateFromLobe(secondary, systemPrompt, userInput, vector, callbacks),
    ]);

    const primary = primaryResponse.status === 'fulfilled'
      ? primaryResponse.value
      : this.errorResponse(decision.primary, 'Parallel execution failed');

    const sec = secondaryResponse.status === 'fulfilled'
      ? secondaryResponse.value
      : this.errorResponse(secondary, 'Parallel execution failed');

    const synthesis = this.synthesize(primary, sec, vector);

    return {
      primary,
      cognitive: decision.primary === 'cognitive' ? primary : secondary === 'cognitive' ? sec : undefined,
      executive: decision.primary === 'executive' ? primary : secondary === 'executive' ? sec : undefined,
      sensory: decision.primary === 'sensory' ? primary : secondary === 'sensory' ? sec : undefined,
      synthesis,
      routingDecision: decision,
      totalLatencyMs: 0,
      vector,
    };
  }

  async generateFromLobe(
    lobeId: LobeId,
    systemPrompt: string,
    userInput: string,
    vector: NiyahVector,
    callbacks: AgentStreamCallbacks
  ): Promise<LobeResponse> {
    const config = modelRouter.getLobeConfig(lobeId);
    const model = modelRouter.getBestModelForLobe(lobeId, vector);
    const startTime = Date.now();

    callbacks.onLobeStart?.(lobeId, model);

    const abortId = `${lobeId}-${Date.now()}`;
    this.currentAbortId = abortId;

    let fullContent = '';
    let stats: GenerationStats | undefined;
    let error: string | undefined;

    const messages = this.buildMessages(systemPrompt, userInput, lobeId);

    try {
      await ollamaService.chatStream(
        {
          model,
          messages,
          options: {
            temperature: config.temperature,
            num_predict: Math.min(config.maxTokens, this.config.maxTokensPerLobe),
          },
        },
        {
          onToken: (token) => {
            fullContent += token;
            callbacks.onToken?.(lobeId, token);
          },
          onDone: (s) => {
            stats = s;
          },
          onError: (e) => {
            error = e;
          },
        },
        abortId
      );
    } catch (e) {
      error = String(e);
    }

    const response: LobeResponse = {
      lobe: lobeId,
      model,
      content: fullContent,
      tokensUsed: stats?.evalTokens ?? 0,
      latencyMs: Date.now() - startTime,
      success: !error && fullContent.length > 0,
      error,
      stats,
    } as LobeResponse & { stats?: GenerationStats };

    callbacks.onLobeEnd?.(lobeId, response);
    return response;
  }

  // ── Message Building ────────────────────────────────────────────────

  private buildSystemPrompt(vector: NiyahVector, context: AgentContext): string {
    const base = vector.dialect !== 'english'
      ? ARABIC_SYSTEM_PROMPT
      : ENGLISH_SYSTEM_PROMPT;

    const contextAdditions: string[] = [];

    if (context.activeFile) {
      contextAdditions.push(`Active file: ${context.activeFile}`);
    }
    if (context.language) {
      contextAdditions.push(`Language: ${context.language}`);
    }
    if (context.gitBranch) {
      contextAdditions.push(`Git branch: ${context.gitBranch}`);
    }
    if (context.selectedText) {
      contextAdditions.push(`\nSelected text:\n\`\`\`\n${context.selectedText.slice(0, 500)}\n\`\`\``);
    }
    if (context.workspacePath) {
      contextAdditions.push(`Workspace: ${context.workspacePath}`);
    }

    return contextAdditions.length > 0
      ? `${base}\n\nContext:\n${contextAdditions.join('\n')}`
      : base;
  }

  private buildMessages(
    systemPrompt: string,
    userInput: string,
    _lobeId: LobeId
  ): OllamaChatMessage[] {
    const messages: OllamaChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last N turns)
    const historyTurns = this.conversation.slice(-this.config.maxHistoryLength * 2);
    for (const turn of historyTurns) {
      if (turn.role === 'user' || turn.role === 'assistant') {
        messages.push({ role: turn.role, content: turn.content });
      }
    }

    messages.push({ role: 'user', content: userInput });
    return messages;
  }

  private buildSecondaryPrompt(
    originalInput: string,
    primaryOutput: string,
    secondaryLobe: LobeId
  ): string {
    switch (secondaryLobe) {
      case 'executive':
        return `Based on this analysis, implement it:
Original request: ${originalInput}
Analysis: ${primaryOutput.slice(0, 1000)}
Now write the implementation code:`;

      case 'cognitive':
        return `Review and improve this implementation:
Original request: ${originalInput}
Implementation: ${primaryOutput.slice(0, 2000)}
Provide analysis and improvements:`;

      case 'sensory':
        return `Enhance this with creative and aesthetic considerations:
Original: ${originalInput}
Draft: ${primaryOutput.slice(0, 1000)}`;

      default:
        return originalInput;
    }
  }

  private synthesize(
    primary: LobeResponse,
    secondary?: LobeResponse,
    vector?: NiyahVector
  ): string {
    if (!secondary || !secondary.success) {
      return primary.content;
    }

    // For parallel execution: combine insights
    if (vector?.flags.deepMode) {
      return `${primary.content}\n\n---\n\n**${secondary.lobe.toUpperCase()} ANALYSIS:**\n\n${secondary.content}`;
    }

    // For sequential: secondary refines primary
    return secondary.content.length > primary.content.length
      ? secondary.content
      : primary.content;
  }

  private errorResponse(lobeId: LobeId, error: string): LobeResponse {
    return {
      lobe: lobeId,
      model: modelRouter.getLobeConfig(lobeId).model,
      content: '',
      tokensUsed: 0,
      latencyMs: 0,
      success: false,
      error,
    };
  }

  // ── Conversation History ────────────────────────────────────────────

  private addTurn(
    role: ConversationTurn['role'],
    content: string,
    lobeId?: LobeId,
    model?: string,
    stats?: GenerationStats,
    niyahSession?: NiyahSession
  ): void {
    const turn: ConversationTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      content,
      timestamp: Date.now(),
      lobeId,
      model,
      stats,
      niyahSession,
    };

    this.conversation.push(turn);

    // Trim history
    if (this.conversation.length > this.config.maxHistoryLength * 2) {
      this.conversation = this.conversation.slice(-this.config.maxHistoryLength * 2);
    }
  }
}

// ── Singleton ─────────────────────────────────────────────────────────
export const threeLobeAgent = new ThreeLobeAgent();
export default threeLobeAgent;
