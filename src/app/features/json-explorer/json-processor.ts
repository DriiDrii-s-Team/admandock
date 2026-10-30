export type JsonInspection =
  | { valid: true; formatted: string; minified: string }
  | { valid: false; message: string; line: number | null; column: number | null };

export function inspectJson(source: string): JsonInspection {
  try {
    const value: unknown = JSON.parse(source);
    return {
      valid: true,
      formatted: JSON.stringify(value, null, 2),
      minified: JSON.stringify(value)
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    const location = parseErrorLocation(message, source);
    return { valid: false, message, ...location };
  }
}

function parseErrorLocation(message: string, source: string): { line: number | null; column: number | null } {
  const explicitLocation = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (explicitLocation) {
    return { line: Number(explicitLocation[1]), column: Number(explicitLocation[2]) };
  }

  const position = message.match(/position\s+(\d+)/i);
  if (!position) return { line: null, column: null };

  const offset = Number(position[1]);
  const precedingText = source.slice(0, offset);
  const line = precedingText.split('\n').length;
  const column = offset - precedingText.lastIndexOf('\n');
  return { line, column };
}
