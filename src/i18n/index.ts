// ═══════════════════════════════════════════════════════════════════════
// HAVEN i18n — 10-Language System
// نظام التعريب العشر لغات
// Arabic-first, but welcoming all.
// ═══════════════════════════════════════════════════════════════════════

export type Language = 'ar' | 'en' | 'fr' | 'es' | 'ja' | 'de' | 'zh' | 'ko' | 'tr' | 'hi';

export type TranslationKey =
  // App
  | 'app.name'
  | 'app.tagline'
  | 'app.version'
  // Status
  | 'status.connecting'
  | 'status.connected'
  | 'status.disconnected'
  | 'status.error'
  // Sidebar
  | 'sidebar.explorer'
  | 'sidebar.search'
  | 'sidebar.git'
  | 'sidebar.extensions'
  | 'sidebar.settings'
  // Editor
  | 'editor.untitled'
  | 'editor.save'
  | 'editor.saveAll'
  | 'editor.close'
  | 'editor.format'
  // AI Panel
  | 'ai.title'
  | 'ai.placeholder'
  | 'ai.send'
  | 'ai.stop'
  | 'ai.clear'
  | 'ai.thinking'
  | 'ai.noModel'
  | 'ai.connecting'
  | 'ai.lobe.cognitive'
  | 'ai.lobe.executive'
  | 'ai.lobe.sensory'
  // Terminal
  | 'terminal.title'
  | 'terminal.new'
  | 'terminal.clear'
  | 'terminal.kill'
  // Models
  | 'models.title'
  | 'models.none'
  | 'models.pull'
  | 'models.delete'
  | 'models.active'
  // Settings
  | 'settings.title'
  | 'settings.language'
  | 'settings.theme'
  | 'settings.ollamaHost'
  | 'settings.fontFamily'
  | 'settings.fontSize'
  // Actions
  | 'action.ok'
  | 'action.cancel'
  | 'action.confirm'
  | 'action.delete'
  | 'action.save'
  | 'action.close'
  // File operations
  | 'file.new'
  | 'file.open'
  | 'file.save'
  | 'file.rename'
  | 'file.delete'
  | 'file.copy'
  | 'file.paste'
  | 'file.newFolder'
  // Sovereignty
  | 'sovereignty.title'
  | 'sovereignty.score'
  | 'sovereignty.local'
  | 'sovereignty.telemetry'
  // Intent
  | 'intent.title'
  | 'intent.domain'
  | 'intent.dialect'
  | 'intent.confidence'
  | 'intent.roots';

type Translations = Record<TranslationKey, string>;

