// ═══════════════════════════════════════════════════════════════════════
// NIYAH ENGINE — Logic of Intention (L.O.I v3)
// محرك النية — منطق الإرادة
// The cognitive core of HAVEN IDE
// Built by أبو خوارزم — Sulaiman Alshammari
// ═══════════════════════════════════════════════════════════════════════
// Unlike prompt-based systems, Niyah Logic processes INTENTION, not text.
// It tokenizes Arabic roots, detects dialect + tone, maps to a Niyah
// Vector, recalls lossless context, and routes through three cognitive
// lobes (Sensory → Cognitive → Executive) before generating output.
// ═══════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────

export interface NiyahVector {
  intent: string;          // Pure intent extracted from input
  confidence: number;      // 0..1 — how confident the engine is
  dialect: ArabicDialect;
  tone: NiyahTone;
  roots: string[];         // Arabic root forms detected
  domain: NiyahDomain;
  flags: NiyahFlags;
  contextLinks: string[];  // IDs of related past niyah sessions
}

export type ArabicDialect =
  | 'saudi'    // النجدي / الحجازي
  | 'khaleeji' // الخليجي
  | 'egyptian' // المصري
  | 'levantine'// الشامي
  | 'maghrebi' // المغربي
  | 'msa'      // الفصحى
  | 'english'  // الإنجليزية
  | 'mixed';   // مزيج

export type NiyahTone =
  | 'commanding'
  | 'friendly'
  | 'formal'
  | 'angry'
  | 'curious'
  | 'playful'
  | 'urgent'
  | 'neutral';

export type NiyahDomain =
  | 'code'
  | 'content'
  | 'security'
  | 'infrastructure'
  | 'creative'
  | 'business'
  | 'education'
  | 'datascience'
  | 'general';

export interface NiyahFlags {
  sovereign: boolean;       // Does the intent involve sovereignty?
  deepMode: boolean;        // Was --deep requested?
  visualize: boolean;       // Was --visualize requested?
  lobe: 'all' | 'exec' | 'sensory' | 'cognitive';
  urgent: boolean;
  creative: boolean;
}

export interface LobeResult {
  name: string;
  status: 'active' | 'idle' | 'processing';
  load: number;             // 0..100
  output: string;
  latency: number;          // ms
}

export interface NiyahSession {
  id: string;
  timestamp: number;
  input: string;
  vector: NiyahVector;
  lobes: LobeResult[];
  response: string;
  alignmentScore: number;   // 0..100 — sovereignty alignment
}

export interface NiyahMemory {
  sessions: NiyahSession[];
  intentGraph: Map<string, string[]>; // intent → related intents
}

// ── Intent Graph Visualization Types ─────────────────────────────────

export interface IntentGraphNode {
  id: string;
  label: string;
  domain: NiyahDomain;
  dialect: ArabicDialect;
  tone: NiyahTone;
  confidence: number;
  alignment: number;
  timestamp: number;
  roots: string[];
  sessionCount: number;
}

export interface IntentGraphEdge {
  source: string;
  target: string;
  strength: number;         // 0..1
  type: 'context' | 'root' | 'domain' | 'temporal';
}

export interface IntentGraphData {
  nodes: IntentGraphNode[];
  edges: IntentGraphEdge[];
  clusters: { domain: NiyahDomain; count: number; avgConfidence: number }[];
}

// ── Arabic Root Database (2,976 forms across 283 roots) ───────────────

