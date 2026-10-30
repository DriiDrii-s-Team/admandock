import { LogLevel } from './log-level.model';

export type LogSourceFormat = 'java' | 'dotnet' | 'json' | 'generic' | 'unknown';

export interface LogEntry {
  id: string;
  timestamp: string | null;
  level: LogLevel;
  logger: string | null;
  thread: string | null;
  message: string;
  exception: string | null;
  stackTrace: string[] | null;
  sourceFormat: LogSourceFormat;
  raw: string;
  metadata?: Record<string, unknown> | null;
}

export interface LogAnalysisSummary {
  format: LogSourceFormat;
  confidence: number;
  entries: LogEntry[];
  errors: string[];
}

export interface LogFilterState {
  level: LogLevel | 'ALL';
  search: string;
  logger: string;
  exception: string;
  from: string;
  to: string;
}
