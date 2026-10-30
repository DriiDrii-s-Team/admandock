import { LogEntry, LogSourceFormat } from '../models/log-entry.model';
import { normalizeLogLevel } from '../models/log-level.model';
import { LogParser, LogParseResult } from '../models/log-parser.model';

export class DotnetLogParser implements LogParser {
  readonly format: LogSourceFormat = 'dotnet';

  canParse(sample: string): boolean {
    return this.score(sample) > 0;
  }

  score(sample: string): number {
    const text = sample.trim();
    if (!text) return 0;

    let score = 0;
    for (const line of text.split(/\r?\n/).slice(0, 20)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,7})?\s*(trce|trace|dbug|debug|info|warn|warning|fail|error|crit|fatal)\s*:/i.test(trimmed)) {
        score += 4;
      }
      if (/(?:trce|trace|dbug|debug|info|warn|warning|fail|error|crit|fatal):\s*.*\[[0-9]+\]/i.test(trimmed)) {
        score += 2;
      }
      if (/\b(?:Microsoft\.|System\.|MyApp\.|Application)\b/.test(trimmed)) {
        score += 1;
      }
      if (/\b(?:trce|trace|dbug|debug|info|warn|warning|fail|error|crit|fatal)\b/i.test(trimmed)) {
        score += 1;
      }
      if (/\b[A-Za-z0-9_.-]+\[[0-9]+\]/.test(trimmed)) {
        score += 2;
      }
    }

    return score;
  }

  parse(content: string): LogParseResult {
    const lines = content.split(/\r?\n/);
    const entries: LogEntry[] = [];
    let current: Partial<LogEntry> | null = null;

    const finalizeCurrent = (): void => {
      if (!current) return;
      entries.push({
        id: `dotnet-${entries.length + 1}-${Date.now()}`,
        timestamp: current.timestamp ?? null,
        level: current.level ?? 'UNKNOWN',
        logger: current.logger ?? null,
        thread: current.thread ?? null,
        message: current.message ?? '',
        exception: current.exception ?? null,
        stackTrace: current.stackTrace?.length ? current.stackTrace : null,
        sourceFormat: 'dotnet',
        raw: current.raw ?? current.message ?? '',
        metadata: current.metadata ?? null
      });
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

      const match = trimmed.match(/^((?:\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,7})?))\s*(trce|trace|dbug|debug|info|warn|warning|fail|error|crit|fatal)\s*:\s*([^\[]+)(?:\[(\d+)\])?\s*(.*)$/i);
      const structuredMatch = trimmed.match(/^((?:\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,7})?))\s*(trce|trace|dbug|debug|info|warn|warning|fail|error|crit|fatal)\s*:\s*([A-Za-z0-9_.-]+)\[(\d+)\]\s*(.*)$/i);

      if (match || structuredMatch) {
        finalizeCurrent();
        const normalized = match ?? structuredMatch;
        const timestamp = this.normalizeTimestamp(normalized![1]);
        const level = normalizeLogLevel(normalized![2]);
        const logger = (normalized![3] ?? '').trim() || null;
        const eventId = normalized![4] ?? null;
        const message = (normalized![5] ?? '').trim();

        current = {
          timestamp,
          level,
          logger,
          thread: eventId,
          message,
          exception: null,
          stackTrace: [],
          raw: trimmed,
          metadata: { eventId }
        };
        continue;
      }

      if (!current) {
        entries.push({
          id: `dotnet-${entries.length + 1}-${Date.now()}`,
          timestamp: null,
          level: 'UNKNOWN',
          logger: null,
          thread: null,
          message: trimmed,
          exception: null,
          stackTrace: null,
          sourceFormat: 'dotnet',
          raw: trimmed,
          metadata: { parseError: 'Unmatched .NET log line' }
        });
        continue;
      }

      if (/^\s*(?:at\s+|System\.|Microsoft\.|--->\s+|--- End of inner exception stack trace ---|Exception:|Stack Trace:)/.test(trimmed)) {
        const stackTrace = current.stackTrace ?? [];
        stackTrace.push(trimmed);
        current.stackTrace = stackTrace;
        if (!current.exception && /(Exception|Error|Throwable)/.test(trimmed)) {
          current.exception = trimmed;
        }
        continue;
      }

      current.message = [current.message ?? '', trimmed.trim()].filter(Boolean).join('\n');
    }

    finalizeCurrent();

    return {
      entries,
      errors: [],
      format: 'dotnet',
      confidence: this.score(content) > 0 ? 0.86 : 0.2
    };
  }

  private normalizeTimestamp(raw: string): string | null {
    const value = new Date(raw.replace(' ', 'T'));
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
}
