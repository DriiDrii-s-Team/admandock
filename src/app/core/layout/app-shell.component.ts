import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PreferencesService } from '../services/preferences.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'dd-app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/">
          <span class="brand-mark">⌘</span>
          <span><strong>AdManDock</strong><small>Developer workspace</small></span>
        </a>
        <div class="side-label">{{ i18n.t('workspace') }}</div>
        <nav>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><span>▦</span>{{ i18n.t('dashboard') }}</a>
          <a routerLink="/workspace" routerLinkActive="active"><span>▤</span>{{ i18n.t('workspace') }}</a>
        </nav>
        <div class="side-label">{{ i18n.t('dataTools') }}</div>
        <nav>
          <a routerLink="/data/json" routerLinkActive="active"><span>&#123; &#125;</span>JSON Explorer</a>
          <a routerLink="/data/yaml" routerLinkActive="active"><span>Y</span>YAML Tools</a>
          <a routerLink="/data/xml" routerLinkActive="active"><span>&lt;/&gt;</span>XML Tools</a>
        </nav>
        <div class="side-label">{{ i18n.t('debugging') }}</div>
        <nav>
          <a routerLink="/diff/json" routerLinkActive="active"><span>±</span>JSON Diff</a>
          <a routerLink="/diff/text" routerLinkActive="active"><span>≠</span>Text Diff</a>
          <a routerLink="/logs" routerLinkActive="active"><span>⌁</span>Log Analyzer</a>
        </nav>
        <div class="side-label">{{ i18n.t('security') }}</div>
        <nav>
          <a routerLink="/security/sanitize" routerLinkActive="active"><span>◈</span>Secret Sanitizer</a>
          <a routerLink="/security/jwt" routerLinkActive="active"><span>⌑</span>JWT Decoder</a>
        </nav>
        <div class="side-spacer"></div>
        <nav><a routerLink="/settings" routerLinkActive="active"><span>⚙</span>{{ i18n.t('settings') }}</a></nav>
        <div class="sidebar-foot"><span class="status-dot"></span> {{ i18n.t('local') }} <span class="version">v0.1.0</span></div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="mobile-brand"><span class="brand-mark">⌘</span><strong>AdManDock</strong></div>
          <div class="top-spacer"></div>
          <span class="privacy-pill"><span class="status-dot"></span>{{ i18n.t('local') }}</span>
          <button class="icon-button" aria-label="Toggle theme" (click)="toggleTheme()">◐</button>
          <button class="language-button" (click)="toggleLanguage()">{{ preferences.language() === 'en' ? 'FR' : 'EN' }}</button>
        </header>
        <section class="page-content"><ng-content /></section>
        <footer class="app-footer"><span>AdManDock · Free developer tools</span><span>Built for developers, with privacy in mind.</span></footer>
      </main>
    </div>
  `
})
export class AppShellComponent {
  readonly preferences = inject(PreferencesService);
  readonly i18n = inject(I18nService);
  toggleTheme(): void { this.preferences.setTheme(this.preferences.theme() === 'dark' ? 'light' : 'dark'); }
  toggleLanguage(): void { this.preferences.setLanguage(this.preferences.language() === 'en' ? 'fr' : 'en'); }
}