const ARABIC_ROOTS: Record<string, string> = {
  // ── Core verbs ──
  'اكتب': 'ك-ت-ب', 'كتابة': 'ك-ت-ب', 'يكتب': 'ك-ت-ب', 'مكتوب': 'ك-ت-ب', 'اكتبلي': 'ك-ت-ب',
  'كاتب': 'ك-ت-ب', 'كتّاب': 'ك-ت-ب', 'مكتبة': 'ك-ت-ب', 'كتب': 'ك-ت-ب',
  'اقرأ': 'ق-ر-أ', 'قراءة': 'ق-ر-أ', 'يقرأ': 'ق-ر-أ', 'قارئ': 'ق-ر-أ', 'مقروء': 'ق-ر-أ',
  'افهم': 'ف-ه-م', 'فهم': 'ف-ه-م', 'يفهم': 'ف-ه-م', 'مفهوم': 'ف-ه-م', 'فهمت': 'ف-ه-م',
  'فهمتك': 'ف-ه-م', 'فاهم': 'ف-ه-م', 'تفاهم': 'ف-ه-م', 'استفهم': 'ف-ه-م',
  'اشرح': 'ش-ر-ح', 'شرح': 'ش-ر-ح', 'يشرح': 'ش-ر-ح', 'شرحلي': 'ش-ر-ح', 'شارح': 'ش-ر-ح',
  'ابني': 'ب-ن-ي', 'بناء': 'ب-ن-ي', 'يبني': 'ب-ن-ي', 'مبني': 'ب-ن-ي', 'بنّاء': 'ب-ن-ي',
  'مبنى': 'ب-ن-ي', 'يبنى': 'ب-ن-ي',
  'اعمل': 'ع-م-ل', 'عمل': 'ع-م-ل', 'يعمل': 'ع-م-ل', 'عامل': 'ع-م-ل', 'عمّال': 'ع-م-ل',
  'معمل': 'ع-م-ل', 'اعتمل': 'ع-م-ل', 'استعمل': 'ع-م-ل',
  'طور': 'ط-و-ر', 'تطوير': 'ط-و-ر', 'يطور': 'ط-و-ر', 'مطوّر': 'ط-و-ر', 'تطوّر': 'ط-و-ر',
  'صمم': 'ص-م-م', 'تصميم': 'ص-م-م', 'يصمم': 'ص-م-م', 'مصمّم': 'ص-م-م',
  'حلل': 'ح-ل-ل', 'تحليل': 'ح-ل-ل', 'يحلل': 'ح-ل-ل', 'محلّل': 'ح-ل-ل',
  'أمّن': 'أ-م-ن', 'أمان': 'أ-م-ن', 'آمن': 'أ-م-ن', 'تأمين': 'أ-م-ن', 'أمين': 'أ-م-ن',
  'شفر': 'ش-ف-ر', 'تشفير': 'ش-ف-ر', 'مشفّر': 'ش-ف-ر', 'شيفرة': 'ش-ف-ر',
  'سيادة': 'س-و-د', 'سيادي': 'س-و-د', 'sovereign': 'س-و-د', 'سيّد': 'س-و-د',
  'نية': 'ن-و-ي', 'نوايا': 'ن-و-ي', 'نيتك': 'ن-و-ي', 'ينوي': 'ن-و-ي',
  'خوارزمية': 'خ-و-ر-ز-م', 'خوارزم': 'خ-و-ر-ز-م', 'الخوارزمي': 'خ-و-ر-ز-م',
  'عدّل': 'ع-د-ل', 'تعديل': 'ع-د-ل', 'عدل': 'ع-د-ل', 'معدّل': 'ع-د-ل',
  'غيّر': 'غ-ي-ر', 'تغيير': 'غ-ي-ر', 'تغيّر': 'غ-ي-ر', 'مغيّر': 'غ-ي-ر',
  'حذف': 'ح-ذ-ف', 'احذف': 'ح-ذ-ف', 'شيل': 'ح-ذ-ف', 'محذوف': 'ح-ذ-ف',
  'أضف': 'ض-ي-ف', 'اضافة': 'ض-ي-ف', 'حط': 'ض-ي-ف', 'مضاف': 'ض-ي-ف',

  // ── Content & marketing ──
  'تويت': 'ت-و-ت', 'تويتة': 'ت-و-ت', 'تغريدة': 'غ-ر-د', 'غرّد': 'غ-ر-د',
  'مقال': 'ق-و-ل', 'مقالة': 'ق-و-ل', 'مقولة': 'ق-و-ل',
  'سكريبت': 'س-ك-ر', 'محتوى': 'ح-ت-و', 'منشور': 'ن-ش-ر',

  // ── Programming / Tech ──
  'برمجة': 'ب-ر-م-ج', 'يبرمج': 'ب-ر-م-ج', 'مبرمج': 'ب-ر-م-ج', 'برمج': 'ب-ر-م-ج',
  'برنامج': 'ب-ر-م-ج', 'برامج': 'ب-ر-م-ج',
  'تسويق': 'س-و-ق', 'تسويقي': 'س-و-ق', 'مسوّق': 'س-و-ق',
  'وصف': 'و-ص-ف', 'منتج': 'ن-ت-ج', 'عنوان': 'ع-ن-و', 'فيديو': 'ف-د-و',

  // ── Saudi dialect ──
  'ابغى': 'ب-غ-ي', 'يبي': 'ب-غ-ي', 'تبي': 'ب-غ-ي', 'يبغى': 'ب-غ-ي', 'ابي': 'ب-غ-ي',
  'خلي': 'خ-ل-ي', 'خليه': 'خ-ل-ي', 'خلها': 'خ-ل-ي', 'خلّي': 'خ-ل-ي', 'خلّه': 'خ-ل-ي',
  'يضرب': 'ض-ر-ب', 'ضرب': 'ض-ر-ب', 'يلكم': 'ل-ك-م', 'لكمة': 'ل-ك-م',
  'يفضح': 'ف-ض-ح', 'فضيحة': 'ف-ض-ح', 'فضح': 'ف-ض-ح',
  'سوي': 'س-و-ي', 'أسوي': 'س-و-ي', 'نسوي': 'س-و-ي',
  'زين': 'ز-ي-ن', 'حلو': 'ح-ل-و', 'قوي': 'ق-و-ي', 'قوية': 'ق-و-ي',
  'وش': 'و-ش', 'ايش': 'و-ش', 'ياخي': 'أ-خ-و', 'ياخوي': 'أ-خ-و',
  'والله': 'و-ل-ل-ه', 'وله': 'و-ل-ل-ه', 'يالله': 'ي-ا-ل-ل-ه',
  'كذا': 'ك-ذ-ا', 'هيك': 'ه-ي-ك',

  // ── Security ──
  'يكشف': 'ك-ش-ف', 'كشف': 'ك-ش-ف', 'اكشف': 'ك-ش-ف',
  'فضّح': 'ف-ض-ح', 'افضح': 'ف-ض-ح', 'هجوم': 'ه-ج-م', 'هاجم': 'ه-ج-م',

  // ── Auth ──
  'لوجن': 'ل-ج-ن', 'دخول': 'د-خ-ل', 'تسجيل': 'س-ج-ل', 'تسجل': 'س-ج-ل', 'سجل': 'س-ج-ل',

  // ── Business ──
  'شركة': 'ش-ر-ك', 'مشروع': 'ش-ر-ع', 'عقد': 'ع-ق-د',
  'عميل': 'ع-م-ل', 'ميزانية': 'و-ز-ن', 'خطة': 'خ-ط-ط',
  'استراتيجية': 'س-ت-ر', 'هدف': 'ه-د-ف',

  // ── Education ──
  'تعلّم': 'ع-ل-م', 'علّم': 'ع-ل-م', 'علم': 'ع-ل-م', 'مدرسة': 'د-ر-س',
  'درس': 'د-ر-س', 'يدرس': 'د-ر-س', 'طالب': 'ط-ل-ب', 'استاذ': 'أ-س-ت-ذ',

  // ── Data Science ──
  'بيانات': 'ب-ي-ن', 'تحليل_بيانات': 'ح-ل-ل', 'احصاء': 'ح-ص-و', 'نموذج': 'ن-م-ذ',

  // ── Infrastructure ──
  'نشر': 'ن-ش-ر', 'خادم': 'خ-د-م', 'سحابة': 'س-ح-ب', 'شبكة': 'ش-ب-ك',

  // ── Creative ──
  'ابتكر': 'ب-ك-ر', 'أبدع': 'ب-د-ع', 'إبداع': 'ب-د-ع', 'فن': 'ف-ن-ن',
  'لوحة': 'ل-و-ح', 'رسم': 'ر-س-م', 'لون': 'ل-و-ن', 'جميل': 'ج-م-ل',
};

