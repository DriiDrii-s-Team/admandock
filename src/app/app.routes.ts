import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Dashboard · DebugDock' },
  { path: 'data/json', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'json', title: 'JSON Explorer', description: 'Format, validate, inspect and minify JSON.' } },
  { path: 'data/yaml', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'yaml', title: 'YAML Tools', description: 'Format and validate YAML documents.' } },
  { path: 'data/xml', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'xml', title: 'XML Tools', description: 'Format and inspect XML documents.' } },
  { path: 'diff/json', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'json-diff', title: 'JSON Diff', description: 'Compare two JSON documents structurally.' } },
  { path: 'diff/text', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'text-diff', title: 'Text Diff', description: 'Compare text files line by line.' } },
  { path: 'logs', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'logs', title: 'Log Analyzer', description: 'Inspect application logs and stack traces.' } },
  { path: 'security/sanitize', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'sanitize', title: 'Secret Sanitizer', description: 'Find and redact sensitive values locally.' } },
  { path: 'security/jwt', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'jwt', title: 'JWT Decoder', description: 'Decode token headers and claims locally.' } },
  { path: 'dev/regex', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'regex', title: 'Regex Tester', description: 'Test regular expressions against sample text.' } },
  { path: 'dev/timestamp', loadComponent: () => import('./features/tool-placeholder/tool-placeholder.component').then(m => m.ToolPlaceholderComponent), data: { toolId: 'timestamp', title: 'Timestamp Converter', description: 'Convert Unix timestamps and date formats.' } },
  { path: 'workspace', loadComponent: () => import('./features/workspace/workspace.component').then(m => m.WorkspaceComponent), title: 'Workspace · DebugDock' },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), title: 'Settings · DebugDock' },
  { path: '**', redirectTo: '' }
];
