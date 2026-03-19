// ═══════════════════════════════════════════════════════════════════════
// AI PANEL — Three-Lobe Chat Interface
// لوحة الذكاء الاصطناعي — واجهة المحادثة ثلاثية الفصوص
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Trash2, Brain, Zap, Eye, ChevronDown, Copy, Check } from 'lucide-react';
import { useHavenStore, useAI, useActiveFile } from '../store';
import { threeLobeAgent } from '../engine/ThreeLobeAgent';
import type { LobeId } from '../engine/ModelRouter';
import type { ConversationTurn } from '../engine/ThreeLobeAgent';
import { niyahEngine } from '../engine/NiyahEngine';
import { t, i18n } from '../i18n';

// ── Lobe Icons ────────────────────────────────────────────────────────

const LOBE_ICONS: Record<LobeId, React.ElementType> = {
  cognitive: Brain,
  executive: Zap,
  sensory: Eye,
};

const LOBE_COLORS: Record<LobeId, string> = {
  cognitive: '#4488ff',
  executive: '#d4af37',
  sensory: '#00ff41',
};

const LOBE_AR: Record<LobeId, string> = {
  cognitive: 'المعرفي',
  executive: 'التنفيذي',
  sensory: 'الحسي',
};

// ── Markdown Renderer (lightweight) ──────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const copyCode = async (code: string, idx: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedBlock(idx);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  // Split into text and code blocks
  const parts: { type: 'text' | 'code'; content: string; lang?: string }[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let codeIdx = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[2], lang: match[1] ?? 'text' });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return (
    <div style={{ fontSize: 13, lineHeight: 1.7 }}>
      {parts.map((part, i) => {
        if (part.type === 'code') {
          const idx = codeIdx++;
          return (
            <div key={i} className="haven-code-block" style={{ margin: '8px 0' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: '1px solid var(--haven-border)',
              }}>
                <span style={{ fontSize: 10, color: 'var(--haven-text-4)', fontFamily: 'var(--font-mono)' }}>
                  {part.lang}
                </span>
                <button
                  className="btn-icon"
                  style={{ width: 24, height: 24 }}
                  onClick={() => copyCode(part.content, idx)}
                  title="نسخ"
                >
                  {copiedBlock === idx ? <Check size={11} color="var(--haven-green)" /> : <Copy size={11} />}
                </button>
              </div>
              <pre style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: 1.6,
                color: 'var(--haven-text-1)',
                overflowX: 'auto',
                whiteSpace: 'pre',
              }}>
                {part.content}
              </pre>
            </div>
          );
        }

        // Simple text rendering
        const lines = part.content.split('\n');
        return (
          <div key={i}>
            {lines.map((line, j) => {
              if (line.startsWith('### ')) return <h3 key={j} style={{ fontSize: 13, color: 'var(--haven-gold)', margin: '12px 0 4px' }}>{line.slice(4)}</h3>;
              if (line.startsWith('## ')) return <h2 key={j} style={{ fontSize: 14, color: 'var(--haven-gold)', margin: '14px 0 6px' }}>{line.slice(3)}</h2>;
              if (line.startsWith('# ')) return <h1 key={j} style={{ fontSize: 16, color: 'var(--haven-gold)', margin: '16px 0 8px' }}>{line.slice(2)}</h1>;
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return <div key={j} style={{ paddingLeft: 16, marginBottom: 2 }}>• {renderInline(line.slice(2))}</div>;
              }
              if (line.trim() === '') return <div key={j} style={{ height: 6 }} />;
              return <div key={j}>{renderInline(line)}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--haven-text-1)' }}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith('*') && p.endsWith('*')) {
      return <em key={i}>{p.slice(1, -1)}</em>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <code key={i} style={{
          background: 'var(--haven-void)',
          padding: '1px 4px',
          borderRadius: 3,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--haven-gold)',
        }}>
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
}

// ── Message Bubble ────────────────────────────────────────────────────

function MessageBubble({ turn }: { turn: ConversationTurn }) {
  const isUser = turn.role === 'user';
  const lobeId = turn.lobeId as LobeId | undefined;
  const LobeIcon = lobeId ? LOBE_ICONS[lobeId] : Brain;
  const lobeColor = lobeId ? LOBE_COLORS[lobeId] : 'var(--haven-text-3)';

  return (
    <div
      className="animate-fade-in"
      style={{
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        color: 'var(--haven-text-4)',
      }}>
        {isUser ? (
          <>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--haven-gold-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              color: 'var(--haven-base)',
              fontWeight: 700,
            }}>
              U
            </div>
            <span style={{ fontFamily: 'var(--font-mono)' }}>أنت</span>
          </>
        ) : (
          <>
            <LobeIcon size={12} style={{ color: lobeColor }} />
            <span style={{ color: lobeColor, fontFamily: 'var(--font-mono)' }}>
              {lobeId ? LOBE_AR[lobeId] : 'HAVEN'}
            </span>
            {turn.model && (
              <span style={{ color: 'var(--haven-text-4)' }}>
                · {turn.model.split(':')[0]}
              </span>
            )}
          </>
        )}
        <span style={{ marginLeft: 'auto' }}>
          {new Date(turn.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          background: isUser ? 'var(--haven-elevated)' : 'var(--haven-surface)',
          border: `1px solid ${isUser ? 'var(--haven-border)' : lobeId ? `${lobeColor}22` : 'var(--haven-border)'}`,
          borderRadius: 8,
          padding: '10px 12px',
          color: 'var(--haven-text-1)',
          lineHeight: 1.65,
        }}
      >
        {isUser ? (
          <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', fontFamily: i18n.isRTL ? 'var(--font-arabic)' : undefined }}>
            {turn.content}
          </div>
        ) : (
          <MarkdownContent content={turn.content} />
        )}
      </div>
    </div>
  );
}

