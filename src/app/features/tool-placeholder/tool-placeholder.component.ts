import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="breadcrumbs"><a routerLink="/">Dashboard</a><span>/</span><span>{{ title }}</span></div>
    <div class="tool-page-heading"><div><div class="eyebrow">ADMANDOCK TOOL</div><h1>{{ title }}</h1><p>{{ description }}</p></div><span class="local-badge"><span class="status-dot"></span>Local processing</span></div>
    <div class="tool-workspace">
      <div class="editor-column">
        <div class="editor-toolbar"><strong>Input</strong><span>Paste or import your content</span></div>
        <textarea class="code-editor" placeholder="Paste your content here..." spellcheck="false"></textarea>
      </div>
      <div class="editor-column">
        <div class="editor-toolbar"><strong>Output</strong><span>Results will appear here</span></div>
        <div class="output-placeholder"><span class="placeholder-icon">⌘</span><strong>Ready when you are</strong><p>This tool's processing engine will be implemented in its development sprint.</p></div>
      </div>
    </div>
    <div class="notice"><strong>Development scaffold</strong><span>The page and navigation are wired up. This placeholder does not yet process or store input.</span></div>
  `
})
export class ToolPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = String(this.route.snapshot.data['title'] ?? 'Developer Tool');
  readonly description = String(this.route.snapshot.data['description'] ?? '');
}
