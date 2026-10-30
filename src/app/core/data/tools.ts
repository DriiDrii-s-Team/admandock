import { ToolDefinition } from '../models/tool.model';

export const TOOLS: ToolDefinition[] = [
  { id: 'json', title: 'JSON Explorer', description: 'Format, validate and inspect JSON.', route: '/data/json', category: 'data', icon: '{ }', status: 'available' },
  { id: 'yaml', title: 'YAML Tools', description: 'Format and validate YAML documents.', route: '/data/yaml', category: 'data', icon: 'Y', status: 'coming-soon' },
  { id: 'xml', title: 'XML Tools', description: 'Format and inspect XML.', route: '/data/xml', category: 'data', icon: '</>', status: 'coming-soon' },
  { id: 'json-diff', title: 'JSON Diff', description: 'Find structural differences between JSON documents.', route: '/diff/json', category: 'diff', icon: '±', status: 'coming-soon' },
  { id: 'text-diff', title: 'Text Diff', description: 'Compare two text documents.', route: '/diff/text', category: 'diff', icon: '≠', status: 'coming-soon' },
  { id: 'logs', title: 'Log Analyzer', description: 'Explore logs, exceptions and stack traces.', route: '/logs', category: 'debug', icon: '⌁', status: 'coming-soon' },
  { id: 'sanitize', title: 'Secret Sanitizer', description: 'Detect and redact sensitive values.', route: '/security/sanitize', category: 'security', icon: '◈', status: 'coming-soon' },
  { id: 'jwt', title: 'JWT Decoder', description: 'Inspect JWT headers and payloads locally.', route: '/security/jwt', category: 'security', icon: '⌑', status: 'coming-soon' },
  { id: 'regex', title: 'Regex Tester', description: 'Test patterns and inspect matches.', route: '/dev/regex', category: 'developer', icon: '.*', status: 'coming-soon' },
  { id: 'timestamp', title: 'Timestamp Converter', description: 'Convert Unix timestamps and dates.', route: '/dev/timestamp', category: 'developer', icon: '◷', status: 'coming-soon' }
];