// ── Arabic (العربية) ──────────────────────────────────────────────────
const AR: Translations = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               'بيئة التطوير السيادية',
  'app.version':               'الإصدار',
  'status.connecting':         'جارٍ الاتصال…',
  'status.connected':          'متصل',
  'status.disconnected':       'غير متصل',
  'status.error':              'خطأ في الاتصال',
  'sidebar.explorer':          'المستكشف',
  'sidebar.search':            'البحث',
  'sidebar.git':               'Git',
  'sidebar.extensions':        'الإضافات',
  'sidebar.settings':          'الإعدادات',
  'editor.untitled':           'بدون عنوان',
  'editor.save':               'حفظ',
  'editor.saveAll':            'حفظ الكل',
  'editor.close':              'إغلاق',
  'editor.format':             'تنسيق',
  'ai.title':                  'مساعد الذكاء الاصطناعي',
  'ai.placeholder':            'اسألني بالعربية أو الإنجليزية…',
  'ai.send':                   'إرسال',
  'ai.stop':                   'إيقاف',
  'ai.clear':                  'مسح',
  'ai.thinking':               'جارٍ التفكير…',
  'ai.noModel':                'لا يوجد نموذج متاح',
  'ai.connecting':             'جارٍ الاتصال بـ Ollama…',
  'ai.lobe.cognitive':         'الفص المعرفي',
  'ai.lobe.executive':         'الفص التنفيذي',
  'ai.lobe.sensory':           'الفص الحسي',
  'terminal.title':            'الطرفية',
  'terminal.new':              'طرفية جديدة',
  'terminal.clear':            'مسح',
  'terminal.kill':             'إنهاء',
  'models.title':              'النماذج',
  'models.none':               'لا توجد نماذج',
  'models.pull':               'تنزيل نموذج',
  'models.delete':             'حذف',
  'models.active':             'النموذج الحالي',
  'settings.title':            'الإعدادات',
  'settings.language':         'اللغة',
  'settings.theme':            'المظهر',
  'settings.ollamaHost':       'عنوان Ollama',
  'settings.fontFamily':       'الخط',
  'settings.fontSize':         'حجم الخط',
  'action.ok':                 'موافق',
  'action.cancel':             'إلغاء',
  'action.confirm':            'تأكيد',
  'action.delete':             'حذف',
  'action.save':               'حفظ',
  'action.close':              'إغلاق',
  'file.new':                  'ملف جديد',
  'file.open':                 'فتح',
  'file.save':                 'حفظ',
  'file.rename':               'إعادة تسمية',
  'file.delete':               'حذف',
  'file.copy':                 'نسخ',
  'file.paste':                'لصق',
  'file.newFolder':            'مجلد جديد',
  'sovereignty.title':         'السيادة الرقمية',
  'sovereignty.score':         'نقاط السيادة',
  'sovereignty.local':         'محلي 100%',
  'sovereignty.telemetry':     'لا تتبع',
  'intent.title':              'تحليل النية',
  'intent.domain':             'المجال',
  'intent.dialect':            'اللهجة',
  'intent.confidence':         'الثقة',
  'intent.roots':              'الجذور',
};

// ── English ───────────────────────────────────────────────────────────
const EN: Translations = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               'Sovereign Development Environment',
  'app.version':               'Version',
  'status.connecting':         'Connecting…',
  'status.connected':          'Connected',
  'status.disconnected':       'Disconnected',
  'status.error':              'Connection Error',
  'sidebar.explorer':          'Explorer',
  'sidebar.search':            'Search',
  'sidebar.git':               'Git',
  'sidebar.extensions':        'Extensions',
  'sidebar.settings':          'Settings',
  'editor.untitled':           'Untitled',
  'editor.save':               'Save',
  'editor.saveAll':            'Save All',
  'editor.close':              'Close',
  'editor.format':             'Format',
  'ai.title':                  'AI Assistant',
  'ai.placeholder':            'Ask in Arabic or English…',
  'ai.send':                   'Send',
  'ai.stop':                   'Stop',
  'ai.clear':                  'Clear',
  'ai.thinking':               'Thinking…',
  'ai.noModel':                'No models available',
  'ai.connecting':             'Connecting to Ollama…',
  'ai.lobe.cognitive':         'Cognitive Lobe',
  'ai.lobe.executive':         'Executive Lobe',
  'ai.lobe.sensory':           'Sensory Lobe',
  'terminal.title':            'Terminal',
  'terminal.new':              'New Terminal',
  'terminal.clear':            'Clear',
  'terminal.kill':             'Kill',
  'models.title':              'Models',
  'models.none':               'No models',
  'models.pull':               'Pull Model',
  'models.delete':             'Delete',
  'models.active':             'Active Model',
  'settings.title':            'Settings',
  'settings.language':         'Language',
  'settings.theme':            'Theme',
  'settings.ollamaHost':       'Ollama Host',
  'settings.fontFamily':       'Font Family',
  'settings.fontSize':         'Font Size',
  'action.ok':                 'OK',
  'action.cancel':             'Cancel',
  'action.confirm':            'Confirm',
  'action.delete':             'Delete',
  'action.save':               'Save',
  'action.close':              'Close',
  'file.new':                  'New File',
  'file.open':                 'Open',
  'file.save':                 'Save',
  'file.rename':               'Rename',
  'file.delete':               'Delete',
  'file.copy':                 'Copy',
  'file.paste':                'Paste',
  'file.newFolder':            'New Folder',
  'sovereignty.title':         'Digital Sovereignty',
  'sovereignty.score':         'Sovereignty Score',
  'sovereignty.local':         '100% Local',
  'sovereignty.telemetry':     'Zero Telemetry',
  'intent.title':              'Intent Analysis',
  'intent.domain':             'Domain',
  'intent.dialect':            'Dialect',
  'intent.confidence':         'Confidence',
  'intent.roots':              'Roots',
};