// ── Streaming Indicator ───────────────────────────────────────────────

function StreamingBubble({ lobeId, content }: { lobeId: string; content: string }) {
  const lobe = lobeId as LobeId;
  const LobeIcon = LOBE_ICONS[lobe] ?? Brain;
  const lobeColor = LOBE_COLORS[lobe] ?? 'var(--haven-text-3)';

  return (
    <div style={{ padding: '6px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--haven-text-4)', marginBottom: 4 }}>
        <LobeIcon size={12} style={{ color: lobeColor }} />
        <span style={{ color: lobeColor, fontFamily: 'var(--font-mono)' }}>
          {LOBE_AR[lobe] ?? 'HAVEN'}
        </span>
        <span className="thinking-dots" style={{ color: 'var(--haven-text-4)' }} />
      </div>
      <div style={{
        background: 'var(--haven-surface)',
        border: `1px solid ${lobeColor}22`,
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 13,
        lineHeight: 1.65,
        color: 'var(--haven-text-1)',
        minHeight: 36,
      }}>
        {content ? (
          <span>
            {content}
            <span className="streaming-cursor" />
          </span>
        ) : (
          <span style={{ color: 'var(--haven-text-4)' }}>
            <span className="thinking-dots" />
          </span>
        )}
      </div>
    </div>
  );
}

// ── Lobe Status Bar ───────────────────────────────────────────────────

