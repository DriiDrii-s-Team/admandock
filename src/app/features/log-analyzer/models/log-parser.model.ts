import { LogEntry, LogSourceFormat } from './log-entry.model';

export interface LogParseResult {
  entries: LogEntry[];
  errors: string[];
  format: LogSourceFormat;
  confidence: number;
}

export interface LogParser {
  readonly format: LogSourceFormat;
  canParse(sample: string): boolean;
  score(sample: string): number;
  parse(content: string): LogParseResult;
}
