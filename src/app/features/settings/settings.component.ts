import { Component, inject } from '@angular/core';
import { PreferencesService, ThemePreference, Language } from '../../core/services/preferences.service';

@Component({
  standalone: true,
  template: `
    <div class="eyebrow">PREFERENCES</div><h1>Settings</h1><p class="page-intro">Customize your DebugDock workspace.</p>
    <section class="settings-card"><h2>Appearance</h2><p>Choose how DebugDock looks on this device.</p>
      <div class="setting-row"><div><strong>Theme</strong><small>System follows your operating system preference.</small></div>
        <select [value]="preferences.theme()" (change)="setTheme($event)"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select>
      </div>
      <div class="setting-row"><div><strong>Language</strong><small>Interface language.</small></div>
        <select [value]="preferences.language()" (change)="setLanguage($event)"><option value="en">English</option><option value="fr">Français</option></select>
      </div>
    </section>
    <section class="settings-card"><h2>Privacy</h2><p>Tool inputs are processed locally in your browser. This scaffold does not upload content.</p><div class="privacy-note"><span class="status-dot"></span> Local-first processing enabled</div></section>
  `
})
export class SettingsComponent {
  readonly preferences = inject(PreferencesService);
  setTheme(event: Event): void { this.preferences.setTheme((event.target as HTMLSelectElement).value as ThemePreference); }
  setLanguage(event: Event): void { this.preferences.setLanguage((event.target as HTMLSelectElement).value as Language); }
}