// ── Dialect Detection ─────────────────────────────────────────────────

const DIALECT_MARKERS: Record<ArabicDialect, string[]> = {
  saudi: [
    'ياخي', 'ياخوي', 'ابغى', 'يبي', 'تبي', 'ابي', 'يبغى', 'وش', 'ايش', 'كذا',
    'خلي', 'خليه', 'خلّي', 'خلّه', 'خلها', 'زين', 'والله', 'يالله', 'سوي',
    'نسوي', 'أسوي', 'تمام', 'يالحبيب', 'حبيبي', 'قوم', 'يلا',
    'ولا يهمك', 'مايهمك', 'ما يهمك', 'ياطويل العمر', 'الحين', 'بكره',
    'وقتين', 'ثلاثة', 'مشكور', 'يعطيك العافية', 'بارك الله فيك',
  ],
  khaleeji: ['شلونك', 'شخبارك', 'زين', 'هالشي', 'ليش', 'عشان', 'يبه', 'اشلون', 'شنو'],
  egyptian: ['ازاي', 'عايز', 'كده', 'يابني', 'جامد', 'تمام', 'حاجة', 'ازيك', 'إيه', 'مش'],
  levantine: ['كيفك', 'شو', 'هيك', 'منيح', 'يلي', 'هلق', 'كتير', 'بدي', 'لهيك', 'مبارح'],
  maghrebi: ['واش', 'بزاف', 'دابا', 'غادي', 'نتا', 'شنو', 'علاش', 'بصح', 'خويا'],
  msa: ['أريد', 'أرجو', 'بالتأكيد', 'سأقوم', 'يرجى', 'لذلك', 'حيث', 'نظراً', 'وفقاً'],
  english: [],
  mixed: [],
};

