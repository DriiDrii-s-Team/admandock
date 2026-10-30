import { describe, expect, it } from 'vitest';
import { inspectJson } from './json-processor';

describe('inspectJson', () => {
  it('formats and minifies valid JSON values', () => {
    expect(inspectJson('{"name":"AdManDock","enabled":true}')).toEqual({
      valid: true,
      formatted: '{\n  "name": "AdManDock",\n  "enabled": true\n}',
      minified: '{"name":"AdManDock","enabled":true}'
    });
  });

  it('accepts JSON primitives and null', () => {
    expect(inspectJson('null')).toEqual({ valid: true, formatted: 'null', minified: 'null' });
    expect(inspectJson('42')).toEqual({ valid: true, formatted: '42', minified: '42' });
  });

  it('reports invalid JSON and its line and column when available', () => {
    const result = inspectJson('{\n  "name": "AdManDock",\n  }');

    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.message).toBeTruthy();
    expect(result.line).not.toBeNull();
    expect(result.column).not.toBeNull();
  });

  it('rejects empty input', () => {
    const result = inspectJson('');

    expect(result.valid).toBe(false);
  });
});
