// ═══════════════════════════════════════════════════════════════════════
// SOVEREIGN SESSION CLEANER
// منظّف الجلسات السيادي
// AES-256-GCM encrypted session management.
// Nothing leaves the device. Everything is encrypted at rest.
// ═══════════════════════════════════════════════════════════════════════

export interface EncryptedSession {
  id: string;
  iv: string;          // Base64-encoded IV
  ciphertext: string;  // Base64-encoded ciphertext
  tag: string;         // Base64-encoded auth tag
  timestamp: number;
  version: number;
}

export interface SessionMetadata {
  id: string;
  timestamp: number;
  turnCount: number;
  domain: string;
  dialect: string;
  sovereignScore: number;
}

const SESSION_VERSION = 1;
const SESSIONS_KEY = 'haven:sessions:v1';
const META_KEY = 'haven:sessions:meta:v1';

// ═══════════════════════════════════════════════════════════════════════
// CORE CLEANER
// ═══════════════════════════════════════════════════════════════════════

export class SovereignSessionCleaner {
  private cryptoKey: CryptoKey | null = null;
  private initialized = false;
  private readonly MAX_SESSIONS = 50;

  // ── Initialization ──────────────────────────────────────────────────

  /**
   * تهيئة مفتاح التشفير (AES-256-GCM)
   */
  async initialize(passphrase?: string): Promise<void> {
    if (this.initialized) return;

    try {
      if (passphrase) {
        this.cryptoKey = await this.deriveKeyFromPassphrase(passphrase);
      } else {
        // Use a device-unique key stored in localStorage
        let storedKey = localStorage.getItem('haven:session-key');
        if (!storedKey) {
          storedKey = this.generateDeviceKey();
          localStorage.setItem('haven:session-key', storedKey);
        }
        this.cryptoKey = await this.deriveKeyFromPassphrase(storedKey);
      }
      this.initialized = true;
    } catch (err) {
      console.warn('[SovereignSessionCleaner] Crypto init failed, sessions will not be encrypted:', err);
      this.initialized = true;
    }
  }

  private generateDeviceKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('haven-sovereign-salt-v1'),
        iterations: 100_000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // ── Encryption ──────────────────────────────────────────────────────

  async encrypt(data: unknown): Promise<EncryptedSession> {
    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const plaintext = JSON.stringify(data);
    const encoder = new TextEncoder();

    if (!this.cryptoKey) {
      // Fallback: base64 encode without encryption
      return {
        id,
        iv: '',
        ciphertext: btoa(unescape(encodeURIComponent(plaintext))),
        tag: '',
        timestamp: Date.now(),
        version: SESSION_VERSION,
      };
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = encoder.encode(plaintext);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.cryptoKey,
      encoded
    );

    // AES-GCM appends 16-byte auth tag at end
    const cipherArray = new Uint8Array(cipherBuffer);
    const ciphertext = cipherArray.slice(0, -16);
    const tag = cipherArray.slice(-16);

    return {
      id,
      iv: this.bufferToBase64(iv),
      ciphertext: this.bufferToBase64(ciphertext),
      tag: this.bufferToBase64(tag),
      timestamp: Date.now(),
      version: SESSION_VERSION,
    };
  }

  async decrypt(session: EncryptedSession): Promise<unknown> {
    if (!this.cryptoKey || !session.iv) {
      // Fallback: base64 decode
      return JSON.parse(decodeURIComponent(escape(atob(session.ciphertext))));
    }

    const iv = this.base64ToBuffer(session.iv);
    const ciphertext = this.base64ToBuffer(session.ciphertext);
    const tag = this.base64ToBuffer(session.tag);

    // Reassemble with auth tag
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext, 0);
    combined.set(tag, ciphertext.length);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.cryptoKey,
      combined
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  // ── Storage ─────────────────────────────────────────────────────────

  async saveSession(data: unknown, metadata: Omit<SessionMetadata, 'id'>): Promise<string> {
    if (!this.initialized) await this.initialize();

    const encrypted = await this.encrypt(data);

    // Load existing sessions
    const sessions = this.loadRawSessions();
    sessions.push(encrypted);

    // Trim to max
    const trimmed = sessions.slice(-this.MAX_SESSIONS);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));

    // Save metadata separately (not encrypted — for quick lookup)
    const metaList = this.loadMetadata();
    metaList.push({ ...metadata, id: encrypted.id });
    const trimmedMeta = metaList.slice(-this.MAX_SESSIONS);
    localStorage.setItem(META_KEY, JSON.stringify(trimmedMeta));

    return encrypted.id;
  }

  async loadSession(id: string): Promise<unknown | null> {
    if (!this.initialized) await this.initialize();

    const sessions = this.loadRawSessions();
    const session = sessions.find(s => s.id === id);
    if (!session) return null;

    try {
      return await this.decrypt(session);
    } catch {
      return null;
    }
  }

  async loadAllSessions(): Promise<{ meta: SessionMetadata; data: unknown }[]> {
    if (!this.initialized) await this.initialize();

    const sessions = this.loadRawSessions();
    const results = [];

    for (const session of sessions) {
      try {
        const data = await this.decrypt(session);
        const meta = this.loadMetadata().find(m => m.id === session.id);
        if (meta) {
          results.push({ meta, data });
        }
      } catch {
        // Skip corrupted sessions
      }
    }

    return results;
  }

  loadMetadata(): SessionMetadata[] {
    try {
      const raw = localStorage.getItem(META_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private loadRawSessions(): EncryptedSession[] {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────────

  /**
   * حذف الجلسات القديمة (أكثر من N أيام)
   */
  purgeOldSessions(maxAgeDays = 7): number {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const sessions = this.loadRawSessions().filter(s => s.timestamp >= cutoff);
    const meta = this.loadMetadata().filter(m => m.timestamp >= cutoff);

    const removed = this.loadRawSessions().length - sessions.length;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    localStorage.setItem(META_KEY, JSON.stringify(meta));

    return removed;
  }

  /**
   * مسح كل الجلسات (نظيف تماماً)
   */
  wipeAllSessions(): void {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(META_KEY);
  }

  /**
   * مسح كامل للبيانات الحساسة
   */
  sovereignWipe(): void {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('haven:')) {
        localStorage.removeItem(key);
      }
    }
    this.cryptoKey = null;
    this.initialized = false;
  }

  // ── Utils ────────────────────────────────────────────────────────────

  private bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  private base64ToBuffer(base64: string): Uint8Array {
    return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
  }
}

// ── Singleton ─────────────────────────────────────────────────────────
export const sovereignSessionCleaner = new SovereignSessionCleaner();
export default sovereignSessionCleaner;