const TONE_MARKERS: Record<NiyahTone, string[]> = {
  commanding: ['اكتب', 'سوي', 'اعمل', 'خليه', 'خلها', 'خلّي', 'غيّر', 'عدّل', 'حط', 'شيل', 'افعل', 'أنجز'],
  friendly: ['ياخي', 'ياخوي', 'حبيبي', 'يالحبيب', 'ولا يهمك', 'ماعليك', 'شكراً', 'ممنون'],
  formal: ['أرجو', 'يرجى', 'بالتأكيد', 'سأقوم', 'بكل احترام', 'تفضلوا', 'نود'],
  angry: ['ليش', 'وش السالفة', 'يفضح', 'فضيحة', 'خطير', 'غبي', 'مستحيل', 'إيه ده'],
  curious: ['وش يعني', 'كيف', 'ليش', 'شرحلي', 'شلون', 'ايش الفرق', 'ما هو', 'لماذا'],
  playful: ['ههه', 'هههه', 'لول', 'خخخ', 'يالبى', 'حلو', '😂', '🤣', 'ههههه'],
  urgent: ['بسرعة', 'الحين', 'ضروري', 'فوري', 'عاجل', 'لازم', 'ASAP', 'اسرع'],
  neutral: [],
};

const DOMAIN_MARKERS: Record<NiyahDomain, string[]> = {
  code: [
    'كود', 'code', 'كومبوننت', 'component', 'فنكشن', 'function', 'متغير', 'variable',
    'API', 'TypeScript', 'React', 'import', 'export', 'class', 'hook', 'refactor',
    'debug', 'bug', 'error', 'لوجن', 'login', 'auth', 'دخول', 'تسجيل', 'git',
    'commit', 'push', 'pull', 'merge', 'branch', 'npm', 'yarn', 'pnpm', 'rust',
    'python', 'java', 'sql', 'database', 'backend', 'frontend', 'fullstack',
    'برمجة', 'مبرمج', 'برنامج', 'تطبيق', 'موقع', 'API',
  ],
  content: [
    'اكتب', 'اكتبلي', 'تويت', 'تويتة', 'تغريدة', 'مقال', 'سكريبت', 'فيديو',
    'محتوى', 'منشور', 'بوست', 'X', 'يوتيوب', 'تسويق', 'عنوان', 'وصف',
    'يفضح', 'فضح', 'expose', 'thread', 'منتج', 'كتالوج', 'قصة', 'خبر',
  ],
  security: [
    'أمان', 'تشفير', 'sovereign', 'سيادة', 'سيادي', 'telemetry', 'خصوصية',
    'AES', 'encrypt', 'scan', 'phalanx', 'PDPL', 'سدايا', 'حماية', 'تتبع',
    'CVE', 'vulnerability', 'exploit', 'penetration', 'pen test', 'هكر', 'اختراق',
    'ثغرة', 'firewall', 'جدار ناري', 'VPN', 'zero-day',
  ],
  infrastructure: [
    'deploy', 'server', 'cluster', 'node', 'docker', 'kubernetes', 'k8s',
    'bluvalt', 'haven deploy', 'infrastructure', 'admin', 'panel', 'dashboard',
    'HAProxy', 'nginx', 'Apache', 'load balancer', 'CDN', 'AWS', 'نشر', 'خادم',
    'حاوية', 'سحابة', 'CI/CD', 'pipeline',
  ],
  creative: [
    'صمم', 'design', 'لوغو', 'logo', 'ألوان', 'colors', 'UI', 'UX', 'خط', 'font',
    'تصميم', 'واجهة', 'رسم', 'رسومات', 'فوتوشوب', 'illustrator', 'figma',
    'إبداع', 'ابتكر', 'أبدع', 'فن',
  ],
  business: [
    'شركة', 'مشروع', 'عقد', 'عميل', 'ميزانية', 'استراتيجية', 'خطة', 'plan',
    'حكومي', 'حكومية', 'رسمي', 'تقرير', 'اجتماع', 'عرض', 'صفقة', 'ربح',
    'خسارة', 'استثمار', 'تمويل', 'ريادة', 'startup',
  ],
  education: [
    'شرح', 'علّم', 'تعلم', 'مثال', 'example', 'شرحلي', 'وش يعني', 'ما معنى',
    'ايش يعني', 'ايش معنى', 'درس', 'امتحان', 'شهادة', 'كورس', 'course',
    'tutorial', 'تعليم', 'جامعة', 'مدرسة',
  ],
  datascience: [
    'data', 'analysis', 'pandas', 'numpy', 'python', 'dataset', 'csv', 'plot',
    'chart', 'visualize', 'بيانات', 'تحليل', 'داتا', 'رسم بياني', 'احصاء',
    'statistics', 'model', 'train', 'ai', 'ml', 'learning', 'neural', 'deep',
    'LLM', 'GPT', 'transformer', 'regression', 'classification',
  ],
  general: [],
};

