import { describe, expect, it } from 'vitest';
import { diffJson } from './json-diff-processor';

describe('diffJson', () => {
  it('finds nested additions, removals and changed values', () => {
    const result = diffJson(
      '{"user":{"name":"Ada","active":true},"obsolete":1}',
      '{"user":{"name":"Grace","active":true},"enabled":false}'
    );

    expect(result).toEqual({
      valid: true,
      changes: [
        { kind: 'changed', path: '$["user"]["name"]', before: '"Ada"', after: '"Grace"' },
        { kind: 'removed', path: '$["obsolete"]', before: '1' },
        { kind: 'added', path: '$["enabled"]', after: 'false' }
      ]
    });
  });

  it('compares array items by index and reports added or removed items', () => {
    const result = diffJson('[1,2,3]', '[1,4]');

    expect(result).toEqual({
      valid: true,
      changes: [
        { kind: 'changed', path: '$[1]', before: '2', after: '4' },
        { kind: 'removed', path: '$[2]', before: '3' }
      ]
    });
  });

  it('treats object key order as irrelevant', () => {
    expect(diffJson('{"a":1,"b":2}', '{"b":2,"a":1}')).toEqual({ valid: true, changes: [] });
  });

  it('compares primitive roots and distinguishes null from an object', () => {
    expect(diffJson('null', 'true')).toEqual({
      valid: true,
      changes: [{ kind: 'changed', path: '$', before: 'null', after: 'true' }]
    });
  });

  it('returns a parse error for the invalid side', () => {
    expect(diffJson('{"valid":true}', '{')).toMatchObject({
      valid: false,
      side: 'right'
    });
  });
});
