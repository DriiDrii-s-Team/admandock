export type JsonChangeKind = 'added' | 'removed' | 'changed';

export interface JsonChange {
  kind: JsonChangeKind;
  path: string;
  before?: string;
  after?: string;
}

export type JsonDiffResult =
  | { valid: true; changes: JsonChange[] }
  | { valid: false; side: 'left' | 'right'; message: string };

export function diffJson(leftSource: string, rightSource: string): JsonDiffResult {
  let left: unknown;
  let right: unknown;

  try {
    left = JSON.parse(leftSource);
  } catch (error: unknown) {
    return { valid: false, side: 'left', message: errorMessage(error) };
  }

  try {
    right = JSON.parse(rightSource);
  } catch (error: unknown) {
    return { valid: false, side: 'right', message: errorMessage(error) };
  }

  const changes: JsonChange[] = [];
  collectChanges(left, right, '$', changes);
  return { valid: true, changes };
}

function collectChanges(left: unknown, right: unknown, path: string, changes: JsonChange[]): void {
  if (Object.is(left, right)) return;

  if (Array.isArray(left) && Array.isArray(right)) {
    const sharedLength = Math.min(left.length, right.length);
    for (let index = 0; index < sharedLength; index += 1) {
      collectChanges(left[index], right[index], `${path}[${index}]`, changes);
    }
    for (let index = sharedLength; index < left.length; index += 1) {
      changes.push({ kind: 'removed', path: `${path}[${index}]`, before: serialize(left[index]) });
    }
    for (let index = sharedLength; index < right.length; index += 1) {
      changes.push({ kind: 'added', path: `${path}[${index}]`, after: serialize(right[index]) });
    }
    return;
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = new Set(Object.keys(right));

    for (const key of leftKeys) {
      const childPath = `${path}[${JSON.stringify(key)}]`;
      if (!Object.hasOwn(right, key)) {
        changes.push({ kind: 'removed', path: childPath, before: serialize(left[key]) });
      } else {
        collectChanges(left[key], right[key], childPath, changes);
      }
    }

    for (const key of rightKeys) {
      if (!Object.hasOwn(left, key)) {
        changes.push({ kind: 'added', path: `${path}[${JSON.stringify(key)}]`, after: serialize(right[key]) });
      }
    }
    return;
  }

  changes.push({ kind: 'changed', path, before: serialize(left), after: serialize(right) });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function serialize(value: unknown): string {
  return JSON.stringify(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid JSON';
}