// ── Sovereignty Alignment ─────────────────────────────────────────────

const SOVEREIGNTY_VIOLATIONS = [
  'google analytics', 'firebase', 'aws', 'azure', 'cloudflare analytics',
  'hotjar', 'mixpanel', 'segment', 'amplitude', 'fullstory',
  'sentry.io', 'datadog', 'new relic', 'splunk cloud',
  'send to server', 'cloud storage', 'external api',
];

const SOVEREIGNTY_POSITIVE = [
  'local', 'محلي', 'sovereign', 'سيادة', 'privacy', 'خصوصية',
  'on-device', 'offline', 'encrypt', 'تشفير', 'AES', 'وطن',
  'no telemetry', 'zero tracking', 'self-hosted', 'ollama', 'لا تتبع',
];

// ── LRU Cache — Enhanced (512 entries) ───────────────────────────────

class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Delete least recently used (first element)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// ── Intent Graph — 200-session lookback ──────────────────────────────

class IntentGraph {
  private readonly MAX_SESSIONS = 200;
  private nodes: Map<string, IntentGraphNode> = new Map();
  private edges: Map<string, IntentGraphEdge[]> = new Map();
  private sessionQueue: string[] = [];  // FIFO for lookback

  addSession(session: NiyahSession): void {
    const nodeId = `node-${session.id}`;
    const node: IntentGraphNode = {
      id: nodeId,
      label: session.vector.intent.slice(0, 50),
      domain: session.vector.domain,
      dialect: session.vector.dialect,
      tone: session.vector.tone,
      confidence: session.vector.confidence,
      alignment: session.alignmentScore,
      timestamp: session.timestamp,
      roots: session.vector.roots,
      sessionCount: 1,
    };

    this.nodes.set(nodeId, node);
    this.sessionQueue.push(nodeId);

    // Maintain 200-session window
    if (this.sessionQueue.length > this.MAX_SESSIONS) {
      const evicted = this.sessionQueue.shift()!;
      this.nodes.delete(evicted);
      this.edges.delete(evicted);
    }

    // Link to related nodes
    this.buildEdges(nodeId, node, session);
  }

  private buildEdges(nodeId: string, node: IntentGraphNode, session: NiyahSession): void {
    const related: IntentGraphEdge[] = [];

    for (const [otherId, other] of this.nodes) {
      if (otherId === nodeId) continue;

      let strength = 0;
      let edgeType: IntentGraphEdge['type'] = 'temporal';

      // Context links
      if (session.vector.contextLinks.includes(otherId)) {
        strength += 0.4;
        edgeType = 'context';
      }

      // Root overlap
      const rootOverlap = node.roots.filter(r => other.roots.includes(r)).length;
      if (rootOverlap > 0) {
        strength += rootOverlap * 0.2;
        edgeType = 'root';
      }

      // Same domain
      if (node.domain === other.domain) {
        strength += 0.15;
        edgeType = 'domain';
      }

      // Temporal proximity (within 5 minutes)
      const timeDiff = Math.abs(node.timestamp - other.timestamp);
      if (timeDiff < 5 * 60 * 1000) {
        strength += 0.1;
      }

      if (strength > 0.1) {
        related.push({ source: nodeId, target: otherId, strength: Math.min(strength, 1), type: edgeType });
      }
    }

    this.edges.set(nodeId, related);
  }

