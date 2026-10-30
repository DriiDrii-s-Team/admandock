import { describe, expect, it } from 'vitest';
import { LogAnalyzerService } from './services/log-analyzer.service';

describe('LogAnalyzerService', () => {
  it('detects Java log format and parses a Spring-style entry', () => {
    const service = new LogAnalyzerService();
    const sample = `2026-10-30 14:32:12.123 INFO 12345 --- [http-nio-8080-exec-1] com.example.UserService : User authenticated`;
    const result = service.parseLogs(sample);

    expect(result.format).toBe('java');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].level).toBe('INFO');
    expect(result.entries[0].logger).toBe('com.example.UserService');
    expect(result.entries[0].message).toBe('User authenticated');
  });

  it('detects .NET log format and keeps the category name', () => {
    const service = new LogAnalyzerService();
    const sample = `2026-10-30 14:32:12.1234 info: MyApp.Services.UserService[1001]
User authenticated successfully`;
    const result = service.parseLogs(sample);

    expect(result.format).toBe('dotnet');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].logger).toBe('MyApp.Services.UserService');
    expect(result.entries[0].level).toBe('INFO');
  });

  it('parses .NET console short levels and nested exception stack traces', () => {
    const service = new LogAnalyzerService();
    const sample = `2026-10-30 14:32:12.1234 info: AdManDock.Api.Services.AuthService[1001]
      User authenticated successfully
2026-10-30 14:32:13.0040 dbug: AdManDock.Api.Repositories.UserRepository[2001]
      Fetching user record id=42
2026-10-30 14:32:13.1180 warn: AdManDock.Api.Services.UserService[3002]
      User profile is missing optional displayName
2026-10-30 14:32:14.2210 fail: AdManDock.Api.Services.PaymentService[5007]
      Payment processing failed
System.InvalidOperationException: Payment provider returned an unexpected response
 ---> System.TimeoutException: The operation timed out.
   at AdManDock.Api.Gateways.PaymentGateway.SendAsync() in C:\\src\\PaymentGateway.cs:line 129
   --- End of inner exception stack trace ---
   at AdManDock.Api.Services.PaymentService.ChargeAsync() in C:\\src\\PaymentService.cs:line 84`;
    const result = service.parseLogs(sample);

    expect(result.format).toBe('dotnet');
    expect(result.entries).toHaveLength(4);
    expect(result.entries.map(entry => entry.level)).toEqual(['INFO', 'DEBUG', 'WARN', 'ERROR']);
    expect(result.entries.map(entry => entry.logger)).toEqual([
      'AdManDock.Api.Services.AuthService',
      'AdManDock.Api.Repositories.UserRepository',
      'AdManDock.Api.Services.UserService',
      'AdManDock.Api.Services.PaymentService'
    ]);
    expect(result.entries[0].message).toBe('User authenticated successfully');
    expect(result.entries[1].message).toBe('Fetching user record id=42');
    expect(result.entries[3].exception).toBe('System.InvalidOperationException: Payment provider returned an unexpected response');
    expect(result.entries[3].stackTrace).toContain(' ---> System.TimeoutException: The operation timed out.');
    expect(result.entries[3].stackTrace).toContain('   at AdManDock.Api.Services.PaymentService.ChargeAsync() in C:\\src\\PaymentService.cs:line 84');
  });

  it('parses NDJSON log events', () => {
    const service = new LogAnalyzerService();
    const sample = JSON.stringify({ timestamp: '2026-10-30T14:32:12.123Z', level: 'ERROR', message: 'Failed to save user', logger: 'app.api' }) + '\n' + JSON.stringify({ timestamp: '2026-10-30T14:32:13.456Z', level: 'INFO', message: 'Recovered', logger: 'app.api' });
    const result = service.parseLogs(sample);

    expect(result.format).toBe('json');
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].level).toBe('ERROR');
    expect(result.entries[1].level).toBe('INFO');
  });

  it('parses Serilog NDJSON fields and named log levels', () => {
    const service = new LogAnalyzerService();
    const sample = `{"@timestamp":"2026-10-30T14:32:12.123Z","level":"Information","message":"User authenticated successfully","SourceContext":"AdManDock.Api.AuthService"}
{"@timestamp":"2026-10-30T14:32:13.004Z","level":"Debug","message":"Fetching user record","SourceContext":"AdManDock.Api.UserRepository"}
{"@timestamp":"2026-10-30T14:32:13.118Z","level":"Warning","message":"Profile is missing optional displayName","SourceContext":"AdManDock.Api.UserService"}
{"@timestamp":"2026-10-30T14:32:14.221Z","level":"Error","message":"Payment processing failed","SourceContext":"AdManDock.Api.PaymentService","Exception":"System.TimeoutException: The operation timed out."}
{"@timestamp":"2026-10-30T14:32:15.009Z","level":"Fatal","message":"Application shutting down","SourceContext":"AdManDock.Api.Hosting"}`;
    const result = service.parseLogs(sample);

    expect(result.format).toBe('json');
    expect(result.entries).toHaveLength(5);
    expect(result.entries.map(entry => entry.level)).toEqual([
      'INFO', 'DEBUG', 'WARN', 'ERROR', 'FATAL'
    ]);
    expect(result.entries.map(entry => entry.logger)).toEqual([
      'AdManDock.Api.AuthService',
      'AdManDock.Api.UserRepository',
      'AdManDock.Api.UserService',
      'AdManDock.Api.PaymentService',
      'AdManDock.Api.Hosting'
    ]);
    expect(result.entries[0].timestamp).toBe('2026-10-30T14:32:12.123Z');
    expect(result.entries[3].exception).toBe('System.TimeoutException: The operation timed out.');
  });

  it('parses ISO timestamped logs and infers levels from HTTP status codes', () => {
    const service = new LogAnalyzerService();
    const sample = `2026-10-30T10:14:05.123Z INFO [com.monapp.auth.LoginService] User 'alice' logged in successfully from IP 192.168.1.45 (duration: 124ms)
2026-10-30T10:14:12.890Z WARN [com.monapp.db.PoolManager] High connection pool usage: 85% capacity reached (active: 85, max: 100)
192.168.1.12 - - [30/Oct/2026:10:14:20 +0000] "GET /api/v1/users/42 HTTP/1.1" 200 512 "https://example.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
2026-10-30T10:15:01.004Z ERROR [com.monapp.payment.StripeClient] Timeout connecting to payment gateway (endpoint: /v1/charges, retries: 3)
10.0.0.55 - admin [30/Oct/2026:10:15:45 +0000] "POST /api/v1/orders HTTP/1.1" 500 128 "-" "curl/7.68.0"
2026-10-30T10:16:00.111Z DEBUG [com.monapp.cache.RedisCache] Cache miss for key 'user_session_9912' (latency: 2ms)`;

    const result = service.parseLogs(sample);

    expect(result.format).toBe('generic');
    expect(result.entries.map(entry => entry.level)).toEqual([
      'INFO', 'WARN', 'INFO', 'ERROR', 'ERROR', 'DEBUG'
    ]);
    expect(result.entries[0].logger).toBe('com.monapp.auth.LoginService');
    expect(result.entries[0].timestamp).toBe('2026-10-30T10:14:05.123Z');
    expect(result.entries[0].message).toContain("User 'alice' logged in successfully");
    expect(service.summarize(result.entries)).toMatchObject({
      debug: 1,
      unknown: 0
    });
  });

  it('parses bracketed timestamps, undated level prefixes, and exception continuations', () => {
    const service = new LogAnalyzerService();
    const sample = `[2026-10-30T14:32:12.123Z] INFO Starting background worker
2026-10-30 14:32:13 WARN Retry attempt 1/3 for endpoint /api/orders
Connection pool is almost exhausted (active=48, max=50)
2026-10-30T14:32:14.221Z ERROR Could not process message msg-7781
Caused by: downstream service unavailable
DEBUG Cache miss for key customer:42
2026-10-30 14:32:16 FATAL Worker stopped unexpectedly`;
    const result = service.parseLogs(sample);

    expect(result.format).toBe('generic');
    expect(result.entries.map(entry => entry.level)).toEqual([
      'INFO', 'WARN', 'UNKNOWN', 'ERROR', 'DEBUG', 'FATAL'
    ]);
    expect(result.entries[0].timestamp).toBe('2026-10-30T14:32:12.123Z');
    expect(result.entries[0].message).toBe('Starting background worker');
    expect(result.entries[2].message).toBe('Connection pool is almost exhausted (active=48, max=50)');
    expect(result.entries[3].exception).toBe('Caused by: downstream service unavailable');
    expect(result.entries[3].stackTrace).toContain('Caused by: downstream service unavailable');
    expect(result.entries[4].message).toBe('Cache miss for key customer:42');
    expect(result.entries[5].message).toBe('Worker stopped unexpectedly');
  });

  it('applies filters and summaries', () => {
    const service = new LogAnalyzerService();
    const entries = [
      { id: '1', timestamp: '2026-10-30T14:32:11.000Z', level: 'INFO', logger: 'app.user', thread: null, message: 'User signed in', exception: null, stackTrace: null, sourceFormat: 'generic', raw: 'User signed in', metadata: null },
      { id: '2', timestamp: '2026-10-30T15:00:00.000Z', level: 'WARN', logger: 'app.cache', thread: null, message: 'Cache warm-up', exception: 'CacheException', stackTrace: null, sourceFormat: 'generic', raw: 'Cache warm-up', metadata: null },
      { id: '3', timestamp: '2026-10-30T15:30:00.000Z', level: 'ERROR', logger: 'app.api', thread: null, message: 'Request failed', exception: 'NullPointerException', stackTrace: ['at ...'], sourceFormat: 'generic', raw: 'Request failed', metadata: null }
    ] as any;

    const filtered = service.filterEntries(entries, { level: 'ERROR', search: 'failed', logger: 'api', exception: 'NullPointer', from: '', to: '' });
    expect(filtered).toHaveLength(1);
    expect(service.summarize(entries)).toMatchObject({ total: 3, info: 1, warn: 1, error: 1 });
  });

  it('handles empty input and detects formats with normalized confidence', () => {
    const service = new LogAnalyzerService();

    expect(service.detectFormat('  ')).toEqual({ format: 'unknown', confidence: 0 });
    expect(service.parseLogs(' \n')).toEqual({
      format: 'unknown',
      confidence: 0,
      entries: [],
      errors: ['No log input available.']
    });
    expect(service.detectFormat('INFO Worker started').format).toBe('generic');
  });

  it('uses optional filters and timestamp bounds while summarizing every level', () => {
    const service = new LogAnalyzerService();
    const { entries } = service.parseLogs(`TRACE trace
DEBUG debug
INFO info
WARN warn
ERROR error
FATAL fatal
An unclassified message`);

    expect(service.summarize(entries)).toEqual({
      total: 7,
      info: 1,
      debug: 1,
      warn: 1,
      error: 1,
      fatal: 1,
      unknown: 2
    });
    expect(service.filterEntries(entries, {})).toHaveLength(7);
    expect(service.filterEntries(entries, { from: '2026-10-30' })).toHaveLength(7);
    expect(service.filterEntries(entries, { to: '2026-10-30' })).toHaveLength(7);
    expect(service.filterEntries(entries, { search: '  TRACE  ' })).toHaveLength(1);
    expect(service.filterEntries(entries, { logger: 'missing', exception: 'missing' })).toHaveLength(0);
  });
});
