import { LogEntry, LogSourceFormat } from '../models/log-entry.model';
import { normalizeLogLevel } from '../models/log-level.model';
import { LogParser, LogParseResult } from '../models/log-parser.model';

const STACK_TRACE_RE = /^(?:\s*(?:at\s+|Caused by:|Suppressed:)|\s*\w+(?:\.\w+)+(?:\([^\)]*\))?\s*$|\s*\[\s*\w+.*\]|\s*---.*$)/i;

export class JavaLogParser implements LogParser {
  readonly format: LogSourceFormat = 'java';

  canParse(sample: string): boolean {
    return this.score(sample) > 0;
  }

  score(sample: string): number {
    const text = sample.trim();
    if (!text) return 0;
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    let score = 0;

    for (const line of lines.slice(0, 20)) {
      if (/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)/i.test(line)) {
        score += 1;
      }
      if (/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?\s+(?:TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+\d+\s+---/i.test(line)) {
        score += 5;
      }
      if (/--- \[[^\]]+\]/.test(line)) {
        score += 3;
      }
      if (/(?:Caused by:|Exception in thread|at\s+\w+\.|\bjava\.|\borg\.)/.test(line)) {
        score += 2;
      }
    }

    return score;
  }

  parse(content: string): LogParseResult {
    const lines = content.split(/\r?\n/);
    const entries: LogEntry[] = [];
    let current: Partial<LogEntry> | null = null;
    let errors: string[] = [];

    const finalizeCurrent = (): void => {
      if (!current) return;

      const entry: LogEntry = {
        id: `java-${entries.length + 1}-${Date.now()}`,
        timestamp: current.timestamp ?? null,
        level: current.level ?? 'UNKNOWN',
        logger: current.logger ?? null,
        thread: current.thread ?? null,
        message: current.message ?? '',
        exception: current.exception ?? null,
        stackTrace: current.stackTrace?.length ? current.stackTrace : null,
        sourceFormat: 'java',
        raw: current.raw ?? current.message ?? '',
        metadata: current.metadata ?? null
      };

      entries.push(entry);
      current = null;
    };

    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (!trimmed) {
        if (current && current.message) {
          current.message += '\n';
        }
        continue;
      }

      const match = trimmed.match(/^((?:\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?)|(?:\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?))\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+\d+\s+(?:---\s+\[[^\]]+\]\s+)?(?:([^\s:]+)\s*:\s*(.*)|([^\s:]+)\s*:\s*(.*))$/i);

      if (match) {
        finalizeCurrent();
        const rawTime = match[1];
        const level = normalizeLogLevel(match[2]);
        const logger = match[3] ?? null;
        const message = match[4] ?? match[5] ?? '';
        const threadMatch = trimmed.match(/---\s+\[([^\]]+)\]/);

        current = {
          timestamp: this.normalizeTimestamp(rawTime),
          level,
          logger: logger ?? null,
          thread: threadMatch ? threadMatch[1] : null,
          message: message.trim(),
          exception: null,
          stackTrace: [],
          raw: trimmed,
          metadata: { originalLine: trimmed }
        };
        continue;
      }

      if (!current) {
        if (trimmed.length > 0) {
          entries.push({
            id: `java-${entries.length + 1}-${Date.now()}`,
            timestamp: null,
            level: 'UNKNOWN',
            logger: null,
            thread: null,
            message: trimmed,
            exception: null,
            stackTrace: null,
            sourceFormat: 'java',
            raw: trimmed,
            metadata: { parseError: 'Unmatched Java log line' }
          });
        }
        continue;
      }

      if (STACK_TRACE_RE.test(trimmed)) {
        const stackTrace = current.stackTrace ?? [];
        stackTrace.push(trimmed);
        current.stackTrace = stackTrace;
        if (!current.exception && /(Exception|Error|Throwable)/.test(trimmed)) {
          current.exception = trimmed;
        }
        continue;
      }

      if (trimmed.startsWith('Caused by') || trimmed.startsWith('Suppressed:')) {
        const stackTrace = current.stackTrace ?? [];
        stackTrace.push(trimmed);
        current.stackTrace = stackTrace;
        continue;
      }

      current.message = [current.message ?? '', trimmed].filter(Boolean).join('\n');
    }

    finalizeCurrent();

    return {
      entries,
      errors,
      format: 'java',
      confidence: this.score(content) > 0 ? 0.88 : 0.2
    };
  }

  private normalizeTimestamp(raw: string): string | null {
    const candidate = raw.replace(' ', 'T');
    const value = new Date(candidate);
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
}