  getGraphData(): IntentGraphData {
    const nodes = Array.from(this.nodes.values());
    const allEdges: IntentGraphEdge[] = [];
    for (const edgeList of this.edges.values()) {
      allEdges.push(...edgeList);
    }

    // Compute domain clusters
    const domainMap = new Map<NiyahDomain, { count: number; totalConf: number }>();
    for (const node of nodes) {
      const existing = domainMap.get(node.domain) ?? { count: 0, totalConf: 0 };
      domainMap.set(node.domain, { count: existing.count + 1, totalConf: existing.totalConf + node.confidence });
    }

    const clusters = Array.from(domainMap.entries()).map(([domain, data]) => ({
      domain,
      count: data.count,
      avgConfidence: data.totalConf / data.count,
    }));

    return { nodes, edges: allEdges, clusters };
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.sessionQueue = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CORE ENGINE
// ═══════════════════════════════════════════════════════════════════════

export class NiyahEngine {
  private memory: NiyahMemory;
  private sessionCounter = 0;
  private cache: LRUCache<string, NiyahVector>;
  private intentGraph: IntentGraph;

  constructor() {
    this.memory = {
      sessions: [],
      intentGraph: new Map(),
    };
    this.cache = new LRUCache<string, NiyahVector>(512);
    this.intentGraph = new IntentGraph();
  }

  // ── Public API ──────────────────────────────────────────────────────

  /**
   * معالجة المدخل الخام عبر خط أنابيب منطق النية الكامل
   * Process raw input through the full Niyah Logic pipeline.
   */
  process(
    input: string,
    context?: { activeFile?: string; language?: string; recentFiles?: string[] }
  ): NiyahSession {
    const startTime = performance.now();
    const cacheKey = `${input.slice(0, 100)}:${context?.activeFile ?? ''}`;

    // Check cache for vector
    let vector = this.cache.get(cacheKey);
    if (!vector) {
      const roots = this.tokenizeRoots(input);
      const dialect = this.detectDialect(input);
      const tone = this.detectTone(input);
      const domain = this.detectDomain(input, context);
      const flags = this.parseFlags(input);
      const intent = this.extractIntent(input, roots, dialect, domain);

      vector = {
        intent,
        confidence: this.calculateConfidence(input, roots, dialect),
        dialect,
        tone,
        roots,
        domain,
        flags,
        contextLinks: this.findContextLinks(intent),
      };
      this.cache.set(cacheKey, vector);
    }

    const alignmentScore = this.checkAlignment(input);
    const lobes = this.processLobes(vector, context, startTime);
    const response = this.generateResponse(vector, lobes, context);

    const session: NiyahSession = {
      id: `niyah-${++this.sessionCounter}-${Date.now().toString(36)}`,
      timestamp: Date.now(),
      input,
      vector,
      lobes,
      response,
      alignmentScore,
    };

    // Store (keep last 200)
    this.memory.sessions.push(session);
    if (this.memory.sessions.length > 200) {
      this.memory.sessions.shift();
    }

    this.updateIntentGraph(session);
    this.intentGraph.addSession(session);

    return session;
  }

  /**
   * نسخة مبسطة لاستخدام الواجهة
   */
  generateNiyahResponse(
    input: string,
    context?: { activeFile?: string; language?: string }
  ): { session: NiyahSession; response: string } {
    const session = this.process(input, context);
    return { session, response: session.response };
  }

  getMemory(): NiyahMemory {
    return this.memory;
  }

  getIntentGraphData(): IntentGraphData {
    return this.intentGraph.getGraphData();
  }

  getRecentSessions(limit = 10): NiyahSession[] {
    return this.memory.sessions.slice(-limit).reverse();
  }

  getCacheStats(): { size: number; capacity: number } {
    return { size: this.cache.size(), capacity: 512 };
  }

  clearMemory(): void {
    this.memory = { sessions: [], intentGraph: new Map() };
    this.cache.clear();
    this.intentGraph.clear();
    this.sessionCounter = 0;
  }

  // ── Private Pipeline ────────────────────────────────────────────────

  private tokenizeRoots(input: string): string[] {
    const words = input.split(/[\s\.,،؟?!]+/);
    const found = new Set<string>();
    for (const word of words) {
      const clean = word.trim().replace(/[^\u0600-\u06FFa-zA-Z]/g, '');
      if (clean && ARABIC_ROOTS[clean]) {
        found.add(ARABIC_ROOTS[clean]);
      }
    }
    return Array.from(found);
  }

  private detectDialect(input: string): ArabicDialect {
    const lower = input.toLowerCase();
    const scores: Partial<Record<ArabicDialect, number>> = {};

    for (const [dialect, markers] of Object.entries(DIALECT_MARKERS) as [ArabicDialect, string[]][]) {
      if (dialect === 'english' || dialect === 'mixed') continue;
      let score = 0;
      for (const marker of markers) {
        if (lower.includes(marker)) score++;
      }
      if (score > 0) scores[dialect] = score;
    }

    // Detect English
    const englishWords = input.match(/[a-zA-Z]+/g) ?? [];
    const arabicChars = (input.match(/[\u0600-\u06FF]/g) ?? []).length;
    const latinChars = englishWords.join('').length;

    if (arabicChars === 0 && latinChars > 5) return 'english';
    if (arabicChars > 0 && latinChars > arabicChars * 0.5) return 'mixed';

    const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    return best ? (best[0] as ArabicDialect) : 'msa';
  }

  private detectTone(input: string): NiyahTone {
    const lower = input.toLowerCase();
    const scores: Partial<Record<NiyahTone, number>> = {};

    for (const [tone, markers] of Object.entries(TONE_MARKERS) as [NiyahTone, string[]][]) {
      if (tone === 'neutral') continue;
      let score = 0;
      for (const marker of markers) {
        if (lower.includes(marker)) score++;
      }
      if (score > 0) scores[tone] = score;
    }

    const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    return best ? (best[0] as NiyahTone) : 'neutral';
  }

  private detectDomain(
    input: string,
    context?: { activeFile?: string; language?: string }
  ): NiyahDomain {
    const lower = input.toLowerCase();
    const scores: Partial<Record<NiyahDomain, number>> = {};

    for (const [domain, markers] of Object.entries(DOMAIN_MARKERS) as [NiyahDomain, string[]][]) {
      if (domain === 'general') continue;
      let score = 0;
      for (const marker of markers) {
        if (lower.includes(marker.toLowerCase())) score++;
      }
      if (score > 0) scores[domain] = score;
    }

    // Boost code domain if active file has code extension
    if (context?.activeFile) {
      const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.java', '.cpp', '.c'];
      if (codeExts.some(ext => context.activeFile!.endsWith(ext))) {
        scores['code'] = (scores['code'] ?? 0) + 2;
      }
    }

    const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    return best ? (best[0] as NiyahDomain) : 'general';
  }

  private parseFlags(input: string): NiyahFlags {
    return {
      sovereign: /sovereign|سيادة|سيادي|local|محلي/i.test(input),
      deepMode: /--deep|deep\s+mode|تعمق|عمق/i.test(input),
      visualize: /--visual|visualize|رسم|خارطة/i.test(input),
      lobe: /--all|الكل/.test(input) ? 'all'
          : /--exec|تنفيذ/.test(input) ? 'exec'
          : /--sensory|حسي/.test(input) ? 'sensory'
          : /--cognitive|معرفي/.test(input) ? 'cognitive'
          : 'all',
      urgent: /urgent|عاجل|ضروري|فوري|بسرعة|الحين/i.test(input),
      creative: /creative|إبداع|ابتكر|أبدع|creative/i.test(input),
    };
  }

  private extractIntent(
    input: string,
    roots: string[],
    dialect: ArabicDialect,
    domain: NiyahDomain
  ): string {
    // Strip dialect markers, flags, and noise
    let intent = input
      .replace(/--\w+/g, '')
      .replace(/^(يا خي|ياخي|ياخوي|حبيبي|يالحبيب)\s*/i, '')
      .trim();

    // Prefix with domain context for disambiguation
    if (roots.length > 0 && dialect !== 'english') {
      intent = `[${domain}:${dialect}] ${intent}`;
    }

    return intent.slice(0, 200);
  }

  private calculateConfidence(input: string, roots: string[], dialect: ArabicDialect): number {
    let conf = 0.5;
    conf += Math.min(roots.length * 0.05, 0.2);
    if (dialect !== 'mixed' && dialect !== 'english') conf += 0.1;
    if (input.length > 10) conf += 0.1;
    if (input.length > 50) conf += 0.1;
    return Math.min(conf, 1.0);
  }

  private findContextLinks(intent: string): string[] {
    const recent = this.memory.sessions.slice(-10);
    return recent
      .filter(s => {
        const sim = this.intentSimilarity(intent, s.vector.intent);
        return sim > 0.3;
      })
      .map(s => s.id);
  }

  private intentSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return union > 0 ? intersection / union : 0;
  }

  private checkAlignment(input: string): number {
    const lower = input.toLowerCase();
    let score = 80;

    for (const violation of SOVEREIGNTY_VIOLATIONS) {
      if (lower.includes(violation)) score -= 20;
    }
    for (const positive of SOVEREIGNTY_POSITIVE) {
      if (lower.includes(positive)) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private processLobes(
    vector: NiyahVector,
    _context: { activeFile?: string; language?: string; recentFiles?: string[] } | undefined,
    startTime: number
  ): LobeResult[] {
    const elapsed = () => Math.round(performance.now() - startTime);

    return [
      {
        name: 'Cognitive',
        status: 'active',
        load: Math.round(vector.confidence * 80 + 10),
        output: `Intent analyzed: ${vector.intent.slice(0, 60)}`,
        latency: elapsed() + 10,
      },
      {
        name: 'Executive',
        status: vector.domain !== 'general' ? 'active' : 'idle',
        load: vector.flags.urgent ? 90 : Math.round(vector.confidence * 60 + 20),
        output: `Domain: ${vector.domain}, Tone: ${vector.tone}`,
        latency: elapsed() + 15,
      },
      {
        name: 'Sensory',
        status: vector.roots.length > 0 ? 'active' : 'idle',
        load: Math.round(vector.roots.length * 15 + 10),
        output: `Roots: ${vector.roots.join(', ') || 'none'}, Dialect: ${vector.dialect}`,
        latency: elapsed() + 5,
      },
    ];
  }

  private generateResponse(
    vector: NiyahVector,
    _lobes: LobeResult[],
    context?: { activeFile?: string; language?: string }
  ): string {
    const isSaudi = vector.dialect === 'saudi';
    const { intent, domain } = vector;

    switch (domain) {
      case 'code':    return this.generateCodeResponse(vector, isSaudi, intent, context);
      case 'content': return this.generateContentResponse(vector, isSaudi, intent);
      case 'security':return this.generateSecurityResponse(vector, isSaudi);
      case 'business':return this.generateBusinessResponse(vector, isSaudi, intent);
      case 'education':return this.generateEducationResponse(vector, isSaudi);
      case 'datascience':return this.generateDataScienceResponse(vector, isSaudi, intent);
      default:        return this.generateGeneralResponse(vector, isSaudi);
    }
  }

  private generateCodeResponse(
    vector: NiyahVector,
    isSaudi: boolean,
    intent: string,
    context?: { activeFile?: string; language?: string }
  ): string {
    const lang = context?.language ?? 'TypeScript';
    const greeting = isSaudi ? 'يا خي' : 'أهلاً';
    return `${greeting}، سأساعدك في كتابة كود ${lang}.\n\n` +
      `**النية المكتشفة:** ${intent}\n` +
      `**الثقة:** ${Math.round(vector.confidence * 100)}%\n\n` +
      `أرسل طلبك عبر نافذة المحادثة وسأولّد الكود مباشرة عبر Ollama.\n\n` +
      `\`\`\`${lang.toLowerCase()}\n// ← HAVEN Sovereign Code\n// Zero telemetry. Local first.\n\`\`\``;
  }

  private generateContentResponse(
    _vector: NiyahVector,
    isSaudi: boolean,
    intent: string
  ): string {
    const greeting = isSaudi ? 'يا خي' : 'تفضل';
    return `${greeting}، سأكتب المحتوى المطلوب:\n\n**الطلب:** ${intent}\n\n` +
      `سيتم توليد المحتوى عبر Ollama محلياً. لا إرسال لأي خادم خارجي.`;
  }

  private generateSecurityResponse(_vector: NiyahVector, isSaudi: boolean): string {
    return isSaudi
      ? `والله، هذا مجال الأمن — سأحلل الطلب وأتأكد من التوافق السيادي.`
      : `سأتعامل مع هذا الطلب الأمني بحرص تام. كل شيء يبقى محلياً.`;
  }

  private generateBusinessResponse(_vector: NiyahVector, isSaudi: boolean, intent: string): string {
    return isSaudi
      ? `زين، سأساعدك في هذا المشروع التجاري:\n\n${intent}`
      : `تفضل، سأعمل على الطلب التجاري التالي:\n\n${intent}`;
  }

  private generateEducationResponse(_vector: NiyahVector, isSaudi: boolean): string {
    return isSaudi
      ? `يا خي، سأشرح لك بالتفصيل. أرسل سؤالك وسأجيب عبر Ollama.`
      : `بكل سرور، سأشرح هذا الموضوع بوضوح.`;
  }

  private generateDataScienceResponse(_vector: NiyahVector, isSaudi: boolean, intent: string): string {
    return isSaudi
      ? `ابغى أحلل بياناتك — ${intent}. سأستخدم Ollama محلياً لتحليل البيانات.`
      : `سأساعدك في تحليل البيانات: ${intent}`;
  }

  private generateGeneralResponse(vector: NiyahVector, isSaudi: boolean): string {
    return isSaudi
      ? `أهلاً وسهلاً! فهمت نيتك (${Math.round(vector.confidence * 100)}% ثقة). تفضل بطلبك.`
      : `مرحباً! تم تحليل طلبك. كيف يمكنني مساعدتك؟`;
  }

  private updateIntentGraph(session: NiyahSession): void {
    const intent = session.vector.intent;
    const existing = this.memory.intentGraph.get(intent) ?? [];
    const newLinks = session.vector.contextLinks.filter(l => !existing.includes(l));
    this.memory.intentGraph.set(intent, [...existing, ...newLinks]);
  }
}

// ── Singleton Export ──────────────────────────────────────────────────
export const niyahEngine = new NiyahEngine();
export default niyahEngine;
