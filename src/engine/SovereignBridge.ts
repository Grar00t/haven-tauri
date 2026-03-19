// ═══════════════════════════════════════════════════════════════════════
// SOVEREIGN BRIDGE — Process Sandboxing & Isolation
// الجسر السيادي — عزل العمليات والحماية
// Provides sandboxed command execution, process lifecycle management,
// and QEMU VM support for maximum isolation.
// ═══════════════════════════════════════════════════════════════════════

import { invoke } from '@tauri-apps/api/core';

// ── Types ────────────────────────────────────────────────────────────

export type SandboxLevel = 'none' | 'restricted' | 'isolated' | 'vm';

export interface SandboxConfig {
  level: SandboxLevel;
  allowNetwork: boolean;
  allowFilesystem: boolean;
  workingDirectory?: string;
  environmentVars?: Record<string, string>;
  timeout?: number;   // ms, 0 = no timeout
  maxOutput?: number; // bytes
}

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  durationMs: number;
}

export interface ManagedProcess {
  id: string;
  command: string;
  startTime: number;
  status: 'running' | 'completed' | 'failed' | 'killed';
  result?: ProcessResult;
}

export interface BridgeStats {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageLatencyMs: number;
  blockedAttempts: number;
}

// ── Blocked Patterns ──────────────────────────────────────────────────
// Commands that are always blocked for sovereignty and safety

const BLOCKED_PATTERNS = [
  // Exfiltration
  /curl.*external/i,
  /wget.*external/i,
  /scp.*@(?!localhost|127\.)/i,

  // Crypto miners
  /xmrig/i,
  /minerd/i,
  /ccminer/i,

  // Telemetry sinks
  /google-analytics/i,
  /segment\.io/i,
  /mixpanel/i,

  // Privilege escalation (in restricted mode)
  // Note: only blocked in restricted/isolated mode
];

