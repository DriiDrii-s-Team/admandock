import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TOOLS } from '../../core/data/tools';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="welcome-row">
      <div><div class="eyebrow">ADMANDOCK / WORKSPACE</div><h1>{{ i18n.t('welcome') }}</h1><p>{{ i18n.t('subtitle') }}</p></div>
      <div class="local-badge"><span class="status-dot"></span>{{ i18n.t('local') }}</div>
    </div>
    <div class="privacy-banner">
      <div class="privacy-icon">◈</div>
      <div><strong>{{ i18n.t('privacyTitle') }}</strong><p>{{ i18n.t('privacyText') }}</p></div>
    </div>
    <div class="section-heading"><div><h2>{{ i18n.t('quickAccess') }}</h2><p>Pick up where your debugging starts.</p></div><span class="count">10 TOOLS</span></div>
    <div class="tool-grid">
      @for (tool of tools; track tool.id) {
        <a class="tool-card" [routerLink]="tool.route">
          <div class="tool-card-top"><span class="tool-icon">{{ tool.icon }}</span><span class="tool-arrow">↗</span></div>
          <h3>{{ tool.title }}</h3><p>{{ tool.description }}</p>
          <div class="tool-card-bottom"><span [class.ready]="tool.status === 'available'">{{ tool.status === 'available' ? 'Available' : i18n.t('comingSoon') }}</span><span>→</span></div>
        </a>
      }
    </div>
    <div class="bottom-grid">
      <div class="panel"><div class="panel-title"><h3>Getting started</h3><span>01 / 03</span></div><p>Choose a tool from the workspace and paste or import your technical data. Processing happens locally in your browser.</p><a routerLink="/data/json" class="text-link">Try JSON Explorer →</a></div>
      <div class="panel"><div class="panel-title"><h3>Privacy by design</h3><span class="secure-label">LOCAL FIRST</span></div><p>Your input is not sent to AdManDock servers. Avoid saving credentials or production secrets in browser storage.</p><a routerLink="/settings" class="text-link">Manage preferences →</a></div>
    </div>
  `
})
export class DashboardComponent {
  readonly i18n = inject(I18nService);
  readonly tools = TOOLS;
}