// ── French (Français) ─────────────────────────────────────────────────
const FR: Partial<Translations> = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               'Environnement de Développement Souverain',
  'status.connecting':         'Connexion en cours…',
  'status.connected':          'Connecté',
  'status.disconnected':       'Déconnecté',
  'ai.title':                  'Assistant IA',
  'ai.placeholder':            'Posez une question…',
  'ai.thinking':               'Réflexion en cours…',
  'terminal.title':            'Terminal',
  'settings.title':            'Paramètres',
};

// ── Spanish (Español) ─────────────────────────────────────────────────
const ES: Partial<Translations> = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               'Entorno de Desarrollo Soberano',
  'status.connecting':         'Conectando…',
  'status.connected':          'Conectado',
  'status.disconnected':       'Desconectado',
  'ai.title':                  'Asistente IA',
  'ai.placeholder':            'Escribe tu pregunta…',
  'ai.thinking':               'Pensando…',
  'terminal.title':            'Terminal',
  'settings.title':            'Configuración',
};

// ── Japanese (日本語) ─────────────────────────────────────────────────
const JA: Partial<Translations> = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               'ソブリン開発環境',
  'status.connecting':         '接続中…',
  'status.connected':          '接続済み',
  'status.disconnected':       '切断',
  'ai.title':                  'AIアシスタント',
  'ai.placeholder':            '質問を入力してください…',
  'ai.thinking':               '考え中…',
  'terminal.title':            'ターミナル',
  'settings.title':            '設定',
};

// ── German (Deutsch) ──────────────────────────────────────────────────
const DE: Partial<Translations> = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               'Souveräne Entwicklungsumgebung',
  'status.connecting':         'Verbinden…',
  'status.connected':          'Verbunden',
  'status.disconnected':       'Getrennt',
  'ai.title':                  'KI-Assistent',
  'ai.placeholder':            'Frage eingeben…',
  'ai.thinking':               'Denke nach…',
  'terminal.title':            'Terminal',
  'settings.title':            'Einstellungen',
};

// ── Chinese (中文) ────────────────────────────────────────────────────
const ZH: Partial<Translations> = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               '主权开发环境',
  'status.connecting':         '连接中…',
  'status.connected':          '已连接',
  'status.disconnected':       '已断开',
  'ai.title':                  'AI助手',
  'ai.placeholder':            '输入您的问题…',
  'ai.thinking':               '思考中…',
  'terminal.title':            '终端',
  'settings.title':            '设置',
};

// ── Korean (한국어) ───────────────────────────────────────────────────
const KO: Partial<Translations> = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               '주권 개발 환경',
  'status.connecting':         '연결 중…',
  'status.connected':          '연결됨',
  'status.disconnected':       '연결 끊김',
  'ai.title':                  'AI 어시스턴트',
  'ai.placeholder':            '질문을 입력하세요…',
  'ai.thinking':               '생각 중…',
  'terminal.title':            '터미널',
  'settings.title':            '설정',
};

// ── Turkish (Türkçe) ──────────────────────────────────────────────────
const TR: Partial<Translations> = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               'Egemen Geliştirme Ortamı',
  'status.connecting':         'Bağlanıyor…',
  'status.connected':          'Bağlandı',
  'status.disconnected':       'Bağlantı Kesildi',
  'ai.title':                  'Yapay Zeka Asistanı',
  'ai.placeholder':            'Sorunuzu yazın…',
  'ai.thinking':               'Düşünüyor…',
  'terminal.title':            'Terminal',
  'settings.title':            'Ayarlar',
};

