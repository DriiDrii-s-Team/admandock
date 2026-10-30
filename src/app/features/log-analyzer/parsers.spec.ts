import { describe, expect, it } from 'vitest';
import { normalizeLogLevel } from './models/log-level.model';
import { DotnetLogParser } from './parsers/dotnet-log.parser';
import { GenericLogParser } from './parsers/generic-log.parser';
import { JavaLogParser } from './parsers/java-log.parser';
import { JsonLogParser } from './parsers/json-log.parser';

describe('log parsers', () => {
  it('normalizes known aliases and safely handles missing or unknown levels', () => {
    expect(normalizeLogLevel(null)).toBe('UNKNOWN');
    expect(normalizeLogLevel('  DBug ')).toBe('DEBUG');
    expect(normalizeLogLevel('critical')).toBe('FATAL');
    expect(normalizeLogLevel('not-a-level')).toBe('UNKNOWN');
  });

  describe('JsonLogParser', () => {
    const parser = new JsonLogParser();

    it('scores JSON samples and rejects empty or unrelated input', () => {
      expect(parser.canParse('')).toBe(false);
      expect(parser.score('plain text')).toBe(0);
      expect(parser.canParse('[{"message":"ready"}]')).toBe(true);
    });

    it('extracts nested messages, aliases, timestamps, exceptions, and stack traces', () => {
      const result = parser.parse(JSON.stringify({
        time: '2026-10-30T14:32:12.000Z',
        severity: 'Warning',
        source: 'worker',
        message: { message: 'Nested message' },
        Exception: 'WorkerException',
        stack_trace: ' at first()\n\n at second()',
        thread: 'worker-1'
      }));

      expect(result.entries[0]).toMatchObject({
        timestamp: '2026-10-30T14:32:12.000Z',
        level: 'WARN',
        logger: 'worker',
        message: 'Nested message',
        exception: 'WorkerException',
        stackTrace: ['at first()', 'at second()'],
        thread: 'worker-1'
      });
    });

    it('skips malformed lines in multi-line input and reports invalid single documents', () => {
      const mixed = parser.parse('not json\n{"message":"Recovered"}');
      expect(mixed.entries).toHaveLength(1);
      expect(mixed.errors).toEqual([]);

      const invalid = parser.parse('{');
      expect(invalid.entries).toEqual([]);
      expect(invalid.errors).toEqual([
        'Unable to parse JSON log payload',
        'Unable to parse JSON document'
      ]);
      expect(parser.parse('42').confidence).toBe(0.3);
    });
  });

  describe('JavaLogParser', () => {
    const parser = new JavaLogParser();

    it('scores empty and unrelated samples without claiming a match', () => {
      expect(parser.canParse('')).toBe(false);
      expect(parser.score('plain text')).toBe(0);
    });

    it('preserves unmatched lines and classifies stack traces and message continuations', () => {
      const result = parser.parse(`startup text
2026-10-30 14:32:12.123 ERROR 42 --- [worker-1] app.Worker : Failed

continuation
java.lang.IllegalStateException: broken
 at app.Worker.run(Worker.java:10)
Suppressed: cleanup failed`);

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].metadata).toEqual({ parseError: 'Unmatched Java log line' });
      expect(result.entries[1]).toMatchObject({
        thread: 'worker-1',
        message: 'Failed\n\ncontinuation\njava.lang.IllegalStateException: broken',
        exception: null
      });
      expect(result.entries[1].stackTrace).toEqual([
        ' at app.Worker.run(Worker.java:10)',
        'Suppressed: cleanup failed'
      ]);
      expect(parser.parse('').entries).toEqual([]);
    });

    it('returns a null timestamp for invalid dates that match the Java log shape', () => {
      const result = parser.parse('2026-99-99 14:32:12 INFO 42 app.Worker : message');
      expect(result.entries[0].timestamp).toBeNull();
    });
  });

  describe('DotnetLogParser', () => {
    const parser = new DotnetLogParser();

    it('scores empty input and recognizes common .NET level and category patterns', () => {
      expect(parser.canParse('')).toBe(false);
      expect(parser.score('plain text')).toBe(0);
      expect(parser.score('2026-10-30T14:32:12Z warn: Microsoft.Hosting[12]')).toBeGreaterThan(0);
    });

    it('keeps unmatched lines, continuations, and event metadata', () => {
      const result = parser.parse(`unmatched line
2026-10-30 14:32:12 info: MyApp.Worker[42] Started
continued details
 ---> System.InvalidOperationException: failure
 at MyApp.Worker.Run()`);

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].metadata).toEqual({ parseError: 'Unmatched .NET log line' });
      expect(result.entries[1]).toMatchObject({
        logger: 'MyApp.Worker',
        thread: '42',
        message: 'Started\ncontinued details',
        exception: ' ---> System.InvalidOperationException: failure',
        stackTrace: [
          ' ---> System.InvalidOperationException: failure',
          ' at MyApp.Worker.Run()'
        ]
      });
    });

    it('parses unstructured category logs and handles invalid timestamps', () => {
      const result = parser.parse('2026-99-99T14:32:12 fail: Payment service failed');
      expect(result.entries[0]).toMatchObject({
        timestamp: null,
        level: 'ERROR',
        logger: 'Payment service failed'
      });
      expect(parser.parse('').entries).toEqual([]);
    });
  });

  describe('GenericLogParser', () => {
    const parser = new GenericLogParser();

    it('scores timestamps and explicit levels, but leaves unrelated lines unknown', () => {
      expect(parser.canParse()).toBe(true);
      expect(parser.score('')).toBe(0);
      expect(parser.score('INFO started')).toBe(2);
      expect(parser.score('plain text')).toBe(1);
    });

    it('infers HTTP status levels, normalizes timestamps, and appends exception continuations', () => {
      const result = parser.parse(`192.0.2.1 - - [30/Oct/2026:10:14:20 +0000] "GET / HTTP/1.1" 503 12
192.0.2.1 - - [30/Oct/2026:10:14:21 +0000] "GET / HTTP/1.1" 404 12
192.0.2.1 - - [30/Oct/2026:10:14:22 +0000] "GET / HTTP/1.1" 200 12
[2026-10-30T14:32:12,000Z] INFO [worker] ready
Caused by: downstream failure
2026-99-99T14:32:12Z INFO invalid date`);

      expect(result.entries.map(entry => entry.level)).toEqual([
        'ERROR', 'WARN', 'INFO', 'INFO', 'INFO'
      ]);
      expect(result.entries[3]).toMatchObject({
        timestamp: '2026-10-30T14:32:12.000Z',
        logger: 'worker',
        message: 'ready',
        exception: 'Caused by: downstream failure'
      });
      expect(result.entries[3].stackTrace).toEqual(['Caused by: downstream failure']);
      expect(result.entries[4].timestamp).toBeNull();
    });
  });
});