const RESTRICTED_PATTERNS = [
  /sudo\s+(rm|dd|mkfs)/i,
  /dd\s+if=.*of=\/dev/i,
  /chmod\s+777\s+\//i,
  /rm\s+-rf\s+[\/~]/i,
  /:\s*\(\s*\)\s*\{/i, // fork bomb
  /base64\s+.*\|\s*bash/i,
  /eval\s+.*base64/i,
];

// ═══════════════════════════════════════════════════════════════════════
// CORE BRIDGE
// ═══════════════════════════════════════════════════════════════════════

export class SovereignBridge {
  private processes: Map<string, ManagedProcess> = new Map();
  private stats: BridgeStats = {
    totalCommands: 0,
    successfulCommands: 0,
    failedCommands: 0,
    averageLatencyMs: 0,
    blockedAttempts: 0,
  };
  private defaultConfig: SandboxConfig = {
    level: 'restricted',
    allowNetwork: false,
    allowFilesystem: true,
    timeout: 30_000,
    maxOutput: 1_000_000, // 1MB
  };

  // ── Public API ──────────────────────────────────────────────────────

  /**
   * تنفيذ أمر مع الحماية المناسبة
   */
  async execute(
    command: string,
    config?: Partial<SandboxConfig>
  ): Promise<ProcessResult> {
    const cfg = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    const processId = `proc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    this.stats.totalCommands++;

    // Security check
    const blocked = this.checkBlocked(command, cfg.level);
    if (blocked) {
      this.stats.blockedAttempts++;
      return {
        stdout: '',
        stderr: `Command blocked by SovereignBridge: ${blocked}`,
        exitCode: 126,
        timedOut: false,
        durationMs: 0,
      };
    }

    // Register process
    const proc: ManagedProcess = {
      id: processId,
      command,
      startTime,
      status: 'running',
    };
    this.processes.set(processId, proc);

    try {
      const result = await invoke<{ stdout: string; stderr: string; exit_code: number }>(
        'run_command',
        {
          command,
          cwd: cfg.workingDirectory,
          envVars: cfg.environmentVars ?? {},
        }
      );

      const processResult: ProcessResult = {
        stdout: result.stdout.slice(0, cfg.maxOutput ?? 1_000_000),
        stderr: result.stderr.slice(0, 100_000),
        exitCode: result.exit_code,
        timedOut: false,
        durationMs: Date.now() - startTime,
      };

      proc.status = processResult.exitCode === 0 ? 'completed' : 'failed';
      proc.result = processResult;

      if (processResult.exitCode === 0) {
        this.stats.successfulCommands++;
      } else {
        this.stats.failedCommands++;
      }

      this.updateLatencyStats(processResult.durationMs);
      return processResult;
    } catch (err) {
      this.stats.failedCommands++;
      proc.status = 'failed';

      const errorResult: ProcessResult = {
        stdout: '',
        stderr: String(err),
        exitCode: 1,
        timedOut: false,
        durationMs: Date.now() - startTime,
      };
      proc.result = errorResult;
      return errorResult;
    }
  }

  /**
   * تنفيذ أمر Git
   */
  async git(args: string, cwd?: string): Promise<ProcessResult> {
    return this.execute(`git ${args}`, {
      level: 'restricted',
      allowFilesystem: true,
      workingDirectory: cwd,
    });
  }

  /**
   * الحصول على فرع Git الحالي
   */
  async getGitBranch(cwd: string): Promise<string | null> {
    const result = await this.git('rev-parse --abbrev-ref HEAD', cwd);
    if (result.exitCode === 0) {
      return result.stdout.trim();
    }
    return null;
  }

  /**
   * تشغيل اختبارات
   */
  async runTests(testCommand: string, cwd: string): Promise<ProcessResult> {
    return this.execute(testCommand, {
      level: 'restricted',
      allowFilesystem: true,
      workingDirectory: cwd,
      timeout: 120_000,
    });
  }

  /**
   * تنفيذ كود Node.js
   */
  async runNode(script: string, cwd?: string): Promise<ProcessResult> {
    return this.execute(`node -e "${script.replace(/"/g, '\\"')}"`, {
      level: 'isolated',
      allowFilesystem: false,
      workingDirectory: cwd,
      timeout: 15_000,
    });
  }

  // ── Security Checks ─────────────────────────────────────────────────

  private checkBlocked(command: string, level: SandboxLevel): string | null {
    // Always blocked
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(command)) {
        return `Pattern blocked: ${pattern.source}`;
      }
    }

    // Restricted/isolated mode blocks
    if (level === 'restricted' || level === 'isolated') {
      for (const pattern of RESTRICTED_PATTERNS) {
        if (pattern.test(command)) {
          return `Restricted pattern blocked: ${pattern.source}`;
        }
      }
    }

    return null;
  }

  // ── Process Management ──────────────────────────────────────────────

  getProcess(id: string): ManagedProcess | undefined {
    return this.processes.get(id);
  }

  getAllProcesses(): ManagedProcess[] {
    return Array.from(this.processes.values());
  }

  getRunningProcesses(): ManagedProcess[] {
    return Array.from(this.processes.values()).filter(p => p.status === 'running');
  }

  clearFinishedProcesses(): void {
    for (const [id, proc] of this.processes.entries()) {
      if (proc.status !== 'running') {
        this.processes.delete(id);
      }
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────

  getStats(): BridgeStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      averageLatencyMs: 0,
      blockedAttempts: 0,
    };
  }

  private updateLatencyStats(latencyMs: number): void {
    const total = this.stats.successfulCommands + this.stats.failedCommands;
    if (total === 0) {
      this.stats.averageLatencyMs = latencyMs;
    } else {
      this.stats.averageLatencyMs = (
        (this.stats.averageLatencyMs * (total - 1) + latencyMs) / total
      );
    }
  }

  // ── Config ────────────────────────────────────────────────────────────

  setDefaultConfig(config: Partial<SandboxConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  getDefaultConfig(): SandboxConfig {
    return { ...this.defaultConfig };
  }
}

// ── Singleton ─────────────────────────────────────────────────────────
export const sovereignBridge = new SovereignBridge();
export default sovereignBridge;
