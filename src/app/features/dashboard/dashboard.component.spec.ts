import { describe, expect, it } from 'vitest';
import { TOOLS } from '../../core/data/tools';

describe('DebugDock tool catalog', () => {
  it('exposes unique tool identifiers and routes', () => {
    expect(new Set(TOOLS.map(tool => tool.id)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map(tool => tool.route)).size).toBe(TOOLS.length);
  });

  it('contains the initial core tool categories', () => {
    expect(TOOLS.some(tool => tool.id === 'json')).toBe(true);
    expect(TOOLS.some(tool => tool.id === 'logs')).toBe(true);
    expect(TOOLS.some(tool => tool.id === 'sanitize')).toBe(true);
  });
});
