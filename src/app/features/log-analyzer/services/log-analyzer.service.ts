import { Injectable } from '@angular/core';
import { LogAnalysisSummary, LogEntry, LogFilterState, LogSourceFormat } from '../models/log-entry.model';
import { LogParser } from '../models/log-parser.model';
import { DotnetLogParser } from '../parsers/dotnet-log.parser';
import { GenericLogParser } from '../parsers/generic-log.parser';
import { JavaLogParser } from '../parsers/java-log.parser';
import { JsonLogParser } from '../parsers/json-log.parser';

@Injectable({ providedIn: 'root' })
export class LogAnalyzerService {
  private readonly parsers: LogParser[] = [
    new JsonLogParser(),
    new JavaLogParser(),
    new DotnetLogParser(),
    new GenericLogParser()
  ];

  detectFormat(sample: string): { format: LogSourceFormat; confidence: number } {
    const text = sample.trim();
    if (!text) return { format: 'unknown', confidence: 0 };

    const scored = this.parsers
      .map(parser => ({ parser, score: parser.score(sample) }))
      .sort((left, right) => right.score - left.score);

    const winner = scored[0];
    if (!winner) return { format: 'unknown', confidence: 0 };
    return {
      format: winner.parser.format,
      confidence: Math.min(0.99, Math.max(0.1, winner.score / 10))
    };
  }

  parseLogs(content: string): LogAnalysisSummary {
    const sample = content ?? '';
    if (!sample.trim()) {
      return {
        format: 'unknown',
        confidence: 0,
        entries: [],
        errors: ['No log input available.']
      };
    }

    const best = this.parsers
      .map(parser => ({ parser, score: parser.score(sample) }))
      .sort((left, right) => right.score - left.score)[0];

    const parser = best?.parser ?? new GenericLogParser();
    const result = parser.parse(sample);

    return {
      format: result.format,
      confidence: result.confidence,
      entries: result.entries,
      errors: result.errors
    };
  }

  filterEntries(entries: LogEntry[], filters: Partial<LogFilterState>): LogEntry[] {
    const normalized: LogFilterState = {
      level: filters.level ?? 'ALL',
      search: (filters.search ?? '').trim().toLowerCase(),
      logger: (filters.logger ?? '').trim().toLowerCase(),
      exception: (filters.exception ?? '').trim().toLowerCase(),
      from: filters.from ?? '',
      to: filters.to ?? ''
    };

    return entries.filter(entry => {
      const matchesLevel = normalized.level === 'ALL' || entry.level === normalized.level;
      const matchesSearch = !normalized.search || [entry.message, entry.logger ?? '', entry.exception ?? '', entry.raw].join(' ').toLowerCase().includes(normalized.search);
      const matchesLogger = !normalized.logger || (entry.logger ?? '').toLowerCase().includes(normalized.logger);
      const matchesException = !normalized.exception || (entry.exception ?? '').toLowerCase().includes(normalized.exception);
      const matchesFrom = !normalized.from || !entry.timestamp || entry.timestamp >= normalized.from;
      const matchesTo = !normalized.to || !entry.timestamp || entry.timestamp <= normalized.to;
      return matchesLevel && matchesSearch && matchesLogger && matchesException && matchesFrom && matchesTo;
    });
  }

  summarize(entries: LogEntry[]): Record<string, number> {
    const stats = {
      total: entries.length,
      info: 0,
      debug: 0,
      warn: 0,
      error: 0,
      fatal: 0,
      unknown: 0
    };

    for (const entry of entries) {
      switch (entry.level) {
        case 'INFO':
          stats.info += 1;
          break;
        case 'DEBUG':
          stats.debug += 1;
          break;
        case 'WARN':
          stats.warn += 1;
          break;
        case 'ERROR':
          stats.error += 1;
          break;
        case 'FATAL':
          stats.fatal += 1;
          break;
        default:
          stats.unknown += 1;
      }
    }

    return stats;
  }
}
