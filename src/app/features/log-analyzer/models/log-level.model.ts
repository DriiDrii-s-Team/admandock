export const LOG_LEVEL_VALUES = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'UNKNOWN'] as const;

export type LogLevel = (typeof LOG_LEVEL_VALUES)[number];

const LOG_LEVEL_LOOKUP: Record<string, LogLevel> = {
  trace: 'TRACE',
  trce: 'TRACE',
  debug: 'DEBUG',
  dbug: 'DEBUG',
  info: 'INFO',
  information: 'INFO',
  warn: 'WARN',
  warning: 'WARN',
  error: 'ERROR',
  fail: 'ERROR',
  fatal: 'FATAL',
  crit: 'FATAL',
  severe: 'FATAL',
  critical: 'FATAL'
};

export function normalizeLogLevel(value: string | null | undefined): LogLevel {
  if (!value) return 'UNKNOWN';
  const key = value.trim().toLowerCase();
  return LOG_LEVEL_LOOKUP[key] ?? 'UNKNOWN';
}
