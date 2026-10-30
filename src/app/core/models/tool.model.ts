export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  category: 'data' | 'diff' | 'debug' | 'security' | 'developer';
  icon: string;
  status: 'available' | 'coming-soon';
}