function LobeStatusBar() {
  const ai = useAI();

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '6px 10px',
      borderBottom: '1px solid var(--haven-border)',
      background: 'var(--haven-void)',
    }}>
      {(['cognitive', 'executive', 'sensory'] as LobeId[]).map(lobe => {
        const LobeIcon = LOBE_ICONS[lobe];
        const color = LOBE_COLORS[lobe];
        const isActive = ai.streamingLobe === lobe;

        return (
          <div
            key={lobe}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 100,
              background: isActive ? `${color}15` : 'transparent',
              border: `1px solid ${isActive ? color : 'var(--haven-border)'}`,
              transition: 'all 0.15s',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <LobeIcon
              size={10}
              style={{
                color: isActive ? color : 'var(--haven-text-4)',
                animation: isActive ? 'pulse 1s ease-in-out infinite' : undefined,
              }}
            />
            <span style={{ color: isActive ? color : 'var(--haven-text-4)' }}>
              {LOBE_AR[lobe]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main AI Panel ─────────────────────────────────────────────────────

export default function AIPanel() {
  const { ai, setAI, clearConversation, appendStreamToken, finalizeStream, addNotification } = useHavenStore();
  const activeFile = useActiveFile();
  const [input, setInput] = useState('');
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (isScrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ai.conversation, ai.streamingContent, isScrolledToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    setIsScrolledToBottom(atBottom);
  }, []);

  // ── Send Message ──────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || ai.isGenerating) return;

    setInput('');
    setIsScrolledToBottom(true);

    // Add user turn
    const userTurn: ConversationTurn = {
      id: `turn-user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    setAI({
      isGenerating: true,
      conversation: [...ai.conversation, userTurn],
      streamingContent: '',
      streamingLobe: 'cognitive',
    });

    // NiyahEngine analysis
    const niyahSession = niyahEngine.process(trimmed, {
      activeFile: activeFile?.name,
      language: activeFile?.language,
    });
    setAI({ lastNiyahSession: niyahSession });

    // Stream through ThreeLobeAgent
    let fullContent = '';
    let finalModel: string | undefined;

    try {
      await threeLobeAgent.processMessage(
        trimmed,
        {
          activeFile: activeFile?.path,
          language: activeFile?.language,
          selectedText: undefined,
        },
        {
          onToken: (lobeId, token) => {
            fullContent += token;
            appendStreamToken(token);
            setAI({ streamingLobe: lobeId });
          },
          onLobeStart: (lobeId, model) => {
            setAI({ streamingLobe: lobeId });
            finalModel = model;
          },
          onError: (err) => {
            addNotification({ type: 'error', message: `خطأ في الذكاء الاصطناعي: ${err}` });
          },
        }
      );

      finalizeStream(fullContent, finalModel);
    } catch (err) {
      addNotification({ type: 'error', message: `فشل الإرسال: ${err}` });
      setAI({ isGenerating: false, streamingContent: '', streamingLobe: null });
    }
  }, [input, ai, setAI, appendStreamToken, finalizeStream, activeFile, addNotification]);

  const handleStop = useCallback(() => {
    threeLobeAgent.abort();
    if (ai.streamingContent) {
      finalizeStream(ai.streamingContent);
    } else {
      setAI({ isGenerating: false, streamingContent: '', streamingLobe: null });
    }
  }, [ai.streamingContent, finalizeStream, setAI]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  // ── Model Selector ────────────────────────────────────────────────

  const [showModelMenu, setShowModelMenu] = useState(false);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--haven-surface)',
      borderLeft: '1px solid var(--haven-border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--haven-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--haven-void)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={14} style={{ color: 'var(--haven-gold)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--haven-text-2)' }}>
            {t('ai.title')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Model selector */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn-ghost"
              onClick={() => setShowModelMenu(!showModelMenu)}
              style={{ fontSize: 11, padding: '3px 8px', gap: 4 }}
            >
              <span style={{ color: 'var(--haven-green)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {ai.activeModel?.split(':')[0] ?? t('ai.noModel')}
              </span>
              <ChevronDown size={10} />
            </button>

            {showModelMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'var(--haven-surface)',
                border: '1px solid var(--haven-border)',
                borderRadius: 6,
                minWidth: 200,
                zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                padding: 4,
              }}>
                {ai.models.length === 0 ? (
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--haven-text-4)' }}>
                    {t('ai.noModel')}
                  </div>
                ) : (
                  ai.models.map(m => (
                    <button
                      key={m.name}
                      onClick={() => {
                        setAI({ activeModel: m.name });
                        setShowModelMenu(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 12px',
                        background: ai.activeModel === m.name ? 'var(--haven-elevated)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 4,
                        fontSize: 12,
                        color: ai.activeModel === m.name ? 'var(--haven-gold)' : 'var(--haven-text-2)',
                        fontFamily: 'var(--font-mono)',
                        transition: 'background 0.1s',
                      }}
                    >
                      {m.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            className="btn-icon"
            title="مسح المحادثة"
            onClick={clearConversation}
            style={{ width: 24, height: 24 }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Lobe Status */}
      <LobeStatusBar />

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
        }}
      >
        {ai.conversation.length === 0 && !ai.isGenerating && (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--haven-text-4)',
          }}>
            <Brain size={28} style={{ color: 'var(--haven-gold-dim)', opacity: 0.4, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 12, marginBottom: 8, fontFamily: 'var(--font-arabic)' }}>
              اسألني أي سؤال بالعربية أو الإنجليزية
            </p>
            <p style={{ fontSize: 11, color: 'var(--haven-text-4)' }}>
              كل شيء يعمل محلياً • لا cloud • لا تتبع
            </p>
          </div>
        )}

        {/* Connected messages */}
        {ai.connectionStatus !== 'connected' && ai.conversation.length === 0 && (
          <div style={{
            margin: '12px 8px',
            padding: '10px 12px',
            borderRadius: 6,
            background: 'rgba(255,170,0,0.05)',
            border: '1px solid rgba(255,170,0,0.2)',
            fontSize: 12,
            color: 'var(--haven-warning)',
          }}>
            {ai.connectionStatus === 'connecting'
              ? t('ai.connecting')
              : `⚠ ${t('status.disconnected')} — تأكد من تشغيل Ollama`}
          </div>
        )}

        {ai.conversation.map(turn => (
          <MessageBubble key={turn.id} turn={turn} />
        ))}

        {ai.isGenerating && (
          <StreamingBubble
            lobeId={ai.streamingLobe ?? 'cognitive'}
            content={ai.streamingContent}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '8px',
        borderTop: '1px solid var(--haven-border)',
        background: 'var(--haven-void)',
      }}>
        {/* NiyahEngine info */}
        {ai.lastNiyahSession && (
          <div style={{
            display: 'flex',
            gap: 6,
            marginBottom: 6,
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--haven-text-4)',
              padding: '1px 6px',
              border: '1px solid var(--haven-border)',
              borderRadius: 100,
            }}>
              {ai.lastNiyahSession.vector.domain}
            </span>
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--haven-text-4)',
              padding: '1px 6px',
              border: '1px solid var(--haven-border)',
              borderRadius: 100,
            }}>
              {ai.lastNiyahSession.vector.dialect}
            </span>
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: ai.lastNiyahSession.vector.confidence > 0.7 ? 'var(--haven-green)' : 'var(--haven-text-4)',
              padding: '1px 6px',
              border: '1px solid var(--haven-border)',
              borderRadius: 100,
            }}>
              {Math.round(ai.lastNiyahSession.vector.confidence * 100)}%
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            className="haven-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              ai.connectionStatus === 'connected'
                ? t('ai.placeholder')
                : t('ai.connecting')
            }
            disabled={ai.connectionStatus !== 'connected'}
            rows={1}
            style={{
              resize: 'none',
              flex: 1,
              fontFamily: i18n.isRTL ? 'var(--font-arabic)' : 'var(--font-sans)',
              fontSize: 13,
              lineHeight: 1.5,
              minHeight: 36,
              maxHeight: 120,
              padding: '8px 12px',
            }}
          />

          {ai.isGenerating ? (
            <button
              className="btn-primary"
              onClick={handleStop}
              style={{ height: 36, padding: '0 12px', borderColor: 'var(--haven-error)', color: 'var(--haven-error)' }}
            >
              <Square size={13} />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={sendMessage}
              disabled={!input.trim() || ai.connectionStatus !== 'connected'}
              style={{
                height: 36,
                padding: '0 12px',
                opacity: !input.trim() || ai.connectionStatus !== 'connected' ? 0.4 : 1,
              }}
            >
              <Send size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Click-outside to close model menu */}
      {showModelMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowModelMenu(false)}
        />
      )}
    </div>
  );
}