// ── Hindi (हिंदी) ─────────────────────────────────────────────────────
const HI: Partial<Translations> = {
  'app.name':                  'HAVEN IDE',
  'app.tagline':               'संप्रभु विकास परिवेश',
  'status.connecting':         'कनेक्ट हो रहा है…',
  'status.connected':          'कनेक्टेड',
  'status.disconnected':       'डिस्कनेक्टेड',
  'ai.title':                  'AI सहायक',
  'ai.placeholder':            'अपना प्रश्न लिखें…',
  'ai.thinking':               'सोच रहा है…',
  'terminal.title':            'टर्मिनल',
  'settings.title':            'सेटिंग्स',
};

// ── Translation Map ───────────────────────────────────────────────────
const TRANSLATIONS: Record<Language, Translations | Partial<Translations>> = {
  ar: AR,
  en: EN,
  fr: FR,
  es: ES,
  ja: JA,
  de: DE,
  zh: ZH,
  ko: KO,
  tr: TR,
  hi: HI,
};

// ═══════════════════════════════════════════════════════════════════════
// I18N ENGINE
// ═══════════════════════════════════════════════════════════════════════

class I18nEngine {
  private currentLanguage: Language = 'ar';
  private listeners: Set<(lang: Language) => void> = new Set();

  constructor() {
    // Auto-detect language from browser or localStorage
    const saved = localStorage.getItem('haven:language');
    if (saved && this.isValidLanguage(saved)) {
      this.currentLanguage = saved as Language;
    } else {
      const browser = navigator.language.slice(0, 2).toLowerCase();
      if (this.isValidLanguage(browser)) {
        this.currentLanguage = browser as Language;
      }
    }
  }

  private isValidLanguage(lang: string): lang is Language {
    return ['ar', 'en', 'fr', 'es', 'ja', 'de', 'zh', 'ko', 'tr', 'hi'].includes(lang);
  }

  get lang(): Language {
    return this.currentLanguage;
  }

  get isRTL(): boolean {
    return this.currentLanguage === 'ar';
  }

  get direction(): 'rtl' | 'ltr' {
    return this.isRTL ? 'rtl' : 'ltr';
  }

  setLanguage(lang: Language): void {
    this.currentLanguage = lang;
    localStorage.setItem('haven:language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = this.direction;
    this.listeners.forEach(cb => cb(lang));
  }

  onLanguageChange(cb: (lang: Language) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  t(key: TranslationKey, params?: Record<string, string>): string {
    const langTranslations = TRANSLATIONS[this.currentLanguage];
    let value = (langTranslations as Record<string, string>)[key] ?? EN[key] ?? key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
    }

    return value;
  }

  getSupportedLanguages(): { code: Language; name: string; nativeName: string }[] {
    return [
      { code: 'ar', name: 'Arabic',   nativeName: 'العربية' },
      { code: 'en', name: 'English',  nativeName: 'English' },
      { code: 'fr', name: 'French',   nativeName: 'Français' },
      { code: 'es', name: 'Spanish',  nativeName: 'Español' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'de', name: 'German',   nativeName: 'Deutsch' },
      { code: 'zh', name: 'Chinese',  nativeName: '中文' },
      { code: 'ko', name: 'Korean',   nativeName: '한국어' },
      { code: 'tr', name: 'Turkish',  nativeName: 'Türkçe' },
      { code: 'hi', name: 'Hindi',    nativeName: 'हिंदी' },
    ];
  }
}

// ── Singleton ─────────────────────────────────────────────────────────
export const i18n = new I18nEngine();

/** Shorthand for i18n.t() */
export const t = (key: TranslationKey, params?: Record<string, string>): string =>
  i18n.t(key, params);

export default i18n;
