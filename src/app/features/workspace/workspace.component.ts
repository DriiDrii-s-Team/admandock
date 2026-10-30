import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div class="eyebrow">YOUR SPACE</div><h1>Workspace</h1><p class="page-intro">Your favorites and recent tools will live here.</p>
    <section class="settings-card empty-workspace"><div class="empty-icon">▤</div><h2>Your workspace is ready</h2><p>Favorites and recent activity will be added in the workspace sprint. No tool input is stored automatically.</p></section>
  `
})
export class WorkspaceComponent {}
