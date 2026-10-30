import { LogEntry, LogSourceFormat } from '../models/log-entry.model';
import { normalizeLogLevel } from '../models/log-level.model';
import { LogParser, LogParseResult } from '../models/log-parser.model';

export class JsonLogParser implements LogParser {
  readonly format: LogSourceFormat = 'json';

  canParse(sample: string): boolean {
    return this.score(sample) > 0;
  }

  score(sample: string): number {
    const text = sample.trim();
    if (!text) return 0;
    let score = 0;

    if (text.startsWith('{') || text.startsWith('[')) score += 3;
    const candidate = text.slice(0, 2000);
    for (const key of ['timestamp', 'time', '@timestamp', 'level', 'severity', 'logLevel', 'message', 'msg', 'logger', 'category', 'source', 'exception', 'error']) {
      if (candidate.toLowerCase().includes(key.toLowerCase())) {
        score += 1;
      }
    }
    if (/"(?:timestamp|time|@timestamp|level|severity|logLevel|message|msg|logger|category|source|exception|error)"\s*:/i.test(candidate)) {
      score += 2;
    }
    if (/^\s*(?:\{.*\}|\[.*\])\s*$/.test(text) || /^\s*(?:\{.*\}|\[.*\])\s*(?:\r?\n\s*(?:\{.*\}|\[.*\]))+\s*$/.test(text)) {
      score += 2;
    }
    return score;
  }

  parse(content: string): LogParseResult {
    const entries: LogEntry[] = [];
    const errors: string[] = [];
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    let parsedCount = 0;

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        const entry = this.extractEntry(json);
        if (entry) {
          entries.push(entry);
          parsedCount += 1;
        }
      } catch {
        if (lines.length > 1) {
          continue;
        }
        errors.push('Unable to parse JSON log payload');
      }
    }

    if (!entries.length && content.trim().startsWith('{')) {
      try {
        const json = JSON.parse(content);
        const entry = this.extractEntry(json);
        if (entry) entries.push(entry);
      } catch {
        errors.push('Unable to parse JSON document');
      }
    }

    return {
      entries,
      errors,
      format: 'json',
      confidence: parsedCount > 0 ? 0.9 : 0.3
    };
  }

  private extractEntry(raw: unknown): LogEntry | null {
    if (!raw || typeof raw !== 'object') return null;
    const value = raw as Record<string, unknown>;
    const timestamp = this.readTimestamp(value);
    const level = normalizeLogLevel(this.readText(value, ['level', 'severity', 'logLevel']));
    const logger = this.readText(value, ['logger', 'category', 'source', 'SourceContext']) ?? null;
    const message = this.readText(value, ['message', 'msg']) ?? this.readText(value, ['exception', 'error']) ?? 'JSON log event';
    const exception = this.readText(value, ['exception', 'Exception', 'error']);
    const stackTrace = this.readStackTrace(value);

    return {
      id: `json-${Math.random().toString(36).slice(2, 10)}`,
      timestamp,
      level,
      logger,
      thread: typeof value['thread'] === 'string' ? value['thread'] : null,
      message,
      exception: exception ?? null,
      stackTrace: stackTrace?.length ? stackTrace : null,
      sourceFormat: 'json',
      raw: JSON.stringify(raw),
      metadata: {
        original: raw
      }
    };
  }

  private readText(record: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const actualKey = Object.keys(record).find(candidate => candidate.toLowerCase() === key.toLowerCase());
      if (!actualKey) continue;
      const val = record[actualKey];
      if (typeof val === 'string' && val.trim()) return val.trim();
      if (val && typeof val === 'object' && 'message' in (val as Record<string, unknown>)) {
        const nested = (val as Record<string, unknown>)['message'];
        if (typeof nested === 'string' && nested.trim()) return nested.trim();
      }
    }
    return null;
  }

  private readTimestamp(record: Record<string, unknown>): string | null {
    const raw = this.readText(record, ['timestamp', 'time', '@timestamp']);
    if (!raw) return null;
    const value = new Date(raw);
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  private readStackTrace(record: Record<string, unknown>): string[] | null {
    const raw = record['stackTrace'] ?? record['stack_trace'];
    if (Array.isArray(raw)) {
      return raw.filter((item): item is string => typeof item === 'string');
    }
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    }
    return null;
  }
}
