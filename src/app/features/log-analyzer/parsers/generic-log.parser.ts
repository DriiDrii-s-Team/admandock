import { LogEntry, LogSourceFormat } from '../models/log-entry.model';
import { LogLevel, normalizeLogLevel } from '../models/log-level.model';
import { LogParser, LogParseResult } from '../models/log-parser.model';

export class GenericLogParser implements LogParser {
  readonly format: LogSourceFormat = 'generic';

  canParse(): boolean {
    return true;
  }

  score(sample: string): number {
    const lines = sample.split(/\r?\n/).filter(line => line.trim()).slice(0, 20);
    return lines.reduce((score, line) => {
      const hasTimestamp = this.extractRawTimestamp(line) !== null;
      const hasExplicitLevel = this.hasLeadingLevel(line);
      return score + (hasTimestamp && hasExplicitLevel ? 2 : hasExplicitLevel ? 1 : 0);
    }, sample.trim() ? 1 : 0);
  }

  parse(content: string): LogParseResult {
    const entries: LogEntry[] = [];
    const lines = content.split(/\r?\n/);

    for (const [index, rawLine] of lines.entries()) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      const previousEntry = entries[entries.length - 1];
      if (previousEntry && this.isExceptionContinuation(trimmed)) {
        previousEntry.exception ??= trimmed;
        previousEntry.stackTrace = [...(previousEntry.stackTrace ?? []), trimmed];
        previousEntry.raw += `\n${rawLine}`;
        continue;
      }

      const rawTimestamp = this.extractRawTimestamp(trimmed);
      const timestamp = this.normalizeTimestamp(rawTimestamp);
      const level = this.extractLevel(trimmed);
      const withoutTimestampAndLevel = this.removeTimestampAndLevel(trimmed, rawTimestamp, level);
      const loggerMatch = withoutTimestampAndLevel.match(/^\[([^\]]+)\]\s*/);
      const message = loggerMatch
        ? withoutTimestampAndLevel.slice(loggerMatch[0].length).trim()
        : withoutTimestampAndLevel;

      entries.push({
        id: `generic-${index + 1}-${Date.now()}`,
        timestamp,
        level,
        logger: loggerMatch?.[1] ?? null,
        thread: null,
        message: message || trimmed,
        exception: null,
        stackTrace: null,
        sourceFormat: 'generic',
        raw: rawLine,
        metadata: { originalLine: rawLine }
      });
    }

    return {
      entries,
      errors: [],
      format: 'generic',
      confidence: 0.52
    };
  }

  private extractRawTimestamp(value: string): string | null {
    const match = value.match(/^\s*\[?(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})?)\]?/i);
    return match?.[1] ?? null;
  }

  private normalizeTimestamp(raw: string | null): string | null {
    if (!raw) return null;
    const candidate = raw.replace(' ', 'T').replace(',', '.');
    const date = new Date(candidate);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private extractLevel(value: string): LogLevel {
    const explicitLevel = value.match(/^\s*\[?\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})?\]?\s+(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b/i)
      ?? value.match(/^\s*(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b/i);
    if (explicitLevel) return normalizeLogLevel(explicitLevel[1]);

    const status = value.match(/"\s+([1-5]\d{2})\s+\d+(?:\s|$)/);
    if (status) {
      const statusCode = Number(status[1]);
      if (statusCode >= 500) return 'ERROR';
      if (statusCode >= 400) return 'WARN';
      if (statusCode >= 200) return 'INFO';
    }

    return 'UNKNOWN';
  }

  private removeTimestampAndLevel(value: string, timestamp: string | null, level: LogLevel): string {
    let absolute = timestamp
      ? value.replace(timestamp, '')
      : value;
    absolute = absolute.replace(/^\s*\[\s*\]\s*/, '').replace(/^\s*[\[\]]\s*/, '');
    if (level !== 'UNKNOWN') {
      absolute = absolute.replace(new RegExp(`^\\s*${level}\\b`, 'i'), '');
    }
    return absolute.replace(/^[\s:;\-|>]+|[\s:;\-|>]+$/g, '').trim();
  }

  private hasLeadingLevel(value: string): boolean {
    return /^\s*(?:\[\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}|\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})?(?:[.,]\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})?\]?\s*(?:TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b/i.test(value);
  }

  private isExceptionContinuation(value: string): boolean {
    return /^(?:Caused by:|Suppressed:|--->\s+|--- End of inner exception stack trace ---|\s*at\s+|System\.[A-Za-z0-9_.]+Exception\b)/i.test(value);
  }
}
